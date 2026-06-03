import {
  renameFile,
  moveFile,
  copyFile,
  findFolderIdByName
} from "@/lib/onedrive";

export interface Rule {
  id: string;
  name: string;
  type: "naming" | "folder" | "missing";
  condition: any;
  action: any;
  status: boolean;
  template?: string;
  templateId?: string;
}

export interface Template {
  id: string;
  name: string;
  requiredFolders: string[];
  requiredFiles: string[];
  namingRule: string;
  optionalFiles: string[];
}

export interface FileItem {
  id: string;
  name: string;
  path?: string;
  isFolder?: boolean;
}

export function analyzeFiles(
  files: FileItem[],
  template: Template,
  rules: Rule[]
) {
  return generateTemplateViolations(files, template);
}

function generateTemplateViolations(
  files: FileItem[],
  template: Template
) {
  const logs: any[] = [];
  const actualFiles = files.filter((file) => !file.isFolder);
  const actualFolders = files.filter((file) => file.isFolder);
  const requiredFiles = template.requiredFiles || [];
  const optionalFiles = template.optionalFiles || [];
  const requiredFolders = template.requiredFolders || [];

  const normalizeName = (name: string) =>
    name.trim().toLowerCase().replace(/\/$/, "");

  const tokenizeName = (name: string) =>
    name
      .replace(/\.[^/.]+$/, "")
      .split(/[^a-z0-9]+/gi)
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean);

  const optionalSet = new Set(
    optionalFiles.map((optionalFile) => normalizeName(optionalFile))
  );

  const usedFileIds = new Set<string>();

  for (const requiredFile of requiredFiles) {
    const requiredNormalized = normalizeName(requiredFile);
    const exactMatch = actualFiles.find(
      (file) => normalizeName(file.name) === requiredNormalized
    );

    if (exactMatch) {
      usedFileIds.add(exactMatch.id);
      continue;
    }

    const caseInsensitiveMatch = actualFiles.find(
      (file) =>
        !usedFileIds.has(file.id) &&
        file.name.trim().toLowerCase() === requiredFile.trim().toLowerCase()
    );

    if (caseInsensitiveMatch) {
      usedFileIds.add(caseInsensitiveMatch.id);
      logs.push({
        file: caseInsensitiveMatch.name,
        rule: "Template Wrong Filename",
        type: "Wrong Filename",
        expected: requiredFile,
        violation: true,
        timestamp: new Date().toISOString()
      });
      continue;
    }

    const requiredTokens = tokenizeName(requiredFile);
    const tokenMatch = actualFiles.find((file) => {
      if (usedFileIds.has(file.id)) return false;
      const fileTokens = tokenizeName(file.name);
      return (
        fileTokens.length > 0 &&
        requiredTokens.some((token) => fileTokens.includes(token))
      );
    });

    if (tokenMatch) {
      usedFileIds.add(tokenMatch.id);
      logs.push({
        file: tokenMatch.name,
        rule: "Template Wrong Filename",
        type: "Wrong Filename",
        expected: requiredFile,
        violation: true,
        timestamp: new Date().toISOString()
      });
      continue;
    }

    logs.push({
      file: requiredFile,
      rule: "Template Missing File",
      type: "Missing File",
      violation: true,
      timestamp: new Date().toISOString()
    });
  }

  const actualFolderNames = new Set(
    actualFolders.map((folder) => normalizeName(folder.name))
  );

  for (const requiredFolder of requiredFolders) {
    if (!actualFolderNames.has(normalizeName(requiredFolder))) {
      logs.push({
        file: requiredFolder,
        rule: "Template Missing Folder",
        type: "Missing Folder",
        violation: true,
        timestamp: new Date().toISOString()
      });
    }
  }

  for (const file of actualFiles) {
    if (usedFileIds.has(file.id)) continue;
    if (optionalSet.has(normalizeName(file.name))) continue;

    logs.push({
      file: file.name,
      rule: "Template Wrong Placement",
      type: "Wrong Folder",
      violation: true,
      timestamp: new Date().toISOString()
    });
  }

  return logs;
}

