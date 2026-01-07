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

import AddCustomerModal from "@/components/telesales/AddCustomerModal";

export default function TelesalesCustomersPage() {
    const { user, session, isLoading: authIsLoading } = useAuth();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);


    const [isLoading, setIsLoading] = useState(true);

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

    const handleEditClick = (customer: Customer) => {
        setEditingCustomer(customer);
        setShowAddForm(true);
    };

    const handleCreateDeal = (customer: Customer) => {
        // Navigate to CRM with customer selected
        router.push(`/telesales/crm?create_for=${customer.id}`);
    };

    const handleModalSuccess = () => {
        loadData();
    };

    const handleCloseModal = () => {
        setShowAddForm(false);
        setEditingCustomer(null);
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
            <AddCustomerModal
                isOpen={showAddForm}
                onClose={handleCloseModal}
                onSuccess={handleModalSuccess}
                initialData={editingCustomer}
            />
        </div>
    );
}
