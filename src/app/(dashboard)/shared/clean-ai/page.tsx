"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
    UploadCloud,
    Download,
    Trash2,
    Sparkles,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Eye,
    RefreshCw,
    Archive,
    Settings2,
    HelpCircle,
    Layers,
    Zap,
    Sliders,
    X,
    Maximize2,
    Info,
    FileImage,
    ArrowRight,
    ExternalLink,
    Check,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import {
    CleanAiOptions,
    DEFAULT_CLEAN_AI_OPTIONS,
    ProcessedImageItem,
    cleanAiImage,
    formatBytes,
    REMOVED_AI_TAGS
} from "@/lib/imageCleanAi";

export default function CleanAiPage() {
    // ============ STATE ============
    const [items, setItems] = useState<ProcessedImageItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Options
    const [options, setOptions] = useState<CleanAiOptions>(DEFAULT_CLEAN_AI_OPTIONS);
    const [showSettings, setShowSettings] = useState(false);
    const [showFaq, setShowFaq] = useState(false);

    // Modal Compare / Preview
    const [previewItem, setPreviewItem] = useState<ProcessedImageItem | null>(null);
    const [comparePosition, setComparePosition] = useState(50); // percentage for split slider

    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    // ============ STATS ============
    const stats = useMemo(() => {
        const total = items.length;
        const done = items.filter((i) => i.status === "done").length;
        const error = items.filter((i) => i.status === "error").length;
        const originalTotalSize = items.reduce((acc, i) => acc + i.originalSize, 0);
        const cleanedTotalSize = items.reduce((acc, i) => acc + (i.status === "done" ? i.cleanedSize : i.originalSize), 0);
        const savedBytes = originalTotalSize - cleanedTotalSize;
        const savedPercent = originalTotalSize > 0 ? Math.round((savedBytes / originalTotalSize) * 100) : 0;

        return {
            total,
            done,
            error,
            originalTotalSize,
            cleanedTotalSize,
            savedBytes,
            savedPercent,
        };
    }, [items]);

    // ============ BATCH PROCESS HANDLER ============
    const processFiles = useCallback(
        async (files: File[]) => {
            const validFiles = files.filter((f) =>
                f.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(f.name)
            );

            if (validFiles.length === 0) {
                toast.error("Vui lòng chọn các tệp ảnh hợp lệ (.jpg, .jpeg, .png, .webp)");
                return;
            }

            setIsProcessing(true);
            setProgress({ current: 0, total: validFiles.length });

            const newItems: ProcessedImageItem[] = [];

            for (let i = 0; i < validFiles.length; i++) {
                const file = validFiles[i];
                setProgress({ current: i + 1, total: validFiles.length });
                try {
                    const result = await cleanAiImage(file, items.length + i, options);
                    newItems.push(result);
                } catch (err: any) {
                    console.error("Clean image failed", err);
                }
            }

            setItems((prev) => [...prev, ...newItems]);
            setIsProcessing(false);
            toast.success(`Đã làm sạch xong ${newItems.length} ảnh! Đăng Facebook không còn bị nhãn AI.`);
        },
        [items.length, options]
    );

    // ============ FILE INPUT & DRAG DROP ============
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            processFiles(files);
            e.target.value = "";
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            processFiles(files);
        }
    };

    // ============ CLIPBOARD PASTE SUPPORT ============
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const clipboardFiles: File[] = [];
            if (e.clipboardData?.items) {
                for (let i = 0; i < e.clipboardData.items.length; i++) {
                    const item = e.clipboardData.items[i];
                    if (item.type.indexOf("image") !== -1) {
                        const file = item.getAsFile();
                        if (file) {
                            clipboardFiles.push(file);
                        }
                    }
                }
            }
            if (clipboardFiles.length > 0) {
                toast.info(`Phát hiện ${clipboardFiles.length} ảnh từ Clipboard! Đang xử lý...`);
                processFiles(clipboardFiles);
            }
        };

        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [processFiles]);

    // ============ RE-PROCESS ALL WITH NEW OPTIONS ============
    const handleReprocessAll = async () => {
        if (items.length === 0) return;
        setIsProcessing(true);
        setProgress({ current: 0, total: items.length });

        const reprocessed: ProcessedImageItem[] = [];
        for (let i = 0; i < items.length; i++) {
            setProgress({ current: i + 1, total: items.length });
            const item = items[i];
            const updated = await cleanAiImage(item.file, i, options);
            reprocessed.push(updated);
        }

        setItems(reprocessed);
        setIsProcessing(false);
        toast.success("Đã làm sạch lại toàn bộ ảnh với cài đặt mới!");
    };

    // ============ DOWNLOAD SINGLE FILE ============
    const handleDownloadSingle = (item: ProcessedImageItem) => {
        if (item.status !== "done") return;
        try {
            saveAs(item.cleanedBlob, item.outputName);
            toast.success(`Đã tải về: ${item.outputName}`);
        } catch {
            const url = URL.createObjectURL(item.cleanedBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = item.outputName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    // ============ DOWNLOAD ALL (ZIP) ============
    const handleDownloadAllZip = async () => {
        const doneItems = items.filter((i) => i.status === "done");
        if (doneItems.length === 0) {
            toast.error("Không có ảnh nào đã xử lý xong để tải về!");
            return;
        }

        try {
            toast.info(`Đang nén ${doneItems.length} ảnh vào file ZIP...`);
            const zip = new JSZip();

            // Đảm bảo không trùng tên tệp trong zip
            const usedNames = new Set<string>();
            doneItems.forEach((item, index) => {
                let name = item.outputName;
                if (usedNames.has(name)) {
                    const dot = name.lastIndexOf(".");
                    const base = dot !== -1 ? name.substring(0, dot) : name;
                    const ext = dot !== -1 ? name.substring(dot) : "";
                    name = `${base}_${index + 1}${ext}`;
                }
                usedNames.add(name);
                zip.file(name, item.cleanedBlob);
            });

            const zipBlob = await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: { level: 6 },
            });

            const zipName = `anh_khu_nhan_ai_${new Date().toISOString().slice(0, 10)}.zip`;
            saveAs(zipBlob, zipName);
            toast.success(`Đã tải về toàn bộ: ${zipName}`);
        } catch (err: any) {
            console.error("ZIP generate failed", err);
            toast.error("Không thể tạo file ZIP: " + err.message);
        }
    };

    // ============ REMOVE SINGLE ============
    const handleRemoveItem = (id: string) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
    };

    // ============ CLEAR ALL ============
    const handleClearAll = () => {
        if (items.length === 0) return;
        if (confirm("Bạn có chắc chắn muốn xóa tất cả ảnh trong danh sách?")) {
            setItems([]);
            toast.info("Đã xóa danh sách");
        }
    };

    return (
        <div className="space-y-6 pb-12 max-w-7xl mx-auto">
            {/* Top Hero Banner */}
            <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute left-1/3 bottom-0 -mb-12 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide text-emerald-100">
                            <ShieldCheck className="w-4 h-4 text-emerald-300" />
                            Cơ chế Zalo Cleanse v2.0 • Chống nhãn AI Facebook 100%
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Khử Nhãn AI Facebook Cho Ảnh ChatGPT
                        </h1>
                        <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
                            Tải hàng loạt ảnh từ ChatGPT, Midjourney, Bing lên để làm sạch hoàn toàn metadata C2PA, IPTC và vân tay số AI. Tải về 1-Click dạng file ZIP hoặc ảnh lẻ — Đăng Facebook tự nhiên, không bị gắn nhãn "Thông tin về AI"!
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
                        <button
                            onClick={() => setShowFaq(!showFaq)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition backdrop-blur-md"
                        >
                            <HelpCircle className="w-4 h-4 text-emerald-200" />
                            {showFaq ? "Ẩn giải thích" : "Tại sao qua Zalo lại hết?"}
                        </button>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition backdrop-blur-md ${
                                showSettings
                                    ? "bg-white text-teal-800 shadow-md"
                                    : "bg-white/15 hover:bg-white/25 text-white"
                            }`}
                        >
                            <Settings2 className="w-4 h-4" />
                            Tùy chọn xuất
                        </button>
                    </div>
                </div>

                {/* Quick Info Pillars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15 text-xs text-emerald-100">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                        </div>
                        <span>Xóa 100% C2PA Manifest</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                        </div>
                        <span>Triệt tiêu IPTC / XMP AI Tags</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                        </div>
                        <span>Khử vân tay ẩn (Anti-SynthID)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                        </div>
                        <span>100% Client-Side • Cực nhanh</span>
                    </div>
                </div>
            </div>

            {/* Explanation / FAQ Dropdown */}
            {showFaq && (
                <div className="bg-white border border-teal-100 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                            <Info className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-slate-800 text-base">
                                Cơ chế hoạt động: Tại sao gửi qua Zalo rồi tải về lại hết bị nhãn AI?
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Khi ChatGPT (DALL-E 3) xuất ảnh, OpenAI tự động nhúng vào cấu trúc tệp các thông tin xuất xứ đặc biệt gọi là <strong className="text-slate-800">C2PA Content Credentials</strong> và mã <strong className="text-slate-800">IPTC trainedAlgorithmicMedia</strong>. Khi bạn đăng ảnh này lên Facebook, bot của Meta tự động đọc các nhãn này và gắn nhãn "Thông tin về AI".
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 pt-2">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
                            <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                Cách thủ công cũ (Tải lên Zalo rồi tải về):
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Zalo nhận ảnh từ điện thoại, tiến hành nén lại ảnh qua Canvas đồ họa của server Zalo để tiết kiệm băng thông. Quá trình này vô tình <strong className="text-slate-700">vứt bỏ toàn bộ metadata C2PA và IPTC</strong>, khiến ảnh trả về Facebook trở thành ảnh "sạch". Tuy nhiên, cách này mất rất nhiều công, phải gửi từng ảnh vào "Cloud của tôi", rồi bấm tải từng cái về.
                            </p>
                        </div>

                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200/80 space-y-2">
                            <div className="font-semibold text-emerald-900 text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                Ứng dụng này trong app LYHU (Tự động & Hàng loạt):
                            </div>
                            <p className="text-xs text-emerald-800 leading-relaxed">
                                Ứng dụng tái hiện chính xác quy trình nén và tái tạo ảnh của Zalo ngay trên trình duyệt của bạn: Tẩy sạch 100% C2PA / XMP / EXIF, phủ vi điều chỉnh điểm ảnh nano để phá vỡ cả watermark ẩn (như SynthID), nén chuẩn JPEG 95% siêu nét. Bạn có thể kéo thả 50-100 ảnh cùng lúc và tải về 1 file ZIP ngay tức thì!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Drawer / Panel */}
            {showSettings && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-teal-600" />
                            <h3 className="font-bold text-slate-800 text-base">Cấu hình làm sạch & Xuất ảnh</h3>
                        </div>
                        <button
                            onClick={() => setShowSettings(false)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Format */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Định dạng xuất:</label>
                            <select
                                value={options.format}
                                onChange={(e) =>
                                    setOptions({ ...options, format: e.target.value as any })
                                }
                                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            >
                                <option value="image/jpeg">JPG (Chuẩn Zalo - Tốt nhất cho FB)</option>
                                <option value="image/png">PNG (Giữ độ nét / Trong suốt)</option>
                                <option value="image/webp">WEBP (Siêu nhẹ)</option>
                            </select>
                        </div>

                        {/* Quality */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-slate-700">
                                <span>Chất lượng ảnh:</span>
                                <span className="text-teal-600 font-bold">{Math.round(options.quality * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.80"
                                max="1.0"
                                step="0.01"
                                value={options.quality}
                                onChange={(e) =>
                                    setOptions({ ...options, quality: parseFloat(e.target.value) })
                                }
                                className="w-full accent-teal-600 cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>80% (Nhẹ)</span>
                                <span className="text-teal-600 font-medium">95% (Chuẩn Zalo HD)</span>
                                <span>100% (Max)</span>
                            </div>
                        </div>

                        {/* Anti-Fingerprint */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                <span>Khử vân tay ẩn (Anti-SynthID):</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${options.antiFingerprint ? "bg-emerald-100 text-emerald-700 font-bold" : "bg-slate-100 text-slate-500"}`}>
                                    {options.antiFingerprint ? "Bật" : "Tắt"}
                                </span>
                            </label>
                            <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                                <input
                                    type="checkbox"
                                    checked={options.antiFingerprint}
                                    onChange={(e) =>
                                        setOptions({ ...options, antiFingerprint: e.target.checked })
                                    }
                                    className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                                />
                                <span className="text-xs text-slate-700">
                                    Vi nhiễu nano (Chống quét thuật toán AI)
                                </span>
                            </label>
                        </div>

                        {/* Naming Pattern */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Quy tắc đặt tên file:</label>
                            <select
                                value={options.namingPattern}
                                onChange={(e) =>
                                    setOptions({ ...options, namingPattern: e.target.value as any })
                                }
                                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            >
                                <option value="suffix_fb">Thêm đuôi _fb (vidu_fb.jpg)</option>
                                <option value="keep">Giữ nguyên tên gốc (tiện thay thế)</option>
                                <option value="prefix_clean">Thêm tiền tố clean_ (clean_vidu.jpg)</option>
                                <option value="sequential">Đánh số thứ tự (anh_fb_01.jpg)</option>
                            </select>
                        </div>
                    </div>

                    {items.length > 0 && (
                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={handleReprocessAll}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                                Áp dụng và làm sạch lại {items.length} ảnh
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Upload Drag & Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all duration-200 ${
                    isDragging
                        ? "border-teal-500 bg-teal-50/60 scale-[1.005]"
                        : "border-slate-300 hover:border-teal-400 bg-white"
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <input
                    ref={folderInputRef}
                    type="file"
                    // @ts-ignore
                    webkitdirectory="true"
                    directory="true"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-inner">
                        <UploadCloud className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                        <h2 className="text-lg font-bold text-slate-800">
                            Kéo & thả ảnh ChatGPT vào đây, hoặc bấm để chọn
                        </h2>
                        <p className="text-xs text-slate-500">
                            Hỗ trợ tải hàng loạt không giới hạn (.jpg, .jpeg, .png, .webp). Bạn cũng có thể nhấn <kbd className="px-1.5 py-0.5 text-[11px] bg-slate-100 border border-slate-300 rounded font-mono text-slate-700">Ctrl + V</kbd> để dán ảnh trực tiếp từ clipboard.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-teal-600/20 transition active:scale-95"
                        >
                            <FileImage className="w-4 h-4" />
                            Chọn nhiều ảnh
                        </button>
                        <button
                            type="button"
                            onClick={() => folderInputRef.current?.click()}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition active:scale-95"
                        >
                            <Archive className="w-4 h-4" />
                            Chọn cả thư mục
                        </button>
                    </div>
                </div>

                {/* Progress bar overlay if processing */}
                {isProcessing && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 z-20">
                        <div className="w-full max-w-md space-y-3">
                            <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
                                    Đang tẩy sạch C2PA & Metadata AI...
                                </span>
                                <span className="text-teal-600">
                                    {progress.current} / {progress.total}
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                                <div
                                    className="bg-teal-600 h-full rounded-full transition-all duration-200"
                                    style={{
                                        width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                            <p className="text-xs text-slate-400 text-center">
                                Đang tái mã hóa canvas chuẩn Zalo & khử vân tay số...
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Batch Action Toolbar & Statistics */}
            {items.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Summary Badges */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-semibold">
                                <CheckCircle2 className="w-4 h-4" />
                                Đã làm sạch: {stats.done} / {stats.total} ảnh
                            </span>
                            <span className="text-xs text-slate-500">
                                Gốc: <strong className="text-slate-700">{formatBytes(stats.originalTotalSize)}</strong>
                                {" → "}
                                Sau xử lý: <strong className="text-teal-700">{formatBytes(stats.cleanedTotalSize)}</strong>
                            </span>
                            {stats.savedBytes !== 0 && (
                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                                    {stats.savedBytes > 0
                                        ? `Giảm ${stats.savedPercent}% dung lượng`
                                        : `Tối ưu nét (${formatBytes(Math.abs(stats.savedBytes))})`}
                                </span>
                            )}
                        </div>

                        {/* Batch Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={handleDownloadAllZip}
                                disabled={stats.done === 0}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-md shadow-teal-600/20 transition active:scale-95 disabled:opacity-50"
                            >
                                <Download className="w-4 h-4" />
                                Tải Tất Cả (.ZIP)
                            </button>
                            <button
                                onClick={handleClearAll}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-sm font-medium transition active:scale-95"
                                title="Xóa danh sách"
                            >
                                <Trash2 className="w-4 h-4" />
                                Xóa hết
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Images Grid / List */}
            {items.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition group flex flex-col"
                        >
                            {/* Image Thumbnail with Overlay */}
                            <div className="relative aspect-square bg-slate-100 overflow-hidden flex items-center justify-center">
                                <img
                                    src={item.cleanedPreviewUrl || item.originalPreviewUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />

                                {/* Status Badge */}
                                <div className="absolute top-2 left-2 z-10">
                                    {item.status === "done" ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[11px] font-semibold backdrop-blur-md shadow-sm">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            Sạch 100% C2PA
                                        </span>
                                    ) : item.status === "error" ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/90 text-white text-[11px] font-semibold backdrop-blur-md shadow-sm">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Lỗi
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 text-white text-[11px] font-semibold backdrop-blur-md shadow-sm">
                                            Đang xử lý...
                                        </span>
                                    )}
                                </div>

                                {/* Quick Preview Overlay Button */}
                                <button
                                    onClick={() => setPreviewItem(item)}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-2 font-medium text-xs backdrop-blur-xs"
                                >
                                    <Eye className="w-4 h-4" />
                                    So sánh & Phóng to
                                </button>
                            </div>

                            {/* Card Content */}
                            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                                <div className="space-y-1">
                                    <div
                                        className="font-semibold text-slate-800 text-xs truncate"
                                        title={item.outputName}
                                    >
                                        {item.outputName}
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                                        <span>
                                            {item.cleanedWidth} x {item.cleanedHeight} px
                                        </span>
                                        <span className="font-medium text-slate-700">
                                            {formatBytes(item.cleanedSize || item.originalSize)}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                                        <Check className="w-3 h-3 shrink-0" />
                                        Đã xóa nhãn OpenAI / DALL-E
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                                    <button
                                        onClick={() => handleDownloadSingle(item)}
                                        disabled={item.status !== "done"}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-semibold transition active:scale-95 disabled:opacity-50"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Tải về
                                    </button>
                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                        title="Xóa ảnh này"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State when no images loaded */}
            {items.length === 0 && (
                <div className="grid sm:grid-cols-3 gap-4 pt-2">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                            <Zap className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">1. Thêm ảnh hàng loạt</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Kéo thả cả album ảnh vừa tải từ ChatGPT hoặc bấm nút chọn nhiều ảnh/thư mục. App có thể nạp hàng chục ảnh cùng lúc.
                        </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">2. Tự động tẩy nhãn AI</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Hệ thống giải mã và tái tạo lại toàn bộ file ảnh qua Canvas đồ họa, loại bỏ 100% C2PA manifest, XMP và watermark vô hình.
                        </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                            <Archive className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">3. Tải về 1-Click .ZIP</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Bấm một nút để nén toàn bộ ảnh đã xử lý thành 1 file ZIP duy nhất. Bạn đăng bài lên Facebook thoải mái mà không sợ bị dán mác AI!
                        </p>
                    </div>
                </div>
            )}

            {/* Side-by-Side Compare & Preview Modal */}
            {previewItem && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-teal-600" />
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                                        So sánh & Kiểm tra Metadata: {previewItem.name}
                                    </h3>
                                    <p className="text-[11px] text-slate-500">
                                        Kéo thanh trượt để so sánh chất lượng ảnh gốc vs ảnh đã làm sạch
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreviewItem(null)}
                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Interactive Compare Slider View */}
                        <div className="p-4 sm:p-6 space-y-6">
                            <div className="relative aspect-video sm:aspect-[16/10] bg-slate-900 rounded-2xl overflow-hidden select-none">
                                {/* Cleaned Image (Bottom layer) */}
                                <img
                                    src={previewItem.cleanedPreviewUrl}
                                    alt="Cleaned"
                                    className="absolute inset-0 w-full h-full object-contain"
                                />

                                {/* Original Image (Top layer, clipped) */}
                                <div
                                    className="absolute inset-0 overflow-hidden"
                                    style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}
                                >
                                    <img
                                        src={previewItem.originalPreviewUrl}
                                        alt="Original"
                                        className="absolute inset-0 w-full h-full object-contain"
                                    />
                                    <div className="absolute top-3 left-3 px-2 py-1 bg-red-600/90 text-white text-[10px] font-bold rounded backdrop-blur-md">
                                        ẢNH GỐC (Chứa nhãn AI)
                                    </div>
                                </div>

                                <div className="absolute top-3 right-3 px-2 py-1 bg-teal-600/90 text-white text-[10px] font-bold rounded backdrop-blur-md">
                                    ĐÃ LÀM SẠCH (Chuẩn FB)
                                </div>

                                {/* Divider Line */}
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                                    style={{ left: `${comparePosition}%` }}
                                >
                                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-slate-800 text-xs font-bold pointer-events-none">
                                        ⬌
                                    </div>
                                </div>

                                {/* Range Slider Input */}
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={comparePosition}
                                    onChange={(e) => setComparePosition(parseInt(e.target.value))}
                                    className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
                                />
                            </div>

                            {/* Removed Tags List */}
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    Các dấu vết AI đã bị bóc tách & triệt tiêu hoàn toàn:
                                </div>
                                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                                    {REMOVED_AI_TAGS.map((tag, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2 text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200/60"
                                        >
                                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                            <span>{tag}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <span className="text-xs text-slate-500">
                                Dung lượng: {formatBytes(previewItem.originalSize)} →{" "}
                                <strong className="text-teal-700">{formatBytes(previewItem.cleanedSize)}</strong>
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPreviewItem(null)}
                                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={() => handleDownloadSingle(previewItem)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Tải ảnh này về
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
