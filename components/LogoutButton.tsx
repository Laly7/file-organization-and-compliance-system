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
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
            Logout
        </button>
    );
}