import { auth } from "@/auth";
import Image from "next/image";
import LogoutButton from "@/components/LogoutButton";

export default async function UserProfile() {
    const session = await auth();

    if (!session) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Please log in.</p>
            </div>
        );
    }

    const userName = session.user?.name || "User";

    //console.log(session);
    return (
        <div className="flex items-center justify-center min-h-[90vh]">

            <div className="w-full max-w-sm rounded-3xl shadow-xl overflow-hidden bg-white border border-gray-100 transition-all duration-300 hover:shadow-2xl">
                <div className="flex flex-col items-center pt-10 pb-6 px-6 relative">
                    {/* Decorative background element */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-10 rounded-b-[40%]"></div>
                    
                    <div className="relative z-10">
                        {session?.user?.image ? (
                            <Image
                                width={128}
                                height={128}
                                alt={session?.user?.name || ""}
                                src={session?.user?.image || ""}
                                className="w-32 h-32 rounded-full shadow-lg ring-4 ring-white object-cover"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full shadow-lg ring-4 ring-white bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
                                {session?.user?.name?.charAt(0).toUpperCase()}
                                {session?.user?.name?.split(" ")[1]?.charAt(0).toUpperCase() || ""}
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center px-6 pb-8">
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">{session?.user?.name}</h2>
                    <p className="text-sm font-medium text-gray-500 mt-1">{session?.user?.email}</p>
                </div>

                <div className="bg-gray-50 px-6 py-8 border-t border-gray-100 flex justify-center">
                    <div className="w-full max-w-[200px] mt-2">
                        <LogoutButton />
                    </div>
                </div>
            </div> 
        </div>
    );
}

    
