import { auth } from "@/auth";
import { getDbData } from "@/lib/db";

export default async function EditTemplatePage({ searchParams }: any) {

  const session = await auth();
  if (!session) return <div className="p-10">Access Denied</div>;

  const sp = searchParams;
  const dbData = await getDbData();

  const template = dbData?.templates.find((t: any) => t.id === sp.id);

  if (!template) {
    return <div className="p-10 text-red-500">Template not found</div>;
  }
}