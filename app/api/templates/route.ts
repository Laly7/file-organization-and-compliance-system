import { NextResponse } from "next/server";
import { getDbData, saveDbData } from "@/lib/db";

export async function GET() {
  const db = await getDbData();
  return NextResponse.json(db.templates || []);
}

export async function POST(req: Request) {
  const db = await getDbData();
  const body = await req.json();

  const newTemplate = {
    id: "t_" + Date.now(),
    name: body.name,
    requiredFolders: body.requiredFolders || [],
    requiredFiles: body.requiredFiles || [],
    namingRule: body.namingRule || "",
    optionalFiles: body.optionalFiles || []
  };

  db.templates.push(newTemplate);
  await saveDbData(db);

  return NextResponse.json(newTemplate);
}