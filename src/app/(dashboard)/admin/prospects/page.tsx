"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    MapPin, Search, Loader2, Phone, Globe, ShieldCheck, Download, Check, X, RefreshCw, Facebook, MessageCircle,
} from "lucide-react";

const CATEGORIES: Record<string, string> = {
    tap_hoa: "Tạp hóa / cửa hàng tiện lợi",
    sieu_thi_mini: "Siêu thị / mini mart",
    dai_ly: "Đại lý / bán sỉ",
    quan_an: "Quán ăn / đồ ăn nhanh",
    tra_sua_cafe: "Cà phê / trà sữa",
    tiem_banh: "Tiệm bánh",
};
const CATEGORY_LABEL: Record<string, string> = { ...CATEGORIES, khac: "Khác" };

const DUP_LABEL: Record<string, { text: string; cls: string }> = {
    new: { text: "Mới", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    dup_customer: { text: "Trùng khách hàng", cls: "bg-red-50 text-red-700 border-red-200" },
    dup_deal: { text: "Trùng deal CRM", cls: "bg-red-50 text-red-700 border-red-200" },
    dup_lead: { text: "Trùng lead", cls: "bg-orange-50 text-orange-700 border-orange-200" },
    dup_prospect: { text: "Trùng trong danh sách", cls: "bg-amber-50 text-amber-700 border-amber-200" },
};

interface Prospect {
    id: string; name: string; category: string | null; address: string | null; province: string | null;
    district: string | null; phone: string | null; phone_source: string | null; website: string | null;
    facebook_url: string | null; zalo: string | null; email: string | null; google_match: string | null;
    google_checked_at: string | null; web_checked_at: string | null; dup_status: string; review_status: string;
    lat: number | null; lng: number | null;
}
interface ListResp {
    items: Prospect[]; total: number; page: number; pageSize: number;
    stats: { total: number; withPhone: number; clean: number; dupCrm: number; dupProspect: number };
    google: { used: number; limit: number }; googleConfigured: boolean;
    jobs: { id: string; province: string; district: string | null; status: string; found_count: number; inserted_count: number; created_at: string }[];
}

async function api<T = any>(url: string, method: string, body?: any): Promise<T> {
    const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || `Lỗi ${res.status}`);
    return json as T;
}

