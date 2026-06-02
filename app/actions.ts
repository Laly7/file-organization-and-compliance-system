"use server";

import { getDbData, saveDbData } from "@/lib/db";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

// TEMPLATES
export async function addTemplate(formData: FormData) {
  const db = await getDbData();
  if (!db) return false;

  const newTemplate = {
    id: "t_" + randomUUID(),
    name: formData.get("templateName") as string || "Untitled Template",
    requiredFolders: (formData.get("requiredFolders") as string || "Docs/,Images/").split(",").map(s => s.trim()).filter(Boolean),
    requiredFiles: (formData.get("requiredFiles") as string || "").split(",").map(s => s.trim()).filter(Boolean),
    namingRule: formData.get("namingRule") as string || "YYYY_ProjectName",
    optionalFiles: (formData.get("optionalFiles") as string || "").split(",").map(s => s.trim()).filter(Boolean),
  };

  db.templates.push(newTemplate);
  await saveDbData(db);
  revalidatePath("/system/templates");
  return true;
}

export async function updateTemplate(id: string, formData: FormData) {
  const db = await getDbData();
  if (!db) return false;

  const index = db.templates.findIndex((t: any) => t.id === id);
  if (index === -1) return false;

  db.templates[index] = {
    ...db.templates[index],
    name: formData.get("templateName") as string || db.templates[index].name,
    requiredFolders: (formData.get("requiredFolders") as string || "").split(",").map(s => s.trim()).filter(Boolean),
    requiredFiles: (formData.get("requiredFiles") as string || "").split(",").map(s => s.trim()).filter(Boolean),
    namingRule: formData.get("namingRule") as string || db.templates[index].namingRule,
    optionalFiles: (formData.get("optionalFiles") as string || "").split(",").map(s => s.trim()).filter(Boolean),
  };

  await saveDbData(db);
  revalidatePath("/system/templates");
  return true;
}

export async function getTemplateByName(name: string) {
  const db = await getDbData();
  if (!db) return null;
  return db.templates.find((t: any) => t.name === name);
}

// RULES 
export async function addRule(formData: FormData) {
  const db = await getDbData();
  if (!db) return false;

  const conditionValue = (formData.get("condition") as string) || "Wrong title";
  const ruleType =
    conditionValue === "Wrong folder"
      ? "folder"
      : conditionValue === "Missing file"
      ? "missing"
      : "naming";

  const newRule = {
    id: randomUUID(),
    name: (formData.get("name") as string) || "New Rule",
    type: ruleType,
    condition: conditionValue,
    action: {
      type: formData.get("action") as string
    },
    status: true,
    template: (formData.get("template") as string) || "",
    templateId: (formData.get("templateId") as string) || null
  };

  db.rules.push(newRule);
  await saveDbData(db);
  revalidatePath("/rules");

  return true;
}

export async function updateRule(id: string, formData: FormData) {
  const db = await getDbData();
  if (!db) return false;

  const index = db.rules.findIndex((r: any) => r.id === id);

  if (index === -1) return false;

  const conditionValue = (formData.get("condition") as string) || db.rules[index].condition;
  const ruleType =
    conditionValue === "Wrong folder"
      ? "folder"
      : conditionValue === "Missing file"
      ? "missing"
      : "naming";

  db.rules[index] = {
    ...db.rules[index],
    name: (formData.get("name") as string) || db.rules[index].name,
    type: ruleType,
    condition: conditionValue,
    template: (formData.get("template") as string) || db.rules[index].template,
    templateId: (formData.get("templateId") as string) || db.rules[index].templateId
  };

  await saveDbData(db);

  revalidatePath("/system/rules");

  return true;
}

export async function deleteRule(id: string) {
  const db = await getDbData();
  if (!db) return false;

  db.rules = db.rules.filter((r: any) => r.id !== id);

  await saveDbData(db);
  revalidatePath("/rules");

  return true;
}

function safeJSON(value: any) {
  try {
    return JSON.parse(value as string);
  } catch {
    return {};
  }
}

export async function deleteTemplate(id: string) {
  const db = await getDbData();
  if (!db) return false;

  db.templates = db.templates.filter((t: any) => t.id !== id);

  await saveDbData(db);
  revalidatePath("/system/templates");
  return true;
}

export async function deleteScan(id: string) {
  const db = await getDbData();
  if (!db) return false;

  db.stats.recentScans = db.stats.recentScans.filter((s: any) => s.id !== id);
  db.stats.totalFoldersScanned = db.stats.recentScans.length;

  await saveDbData(db);
  revalidatePath("/report");
  revalidatePath("/dashboard");
  return true;
}

export async function updateScanRecord(id: string, updates: Partial<any>) {
  const db = await getDbData();
  if (!db || !db.stats?.recentScans) return null;

  const index = db.stats.recentScans.findIndex((s: any) => s.id === id);
  if (index === -1) return null;

  db.stats.recentScans[index] = {
    ...db.stats.recentScans[index],
    ...updates
  };

  await saveDbData(db);
  revalidatePath("/report");
  revalidatePath("/dashboard");
  return db.stats.recentScans[index];
}

export async function cloneScanRecord(id: string, compliance: number, overrides: Partial<any> = {}) {
  const db = await getDbData();
  if (!db || !db.stats?.recentScans) return null;

  const existing = db.stats.recentScans.find((s: any) => s.id === id);
  if (!existing) return null;

  const newScan = {
    ...existing,
    ...overrides,
    id: randomUUID(),
    parentReportId: id,
    auditId: `AUD-${randomUUID()}`,
    date: new Date().toLocaleString(),
    compliance,
    status: compliance >= 80 ? "Completed" : "Incomplete"
  };

  db.stats.recentScans.push(newScan);
  db.stats.totalFoldersScanned = db.stats.recentScans.length;
  await saveDbData(db);
  revalidatePath("/report");
  revalidatePath("/dashboard");
  return newScan;
}


