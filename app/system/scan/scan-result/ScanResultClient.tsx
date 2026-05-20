"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getTemplateByName, updateScanCompliance } from "@/app/actions";

export default function ScanResultClient() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState<string | null>(null);
  const [hasSelectedFixNow, setHasSelectedFixNow] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'warning', message: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedRuleIds, setSelectedRuleIds] = useState<number[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [fixLogs, setFixLogs] = useState<any[]>([]);
  const [showFixChoice, setShowFixChoice] = useState(false);
  const [pendingFix, setPendingFix] = useState(false);
  const [scanFolder, setScanFolder] = useState<string | null>("");
  const [scanTemplate, setScanTemplate] = useState<string | null>("");
  const [templateData, setTemplateData] = useState<any>(null);
  const [realFiles, setRealFiles] = useState<any[]>([]);

  const [selectedItemToFix, setSelectedItemToFix] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState<string | null>(null);
  const [newNameVal, setNewNameVal] = useState("");
  const [isMovingFile, setIsMovingFile] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [targetFolderSelections, setTargetFolderSelections] = useState<Record<string, string>>({});
  const [appliedFixes, setAppliedFixes] = useState<string[]>([]);

  // Local state for dynamic compliance tracking & OneDrive links
  const [violationsState, setViolationsState] = useState<any[]>([]);
  const [initialCompliance, setInitialCompliance] = useState<number>(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [fileOneDriveUrls, setFileOneDriveUrls] = useState<Record<string, string>>({});

  const requiredFiles = templateData?.requiredFiles || [];
  const requiredFolders = templateData?.requiredFolders || [];

  const realFileNames = realFiles.filter(f => !f.isFolder).map(f => f.name.trim().toLowerCase());
  const realFolderNames = realFiles.filter(f => f.isFolder).map(f => f.name.trim().toLowerCase().replace(/\/$/, ""));

  let missingFiles = requiredFiles.filter((rf: string) => !realFileNames.includes(rf.trim().toLowerCase()));
  let missingFolders = requiredFolders.filter((rf: string) => !realFolderNames.includes(rf.trim().toLowerCase().replace(/\/$/, "")));

  let matchedFiles = realFiles.filter(f => !f.isFolder && requiredFiles.some((rf: string) => rf.trim().toLowerCase() === f.name.trim().toLowerCase()));
  let unknownFiles = realFiles.filter(f => !f.isFolder && !requiredFiles.some((rf: string) => rf.trim().toLowerCase() === f.name.trim().toLowerCase()));

  const misplacedFiles = unknownFiles.filter(f => f.name.includes("Notes") || f.name.includes("budget"));
  const incorrectNames = unknownFiles.filter(f => f.name.toLowerCase().includes("report") && !requiredFiles.includes(f.name));

  const violations = [
    ...missingFiles.map((f: string) => ({
      type: "Missing File",
      file: f
    })),

    ...missingFolders.map((f: string) => ({
      type: "Missing Folder",
      file: f
    })),

    ...incorrectNames.map(f => ({
      type: "Wrong Filename",
      file: f.name
    })),

    ...misplacedFiles.map(f => ({
      type: "Wrong Folder",
      file: f.name
    }))
  ];

  const displayedViolations = violationsState.length > 0
    ? violationsState.filter(v => !(v.type === "Wrong Folder" && v.isSolved))
    : violations.map(v => ({ ...v, isSolved: false, webUrl: null }));

  const hasIssues = hasInitialized 
    ? violationsState.some(v => !v.isSolved)
    : (missingFiles.length > 0 || missingFolders.length > 0 || violations.length > 0);

  const savedScan =
  typeof window !== "undefined"
    ? JSON.parse(sessionStorage.getItem("lastScan") || "null")
    : null;

  console.log("Saved Scan:", savedScan);
  console.log("Compliance:", savedScan?.compliance);
  
  const totalInitialViolations = violationsState.length;
  const solvedCount = violationsState.filter(v => v.isSolved).length;

  const complianceScore = hasInitialized && totalInitialViolations > 0
    ? Math.min(100, Math.round(initialCompliance + (100 - initialCompliance) * (solvedCount / totalInitialViolations)))
    : (savedScan?.compliance ?? 0);

  const markViolationAsSolved = async (fileNameOrFolderName: string, webUrl?: string) => {
    setViolationsState(prev => {
      const updated = prev.map(v => {
        if (v.file.trim().toLowerCase() === fileNameOrFolderName.trim().toLowerCase()) {
          return { ...v, isSolved: true, webUrl: webUrl || v.webUrl };
        }
        return v;
      });

      const solved = updated.filter(v => v.isSolved).length;
      const total = updated.length;
      const newScore = total > 0
        ? Math.min(100, Math.round(initialCompliance + (100 - initialCompliance) * (solved / total)))
        : 100;

      const saved = JSON.parse(sessionStorage.getItem("lastScan") || "{}");
      const updatedScan = { ...saved, compliance: newScore };
      sessionStorage.setItem("lastScan", JSON.stringify(updatedScan));

      if (saved?.id) {
        updateScanCompliance(saved.id, newScore).catch(err => {
          console.error("Failed to update scan compliance in DB:", err);
        });
      }

      if (newScore === 100) {
        setFixed(true);
      }

      return updated;
    });

    if (webUrl) {
      setFileOneDriveUrls(prev => ({ ...prev, [fileNameOrFolderName]: webUrl }));
    }
  };

  const loadScanData = async () => {
    const fn = sessionStorage.getItem("scanFolder");
    const tn = sessionStorage.getItem("scanTemplate");
    const fid = sessionStorage.getItem("scanFolderId");
    
    setScanFolder(fn);
    setScanTemplate(tn);

    let loadedTemplate = null;
    if (tn) {
      loadedTemplate = await getTemplateByName(tn);
      if (loadedTemplate) setTemplateData(loadedTemplate);
    }

    if (fid) {
      try {
        const res = await fetch(`/api/onedrive/files?folderId=${fid}`);
        const data = await res.json();

        if (res.ok) {
          setRealFiles(data.files || []);
        }
      } catch (err) {
        console.error("Failed to load real files", err);
      }
    }
  };

  useEffect(() => {
    async function init() {
      setIsScanning(true);
      await loadScanData();
      setIsScanning(false);

      const isFromReport = sessionStorage.getItem("isFixingFromReport");
      if (isFromReport === "true") {
        setHasSelectedFixNow(true);
        sessionStorage.removeItem("isFixingFromReport");
      }
    }
    init();
  }, []);

  // Initialize violationsState from baseline scan result
  useEffect(() => {
    if (templateData && !hasInitialized) {
      const reqFiles = templateData.requiredFiles || [];
      const reqFolders = templateData.requiredFolders || [];

      const fileNames = realFiles.filter((f: any) => !f.isFolder).map((f: any) => f.name.trim().toLowerCase());
      const folderNames = realFiles.filter((f: any) => f.isFolder).map((f: any) => f.name.trim().toLowerCase().replace(/\/$/, ""));

      const missFiles = reqFiles.filter((rf: string) => !fileNames.includes(rf.trim().toLowerCase()));
      const missFolders = reqFolders.filter((rf: string) => !folderNames.includes(rf.trim().toLowerCase().replace(/\/$/, "")));

      const unkFiles = realFiles.filter((f: any) => !f.isFolder && !reqFiles.some((rf: string) => rf.trim().toLowerCase() === f.name.trim().toLowerCase()));

      const misFiles = unkFiles.filter((f: any) => f.name.includes("Notes") || f.name.includes("budget"));
      const incNames = unkFiles.filter((f: any) => f.name.toLowerCase().includes("report") && !reqFiles.includes(f.name));

      const initialViolations = [
        ...missFiles.map((f: string) => ({
          type: "Missing File",
          file: f,
          isSolved: false,
          webUrl: null
        })),
        ...missFolders.map((f: string) => ({
          type: "Missing Folder",
          file: f,
          isSolved: false,
          webUrl: null
        })),
        ...incNames.map((f: any) => ({
          type: "Wrong Filename",
          file: f.name,
          isSolved: false,
          webUrl: null
        })),
        ...misFiles.map((f: any) => ({
          type: "Wrong Folder",
          file: f.name,
          isSolved: false,
          webUrl: null
        }))
      ];

      setViolationsState(initialViolations);
      
      const saved = JSON.parse(sessionStorage.getItem("lastScan") || "{}");
      const baseComp = saved?.compliance ?? 0;
      setInitialCompliance(baseComp);
      setHasInitialized(true);
    }
  }, [templateData, realFiles, hasInitialized]);


  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSaved && (hasIssues || !fixed)) {
        e.preventDefault();
        e.returnValue = "Changes you made may not be saved.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSaved, fixed, hasIssues]);

  useEffect(() => {
    const handleInternalClick = (e: MouseEvent) => {
      if (isSaved || (!hasIssues && fixed)) return;
      
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && link.origin === window.location.origin && !link.href.includes('/scan-result')) {
        const confirmed = window.confirm("You have unsaved scan results. Are you sure you want to leave?");

        if (!confirmed) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    
    document.addEventListener('click', handleInternalClick, true);
    return () => document.removeEventListener('click', handleInternalClick, true);
  }, [isSaved, missingFiles.length, fixed]);

  useEffect(() => {
  async function loadRules() {
    try {
      const res = await fetch("/api/rules");
      const data = await res.json();

      if (res.ok) {
        setRules(data.rules || []);
      }

    } catch (err) {
      console.error(err);
    }
  }
    loadRules();
  }, []);

  const showNotification = (type: 'success' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const folderId = sessionStorage.getItem("scanFolderId");
    if (!folderId) {
      alert("Folder ID not found.");
      return;
    }

    setIsUploading(targetName);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("targetName", targetName);
    formData.append("folderId", folderId);

    try {
      const res = await fetch("/api/onedrive/upload", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const webUrl = data.file?.webUrl;

        showNotification('success', `File "${file.name}" uploaded successfully!`);

        if (webUrl) {
          window.open(webUrl, "_blank");
        }

        await markViolationAsSolved(targetName, webUrl);
        await loadScanData();
      } else {
        const err = await res.json();
        alert(`Upload failed: ${err.error || "Unknown error"}\nDetails: ${JSON.stringify(err.details || {})}`);
      }
    } catch (err) {
      console.error("Upload Error:", err);
      alert("Network error during upload.");
    } finally {
      setIsUploading(null);
    }
  };

  const handleCreateFolder = async (folderName: string) => {
    const parentFolderId = sessionStorage.getItem("scanFolderId");
    if (!parentFolderId) {
      alert("Folder ID not found.");
      return;
    }

    setIsCreatingFolder(folderName);

    try {
      const res = await fetch("/api/onedrive/create-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId: parentFolderId,
          folderName
        })
      });

      if (res.ok) {
        const data = await res.json();
        const webUrl = data.folder?.webUrl;

        showNotification('success', `Folder "${folderName}" created successfully!`);

        await markViolationAsSolved(folderName, webUrl);
        await loadScanData();
      } else {
        const err = await res.json();
        alert(`Folder creation failed: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Create Folder Error:", err);
      alert("Network error during folder creation.");
    } finally {
      setIsCreatingFolder(null);
    }
  };

  const handleMoveFile = async (fileId: string, targetFolderName: string, fileName: string) => {
    setIsMovingFile(fileId);
    try {
      const targetFolder = realFiles.find(
        f => f.isFolder && f.name.toLowerCase().replace(/\/$/, "") === targetFolderName.toLowerCase().replace(/\/$/, "")
      );

      if (!targetFolder) {
        alert(`Target folder "${targetFolderName}" not found in OneDrive. Please create it first.`);
        return;
      }

      const res = await fetch("/api/onedrive/move-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          targetFolderId: targetFolder.id
        })
      });

      if (res.ok) {
        showNotification('success', `Moved "${fileName}" to correct folder "${targetFolderName}"!`);
        await markViolationAsSolved(fileName);
        await loadScanData();
      } else {
        const err = await res.json();
        alert(`Failed to move file: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Move File Error:", err);
      alert("Network error during file move.");
    } finally {
      setIsMovingFile(null);
    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    if (!newName.trim()) return;
    setIsRenaming(fileId);
    try {
      const res = await fetch("/api/onedrive/rename-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          newName
        })
      });

      if (res.ok) {
        const data = await res.json();
        const webUrl = data.file?.webUrl;

        showNotification('success', `Renamed successfully to "${newName}"!`);

        const oldFileObj = realFiles.find(f => f.id === fileId);
        if (oldFileObj) {
          await markViolationAsSolved(oldFileObj.name, webUrl);
        }

        setEditingFileName(null);
        await loadScanData();
      } else {
        const err = await res.json();
        alert(`Rename failed: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Rename Error:", err);
      alert("Network error during rename.");
    } finally {
      setIsRenaming(null);
    }
  };

  const handleConfirm = async () => {
    setIsConfirming(true);

    try {
      setIsSaved(true);

      showNotification(
        "success",
        "Scan report confirmed successfully."
      );

      sessionStorage.removeItem("scanFolder");
      sessionStorage.removeItem("scanTemplate");
      sessionStorage.removeItem("scanFolderId");

      router.push("/system/report");
    } catch (err) {
      console.error(err);
      alert("Network error confirming scan.");
    } finally {
      setIsConfirming(false);
    }
  };

  const applyFixRules = async () => {
    try {
      setIsFixing(true);

      const templateId = sessionStorage.getItem("scanTemplateId");
      const folderId = sessionStorage.getItem("scanFolderId");

      const res = await fetch(
        "/api/scans/fix-files",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            templateId,
            folderId,
            selectedRuleIds
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Fix failed"
        );
      }

      setFixLogs(data.logs || []);
      await loadScanData();

      if (selectedItemToFix && !appliedFixes.includes(selectedItemToFix)) {
        setAppliedFixes((prev) => [...prev, selectedItemToFix]);
      }

      setShowRuleModal(false);

      // Only mark violations as solved if they were actually processed and fixed by a rule engine action
      for (const log of (data.logs || [])) {
        const isFixAction = log.action && (
          log.action.startsWith("Renamed → ") ||
          log.action.startsWith("Moved → ") ||
          log.action.startsWith("Copied → ")
        );

        if (isFixAction) {
          let solvedWebUrl: string | undefined = undefined;
          let searchName = log.file;
          if (log.action.startsWith("Renamed → ")) {
            searchName = log.action.replace("Renamed → ", "");
          }
          
          const fid = sessionStorage.getItem("scanFolderId");
          if (fid) {
            try {
              const filesRes = await fetch(`/api/onedrive/files?folderId=${fid}`);
              const filesData = await filesRes.json();
              const foundFile = (filesData.files || []).find((f: any) => f.name.toLowerCase() === searchName.toLowerCase());
              if (foundFile) {
                solvedWebUrl = foundFile.webUrl;
              }
            } catch (err) {
              console.error("Error fetching files to find renamed webUrl:", err);
            }
          }

          await markViolationAsSolved(log.file, solvedWebUrl);
        }
      }

      const updatedFiles = await fetch(
        `/api/onedrive/files?folderId=${sessionStorage.getItem("scanFolderId")}`
      ).then(res => res.json());

      const newFiles = updatedFiles.files || [];
      const newFileNames = newFiles.map((f: any) =>
        f.name.trim().toLowerCase()
      );

      const newMissing = requiredFiles.filter(
        (rf: string) => !newFileNames.includes(rf.toLowerCase())
      );

      const newCompliance =
        requiredFiles.length === 0
          ? 100
          : Math.round(
            ((requiredFiles.length - newMissing.length) / 
              requiredFiles.length) * 
              100
          );

      sessionStorage.setItem(
        "lastScan",
        JSON.stringify({
          compliance: newCompliance
        })
      );

      setFixed(newCompliance === 100);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsFixing(false);
    }
  };

  if (isScanning) {
    return (
      <div className="flex h-screen bg-gray-100 p-10 items-center justify-center">
        <div className="bg-white p-10 rounded-xl shadow-md text-center flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-700 font-semibold text-lg tracking-widest">ANALYZING REAL-TIME COMPLIANCE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-full relative">
      {notification && (
        <div className={`fixed top-10 right-10 z-50 animate-in fade-in slide-in-from-top-4 duration-300 ${
            notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20`}
        >
          <span className="text-xl">{notification.type === 'success' ? '✅' : '⚠️'}</span>
          <span className="font-bold tracking-tight">{notification.message}</span>
        </div>
      )}

      <h2 className="text-2xl font-black text-gray-800 mb-8 uppercase tracking-widest text-center">Scan Result</h2>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-10 flex flex-col gap-8 flex-1">  
        <div className="flex justify-between items-center bg-gray-50 p-8 rounded-3xl border border-gray-100">
          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Analysis Target</p>
            <div className="flex flex-col">
              <span className="text-gray-900 font-black text-xl flex items-center gap-2">
                <span className="opacity-40">📁</span> {scanFolder}
              </span>

              <span className="text-blue-600 font-bold text-sm">Template: {scanTemplate}</span>
            </div>
          </div>

          <div className={`p-8 rounded-[2rem] text-center min-w-[200px] border-4 transition-all duration-500 ${
            (fixed || complianceScore === 100) 
              ? 'bg-green-50 border-green-400 text-green-700 shadow-lg shadow-green-100' 
              : (complianceScore >= 80 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-red-50 border-red-200 text-red-500')
            }`}
          >
            <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-60">System Compliance</p>
            <p className="text-5xl font-black italic tracking-tighter">{fixed ? '100%' : `${complianceScore}%`}</p>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <div className="grid grid-cols-1 gap-6">
            {fixLogs.length > 0 && (
              <div className="bg-emerald-50/80 backdrop-blur-md rounded-2xl p-6 border border-emerald-200 shadow-sm animate-in fade-in duration-300">
                <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span>⚡</span> Rule Execution Logs
                </h3>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                  {fixLogs.map((log, index) => (
                    <div key={index} className="bg-white/80 p-3 rounded-xl border border-emerald-100 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-gray-800">{log.file}</span>
                        <span className="text-gray-400 mx-2">|</span>
                        <span className="text-gray-600">Rule: {log.rule}</span>
                      </div>
                      <span className="text-emerald-600 font-bold uppercase tracking-wider text-[10px]">{log.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between pl-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Required Compliance</h4>
                  <button 
                    onClick={() => loadScanData()} 
                    title="Manual Refresh"
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 text-gray-400 ${isScanning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                
                {!isSaved && hasIssues && (
                  <span className="animate-pulse bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Unsaved Actions</span>
                )}
              </div>

              <div className="bg-gray-50/50 rounded-3xl p-6 space-y-4 max-h-[480px] overflow-y-auto border border-gray-100 shadow-inner">
                <div className="space-y-3">
                  {displayedViolations.length === 0 ? (
                    <div className="text-emerald-600 font-bold p-8 text-center flex flex-col items-center justify-center gap-2">
                      <span className="text-4xl animate-bounce">🎉</span>
                      <span className="text-lg font-black uppercase tracking-widest">No issues found</span>
                      <span className="text-xs text-gray-400 font-medium">All systems fully compliant!</span>
                    </div>
                  ) : (
                    displayedViolations.map((v, index) => {
                      const isSelected = selectedItemToFix === v.file;
                      // For Move action
                      const misplacedFile = realFiles.find(f => !f.isFolder && f.name.trim().toLowerCase() === v.file.trim().toLowerCase());
                      const folderRule = rules.find(r => r.type === "folder" && r.condition.folder);
                      const targetFolder = folderRule ? folderRule.condition.folder : (templateData?.requiredFolders?.[0] || "Docs");
                      // For Rename action
                      const wrongNameFile = realFiles.find(f => !f.isFolder && f.name.trim().toLowerCase() === v.file.trim().toLowerCase());

                      return (
                        <div
                          key={index}
                          onClick={() => {
                            if (v.isSolved) return;
                            setSelectedItemToFix(isSelected ? null : v.file);
                            if (!isSelected && wrongNameFile) {
                              setNewNameVal(wrongNameFile.name);
                            }
                          }}
                          className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border transition-all duration-300 ${
                            v.isSolved
                              ? 'bg-emerald-50/40 border-emerald-200/50 backdrop-blur-sm shadow-emerald-50/10 cursor-default'
                              : isSelected
                              ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-100 shadow-md scale-[1.01] cursor-pointer'
                              : 'bg-red-50/80 border-red-100 hover:border-red-300 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <span className="flex-shrink-0">
                              {v.isSolved ? (
                                <div className="bg-emerald-100 p-1.5 rounded-full border border-emerald-200 shadow-sm animate-pulse">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="bg-red-50 p-1 rounded-full border border-red-100">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </div>
                              )}
                            </span>
                            
                            <div className="flex flex-col flex-1">
                              <span className={`font-bold text-sm truncate flex items-center gap-2 ${v.isSolved ? 'text-emerald-800' : 'text-red-700'}`}>
                                {v.type === "Missing Folder" || v.type === "Wrong Folder" ? "📁" : "📄"} 
                                {v.type === "Wrong Filename" && wrongNameFile && isSelected && !v.isSolved ? (
                                  <input
                                    autoFocus
                                    type="text"
                                    value={newNameVal}
                                    onChange={(e) => setNewNameVal(e.target.value)}
                                    onBlur={() => handleRenameFile(wrongNameFile.id, newNameVal)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleRenameFile(wrongNameFile.id, newNameVal);
                                    }}
                                    className="border-b-2 border-blue-500 bg-transparent focus:outline-none text-red-700 px-1 py-0.5 w-full max-w-[200px]"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : v.type === "Wrong Filename" && wrongNameFile && !isSelected ? (
                                  <span className="underline decoration-red-300 decoration-wavy underline-offset-2">{v.file}</span>
                                ) : (
                                  v.file
                                )}
                                {v.isSolved && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                    Solved
                                  </span>
                                )}
                              </span>
                              <span className={`text-[10px] uppercase tracking-wider mt-1 ${v.isSolved ? 'text-emerald-600/80 font-bold' : 'text-gray-500'}`}>
                                {v.type === "Missing File" || v.type === "Missing Folder" 
                                  ? "Missing Report File/Folder" 
                                  : v.type === "Wrong Folder" 
                                  ? "Wrong Placement" 
                                  : v.type === "Wrong Filename" 
                                  ? `Wrong Filename ${templateData?.namingRule ? `(Format ${templateData.namingRule})` : ''}`
                                  : v.type}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {v.isSolved ? (
                              v.webUrl ? (
                                <a
                                  href={v.webUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100/50 transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-1.5"
                                >
                                  🔗 View in OneDrive
                                </a>
                              ) : (
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100/50 px-3 py-1.5 rounded-lg">
                                  Resolved
                                </span>
                              )
                            ) : (
                              <>
                                {isSelected && !appliedFixes.includes(v.file) && v.type === "Wrong Folder" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedItemToFix(v.file);
                                      setShowRuleModal(true);
                                    }}
                                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm transition-all"
                                  >
                                    🔧 Fix Files
                                  </button>
                                )}

                                {isSelected && v.type === "Missing File" && (
                                  <>
                                    <input
                                      type="file"
                                      id={`upload-${v.file}`}
                                      className="hidden"
                                      onChange={(e) => handleFileUpload(e, v.file)}
                                    />
                                    <label
                                      htmlFor={`upload-${v.file}`}
                                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all ${
                                        isUploading === v.file
                                          ? "bg-gray-100 text-gray-400"
                                          : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                      }`}
                                    >
                                      {isUploading === v.file ? "Uploading..." : "Upload"}
                                    </label>
                                  </>
                                )}

                                {isSelected && appliedFixes.includes(v.file) && v.type === "Wrong Folder" && misplacedFile && (
                                  <>
                                    <select
                                      value={targetFolderSelections[misplacedFile.id] || targetFolder}
                                      onChange={(e) => setTargetFolderSelections({
                                        ...targetFolderSelections,
                                        [misplacedFile.id]: e.target.value
                                      })}
                                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white focus:outline-none"
                                    >
                                      {realFiles.filter(f => f.isFolder).map(f => {
                                        const cleanFolderName = f.name.replace(/\/$/, "");
                                        return (
                                          <option key={f.id} value={cleanFolderName}>
                                            📁 {cleanFolderName}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    <button
                                      onClick={() => handleMoveFile(misplacedFile.id, targetFolderSelections[misplacedFile.id] || targetFolder, misplacedFile.name)}
                                      disabled={isMovingFile === misplacedFile.id}
                                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-all ${
                                        isMovingFile === misplacedFile.id
                                          ? "bg-gray-400 cursor-not-allowed"
                                          : "bg-yellow-600 hover:bg-yellow-700 cursor-pointer"
                                      }`}
                                    >
                                      {isMovingFile === misplacedFile.id ? "Moving..." : "Move File"}
                                    </button>
                                  </>
                                )}
                                
                                {isSelected && v.type === "Missing Folder" && (
                                  <button
                                    onClick={() => handleCreateFolder(v.file)}
                                    disabled={isCreatingFolder === v.file}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all ${
                                      isCreatingFolder === v.file
                                        ? "bg-gray-100 text-gray-400"
                                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                    }`}
                                  >
                                    {isCreatingFolder === v.file ? "Creating..." : "Create Folder"}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {showFixChoice && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 w-[420px]">
              <h3 className="text-xl font-black mb-4">
                Fix detected issues?
              </h3>

              <p className="text-sm text-gray-500 mb-6">
                Choose how you want to handle the problems.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowFixChoice(false);
                    setShowRuleModal(true);
                    setHasSelectedFixNow(true);
                  }}
                  className="bg-blue-600 text-white py-3 rounded-xl font-bold"
                >
                  Fix Now
                </button>

                <button
                  onClick={() => {
                    setShowFixChoice(false);
                    setPendingFix(true);

                    sessionStorage.setItem(
                      "pendingFix",
                      JSON.stringify(violations)
                    );

                    showNotification(
                      "warning",
                      "Saved for later fixing"
                    );
                  }}
                  className="bg-gray-200 text-gray-700 py-3 rounded-xl font-bold"
                >
                  Fix Later
                </button>
              </div>
            </div>
          </div>
        )}

        {showRuleModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 w-[500px] max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-black mb-6">
                Select Fix Rules
              </h3>

              <div className="space-y-3">
                {rules.map((rule) => (
                  <label
                    key={rule.id}
                    className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRuleIds.includes(rule.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRuleIds([
                            ...selectedRuleIds,
                            rule.id
                          ]);
                        } else {
                          setSelectedRuleIds(
                            selectedRuleIds.filter(
                              id => id !== rule.id
                            )
                          );
                        }
                      }}
                    />
                    
                    <div>
                      <p className="font-bold">
                        {rule.name}
                      </p>

                      <p className="text-xs text-gray-500">
                        {rule.condition}
                      </p>
                    </div>

                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowRuleModal(false)}
                  className="px-6 py-3 rounded-xl bg-gray-200 font-bold"
                >
                  Cancel
                </button>

                <button
                  onClick={applyFixRules}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold"
                >
                  Apply Rules
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="pt-8 border-t border-gray-100 flex justify-end items-center">
          <div className="flex gap-4">
            <button
              onClick={handleConfirm}
              disabled={isConfirming || isFixing}
              title="Finalize scan, save report, and store metadata in history"
              className={`px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 ${
                (isConfirming || isFixing) ? "bg-gray-100 text-gray-300" : "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700"
              }`}
            >
              {isConfirming ? "Securing Data..." : "Confirm & Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="h-10 shrink-0" /> {/* Bottom spacer for better scroll room */}
    </div>
  );
}
