"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Folder {
  id: string;
  name: string;
  webUrl: string;
}

export default function ScanClient() {
  const router = useRouter();

  const [selectedFolderId, setSelectedFolderId] = useState("");
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
        const res = await fetch("/api/onedrive/folders");
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
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tId = sessionStorage.getItem("scanTemplateId");
    const tName = sessionStorage.getItem("scanTemplate");

    if (tId) setTemplateId(tId);
    if (tName) setTemplateName(tName);
  }, []);

  const handleNext = async () => {
    const selectedFolder = folders.find(f => f.id === selectedFolderId);

    if (!selectedFolder) return;

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

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  const templateLoaded = !!templateId;

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-8 uppercase text-slate-900">
        Select Folder
      </h2>

      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <input
            className="w-full p-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Search folder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex h-[500px]">
          <div className="flex-1 p-6 overflow-y-auto border-r">
            <div
              onClick={() => router.push("/system/templates/select-template")}
              className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl cursor-pointer hover:bg-blue-100 transition"
            >
              <p className="text-xs font-bold text-gray-500 uppercase">
                Selected Template (click to change)
              </p>

              <p className="font-black text-blue-700">
                {templateName || "No template selected"}
              </p>
            </div>

            {!templateLoaded && (
              <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-xl text-sm font-bold">
                No template selected. Please choose one before scanning.
              </div>
            )}

            {isLoading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <ul className="space-y-2">
                {filteredFolders.map(folder => (
                  <li
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedFolderId === folder.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:underline hover:-translate-y-0.5"
                    }`}
                  >
                    📁 {folder.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="w-80 p-6 bg-gray-50">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Selected Details</h3>
            {selectedFolder ? (
              <div>
                <p className="font-bold text-slate-900">{selectedFolder.name}</p>
                <p className="text-sm text-gray-700 break-all">
                  /OneDrive/{selectedFolder.name}
                </p>
              </div>
            ) : (
              <p className="text-gray-600">No folder selected</p>
            )}

            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 w-full py-3 rounded-xl bg-gray-300 text-gray-900 font-bold hover:bg-gray-400 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleNext}
              disabled={!selectedFolderId}
              className={`mt-3 w-full py-3 rounded-xl font-bold ${
                selectedFolderId
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              Next Step
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}