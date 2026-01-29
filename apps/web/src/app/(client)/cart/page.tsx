import { CartPageContent } from "@/features/cart/cart-page";

// Skip static generation - render dynamically at request time
// Required because layout components use nuqs/useSearchParams
export const dynamic = "force-dynamic";

export default function CartPage() {
  return <CartPageContent />;
}
