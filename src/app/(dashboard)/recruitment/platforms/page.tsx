"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Globe, Smartphone, Users, Edit, Trash2, XCircle, Loader2, DollarSign, Lightbulb } from "lucide-react";
import { getPlatforms, createPlatform, updatePlatform, deletePlatform, RecruitmentPlatform } from "@/lib/recruitmentStore";
import { toast } from "sonner";
import { format } from "date-fns";

export default function PlatformsPage() {
    const [platforms, setPlatforms] = useState<RecruitmentPlatform[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Form State
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<RecruitmentPlatform>>({
        name: "",
        type: "Website",
        pricing_details: "",
        tips: "",
        active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getPlatforms();
            setPlatforms(data);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi tải danh sách nền tảng");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.name) {
                toast.error("Vui lòng nhập tên nền tảng");
                return;
            }

            if (selectedId) {
                await updatePlatform(selectedId, formData);
                toast.success("Cập nhật thành công");
            } else {
                await createPlatform(formData);
                toast.success("Thêm mới thành công");
            }

            setShowModal(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error(error);
            toast.error("Lỗi lưu dữ liệu");
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc muốn xóa nền tảng "${name}"?`)) return;
        try {
            await deletePlatform(id);
            toast.success("Đã xóa");
            loadData();
        } catch (error) {
            console.error(error);
            toast.error("Lỗi xóa dữ liệu");
        }
    };

    const openEdit = (platform: RecruitmentPlatform) => {
        setSelectedId(platform.id);
        setFormData(platform);
        setShowModal(true);
    };

    const resetForm = () => {
        setSelectedId(null);
        setFormData({
            name: "",
            type: "Website",
            pricing_details: "",
            tips: "",
            active: true
        });
    };

    const filteredPlatforms = platforms.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getIcon = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes('web')) return <Globe className="w-5 h-5 text-blue-500" />;
        if (t.includes('app')) return <Smartphone className="w-5 h-5 text-purple-500" />;
        if (t.includes('face') || t.includes('group')) return <Users className="w-5 h-5 text-indigo-500" />;
        return <Globe className="w-5 h-5 text-gray-500" />;
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Nền tảng & Tài nguyên
                    </h1>
                    <p className="text-gray-500 mt-1">Quản lý các kênh tuyển dụng và tài nguyên</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200"
                >
                    <Plus className="w-4 h-4" />
                    <span>Thêm nền tảng</span>
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm nền tảng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black/5 transition-all outline-none"
                    />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlatforms.map((platform) => (
                        <div key={platform.id} className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                                        {getIcon(platform.type)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{platform.type}</span>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${platform.active
                                        ? 'bg-green-50 text-green-700 border border-green-100'
                                        : 'bg-gray-50 text-gray-600 border border-gray-100'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${platform.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    {platform.active ? 'Active' : 'Inactive'}
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                {platform.pricing_details && (
                                    <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-50">
                                        <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold mb-1">
                                            <DollarSign className="w-3.5 h-3.5" />
                                            Chi phí & Gói
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">{platform.pricing_details}</p>
                                    </div>
                                )}

                                {platform.tips && (
                                    <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-50">
                                        <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold mb-1">
                                            <Lightbulb className="w-3.5 h-3.5" />
                                            Mẹo sử dụng
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">{platform.tips}</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openEdit(platform)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(platform.id, platform.name)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredPlatforms.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                            Không có dữ liệu
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white run-in zoom-in-95 duration-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {selectedId ? "Cập nhật Nền tảng" : "Thêm Nền tảng Mới"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên nền tảng</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 outline-none transition-all"
                                    placeholder="Ví dụ: VietnamWorks, TopCV..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 outline-none transition-all bg-white"
                                    >
                                        <option value="Website">Website</option>
                                        <option value="App">Mobile App</option>
                                        <option value="Group Facebook">Group Facebook</option>
                                        <option value="Headhunter">Headhunter</option>
                                        <option value="Other">Khác</option>
                                    </select>
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <div className={`w-11 h-6 rounded-full p-1 transition-colors ${formData.active ? 'bg-black' : 'bg-gray-200'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${formData.active ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                            className="hidden"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Đang hoạt động</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chi phí & Gói dịch vụ</label>
                                <textarea
                                    rows={3}
                                    value={formData.pricing_details || ""}
                                    onChange={(e) => setFormData({ ...formData, pricing_details: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 outline-none transition-all resize-none"
                                    placeholder="Thông tin giá cả, các gói tin đăng..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mẹo sử dụng & Lưu ý</label>
                                <textarea
                                    rows={3}
                                    value={formData.tips || ""}
                                    onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 outline-none transition-all resize-none"
                                    placeholder="Kinh nghiệm đăng tin, khung giờ hiệu quả..."
                                />
                            </div>

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
                                    className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200 font-medium"
                                >
                                    {selectedId ? "Cập nhật" : "Thêm mới"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
