import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");

  const url = folderId
    ? `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`
    : "https://graph.microsoft.com/v1.0/me/drive/root/children";

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`
    }
  });

  const data = await res.json();

  const files = (data.value || []).map((file: any) => ({
    id: file.id,
    name: file.name,
    webUrl: file.webUrl
  }));

  return NextResponse.json({ files });
}