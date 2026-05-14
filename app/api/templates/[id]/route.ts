import { NextResponse } from "next/server";
import { getDbData, saveDbData } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const db = await getDbData();

  const template = db.templates.find(
    (t: any) => t.id === params.id
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
  { params }: { params: { id: string } }
) {
  const db = await getDbData();
  const body = await req.json();

  const index = db.templates.findIndex(
    (t: any) => t.id === params.id
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
  { params }: { params: { id: string } }
) {
  const db = await getDbData();

  db.templates = db.templates.filter(
    (t: any) => t.id !== params.id
  );

  await saveDbData(db);

  return NextResponse.json({ success: true });
}