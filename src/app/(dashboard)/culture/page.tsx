"use client";

import React from "react";

export default function CulturePage() {
    return (
        <div className="h-[calc(100vh-64px)] w-full flex flex-col bg-slate-50">
            <div className="p-6 bg-white border-b border-slate-200">
                <h1 className="text-2xl font-bold text-slate-800">Văn hóa doanh nghiệp</h1>
                <p className="text-slate-500 text-sm mt-1">Tìm hiểu về giá trị, sứ mệnh và văn hóa tại LYHU</p>
            </div>
            <div className="flex-1 w-full p-6">
                <iframe 
                    src="/documents/culture.pdf#toolbar=0" 
                    className="w-full h-full rounded-xl shadow-sm border border-slate-200"
                    title="Văn hóa doanh nghiệp LYHU"
                />
            </div>
        </div>
    );
}
