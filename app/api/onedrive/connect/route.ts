import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  return NextResponse.redirect("/api/auth/signin?provider=microsoft-entra-id");
}