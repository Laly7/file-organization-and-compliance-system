import Link from "next/link";
import { getDbData } from "@/lib/db";

export default async function ReportDetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {

  const params = await searchParams;
  const id = String(params?.id || "");
  const dbData = await getDbData();

  console.log("ID:", id);
  console.log("DB:", dbData);

  const report = dbData?.stats?.recentScans?.find(
    (r: any) => String(r.id) === id
  );

  if (!report) {
    return <div className="p-10 text-center text-xl text-red-600">Report details not found!</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/system/report" className="text-blue-600 hover:underline">← Back to Reports</Link>
          <h1 className="text-2xl font-bold text-black border-l pl-4 border-gray-300">Report Detail: {String(report.id).slice(0,15)}{String(report.id).length > 15 ? '...' : ''}</h1>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-md border p-8 space-y-4">
            <h2 className="text-xl font-bold border-b pb-2 text-black">Scan Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-500">Folder Scanned</p>
                <p className="text-lg font-bold text-black">{report.folder}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-500">Template Applied</p>
                <p className="text-lg font-bold text-black">{report.template}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-500">Completion Date</p>
                <p className="text-lg text-black">{report.date}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-500">Global Status</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block mt-1 ${
                  report.status === "Completed" ? "bg-green-100 text-green-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {report.status}
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm font-semibold text-gray-500 mb-2">Overall Compliance Score</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${report.compliance >= 80 ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{width: `${report.compliance ?? 0}%`}}
                  ></div>
                </div>
                <span className="font-bold text-xl">{report.compliance ?? 0}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border p-8 space-y-4">
             <h2 className="text-xl font-bold border-b pb-2 text-black">Status</h2>
             {report.compliance === 100 ? (
               <div className="p-3 bg-green-50 text-green-800 rounded-lg border border-green-200 text-sm font-medium">
                 ✓ Folder is complete
               </div>
             ) : (
               <div className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-sm font-medium">
                 ⚠ Folder has {100 - (report.compliance ?? 0)}% compliance issues
               </div>
             )}
          </div>
        </div>
    </div>
  );
}
