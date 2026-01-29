import { ProductForm } from "@/features/admin/products/product-form";

type Props = {
  params: Promise<{ productId: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { productId } = await params;
  return <ProductForm productId={productId} />;
}
