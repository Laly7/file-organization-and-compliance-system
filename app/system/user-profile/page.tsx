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

            <div className="min-w-[30%] max-w-[50%] rounded-xl shadow-2xl overflow-hidden bg-black">
                <div className="flex flex-col items-center py-6">
                    {session?.user?.image ? (
                        <Image
                            width={100}
                            height={100}
                            alt={session?.user?.name || ""}
                            src={session?.user?.image || ""}
                            className="w-20 h-20 rounded-full border border-yellow-500 shadow-md"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full border border-yellow-500 shadow-md bg-blue-500 flex items-center justify-center text-white">
                            {session?.user?.name?.charAt(0).toUpperCase()}
                            {session?.user?.name?.split(" ")[1]?.charAt(0).toUpperCase() || ""}
                        </div>
                    )}
                </div>

                <div className="text-center text-sm">
                    <p>{session?.user?.name}</p>
                    <p>{session?.user?.email}</p>
                </div>

                <div className="bg-gray-100 py-5 flex justify-center">
                    <LogoutButton />
                </div>
            </div> 
        </div>
    );
}

    
