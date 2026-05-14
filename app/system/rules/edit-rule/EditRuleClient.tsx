"use client";

import Link from "next/link";
import { updateRule } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EditRuleClient({ rule }: { rule: any }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData(e.currentTarget);

    try {
      await updateRule(rule.id, formData);
      router.push("/system/rules");
    } catch (err) {
      alert("Error updating rule.");
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/system/rules" className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:shadow-md transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-widest">Edit Protocol</h2>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Rule Identity</label>
            <input
              name="name"
              type="text"
              required
              defaultValue={rule.name}
              className="w-full p-4 bg-gray-50 border border-gray-50 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Governance Trigger</label>
            <div className="relative">
              <select 
                name="condition" 
                defaultValue={rule.condition}
                className="w-full p-4 bg-gray-50 border border-gray-50 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
              >
                <option value="Wrong title">Wrong Title Format</option>
                <option value="Wrong folder">Wrong Folder Location</option>
                <option value="Missing file">Missing Required File</option>
              </select>
                
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Impact Scope (Template Name)</label>
            <input
              name="template"
              type="text"
              defaultValue={rule.template}
              className="w-full p-4 bg-gray-50 border border-gray-50 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="pt-8 border-t border-gray-50 flex justify-end gap-4">
            <Link
              href="/system/rules"
              className="px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className={`bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transform hover:-translate-y-1 transition-all active:translate-y-0 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? 'Saving...' : 'Update Protocol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
