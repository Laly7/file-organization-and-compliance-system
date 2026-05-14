"use server";

import { getDbData, saveDbData } from "@/lib/db";
import { revalidatePath } from "next/cache";

// TEMPLATES
export async function addTemplate(formData: FormData) {
  const db = await getDbData();
  if (!db) return false;

  const newTemplate = {
    id: "t_" + Date.now().toString(),
    name: formData.get("templateName") as string || "Untitled Template",
    requiredFolders: (formData.get("requiredFolders") as string || "Docs/,Images/").split(",").map(s => s.trim()).filter(Boolean),
    requiredFiles: (formData.get("requiredFiles") as string || "").split(",").map(s => s.trim()).filter(Boolean),
    namingRule: formData.get("namingRule") as string || "YYYY_ProjectName",
    optionalFiles: (formData.get("optionalFiles") as string || "").split(",").map(s => s.trim()).filter(Boolean),
  };

  db.templates.push(newTemplate);
  await saveDbData(db);
  revalidatePath("/template-selection");
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
  revalidatePath("/template-selection");
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

  const newRule = {
    id: Date.now(),

    name: (formData.get("name") as string) || "New Rule",

    type: (formData.get("type") as string) || "naming",

    condition: formData.get("condition") as string,
    action: {
      type: formData.get("action") as string
    },

    status: true,

    templateId: formData.get("templateId") as string
  };

  db.rules.push(newRule);
  await saveDbData(db);
  revalidatePath("/rules");

  return true;
}

export async function updateRule(id: number, formData: FormData) {
  const db = await getDbData();
  if (!db) return false;

  const index = db.rules.findIndex((r: any) => r.id === id);

  if (index === -1) return false;

  db.rules[index] = {
    ...db.rules[index],

    name:
      (formData.get("name") as string) ||
      db.rules[index].name,

    condition:
      (formData.get("condition") as string) ||
      db.rules[index].condition,

    template:
      (formData.get("template") as string) ||
      db.rules[index].template
  };

  await saveDbData(db);

  revalidatePath("/system/rules");

  return true;
}

export async function deleteRule(id: number) {
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
  revalidatePath("/template-selection");
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
