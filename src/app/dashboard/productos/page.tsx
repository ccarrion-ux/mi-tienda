import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getUserStoreContext } from "@/lib/store-context";

export default async function ProductosPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { store: activeStore } = await getUserStoreContext(userId);
  const store = activeStore ? await prisma.store.findUnique({
    where: { id: activeStore.id },
    include: { products: { orderBy: { createdAt: "desc" }, include: { category: true } } }
  }) : null;

  if (!store) redirect("/dashboard");

  return (
    <main>
      <header style={{ background: "#111827", color: "white", padding: "18px 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between" }}>
          <Link href="/dashboard"><strong>MI TIENDA</strong></Link>
          <span>{store.name}</span>
        </div>
      </header>

      <section className="container" style={{ padding: "40px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ marginBottom: 6 }}>Productos</h1>
            <p style={{ color: "#6b7280" }}>Administra el catálogo de tu tienda.</p>
          </div>
          <Link className="button" href="/dashboard/productos/nuevo">+ Nuevo producto</Link>
        </div>

        <div className="card" style={{ marginTop: 24, padding: 0, overflow: "hidden" }}>
          {store.products.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center" }}>
              <h3>Aún no tienes productos</h3>
              <p style={{ color: "#6b7280" }}>Crea tu primer producto para comenzar.</p>
              <Link className="button" href="/dashboard/productos/nuevo">Crear producto</Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                    <th style={{ padding: 16 }}>Producto</th>
                    <th style={{ padding: 16 }}>SKU</th>
                    <th style={{ padding: 16 }}>Precio</th>
                    <th style={{ padding: 16 }}>Stock</th>
                    <th style={{ padding: 16 }}>Estado</th>
                    <th style={{ padding: 16 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {store.products.map((product) => (
                    <tr key={product.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td style={{ padding: 16 }}>
                        <strong>{product.name}</strong>
                        {product.category && <div style={{ color: "#6b7280", fontSize: 13 }}>{product.category.name}</div>}
                      </td>
                      <td style={{ padding: 16 }}>{product.sku || "—"}</td>
                      <td style={{ padding: 16 }}>${Number(product.price).toLocaleString("es-CL")}</td>
                      <td style={{ padding: 16 }}>{product.stock}</td>
                      <td style={{ padding: 16 }}>{product.active ? "Activo" : "Inactivo"}</td>
                      <td style={{ padding: 16 }}>
                        <Link href={`/dashboard/productos/${product.id}`} style={{ textDecoration: "underline" }}>Editar</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
