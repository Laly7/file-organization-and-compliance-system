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

    if (!file || !folderId) {
      return NextResponse.json(
        { error: "Missing file or folderId" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${encodeURIComponent(file.name)}:/content`;

    console.log("UPLOAD URL:", uploadUrl);

    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": file.type || "application/octet-stream"
      },
      body: arrayBuffer
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

    return NextResponse.json(
      {
        error: err.message
      },
      { status: 500 }
    );
  }
}