const csvCell = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export default function ProspectFinderPage() {
    // Form quét OSM
    const [province, setProvince] = useState("");
    const [district, setDistrict] = useState("");
    const [cats, setCats] = useState<string[]>(["tap_hoa", "sieu_thi_mini"]);
    const [limit, setLimit] = useState(500);

    // Danh sách
    const [data, setData] = useState<ListResp | null>(null);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ q: "", dup: "", phone: "", review: "", category: "", job_id: "" });
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [busy, setBusy] = useState<string | null>(null);

    const query = useMemo(() => {
        const sp = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => v && sp.set(k, v));
        sp.set("page", String(page));
        return sp.toString();
    }, [filters, page]);

    const load = useCallback(async () => {
        try {
            setData(await api<ListResp>(`/api/admin/prospects?${query}`, "GET"));
        } catch (e: any) {
            toast.error(e.message);
        }
    }, [query]);

    useEffect(() => { load(); }, [load]);

    const run = async (key: string, fn: () => Promise<void>) => {
        setBusy(key);
        try { await fn(); await load(); } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
    };

    const ids = Array.from(selected);
    const scope = ids.length ? `${ids.length} dòng đã chọn` : "20 cửa hàng đủ điều kiện tiếp theo";

    const discover = () => run("discover", async () => {
        const r = await api("/api/admin/prospects/discover", "POST", { province, district, categories: cats, limit });
        if (r.hint) toast.warning(r.hint);
        toast.success(`Tìm thấy ${r.found} • thêm mới ${r.inserted} • đã có sẵn ${r.alreadyKnown} • có SĐT ${r.withPhone}`);
        if (r.jobId) { setFilters((f) => ({ ...f, job_id: r.jobId })); setPage(1); }
    });

    const enrichGoogle = () => run("google", async () => {
        const r = await api("/api/admin/prospects/enrich-google", "POST", ids.length ? { ids } : { limit: 20 });
        if (r.message) return void toast.info(r.message);
        toast.success(`Google: lấy được ${r.gotPhone} SĐT • khớp nhưng không có SĐT ${r.matchedNoPhone} • không khớp ${r.noMatch} • lỗi ${r.failed}`);
        if (r.quotaExhausted) toast.warning("Đã chạm hạn mức Google của tháng này, đã dừng.");
        if (r.firstError) toast.error(`Lỗi đầu tiên: ${r.firstError}`, { duration: 15000 });
    });

    const enrichWeb = () => run("web", async () => {
        const r = await api("/api/admin/prospects/enrich-web", "POST", ids.length ? { ids } : { limit: 20 });
        if (r.message) return void toast.info(r.message);
        toast.success(`Website/fanpage: lấy được ${r.gotPhone} SĐT • không truy cập được ${r.unreachable}`);
    });

    const dedupe = () => run("dedupe", async () => {
        const r = await api("/api/admin/prospects/dedupe", "POST", ids.length ? { ids } : { all: true });
        toast.success(`Đã tra trùng ${r.checked} số`);
    });

    const review = (status: "approved" | "rejected" | "new") => run("review", async () => {
        await api("/api/admin/prospects", "PATCH", { ids, review_status: status });
        setSelected(new Set());
    });

    const exportCsv = () => run("export", async () => {
        const sp = new URLSearchParams(query); sp.set("export", "1");
        const r = await api<ListResp>(`/api/admin/prospects?${sp.toString()}`, "GET");
        const head = ["Tên", "Nhóm", "SĐT", "Nguồn SĐT", "Địa chỉ", "Tỉnh", "Khu vực", "Website", "Facebook", "Zalo", "Email", "Trùng", "Duyệt"];
        const rows = r.items.map((p) => [p.name, CATEGORY_LABEL[p.category || "khac"], p.phone, p.phone_source, p.address, p.province, p.district, p.website, p.facebook_url, p.zalo, p.email, DUP_LABEL[p.dup_status]?.text, p.review_status]);
        const csv = "﻿" + [head, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        a.download = `prospects_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    });

    const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const items = data?.items ?? [];
    const allOnPage = items.length > 0 && items.every((p) => selected.has(p.id));
    const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
    const usedPct = data ? Math.min(100, Math.round((data.google.used / data.google.limit) * 100)) : 0;

    const btn = "px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-50 transition-colors";

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <MapPin className="w-7 h-7 text-blue-600" /> Tìm khách tiềm năng
                </h1>
                <p className="text-slate-500 mt-1 text-sm">
                    Lập danh sách cửa hàng từ OpenStreetMap, bổ sung SĐT từ Google Places (trong hạn mức) và website/fanpage, tự chống trùng với CRM.
                    Chưa chia cho telesales. Dữ liệu bản đồ © OpenStreetMap contributors.
                </p>
            </div>

            {/* Thống kê */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {[
                    ["Tổng cửa hàng", data?.stats.total],
                    ["Có SĐT", data?.stats.withPhone],
                    ["Sạch (mới + có SĐT)", data?.stats.clean],
                    ["Trùng CRM", data?.stats.dupCrm],
                    ["Trùng trong danh sách", data?.stats.dupProspect],
                ].map(([label, v]) => (
                    <div key={label as string} className="bg-white border border-slate-200 rounded-xl p-3">
                        <div className="text-xs text-slate-500">{label}</div>
                        <div className="text-xl font-bold text-slate-800">{v ?? "–"}</div>
                    </div>
                ))}
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                    <div className="text-xs text-slate-500">Google tháng này</div>
                    <div className="text-xl font-bold text-slate-800">{data ? `${data.google.used}/${data.google.limit}` : "–"}</div>
                    <div className="h-1.5 bg-slate-100 rounded mt-1"><div className={`h-1.5 rounded ${usedPct > 85 ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${usedPct}%` }} /></div>
                </div>
            </div>

            {/* Bước 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <h2 className="font-semibold text-slate-800">Bước 1 · Quét OpenStreetMap theo khu vực</h2>
                <div className="grid md:grid-cols-3 gap-3">
                    <input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Tỉnh/Thành phố (vd: Hồ Chí Minh)" className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                    <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Quận/Huyện/Phường/Xã (tuỳ chọn)" className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                    <input type="number" min={1} max={3000} value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" title="Số cửa hàng tối đa" />
                </div>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(CATEGORIES).map(([k, label]) => (
                        <label key={k} className={`px-3 py-1.5 rounded-full border text-sm cursor-pointer ${cats.includes(k) ? "bg-blue-50 border-blue-300 text-blue-700" : "border-slate-200 text-slate-600"}`}>
                            <input type="checkbox" className="hidden" checked={cats.includes(k)} onChange={() => setCats((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]))} />
                            {label}
                        </label>
                    ))}
                </div>
                <button onClick={discover} disabled={!!busy || !province.trim() || cats.length === 0} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>
                    {busy === "discover" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Quét OpenStreetMap
                </button>
                <p className="text-xs text-slate-400">Nhập tên khu vực đúng như trên OpenStreetMap. Có thể mất vài chục giây với khu vực lớn.</p>
            </div>

            {/* Bước 2-4 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <h2 className="font-semibold text-slate-800">Bước 2 · Bổ sung SĐT và chống trùng <span className="text-sm font-normal text-slate-500">(áp dụng cho: {scope})</span></h2>
                <div className="flex flex-wrap gap-2">
                    <button onClick={enrichGoogle} disabled={!!busy || !data?.googleConfigured} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`} title={data?.googleConfigured ? "" : "Chưa cấu hình GOOGLE_PLACES_API_KEY"}>
                        {busy === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />} Lấy SĐT từ Google
                    </button>
                    <button onClick={enrichWeb} disabled={!!busy} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>
                        {busy === "web" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} Quét website / fanpage
                    </button>
                    <button onClick={dedupe} disabled={!!busy} className={`${btn} bg-slate-700 text-white hover:bg-slate-800`}>
                        {busy === "dedupe" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Tra trùng lại
                    </button>
                    <button onClick={load} disabled={!!busy} className={`${btn} border border-slate-200 text-slate-600 hover:bg-slate-50`}><RefreshCw className="w-4 h-4" /> Tải lại</button>
                </div>
                {!data?.googleConfigured && data && <p className="text-xs text-amber-600">Chưa có GOOGLE_PLACES_API_KEY trên server nên bước Google đang tắt.</p>}
            </div>

            {/* Bộ lọc + thao tác */}
            <div className="flex flex-wrap gap-2 items-center">
                <input value={filters.q} onChange={(e) => { setFilters({ ...filters, q: e.target.value }); setPage(1); }} placeholder="Tìm tên / địa chỉ / SĐT" className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-56" />
                <select value={filters.dup} onChange={(e) => { setFilters({ ...filters, dup: e.target.value }); setPage(1); }} className="border border-slate-200 rounded-lg px-2 py-2 text-sm">
                    <option value="">Mọi trạng thái trùng</option>
                    {Object.entries(DUP_LABEL).map(([k, v]) => <option key={k} value={k}>{v.text}</option>)}
                </select>
                <select value={filters.phone} onChange={(e) => { setFilters({ ...filters, phone: e.target.value }); setPage(1); }} className="border border-slate-200 rounded-lg px-2 py-2 text-sm">
                    <option value="">Có/không SĐT</option><option value="has">Có SĐT</option><option value="none">Chưa có SĐT</option>
                </select>
                <select value={filters.review} onChange={(e) => { setFilters({ ...filters, review: e.target.value }); setPage(1); }} className="border border-slate-200 rounded-lg px-2 py-2 text-sm">
                    <option value="">Mọi trạng thái duyệt</option><option value="new">Chưa duyệt</option><option value="approved">Đã duyệt</option><option value="rejected">Đã loại</option>
                </select>
                <select value={filters.category} onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }} className="border border-slate-200 rounded-lg px-2 py-2 text-sm">
                    <option value="">Mọi nhóm</option>{Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={filters.job_id} onChange={(e) => { setFilters({ ...filters, job_id: e.target.value }); setPage(1); }} className="border border-slate-200 rounded-lg px-2 py-2 text-sm max-w-[220px]">
                    <option value="">Mọi lần quét</option>
                    {data?.jobs.map((j) => <option key={j.id} value={j.id}>{j.province}{j.district ? ` / ${j.district}` : ""} · {j.inserted_count} · {new Date(j.created_at).toLocaleDateString("vi-VN")}</option>)}
                </select>
                <div className="ml-auto flex gap-2">
                    {ids.length > 0 && (<>
                        <button onClick={() => review("approved")} disabled={!!busy} className={`${btn} bg-emerald-50 text-emerald-700 border border-emerald-200`}><Check className="w-4 h-4" /> Duyệt ({ids.length})</button>
                        <button onClick={() => review("rejected")} disabled={!!busy} className={`${btn} bg-red-50 text-red-700 border border-red-200`}><X className="w-4 h-4" /> Loại ({ids.length})</button>
                    </>)}
                    <button onClick={exportCsv} disabled={!!busy} className={`${btn} border border-slate-200 text-slate-600 hover:bg-slate-50`}><Download className="w-4 h-4" /> Xuất CSV</button>
                </div>
            </div>

            {/* Bảng */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                        <tr>
                            <th className="p-3 w-8"><input type="checkbox" checked={allOnPage} onChange={() => setSelected(allOnPage ? new Set() : new Set(items.map((p) => p.id)))} /></th>
                            <th className="p-3">Cửa hàng</th><th className="p-3">Nhóm</th><th className="p-3">SĐT</th>
                            <th className="p-3">Liên hệ khác</th><th className="p-3">Trùng</th><th className="p-3">Duyệt</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-400">{data ? "Chưa có dữ liệu. Hãy quét một khu vực ở Bước 1." : "Đang tải..."}</td></tr>}
                        {items.map((p) => (
                            <tr key={p.id} className={`${selected.has(p.id) ? "bg-blue-50/50" : ""} ${p.review_status === "rejected" ? "opacity-50" : ""}`}>
                                <td className="p-3"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} /></td>
                                <td className="p-3 max-w-[280px]"><div className="font-medium text-slate-800">{p.name}</div><div className="text-xs text-slate-400 truncate">{p.address || [p.district, p.province].filter(Boolean).join(", ")}</div></td>
                                <td className="p-3 text-slate-600">{CATEGORY_LABEL[p.category || "khac"]}</td>
                                <td className="p-3 whitespace-nowrap">
                                    {p.phone ? <><span className="font-mono">{p.phone}</span> <span className="text-[10px] uppercase text-slate-400">{p.phone_source}</span></> : <span className="text-slate-300">{p.google_match === "no_match" ? "Google không khớp" : "–"}</span>}
                                </td>
                                <td className="p-3 space-x-2 whitespace-nowrap">
                                    {p.website && <a href={p.website} target="_blank" rel="noreferrer noopener" title={p.website}><Globe className="w-4 h-4 inline text-slate-500" /></a>}
                                    {p.facebook_url && <a href={p.facebook_url} target="_blank" rel="noreferrer noopener" title={p.facebook_url}><Facebook className="w-4 h-4 inline text-blue-600" /></a>}
                                    {p.zalo && <a href={`https://zalo.me/${p.zalo}`} target="_blank" rel="noreferrer noopener" title={`Zalo ${p.zalo}`}><MessageCircle className="w-4 h-4 inline text-sky-500" /></a>}
                                    {p.email && <span className="text-xs text-slate-500">{p.email}</span>}
                                </td>
                                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full border ${DUP_LABEL[p.dup_status]?.cls}`}>{DUP_LABEL[p.dup_status]?.text}</span></td>
                                <td className="p-3 text-xs text-slate-500">{p.review_status === "approved" ? "Đã duyệt" : p.review_status === "rejected" ? "Đã loại" : "–"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-500">
                <span>{data ? `${data.total} kết quả` : ""}</span>
                <div className="flex items-center gap-2">
                    <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={`${btn} border border-slate-200`}>Trước</button>
                    <span>{page}/{totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className={`${btn} border border-slate-200`}>Sau</button>
                </div>
            </div>
        </div>
    );
}
