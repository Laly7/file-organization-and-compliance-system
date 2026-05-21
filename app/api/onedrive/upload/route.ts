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

    const formData = await req.formData();

    const file = formData.get("file") as File;
    const folderId = formData.get("folderId") as string;
    const targetName = formData.get("targetName") as string;

    if (!file || !folderId) {
      return NextResponse.json(
        { error: "Missing file or folderId" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const finalFileName = targetName || file.name;

    // 1. Create the empty file item metadata in the folder
    const createItemUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`;
    let createdItem: any;

    try {
      createdItem = await graphRequest(session.accessToken, createItemUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalFileName,
          file: {},
          "@microsoft.graph.conflictBehavior": "replace"
        })
      });
    } catch (err: any) {
      console.error("UPLOAD CREATE ITEM ERROR:", err);
      return NextResponse.json({ error: "Failed to create file metadata", details: err?.message || err }, { status: 500 });
    }

    const fileItemId = createdItem.id;

    // 2. Upload the actual content to the new item
    const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${fileItemId}/content`;
    console.log("UPLOAD URL:", uploadUrl);

    try {
      const data = await graphRequest(session.accessToken, uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "Content-Length": buffer.length.toString()
        },
        body: buffer
      }, 60000 /* timeout for upload */,
      2 /* retries */);

      return NextResponse.json({ success: true, file: data });
    } catch (err: any) {
      console.error("GRAPH UPLOAD ERROR:", err?.message || err);
      return NextResponse.json({ error: "Upload failed", details: err?.message || err }, { status: 500 });
    }

  } catch (err: any) {
    console.error("UPLOAD API ERROR:", err);

    try {
      const fs = require('fs');
      const path = require('path');
      fs.appendFileSync(
        path.join(process.cwd(), 'upload-error.log'), 
        new Date().toISOString() + " - EXCEPTION: " + err.message + "\n"
      );
    } catch (e) {}

    return NextResponse.json(
      {
        error: err.message
      },
      { status: 500 }
    );
  }
}