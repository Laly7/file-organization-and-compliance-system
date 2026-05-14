import { getDbData } from "@/lib/db";
import EditRuleClient from "./EditRuleClient";

export default async function EditRulePage({ searchParams }: any) {
  const sp = await searchParams;
  
  const dbData = await getDbData();
  const rule = dbData?.rules.find((r: any) => r.id === parseInt(sp.id));

  if (!rule) {
    return <div className="p-10 text-center text-xl text-red-600">Rule not found!</div>;
  }

  return <EditRuleClient rule={rule} />;
}