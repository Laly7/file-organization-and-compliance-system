"use client";

//importing Next.js built-in Image component for optimized images
import Image from "next/image";
import { signIn } from "next-auth/react";
import { LayoutGrid } from "lucide-react";

//main function
//NOTES: React components should be PascalCase
export default function Login() {
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
                    onClick={() => signIn("microsoft-entra-id", {callbackUrl: "/system/dashboard", prompt: "select_account consent"})}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-3 mx-auto transition">
                    <Image
                        src="/microsoft-logo.svg"
                        alt="Microsoft Logo"
                        width={20}
                        height={20}
                    />
                        Sign in with Microsoft
                </button>
            </div>
        </div>
    );
}
