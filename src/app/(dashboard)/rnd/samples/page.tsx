'use client';

import { Search, Filter, Box } from "lucide-react";

export default function RndSamplesPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Mẫu</h1>
                    <p className="text-slate-500">Theo dõi trạng thái mẫu thử</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-200" placeholder="Tìm tên mẫu..." />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="px-6 py-4">Tên Mẫu</th>
                            <th className="px-6 py-4">Dự án</th>
                            <th className="px-6 py-4">Ngày gửi</th>
                            <th className="px-6 py-4">Trạng thái</th>
                            <th className="px-6 py-4 text-right">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                                <Box className="w-4 h-4 text-slate-400" /> SMP-001-A
                            </td>
                            <td className="px-6 py-4">BST Thu Đông 2025</td>
                            <td className="px-6 py-4 text-slate-500">20/12/2025</td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-bold">In Transit</span>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-400">Đang gửi xưởng A</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                                <Box className="w-4 h-4 text-slate-400" /> SMP-002-B
                            </td>
                            <td className="px-6 py-4">Dòng Eco-Life</td>
                            <td className="px-6 py-4 text-slate-500">18/12/2025</td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold">Approved</span>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-400">Đạt chuẩn</td>
                        </tr>
                    </tbody>
                </table>
                <div className="p-8 text-center text-slate-400 text-sm">
                    Dữ liệu demo
                </div>
            </div>
        </div>
    );
}
