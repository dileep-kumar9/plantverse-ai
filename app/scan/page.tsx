import ScanPageClient from "./ScanPageClient";

type ScanPageProps = {
  searchParams: Promise<{ report?: string | string[] }>;
};

export default async function ScanPage({ searchParams }: ScanPageProps) {
  const { report } = await searchParams;
  const reportId = Array.isArray(report) ? report[0] : report;
  return <ScanPageClient reportId={reportId} />;
}
