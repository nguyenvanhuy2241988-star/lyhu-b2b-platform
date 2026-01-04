"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, MapPin, Phone, Mail, MoreHorizontal, Building, UserPlus, Loader2, X, Save } from "lucide-react";
import { fetchCustomers, createCustomer, Customer } from "@/lib/crmDealsStore";
import { useAuth } from "@/components/auth/AuthProvider";

const CUSTOMER_TYPES = [
    { value: 'tap_hoa', label: 'Tạp hóa' },
    { value: 'mini_mart', label: 'Mini mart' },
    { value: 'dai_ly', label: 'Đại lý' },
    { value: 'npp', label: 'NPP' },
    { value: 'sieu_thi', label: 'Siêu thị' },
];

export default function TelesalesCustomersPage() {
    const { user, session, isLoading: authIsLoading } = useAuth();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form state
    const [formName, setFormName] = useState("");
    const [formPhone, setFormPhone] = useState("");
    const [formType, setFormType] = useState("tap_hoa");
    const [formAddress, setFormAddress] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const loadData = useCallback(async () => {
        if (!user || !session?.access_token) return;
        setIsLoading(true);
        const data = await fetchCustomers(user.id, session.access_token);
        setCustomers(data);
        setIsLoading(false);
    }, [user, session?.access_token]);

    useEffect(() => {
        if (user && session?.access_token) {
            loadData();
        } else if (!authIsLoading) {
            setIsLoading(false);
        }
    }, [user, session?.access_token, authIsLoading, loadData]);

    const filteredCustomers = customers.filter((customer) => {
        return (
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone.includes(searchTerm)
        );
    });

    const handleCreateCustomer = async () => {
        if (!formName.trim() || !formPhone.trim()) {
            alert("Vui lòng nhập tên và số điện thoại");
            return;
        }

        const userId = user?.id;
        if (!userId) {
            alert("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
            return;
        }

        setIsSaving(true);
        const { createCustomer } = await import("@/lib/crmDealsStore");
        const newCustomer = await createCustomer({
            name: formName.trim(),
            phone: formPhone.trim(),
            email: formEmail.trim() || undefined,
            address: formAddress.trim() || undefined,
            type: formType,
            owner_user_id: userId,
            status: 'active'
        }, session?.access_token);

        if (newCustomer) {
            resetForm();
            loadData();
        } else {
            alert("Không thể tạo khách hàng. Vui lòng thử lại.");
        }
        setIsSaving(false);
    };

    const handleEditCustomer = async () => {
        if (!editingCustomer || !formName.trim() || !formPhone.trim()) return;

        setIsSaving(true);
        const { updateCustomer } = await import("@/lib/crmDealsStore");
        const success = await updateCustomer(editingCustomer.id, {
            name: formName.trim(),
            phone: formPhone.trim(),
            email: formEmail.trim() || undefined,
            address: formAddress.trim() || undefined,
            type: formType,
        }, session?.access_token);

        if (success) {
            resetForm();
            loadData();
        } else {
            alert("Không thể cập nhật thông tin. Vui lòng thử lại.");
        }
        setIsSaving(false);
    };

    const resetForm = () => {
        setShowAddForm(false);
        setEditingCustomer(null);
        setFormName("");
        setFormPhone("");
        setFormType("tap_hoa");
        setFormAddress("");
        setFormEmail("");
    };

    const handleEditClick = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormName(customer.name);
        setFormPhone(customer.phone);
        setFormType(customer.type || "tap_hoa");
        setFormAddress(customer.address || "");
        setFormEmail(customer.email || "");
        setShowAddForm(true);
    };

    const handleCreateDeal = (customer: Customer) => {
        // Navigate to CRM with customer selected
        router.push(`/telesales/crm?create_for=${customer.id}`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Khách hàng của tôi</h1>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tên, SĐT..."
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Thêm khách</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border">
                    <div className="text-2xl font-bold text-slate-900">{customers.length}</div>
                    <div className="text-sm text-slate-500">Tổng khách hàng</div>
                </div>
                <div className="bg-white p-4 rounded-xl border">
                    <div className="text-2xl font-bold text-green-600">{customers.filter(c => c.type === 'tap_hoa').length}</div>
                    <div className="text-sm text-slate-500">Tạp hóa</div>
                </div>
                <div className="bg-white p-4 rounded-xl border">
                    <div className="text-2xl font-bold text-purple-600">{customers.filter(c => c.type === 'mini_mart').length}</div>
                    <div className="text-sm text-slate-500">Mini mart</div>
                </div>
                <div className="bg-white p-4 rounded-xl border">
                    <div className="text-2xl font-bold text-orange-600">{customers.filter(c => c.type === 'npp' || c.type === 'dai_ly').length}</div>
                    <div className="text-sm text-slate-500">NPP/Đại lý</div>
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Cửa hàng / Khách hàng</th>
                                <th className="px-6 py-3 font-medium">Liên hệ</th>
                                <th className="px-6 py-3 font-medium">Địa chỉ</th>
                                <th className="px-6 py-3 font-medium">Loại</th>
                                <th className="px-6 py-3 font-medium text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                                <Building className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{customer.name}</div>
                                                <div className="text-xs text-slate-500">ID: {customer.id.slice(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600 mb-1">
                                            <Phone className="w-3.5 h-3.5" />
                                            <a href={`tel:${customer.phone}`} className="hover:text-primary-600">{customer.phone}</a>
                                        </div>
                                        {customer.email && (
                                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                                                <Mail className="w-3.5 h-3.5" />
                                                <span>{customer.email}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-2 text-slate-600">
                                            <MapPin className="w-3.5 h-3.5 mt-0.5" />
                                            <span className="max-w-[200px] truncate" title={customer.address}>
                                                {customer.address || "-"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${customer.type === 'tap_hoa' ? 'bg-green-100 text-green-700' :
                                            customer.type === 'mini_mart' ? 'bg-purple-100 text-purple-700' :
                                                customer.type === 'npp' ? 'bg-orange-100 text-orange-700' :
                                                    customer.type === 'dai_ly' ? 'bg-blue-100 text-blue-700' :
                                                        customer.type === 'sieu_thi' ? 'bg-pink-100 text-pink-700' :
                                                            'bg-slate-100 text-slate-600'
                                            }`}>
                                            {CUSTOMER_TYPES.find(t => t.value === customer.type)?.label || customer.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleCreateDeal(customer)}
                                                className="px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded text-xs font-medium transition-colors"
                                            >
                                                <UserPlus className="w-3.5 h-3.5 inline mr-1" />
                                                Tạo cơ hội
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(customer)}
                                                className="px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium transition-colors"
                                            >
                                                Sửa
                                            </button>
                                            <button className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <Building className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                        <p className="font-medium">Chưa có khách hàng nào</p>
                                        <p className="text-sm mt-1">Thêm khách hàng mới hoặc tạo cơ hội từ CRM</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Customer Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="font-semibold text-slate-900">
                                {editingCustomer ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}
                            </h3>
                            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Tên cửa hàng *</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                    placeholder="Ví dụ: Tạp hóa Cô Ba"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Số điện thoại *</label>
                                    <input
                                        type="tel"
                                        value={formPhone}
                                        onChange={(e) => setFormPhone(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Loại hình</label>
                                    <select
                                        value={formType}
                                        onChange={(e) => setFormType(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                    >
                                        {CUSTOMER_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Email</label>
                                <input
                                    type="email"
                                    value={formEmail}
                                    onChange={(e) => setFormEmail(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Địa chỉ</label>
                                <input
                                    type="text"
                                    value={formAddress}
                                    onChange={(e) => setFormAddress(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                    placeholder="Số nhà, Tên đường..."
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    onClick={resetForm}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={editingCustomer ? handleEditCustomer : handleCreateCustomer}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {editingCustomer ? "Cập nhật" : "Lưu khách hàng"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
