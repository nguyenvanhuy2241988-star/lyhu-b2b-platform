import React from "react";
import { Clapperboard, Copy, X, Zap, Camera, Sparkles } from "lucide-react";
import { DirectorGuide } from "@/lib/videoProjectStore";

interface DirectorHubModalProps {
    isOpen: boolean;
    onClose: () => void;
    directorGuide: DirectorGuide | null;
    customHookTitle: string;
    clipSwitchInterval: number;
    onCopyShotlist: () => void;
}

const DEFAULT_SHOTS = [
    {
        shotNumber: 1,
        shotType: "Cận Cảnh (Close-up)",
        cameraMovement: "Zoom in dứt khoát",
        action: "Tay xé seal thùng hàng hoặc bẻ đôi củ khoai môn / xé gói snack giòn rụm trước ống kính.",
        dialogueSnippet: "Hàng mới về đêm qua date mới tinh...",
        sfx: "Tiếng xé bọc / giòn rụm 'Rắc'"
    },
    {
        shotNumber: 2,
        shotType: "Toàn Cảnh (Wide)",
        cameraMovement: "Lia máy ngang (Pan)",
        action: "Quay container hoặc các kệ pallet hàng chất cao ngập lối tại tổng kho LYHU.",
        dialogueSnippet: "Container vừa đáp kho lúc nửa đêm, nguyên đai nguyên kiện...",
        sfx: "Tiếng còi xe nâng / tiếng kho rộn ràng"
    },
    {
        shotNumber: 3,
        shotType: "Cực Cận (Macro)",
        cameraMovement: "Cố định (Static)",
        action: "Soi rõ nhãn mác NSX, HSD mới tinh năm 2026, màu sắc tươi ngon không vụn vỡ.",
        dialogueSnippet: "Hàng date mới toanh, chất lượng bao test từng kiện...",
        sfx: "Tiếng sột soạt kiểm hàng"
    },
    {
        shotNumber: 4,
        shotType: "Trung Cảnh (Medium)",
        cameraMovement: "Góc thấp hất lên (Low Angle)",
        action: "Nhân sự dán băng keo niêm phong thùng LYHU, xếp lên xe chuyển phát nhanh giao sỉ.",
        dialogueSnippet: "Anh em NPP lấy bao nhiêu kiện cứ chốt số lượng là đi ngay trong ngày...",
        sfx: "Tiếng kéo băng dính 'Rẹt rẹt'"
    },
    {
        shotNumber: 5,
        shotType: "Cận Cảnh (Call to action)",
        cameraMovement: "Chĩa thẳng sản phẩm",
        action: "Giơ sản phẩm về phía người xem, vẫy tay hoặc chỉ vào phần nhắn tin nhận bảng giá sỉ.",
        dialogueSnippet: "Nhắn liền LYHU để nhận mẫu thử & giá sỉ tận gốc nha cả nhà!",
        sfx: "Tiếng ting ting chốt đơn"
    }
];

