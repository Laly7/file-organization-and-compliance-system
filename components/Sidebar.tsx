"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(true);

  const navItems = [
    { name: "Dashboard", href: "/system/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Scan Folder", href: "/system/scan/select-folder", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
    { name: "Templates", href: "/system/templates", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { name: "Rules Based Engine", href: "/system/rules", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    { name: "Report", href: "/system/report", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  ];

  const handleLogout = () => { router.push("/system/user-profile?action=logout"); };

  return (
    <aside
            className={`h-full bg-white border-r border-gray-100 flex flex-col transition-all duration-300 
            ${isOpen ? "w-64" : "w-20"}`}
        >
            <div className="p-4 flex justify-between items-center border-b border-gray-100">
                {isOpen && (
                    <Image
                        src="/swinburne-logo.png"
                        alt="Logo"
                        width={120}
                        height={50}
                    />
                )}

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                    {isOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            <nav className="flex-1 mt-4 space-y-1 px-2">
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        pathname.startsWith(item.href + "/");

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-4 border-l-4 transition-all
                            ${
                                isActive
                                    ? "bg-blue-50 text-blue-700 border-blue-600 font-bold"
                                    : "text-gray-600 border-transparent hover:bg-gray-50 hover:text-blue-600"
                            }`}
                        >
                            <svg
                                className="h-6 w-6 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d={item.icon}
                                />
                            </svg>

                            {isOpen && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-3 w-full px-4 py-4 text-red-500 font-medium hover:bg-red-50 rounded-lg`}
                >
                    <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                    </svg>

                    {isOpen && <span>Logout</span>}
                </button>
            </div>
        </aside>
  );
}
