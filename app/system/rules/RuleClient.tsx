"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { deleteRule } from "@/app/actions";


export default function RulesClient({ initialRules }: { initialRules: any[] }) {
  const [rules, setRules] = useState(initialRules);
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);

  const toggleRule = (id: number) => {
    setRules(rules.map(r => r.id === id ? { ...r, status: !r.status } : r));
  };

  const handleDelete = async () => {
    if (selectedRuleId) {
      const confirm = window.confirm("Delete this rule?");

      if (confirm) {
        await deleteRule(selectedRuleId);
        setRules(rules.filter(r => r.id !== selectedRuleId));
        setSelectedRuleId(null);
      }
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-black text-gray-800 mb-8 uppercase tracking-widest text-center">Automation Protocol Rules</h2>
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Governance Rules</h3>
            <div className="flex gap-2">
              <Link 
                href={selectedRuleId ? `/system/rules/edit-rule?id=${selectedRuleId}` : "#"}
                className={`px-4 py-2 border rounded-xl text-xs font-bold uppercase transition-all ${
                selectedRuleId ? 'bg-white border-gray-200 text-gray-700 hover:shadow-md' : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                Edit Rule
              </Link>
                
              <button 
                onClick={handleDelete}
                disabled={!selectedRuleId}
                className={`px-4 py-2 border rounded-xl text-xs font-bold uppercase transition-all ${
                selectedRuleId ? 'bg-red-50 border-red-100 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                Delete
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-white text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">
                  <th className="px-8 py-5 border-b border-gray-50 text-center">Select</th>
                  <th className="px-8 py-5 border-b border-gray-50">Priority</th>
                  <th className="px-8 py-5 border-b border-gray-50">Rule Logic</th>
                  <th className="px-8 py-5 border-b border-gray-50">Condition</th>
                  <th className="px-8 py-5 border-b border-gray-50">State</th>
                  <th className="px-8 py-5 border-b border-gray-50">Target Template</th>
                </tr>
              </thead>
                    
              <tbody className="divide-y divide-gray-50">
                {rules.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-20 text-center text-gray-400 italic font-medium">No active protocols defined</td></tr>
                ) : (
                rules.map((rule, idx) => (
                  <tr key={rule.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-5 text-center">
                      <input 
                        type="radio" 
                        name="rule-select"
                        checked={selectedRuleId === rule.id}
                        onChange={() => setSelectedRuleId(rule.id)}
                        className="w-5 h-5 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                      />
                    </td>
                    
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
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleRule(rule.id); }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${rule.status ? 'bg-blue-600' : 'bg-gray-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${rule.status ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </td>

                      <td className="px-8 py-5">
                        <Link href="/template-selection" className="text-blue-600 font-bold text-xs hover:underline decoration-2 underline-offset-4">
                          {rule.template || 'Default'}
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-8 bg-gray-50/30 border-t border-gray-50 flex justify-end">
            <Link href="/system/rules/add-rule" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transform hover:-translate-y-1 transition-all active:translate-y-0">
              + Define New Rule
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

