"use client";

import Link from "next/link";
import { deleteScan } from "@/app/actions";
import { useEffect, useState } from "react";

export default function ReportClient({ initialReports }: { initialReports: any[] }) {
  const [reports, setReports] = useState(initialReports);

  useEffect(() => {
  const saved = sessionStorage.getItem("lastScan");

  if (saved) {
    try {
      const parsed = JSON.parse(saved);

      setReports((prev) =>
        prev.map((r) =>
          r.id === parsed.id
            ? { ...r, compliance: parsed.compliance }
            : r
        )
      );
    } catch (err) {
      console.error("Failed to parse lastScan", err);
    }
  }
  }, []);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this scan report record?");
    if (confirmDelete) {
      const success = await deleteScan(id);

      if (success) {
        setReports(reports.filter((r) => r.id !== id));
      } else {
        alert("Failed to delete report.");
      }
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Audit History</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-white text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">
              <th className="px-8 py-5 border-b border-gray-50">Audit ID</th>
              <th className="px-8 py-5 border-b border-gray-50">Analysis Target</th>
              <th className="px-8 py-5 border-b border-gray-50">Template Used</th>
              <th className="px-8 py-5 border-b border-gray-50 text-center">Scan Date</th>
              <th className="px-8 py-5 border-b border-gray-50 text-center">Compliance</th>
              <th className="px-8 py-5 border-b border-gray-50 text-center">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center text-gray-400 italic font-medium">
                  No audit reports archived yet
                </td>
              </tr>
            ) : (
              reports.map((report: any) => (
                <tr key={report.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <span className="font-mono text-[10px] text-gray-400 group-hover:text-blue-600 transition-colors">
                      {report.auditId || `#${report.id.slice(-6)}`}
                    </span>
                  </td>

                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <span className="text-lg opacity-40">📁</span>
                      <span className="font-black text-gray-900">{report.folder}</span>
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold">
                      {report.template}
                    </span>
                  </td>

                  <td className="px-8 py-5 text-center">
                    <span className="text-gray-500 font-bold text-xs">{report.date}</span>
                  </td>
                  
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            Number(report.compliance) >= 80
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${Number(report.compliance) || 0}%` }}
                        ></div>
                      </div>
                      <span
                        className={`text-xs font-black italic tracking-tighter ${
                          Number(report.compliance) >= 80
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {Number(report.compliance)}%
                      </span>
                    </div>
                  </td>

                  <td className="px-8 py-5 text-center flex items-center justify-center gap-2">
                    <Link
                      href={`/system/report/report-details?id=${report.id}`}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gray-50 border border-gray-100 text-gray-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200"
                      title="View Details"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </Link>
                    
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gray-50 border border-gray-100 text-gray-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200"
                      title="Delete Report"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
