"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export default function TemplateClient({ templates }: { templates: any[] }) {
   const router = useRouter();
   const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
   const [searchQuery, setSearchQuery] = useState("");

   useEffect(() => {
      if (templates.length > 0 && !selectedTemplateId) {
         setSelectedTemplateId(templates[0].id);
      }
   }, [templates, selectedTemplateId]);

   const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
   const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

   const handleNext = () => {
      if (!selectedTemplateId) return;
   
      const activeTemplate = templates.find(
         t => t.id === selectedTemplateId
      );

      if (!activeTemplate) return;

      sessionStorage.setItem("scanTemplateId", activeTemplate.id);
      sessionStorage.setItem("scanTemplate", activeTemplate.name);

      router.push("/system/scan/select-folder");
   };

   return (
      <main className="flex-1 overflow-y-auto p-10">
         <div className="max-w-6xl mx-auto h-full flex flex-col">
            <h2 className="text-2xl font-black text-gray-800 mb-8 uppercase tracking-widest text-center">Select Template</h2>
            <div className="flex flex-col lg:flex-row gap-10 flex-1 min-h-0 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
               <div className="w-full lg:w-80 min-w-0 flex flex-col border-r border-gray-100 pr-0 lg:pr-8">
                  <div className="mb-6 relative">
                     <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                     </span>
                     <input 
                        type="text" 
                        placeholder="Search Template..." 
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                     />
                  </div>

                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Templates Available</h3>
                  <ul className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                     {filteredTemplates.map((template) => (
                        <li
                           key={template.id}
                           onClick={() => setSelectedTemplateId(template.id)}
                           className={`group flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                              selectedTemplateId === template.id
                                 ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                                 : "hover:bg-gray-50 text-gray-700"
                           }`}
                        >
                           <div className={`h-2 w-2 rounded-full transition-colors ${selectedTemplateId === template.id ? 'bg-white' : 'bg-gray-300 group-hover:bg-blue-400'}`}></div>
                           <span className="font-bold truncate">{template.name}</span>
                        </li>
                     ))}
                     
                     {filteredTemplates.length === 0 && (
                        <div className="text-center py-10 text-gray-400 italic text-sm">No results</div>
                     )}
                  </ul>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                     <Link 
                        href="/system/templates/add-template" 
                        className="w-full py-3 flex items-center justify-center gap-2 bg-gray-50 text-blue-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-50 transition-colors"
                     >
                        <span>+</span> Add New Template
                     </Link>
                  </div>
               </div>

               <div className="flex-1 flex flex-col min-w-0 pl-0 lg:pl-8">
                  {activeTemplate ? (
                     <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                           <div>
                              <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-1">Template Preview</h3>
                              <h4 className="text-3xl font-black text-gray-900">{activeTemplate.name}</h4>
                           </div>
                           <div className="flex gap-2">
                              <Link 
                                 href={`/system/templates/edit-template?id=${activeTemplate.id}`}
                                 className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-xs font-bold uppercase tracking-widest"
                              >
                                 Edit
                              </Link>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1">
                           <div className="space-y-6">
                              <div>
                                 <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Required Folders</p>
                                 <div className="space-y-2">
                                    {activeTemplate.requiredFolders.map((f: string, i: number) => (
                                       <div key={i} className="flex gap-2 items-center text-sm font-bold text-gray-700">
                                          <span className="text-lg opacity-40">📁</span> {f}
                                       </div>
                                    ))}
                                    {activeTemplate.requiredFolders.length === 0 && (
                                       <p className="text-gray-400 italic text-xs">No folders required</p>
                                    )}
                                 </div>
                              </div>

                              <div>
                                 <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Required Files</p>
                                 <div className="space-y-2">
                                    {activeTemplate.requiredFiles.map((f: string, i: number) => (
                                       <div key={i} className="flex gap-2 items-center text-sm font-bold text-gray-700">
                                          <span className="text-lg opacity-40">📄</span> {f}
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-6">
                              <div>
                                 <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Naming Constraint</p>
                                 <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                                    <p className="text-blue-700 font-mono text-xs mb-1">Expected Format:</p>
                                    <p className="text-blue-900 font-black text-lg">{activeTemplate.namingRule}</p>
                                 </div>
                              </div>
                        
                              <div>
                                 <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Optional Tracking</p>
                                 <div className="flex flex-wrap gap-2">
                                    {activeTemplate.optionalFiles.map((f: string, i: number) => (
                                       <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-100 text-gray-500 rounded-lg text-xs font-bold">{f}</span>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="pt-8 mt-auto border-t border-gray-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                           <Link href="/system/scan" className="text-gray-400 font-bold hover:text-gray-600 text-xs uppercase tracking-widest transition-colors flex items-center gap-2 justify-center sm:justify-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                              </svg>
                              Back to Selection
                           </Link>
                           <button 
                              onClick={handleNext}
                              className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transform hover:-translate-y-1 transition-all active:translate-y-0"
                           >
                              Apply Template
                           </button>
                        </div>
                     </>
                  ) : (
                     <div className="flex flex-col items-center justify-center flex-1 opacity-20">
                        <span className="text-8xl mb-4">📋</span>
                        <p className="text-xl font-bold italic">Select a template to preview details</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </main>
   );
}

