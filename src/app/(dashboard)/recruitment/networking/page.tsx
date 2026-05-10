"use client";

import { useState, useEffect } from "react";
import { Plus, Search, MapPin, Mail, Phone, ExternalLink, Edit, Trash2, User, Building, XCircle, Loader2 } from "lucide-react";
import { getContacts, createContact, updateContact, deleteContact, RecruitmentContact } from "@/lib/recruitmentStore";
import { toast } from "sonner";
import { format } from "date-fns";

export default function NetworkingPage() {
    const [contacts, setContacts] = useState<RecruitmentContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Form State
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<RecruitmentContact>>({
        name: "",
        position: "",
        organization: "",
        phone: "",
        email: "",
        social_link: "",
        notes: "",
        status: "new"
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getContacts();
            setContacts(data);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi tải danh sách liên hệ");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.name) {
                toast.error("Vui lòng nhập tên đối tác");
                return;
            }

            if (selectedId) {
                await updateContact(selectedId, formData);
                toast.success("Cập nhật thành công");
            } else {
                await createContact(formData);
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
        if (!confirm(`Bạn có chắc muốn xóa đối tác "${name}"?`)) return;
        try {
            await deleteContact(id);
            toast.success("Đã xóa");
            loadData();
        } catch (error) {
            console.error(error);
            toast.error("Lỗi xóa dữ liệu");
        }
    };

    const openEdit = (contact: RecruitmentContact) => {
        setSelectedId(contact.id);
        setFormData(contact);
        setShowModal(true);
    };

    const resetForm = () => {
        setSelectedId(null);
        setFormData({
            name: "",
            position: "",
            organization: "",
            phone: "",
            email: "",
            social_link: "",
            notes: "",
            status: "new"
        });
    };

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.organization?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'connected': return 'bg-green-100 text-green-700';
            case 'contacted': return 'bg-primary-100 text-primary-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'connected': return 'Thân thiết';
            case 'contacted': return 'Đã liên hệ';
            default: return 'Mới';
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Mối quan hệ</h1>
                    <p className="text-slate-500">Lưu trữ danh sách đối tác tuyển dụng, KOLs, Headhunters...</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm đối tác
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">Họ tên & Chức vụ</th>
                            <th className="px-6 py-3">Liên hệ</th>
                            <th className="px-6 py-3">Tổ chức</th>
                            <th className="px-6 py-3">Trạng thái</th>
                            <th className="px-6 py-3 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredContacts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                    Chưa có dữ liệu phù hợp.
                                </td>
                            </tr>
                        ) : (
                            filteredContacts.map(contact => (
                                <tr key={contact.id} className="hover:bg-slate-50 transition group">
                                    <td className="px-6 py-3">
                                        <div className="font-bold text-slate-900">{contact.name}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            <User className="w-3 h-3" /> {contact.position || "---"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 space-y-1">
                                        {contact.phone && (
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Phone className="w-3.5 h-3.5 text-slate-400" /> {contact.phone}
                                            </div>
                                        )}
                                        {contact.email && (
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" /> {contact.email}
                                            </div>
                                        )}
                                        {contact.social_link && (
                                            <a href={contact.social_link} target="_blank" className="flex items-center gap-1.5 text-primary-600 hover:underline">
                                                <ExternalLink className="w-3.5 h-3.5" /> Social Profile
                                            </a>
                                        )}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                                            <Building className="w-4 h-4 text-slate-400" />
                                            {contact.organization || "Tự do"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(contact.status)}`}>
                                            {getStatusLabel(contact.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEdit(contact)}
                                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(contact.id, contact.name)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    </table>
                </div>
                
                {/* Mobile Card List View */}
                <div className="lg:hidden divide-y divide-slate-100">
                    {filteredContacts.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            Chưa có dữ liệu phù hợp.
                        </div>
                    ) : (
                        filteredContacts.map(contact => (
                            <div key={contact.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-slate-900 line-clamp-1">{contact.name}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{contact.position || "---"}</div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${getStatusColor(contact.status)}`}>
                                        {getStatusLabel(contact.status)}
                                    </span>
                                </div>
                                
                                <div className="bg-slate-50 p-3 rounded-lg space-y-2 mb-3">
                                    <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                                        <Building className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="line-clamp-1">{contact.organization || "Tự do"}</span>
                                    </div>
                                    
                                    {(contact.phone || contact.email) && (
                                        <div className="pt-2 border-t border-slate-100 space-y-1">
                                            {contact.phone && (
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {contact.phone}
                                                </div>
                                            )}
                                            {contact.email && (
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Mail className="w-3.5 h-3.5 text-slate-400" /> <span className="truncate">{contact.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                    <div>
                                        {contact.social_link && (
                                            <a href={contact.social_link} target="_blank" className="flex items-center gap-1.5 text-[10px] font-bold text-primary-600 hover:text-primary-700 hover:underline bg-primary-50 px-2 py-1 rounded">
                                                <ExternalLink className="w-3 h-3" /> Profile
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openEdit(contact)}
                                            className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 rounded-lg transition-colors flex items-center gap-1.5"
                                        >
                                            <Edit className="w-3 h-3" /> Sửa
                                        </button>
                                        <button
                                            onClick={() => handleDelete(contact.id, contact.name)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">
                                {selectedId ? "Cập nhật thông tin" : "Thêm đối tác mới"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                                <input
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="VD: Nguyễn Văn A"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tổ chức / Trường</label>
                                    <input
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={formData.organization}
                                        onChange={e => setFormData({ ...formData, organization: e.target.value })}
                                        placeholder="VD: ĐH Kinh Tế"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Chức vụ</label>
                                    <input
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={formData.position}
                                        onChange={e => setFormData({ ...formData, position: e.target.value })}
                                        placeholder="VD: Chủ nhiệm CLB..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                                    <input
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="0912..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                                    <input
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="example@gmail.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Link Facebook / LinkedIn</label>
                                <input
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={formData.social_link}
                                    onChange={e => setFormData({ ...formData, social_link: e.target.value })}
                                    placeholder="https://"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Trạng thái quan hệ</label>
                                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-lg">
                                    {(['new', 'contacted', 'connected'] as const).map(status => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status })}
                                            className={`py-1.5 text-sm font-medium rounded transition ${formData.status === status ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {getStatusLabel(status)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú</label>
                                <textarea
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                    rows={3}
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Ghi chú thêm về đối tác..."
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-sm transition active:scale-[0.98] mt-2"
                            >
                                {selectedId ? "Lưu thay đổi" : "Thêm đối tác"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
