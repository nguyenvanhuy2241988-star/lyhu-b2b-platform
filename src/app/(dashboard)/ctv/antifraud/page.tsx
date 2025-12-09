import { ShieldAlert } from "lucide-react";

export default function CTVAntiFraudPage() {
    return (
        <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <ShieldAlert className="w-8 h-8 text-red-600" />
                <h1 className="text-2xl font-bold text-slate-900">Chính sách & Quy tắc</h1>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <p className="text-slate-600">Thông tin về chính sách chống gian lận và quy tắc ứng xử.</p>
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-green-700 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Tài khoản của bạn đang ở trạng thái tốt.
                    </p>
                </div>
            </div>
        </div>
    );
}
