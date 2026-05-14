import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function AuthenticatedLayout({
    children,
} : {
    children: React.ReactNode;
}) 
{
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <Header />

                <main className="flex-1 overflow-y-auto p-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
