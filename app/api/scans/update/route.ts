import { NextResponse } from "next/server";
import { updateScanRecord } from "@/app/actions";

export async function POST(req: Request) {
  try {
    const { id, updates } = await req.json();

    if (!id || !updates) {
      return NextResponse.json({ error: "Missing id or updates" }, { status: 400 });
    }

    const updated = await updateScanRecord(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Scan record not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update scan record" }, { status: 500 });
  }
}
