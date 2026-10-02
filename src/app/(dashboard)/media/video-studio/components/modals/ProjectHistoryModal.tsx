import React from "react";
import { FolderOpen, X, Clapperboard, CheckCircle2, Trash2, Save } from "lucide-react";
import { VideoProjectItem } from "@/lib/videoProjectStore";

interface ProjectHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoProjects: VideoProjectItem[];
    onLoadProject: (proj: VideoProjectItem) => void;
    onDeleteProject: (id: string, e: React.MouseEvent) => void;
    onManualSaveProject: () => void;
    isSavingProject: boolean;
}

export const ProjectHistoryModal: React.FC<ProjectHistoryModalProps> = ({
    isOpen,
    onClose,
    videoProjects,
    onLoadProject,
    onDeleteProject,
    onManualSaveProject,
    isSavingProject
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-white">
                    <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-purple-600 text-white shadow-sm">
                            <FolderOpen className="w-5 h-5" />
                        </span>
                        <div>
                            <h3 className="font-bold text-gray-900 text-base">
                                Sổ Tay Kịch Bản & Lịch Sử Dự Án Video
                            </h3>
                            <p className="text-xs text-gray-500">
                                Lưu trữ an toàn trên máy ({videoProjects.length} dự án) • Không bao giờ mất kịch bản khi F5!
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Project List */}
                <div className="overflow-y-auto p-4 sm:p-5 space-y-3 flex-1">
                    {videoProjects.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <FolderOpen className="w-7 h-7" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-sm text-gray-800">Chưa có dự án nào được lưu</p>
                                <p className="text-xs text-gray-500 max-w-md mx-auto">
                                    Khi bạn bấm "✨ AI Học Phong Cách & Cấu Hình Studio", "Lưu Dự Án" hoặc xuất video, kịch bản và bảng phân cảnh sẽ tự động lưu vào đây.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onManualSaveProject}
                                className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 transition-colors shadow-sm"
                            >
                                Lưu Kịch Bản Hiện Tại
                            </button>
                        </div>
                    ) : (
                        videoProjects.map((proj) => (
                            <div
                                key={proj.id}
                                onClick={() => onLoadProject(proj)}
                                className="p-4 rounded-xl border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer bg-white group space-y-2.5"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-gray-900 group-hover:text-purple-700 transition-colors">
                                            {proj.title}
                                        </span>
                                        <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                                            {proj.aspectRatio}
                                        </span>
                                        {proj.directorGuide?.shots?.length ? (
                                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                                <Clapperboard className="w-2.5 h-2.5" /> 5 Shot Đạo Diễn
                                            </span>
                                        ) : null}
                                        {proj.renderedVideoUrl && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                                <CheckCircle2 className="w-2.5 h-2.5" /> Có file video
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-gray-400">
                                            {new Date(proj.createdAt).toLocaleDateString("vi-VN", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => onDeleteProject(proj.id, e)}
                                            className="p-1 text-gray-300 hover:text-red-600 transition-colors rounded-lg"
                                            title="Xóa dự án"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-600 line-clamp-2 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                    "{proj.script}"
                                </p>

                                <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-500 pt-1">
                                    <div className="flex items-center gap-2">
                                        <span>Nhịp cắt: <strong>{proj.clipSwitchInterval}s</strong></span>
                                        <span>•</span>
                                        <span>Chữ: <strong className="capitalize">{proj.textAnimationEffect || "Pop"}</strong></span>
                                        <span>•</span>
                                        <span>Màu: <span className="inline-block w-3 h-3 rounded-full align-middle border border-gray-300" style={{ backgroundColor: proj.textColor }} /></span>
                                    </div>
                                    <span className="text-purple-600 font-bold group-hover:underline flex items-center gap-1">
                                        Nhấn để dựng lại dự án này →
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onManualSaveProject}
                        disabled={isSavingProject}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                        <Save className="w-3.5 h-3.5 text-amber-400" />
                        <span>Lưu kịch bản đang mở</span>
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};
