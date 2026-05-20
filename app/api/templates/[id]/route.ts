import { NextResponse } from "next/server";
import { getDbData, saveDbData } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = await getDbData();
  const resolvedParams = await params;

  const template = db.templates.find(
    (t: any) => t.id === resolvedParams.id
  );

  if (!template) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(template);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = await getDbData();
  const body = await req.json();
  const resolvedParams = await params;

  const index = db.templates.findIndex(
    (t: any) => t.id === resolvedParams.id
  );

  if (index === -1) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  }

  db.templates[index] = {
    ...db.templates[index],
    ...body
  };

  await saveDbData(db);

  return NextResponse.json(db.templates[index]);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = await getDbData();
  const resolvedParams = await params;

  db.templates = db.templates.filter(
    (t: any) => t.id !== resolvedParams.id
  );

  await saveDbData(db);

  return NextResponse.json({ success: true });
}