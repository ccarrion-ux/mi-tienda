import Link from "next/link";

export default function Home() {
  const features = [
    ["🛍️", "Tu tienda online", "Productos, categorías, carrito, checkout, clientes y pedidos."],
    ["🎨", "Diseño sin complicaciones", "Personaliza tu tienda con un constructor visual y temas."],
    ["🤖", "IA para tu negocio", "Crea contenido, mejora productos y recibe ideas de marketing."],
    ["📊", "Analítica avanzada", "Entiende tus ventas, productos, clientes y oportunidades."],
    ["💳", "Pagos y despachos", "Prepara tu tienda para vender con opciones de pago y entrega."],
    ["🚀", "Crece con Mi Tienda", "Empieza gratis y cambia de plan cuando tu negocio lo necesite."]
  ];

  return <main style={{fontFamily:"Arial,sans-serif",color:"#17202a"}}>
    <nav style={{maxWidth:1180,margin:"auto",padding:"22px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <b style={{fontSize:20}}>MI TIENDA</b><div style={{display:"flex",gap:16,alignItems:"center"}}><Link href="/planes">Planes</Link><Link href="/login">Ingresar</Link><Link href="/registro" style={{background:"#111827",color:"#fff",padding:"10px 14px",borderRadius:9,textDecoration:"none"}}>Comenzar gratis</Link></div>
    </nav>
    <section style={{maxWidth:1180,margin:"auto",padding:"85px 20px 70px",display:"grid",gridTemplateColumns:"1.1fr .9fr",gap:50,alignItems:"center"}}>
      <div><div style={{display:"inline-block",background:"#f2f4f7",padding:"8px 12px",borderRadius:99,fontSize:13,fontWeight:700}}>🎁 30 DÍAS GRATIS</div><h1 style={{fontSize:"clamp(42px,6vw,68px)",lineHeight:1.02,margin:"20px 0"}}>Crea tu tienda.<br/>Hazla crecer.</h1><p style={{fontSize:21,lineHeight:1.55,color:"#667085",maxWidth:650}}>Mi Tienda te ayuda a crear, administrar y hacer crecer tu negocio online, incluso si estás comenzando desde cero.</p><div style={{display:"flex",gap:12,marginTop:28,flexWrap:"wrap"}}><Link href="/registro" style={{background:"#111827",color:"#fff",padding:"14px 20px",borderRadius:10,textDecoration:"none",fontWeight:700}}>Crear mi tienda gratis →</Link><Link href="/planes" style={{border:"1px solid #d0d5dd",padding:"14px 20px",borderRadius:10,textDecoration:"none"}}>Ver planes</Link></div><p style={{fontSize:13,marginTop:13}}>Sin cobro durante los primeros 30 días.</p></div>
      <div style={{border:"1px solid #e4e7ec",borderRadius:24,padding:22,boxShadow:"0 20px 60px rgba(0,0,0,.08)"}}><div style={{background:"#f8fafc",borderRadius:16,padding:24}}><div style={{fontSize:12,color:"#667085"}}>ASISTENTE DE LANZAMIENTO</div><h2 style={{fontSize:30,margin:"10px 0"}}>¿Qué vendes?</h2><p style={{color:"#667085"}}>Cuéntaselo a Mi Tienda y recibe una propuesta para comenzar.</p><div style={{border:"1px solid #d0d5dd",background:"#fff",padding:15,borderRadius:10,marginTop:20}}>“Vendo snacks saludables…”</div><div style={{marginTop:12,display:"grid",gap:9}}><div style={{padding:11,borderRadius:9,background:"#fff"}}>✓ Categorías sugeridas</div><div style={{padding:11,borderRadius:9,background:"#fff"}}>✓ Estructura de portada</div><div style={{padding:11,borderRadius:9,background:"#fff"}}>✓ Productos iniciales</div><div style={{padding:11,borderRadius:9,background:"#fff"}}>✓ Plan de primera semana</div></div></div></div>
    </section>
    <section style={{background:"#f8fafc",padding:"70px 20px"}}><div style={{maxWidth:1180,margin:"auto"}}><div style={{textAlign:"center"}}><h2 style={{fontSize:38,marginBottom:8}}>Todo lo que necesitas para vender</h2><p style={{color:"#667085",fontSize:18}}>Una plataforma pensada para emprendedores y negocios en crecimiento.</p></div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginTop:35}}>{features.map(([icon,title,text])=><div key={title} style={{background:"#fff",border:"1px solid #e4e7ec",borderRadius:14,padding:22}}><div style={{fontSize:28}}>{icon}</div><h3>{title}</h3><p style={{color:"#667085",lineHeight:1.5}}>{text}</p></div>)}</div></div></section>
    <section style={{maxWidth:1000,margin:"auto",padding:"75px 20px",textAlign:"center"}}><h2 style={{fontSize:38}}>Empieza hoy. Tienes 30 días para probar.</h2><p style={{fontSize:18,color:"#667085"}}>Construye tu tienda, configura tus productos y descubre cómo Mi Tienda puede ayudarte a vender.</p><Link href="/registro" style={{display:"inline-block",marginTop:20,background:"#111827",color:"#fff",padding:"14px 22px",borderRadius:10,textDecoration:"none",fontWeight:700}}>Comenzar 30 días gratis</Link></section>
    <footer style={{borderTop:"1px solid #e4e7ec",padding:"25px 20px",textAlign:"center",color:"#667085"}}>© Mi Tienda · Tu negocio, tu tienda, tu crecimiento.</footer>
  </main>;
}
