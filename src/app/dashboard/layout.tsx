import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getUserStoreContext } from "@/lib/store-context";

const groups = [
  {
    title: "Vender",
    items: [
      ["📦", "Pedidos", "/dashboard/pedidos"],
      ["🛍️", "Productos", "/dashboard/productos"],
      ["🏷️", "Categorías", "/dashboard/categorias"],
      ["📊", "Inventario", "/dashboard/inventario"],
    ],
  },
  {
    title: "Tienda",
    items: [
      ["🎨", "Diseño", "/dashboard/diseno"],
      ["🖼️", "Medios", "/dashboard/medios"],
      ["🚚", "Despachos", "/dashboard/envios"],
      ["💳", "Pagos", "/dashboard/pagos"],
      ["🌐", "Dominios", "/dashboard/dominios"],
    ],
  },
  {
    title: "Crecer",
    items: [
      ["📈", "Analítica", "/dashboard/analitica"],
      ["🤖", "IA Catálogo", "/dashboard/ia-catalogo"],
      ["✨", "Asistente IA", "/dashboard/asistente"],
      ["📣", "Marketing IA", "/dashboard/marketing"],
      ["🚀", "Crecimiento", "/dashboard/crecimiento"],
    ],
  },
  {
    title: "Cuenta",
    items: [
      ["💰", "Suscripción", "/dashboard/suscripcion"],
      ["🧾", "Facturación", "/dashboard/facturacion"],
      ["🎧", "Soporte", "/dashboard/soporte"],
      ["🛠️", "Estado", "/dashboard/estado"],
    ],
  },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

  const { store } = await getUserStoreContext(userId);

  return (
    <div className="mt-app-shell">
      <aside className="mt-sidebar">
        <div className="mt-sidebar-brand">
          <a href="/dashboard" className="mt-brand">Mi <span>Tienda</span></a>
          <span className="mt-beta">PRO</span>
        </div>

        <div className="mt-store-switcher">
          <div className="mt-store-avatar">{(store?.name || "M").slice(0, 1).toUpperCase()}</div>
          <div className="mt-store-copy">
            <strong>{store?.name || "Mi tienda"}</strong>
            <small>{store?.slug ? `mi-tienda.com/tienda/${store.slug}` : "Configura tu tienda"}</small>
          </div>
        </div>

        <nav className="mt-side-nav">
          <a className="mt-home-link" href="/dashboard">⌂ <span>Inicio</span></a>
          <a className="mt-side-link" href="/dashboard/mi-dia"><span className="mt-side-icon">☀️</span><span>Mi día</span></a>
          <a className="mt-side-link" href="/dashboard/acciones"><span className="mt-side-icon">⚡</span><span>Centro de acción</span></a>
          <a className="mt-side-link" href="/dashboard/ia-ejecutiva"><span className="mt-side-icon">🤖</span><span>IA Ejecutiva</span></a>
          <a className="mt-side-link" href="/dashboard/ia-actividad"><span className="mt-side-icon">🧾</span><span>Actividad IA</span></a>
          <a className="mt-side-link" href="/dashboard/notificaciones"><span className="mt-side-icon">🔔</span><span>Notificaciones</span></a>
          {groups.map((group) => (
            <div className="mt-nav-group" key={group.title}>
              <div className="mt-nav-group-title">{group.title}</div>
              {group.items.map(([icon, label, href]) => (
                <a className="mt-side-link" href={href} key={href}>
                  <span className="mt-side-icon">{icon}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>

        {store && (
          <a className="mt-store-preview" href={`/tienda/${store.slug}`} target="_blank" rel="noreferrer">
            <span>↗</span>
            <span>Ver tienda pública</span>
          </a>
        )}

        <div className="mt-sidebar-bottom">
          <div className="mt-user-mini">
            <div className="mt-user-avatar">{(user.name || user.email).slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{user.name || "Usuario"}</strong>
              <small>{user.email}</small>
            </div>
          </div>
        </div>
      </aside>

      <div className="mt-main-shell">
        <header className="mt-mobile-header">
          <a href="/dashboard" className="mt-brand">Mi <span>Tienda</span></a>
          {store && <a href={`/tienda/${store.slug}`} target="_blank" rel="noreferrer" className="mt-mobile-store">Ver tienda ↗</a>}
        </header>
        {children}
      </div>
    </div>
  );
}
