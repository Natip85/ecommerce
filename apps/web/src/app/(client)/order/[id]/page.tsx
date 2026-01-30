import { OrderConfirmationContent } from "@/features/order/order-confirmation";

type OrderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  return <OrderConfirmationContent orderId={id} />;
}