export const DirectorHubModal: React.FC<DirectorHubModalProps> = ({
    isOpen,
    onClose,
    directorGuide,
    customHookTitle,
    clipSwitchInterval,
    onCopyShotlist
}) => {
    if (!isOpen) return null;

    const displayShots = (directorGuide?.shots && directorGuide.shots.length > 0)
        ? directorGuide.shots
        : DEFAULT_SHOTS.map(s => s.shotNumber === 1 ? { ...s, dialogueSnippet: customHookTitle || s.dialogueSnippet } : s);

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="max-w-4xl w-full bg-white text-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center shrink-0">
                            <Clapperboard className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                                    Bảng Phân Cảnh & Chỉ Đạo Quay Của Đạo Diễn AI
                                </h3>
                                <span className="text-[10px] bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded font-bold tracking-wide">
                                    CHUẨN LYHU
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Chỉ đạo đội quay Smartphone tại kho LYHU • 5 góc quay nhịp 2.5s Jump-cut • Giữ chân người xem tối đa
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onCopyShotlist}
                            className="px-3.5 py-1.5 bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Gửi Zalo</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1 text-xs bg-slate-50/50">
                    {/* Hook Section */}
                    <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-primary-700 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                                <Zap className="w-4 h-4 text-primary-600" />
                                <span>QUY TẮC 3 GIÂY ĐẦU (VISUAL & SPOKEN HOOK ĐẬP MẮT):</span>
                            </div>
                            <span className="text-[10px] text-primary-700 font-semibold bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                                Giữ chân 70%+ người xem
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                                <div className="text-[11px] font-bold text-slate-700">🎯 Hình ảnh đập mắt (Visual Hook):</div>
                                <div className="text-slate-800 leading-relaxed text-xs">
                                    {directorGuide?.hookVisual || "Cận cảnh mở bao/thùng hàng, hoặc hành động xé bọc, bẻ đôi sản phẩm giòn rụm ngay 1 giây đầu."}
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                                <div className="text-[11px] font-bold text-slate-700">🎙️ Câu thoại mở màn (Spoken Hook):</div>
                                <div className="text-slate-800 italic leading-relaxed text-xs">
                                    "{directorGuide?.spokenHook || customHookTitle || "Hàng mới về đêm qua date mới tinh, đừng vội mua chỗ khác!"}"
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5-Shot Storyboard Grid */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                                <Camera className="w-4 h-4 text-primary-600" />
                                <span>BẢNG 5 GÓC MÁY QUAY BẰNG ĐIỆN THOẠI (Quay mỗi đoạn 2.5 - 3s):</span>
                            </h4>
                            <span className="text-[11px] text-slate-500 font-mono">
                                Nhịp cắt: {directorGuide?.pacingSpeed || `${clipSwitchInterval}s`}
                            </span>
                        </div>

                        <div className="space-y-2.5">
                            {displayShots.map((shot) => (
                                <div
                                    key={shot.shotNumber}
                                    className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-primary-400 transition-colors space-y-2"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded bg-primary-500 text-white font-bold text-[11px]">
                                                CẢNH {shot.shotNumber}
                                            </span>
                                            <span className="font-bold text-slate-800 text-xs">
                                                [{shot.shotType}]
                                            </span>
                                            <span className="text-slate-500 text-[11px]">
                                                • Chuyển động: <strong className="text-primary-700 font-semibold">{shot.cameraMovement}</strong>
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                            Âm thanh: {shot.sfx}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                        <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200">
                                            <span className="text-slate-500 font-bold block mb-0.5">🎬 Thao tác nhân sự kho:</span>
                                            <span className="text-slate-800 leading-relaxed">{shot.action}</span>
                                        </div>
                                        <div className="p-2.5 rounded-md bg-primary-50/40 border border-primary-100">
                                            <span className="text-primary-800 font-bold block mb-0.5">🎙️ Lời thoại khớp hình:</span>
                                            <span className="text-slate-800 italic leading-relaxed">"{shot.dialogueSnippet}"</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Practical Shooting Tips */}
                    <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary-600" />
                            <span>3 MẸO QUAY THỰC CHIẾN BẰNG SMARTPHONE TẠI TỔNG KHO LYHU:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 space-y-1">
                                <div className="font-bold text-slate-800 text-[11px]">1. Lau sạch camera & Quay dọc 9:16</div>
                                <p className="text-slate-600 text-[11px] leading-relaxed">
                                    Dùng camera sau, lau sạch mồ hôi/bụi trên kính máy. Luôn quay dọc khung hình 9:16 để video TikTok nét nhất.
                                </p>
                            </div>
                            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 space-y-1">
                                <div className="font-bold text-slate-800 text-[11px]">2. Quay cận cảnh 30-50cm & Chạm lấy nét</div>
                                <p className="text-slate-600 text-[11px] leading-relaxed">
                                    Đưa camera gần sản phẩm để thấy rõ thớ khoai môn hoặc date in trên thùng. Giữ tay chắc không run.
                                </p>
                            </div>
                            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 space-y-1">
                                <div className="font-bold text-slate-800 text-[11px]">3. Bấm quay 3 giây rồi đổi góc</div>
                                <p className="text-slate-600 text-[11px] leading-relaxed">
                                    Không cần lia máy dài dòng! Cứ quay mỗi góc 3s, nạp vào Studio này AI sẽ tự động Jump-cut cắt nhịp 2.5s chuẩn TikTok.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="p-3.5 rounded-lg bg-primary-50 border border-primary-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <span className="text-[11px] text-primary-700 font-semibold block">LỜI KÊU GỌI HÀNH ĐỘNG (CTA KẾT VIDEO):</span>
                            <span className="text-xs font-bold text-primary-900">
                                {directorGuide?.callToAction || "Nhắn liền LYHU để nhận mẫu thử & bảng giá sỉ!"}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onCopyShotlist}
                            className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                        >
                            <Copy className="w-4 h-4" />
                            <span>Copy Gửi Zalo Cho Đội Quay</span>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                        💡 Sau khi quay xong các clip, nạp vào <strong>Bước 2</strong> để Studio tự động cắt ghép!
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                        Đã Hiểu & Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};
