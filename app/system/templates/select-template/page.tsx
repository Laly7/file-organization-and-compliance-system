import { auth } from "@/auth";
import { getDbData } from "@/lib/db";
import TemplateClient from "./TemplateClient";

export default async function TemplateSelectionPage() {
  const session = await auth();

  if (!session) return <div className="p-10">Access Denied</div>;

  const dbData = await getDbData();
  const templates = dbData?.templates || [];

  return <TemplateClient templates={templates} />;
}