import Link from "next/link";
import { updateTemplate } from "@/app/actions";
import { redirect } from "next/navigation";
import { getDbData } from "@/lib/db";
import { auth } from "@/auth";
import EditTemplateClient from "./EditTemplateClient";

export default async function EditTemplatePage({ searchParams }: any) {
  const session = await auth();
  if (!session) return <div className="p-10">Access Denied</div>;

  const sp = await searchParams;
  const dbData = await getDbData();

  const template = dbData?.templates.find((t: any) => t.id === sp.id);

  if (!template) {
    return <div className="p-10 text-red-500">Template not found</div>;
  }
  return <EditTemplateClient template={template} />;

  const actionAdapter = async (formData: FormData) => {
    "use server";
    await updateTemplate(template.id, formData);
    redirect("/system/templates/select-template");
  };

  return (
    <div className="max-w-4xl mx-auto p-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/system/templates/select-template" className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:shadow-md transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-widest">Edit Template</h2>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-10">
        <form action={actionAdapter} className="space-y-10">
          <div className="border-b border-gray-50 pb-8">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Template Designation</label>
            <input
              name="templateName"
              type="text"
              required
              defaultValue={template.name}
              className="w-full max-w-md p-4 bg-gray-50 border border-gray-50 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xl"
              placeholder="e.g., Global Research Standard"
            />
          </div>

          <div className="grid grid-cols-2 gap-12">  
            <div className="space-y-6">
              <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                Structure Rules
              </h3>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Required Folders</label>
                <input
                  name="requiredFolders"
                  type="text"
                  defaultValue={template.requiredFolders?.join(", ") || ""}
                  className="w-full p-4 bg-gray-50 border border-gray-50 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Docs/, Src/, Assets/"
                />
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-wider italic">Comma separated directory names</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Required Files</label>
                <input
                  name="requiredFiles"
                  type="text"
                  defaultValue={template.requiredFiles?.join(", ") || ""}
                  className="w-full p-4 bg-gray-50 border border-gray-50 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Report.pdf, Index.ts"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Optional Files</label>
                <input
                  name="optionalFiles"
                  type="text"
                  defaultValue={template.optionalFiles?.join(", ") || ""}
                  className="w-full p-4 bg-gray-50 border border-gray-50 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Readme.md, License.txt"
                />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                Constraint Policies
              </h3>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Global Naming Logic</label>
                <input
                  name="namingRule"
                  type="text"
                  defaultValue={template.namingRule}
                  className="w-full p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-blue-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="YYYY_MM_Customer_Project"
                />
                <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Pro Tip</p>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">For complex condition-based moving or flagging, use the <Link href="/system/rules" className="text-blue-600 font-bold hover:underline">Rules Engine</Link>.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-gray-50 flex justify-end gap-4">
            <Link
              href="/system/templates/select-template"
              className="px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transform hover:-translate-y-1 transition-all active:translate-y-0"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}