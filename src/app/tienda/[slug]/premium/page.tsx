import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PremiumStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug, status: "ACTIVE" },
    include: {
      products: { where: { active: true }, take: 12, orderBy: { createdAt: "desc" } },
      categories: { orderBy: { name: "asc" } },
      theme: true,
    },
  });

  if (!store) notFound();

  const theme = (store.theme?.publishedTheme || store.theme?.theme || {}) as any;
  const hero = theme.hero || {};
  const brand = theme.brandName || store.name;
  const primary = theme.primaryColor || "#111827";

  return (
    <div className="mt-store-page" style={{ ["--store-primary" as any]: primary }}>
      <header className="mt-store-header">
        <div className="container mt-store-header-inner">
          <a href={`/tienda/${store.slug}`} className="mt-brand">{brand}</a>
          <nav className="mt-store-nav">
            <a href="#productos">Productos</a>
            <a href="#categorias">Categorías</a>
            <a href="#nosotros">Nosotros</a>
          </nav>
          <div className="mt-store-actions">
            <a className="mt-store-cart" href={`/tienda/${store.slug}/carrito`}>🛒 Carrito</a>
          </div>
        </div>
      </header>

      <section
        className={`mt-store-hero ${hero.imageUrl ? "has-image" : ""}`}
        style={hero.imageUrl ? { backgroundImage: `url(${hero.imageUrl})` } : undefined}
      >
        {hero.imageUrl && <div className="mt-store-hero-overlay" />}
        <div className="mt-store-hero-content">
          <div className="mt-eyebrow" style={{ color: hero.imageUrl ? "#d9d3ff" : "#6d5dfc" }}>Bienvenido</div>
          <h1>{hero.title || `Descubre ${brand}`}</h1>
          <p>{hero.subtitle || "Productos seleccionados para ti, con una experiencia de compra simple y cercana."}</p>
          <a className="button accent" href="#productos">{hero.buttonText || "Comprar ahora"} →</a>
        </div>
      </section>

      <section id="productos" className="mt-store-section">
        <div className="container">
          <div className="mt-store-section-head">
            <div>
              <h2>Productos destacados</h2>
              <p>Explora lo más reciente de nuestra tienda.</p>
            </div>
            <a className="button secondary" href={`/tienda/${store.slug}`}>Ver catálogo</a>
          </div>
          <div className="mt-store-products">
            {store.products.map((product) => (
              <a className="mt-store-product" href={`/tienda/${store.slug}/producto/${product.slug}`} key={product.id}>
                <div className="mt-store-product-media">
                  {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span>🛍️</span>}
                </div>
                <div className="mt-store-product-body">
                  <h3>{product.name}</h3>
                  <div className="mt-store-product-price">${Number(product.price).toLocaleString("es-CL")}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="categorias" className="mt-store-section alt">
        <div className="container">
          <div className="mt-store-section-head">
            <div>
              <h2>Compra por categoría</h2>
              <p>Encuentra rápidamente lo que buscas.</p>
            </div>
          </div>
          <div className="mt-store-category-grid">
            {store.categories.slice(0, 8).map((category) => (
              <a className="mt-store-category" href={`/tienda/${store.slug}?category=${category.slug}`} key={category.id}>
                {category.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="nosotros" className="mt-store-section">
        <div className="container">
          <div className="mt-store-text-block">
            <h2>Una experiencia de compra pensada para tus clientes.</h2>
            <p>Mi Tienda ayuda a negocios independientes a presentar sus productos de forma clara, atractiva y profesional.</p>
          </div>
        </div>
      </section>

      <footer className="mt-store-footer">
        <div className="container mt-store-footer-inner">
          <div className="mt-store-footer-brand">{brand}</div>
          <div>Compra segura · Despachos · Soporte</div>
          <div>Powered by Mi Tienda</div>
        </div>
      </footer>
    </div>
  );
}
