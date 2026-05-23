import { NextResponse } from "next/server";
import { getDbData, saveDbData } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET() {
  const db = await getDbData();
  return NextResponse.json({ rules: db.rules || [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = await getDbData();

  const newRule = {
    id: randomUUID(),
    name: body.name,
    condition: body.condition,
    template: body.template || "",
    status: true
  };

  db.rules = db.rules || [];
  db.rules.push(newRule);

  await saveDbData(db);

  return NextResponse.json({ success: true, rule: newRule });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const db = await getDbData();

  const index = db.rules.findIndex((r: any) => r.id === body.id);

  if (index === -1) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }

  db.rules[index] = {
    ...db.rules[index],
    ...body
  };

  await saveDbData(db);

  return NextResponse.json({ success: true, rule: db.rules[index] });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  const db = await getDbData();

  db.rules = db.rules.filter((r: any) => r.id !== id);

  await saveDbData(db);

  return NextResponse.json({ success: true });
}