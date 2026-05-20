import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { moveFile } from "@/lib/onedrive";

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

    const { fileId, targetFolderId } = await req.json();

    if (!fileId || !targetFolderId) {
      return NextResponse.json(
        { error: "Missing fileId or targetFolderId" },
        { status: 400 }
      );
    }

    const res = await moveFile(token, fileId, targetFolderId);

    return NextResponse.json({
      success: true,
      file: res
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
