import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST() {
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

  const files = await res.json();

  return NextResponse.json({
    message: "Synced successfully",
    count: files?.value?.length || 0
  });
}