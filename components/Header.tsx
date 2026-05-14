import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";

export default async function Header() {
    const session = await auth();
    const userName = session?.user?.name || "User";
    const loginDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', });
    
    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm shrink-0">
            <div className="flex items-center gap-4">
                <div className="md:hidden">
                    {/* Mobile menu toggle could go here */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </div>
                
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">File Automation System</h1>
            </div>

            <div className="flex items-center gap-6">
                {session ? (
                    <>
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-500 leading-none mb-1">Last Login</p>
                            <p className="text-xs font-bold text-blue-600">{loginDate}</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden md:block">
                                <p className="text-xs text-gray-500 leading-none">Signed in as</p>
                                <p className="text-sm font-semibold text-gray-800">{userName}</p>
                            </div>

                            {/* CLICKABLE AVATAR */}
                            <Link href="/system/user-profile">
                                {session.user?.image ? (
                                    <Image
                                        src={session.user.image}
                                        alt="User"
                                        width={40}
                                        height={40}
                                        className="rounded-full border border-blue-200 cursor-pointer hover:scale-105 transition"
                                    />
                                ) : (
                                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold border border-blue-200 cursor-pointer hover:scale-105 transition">
                                        {userName.charAt(0)}
                                    </div>
                                )}
                            </Link>
                        </div>
                    </>
                ) : (
                    <Link 
                        href="/api/auth/signin"
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                    >
                        Sign In
                    </Link>
                )}
            </div>
        </header>
    );
}
