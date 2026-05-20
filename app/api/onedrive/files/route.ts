import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getDriveFilesRecursively } from "@/lib/onedrive";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");

  if (!folderId) {
    return NextResponse.json({ files: [] });
  }

  try {
    const files = await getDriveFilesRecursively(session.accessToken, folderId);
    return NextResponse.json({ files });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}