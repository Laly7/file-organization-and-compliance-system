"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Folder {
  id: string;
  name: string;
  webUrl: string;
  isFolder: boolean;
}

export default function ScanClient() {
  const router = useRouter();

  const [currentFolderId, setCurrentFolderId] = useState("");
  const [history, setHistory] = useState<{ id: string; name: string }[]>([]);

  const [selectedFolder, setSelectedFolder] = useState<{ id: string; name: string; isFolder: boolean } | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [templateId, setTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    async function fetchFolders() {
      setIsLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/onedrive/folders?folderId=${currentFolderId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || "Failed to load folders");

        setFolders(data.folders || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchFolders();
  }, [currentFolderId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tId = sessionStorage.getItem("scanTemplateId");
    const tName = sessionStorage.getItem("scanTemplate");

    if (tId) setTemplateId(tId);
    if (tName) setTemplateName(tName);
  }, []);

  const handleNext = async () => {
    if (!selectedFolder) return;

    if (!selectedFolder.isFolder) {
      alert("Please select a folder to scan. You cannot scan an individual file.");
      return;
    }

    if (!templateId) {
      alert("No template selected. Please select a template first.");
      router.push("/system/templates/select-template");
      return;
    }

    sessionStorage.setItem("scanFolder", selectedFolder.name);
    sessionStorage.setItem("scanFolderId", selectedFolder.id);

    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          folderId: selectedFolder.id,
          folderName: selectedFolder.name
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Scan failed");

      sessionStorage.setItem("lastScan", JSON.stringify(data.scan));

      router.push("/system/scan/scan-result");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const templateLoaded = !!templateId;

  const handleOpenFolder = (folder: Folder) => {
    setHistory([...history, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
    setSelectedFolder({ id: folder.id, name: folder.name, isFolder: true });
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setHistory([]);
      setCurrentFolderId("");
      setSelectedFolder(null);
    } else {
      const newHistory = history.slice(0, index + 1);
      setHistory(newHistory);
      setCurrentFolderId(newHistory[index].id);
      setSelectedFolder({
        id: newHistory[index].id,
        name: newHistory[index].name,
        isFolder: true
      });
    }
  };

  const selectCurrentFolder = () => {
    if (currentFolderId === "") {
      alert("You cannot scan the Root folder directly. Please select or open a specific subfolder.");
      return;
    }
    setSelectedFolder({
      id: currentFolderId,
      name: currentFolderName,
      isFolder: true
    });
  };

  const currentFolderName = history[history.length - 1]?.name || "Root";

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-black text-center mb-8 uppercase text-slate-900 tracking-wider">
        Select OneDrive Folder
      </h2>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Search Bar Header */}
        <div className="p-6 border-b bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div
            onClick={() => router.push("/system/templates/select-template")}
            className="w-full sm:w-auto flex items-center gap-4 py-3 px-6 bg-blue-50 hover:bg-blue-100/80 border border-blue-100 rounded-2xl cursor-pointer transition-all duration-200 flex-shrink-0 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
            title="Click to change compliance template"
          >
            <span className="text-blue-600 text-2xl flex-shrink-0">📋</span>
            <div className="text-left flex-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                Select Template
              </p>
              <p className="font-black text-blue-700 text-base leading-tight truncate">
                {templateName || "Select Template"}
              </p>
            </div>
            <span className="text-blue-500 text-xs ml-2">✏️</span>
          </div>

          <div className="relative w-full sm:flex-1">
            <input
              className="w-full pl-11 pr-4 py-4 border border-gray-300 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-inner"
              placeholder="Search in current folder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row h-[700px] md:h-[550px]">
          {/* Main Folder Explorer */}
          <div className="flex-1 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-100 flex flex-col min-h-[400px]">
            {/* Breadcrumb Trail */}
            <div className="flex items-center flex-wrap gap-2 mb-6 text-sm text-gray-600 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
              <button 
                onClick={() => navigateToBreadcrumb(-1)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-gray-200/60 font-bold transition ${
                  history.length === 0 ? "text-blue-600 bg-blue-50 border border-blue-100" : "text-gray-500"
                }`}
              >
                ☁️ OneDrive
              </button>
              {history.map((folder, idx) => (
                <div key={folder.id} className="flex items-center gap-2">
                  <span className="text-gray-300">/</span>
                  <button 
                    onClick={() => navigateToBreadcrumb(idx)}
                    className={`px-2.5 py-1.5 rounded-xl hover:bg-gray-200/60 transition font-bold ${
                      idx === history.length - 1 ? "text-blue-600 bg-blue-50 border border-blue-100" : "text-gray-500"
                    }`}
                  >
                    {folder.name}
                  </button>
                </div>
              ))}
            </div>

            {!templateLoaded && (
              <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-xl text-sm font-bold flex items-center gap-2">
                ⚠️ No template selected. Please choose one before scanning.
              </div>
            )}

            {/* List Pane */}
            <div className="flex-1 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-500 font-bold">Loading OneDrive contents...</p>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100">
                  <p className="font-bold flex items-center gap-2">❌ Error loading folder</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              ) : filteredFolders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <p className="text-4xl mb-3">📁</p>
                  <p className="text-lg font-bold">This folder is empty</p>
                  <p className="text-sm mt-1">No files or subfolders found.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredFolders.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedFolder({ id: item.id, name: item.name, isFolder: item.isFolder })}
                      className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-150 border ${
                        selectedFolder?.id === item.id
                          ? "bg-blue-50/80 border-blue-200 text-blue-900 shadow-sm"
                          : "hover:bg-gray-50 border-transparent text-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-xl flex-shrink-0">
                          {item.isFolder ? "📁" : "📄"}
                        </span>
                        <span className="font-bold text-sm truncate">{item.name}</span>
                      </div>

                      {item.isFolder && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFolder(item);
                          }}
                          className="px-3.5 py-1.5 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 hover:shadow text-gray-600 text-xs font-bold rounded-lg transition"
                        >
                          Open
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selection Sidebar Details */}
          <div className="w-full md:w-80 p-6 bg-gray-50 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <h3 className="text-md font-black text-slate-900 border-b pb-2 tracking-wide uppercase">
                Selected Details
              </h3>
              
              {selectedFolder ? (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        selectedFolder.isFolder ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {selectedFolder.isFolder ? "Folder" : "File"}
                      </span>
                      {selectedFolder.isFolder && selectedFolder.id === currentFolderId && (
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          Current Folder
                        </span>
                      )}
                    </div>
                    
                    <p className="font-extrabold text-slate-900 break-words leading-tight text-sm">
                      {selectedFolder.name}
                    </p>
                    
                    <p className="text-[10px] text-gray-500 break-all leading-none">
                      ID: {selectedFolder.id}
                    </p>
                  </div>
                  
                  {!selectedFolder.isFolder && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold leading-normal">
                      ⚠️ Selected item is a file. Please select or open a subfolder to run the scan.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 bg-white border rounded-2xl p-4">
                  <p className="text-3xl">📂</p>
                  <p className="text-sm font-bold mt-2 text-slate-700">No target selected</p>
                  <p className="text-xs mt-1 text-gray-500">Select a subfolder from the list to scan.</p>
                </div>
              )}

              {/* Scan Current Folder option if we are deep inside */}
              {currentFolderId !== "" && (
                <button
                  onClick={selectCurrentFolder}
                  className="w-full py-3 px-4 border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  🎯 Scan Current Folder ({currentFolderName})
                </button>
              )}
            </div>

            <div className="space-y-3 pt-6 border-t mt-6">
              <button
                onClick={() => router.push("/system/dashboard")}
                className="w-full py-3 rounded-xl bg-gray-200 text-gray-800 font-bold hover:bg-gray-300 transition text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleNext}
                disabled={!selectedFolder || !selectedFolder.isFolder}
                className={`w-full py-3 rounded-xl font-bold transition text-sm ${
                  selectedFolder && selectedFolder.isFolder
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100 active:scale-95"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Next Step
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}