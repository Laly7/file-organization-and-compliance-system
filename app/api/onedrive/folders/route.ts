import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(
    "https://graph.microsoft.com/v1.0/me/drive/root/children",
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`
      }
    }
  );

  const data = await res.json();

  const folders = (data.value || [])
    .filter((item: any) => item.folder)
    .map((f: any) => ({
      id: f.id,
      name: f.name,
      webUrl: f.webUrl
    }));

  return NextResponse.json({ folders });
}