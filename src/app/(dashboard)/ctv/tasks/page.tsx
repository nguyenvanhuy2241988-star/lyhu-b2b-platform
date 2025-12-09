import { CheckSquare } from "lucide-react";

export default function CTVTasksPage() {
    return (
        <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <CheckSquare className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900">Nhiệm vụ</h1>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <p className="text-slate-600">Danh sách các nhiệm vụ và thử thách dành cho Cộng tác viên.</p>
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100 text-center text-slate-500 text-sm">
                    Chưa có nhiệm vụ mới.
                </div>
            </div>
        </div>
    );
}
