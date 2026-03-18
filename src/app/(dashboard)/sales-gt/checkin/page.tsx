"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import { MapPin, Camera, CheckCircle, Clock, AlertTriangle, Navigation, Store, Trash2, ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Outlet {
    id: string;
    name: string;
    address: string;
    district: string;
    outlet_type: string;
    lat: number | null;
    lng: number | null;
}

interface CheckinRecord {
    id: string;
    outlet_id: string;
    outlet_name?: string;
    distance_meters: number;
    visit_result: string;
    check_in_at: string;
    check_out_at: string | null;
    display_photos: string[];
    market_notes: string;
}

const OUTLET_TYPE_LABELS: Record<string, string> = {
    tap_hoa: "Tạp hóa",
    mini_mart: "Siêu thị mini",
    dai_ly: "Đại lý",
    sieu_thi: "Siêu thị",
};

const VISIT_RESULTS: Record<string, { label: string; color: string }> = {
    visited: { label: "Đã ghé", color: "bg-blue-100 text-blue-700" },
    ordered: { label: "Có đơn", color: "bg-green-100 text-green-700" },
    closed: { label: "Đóng cửa", color: "bg-slate-100 text-slate-600" },
    competitor: { label: "Đối thủ", color: "bg-red-100 text-red-700" },
};

