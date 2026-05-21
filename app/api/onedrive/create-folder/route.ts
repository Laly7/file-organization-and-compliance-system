import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { graphRequest } from "@/lib/onedrive";

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

    try {
      const data = await graphRequest(session.accessToken, createUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: folderName,
          folder: {},
          "@microsoft.graph.conflictBehavior": "fail"
        })
      });

      return NextResponse.json({ success: true, folder: data });
    } catch (err: any) {
      console.error("CREATE FOLDER GRAPH ERROR:", err?.message || err);
      return NextResponse.json({ error: "Folder creation failed", details: err?.message || err }, { status: 500 });
    }

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
