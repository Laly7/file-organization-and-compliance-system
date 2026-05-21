"use client";

import Link from "next/link";
import { useState } from "react";

export default function RulesClient({ initialRules }: { initialRules: any[] }) {
  const [rules] = useState(initialRules);

  return (
    <main className="flex-1 overflow-y-auto p-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-black text-gray-800 mb-8 uppercase tracking-widest text-center">Automation Protocol Rules</h2>
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Governance Rules</h3>
              <p className="text-xs text-gray-500 mt-2">This page is read-only. Rule changes are disabled for this view.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-white text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">
                  <th className="px-8 py-5 border-b border-gray-50"></th>
                  <th className="px-8 py-5 border-b border-gray-50">Rule Logic</th>
                  <th className="px-8 py-5 border-b border-gray-50">Condition</th>
                  <th className="px-8 py-5 border-b border-gray-50">State</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {rules.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400 italic font-medium">No active protocols defined</td></tr>
                ) : (
                  rules.map((rule, idx) => (
                    <tr key={rule.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <span className="h-8 w-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center font-black text-xs">
                          {idx + 1}
                        </span>
                      </td>

                      <td className="px-8 py-5 font-black text-gray-900">{rule.name}</td>

                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold">
                          {typeof rule.condition === "object"
                            ? rule.condition?.type || "Invalid condition"
                            : rule.condition}
                        </span>
                      </td>

                      <td className="px-8 py-5">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${rule.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {rule.status ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-8 bg-gray-50/30 border-t border-gray-50 flex justify-end">
            <Link href="/system/rules" className="bg-gray-100 text-gray-600 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-sm shadow-gray-200 hover:bg-gray-200 transition-all active:translate-y-0">
              Back to Rules
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

