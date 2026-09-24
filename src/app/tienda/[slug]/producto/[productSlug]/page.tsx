import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductBuy from "./product-buy";

export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;

  const store = await prisma.store.findUnique({ where: { slug, status: "ACTIVE" } });
  if (!store) notFound();

  const product = await prisma.product.findFirst({
    where: { storeId: store.id, slug: productSlug, active: true },
    include: { category: true, variants: true }
  });

  if (!product) notFound();

  return (
    <main>
      <div className="container" style={{ padding: "30px 0" }}>
        <a href={`/tienda/${store.slug}`} style={{ textDecoration: "underline" }}>← Volver a la tienda</a>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 50, marginTop: 30 }}>
          <div>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} style={{ width: "100%", borderRadius: 16 }} />
            ) : (
              <div style={{ aspectRatio: "1", background: "#eef0f3", borderRadius: 16, display: "grid", placeItems: "center", color: "#6b7280" }}>Sin imagen</div>
            )}
          </div>
          <div>
            <div style={{ color: "#6b7280" }}>{product.category?.name || "Producto"}</div>
            <h1 style={{ fontSize: 42, margin: "8px 0" }}>{product.name}</h1>
            <div style={{ fontSize: 28, fontWeight: 800 }}>${Number(product.price).toLocaleString("es-CL")}</div>
            <p style={{ lineHeight: 1.7, color: "#4b5563", whiteSpace: "pre-wrap" }}>{product.description || "Sin descripción."}</p>
            <ProductBuy
              storeSlug={store.slug}
              product={{
                id: product.id,
                name: product.name,
                price: Number(product.price),
                stock: product.stock,
                imageUrl: product.imageUrl,
                variants: product.variants.map(v => ({
                  id: v.id, name: v.name, price: v.price ? Number(v.price) : null,
                  stock: v.stock, attributes: v.attributes
                }))
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}