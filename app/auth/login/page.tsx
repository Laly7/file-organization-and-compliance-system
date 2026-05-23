"use client";

import React, { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";

export default function Login() {
    const [isSigningIn, setIsSigningIn] = useState(false);

    const handleSignIn = () => {
      setIsSigningIn(true);
      signIn("microsoft-entra-id", { callbackUrl: "/system/dashboard", prompt: "select_account consent" });
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100"> 
        {/*Tailwind CSS classes to style the container*/}
            <div className="bg-white px-12 py-10 rounded-xl shadow-md text-center w-[420px]">
                <div className="flex justify-center mb-6">
                    {/*logo*/}
                    <Image
                        src={"/swinburne-logo.png"} //path to the image file in /public folder
                        alt="Swinburne Logo" //alt text shown if image fails to load
                        width={280} //img width in pixels
                        height={120} //img height in pixels
                        className="mb-6" //adds styling (mb-6: margin-bottom (1-10))
                    />
                </div>
    
                {/*title*/}
                <h1 className="text-3xl font-bold mb-2 text-black">FILE AUTOMATION SYSTEM</h1>

                {/*subtitle*/}
                <p className="text-gray-700 mb-6 text-lg">Access you OneDrive securely</p>

                {/*button*/}
                <button 
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="bg-indigo-700 hover:bg-indigo-800 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-3 mx-auto transition cursor-pointer font-semibold">
                    <Image
                        src="/microsoft-logo.svg"
                        alt="Microsoft Logo"
                        width={20}
                        height={20}
                    />
                        {isSigningIn ? 'Signing in...' : 'Sign in with Microsoft'}
                </button>
            </div>
        </div>
    );
}
