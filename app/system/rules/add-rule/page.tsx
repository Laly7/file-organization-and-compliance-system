import Link from "next/link";
import { addRule } from "@/app/actions";
import { redirect } from "next/navigation";

export default function AddRulePage() {

  const actionAdapter = async (formData: FormData) => {
    "use server";
    await addRule(formData);
    redirect("/system/rules");
  };

  return (
    <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/system/rules" className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:shadow-md transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
          </Link>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-widest">Define New Protocol</h2>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-10">
          <form action={actionAdapter} className="space-y-8">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Rule Identity</label>
              <input
                name="name"
                type="text"
                required
                className="w-full p-4 bg-gray-50 border border-gray-50 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g., Mandatory Documentation Check"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Governance Trigger</label>
              <div className="relative">
                <select 
                  name="condition" 
                  className="w-full p-4 bg-gray-50 border border-gray-50 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="Wrong title">Wrong Title Format</option>
                  <option value="Wrong folder">Wrong Folder Location</option>
                  <option value="Missing file">Missing Required File</option>
                </select>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    Rule Action
                  </label>

                  <select
                    name="action"
                    className="w-full p-4 bg-gray-50 border border-gray-50 rounded-2xl"
                  >
                    <option value="rename">
                      Rename File
                    </option>

                    <option value="move">
                      Move File
                    </option>

                    <option value="copy">
                      Backup File
                    </option>
                  </select>
                </div>

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
                className="w-full p-4 bg-gray-50 border border-gray-50 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g., Project Template"
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
                className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transform hover:-translate-y-1 transition-all active:translate-y-0"
              >
                Deploy Protocol
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}