"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ScanningPopUPPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const steps = [
    "Reading Folder Structure",
    "Checking Files & Names",
    "Validating with Template",
    "Generating Result"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= 3) {
          clearInterval(timer);
          setTimeout(() => router.push("/system/scan/scan-result"), 500);
          return 3;
        }
        return prev + 1;
      });
    }, 800);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex h-[calc(100vh-200px)] items-center justify-center">
      <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 text-center w-full max-w-lg transform animate-in fade-in zoom-in duration-300">
        <h1 className="text-2xl font-black text-gray-800 mb-2">Scanning folder...</h1>
        <p className="text-gray-400 text-sm font-mono mb-10 bg-gray-50 py-2 rounded-lg truncate px-4">/OneDrive/FYP_Project_2026</p>
        <div className="space-y-6 mb-10">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-4 transition-all duration-500">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  i < step ? "bg-green-100 border-green-500" : 
                  i === step ? "border-blue-500 animate-pulse" : "border-gray-200"
                }`}
              >
                {i < step ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : i === step ? (
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-ping"></div>
                ) : (
                  <div className="h-2 w-2 bg-gray-200 rounded-full "></div>
                )}
              </div>
              <span className={`text-lg font-bold transition-colors ${
                  i < step ? "text-gray-800" :
                  i === step ? "text-blue-600" : "text-gray-300"
                }`}
              >
                {s}{i === step ? "..." : ""}
              </span>
            </div>
          ))}
        </div>

        <button 
          onClick={() => router.push("/scan")}
          className="px-10 py-3 bg-slate-300 text-slate-900 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-slate-400 transition-all active:scale-95"
        >
          Cancel
        </button>

      </div>
    </div>
  );
}