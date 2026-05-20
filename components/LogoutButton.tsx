"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {

    const handleLogout = async () => {
        const confirmLogout = window.confirm("Logout from system?");
        if (!confirmLogout) return;

        await signOut({
            redirect: false 
        });

        const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        window.location.href =
            `https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=${baseUrl}/login`;
    };

    return (
        <button
            onClick={handleLogout}
            title="Sign out of the File Automation System"
            className="w-full px-4 py-2.5 bg-white text-gray-700 font-medium border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-all duration-200 flex items-center justify-center gap-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign out
        </button>
    );
}