// Haversine distance in meters
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CheckinPage() {
    const supabase = createClient();
    const searchParams = useSearchParams();
    const preselectedOutlet = searchParams.get("outlet");

    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [todayCheckins, setTodayCheckins] = useState<CheckinRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Check-in flow state
    const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
    const [gpsPosition, setGpsPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [gpsError, setGpsError] = useState("");
    const [gpsLoading, setGpsLoading] = useState(false);
    const [distance, setDistance] = useState<number | null>(null);
    const [marketNotes, setMarketNotes] = useState("");
    const [inventoryNotes, setInventoryNotes] = useState("");
    const [visitResult, setVisitResult] = useState("visited");
    const [checkinStep, setCheckinStep] = useState<"select" | "gps" | "details" | "done">("select");
    const [submitting, setSubmitting] = useState(false);

    // Photo capture state
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [photos, setPhotos] = useState<{ file: Blob; preview: string }[]>([]);
    const [processingPhoto, setProcessingPhoto] = useState(false);

    const loadData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Load outlets assigned to user
        const { data: outletData } = await supabase
            .from('gt_outlets')
            .select('id, name, address, district, outlet_type, lat, lng')
            .eq('assigned_to', user.id)
            .eq('status', 'active')
            .order('name');

        setOutlets(outletData || []);

        // Load today's checkins
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { data: checkinData } = await supabase
            .from('gt_checkins')
            .select('*')
            .eq('user_id', user.id)
            .gte('check_in_at', todayStart.toISOString())
            .order('check_in_at', { ascending: false });

        // Map outlet names
        const outletMap = new Map((outletData || []).map((o: any) => [o.id, o.name]));
        setTodayCheckins(
            (checkinData || []).map((c: any) => ({
                ...c,
                outlet_name: outletMap.get(c.outlet_id) || "Không rõ",
            }))
        );

        // Preselect outlet if from URL
        if (preselectedOutlet && outletData) {
            const found = outletData.find((o: any) => o.id === preselectedOutlet);
            if (found) {
                setSelectedOutlet(found);
                setCheckinStep("gps");
            }
        }

        setLoading(false);
    }, [preselectedOutlet]);

    useEffect(() => { loadData(); }, [loadData]);

    async function handleGetGPS() {
        setGpsLoading(true);
        setGpsError("");
        try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                })
            );
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setGpsPosition(coords);

            // Calculate distance if outlet has GPS
            if (selectedOutlet?.lat && selectedOutlet?.lng) {
                const dist = getDistance(coords.lat, coords.lng, selectedOutlet.lat, selectedOutlet.lng);
                setDistance(Math.round(dist));
            }
            setCheckinStep("details");
        } catch (err: any) {
            setGpsError(
                err.code === 1 ? "Bạn cần cho phép truy cập vị trí GPS" :
                err.code === 2 ? "Không thể xác định vị trí. Kiểm tra GPS" :
                "Hết thời gian chờ GPS. Thử lại"
            );
        } finally {
            setGpsLoading(false);
        }
    }

    // Watermark photo with Canvas
    async function processPhotoWithWatermark(file: File): Promise<{ file: Blob; preview: string }> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;

                // Resize if too large (max 1600px width)
                const maxW = 1600;
                const scale = img.width > maxW ? maxW / img.width : 1;
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);

                // Draw original image
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Watermark bar at bottom
                const barH = Math.max(80, canvas.height * 0.12);
                const barY = canvas.height - barH;

                // Semi-transparent dark overlay
                ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
                ctx.fillRect(0, barY, canvas.width, barH);

                // Text settings
                const fontSize = Math.max(14, Math.round(canvas.width * 0.022));
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${fontSize}px Arial, sans-serif`;
                ctx.textBaseline = 'top';

                const pad = Math.round(fontSize * 0.8);
                let textY = barY + pad;
                const lineH = fontSize * 1.5;

                // Line 1: Timestamp
                const now = new Date();
                const timeStr = `🕐 ${now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
                ctx.fillText(timeStr, pad, textY);
                textY += lineH;

                // Line 2: GPS + Distance
                if (gpsPosition) {
                    const gpsStr = `📍 ${gpsPosition.lat.toFixed(6)}, ${gpsPosition.lng.toFixed(6)}${distance !== null ? `  •  ${distance}m` : ''}`;
                    ctx.fillText(gpsStr, pad, textY);
                    textY += lineH;
                }

                // Line 3: Outlet name
                if (selectedOutlet) {
                    ctx.font = `${fontSize}px Arial, sans-serif`;
                    ctx.fillText(`🏪 ${selectedOutlet.name} — ${selectedOutlet.address}`, pad, textY);
                }

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve({ file: blob, preview: URL.createObjectURL(blob) });
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                }, 'image/jpeg', 0.85);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    async function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setProcessingPhoto(true);
        try {
            const result = await processPhotoWithWatermark(file);
            setPhotos(prev => [...prev, result]);
        } catch (err) {
            console.error('Photo processing failed', err);
        } finally {
            setProcessingPhoto(false);
            // Reset input so same file can be re-selected
            if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
    }

    async function uploadPhotos(): Promise<string[]> {
        const urls: string[] = [];
        for (const photo of photos) {
            const fileName = `checkin_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
            const { error } = await supabase.storage
                .from('gt-checkin-photos')
                .upload(fileName, photo.file, { contentType: 'image/jpeg' });
            if (!error) {
                const { data: { publicUrl } } = supabase.storage
                    .from('gt-checkin-photos')
                    .getPublicUrl(fileName);
                urls.push(publicUrl);
            }
        }
        return urls;
    }

    async function handleSubmitCheckin() {
        if (!selectedOutlet || !gpsPosition) return;
        setSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Upload watermarked photos
        let photoUrls: string[] = [];
        if (photos.length > 0) {
            photoUrls = await uploadPhotos();
        }

        const { error } = await supabase.from('gt_checkins').insert({
            outlet_id: selectedOutlet.id,
            user_id: user.id,
            check_in_lat: gpsPosition.lat,
            check_in_lng: gpsPosition.lng,
            distance_meters: distance,
            market_notes: marketNotes || null,
            inventory_notes: inventoryNotes || null,
            visit_result: visitResult,
            display_photos: photoUrls,
        });

        if (!error) {
            setCheckinStep("done");
            loadData();
        }
        setSubmitting(false);
    }

    function resetCheckin() {
        setSelectedOutlet(null);
        setGpsPosition(null);
        setDistance(null);
        setMarketNotes("");
        setInventoryNotes("");
        setVisitResult("visited");
        setGpsError("");
        setCheckinStep("select");
        // Cleanup photo previews
        photos.forEach(p => URL.revokeObjectURL(p.preview));
        setPhotos([]);
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="bg-white h-20 rounded-xl border border-slate-200 animate-pulse" />)}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-slate-900">📍 Check-in điểm bán</h1>

            {/* Check-in Flow */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                {/* Step indicators */}
                <div className="flex items-center gap-2 mb-6 text-xs">
                    {["Chọn điểm bán", "Xác nhận GPS", "Ghi nhận", "Hoàn tất"].map((step, i) => {
                        const stepKeys = ["select", "gps", "details", "done"];
                        const currentIdx = stepKeys.indexOf(checkinStep);
                        const isActive = i === currentIdx;
                        const isDone = i < currentIdx;
                        return (
                            <div key={step} className="flex items-center gap-2">
                                {i > 0 && <div className={`w-8 h-0.5 ${isDone ? 'bg-teal-500' : 'bg-slate-200'}`} />}
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full font-medium ${isActive ? 'bg-teal-100 text-teal-700' : isDone ? 'bg-green-100 text-green-700' : 'text-slate-400'}`}>
                                    {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px]">{i + 1}</span>}
                                    <span className="hidden sm:inline">{step}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Step 1: Select Outlet */}
                {checkinStep === "select" && (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-600 font-medium">Chọn điểm bán cần check-in:</p>
                        {outlets.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <Store className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                <p>Chưa có điểm bán nào được phân công</p>
                            </div>
                        ) : (
                            <div className="grid gap-2 max-h-[400px] overflow-y-auto">
                                {outlets.map(outlet => {
                                    const alreadyChecked = todayCheckins.some(c => c.outlet_id === outlet.id);
                                    return (
                                        <button
                                            key={outlet.id}
                                            disabled={alreadyChecked}
                                            onClick={() => { setSelectedOutlet(outlet); setCheckinStep("gps"); }}
                                            className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${alreadyChecked ? 'bg-green-50 border-green-200 opacity-60 cursor-not-allowed' : 'bg-slate-50 border-slate-200 hover:border-teal-300 hover:bg-teal-50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {alreadyChecked ? <CheckCircle className="w-5 h-5 text-green-500" /> : <MapPin className="w-5 h-5 text-slate-400" />}
                                                <div>
                                                    <p className="font-medium text-sm text-slate-800">{outlet.name}</p>
                                                    <p className="text-xs text-slate-500">{outlet.district} • {OUTLET_TYPE_LABELS[outlet.outlet_type] || outlet.outlet_type}</p>
                                                </div>
                                            </div>
                                            {alreadyChecked && <span className="text-xs text-green-600 font-medium">Đã check-in</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: GPS Verify */}
                {checkinStep === "gps" && selectedOutlet && (
                    <div className="text-center space-y-4">
                        <div className="bg-teal-50 rounded-lg p-4 inline-block mx-auto">
                            <Store className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                            <p className="font-semibold text-slate-800">{selectedOutlet.name}</p>
                            <p className="text-xs text-slate-500">{selectedOutlet.address}</p>
                        </div>

                        {gpsError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {gpsError}
                            </div>
                        )}

                        <button
                            onClick={handleGetGPS}
                            disabled={gpsLoading}
                            className="flex items-center gap-2 mx-auto bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 font-medium"
                        >
                            <Navigation className={`w-5 h-5 ${gpsLoading ? 'animate-spin' : ''}`} />
                            {gpsLoading ? "Đang lấy GPS..." : "📍 Xác nhận vị trí GPS"}
                        </button>

                        <button onClick={resetCheckin} className="text-sm text-slate-500 hover:text-slate-700">
                            ← Chọn lại
                        </button>
                    </div>
                )}

                {/* Step 3: Details */}
                {checkinStep === "details" && selectedOutlet && (
                    <div className="space-y-4">
                        {/* Distance badge */}
                        {distance !== null && (
                            <div className={`flex items-center gap-2 p-3 rounded-lg border ${distance <= 200 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                                <MapPin className={`w-5 h-5 ${distance <= 200 ? 'text-green-600' : 'text-amber-600'}`} />
                                <span className="text-sm font-medium">
                                    Khoảng cách: <strong>{distance}m</strong>
                                    {distance <= 200 ? " ✅ Hợp lệ" : " ⚠️ Xa hơn 200m"}
                                </span>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Kết quả viếng thăm</label>
                            <div className="flex gap-2 flex-wrap">
                                {Object.entries(VISIT_RESULTS).map(([key, val]) => (
                                    <button
                                        key={key}
                                        onClick={() => setVisitResult(key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${visitResult === key ? val.color + ' border-current' : 'bg-white border-slate-200 text-slate-500'}`}
                                    >
                                        {val.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú tồn kho</label>
                            <textarea
                                value={inventoryNotes}
                                onChange={e => setInventoryNotes(e.target.value)}
                                placeholder="VD: Hảo Hảo còn ít, Mì Ý hết hàng..."
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 resize-none"
                                rows={2}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú thị trường</label>
                            <textarea
                                value={marketNotes}
                                onChange={e => setMarketNotes(e.target.value)}
                                placeholder="VD: Đối thủ X đang khuyến mãi mạnh..."
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 resize-none"
                                rows={2}
                            />
                        </div>

                        {/* Photo Capture Section */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">📸 Ảnh cửa hàng (có watermark)</label>
                            <input
                                ref={cameraInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleCameraCapture}
                                className="hidden"
                            />

                            {/* Photo grid */}
                            {photos.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    {photos.map((photo, idx) => (
                                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200">
                                            <img src={photo.preview} className="w-full h-32 object-cover" />
                                            <button
                                                onClick={() => {
                                                    URL.revokeObjectURL(photo.preview);
                                                    setPhotos(prev => prev.filter((_, i) => i !== idx));
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => cameraInputRef.current?.click()}
                                disabled={processingPhoto}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-teal-300 rounded-xl text-teal-700 hover:bg-teal-50 transition-colors disabled:opacity-50 font-medium text-sm"
                            >
                                {processingPhoto ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý ảnh...</>
                                ) : (
                                    <><Camera className="w-5 h-5" /> {photos.length > 0 ? 'Chụp thêm ảnh' : 'Chụp ảnh cửa hàng'}</>
                                )}
                            </button>
                            <p className="text-[11px] text-slate-400 mt-1 text-center">Ảnh tự ghi thời gian, GPS, tên điểm bán</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={resetCheckin} className="flex-1 text-sm text-slate-600 hover:bg-slate-100 py-2 rounded-lg border border-slate-200">← Quay lại</button>
                            <button
                                onClick={handleSubmitCheckin}
                                disabled={submitting}
                                className="flex-1 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                            >
                                {submitting ? "Đang lưu..." : "✅ Check-in"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Done */}
                {checkinStep === "done" && (
                    <div className="text-center py-6">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-slate-900">Check-in thành công!</h3>
                        <p className="text-sm text-slate-500 mt-1">{selectedOutlet?.name}</p>
                        <div className="flex gap-3 justify-center mt-6">
                            <button onClick={resetCheckin} className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                                Check-in tiếp
                            </button>
                            <Link href="/sales-gt/create-order" className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700">
                                Tạo đơn hàng →
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Today's Checkins */}
            {todayCheckins.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-3">✅ Đã check-in hôm nay ({todayCheckins.length})</h3>
                    <div className="space-y-2">
                        {todayCheckins.map(c => (
                            <div key={c.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">{c.outlet_name}</p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(c.check_in_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                            {c.distance_meters !== null && ` • ${c.distance_meters}m`}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${VISIT_RESULTS[c.visit_result]?.color || 'bg-slate-100'}`}>
                                    {VISIT_RESULTS[c.visit_result]?.label || c.visit_result}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
