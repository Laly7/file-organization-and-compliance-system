import { auth } from "@/auth";
import { getDbData } from "@/lib/db";
import TemplateClient from "./select-template/TemplateClient";

export default async function TemplatePage() {
    const session = await auth();

    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center text-gray-600">
                    <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                    <p>Please log in to access templates.</p>
                </div>
            </div>
        );
    }

    const dbData = await getDbData();
    const templates = dbData?.templates ?? [];

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <TemplateClient templates={templates} />
        </div>
    );
}