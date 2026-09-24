export type ThemeConfig = {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: "Inter" | "Georgia" | "Arial" | "Trebuchet MS";
  hero: {
    enabled: boolean;
    title: string;
    subtitle: string;
    imageUrl: string;
    buttonText: string;
    buttonUrl: string;
  };
  sections: Array<{
    id: string;
    type: "featured-products" | "categories" | "text" | "image";
    title: string;
    text?: string;
    imageUrl?: string;
    limit?: number;
    enabled: boolean;
  }>;
};

export const defaultTheme = (storeName: string): ThemeConfig => ({
  brandName: storeName,
  logoUrl: "",
  primaryColor: "#111827",
  accentColor: "#f59e0b",
  backgroundColor: "#ffffff",
  textColor: "#111827",
  fontFamily: "Inter",
  hero: {
    enabled: true,
    title: "Bienvenido a nuestra tienda",
    subtitle: "Descubre nuestros productos",
    imageUrl: "",
    buttonText: "Ver productos",
    buttonUrl: "#productos"
  },
  sections: [
    { id: "featured", type: "featured-products", title: "Productos destacados", limit: 4, enabled: true },
    { id: "categories", type: "categories", title: "Categorías", enabled: true },
    { id: "about", type: "text", title: "Conócenos", text: "Cuéntales a tus clientes quién eres y qué hace especial a tu tienda.", enabled: true }
  ]
});
