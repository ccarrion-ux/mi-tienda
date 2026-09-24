import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const body = await req.json();
    const customer = body.customer || {};
    const items: any[] = Array.isArray(body.items) ? body.items : [];
    const shippingMethodId = body.shippingMethodId ? String(body.shippingMethodId) : null;
    const paymentMethod = String(body.paymentMethod || "TRANSFER");

    if (!customer.name || !customer.email || !customer.address || !customer.commune || !customer.region) {
      return NextResponse.json({ error: "Completa todos los datos obligatorios." }, { status: 400 });
    }
    if (!items.length) return NextResponse.json({ error: "El carrito está vacío." }, { status: 400 });
    if (!["TRANSFER", "FLOW", "WEBPAY", "MERCADOPAGO", "TEST"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Método de pago no válido." }, { status: 400 });
    }

    const store = await prisma.store.findUnique({ where: { slug, status: "ACTIVE" } });
    if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

    const paymentConfig = await prisma.paymentMethodConfig.findUnique({
      where: { storeId_provider: { storeId: store.id, provider: paymentMethod as any } }
    });
    const paymentEnabled = paymentConfig?.enabled ?? paymentMethod === "TRANSFER";
    if (!paymentEnabled) return NextResponse.json({ error: "El método de pago seleccionado no está habilitado." }, { status: 400 });

    const shipping = shippingMethodId
      ? await prisma.shippingMethod.findFirst({
          where: { id: shippingMethodId, storeId: store.id, active: true }
        })
      : null;

    if (shippingMethodId && !shipping) {
      return NextResponse.json({ error: "El método de despacho seleccionado no está disponible." }, { status: 400 });
    }

    const productIds = [...new Set(items.map((i: any) => String(i.productId)))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, storeId: store.id, active: true },
      include: { variants: true }
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    const validated = items.map((item: any) => {
      const product = productMap.get(String(item.productId));
      if (!product) throw new Error(`Producto no disponible: ${item.name || item.productId}`);

      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error("Cantidad inválida.");

      let unitPrice = Number(product.price);
      if (item.variantId) {
        const variant = product.variants.find(v => v.id === item.variantId);
        if (!variant) throw new Error(`Variante no disponible: ${item.variantName || ""}`);
        if (variant.stock < quantity) throw new Error(`Stock insuficiente para ${product.name}.`);
        if (variant.price !== null) unitPrice = Number(variant.price);
      } else if (product.stock < quantity) {
        throw new Error(`Stock insuficiente para ${product.name}.`);
      }

      return { product, variantId: item.variantId || null, quantity, unitPrice };
    });

    const subtotal = validated.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const shippingCost = shipping ? Number(shipping.price) : 0;
    const total = subtotal + shippingCost;

    const order = await prisma.$transaction(async tx => {
      let existing = await tx.customer.findFirst({
        where: { storeId: store.id, email: String(customer.email).trim().toLowerCase() }
      });

      if (existing) {
        existing = await tx.customer.update({
          where: { id: existing.id },
          data: { name: String(customer.name).trim(), phone: customer.phone || null }
        });
      } else {
        existing = await tx.customer.create({
          data: {
            storeId: store.id,
            name: String(customer.name).trim(),
            email: String(customer.email).trim().toLowerCase(),
            phone: customer.phone || null
          }
        });
      }

      const created = await tx.order.create({
        data: {
          storeId: store.id,
          customerId: existing.id,
          subtotal,
          shippingCost,
          total,
          shippingMethodId: shipping?.id || null,
          shippingAddress: String(customer.address).trim(),
          shippingCommune: String(customer.commune).trim(),
          shippingRegion: String(customer.region).trim(),
          status: paymentMethod === "TEST" ? "PAID" : "PENDING",
          items: {
            create: validated.map(i => ({
              productId: i.product.id,
              variantId: i.variantId,
              quantity: i.quantity,
              unitPrice: i.unitPrice
            }))
          },
          payment: {
            create: {
              provider: paymentMethod as "TRANSFER" | "FLOW" | "WEBPAY" | "MERCADOPAGO" | "TEST",
              status: paymentMethod === "TEST" ? "PAID" : "PENDING",
              amount: total
            }
          }
        },
        include: { payment: true }
      });

      for (const item of validated) {
        if (item.variantId) {
          const changed = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } }
          });
          if (changed.count !== 1) throw new Error(`Stock insuficiente para ${item.product.name}.`);
        } else {
          const changed = await tx.product.updateMany({
            where: { id: item.product.id, storeId: store.id, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } }
          });
          if (changed.count !== 1) throw new Error(`Stock insuficiente para ${item.product.name}.`);
        }

        await tx.inventoryMovement.create({
          data: {
            storeId: store.id,
            productId: item.product.id,
            type: "OUT",
            quantity: item.quantity,
            note: `Pedido #${created.number}`
          }
        });
      }

      return created;
    });

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        number: order.number,
        paymentProvider: order.payment?.provider,
        paymentStatus: order.payment?.status,
        checkoutUrl: null
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "No fue posible crear el pedido."
    }, { status: 400 });
  }
}
