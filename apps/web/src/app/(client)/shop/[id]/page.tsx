import ProductDetails from "@/features/products/product-details";
import { prefetch, trpc } from "@/trpc/server";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  prefetch(trpc.product.getByIdPublic.queryOptions({ id }));

  return <ProductDetails id={id} />;
}
