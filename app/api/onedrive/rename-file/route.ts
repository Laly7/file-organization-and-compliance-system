import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { renameFile } from "@/lib/onedrive";

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

    const { fileId, newName } = await req.json();

    if (!fileId || !newName) {
      return NextResponse.json(
        { error: "Missing fileId or newName" },
        { status: 400 }
      );
    }

    const res = await renameFile(token, fileId, newName);

    return NextResponse.json({
      success: true,
      file: res
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
