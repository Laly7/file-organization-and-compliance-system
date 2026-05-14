import { getDbData } from "@/lib/db";
import RulesClient from "./RuleClient";

export default async function RulesPage() {
  const dbData = await getDbData();
  const rules = dbData?.rules || [];

  return <RulesClient initialRules={rules} />;
}