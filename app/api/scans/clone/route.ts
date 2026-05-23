import { NextResponse } from "next/server";
import { cloneScanRecord } from "@/app/actions";

export async function POST(req: Request) {
  try {
    const { id, compliance, overrides } = await req.json();

    if (!id || compliance == null) {
      return NextResponse.json({ error: "Missing id or compliance" }, { status: 400 });
    }

    const clone = await cloneScanRecord(id, compliance, overrides || {});
    if (!clone) {
      return NextResponse.json({ error: "Original scan not found" }, { status: 404 });
    }

    return NextResponse.json(clone);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to clone scan record" }, { status: 500 });
  }
}
