import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AddToCart from "./add-to-cart";

export default async function ProductPage({ params }: { params: Promise<{ slug:string; id:string }> }) {
  const { slug, id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, active:true, store:{ slug } },
    include: { store:true, category:true, variants:true }
  });
  if (!product) notFound();

  return (
    <main>
      <header style={{ background:"#111827", color:"white", padding:"20px 0" }}>
        <div className="container" style={{ display:"flex", justifyContent:"space-between" }}>
          <Link href={`/tienda/${slug}`}><strong>{product.store.name}</strong></Link>
          <Link href={`/tienda/${slug}/carrito`}>🛒 Carrito</Link>
        </div>
      </header>
      <section className="container" style={{ padding:"45px 0" }}>
        <Link href={`/tienda/${slug}`} style={{ textDecoration:"underline" }}>← Volver a la tienda</Link>
        <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)", gap:45, marginTop:25 }}>
          <div>
            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} style={{ width:"100%", maxHeight:600, objectFit:"cover", borderRadius:18 }} /> :
              <div style={{ width:"100%", aspectRatio:"1", background:"#f0f1f3", borderRadius:18, display:"grid", placeItems:"center", color:"#6b7280" }}>Sin imagen</div>}
          </div>
          <div>
            <div style={{ color:"#6b7280" }}>{product.category?.name || "Producto"}</div>
            <h1 style={{ fontSize:40, margin:"10px 0" }}>{product.name}</h1>
            <div style={{ fontSize:28, fontWeight:800 }}>${Number(product.price).toLocaleString("es-CL")}</div>
            <p style={{ color:"#4b5563", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{product.description || "Producto disponible en nuestra tienda."}</p>
            <div style={{ margin:"20px 0" }}><strong>Stock disponible: </strong>{product.stock}</div>
            <AddToCart product={{
              id:product.id, name:product.name, price:Number(product.price), imageUrl:product.imageUrl,
              stock:product.stock, storeSlug:slug, variants:product.variants.map(v=>({id:v.id,name:v.name,price:v.price?Number(v.price):null,stock:v.stock}))
            }} />
          </div>
        </div>
      </section>
    </main>
  );
}