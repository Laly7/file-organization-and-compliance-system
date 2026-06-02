"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getTemplateByName } from "@/app/actions";

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
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);
  type FileEntry = { id: string; name: string; isFolder: boolean; webUrl?: string };
  type Rule = { id: string; name: string; type: string; condition?: Record<string, unknown> };
  type FixLog = { file: string; rule?: string; action?: string };
  type Violation = { type: string; file: string; expected?: string; isSolved?: boolean; webUrl?: string | null; id?: string; previouslyFixed?: boolean };

  const [rules, setRules] = useState<Rule[]>([]);
  const [fixLogs, setFixLogs] = useState<FixLog[]>([]);
  const [showFixChoice, setShowFixChoice] = useState(false);
  const [pendingFix, setPendingFix] = useState(false);
  const [scanFolder, setScanFolder] = useState<string | null>("");
  const [scanTemplate, setScanTemplate] = useState<string | null>("");
  type TemplateData = { requiredFiles?: string[]; requiredFolders?: string[]; optionalFiles?: string[]; namingRule?: string };
  type ScanLog = { file: string; rule?: string; expected?: string; webUrl?: string };
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [realFiles, setRealFiles] = useState<FileEntry[]>([]);

  const [selectedItemToFix, setSelectedItemToFix] = useState<string | null>(null);
  // editingFileName removed — use modal rename instead
  const [newNameVal, setNewNameVal] = useState("");
  const [isMovingFile, setIsMovingFile] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [isVerifyingMove, setIsVerifyingMove] = useState(false);
  const [issueTargetFolder, setIssueTargetFolder] = useState<string>("");
  const [appliedFixes, setAppliedFixes] = useState<string[]>([]);

  // Local state for dynamic compliance tracking & OneDrive links
  const [violationsState, setViolationsState] = useState<Violation[]>([]);
  const [isFixingFromReport, setIsFixingFromReport] = useState(false);
  const [initialCompliance, setInitialCompliance] = useState<number>(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [fileOneDriveUrls, setFileOneDriveUrls] = useState<Record<string, string>>({});

  const computeCurrentViolations = (template: TemplateData | null, files: FileEntry[]) => {
    const requiredFiles = template?.requiredFiles || [];
    const requiredFolders = template?.requiredFolders || [];
    const optionalFiles = template?.optionalFiles || [];
    const fileEntries = files.filter((f: FileEntry) => !f.isFolder);
    const usedFileIds = new Set<string>();

    const missingFiles: string[] = [];
    const missingFolders: string[] = requiredFolders.filter((rf: string) => {
      const rfNorm = rf.trim().toLowerCase().replace(/\/$/, "");
      return !files.some(f => f.isFolder && f.name.trim().toLowerCase().replace(/\/$/, "") === rfNorm);
    });

    const wrongFilenameFiles: Array<{ entry: FileEntry; expected: string }> = [];
    const otherUnknownFiles: FileEntry[] = [];

    requiredFiles.forEach((rf: string) => {
      const rfTrim = rf.trim();
      const exactCaseSensitive = fileEntries.find((f: FileEntry) => f.name.trim() === rfTrim);
      if (exactCaseSensitive) {
        usedFileIds.add(exactCaseSensitive.id);
        return;
      }

      const exactCaseInsensitive = fileEntries.find((f: FileEntry) => !usedFileIds.has(f.id) && f.name.trim().toLowerCase() === rfTrim.toLowerCase());
      if (exactCaseInsensitive) {
        usedFileIds.add(exactCaseInsensitive.id);
        wrongFilenameFiles.push({ entry: exactCaseInsensitive, expected: rfTrim });
        return;
      }

      const rfTokens = normalizeTokens(rfTrim);
      const candidate = fileEntries.find((f: FileEntry) => {
        if (usedFileIds.has(f.id)) return false;
        const tokens = normalizeTokens(f.name);
        const common = tokens.filter(t => rfTokens.includes(t));
        return common.length > 0;
      });

      if (candidate) {
        usedFileIds.add(candidate.id);
        wrongFilenameFiles.push({ entry: candidate, expected: rfTrim });
      } else {
        missingFiles.push(rfTrim);
      }
    });

    fileEntries.forEach((f: FileEntry) => {
      if (!usedFileIds.has(f.id) && !requiredFiles.some((rf: string) => rf.trim().toLowerCase() === f.name.trim().toLowerCase()) && !optionalFiles.some((of: string) => of.trim().toLowerCase() === f.name.trim().toLowerCase())) {
        otherUnknownFiles.push(f);
      }
    });

    return [
      ...missingFiles.map((f: string) => ({ type: "Missing File", file: f, isSolved: false, webUrl: null })),
      ...missingFolders.map((f: string) => ({ type: "Missing Folder", file: f, isSolved: false, webUrl: null })),
      ...wrongFilenameFiles.map(w => ({ type: "Wrong Filename", file: w.entry.name, expected: w.expected, isSolved: false, webUrl: null, id: w.entry.id })),
      ...otherUnknownFiles.map((f: FileEntry) => ({ type: "Wrong Folder", file: f.name, isSolved: false, webUrl: null, id: f.id }))
    ];
  };
  const [dataLoadedFromApi, setDataLoadedFromApi] = useState(false);
  const requiredFiles = templateData?.requiredFiles || [];
  const requiredFolders = templateData?.requiredFolders || [];
  const optionalFiles = templateData?.optionalFiles || [];

  const normalizeTokens = (name: string) => {
    return name
      .replace(/\.[^/.]+$/, "")
      .split(/[^a-z0-9]+/i)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
  };

  const fileEntries = realFiles.filter(f => !f.isFolder);

  const usedFileIds = new Set<string>();

  const missingFiles: string[] = [];
  const missingFolders: string[] = requiredFolders.filter((rf: string) => {
    const rfNorm = rf.trim().toLowerCase().replace(/\/$/, "");
    return !realFiles.some(f => f.isFolder && f.name.trim().toLowerCase().replace(/\/$/, "") === rfNorm);
  });

  const wrongFilenameFiles: Array<{ entry: FileEntry; expected: string }> = [];
  const otherUnknownFiles: FileEntry[] = [];

  // Match required files: exact case-sensitive matches first, then case-insensitive, then fuzzy/token matches
  requiredFiles.forEach((rf: string) => {
    const rfTrim = rf.trim();
    
    // First check for exact case-sensitive match
    const exactCaseSensitive = fileEntries.find((f: FileEntry) => f.name.trim() === rfTrim);
    if (exactCaseSensitive) {
      usedFileIds.add(exactCaseSensitive.id);
      return;
    }

    // Then check for case-insensitive match (wrong case)
    const exactCaseInsensitive = fileEntries.find((f: FileEntry) => !usedFileIds.has(f.id) && f.name.trim().toLowerCase() === rfTrim.toLowerCase());
    if (exactCaseInsensitive) {
      usedFileIds.add(exactCaseInsensitive.id);
      wrongFilenameFiles.push({ entry: exactCaseInsensitive, expected: rfTrim });
      return;
    }

    // Finally try token-based matching
    const rfTokens = normalizeTokens(rfTrim);
    const candidate = fileEntries.find((f: FileEntry) => {
      if (usedFileIds.has(f.id)) return false;
      const tokens = normalizeTokens(f.name);
      const common = tokens.filter(t => rfTokens.includes(t));
      return common.length > 0;
    });

    if (candidate) {
      usedFileIds.add(candidate.id);
      wrongFilenameFiles.push({ entry: candidate, expected: rfTrim });
    } else {
      missingFiles.push(rfTrim);
    }
  });

  // Remaining files: exclude optional files, mark unknown ones as wrong-folder
  fileEntries.forEach((f: FileEntry) => {
    if (!usedFileIds.has(f.id) && !requiredFiles.some((rf: string) => rf.trim().toLowerCase() === f.name.trim().toLowerCase()) && !optionalFiles.some((of: string) => of.trim().toLowerCase() === f.name.trim().toLowerCase())) {
      otherUnknownFiles.push(f);
    }
  });

  const violations: Violation[] = [
    ...missingFiles.map((f: string) => ({ type: "Missing File", file: f })),
    ...missingFolders.map((f: string) => ({ type: "Missing Folder", file: f })),
    ...wrongFilenameFiles.map(w => ({ type: "Wrong Filename", file: w.entry.name, expected: w.expected, id: w.entry.id, webUrl: w.entry.webUrl })),
    ...otherUnknownFiles.map(f => ({ type: "Wrong Folder", file: f.name, id: f.id, webUrl: f.webUrl }))
  ];

  const displayedViolations = violationsState.length > 0
    ? violationsState.filter(v => !(v.type === "Wrong Folder" && v.isSolved))
    : violations.map(v => ({ ...v, isSolved: false, webUrl: null }));

  const complianceItems: Violation[] = displayedViolations;

  const selectedViolation = displayedViolations.find(v => v.file === selectedItemToFix) || null;

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

  const complianceScore = hasInitialized
    ? (totalInitialViolations > 0
        ? Math.min(100, Math.round(initialCompliance + (100 - initialCompliance) * (solvedCount / totalInitialViolations)))
        : 100)
    : (savedScan?.compliance ?? 0);

  const markViolationAsSolved = async (fileNameOrFolderName: string, webUrl?: string) => {
    const saved = JSON.parse(sessionStorage.getItem("lastScan") || "{}");
    const existingCloneId = sessionStorage.getItem("fixReportCloneId");
    const originalScanId = saved?.id;

    let targetId = existingCloneId || originalScanId;
    let updatedScan = { ...saved, compliance: 0 };

    // Use functional state update to ensure we operate on freshest violationsState
    let updatedViolations: typeof violationsState = [];
    setViolationsState(prev => {
      updatedViolations = prev.map(v => {
        if (v.file.trim().toLowerCase() === fileNameOrFolderName.trim().toLowerCase()) {
          return { ...v, isSolved: true, webUrl: webUrl || v.webUrl };
        }
        return v;
      });
      return updatedViolations;
    });

    const solved = updatedViolations.filter(v => v.isSolved).length;
    const total = updatedViolations.length;

    // Recalculate compliance based on actual files in the folder (preferred source of truth)
    let newScore = 100;
    try {
      const fid = sessionStorage.getItem("scanFolderId");
      if (fid) {
        const res = await fetch(`/api/onedrive/files?folderId=${fid}`);
        const data = await res.json();
        const currentFiles: FileEntry[] = data.files || [];
        const fileNames = currentFiles.map(f => f.name.trim().toLowerCase());
        const reqCount = requiredFiles.length || 0;
        if (reqCount === 0) {
          newScore = 100;
        } else {
          const satisfied = requiredFiles.filter(rf => fileNames.includes(rf.trim().toLowerCase())).length;
          newScore = Math.round((satisfied / reqCount) * 100);
        }
      } else {
        // Fallback to violation-based percentage if folder id missing
        newScore = total > 0 ? Math.round(( (total - (total - solved)) / total) * 100) : 100;
      }
    } catch (err) {
      console.error("Error computing compliance from files:", err);
      newScore = total > 0 ? Math.min(100, Math.round(initialCompliance + (100 - initialCompliance) * (solved / total))) : 100;
    }

    // ALWAYS create a clone on first fix (whether from report or fresh scan)
    // This preserves the original scan record and creates a new entry for the fix attempt
    if (originalScanId && !existingCloneId) {
      try {
        const response = await fetch("/api/scans/clone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: originalScanId, compliance: newScore })
        });

        const clone = await response.json() as { id?: string; [key: string]: unknown };
        if (response.ok && clone?.id) {
          targetId = clone.id;
          updatedScan = { ...clone, compliance: newScore };
          sessionStorage.setItem("fixReportCloneId", clone.id);
          sessionStorage.setItem("newClonedReport", JSON.stringify(updatedScan));
        } else {
          console.error("Failed to clone scan record:", clone?.error || "Unknown error");
          targetId = undefined;
        }
      } catch (err) {
        console.error("Failed to clone scan record:", err);
        targetId = undefined;
      }
    } else if (existingCloneId) {
      targetId = existingCloneId;
    }

    if (!updatedScan.id && saved?.id) {
      updatedScan = { ...updatedScan, ...saved };
    }

    if (targetId) {
      updatedScan = { ...updatedScan, id: targetId, compliance: newScore };
    } else {
      updatedScan = { ...updatedScan, compliance: newScore };
    }

    sessionStorage.setItem("lastScan", JSON.stringify(updatedScan));

    if ((isFixingFromReport || existingCloneId) && targetId) {
      sessionStorage.setItem("newClonedReport", JSON.stringify(updatedScan));
    }

    // Update the cloned record with the new compliance score
    // No longer using updateScanCompliance which updated in place
    if (targetId && existingCloneId) {
      // If we already have a clone, update it via the update endpoint
      await fetch("/api/scans/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetId, updates: { compliance: newScore } })
      }).catch(err => {
        console.error("Failed to update cloned scan compliance in DB:", err);
      });
    }

    if (webUrl) {
      setFileOneDriveUrls(prev => ({ ...prev, [fileNameOrFolderName]: webUrl }));
    }

    setViolationsState(updatedViolations);
    if (newScore === 100) {
      setFixed(true);
    }

    return updatedViolations;
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

    let currentFilesData: FileEntry[] = [];
    if (fid) {
      try {
        const res = await fetch(`/api/onedrive/files?folderId=${fid}`);
        const data = await res.json();

        if (res.ok) {
          currentFilesData = data.files || [];
          setRealFiles(currentFilesData);
        }
      } catch (err) {
        console.error("Failed to load real files", err);
      }
    }

    // Mark data loading as complete
    setDataLoadedFromApi(true);

  };

  useEffect(() => {
    async function init() {
      setIsScanning(true);
      await loadScanData();
      setIsScanning(false);

      const isFromReport = sessionStorage.getItem("isFixingFromReport") === "true";
      if (isFromReport) {
        setIsFixingFromReport(true);
        sessionStorage.removeItem("isFixingFromReport");
      }
    }
    init();
  }, []);

  // Initialize violationsState from baseline scan result
  // Fixed: Wait for real API data to be loaded before calculating violations
  useEffect(() => {
    if (templateData && dataLoadedFromApi && !hasInitialized) {
      const reqFiles = templateData.requiredFiles || [];
      const reqFolders = templateData.requiredFolders || [];

      const fileEntriesLocal = realFiles.filter((f: FileEntry) => !f.isFolder);
      const usedFileIdsLocal = new Set<string>();

      const missingFilesLocal: string[] = [];
      const missingFoldersLocal: string[] = reqFolders.filter((rf: string) => {
        const rfNorm = rf.trim().toLowerCase().replace(/\/$/, "");
        return !realFiles.some((f: FileEntry) => f.isFolder && f.name.trim().toLowerCase().replace(/\/$/, "") === rfNorm);
      });

      const wrongFilenameLocal: Array<{ entry: FileEntry; expected: string }> = [];
      const otherUnknownLocal: FileEntry[] = [];

      const normalizeTokensLocal = (name: string) => {
        return name.replace(/\.[^/.]+$/, "").split(/[^a-z0-9]+/i).map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      };

      reqFiles.forEach((rf: string) => {
        const rfTrim = rf.trim();
        const exact = fileEntriesLocal.find((f: FileEntry) => f.name.trim().toLowerCase() === rfTrim.toLowerCase());
        if (exact) {
          usedFileIdsLocal.add(exact.id);
          return;
        }

        const rfTokens = normalizeTokensLocal(rfTrim);
        const candidate = fileEntriesLocal.find((f: FileEntry) => {
          if (usedFileIdsLocal.has(f.id)) return false;
          const tokens = normalizeTokensLocal(f.name);
          const common = tokens.filter((t: string) => rfTokens.includes(t));
          return common.length > 0;
        });

        if (candidate) {
          usedFileIdsLocal.add(candidate.id);
          wrongFilenameLocal.push({ entry: candidate, expected: rfTrim });
        } else {
          missingFilesLocal.push(rfTrim);
        }
      });

      fileEntriesLocal.forEach((f: FileEntry) => {
        if (!usedFileIdsLocal.has(f.id) && !reqFiles.some((rf: string) => rf.trim().toLowerCase() === f.name.trim().toLowerCase()) && !optionalFiles.some((of: string) => of.trim().toLowerCase() === f.name.trim().toLowerCase())) {
          otherUnknownLocal.push(f);
        }
      });

      const saved = typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("lastScan") || "{}") : {};
      const savedLogs = Array.isArray(saved?.logs) ? saved.logs : [];
      const isFixOpening = isFixingFromReport;

      const savedLogViolations: Violation[] = savedLogs.length > 0 && !isFixOpening
        ? savedLogs.map((log: any) => ({
          type: log.type || log.rule || "Violation",
          file: log.file,
          expected: log.expected || undefined,
          isSolved: false,
          webUrl: log.webUrl || null,
          id: log.id
        }))
        : [];

      const initialViolations = savedLogViolations.length > 0
        ? savedLogViolations
        : [
          ...missingFilesLocal.map((f: string) => ({ type: "Missing File", file: f, isSolved: false, webUrl: null })),
          ...missingFoldersLocal.map((f: string) => ({ type: "Missing Folder", file: f, isSolved: false, webUrl: null })),
          ...wrongFilenameLocal.map((w: { entry: FileEntry; expected: string }) => ({ type: "Wrong Filename", file: w.entry.name, expected: w.expected, isSolved: false, webUrl: null, id: w.entry.id })),
          ...otherUnknownLocal.map((f: FileEntry) => ({ type: "Wrong Folder", file: f.name, isSolved: false, webUrl: null, id: f.id }))
        ];

      setViolationsState(initialViolations);
      
      const recalculatedCompliance = reqFiles.length === 0
        ? 100
        : Math.round(((reqFiles.length - missingFilesLocal.length) / reqFiles.length) * 100);

      const baseComp = isFixOpening ? recalculatedCompliance : (saved?.compliance ?? 0);
      setInitialCompliance(baseComp);
      setHasInitialized(true);
    }
  }, [templateData, realFiles, dataLoadedFromApi, hasInitialized, isFixingFromReport]);

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

        await markViolationAsSolved(targetName, webUrl);
        await loadScanData();
        setShowIssueModal(false);
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

  const handleModalMoveFile = async () => {
    if (!selectedViolation) return;

    const folderId = sessionStorage.getItem("scanFolderId");
    if (!folderId) {
      alert("Folder ID not found.");
      return;
    }

    if (!selectedViolation.id) {
      alert("Unable to move this file automatically.");
      return;
    }

    setIsMovingFile(selectedViolation.file);
    try {
      const res = await fetch("/api/onedrive/move-file-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: selectedViolation.id,
          scanFolderId: folderId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Move failed");
      }

      showNotification('success', `Moved "${selectedViolation.file}" out of the scan folder successfully.`);

      setViolationsState(prev => prev.map(v => {
        if (v.id && v.id === selectedViolation.id) {
          return { ...v, isSolved: true, webUrl: data.file?.webUrl };
        }
        return v;
      }));

      await markViolationAsSolved(selectedViolation.file, data.file?.webUrl);
      await loadScanData();
      setShowIssueModal(false);
    } catch (err) {
      console.error("Move File Error:", err);
      showNotification('warning', `Unable to move the file automatically. Please resolve it manually in OneDrive or use Verify to re-check.`);
    } finally {
      setIsMovingFile(null);
    }
  };

  const verifyMovedFile = async () => {
    if (!selectedViolation) return;

    setIsVerifyingMove(true);
    try {
      const folderId = sessionStorage.getItem("scanFolderId");
      if (!folderId) {
        throw new Error("Scan folder ID is missing.");
      }

      const res = await fetch(`/api/onedrive/files?folderId=${folderId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to refresh files");
      }

      const freshFiles: FileEntry[] = data.files || [];
      const stillPresent = freshFiles.some(f => !f.isFolder && f.name.trim().toLowerCase() === selectedViolation.file.trim().toLowerCase());

      if (!stillPresent) {
        setViolationsState(prev => prev.map(v => {
          if (v.file.trim().toLowerCase() === selectedViolation.file.trim().toLowerCase()) {
            return { ...v, isSolved: true, webUrl: undefined };
          }
          return v;
        }));

        await markViolationAsSolved(selectedViolation.file);
        await loadScanData();
        showNotification('success', `"${selectedViolation.file}" has successfully moved out of the folder.`);
        setShowIssueModal(false);
      } else {
        showNotification('warning', `"${selectedViolation.file}" is still present. Please move it out and try again.`);
      }
    } catch (err) {
      console.error('Verify Move Error:', err);
      showNotification('warning', 'Unable to verify move. Please refresh and try again.');
    } finally {
      setIsVerifyingMove(false);
      setIsMovingFile(null);
    }
  };

  const handleModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedViolation) return;
    await handleFileUpload(e, selectedViolation.file);
  };

  const handleCloseIssueModal = () => {
    setShowIssueModal(false);
    setSelectedItemToFix(null);
    setNewNameVal("");
    setIssueTargetFolder("");
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    if (!newName?.trim()) {
      alert("Please provide a valid file name.");
      return;
    }

    // Check if the name actually changed (including case sensitivity)
    const currentFile = realFiles.find(f => f.id === fileId);
    if (currentFile && currentFile.name === newName.trim()) {
      alert("The new name is the same as the current name. Please provide a different name.");
      return;
    }

    setIsRenaming(fileId);
    try {
      const res = await fetch("/api/onedrive/rename-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, newName: newName.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Rename failed");
      }

      showNotification("success", `Renamed file to ${newName.trim()} successfully.`);

      const updatedName = newName.trim();
      setSelectedItemToFix(updatedName);
      setNewNameVal(updatedName);

      // Update violationsState immediately so UI reflects the new name without waiting
      setViolationsState(prev => prev.map(v => {
        const oldNameMatch = selectedViolation && v.file.trim().toLowerCase() === selectedViolation.file.trim().toLowerCase();
        const idMatch = v.id && v.id === fileId;
        if (oldNameMatch || idMatch) {
          return { ...v, file: updatedName, isSolved: true, webUrl: data.file?.webUrl };
        }
        return v;
      }));

      // Also inform backend/state updater with the final renamed filename
      await markViolationAsSolved(updatedName, data.file?.webUrl);
      await loadScanData();
    } catch (err: unknown) {
      const e = err as Error;
      console.error("Rename File Error:", e.message || err);
      const msg = e?.message || String(err) || "Network error during rename.";
      alert(msg);

      // If available, open the file in OneDrive so user can rename manually
      try {
        const fileEntry = realFiles.find(f => f.id === fileId) || realFiles.find(f => f.name.trim().toLowerCase() === (selectedViolation?.file || "").trim().toLowerCase());
        if (fileEntry?.webUrl) {
          showNotification('warning', 'Rename failed. Opening OneDrive to allow manual rename.');
          window.open(fileEntry.webUrl, '_blank');
        }
      } catch (openErr) {
        console.error('Failed to open OneDrive link for manual rename:', openErr);
      }
    } finally {
      setIsRenaming(null);
    }
  };

  const handleModalCreateFolder = async () => {
    if (!selectedViolation) return;
    await handleCreateFolder(selectedViolation.file);
    setShowIssueModal(false);
  };
  useEffect(() => {
    if (selectedViolation?.type === "Wrong Folder") {
      const firstFolder = realFiles.find((f: FileEntry) => f.isFolder)?.name.replace(/\/$/, "") || "";
      setIssueTargetFolder(firstFolder);
    } else if (!selectedViolation) {
      setIssueTargetFolder("");
    }
  }, [selectedViolation, realFiles]);

  const modalMisplacedFile = selectedViolation?.type === "Wrong Folder"
    ? realFiles.find((f: FileEntry) => !f.isFolder && f.name.trim().toLowerCase() === selectedViolation.file.trim().toLowerCase())
    : null;

  const modalWrongNameFile = selectedViolation?.type === "Wrong Filename"
    ? realFiles.find((f: FileEntry) => !f.isFolder && f.name.trim().toLowerCase() === selectedViolation.file.trim().toLowerCase())
    : null;

  const selectedIssueDescription = selectedViolation
    ? selectedViolation.type === "Missing File"
      ? "This required file is missing from the folder. Upload the correct file to resolve it."
      : selectedViolation.type === "Missing Folder"
      ? "This required folder does not exist. Create it to satisfy the template requirement."
      : selectedViolation.type === "Wrong Folder"
      ? "This file is unrelated and should be moved out of the folder."
      : selectedViolation.type === "Wrong Filename"
      ? "The file name does not match the required naming convention. Rename it in the modal below."
      : ""
    : "";

  const issueModalTitle = selectedViolation
    ? selectedViolation.type === "Missing File"
      ? "Upload Missing File"
      : selectedViolation.type === "Missing Folder"
      ? "Create Missing Folder"
      : selectedViolation.type === "Wrong Folder"
      ? "Move File to Correct Folder"
      : "Fix File Name"
    : "Fix Issue";

  const issueModalButtonLabel = selectedViolation
    ? selectedViolation.type === "Missing File"
      ? isUploading === selectedViolation.file ? "Uploading..." : "Upload"
      : selectedViolation.type === "Missing Folder"
      ? isCreatingFolder === selectedViolation.file ? "Creating..." : "Create Folder"
      : selectedViolation.type === "Wrong Folder"
      ? isMovingFile === selectedViolation.file ? "Opening..." : "Move File"
      : "Close"
    : "Close";

  const issueModalDisabled = false;

  // Keep some state variables referenced so lint doesn't treat them as unused
  useEffect(() => {
    void hasSelectedFixNow;
    void pendingFix;
    void fileOneDriveUrls;
    void issueModalDisabled;
  }, [hasSelectedFixNow, pendingFix, fileOneDriveUrls, issueModalDisabled]);

  const handleConfirm = () => {
    router.push("/system/report");
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

      if (data.newScan) {
        sessionStorage.setItem("lastScan", JSON.stringify(data.newScan));
        if (data.newScan.parentReportId) {
          sessionStorage.setItem("newClonedReport", JSON.stringify(data.newScan));
        }
      }

      setFixLogs(data.logs || []);
      await loadScanData();

      if (selectedItemToFix && !appliedFixes.includes(selectedItemToFix)) {
        setAppliedFixes((prev) => [...prev, selectedItemToFix]);
      }

      setShowRuleModal(false);

      // Only mark violations as solved if they were actually processed and fixed by a rule engine action
      let finalViolations: Violation[] = violationsState;
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
              const foundFile = (filesData.files || []).find((f: FileEntry) => f.name.toLowerCase() === searchName.toLowerCase());
              if (foundFile) {
                solvedWebUrl = foundFile.webUrl;
              }
            } catch (err) {
              console.error("Error fetching files to find renamed webUrl:", err);
            }
          }

          const updated = await markViolationAsSolved(log.file, solvedWebUrl);
          if (updated && updated.length) {
            finalViolations = updated;
          }
        }
      }

      let newFiles: FileEntry[] = [];
      let newFileNames: string[] = [];
      try {
        const updatedFiles = await fetch(
          `/api/onedrive/files?folderId=${sessionStorage.getItem("scanFolderId")}`
        ).then((res) => res.json());
        newFiles = (updatedFiles.files || []) as FileEntry[];
        newFileNames = newFiles.map((f: FileEntry) => f.name.trim().toLowerCase());
      } catch (err) {
        console.error("Error loading updated folder contents:", err);
        newFiles = [];
        newFileNames = [];
      }

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

      const updatedLogs = (finalViolations || violationsState)
        .filter((v) => !v.isSolved)
        .map((v) => ({
          file: v.file,
          rule: v.type,
          violation: true,
          expected: v.expected,
          webUrl: v.webUrl,
          timestamp: new Date().toISOString()
        }));

      const saved = JSON.parse(sessionStorage.getItem("lastScan") || "{}") as { id?: string };
      let cloneId = sessionStorage.getItem("fixReportCloneId");
      let targetId = cloneId || saved?.id;
      const status = newCompliance >= 80 ? "Completed" : "Incomplete";
      const updatedScanMeta = {
        compliance: newCompliance,
        status,
        date: new Date().toLocaleString(),
        logs: updatedLogs,
        totalFiles: newFiles.length
      };
      let createdClone: Record<string, unknown> | null = null;

      // If the user started fixing from an existing report but no clone yet,
      // create a cloned report now so the original remains unchanged.
      if (hasSelectedFixNow && !cloneId && saved?.id) {
        try {
          const response = await fetch("/api/scans/clone", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: saved.id, compliance: newCompliance, overrides: updatedScanMeta })
          });

          const clone = await response.json() as { id?: string; error?: string; [key: string]: unknown };
          if (response.ok && clone?.id) {
            cloneId = clone.id;
            createdClone = clone;
            sessionStorage.setItem("fixReportCloneId", clone.id);
            sessionStorage.setItem("newClonedReport", JSON.stringify(clone));
            targetId = clone.id;
          } else {
            console.error("Failed to clone scan record on finalize:", clone?.error || "Unknown error");
          }
        } catch (err) {
          console.error("Failed to clone report record on finalize:", err);
        }
      }

      const lastScanRecord = createdClone
        ? { ...createdClone, ...updatedScanMeta, id: targetId || createdClone.id }
        : { ...saved, ...updatedScanMeta, id: targetId || undefined };

      sessionStorage.setItem("lastScan", JSON.stringify(lastScanRecord));

      if (cloneId) {
        // keep new cloned report for report page to pick up
        sessionStorage.setItem("newClonedReport", JSON.stringify(lastScanRecord));
      }

      // Persist updated data to DB for the correct target (clone or original)
      if (targetId) {
        // Always ensure we have a clone before persisting any changes
        // This preserves the original scan and creates a new entry for fixes
        if (!cloneId && saved?.id) {
          try {
            const response = await fetch("/api/scans/clone", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: saved.id, compliance: newCompliance, overrides: updatedScanMeta })
            });

            const clone = await response.json() as { id?: string; [key: string]: unknown };
            if (response.ok && clone?.id) {
              cloneId = clone.id;
              sessionStorage.setItem("fixReportCloneId", clone.id);
              sessionStorage.setItem("newClonedReport", JSON.stringify(clone));
              targetId = clone.id;
            }
          } catch (err) {
            console.error("Failed to clone scan record:", err);
          }
        }

        // Update the cloned/new record with compliance changes
        if (cloneId) {
          await fetch("/api/scans/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: targetId, updates: updatedScanMeta })
          }).catch(err => {
            console.error("Failed to persist scan updates:", err);
          });
        }
      }

      setFixed(newCompliance === 100);
    } catch (err: unknown) {
      const e = err as Error;
      alert(e?.message || String(err));
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
              </div>

              <div className="bg-gray-50/50 rounded-3xl p-6 space-y-4 max-h-[480px] overflow-y-auto border border-gray-100 shadow-inner">
                <div className="space-y-3">
                  {complianceItems.length === 0 ? (
                    <div className="text-emerald-600 font-bold p-8 text-center flex flex-col items-center justify-center gap-2">
                      <span className="text-4xl animate-bounce">🎉</span>
                      <span className="text-lg font-black uppercase tracking-widest">No issues found</span>
                      <span className="text-xs text-gray-400 font-medium">All systems fully compliant!</span>
                    </div>
                  ) : (
                    complianceItems.map((v, index) => {
                      const isSelected = selectedItemToFix === v.file;
                      const folderRule = rules.find(r => r.type === "folder" && r.condition && Object.prototype.hasOwnProperty.call(r.condition, 'folder'));
                      const targetFolder = folderRule ? (folderRule.condition as unknown as { folder?: string }).folder : (templateData?.requiredFolders?.[0] || "Docs");
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
                                {v.file}
                                {v.isSolved && (
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${v.previouslyFixed ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-800'}`}>
                                  {v.previouslyFixed ? 'Previously Fixed' : 'Solved'}
                                </span>
                              )}
                              </span>
                              <span className={`text-[10px] uppercase tracking-wider mt-1 ${v.isSolved ? 'text-emerald-600/80 font-bold' : 'text-gray-500'}`}>
                                {v.type === "Missing File" || v.type === "Missing Folder" 
                                  ? "Missing Report File/Folder" 
                                  : v.type === "Wrong Folder" 
                                  ? "Wrong Placement" 
                                  : v.type === "Wrong Filename" 
                                  ? "Wrong Filename"
                                  : v.type}
                              </span>
                              {v.type === "Wrong Folder" && (
                                <span className="text-xs text-gray-400 mt-1">Suggested: {targetFolder}</span>
                              )}
                              {v.type === "Wrong Filename" && v.expected && (
                                <span className="text-xs text-gray-400 mt-1">Required file name: {v.expected}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {/* Always show a Fix Files button for unresolved items so user doesn't need to select first */}
                            {v.isSolved ? (
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100/50 px-3 py-1.5 rounded-lg">
                                Done
                              </span>
                            ) : (
                              // show button for any unresolved issue (no need to select first)
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItemToFix(v.file);
                                  // prefill the input with the current (wrong) name if available
                                  setNewNameVal(wrongNameFile?.name || "");
                                  // open modal immediately
                                  setShowIssueModal(true);
                                }}
                                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm transition-all"
                              >
                                🔧 Fix Files
                              </button>
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

        {showIssueModal && selectedViolation && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 w-[500px] max-h-[80vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{issueModalTitle}</h3>
                  <p className="text-sm text-gray-500 mt-2">{selectedIssueDescription}</p>
                </div>
                <button
                  onClick={handleCloseIssueModal}
                  className="text-gray-400 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                  <p className="text-xs uppercase tracking-[0.35em] text-gray-400 mb-3">Issue</p>
                  <p className="text-sm text-gray-700">{selectedViolation.type}</p>
                </div>

                {selectedViolation.type === "Missing File" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Upload the required file named <strong>{selectedViolation.file}</strong>.</p>
                    <input
                      type="file"
                      id={`issue-upload-${selectedViolation.file}`}
                      className="hidden"
                      onChange={handleModalFileUpload}
                    />
                    <label
                      htmlFor={`issue-upload-${selectedViolation.file}`}
                      className="inline-flex items-center justify-center px-4 py-3 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-700"
                    >
                      {issueModalButtonLabel}
                    </label>
                  </div>
                )}

                {selectedViolation.type === "Missing Folder" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Create the missing folder <strong>{selectedViolation.file}</strong>.</p>
                    <button
                      onClick={handleModalCreateFolder}
                      disabled={isCreatingFolder === selectedViolation.file}
                      className="inline-flex items-center justify-center px-4 py-3 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400"
                    >
                      {issueModalButtonLabel}
                    </button>
                  </div>
                )}

                {selectedViolation.type === "Wrong Folder" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Move <strong>{selectedViolation.file}</strong> out of this folder to resolve it.</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleModalMoveFile}
                        disabled={isMovingFile === selectedViolation.file}
                        className="inline-flex items-center justify-center px-4 py-3 rounded-2xl bg-yellow-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-yellow-700 disabled:bg-gray-200 disabled:text-gray-400"
                      >
                        {isMovingFile === selectedViolation.file ? 'Moving...' : 'Move Out'}
                      </button>
                      <button
                        onClick={verifyMovedFile}
                        disabled={isVerifyingMove}
                        className="inline-flex items-center justify-center px-4 py-3 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400"
                      >
                        {isVerifyingMove ? 'Verifying...' : 'Verify Moved'}
                      </button>
                    </div>
                  </div>
                )}

                {selectedViolation.type === "Wrong Filename" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Rename <strong>{selectedViolation.file}</strong> to the required name.
                      {templateData?.namingRule && (
                        <span className="block text-xs text-gray-400 mt-1">Format: <strong>{templateData.namingRule}</strong></span>
                      )}
                      {selectedViolation.expected && (
                        <span className="block text-xs text-gray-400 mt-1">Required file name: <strong>{selectedViolation.expected}</strong></span>
                      )}
                    </p>
                    <input
                      type="text"
                      value={newNameVal}
                      placeholder={templateData?.namingRule || "Enter new file name"}
                      onChange={(e) => setNewNameVal(e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-gray-200 text-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      onClick={async () => {
                        if (!modalWrongNameFile) {
                          alert("Unable to locate the file to rename.");
                          return;
                        }
                        await handleRenameFile(modalWrongNameFile.id, newNameVal);
                        setShowIssueModal(false);
                      }}
                      disabled={isRenaming === modalWrongNameFile?.id}
                      className="inline-flex items-center justify-center px-4 py-3 rounded-2xl bg-yellow-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-yellow-700 disabled:bg-gray-200 disabled:text-gray-400"
                    >
                      {isRenaming === modalWrongNameFile?.id ? 'Renaming...' : 'Rename File'}
                    </button>
                  </div>
                )}
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
                        {rule.condition ? JSON.stringify(rule.condition) : "No condition"}
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
              {isConfirming ? "Loading Report..." : "View Report"}
            </button>
          </div>
        </div>
      </div>

      <div className="h-10 shrink-0" /> {/* Bottom spacer for better scroll room */}
    </div>
  );
}
