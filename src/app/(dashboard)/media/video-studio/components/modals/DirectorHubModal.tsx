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
        cameraMovement: "Zoom in từ từ",
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="max-w-4xl w-full bg-slate-900 text-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-amber-500/40 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-amber-500/30 flex items-center justify-between bg-gradient-to-r from-amber-950/60 via-slate-900 to-purple-950/60">
                    <div className="flex items-center gap-3">
                        <span className="p-2.5 rounded-xl bg-amber-400 text-slate-950 shadow-md">
                            <Clapperboard className="w-6 h-6" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white text-base sm:text-lg">
                                    Bảng Phân Cảnh & Chỉ Đạo Quay Của Đạo Diễn AI
                                </h3>
                                <span className="text-[10px] bg-amber-400 text-black px-2 py-0.5 rounded font-black tracking-wide">
                                    24ZONE STYLE
                                </span>
                            </div>
                            <p className="text-xs text-amber-200/80">
                                Chỉ đạo đội quay Smartphone tại kho LYHU • 5 góc quay nhịp 2.5s Jump-cut • Giữ chân người xem 100%
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onCopyShotlist}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-black font-bold text-xs rounded-xl hover:opacity-95 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Gửi Zalo</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1 text-xs">
                    {/* Hook Section */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border border-amber-500/40 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-amber-400 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <span>QUY TẮC 3 GIÂY ĐẦU (VISUAL & SPOKEN HOOK ĐẬP MẮT):</span>
                            </div>
                            <span className="text-[10px] text-amber-300 font-mono">Giữ chân 70%+ người xem</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-1">
                                <div className="text-[11px] font-bold text-amber-300">🎯 Hình ảnh đập mắt (Visual Hook):</div>
                                <div className="text-gray-200 leading-relaxed">
                                    {directorGuide?.hookVisual || "Cận cảnh mở bao/thùng hàng, hoặc hành động xé bọc, đổ sản phẩm giòn rụm ngay 1 giây đầu."}
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-1">
                                <div className="text-[11px] font-bold text-amber-300">🎙️ Câu thoại mở màn (Spoken Hook):</div>
                                <div className="text-gray-200 italic leading-relaxed">
                                    "{directorGuide?.spokenHook || customHookTitle || "Hàng mới về đêm qua date mới tinh, đừng vội mua chỗ khác!"}"
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5-Shot Storyboard Grid */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-white flex items-center gap-2">
                                <Camera className="w-4 h-4 text-amber-400" />
                                <span>BẢNG 5 GÓC MÁY QUAY BẰNG ĐIỆN THOẠI (Quay mỗi đoạn 2.5 - 3s):</span>
                            </h4>
                            <span className="text-[11px] text-gray-400 font-mono">Nhịp cắt: {directorGuide?.pacingSpeed || `${clipSwitchInterval}s`}</span>
                        </div>

                        <div className="space-y-3">
                            {displayShots.map((shot) => (
                                <div
                                    key={shot.shotNumber}
                                    className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/50 transition-colors space-y-2"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded bg-amber-400 text-black font-black text-xs">
                                                CẢNH {shot.shotNumber}
                                            </span>
                                            <span className="font-bold text-white">
                                                [{shot.shotType}]
                                            </span>
                                            <span className="text-gray-400 text-[11px]">
                                                • Chuyển động: <strong className="text-amber-300">{shot.cameraMovement}</strong>
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-purple-300 font-mono bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                                            Âm thanh: {shot.sfx}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                        <div className="p-2 rounded bg-black/30 border border-white/5">
                                            <span className="text-gray-400 font-semibold">🎬 Thao tác nhân sự kho: </span>
                                            <span className="text-gray-200">{shot.action}</span>
                                        </div>
                                        <div className="p-2 rounded bg-black/30 border border-white/5">
                                            <span className="text-gray-400 font-semibold">🎙️ Lời thoại khớp hình: </span>
                                            <span className="text-amber-200 italic">"{shot.dialogueSnippet}"</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Practical Shooting Tips */}
                    <div className="p-4 rounded-xl bg-purple-950/50 border border-purple-500/30 space-y-2">
                        <div className="text-xs font-bold text-purple-300 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span>3 MẸO QUAY THỰC CHIẾN BẰNG SMARTPHONE TẠI TỔNG KHO LYHU:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                                <div className="font-bold text-white text-[11px]">1. Lau sạch camera & Quay dọc 9:16</div>
                                <p className="text-gray-300 text-[10px] leading-relaxed">
                                    Dùng camera sau, lau sạch mồ hôi/bụi trên kính máy. Luôn quay dọc khung hình 9:16 để video TikTok nét nhất.
                                </p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                                <div className="font-bold text-white text-[11px]">2. Quay cận cảnh 30-50cm & Chạm lấy nét</div>
                                <p className="text-gray-300 text-[10px] leading-relaxed">
                                    Đưa camera gần sản phẩm để thấy rõ thớ khoai môn hoặc date in trên thùng. Giữ tay chắc không run.
                                </p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                                <div className="font-bold text-white text-[11px]">3. Bấm quay 3 giây rồi đổi góc</div>
                                <p className="text-gray-300 text-[10px] leading-relaxed">
                                    Không cần lia máy dài dòng! Cứ quay mỗi góc 3s, nạp vào Studio này AI sẽ tự động Jump-cut cắt nhịp 2.5s chuẩn TikTok.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="p-3.5 rounded-xl bg-slate-800 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <span className="text-[11px] text-gray-400 font-semibold block">LỜI KÊU GỌI HÀNH ĐỘNG (CTA KẾT VIDEO):</span>
                            <span className="text-xs font-bold text-amber-300">
                                {directorGuide?.callToAction || "Nhắn liền LYHU để nhận mẫu thử & bảng giá sỉ!"}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onCopyShotlist}
                            className="px-4 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 transition-colors flex items-center justify-center gap-1.5 shrink-0"
                        >
                            <Copy className="w-4 h-4" />
                            <span>Copy Gửi Zalo Cho Đội Quay</span>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                        💡 Sau khi quay xong các clip, nạp vào <strong>Bước 2</strong> để Studio tự động cắt ghép!
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                        Đã Hiểu & Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};
