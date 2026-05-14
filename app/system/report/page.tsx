import { getDbData } from "@/lib/db";
import ReportClient from "./ReportClient";

export default async function ReportPage() {
  const dbData = await getDbData();
  const reports = dbData?.stats?.recentScans || [];

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-black text-gray-800 mb-8 uppercase tracking-widest text-center">Compliance Execution Reports</h2>
      <ReportClient initialReports={reports} />
    </div>
  );
}