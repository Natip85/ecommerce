import { HistoryList } from "@/features/history/history-list";
import { prefetch, trpc } from "@/trpc/server";

export default function HistoryPage() {
  prefetch(trpc.order.getOrders.queryOptions());
  return <HistoryList />;
}
