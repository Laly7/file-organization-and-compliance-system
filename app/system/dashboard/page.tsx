import Link from "next/link";
import { auth } from "@/auth";
import { getDbData } from "@/lib/db";
 
// Lucide icons
import { Plus, Folder, Calendar, FileText, Eye } from "lucide-react";

function formatDisplayDate(dateString: string) {
  if (!dateString) return "None";
  const parsed = new Date(dateString);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }
  return dateString;
}

type Scan = {
    id: string;
    folder: string;
    template: string;
    date: string;
    status: "Completed" | "Failed" | string;
};

export default async function Dashboard() {
    const session = await auth();

    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center text-gray-600">
                    <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                    <p>Please log in to access the dashboard.</p>
                </div>
            </div>
        );
    }
    
    const userName = session?.user?.name || "User";
    const dbConfig = await getDbData();

    const stats = dbConfig?.stats ?? {
        totalFoldersScanned: 0,
        lastScanDate: "None",
        recentScans: [],
    };

    const recentScans: Scan[] = Array.isArray(stats.recentScans)
        ? stats.recentScans
        : [];

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">
                    Welcome! {userName}
                </h2>
            </div>

            {/* METRIC CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                {/* START SCAN */}
                <Link 
                    href="/system/scan/select-folder"
                    className="group bg-blue-600 rounded-2xl p-8 flex flex-col justify-between h-48 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-1"
                >
                    <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                        <Plus className="w-6 h-6"/>
                    </div>

                    <div>
                        <h3 className="text-white text-2xl font-bold">Start New Scan</h3>
                        <p className="text-blue-100 text-sm mt-1">Initiate folder analysis</p>
                    </div>
                </Link>

                {/* TOTAL FOLDERS SCANNED */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between h-48 relative overflow-hidden group">
                    <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200">
                        <Folder className="w-5 h-5 text-gray-500" />
                    </div>

                    <div>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                            Total Folders Scanned
                        </p>

                        <h3 className="text-4xl font-black text-gray-900 mt-2">
                            {stats.totalFoldersScanned}
                        </h3>
                    </div>
                </div>

                {/* LAST SCAN */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between h-48">
                    <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200">
                        <Calendar className="w-5 h-5 text-gray-500" />
                    </div>

                    <div>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                            Last Scan Date
                        </p>

                        <h3 className="text-2xl font-black text-gray-900 mt-2">
                            {formatDisplayDate(stats.lastScanDate)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">
                        Recent Scans
                    </h3>

                    <Link
                        href="/system/report"
                        className="text-blue-600 font-bold hover:underline text-sm uppercase tracking-widest"
                    >
                        View All
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs uppercase text-gray-400 border-b">
                                <th className="px-6 py-4">Folder</th>
                                <th className="px-6 py-4">Template</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-50">
                            {recentScans.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-16 text-gray-400">
                                        No recent scans yet
                                    </td>
                                </tr>
                            ) : (
                                recentScans.map((scan) => (
                                    <tr key={scan.id} className="hover:bg-gray-50 transition">
                                        <td className="px-8 py-5 flex items-center gap-3">
                                            <Folder className="w-4 h-4 text-gray-500"/>
                                            <span className="font-bold text-gray-900">
                                                {scan.folder}
                                            </span>
                                        </td>

                                        <td className="px-8 py-5 text-gray-600 font-medium">
                                            {scan.template}
                                        </td>

                                        <td className="px-8 py-5 text-gray-500 text-sm">
                                            {scan.date}
                                        </td>

                                        <td className="px-8 py-5">
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                                                scan.status === "Completed"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                            >
                                                {scan.status}
                                            </span>
                                        </td>

                                        <td className="px-8 py-5 text-center">
                                            <Link href={`/system/report/report-details?id=${scan.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition">
                                                <Eye className="w-4 h-4" />
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}