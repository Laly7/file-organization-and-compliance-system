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
    const createItemRes = await fetch(createItemUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: finalFileName,
        file: {},
        "@microsoft.graph.conflictBehavior": "replace"
      })
    });

    if (!createItemRes.ok) {
      const errData = await createItemRes.json().catch(() => null);
      throw new Error(`Failed to create file metadata: ${JSON.stringify(errData)}`);
    }

    const createdItem = await createItemRes.json();
    const fileItemId = createdItem.id;

    // 2. Upload the actual content to the new item
    const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${fileItemId}/content`;
    console.log("UPLOAD URL:", uploadUrl);

    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": file.type || "application/octet-stream",
        "Content-Length": buffer.length.toString()
      },
      body: buffer
    });

    console.log("GRAPH STATUS:", res.status);

    let data = null;

    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      console.error("GRAPH ERROR:", data);

      try {
        const fs = require('fs');
        const path = require('path');
        fs.appendFileSync(
          path.join(process.cwd(), 'upload-error.log'), 
          new Date().toISOString() + " - " + JSON.stringify(data) + "\n"
        );
      } catch (e) {}

      return NextResponse.json(
        {
          error: "Upload failed",
          details: data
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: data
    });

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