import ScanPageClient from "./ScanPageClient";

type ScanPageProps = {
  searchParams: Promise<{
    view?: string | string[];
  }>;
};

export default async function ScanPage({
  searchParams,
}: ScanPageProps) {
  const { view } = await searchParams;

  const viewSaved = Array.isArray(view)
    ? view.includes("saved")
    : view === "saved";

  return <ScanPageClient viewSaved={viewSaved} />;
}