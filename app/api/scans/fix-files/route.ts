import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDbData } from "@/lib/db";
import { getDriveChildren } from "@/lib/onedrive";
import { processFiles } from "@/lib/ruleEngine";

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
      selectedRuleIds
    } = await req.json();

    const db = await getDbData();

    const template = db.templates.find(
      (t: any) => t.id === templateId
    );

    const rules = db.rules.filter(
      (r: any) =>
        selectedRuleIds.includes(r.id)
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

    const logs = await processFiles(
      files,
      template,
      rules,
      token
    );

    return NextResponse.json({
      success: true,
      logs
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}