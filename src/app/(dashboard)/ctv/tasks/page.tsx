"use client";

import { CheckSquare, Clock, Trophy, ArrowRight, Target } from "lucide-react";

export default function CTVTasksPage() {
    const tasks = [
        {
            id: 1,
            title: "Hoàn tất hồ sơ CTV",
            description: "Cập nhật đầy đủ thông tin cá nhân và tài khoản ngân hàng để nhận hoa hồng.",
            reward: "10 điểm",
            status: "completed",
            progress: 100,
            deadline: "Không thời hạn"
        },
        {
            id: 2,
            title: "Đơn hàng đầu tiên",
            description: "Bán thành công đơn hàng đầu tiên trị giá trên 500k.",
            reward: "Bonus 50k",
            status: "in_progress",
            progress: 60,
            deadline: "30/12/2024"
        },
        {
            id: 3,
            title: "Tuyển 3 CTV mới",
            description: "Giới thiệu 3 người bạn tham gia mạng lưới CTV của LYHU.",
            reward: "Bonus 100k",
            status: "pending",
            progress: 0,
            deadline: "15/01/2025"
        }
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                        <CheckSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Nhiệm vụ & Thử thách</h1>
                        <p className="text-slate-500 text-sm">Hoàn thành nhiệm vụ để nhận thưởng thêm.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map((task) => (
                    <div key={task.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                        {task.status === "completed" && (
                            <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg">
                                Hoàn thành
                            </div>
                        )}

                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2 rounded-lg ${task.status === "completed" ? "bg-green-50 text-green-600" :
                                    task.status === "in_progress" ? "bg-blue-50 text-blue-600" :
                                        "bg-slate-50 text-slate-500"
                                }`}>
                                <Target className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                                +{task.reward}
                            </span>
                        </div>

                        <h3 className="font-semibold text-slate-900 mb-2">{task.title}</h3>
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{task.description}</p>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Tiến độ</span>
                                <span>{task.progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${task.status === "completed" ? "bg-green-500" : "bg-blue-600"
                                        }`}
                                    style={{ width: `${task.progress}%` }}
                                ></div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Hết hạn: {task.deadline}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State / Completed All */}
            <div className="mt-8 p-8 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-center">
                <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                <h3 className="font-medium text-slate-900">Nhiệm vụ sắp tới</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                    Hãy quay lại sau để cập nhật các thử thách mới nhất từ hệ thống.
                </p>
            </div>
        </div>
    );
}
