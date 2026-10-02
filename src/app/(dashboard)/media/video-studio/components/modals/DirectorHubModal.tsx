import React, { useState, useEffect } from "react";
import { Clapperboard, Copy, X, Zap, Camera, Sparkles, RefreshCw, Edit3, Check, Wand2 } from "lucide-react";
import { DirectorGuide, DirectorShot } from "@/lib/videoProjectStore";

interface DirectorHubModalProps {
    isOpen: boolean;
    onClose: () => void;
    directorGuide: DirectorGuide | null;
    customHookTitle: string;
    clipSwitchInterval: number;
    currentScript?: string;
    onCopyShotlist: () => void;
    onApplyGuide?: (guide: DirectorGuide) => void;
}

/**
 * Sinh bảng phân cảnh 5 shot thực chiến chuẩn thực tế đời sống B2B dựa trên nội dung kịch bản
 */
function buildRealisticShotsFromScript(scriptText: string, hookTitle: string): DirectorShot[] {
    const clean = (scriptText || "").trim();
    const lower = clean.toLowerCase();

    // Tách các câu trong kịch bản để khớp lời thoại từng cảnh
    const sentences = clean.split(/(?<=[.!?,;:\n])\s+/).filter(s => s.trim().length > 3);

    // KỊCH BẢN THỰC CHIẾN 1: Chuyến đi giao hàng thực tế / Gặp đối tác / Siêu thị tiện lợi (Ohmee, WinMart, GS25...)
    if (lower.includes("giao hàng") || lower.includes("siêu thị") || lower.includes("ohmee") || lower.includes("lái xe") || lower.includes("chuyến đi") || lower.includes("sàng khôn")) {
        return [
            {
                shotNumber: 1,
                shotType: "Cận Cảnh Buồng Lái (Close-up POV)",
                cameraMovement: "Zoom in dứt khoát 1.5s",
                action: "Ly (Founder LYHU) ngồi ghế lái xe bán tải/xe giao hàng, cười tươi vẫy tay chào ống kính trước vô lăng.",
                duration: 2.5,
                dialogueSnippet: sentences[0] || "Hello cả nhà, mình là Ly đây, founder của LYHU nè!",
                sfx: "Tiếng khởi động xe / tiếng nhạc vui tươi bắt đầu"
            },
            {
                shotNumber: 2,
                shotType: "Trung Cảnh Bốc Hàng (Medium Action)",
                cameraMovement: "Lia máy từ thùng xe sang kho (Pan)",
                action: "Nhân sự LYHU phối hợp chất các thùng hàng snack, khoai môn CVT, bột phô mai BOYO gọn gàng lên xe giao sỉ.",
                duration: 2.5,
                dialogueSnippet: sentences[1] || "Hôm nay mình có chuyến giao hàng đặc biệt đến chuỗi siêu thị tiện lợi mới toanh!",
                sfx: "Tiếng kéo cửa thùng xe 'Cạch cạch' / đóng nắp cốp"
            },
            {
                shotNumber: 3,
                shotType: "Góc Nhìn Di Chuyển (POV Windshield)",
                cameraMovement: "Camera gắn kính xe quay đường phố",
                action: "Điện thoại cố định trên taplo quay đường phố tấp nập, hướng xe lăn bánh tới địa điểm nhận hàng của đối tác.",
                duration: 2.5,
                dialogueSnippet: sentences[2] || "Tự mình lái xe đi giao để tận mắt xem kho bãi và quy trình tiếp nhận của đối tác thế nào.",
                sfx: "Tiếng xi nhan / tiếng xe chạy êm ái trên phố"
            },
            {
                shotNumber: 4,
                shotType: "Toàn Cảnh & Bàn Giao (Wide to Close)",
                cameraMovement: "Hạ góc máy thấp hất lên biển hiệu",
                action: "Đứng trước mặt tiền siêu thị đối tác, cùng quản lý nhận hàng kiểm đếm từng kiện hàng date mới toanh.",
                duration: 2.5,
                dialogueSnippet: sentences[3] || "Đúng là đi một ngày đàng học một sàng khôn, quy trình đối tác cực kỳ chuyên nghiệp!",
                sfx: "Tiếng ký biên bản bàn giao / tiếng dán tem niêm phong"
            },
            {
                shotNumber: 5,
                shotType: "Cận Cảnh Kêu Gọi (Founder CTA)",
                cameraMovement: "Chĩa thẳng khuôn mặt & sản phẩm",
                action: "Ly đứng trước kệ hàng đối tác hoặc trước xe, cười tươi chắp tay hoặc giơ ngón cái chào người xem.",
                duration: 3.0,
                dialogueSnippet: sentences[4] || "Anh chị em chuỗi cửa hàng, NPP cần nguồn hàng sỉ độc quyền date mới, nhắn ngay LYHU nha!",
                sfx: "Tiếng ting ting chốt đơn thương mại"
            }
        ];
    }

    // KỊCH BẢN THỰC CHIẾN 2: Nhập hàng container / Hàng mới về tổng kho đêm qua
    if (lower.includes("container") || lower.includes("về kho") || lower.includes("nhập") || lower.includes("đêm qua") || lower.includes("kho bãi")) {
        return [
            {
                shotNumber: 1,
                shotType: "Cực Cận Rạch Thùng (Macro Cut)",
                cameraMovement: "Zoom in dứt khoát 1s",
                action: "Tay cầm dao rạch băng dính thùng hàng mới cứng, mở tung nắp thùng lộ lớp sản phẩm bóng bẩy bên trong.",
                duration: 2.5,
                dialogueSnippet: sentences[0] || hookTitle || "Container vừa đáp kho lúc nửa đêm, date mới tinh 2026!",
                sfx: "Tiếng rạch dao 'Rẹt' / tiếng vỗ thùng hàng"
            },
            {
                shotNumber: 2,
                shotType: "Toàn Cảnh Pallet (Wide Warehouse)",
                cameraMovement: "Lia máy ngang bao quát (Pan)",
                action: "Quay các dãy pallet hàng LYHU xếp cao 4-5 tầng ngập lối, xe nâng đang di chuyển nhộn nhịp phía sau.",
                duration: 2.5,
                dialogueSnippet: sentences[1] || "Hàng về nguyên đai nguyên kiện, số lượng lớn phục vụ đủ cho anh em NPP toàn quốc.",
                sfx: "Tiếng còi xe nâng bíp bíp / không khí kho rộn ràng"
            },
            {
                shotNumber: 3,
                shotType: "Cực Cận Date NSX (Macro Detail)",
                cameraMovement: "Cố định lấy nét cực nét",
                action: "Đưa camera sát vách thùng hoặc bao bì, chỉ tay vào dòng in HSD mới toanh năm 2026 rõ từng con số.",
                duration: 2.5,
                dialogueSnippet: sentences[2] || "Hàng mới sản xuất tháng này, bao đổi trả 100% nếu có bất kỳ lỗi vận chuyển nào.",
                sfx: "Tiếng sột soạt kiểm bao bì / gõ nhẹ 'Cộc cộc'"
            },
            {
                shotNumber: 4,
                shotType: "Trung Cảnh Đóng Hàng (Medium Action)",
                cameraMovement: "Góc nghiêng 45 độ ngang thắt lưng",
                action: "Nhân viên đóng gói dán tem vận chuyển sỉ, xếp thùng lên xe tải chở ra bến xe gửi cho đại lý các tỉnh.",
                duration: 2.5,
                dialogueSnippet: sentences[3] || "Đơn hàng hôm nay anh em chốt là đi ngay trong buổi, không để tồn kho ngày nào.",
                sfx: "Tiếng kéo cuộn băng dính 'Rột roạt' dứt khoát"
            },
            {
                shotNumber: 5,
                shotType: "Cận Cảnh Mẫu Thử (CTA Close-up)",
                cameraMovement: "Đưa sản phẩm tiến sát ống kính",
                action: "Cầm gói sản phẩm best-seller giơ về phía ống kính, vẫy tay mời nhắn tin lấy bảng giá sỉ.",
                duration: 3.0,
                dialogueSnippet: sentences[4] || "Inbox liền LYHU để nhận mẫu thử miễn phí và bảng giá sỉ tận gốc ngay hôm nay nhé!",
                sfx: "Tiếng chuông ting ting thông báo chốt đơn"
            }
        ];
    }

    // KỊCH BẢN THỰC CHIẾN 3: Giới thiệu sản phẩm / Review ăn thử đồ ăn vặt (Khoai môn CVT, Bột phô mai BOYO, UHi, Abi)
    return [
        {
            shotNumber: 1,
            shotType: "Cận Cảnh Bẻ Đôi (Macro ASMR)",
            cameraMovement: "Zoom sát 30cm lấy nét nhanh",
            action: "Hai bàn tay bẻ đôi củ khoai môn tẩm vị hoặc xé bịch snack trước ống kính, lộ rõ độ giòn rụm và màu sắc bắt mắt.",
            duration: 2.5,
            dialogueSnippet: sentences[0] || hookTitle || "Khách sỉ hỏi món này nhiều nhất tuần qua tại tổng kho LYHU!",
            sfx: "Tiếng bẻ giòn rụm 'Rắc' (ASMR Food)"
        },
        {
            shotNumber: 2,
            shotType: "Toàn Cảnh Bày Biện (Flat Lay / High Angle)",
            cameraMovement: "Góc từ trên nhìn xuống bàn chụp",
            action: "Bày biện sản phẩm đầy đĩa cùng nguyên thùng bao bì thương hiệu LYHU phía sau, ánh sáng đều đẹp.",
            duration: 2.5,
            dialogueSnippet: sentences[1] || "Bao bì sang xịn, chất lượng chuẩn xuất khẩu, bán quán ăn hay tạp hóa đều cực kỳ hút khách.",
            sfx: "Tiếng rắc gia vị / tiếng đặt đĩa 'Cạch'"
        },
        {
            shotNumber: 3,
            shotType: "Cận Cảnh Ăn Thử (Reaction Shot)",
            cameraMovement: "Cận cảnh khuôn mặt tự nhiên",
            action: "Cầm một miếng đưa vào miệng thưởng thức, gật đầu biểu cảm ưng ý với độ đậm đà vừa vặn.",
            duration: 2.5,
            dialogueSnippet: sentences[2] || "Vị đậm đà, giòn tan không bị ngấy, khách ăn thử một lần là nhớ mãi.",
            sfx: "Tiếng nhai giòn rụm rộn ràng"
        },
        {
            shotNumber: 4,
            shotType: "Trung Cảnh Đóng Gói (Packing Medium)",
            cameraMovement: "Lia máy theo tay xếp hàng",
            action: "Xếp các túi sản phẩm vào thùng carton LYHU, dán tem bảo đảm chất lượng hàng chuẩn nguồn gốc.",
            duration: 2.5,
            dialogueSnippet: sentences[3] || "Quy cách đóng thùng tiêu chuẩn, giao sỉ toàn quốc từ 1 thùng vẫn được giá tốt.",
            sfx: "Tiếng vuốt băng dính thẳng tắp"
        },
        {
            shotNumber: 5,
            shotType: "Cận Cảnh Chốt Đơn (Call to Action)",
            cameraMovement: "Chĩa thẳng sản phẩm về phía người xem",
            action: "Giơ sản phẩm, chỉ tay xuống phần tin nhắn hoặc để số hotline đại diện kết nối sỉ.",
            duration: 3.0,
            dialogueSnippet: sentences[4] || "Bấm ngay vào phần liên hệ để LYHU gửi mẫu ăn thử và chính sách đại lý tận gốc nhé!",
            sfx: "Tiếng ting ting chốt đơn thành công"
        }
    ];
}

