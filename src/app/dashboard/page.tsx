import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getUserStoreContext } from "@/lib/store-context";

const shortcuts = [
  ["📦", "Pedidos", "Revisa y procesa ventas", "/dashboard/pedidos"],
  ["🛍️", "Productos", "Gestiona tu catálogo", "/dashboard/productos"],
  ["🎨", "Diseño", "Personaliza tu tienda", "/dashboard/diseno"],
  ["💳", "Pagos", "Configura medios de pago", "/dashboard/pagos"],
  ["🚚", "Despachos", "Gestiona tus envíos", "/dashboard/envios"],
  ["📊", "Analítica", "Entiende tus ventas", "/dashboard/analitica"],
  ["🤖", "IA Catálogo", "Mejora tus productos", "/dashboard/ia-catalogo"],
  ["📣", "Marketing IA", "Crea campañas", "/dashboard/marketing"],
];

export default async function Dashboard() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

  const { store: activeStore } = await getUserStoreContext(userId);
  const store = activeStore ? await prisma.store.findFirst({
    where: { id: activeStore.id },
    include: { _count: { select: { products: true, orders: true, customers: true } } },
  }) : null;
  const sales = store
    ? await prisma.order.aggregate({
        where: { storeId: store.id, status: { not: "CANCELLED" } },
        _sum: { total: true },
      })
    : { _sum: { total: null } };

  return (
    <main className="container mt-page">
      <div className="mt-page-head">
        <div>
          <div className="mt-eyebrow">Panel de control</div>
          <h1>Hola, {user.name?.split(" ")[0] || "bienvenido"} 👋</h1>
          <p>Todo lo que necesitas para hacer crecer <strong>{store?.name || "tu negocio"}</strong>.</p>
        </div>
        {store && <a className="button accent" href={`/tienda/${store.slug}`} target="_blank" rel="noreferrer">↗ Ver mi tienda</a>}
      </div>

      <div className="mt-stat-grid">
        {[
          ["Productos", store?._count.products || 0, "En tu catálogo"],
          ["Pedidos", store?._count.orders || 0, "Pedidos registrados"],
          ["Clientes", store?._count.customers || 0, "Clientes registrados"],
          ["Ventas", `$${Number(sales._sum.total || 0).toLocaleString("es-CL")}`, "Ventas acumuladas"],
        ].map(([label, value, meta]) => (
          <div className="card mt-stat" key={String(label)}>
            <div className="mt-stat-label">{label}</div>
            <div className="mt-stat-value">{value}</div>
            <div className="mt-stat-meta">{meta}</div>
          </div>
        ))}
      </div>

      <div className="mt-section-heading">
        <div>
          <h2 className="mt-section-title">Accesos rápidos</h2>
          <p>Las herramientas que más vas a usar en el día a día.</p>
        </div>
      </div>

      <div className="mt-nav-grid">
        {shortcuts.map(([icon, title, desc, href]) => (
          <a className="mt-nav-card" href={href} key={href}>
            <div className="mt-nav-icon">{icon}</div>
            <div className="mt-nav-title">{title}</div>
            <div className="mt-nav-desc">{desc}</div>
            <div className="mt-nav-arrow">→</div>
          </a>
        ))}
      </div>

      <div className="card mt-launch-card">
        <div>
          <span className="mt-launch-kicker">✨ Siguiente paso</span>
          <h2>Haz que tu tienda venda más.</h2>
          <p>Completa el diseño, configura tus pagos y publica tu catálogo para comenzar a recibir pedidos.</p>
        </div>
        <div className="mt-actions">
          <a className="button accent" href="/onboarding">Continuar configuración</a>
          <a className="button secondary" href="/dashboard/analitica">Ver analítica</a>
        </div>
      </div>
    </main>
  );
}
