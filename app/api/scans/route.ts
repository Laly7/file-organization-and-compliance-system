import { NextResponse } from "next/server";
import { getDbData, saveDbData } from "@/lib/db";
import { randomUUID } from "crypto";
import { processFiles } from "@/lib/ruleEngine";
import { getDriveChildren, getDriveFilesRecursively } from "@/lib/onedrive";
import { auth } from "@/auth";
import { analyzeFiles } from "@/lib/ruleEngine";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const token = session?.accessToken;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      templateId,
      folderId,
      folderName
    } = await req.json();

    if (!templateId || !folderId) {
      return NextResponse.json(
        { error: "Missing templateId or folderId" },
        { status: 400 }
      );
    }

    const db = await getDbData();

    if (!db) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 500 }
      );
    }

    const template = db.templates.find(
      (t: any) => t.id === templateId
    );

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 400 }
      );
    }

    const rules = db.rules.filter((r: any) => {
      return (
        r.templateId === templateId ||
        (typeof r.template === "string" && r.template === template.name)
      );
    });

    const files = await getDriveFilesRecursively(
      token,
      folderId
    );

    const logs = analyzeFiles(
      files,
      template,
      rules
    );

    console.log("LOGS:", logs);

    const requiredFiles = template.requiredFiles || [];
    const requiredFolders = template.requiredFolders || [];

    const realFileNames = files.filter((f: any) => !f.isFolder).map((f: any) =>
      f.name.trim().toLowerCase()
    );

    const realFolderNames = files.filter((f: any) => f.isFolder).map((f: any) =>
      f.name.trim().toLowerCase().replace(/\/$/, "")
    );

    const matchedFiles = requiredFiles.filter((rf: string) =>
      realFileNames.includes(rf.trim().toLowerCase())
    );

    const matchedFolders = requiredFolders.filter((rf: string) =>
      realFolderNames.includes(rf.trim().toLowerCase().replace(/\/$/, ""))
    );

    const totalRequirements = requiredFiles.length + requiredFolders.length;
    const totalMatched = matchedFiles.length + matchedFolders.length;

    const compliance =
      totalRequirements > 0
        ? Math.round(
          (totalMatched / totalRequirements) * 100
        )
    : 100;

    const createdAt = new Date().toISOString();
    const totalFolders = files.filter((f: any) => f.isFolder).length;
    const scan = {
      id: randomUUID(),
      auditId: `AUD-${randomUUID()}`,
      folder: folderName || "Unknown Folder",
      folderName: folderName || "Unknown Folder",
      folderId,
      template: template.name,
      templateId: template.id,
      createdAt,
      date: new Date().toLocaleString(),
      status:
        compliance >= 80
          ? "Completed"
          : "Incomplete",
      compliance,
      complianceScore: compliance,
      totalFiles: files.length,
      totalFolders,
      logs
    };

    if (!db.stats) {
      db.stats = {
        totalFoldersScanned: 0,
        lastScanDate: "None",
        recentScans: []
      };
    }

    if (!db.stats.recentScans) {
      db.stats.recentScans = [];
    }

    db.stats.recentScans.push(scan);
    db.stats.totalFoldersScanned = db.stats.recentScans.length;
    db.stats.lastScanDate = createdAt;

    await saveDbData(db);

    return NextResponse.json({
      success: true,
      scan
    });

  } catch (err: any) {
    console.error("SCAN API ERROR:", err);

    return NextResponse.json(
      {
        error:
          err.message ||
          "Failed to confirm scan to database."
      },
      { status: 500 }
    );
  }
}