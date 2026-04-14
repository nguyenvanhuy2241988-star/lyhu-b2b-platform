"use client";

import { useState, useEffect } from "react";
import { Plus, Search, ExternalLink, Edit, Trash2, XCircle, Loader2, Star, Users, Clock, Download, CheckSquare, Briefcase } from "lucide-react";
import {
    getTelesalesFbGroups, createTelesalesFbGroup, updateTelesalesFbGroup, deleteTelesalesFbGroup,
    getGroupPostCounts, GroupPostCountDetail, TelesalesFbGroup, FB_JOB_GROUP_CATEGORIES, FB_GROUP_STATUSES
} from "@/lib/telesalesDailyStore";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { format } from "date-fns";

const EMPTY_FORM: Partial<TelesalesFbGroup> = {
    name: "",
    link: "",
    platform: "facebook_group",
    category: "general_job",
    status: "active",
    quality_rating: 0,
    best_post_time: "",
    member_count: 0,
    notes: "",
    group_type: "job",
    requires_approval: false,
};

export default function FbJobGroupsPage() {
    const [groups, setGroups] = useState<TelesalesFbGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [postCounts, setPostCounts] = useState<Record<string, GroupPostCountDetail>>({});
    const [showModal, setShowModal] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<TelesalesFbGroup>>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Bulk Import
    const [importMode, setImportMode] = useState<'single' | 'bulk'>('single');
    const [bulkText, setBulkText] = useState("");

    // Filters
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkCategory, setBulkCategory] = useState("");
    const [showBulkBar, setShowBulkBar] = useState(false);

    useEffect(() => {
        loadUser();
        loadData();
    }, []);

    useEffect(() => {
        loadData();
    }, [filterCategory, filterStatus]);

    const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [groupsData, counts] = await Promise.all([
                getTelesalesFbGroups({
                    category: filterCategory,
                    status: filterStatus,
                    group_type: 'job',
                }),
                getGroupPostCounts(),
            ]);
            setGroups(groupsData);
            setPostCounts(counts);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi tải danh sách nhóm việc làm");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (importMode === 'bulk') {
            const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length === 0) {
                toast.error("Vui lòng dán danh sách link");
                return;
            }
            
            setSaving(true);
            try {
                let successCount = 0;
                for (const line of lines) {
                    // Try to extract a URL
                    const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
                    if (!urlMatch) continue;
                    
                    const url = urlMatch[1];
                    // Clean URL to base
                    const cleanUrl = url.split('?')[0];
                    // Try to get group ID or name from URL for default naming
                    const pathParts = cleanUrl.split('/').filter(Boolean);
                    const groupId = pathParts[pathParts.length - 1];
                    
                    await createTelesalesFbGroup({ 
                        name: `[Link] Tự động thêm ${groupId || Math.floor(Math.random()*1000)}`,
                        link: cleanUrl,
                        platform: 'facebook_group',
                        category: formData.category || 'general_job',
                        status: 'active',
                        added_by: currentUserId || undefined,
                        group_type: 'job' 
                    }).catch(e => console.log('Duplicate or error:', e.message)); // ignore duplicates silently
                    
                    successCount++;
                }
                toast.success(`Đã thêm hàng loạt ${successCount} nhóm!`);
                setShowModal(false);
                resetForm();
                loadData();
            } finally {
                setSaving(false);
            }
            return;
        }

        if (!formData.name?.trim()) {
            toast.error("Vui lòng nhập tên nhóm");
            return;
        }

        setSaving(true);
        try {
            if (selectedId) {
                await updateTelesalesFbGroup(selectedId, formData);
                toast.success("Cập nhật nhóm thành công");
            } else {
                await createTelesalesFbGroup({ ...formData, added_by: currentUserId || undefined, group_type: 'job' });
                toast.success("Thêm nhóm việc làm mới thành công");
            }
            setShowModal(false);
            resetForm();
            loadData();
        } catch (error: any) {
            if (error?.message?.includes('duplicate') || error?.code === '23505') {
                toast.error("Nhóm với tên này đã tồn tại!");
            } else {
                toast.error("Lỗi lưu dữ liệu: " + error.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc muốn xóa nhóm "${name}"?`)) return;
        try {
            await deleteTelesalesFbGroup(id);
            toast.success("Đã xóa nhóm");
            loadData();
        } catch (error) {
            console.error(error);
            toast.error("Lỗi xóa nhóm");
        }
    };

    const openEdit = (group: TelesalesFbGroup) => {
        setSelectedId(group.id);
        setFormData({
            name: group.name,
            link: group.link || "",
            platform: group.platform,
            category: group.category,
            status: group.status,
            quality_rating: group.quality_rating,
            best_post_time: group.best_post_time || "",
            member_count: group.member_count,
            notes: group.notes || "",
            group_type: 'job',
            requires_approval: group.requires_approval,
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setSelectedId(null);
        setFormData(EMPTY_FORM);
        setBulkText("");
        setImportMode('single');
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setSelectedIds(newSet);
        setShowBulkBar(newSet.size > 0);
    };

    const handleBulkCategory = async () => {
        if (!bulkCategory || selectedIds.size === 0) return;
        try {
            const ids = Array.from(selectedIds);
            for (let i = 0; i < ids.length; i++) {
                await updateTelesalesFbGroup(ids[i], { category: bulkCategory });
            }
            toast.success(`Đã gán phân loại cho ${selectedIds.size} nhóm`);
            setSelectedIds(new Set());
            setShowBulkBar(false);
            setBulkCategory("");
            loadData();
        } catch (e) {
            toast.error("Lỗi gán phân loại hàng loạt");
        }
    };

    const handleExport = () => {
        const headers = ["Tên nhóm", "Link", "Phân loại", "Trạng thái", "Thành viên", "Đánh giá", "Giờ vàng", "Ghi chú", "Người thêm"];
        const rows = filteredGroups.map(g => [
            g.name,
            g.link || "",
            getCategoryLabel(g.category),
            getStatusLabel(g.status),
            g.member_count || 0,
            g.quality_rating || 0,
            g.best_post_time || "",
            (g.notes || "").replace(/\n/g, " "),
            g.added_by_name || "",
        ]);

        const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `nhom-fb-viec-lam-${format(new Date(), "yyyyMMdd")}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Đã xuất file CSV");
    };

    const getCategoryLabel = (key: string) => FB_JOB_GROUP_CATEGORIES.find(c => c.key === key)?.label || key;
    const getCategoryColor = (key: string) => FB_JOB_GROUP_CATEGORIES.find(c => c.key === key)?.color || "bg-gray-100 text-gray-700";
    const getStatusLabel = (key: string) => FB_GROUP_STATUSES.find(s => s.key === key)?.label || key;
    const getStatusColor = (key: string) => FB_GROUP_STATUSES.find(s => s.key === key)?.color || "bg-gray-100 text-gray-700";

    const filteredGroups = groups.filter(g =>
        !searchTerm || g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const StarRating = ({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => onChange?.(value === star ? 0 : star)}
                    className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
                >
                    <Star className={`w-4 h-4 ${star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                </button>
            ))}
        </div>
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                        Nhóm FB Việc Làm & Tuyển Dụng
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Quản lý nhóm Facebook để đăng tin tuyển dụng · Bot tự động rải bài tuyển dụng
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-200 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> Thêm nhóm
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900">{groups.length}</div>
                    <div className="text-xs text-gray-500 mt-1">Tổng nhóm</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="text-2xl font-bold text-emerald-600">{groups.filter(g => g.status === 'active').length}</div>
                    <div className="text-xs text-gray-500 mt-1">Đang hoạt động</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="text-2xl font-bold text-red-600">{groups.filter(g => g.status === 'banned').length}</div>
                    <div className="text-xs text-gray-500 mt-1">Bị cấm đăng</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="text-2xl font-bold text-teal-600">
                        {groups.reduce((a, b) => a + (b.member_count || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Tổng thành viên (ước tính)</div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm nhóm việc làm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                        <option value="all">Tất cả phân loại</option>
                        {FB_JOB_GROUP_CATEGORIES.map(c => (
                            <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        {FB_GROUP_STATUSES.map(s => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {showBulkBar && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
                    <span className="text-sm font-medium text-emerald-700">
                        <CheckSquare className="w-4 h-4 inline mr-1" />
                        Đã chọn {selectedIds.size} nhóm
                    </span>
                    <select
                        value={bulkCategory}
                        onChange={(e) => setBulkCategory(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-emerald-200 rounded-lg bg-white"
                    >
                        <option value="">Chọn phân loại...</option>
                        {FB_JOB_GROUP_CATEGORIES.map(c => (
                            <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleBulkCategory}
                        disabled={!bulkCategory}
                        className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
                    >
                        Gán phân loại
                    </button>
                    <button
                        onClick={() => { setSelectedIds(new Set()); setShowBulkBar(false); }}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                    >
                        Bỏ chọn
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.size === filteredGroups.length && filteredGroups.length > 0}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedIds(new Set(filteredGroups.map(g => g.id)));
                                                    setShowBulkBar(true);
                                                } else {
                                                    setSelectedIds(new Set());
                                                    setShowBulkBar(false);
                                                }
                                            }}
                                            className="rounded border-gray-300"
                                        />
                                    </th>
                                    <th className="px-4 py-3 font-semibold">Tên nhóm</th>
                                    <th className="px-4 py-3 font-semibold">Phân loại</th>
                                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                                    <th className="px-4 py-3 font-semibold text-center">Đánh giá</th>
                                    <th className="px-4 py-3 font-semibold text-right">Thành viên</th>
                                    <th className="px-4 py-3 font-semibold">Giờ vàng</th>
                                    <th className="px-4 py-3 font-semibold">Ghi chú</th>
                                    <th className="px-4 py-3 font-semibold">Người thêm</th>
                                    <th className="px-4 py-3 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredGroups.map((group) => (
                                    <tr key={group.id} className="bg-white hover:bg-gray-50/80 transition-colors group/row">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(group.id)}
                                                onChange={() => toggleSelect(group.id)}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{group.name}</div>
                                            {group.link && (
                                                <a href={group.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-emerald-600 hover:underline mt-0.5 w-fit">
                                                    <ExternalLink className="w-3 h-3" /> Mở link
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(group.category)}`}>
                                                {getCategoryLabel(group.category)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(group.status)}`}>
                                                    {getStatusLabel(group.status)}
                                                </span>
                                                {group.status === 'active' && (
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                const newVal = !group.requires_approval;
                                                                await updateTelesalesFbGroup(group.id, { requires_approval: newVal });
                                                                setGroups(groups.map(g => g.id === group.id ? { ...g, requires_approval: newVal } : g));
                                                            } catch (e) {
                                                                toast.error("Lỗi cập nhật");
                                                            }
                                                        }}
                                                        title="Click để chuyển đổi chế độ đăng bài"
                                                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${
                                                            group.requires_approval 
                                                            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' 
                                                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                        }`}
                                                    >
                                                        {group.requires_approval ? '🛡️ Kiểm duyệt' : '⚡ Tự do'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StarRating 
                                                value={group.quality_rating || 0} 
                                                onChange={async (val) => {
                                                    try {
                                                        await updateTelesalesFbGroup(group.id, { quality_rating: val });
                                                        setGroups(groups.map(g => g.id === group.id ? { ...g, quality_rating: val } : g));
                                                    } catch (e) {
                                                        toast.error("Lỗi cập nhật đánh giá");
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {group.member_count > 0 ? (
                                                <span className="text-gray-700 font-medium">
                                                    {group.member_count.toLocaleString()}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {group.best_post_time ? (
                                                <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full w-fit">
                                                    <Clock className="w-3 h-3" />
                                                    {group.best_post_time}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 max-w-[200px] truncate text-gray-500" title={group.notes || ''}>
                                            {group.notes || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">
                                            {group.added_by_name || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(group)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Sửa">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(group.id, group.name)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredGroups.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-16 text-center">
                                            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-400 font-medium">Chưa có nhóm việc làm nào</p>
                                            <p className="text-gray-400 text-xs mt-1">Thêm nhóm FB tuyển dụng để Bot tự động rải tin</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Count */}
            {!loading && filteredGroups.length > 0 && (
                <div className="mt-3 text-xs text-gray-400 text-right">
                    Hiển thị {filteredGroups.length} / {groups.length} nhóm
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white animate-in zoom-in-95 duration-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-3 bg-emerald-50/50 sticky top-0 z-10">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {selectedId ? "Cập nhật Nhóm Việc Làm" : "Thêm Nhóm Việc Làm Mới"}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                            
                            {!selectedId && (
                                <div className="flex bg-white rounded-lg p-1 w-fit border border-emerald-200">
                                    <button 
                                        type="button"
                                        onClick={() => setImportMode('single')}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${importMode === 'single' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-emerald-600'}`}
                                    >
                                        Thêm thủ công
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setImportMode('bulk')}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${importMode === 'bulk' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-emerald-600'}`}
                                    >
                                        Thêm hàng loạt (Link)
                                    </button>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {importMode === 'bulk' && !selectedId ? (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-sm border border-emerald-200">
                                        <h4 className="font-bold flex items-center gap-1 mb-1">💡 Chế độ 1 cú dán - Auto nhập liệu</h4>
                                        Sếp chỉ việc copy 1 loạt <strong>Đường link (URL) Nhóm Facebook</strong> và dán vào đây. 
                                        Hệ thống sẽ tự nhận diện Link, loại bỏ chữ thừa và Tự động sinh tên tạm. Sếp có thể tha hồ nhét cho Bot chạy!
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Dán danh sách (Mỗi nhóm 1 dòng) *</label>
                                        <textarea
                                            required
                                            rows={8}
                                            value={bulkText}
                                            onChange={(e) => setBulkText(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all font-mono text-sm whitespace-pre"
                                            placeholder={`https://facebook.com/groups/job1\nhttps://facebook.com/groups/job2\n...`}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Chọn phân loại chung cho toàn bộ</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all bg-white"
                                        >
                                            {FB_JOB_GROUP_CATEGORIES.map(c => (
                                                <option key={c.key} value={c.key}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhóm *</label>
                                        <input
                                            type="text"
                                            required={importMode === 'single'}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
                                            placeholder="Ví dụ: Tuyển dụng Công nhân Hà Nội..."
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 mt-2 cursor-pointer w-fit">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.requires_approval || false} 
                                            onChange={e => setFormData({ ...formData, requires_approval: e.target.checked })}
                                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-gray-700 font-medium">🛡️ Nhóm yêu cầu Quản trị viên duyệt bài</span>
                                    </label>
                                    <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Link nhóm</label>
                                <input
                                    type="url"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
                                    placeholder="https://facebook.com/groups/..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phân loại</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all bg-white"
                                    >
                                        {FB_JOB_GROUP_CATEGORIES.map(c => (
                                            <option key={c.key} value={c.key}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all bg-white"
                                    >
                                        {FB_GROUP_STATUSES.map(s => (
                                            <option key={s.key} value={s.key}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số thành viên (ước tính)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={formData.member_count || ""}
                                        onChange={(e) => setFormData({ ...formData, member_count: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
                                        placeholder="VD: 50000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giờ vàng đăng bài</label>
                                    <input
                                        type="text"
                                        value={formData.best_post_time || ""}
                                        onChange={(e) => setFormData({ ...formData, best_post_time: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
                                        placeholder="VD: 7h-9h sáng"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá chất lượng</label>
                                <StarRating
                                    value={formData.quality_rating || 0}
                                    onChange={(v) => setFormData({ ...formData, quality_rating: v })}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    {(formData.quality_rating || 0) === 0 && "Chưa đánh giá"}
                                    {formData.quality_rating === 1 && "⭐ Kém — Ít tương tác"}
                                    {formData.quality_rating === 2 && "⭐⭐ Trung bình"}
                                    {formData.quality_rating === 3 && "⭐⭐⭐ Khá — Có người ứng tuyển"}
                                    {formData.quality_rating === 4 && "⭐⭐⭐⭐ Tốt — Ra ứng viên thường xuyên"}
                                    {formData.quality_rating === 5 && "⭐⭐⭐⭐⭐ Xuất sắc — Nhóm vàng tuyển dụng"}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú & Lưu ý</label>
                                <textarea
                                    rows={3}
                                    value={formData.notes || ""}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all resize-none"
                                    placeholder="Quy tắc nhóm, admin liên hệ, loại tin tuyển dụng phù hợp..."
                                />
                            </div>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-200 font-medium disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (selectedId ? "Cập nhật" : "Thêm mới")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
