import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { folderId, folderName } = await req.json();

    if (!folderId || !folderName) {
      return NextResponse.json(
        { error: "Missing folderId or folderName" },
        { status: 400 }
      );
    }

    const createUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`;

    const res = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: folderName,
        folder: {},
        "@microsoft.graph.conflictBehavior": "fail"
      })
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Folder creation failed", details: data },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      folder: data
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