export async function processFiles(
  files: FileItem[],
  template: Template,
  rules: Rule[],
  token: string
) {
  const logs: any[] = [];
  const activeRules = rules.filter(r => r.status);

  for (const file of files) {
    for (const rule of activeRules) {
      const violated = checkRule(rule, file, template);
      if (violated) {
        const result = await executeRule(rule, file, token, template);
        const type =
          rule.type === "naming"
            ? "Wrong Filename"
            : rule.type === "folder"
            ? "Wrong Folder"
            : rule.type === "missing"
            ? "Missing File"
            : "Violation";

        logs.push({
          file: file.name,
          rule: rule.name,
          type,
          action: result,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  const missingFiles = checkMissingFiles(files, template);

  for (const missing of missingFiles) {
    logs.push({
      file: missing,
      rule: "Template Missing File",
      action: "Missing file detected",
      timestamp: new Date().toISOString()
    });
  }

  const missingFolders = checkMissingFolders(files, template);

  for (const missing of missingFolders) {
    logs.push({
      file: missing,
      rule: "Template Missing Folder",
      action: "Missing folder detected",
      timestamp: new Date().toISOString()
    });
  }

  return logs;
}

function checkRule(rule: Rule, file: FileItem, template: Template): boolean {
  if (file.isFolder) return false;
  const condition = rule.condition;

  switch (rule.type) {
    case "naming": {
      const pattern =
        typeof condition === "object" && condition?.pattern
          ? condition.pattern
          : template.namingRule || ".*";
      return !validateNaming(file.name, pattern);
    }

    case "folder": {
      const folderToCheck =
        typeof condition === "object" && condition?.folder
          ? condition.folder
          : template.requiredFolders?.[0] || "";
      if (!folderToCheck) return false;
      return !file.path?.includes(folderToCheck);
    }

    case "missing":
      return false;

    default:
      return false;
  }
}

function checkMissingFiles(files: FileItem[], template: Template) {
  const names = files.filter(f => !f.isFolder).map(f => f.name.toLowerCase());

  return template.requiredFiles.filter(
    req => !names.includes(req.toLowerCase())
  );
}

function checkMissingFolders(files: FileItem[], template: Template) {
  const folders = files
    .filter(f => f.isFolder)
    .map(f => f.name.toLowerCase().replace(/\/$/, ""));

  return (template.requiredFolders || []).filter(
    req => {
      const cleanReq = req.toLowerCase().replace(/\/$/, "");
      return !folders.includes(cleanReq);
    }
  );
}

function validateNaming(name: string, pattern: string) {
  return new RegExp(pattern).test(name);
}

async function executeRule(
  rule: Rule,
  file: FileItem,
  token: string,
  template: Template
) {
  if (!rule.action || typeof rule.action !== "object" || !rule.action.type) {
    return "No action configured";
  }
  switch (rule.action.type) {

    case "rename":
      const newName = generateName(file.name);
      await renameFile(token, file.id, newName);
      return `Renamed → ${newName}`;

    case "move":
      const folderId = await findFolderIdByName(
        token,
        rule.condition.folder || template.requiredFolders[0]
      );

      if (!folderId) return "Target folder not found";

      await moveFile(token, file.id, folderId);
      return `Moved → ${rule.condition.folder}`;

    case "copy":
      const backupId = await findFolderIdByName(
        token,
        "Backup"
      );

      if (!backupId) return "Backup folder not found";

      await copyFile(token, file.id, backupId);
      return "Copied → Backup";

    default:
      return "No action";
  }
}

function generateName(oldName: string) {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const clean = oldName.replace(/\.[^/.]+$/, "");

  return `${yy}${mm}_Project_${clean}.docx`;
}