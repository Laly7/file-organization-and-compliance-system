import { NextResponse } from "next/server";
import { getDbData, saveDbData } from "@/lib/db";
import { processFiles } from "@/lib/ruleEngine";
import { getDriveChildren } from "@/lib/onedrive";
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

    const rules = db.rules.filter(
      (r: any) => r.templateId === templateId
    );

    const driveItems = await getDriveChildren(
      token,
      folderId
    );

    const files = driveItems
      .filter((item: any) => item.file)
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        path: item.parentReference?.path || ""
      }));

    const logs = analyzeFiles(
      files,
      template,
      rules
    );

    console.log("LOGS:", logs);

    const requiredFiles = template.requiredFiles || [];

    const realFileNames = files.map((f: any) =>
      f.name.trim().toLowerCase()
    );

    const matchedFiles = requiredFiles.filter((rf: string) =>
      realFileNames.includes(rf.trim().toLowerCase())
    );

    const compliance =
      requiredFiles.length > 0
        ? Math.round(
          (matchedFiles.length / requiredFiles.length) * 100
        )
    : 0;

    const scan = {
      id: Date.now().toString(),

      auditId: "AUD-" + Date.now(),

      folder: folderName || "Unknown Folder",

      template: template.name,
      
      templateId: template.id,

      date: new Date().toLocaleString(),

      status:
        compliance >= 80
          ? "Completed"
          : "Incomplete",

      compliance,

      totalFiles: files.length,

      logs
    };

    if (!db.stats) {
      db.stats = {
        totalFoldersScanned: 0,
        recentScans: []
      };
    }

    if (!db.stats.recentScans) {
      db.stats.recentScans = [];
    }

    db.stats.recentScans.push(scan);

    db.stats.totalFoldersScanned =
      db.stats.recentScans.length;

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