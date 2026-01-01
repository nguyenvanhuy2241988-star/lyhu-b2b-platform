"use client";

import React from "react";
import { Hammer } from "lucide-react";

export default function CrmPipelinePage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
            <div className="p-4 bg-slate-100 rounded-full mb-4">
                <Hammer className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">CRM Pipeline</h2>
            <p>Tính năng đang được phát triển.</p>
        </div>
    );
}