export const DirectorHubModal: React.FC<DirectorHubModalProps> = ({
    isOpen,
    onClose,
    directorGuide,
    customHookTitle,
    clipSwitchInterval,
    currentScript = "",
    onCopyShotlist,
    onApplyGuide
}) => {
    const [shots, setShots] = useState<DirectorShot[]>([]);
    const [editingShotNumber, setEditingShotNumber] = useState<number | null>(null);

    // Đồng bộ shots khi mở modal hoặc thay đổi kịch bản
    useEffect(() => {
        if (!isOpen) return;

        if (directorGuide?.shots && directorGuide.shots.length > 0) {
            setShots(directorGuide.shots);
        } else {
            // Tự động sinh phân cảnh khớp thực tế kịch bản hiện hành
            const realisticShots = buildRealisticShotsFromScript(currentScript, customHookTitle);
            setShots(realisticShots);
        }
    }, [isOpen, directorGuide, currentScript, customHookTitle]);

    if (!isOpen) return null;

    // Tự động làm mới phân cảnh theo kịch bản thực tế
    const handleRebuildFromScript = () => {
        const generated = buildRealisticShotsFromScript(currentScript, customHookTitle);
        setShots(generated);
        if (onApplyGuide) {
            const updatedGuide: DirectorGuide = {
                hookVisual: generated[0]?.action || "Góc máy mở màn đập mắt",
                spokenHook: generated[0]?.dialogueSnippet || customHookTitle || "",
                pacingSpeed: `${clipSwitchInterval}s`,
                keyPowerWords: ["DATE MỚI TINH", "CONTAINER ĐÊM", "GIÁ SỈ TẬN KHO"],
                callToAction: generated[4]?.dialogueSnippet || "Nhắn liền LYHU để nhận mẫu thử!",
                shootingTips: [
                    "Dùng camera sau, lau sạch bụi và quay dọc 9:16",
                    "Đưa máy sát 30-50cm và chạm màn hình lấy nét",
                    "Quay mỗi đoạn 3s rồi đổi góc để cắt nhịp 2.5s"
                ],
                shots: generated
            };
            onApplyGuide(updatedGuide);
        }
    };

    const handleUpdateShotField = (shotNumber: number, field: keyof DirectorShot, val: string) => {
        const next = shots.map(s => s.shotNumber === shotNumber ? { ...s, [field]: val } : s);
        setShots(next);
        if (onApplyGuide) {
            onApplyGuide({
                ...(directorGuide || {
                    hookVisual: next[0]?.action || "",
                    spokenHook: next[0]?.dialogueSnippet || "",
                    pacingSpeed: `${clipSwitchInterval}s`,
                    keyPowerWords: [],
                    callToAction: next[4]?.dialogueSnippet || "",
                    shootingTips: []
                }),
                shots: next
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="max-w-4xl w-full bg-white text-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#00afa9]/10 text-[#00afa9] border border-[#00afa9]/20 flex items-center justify-center shrink-0">
                            <Clapperboard className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                                    Bảng Phân Cảnh & Chỉ Đạo Góc Quay Smartphone
                                </h3>
                                <span className="text-[10px] bg-[#00afa9]/10 text-[#00afa9] border border-[#00afa9]/30 px-2 py-0.5 rounded font-bold tracking-wide">
                                    THỰC CHIẾN LYHU
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Khớp 100% kịch bản thực tế • 5 góc quay nhịp {clipSwitchInterval}s • Dễ quay bằng điện thoại tại kho/hiện trường
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleRebuildFromScript}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
                            title="Tự động phân cảnh lại khớp với kịch bản văn bản bạn vừa nhập"
                        >
                            <RefreshCw className="w-3.5 h-3.5 text-[#00afa9]" />
                            <span className="hidden sm:inline">Khớp Lại Kịch Bản</span>
                        </button>
                        <button
                            type="button"
                            onClick={onCopyShotlist}
                            className="px-3.5 py-1.5 bg-[#00afa9] hover:bg-[#009b95] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
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
                    {/* Hook 3s Section */}
                    <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-[#00afa9] font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                                <Zap className="w-4 h-4 text-[#00afa9]" />
                                <span>QUY TẮC 3 GIÂY ĐẦU (VISUAL & SPOKEN HOOK ĐẬP MẮT):</span>
                            </div>
                            <span className="text-[10px] text-[#00afa9] font-semibold bg-[#00afa9]/10 px-2 py-0.5 rounded border border-[#00afa9]/20">
                                Giữ chân 70%+ người xem TikTok/Reels
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                                <div className="text-[11px] font-bold text-slate-700">🎯 Hình ảnh đập mắt (Visual Hook):</div>
                                <div className="text-slate-800 leading-relaxed text-xs">
                                    {shots[0]?.action || "Góc máy cận cảnh Founder ngồi buồng lái cười tươi hoặc hành động xé bao bẻ đôi sản phẩm giòn rụm ngay 1s đầu."}
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                                <div className="text-[11px] font-bold text-slate-700">🎙️ Câu thoại mở màn (Spoken Hook):</div>
                                <div className="text-slate-800 italic leading-relaxed text-xs">
                                    "{shots[0]?.dialogueSnippet || customHookTitle || "Hello cả nhà, mình là Ly đây, founder của LYHU nè!"}"
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5-Shot Realistic Storyboard */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                                <Camera className="w-4 h-4 text-[#00afa9]" />
                                <span>BẢNG 5 GÓC MÁY QUAY BẰNG ĐIỆN THOẠI (Quay mỗi đoạn 2.5s - 3s):</span>
                            </h4>
                            <span className="text-[11px] text-slate-500 font-mono">
                                Nhịp cắt Jump-cut: {directorGuide?.pacingSpeed || `${clipSwitchInterval}s`}
                            </span>
                        </div>

                        <div className="space-y-2.5">
                            {shots.map((shot) => {
                                const isEditing = editingShotNumber === shot.shotNumber;
                                return (
                                    <div
                                        key={shot.shotNumber}
                                        className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-[#00afa9]/60 transition-colors space-y-2.5"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded bg-[#00afa9] text-white font-bold text-[11px]">
                                                    CẢNH {shot.shotNumber}
                                                </span>
                                                <span className="font-bold text-slate-800 text-xs">
                                                    [{shot.shotType}]
                                                </span>
                                                <span className="text-slate-500 text-[11px]">
                                                    • Máy: <strong className="text-[#00afa9] font-semibold">{shot.cameraMovement}</strong>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                    SFX: {shot.sfx}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingShotNumber(isEditing ? null : shot.shotNumber)}
                                                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                                    title={isEditing ? "Lưu chỉnh sửa" : "Sửa chi tiết cảnh này"}
                                                >
                                                    {isEditing ? <Check className="w-3.5 h-3.5 text-[#00afa9]" /> : <Edit3 className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200">
                                                <span className="text-slate-500 font-bold block mb-1">🎬 Thao tác nhân sự kho / Hiện trường:</span>
                                                {isEditing ? (
                                                    <textarea
                                                        value={shot.action}
                                                        onChange={(e) => handleUpdateShotField(shot.shotNumber, "action", e.target.value)}
                                                        className="w-full text-xs p-1.5 rounded border border-slate-300 focus:outline-none focus:border-[#00afa9] bg-white leading-relaxed resize-none h-16"
                                                    />
                                                ) : (
                                                    <span className="text-slate-800 leading-relaxed block">{shot.action}</span>
                                                )}
                                            </div>
                                            <div className="p-2.5 rounded-md bg-[#00afa9]/5 border border-[#00afa9]/20">
                                                <span className="text-[#008f8a] font-bold block mb-1">🎙️ Lời thoại khớp hình (Khớp giọng đọc AI):</span>
                                                {isEditing ? (
                                                    <textarea
                                                        value={shot.dialogueSnippet}
                                                        onChange={(e) => handleUpdateShotField(shot.shotNumber, "dialogueSnippet", e.target.value)}
                                                        className="w-full text-xs p-1.5 rounded border border-slate-300 focus:outline-none focus:border-[#00afa9] bg-white leading-relaxed resize-none h-16 italic"
                                                    />
                                                ) : (
                                                    <span className="text-slate-800 italic leading-relaxed block">"{shot.dialogueSnippet}"</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Practical Smartphone Shooting Tips */}
                    <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#00afa9]" />
                            <span>3 MẸO QUAY THỰC CHIẾN BẰNG ĐIỆN THOẠI CHO ANH EM LYHU:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 space-y-1">
                                <div className="font-bold text-slate-800 text-[11px]">1. Lau sạch camera & Quay dọc 9:16</div>
                                <p className="text-slate-600 text-[11px] leading-relaxed">
                                    Dùng vạt áo hoặc khăn lau mồ hôi trên kính camera. Luôn để khung dọc 9:16 để hình ảnh sắc nét nhất.
                                </p>
                            </div>
                            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 space-y-1">
                                <div className="font-bold text-slate-800 text-[11px]">2. Quay cận 30-50cm & Chạm lấy nét</div>
                                <p className="text-slate-600 text-[11px] leading-relaxed">
                                    Đưa máy gần bao bì / vô lăng / biển hiệu và chạm màn hình khóa nét. Đủ ánh sáng tự nhiên video sẽ rất trong.
                                </p>
                            </div>
                            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 space-y-1">
                                <div className="font-bold text-slate-800 text-[11px]">3. Bấm quay 3 giây rồi đổi góc</div>
                                <p className="text-slate-600 text-[11px] leading-relaxed">
                                    Không cần lia máy dài dòng! Cứ quay mỗi góc 3s, nạp vào Bước 2 thì Studio tự động cắt Jump-cut cực kỳ mượt.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="p-3.5 rounded-lg bg-[#00afa9]/10 border border-[#00afa9]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <span className="text-[11px] text-[#008f8a] font-semibold block">LỜI KÊU GỌI HÀNH ĐỘNG (CTA KẾT THÚC VIDEO):</span>
                            <span className="text-xs font-bold text-slate-900">
                                {shots[4]?.dialogueSnippet || "Nhắn liền LYHU để nhận mẫu thử & bảng giá sỉ tận gốc nha cả nhà!"}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onCopyShotlist}
                            className="px-4 py-2 rounded-lg bg-[#00afa9] hover:bg-[#009b95] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                        >
                            <Copy className="w-4 h-4" />
                            <span>Copy Gửi Zalo Cho Đội Quay</span>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                        💡 Sau khi quay xong 5 clip, nạp vào <strong>Bước 2</strong> để Studio tự động cắt ghép khớp hoàn hảo với giọng AI!
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
