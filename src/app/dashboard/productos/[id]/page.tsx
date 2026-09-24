import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import EditProductForm from "./form";
import { getActiveStoreId } from "@/lib/store-context";

export default async function EditarProducto({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const activeStoreId = await getActiveStoreId(userId);
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, storeId: activeStoreId || "" }
  });

  if (!product) notFound();

  const categories = await prisma.category.findMany({
    where: { storeId: activeStoreId || "" },
    orderBy: { name: "asc" }
  });

  return <EditProductForm product={{
    id: product.id, name: product.name, description: product.description || "",
    price: Number(product.price), stock: product.stock, sku: product.sku || "",
    imageUrl: product.imageUrl || "", categoryId: product.categoryId || "", active: product.active
  }} categories={categories} />;
}
