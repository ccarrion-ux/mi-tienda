import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { defaultTheme } from "@/lib/theme";

export default async function Storefront({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { slug } = await params;
  const { q, category } = await searchParams;

  const store = await prisma.store.findUnique({
    where: { slug, status: "ACTIVE" },
    include: { theme: true, categories: true }
  });
  if (!store) notFound();

  const theme: any = (store.theme?.published && (store.theme?.publishedTheme || store.theme?.theme)) || defaultTheme(store.name);

  const products = await prisma.product.findMany({
    where: {
      storeId: store.id,
      active: true,
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {}),
      ...(category ? { category: { slug: category } } : {})
    },
    include: { category: true },
    orderBy: { createdAt: "desc" }
  });

  const featuredLimit = Number(theme.sections?.find((s: any) => s.type === "featured-products" && s.enabled)?.limit || 4);
  const featured = products.slice(0, featuredLimit);
  const enabledSections = (theme.sections || []).filter((s: any) => s.enabled);

  return (
    <main style={{ background: theme.backgroundColor, color: theme.textColor, fontFamily: theme.fontFamily, minHeight: "100vh" }}>
      <header style={{ padding: "18px 5%", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, position: "sticky", top: 0, background: theme.backgroundColor, zIndex: 10 }}>
        <Link href={`/tienda/${slug}`} style={{ color: theme.textColor, textDecoration: "none", fontSize: 24, fontWeight: 800 }}>
          {theme.logoUrl ? <img src={theme.logoUrl} alt={theme.brandName} style={{ maxHeight: 42, maxWidth: 160 }} /> : theme.brandName}
        </Link>
        <div style={{ display: "flex", gap: 18 }}>
          <Link href={`/tienda/${slug}`} style={{ color: theme.textColor }}>Productos</Link>
          <Link href={`/tienda/${slug}/carrito`} style={{ color: theme.textColor }}>🛒 Carrito</Link>
        </div>
      </header>

      {theme.hero?.enabled && (
        <section style={{
          minHeight: 390,
          display: "flex",
          alignItems: "center",
          padding: "60px 7%",
          backgroundImage: theme.hero.imageUrl ? `linear-gradient(rgba(0,0,0,.42),rgba(0,0,0,.42)),url(${theme.hero.imageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: theme.hero.imageUrl ? "#fff" : theme.textColor
        }}>
          <div style={{ maxWidth: 720 }}>
            <h1 style={{ fontSize: "clamp(38px, 6vw, 70px)", lineHeight: 1.02, margin: 0 }}>{theme.hero.title}</h1>
            <p style={{ fontSize: 21, lineHeight: 1.5 }}>{theme.hero.subtitle}</p>
            <a href="#productos" style={{ display: "inline-block", padding: "13px 20px", borderRadius: 10, background: theme.primaryColor, color: "#fff", textDecoration: "none", fontWeight: 700 }}>{theme.hero.buttonText}</a>
          </div>
        </section>
      )}

      <div className="container" style={{ padding: "30px 0" }}>
        {enabledSections.map((section: any) => (
          <section key={section.id} id={section.type === "featured-products" ? "productos" : undefined} style={{ marginBottom: 55 }}>
            <h2 style={{ fontSize: 32 }}>{section.title}</h2>

            {section.type === "featured-products" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 20 }}>
                {featured.map(product => (
                  <Link key={product.id} href={`/tienda/${slug}/producto/${product.slug}`} style={{ color: theme.textColor, textDecoration: "none", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
                    {product.imageUrl ? <img src={product.imageUrl} alt={product.name} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} /> : <div style={{ aspectRatio: "1", display: "grid", placeItems: "center", background: "#f3f4f6" }}>Sin imagen</div>}
                    <div style={{ padding: 16 }}>
                      <strong>{product.name}</strong>
                      <div style={{ marginTop: 8, fontSize: 19, fontWeight: 800 }}>${Number(product.price).toLocaleString("es-CL")}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {section.type === "categories" && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {store.categories.map(cat => <Link key={cat.id} href={`/tienda/${slug}?category=${cat.slug}`} style={{ background: theme.accentColor, color: theme.textColor, padding: "10px 16px", borderRadius: 999, textDecoration: "none" }}>{cat.name}</Link>)}
              </div>
            )}

            {section.type === "text" && <p style={{ fontSize: 18, lineHeight: 1.8, maxWidth: 850 }}>{section.text}</p>}

            {section.type === "image" && section.imageUrl && <img src={section.imageUrl} alt="" style={{ width: "100%", maxHeight: 520, objectFit: "cover", borderRadius: 18 }} />}
          </section>
        ))}

        <section id="productos">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15 }}>
            <h2 style={{ fontSize: 32 }}>Todos los productos</h2>
            <form style={{ display: "flex", gap: 8 }}>
              <input name="q" defaultValue={q || ""} placeholder="Buscar productos..." style={{ padding: 12, border: "1px solid #ddd", borderRadius: 9 }} />
              <button style={{ padding: "12px 16px", border: 0, borderRadius: 9, background: theme.primaryColor, color: "#fff" }}>Buscar</button>
            </form>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 20, marginTop: 20 }}>
            {products.map(product => (
              <Link key={product.id} href={`/tienda/${slug}/producto/${product.slug}`} style={{ color: theme.textColor, textDecoration: "none", border: "1px solid #e5e7eb", borderRadius: 14, padding: 16 }}>
                <div style={{ aspectRatio: "1", background: "#f3f4f6", borderRadius: 10, overflow: "hidden" }}>
                  {product.imageUrl && <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <h3>{product.name}</h3>
                <strong>${Number(product.price).toLocaleString("es-CL")}</strong>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <footer style={{ padding: "35px 5%", background: theme.primaryColor, color: "#fff", marginTop: 40 }}>
        © {new Date().getFullYear()} {theme.brandName}
      </footer>
    </main>
  );
}
