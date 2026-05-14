"use client";
import { signOut } from "next-auth/react";

function Logout() {
    return (
        <button
            onClick={() => signOut({callbackUrl: "/", redirect: true,})}
            className="w-full bg-blue-800 text-white p-3 rounded-md hover:opacity-80"
        >
            Logout
        </button>
    );
}

export default Logout;