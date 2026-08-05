import CartPageClient from "./CartPageClient";

type CartPageProps = { searchParams: Promise<{ checkout?: string | string[] }> };

export default async function CartPage({ searchParams }: CartPageProps) {
  const { checkout } = await searchParams;
  return <CartPageClient checkoutStatus={Array.isArray(checkout) ? checkout[0] : checkout} />;
}
