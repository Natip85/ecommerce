import ProductDetails from "@/features/products/product-details";
import { prefetch, trpc } from "@/trpc/server";

// Skip static generation - render dynamically at request time
// Required because layout components use nuqs/useSearchParams
export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  prefetch(trpc.product.getByIdPublic.queryOptions({ id }));

  return <ProductDetails id={id} />;
}
