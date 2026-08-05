import OrdersPageClient from "./OrdersPageClient";

type OrdersPageProps = { searchParams: Promise<{ checkout?: string | string[] }> };

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const { checkout } = await searchParams;
  return <OrdersPageClient checkoutStatus={Array.isArray(checkout) ? checkout[0] : checkout} />;
}
