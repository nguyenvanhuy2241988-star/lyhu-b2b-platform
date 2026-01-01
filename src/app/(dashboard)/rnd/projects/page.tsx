'use client';

import { useState } from "react";
import { Plus, MoreVertical, FlaskConical } from "lucide-react";

export default function RndProjectsPage() {
    const [projects] = useState([
        { id: 1, title: 'BST Thu Đông 2025', status: 'Ideation', items: 12, dueDate: '2025-10-01' },
        { id: 2, title: 'Dòng sản phẩm Eco-Life', status: 'Testing', items: 5, dueDate: '2025-08-15' },
        { id: 3, title: 'Cải tiến bao bì Ver 2', status: 'Review', items: 1, dueDate: '2025-06-30' },
    ]);

    const getStatusColor = (s:string) => {
        if(s === 'Ideation') return 'bg-blue-100 text-blue-700';
        if(s === 'Testing') return 'bg-orange-100 text-orange-700';
        if(s === 'Review') return 'bg-purple-100 text-purple-700';
        return 'bg-slate-100 text-slate-700';
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dự án R&D</h1>
                    <p className="text-slate-500">Quản lý các dự án nghiên cứu sản phẩm mới</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 shadow-sm font-medium">
                    <Plus className="w-4 h-4" />
                    Tạo dự án
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(proj => (
                    <div key={proj.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-lg bg-slate-50`}>
                                <FlaskConical className="w-6 h-6 text-slate-600" />
                            </div>
                            <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-5 h-5" /></button>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1">{proj.title}</h3>
                        <p className="text-sm text-slate-500 mb-4">{proj.items} sản phẩm</p>
                        
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                             <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(proj.status)}`}>
                                {proj.status}
                             </span>
                             <span className="text-xs text-slate-500">Hạn: {proj.dueDate}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
