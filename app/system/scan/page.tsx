"use client";

import { useRouter } from "next/navigation";

export default function ScanPage() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto text-center py-20">
      <h1 className="text-3xl font-black text-gray-800 uppercase tracking-widest">
        Scan System
      </h1>

      <p className="text-gray-500 mt-4">
        Start a new compliance scan by selecting a OneDrive folder
      </p>

      <div className="mt-10">
        <button
          onClick={() => router.push("/system/scan/select-folder")}
          className="px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition"
        >
          Start Scan
        </button>
      </div>
    </div>
  );
}