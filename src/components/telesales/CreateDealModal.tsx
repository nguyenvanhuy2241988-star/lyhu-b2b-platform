"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Trash2, Search, User, Building, Phone, MapPin, Plus } from "lucide-react";
import {
    DealStage,
    DealPriority,
    CRMDeal,
    Customer,
    DEAL_STAGE_LABELS,
    DEAL_PRIORITY_LABELS,
    searchCustomers,
    createCustomer,
    checkOpenDeals,
    checkDuplicatePhone
} from "@/lib/crmDealsStore";
import { PROVINCES, getDistricts } from "@/lib/locationData";

interface CreateDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (dealData: {
        title: string;
        customer_id: string;
        customer?: Customer;
        stage: DealStage;
        priority: DealPriority;
        next_action_at?: string;
        expected_value?: number;
        note?: string;
        source?: string;
        tags?: string[];
        isNewCustomer?: boolean;
        newCustomerData?: Partial<Customer>;
    }) => void;
    onDelete?: () => void;
    initialStage?: DealStage;
    initialData?: Partial<CRMDeal>;
    userId?: string;
}

const CUSTOMER_TYPES = [
    { value: 'tap_hoa', label: 'Tạp hóa' },
    { value: 'mini_mart', label: 'Mini mart' },
    { value: 'dai_ly', label: 'Đại lý' },
    { value: 'npp', label: 'NPP' },
    { value: 'sieu_thi', label: 'Siêu thị' },
];

export const CreateDealModal = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialStage = "new_data",
    initialData = {},
    userId
}: CreateDealModalProps) => {
    const isEditMode = !!initialData.id;

    // Tab state
    const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');

    // Deal fields
    const [title, setTitle] = useState(initialData.title || "");
    const [stage, setStage] = useState<DealStage>((initialData.stage as DealStage) || initialStage);
    const [priority, setPriority] = useState<DealPriority>((initialData.priority as DealPriority) || "normal");
    const [expectedValue, setExpectedValue] = useState<string>(initialData.expected_value ? initialData.expected_value.toString() : "");
    const [nextActionAt, setNextActionAt] = useState(initialData.next_action_at?.split('T')[0] || "");
    const [note, setNote] = useState(initialData.note || "");

    // New customer fields
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerType, setCustomerType] = useState("tap_hoa");
    const [customerAddress, setCustomerAddress] = useState("");
    const [customerProvince, setCustomerProvince] = useState("");
    const [customerDistrict, setCustomerDistrict] = useState("");

    // Derived districts based on province
    const districts = customerProvince ? getDistricts(customerProvince) : [];

    // Existing customer search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Warning for existing open deals
    const [existingDeals, setExistingDeals] = useState<CRMDeal[]>([]);
    const [showDealWarning, setShowDealWarning] = useState(false);

    // Duplicate phone detection
    const [duplicateCustomer, setDuplicateCustomer] = useState<Customer | null>(null);
    const [isCheckingPhone, setIsCheckingPhone] = useState(false);

    // Reset form when modal opens/closes or initialData changes
    useEffect(() => {
        if (isOpen) {
            setTitle(initialData.title || "");
            setStage((initialData.stage as DealStage) || initialStage);
            setPriority((initialData.priority as DealPriority) || "normal");
            setExpectedValue(initialData.expected_value ? initialData.expected_value.toString() : "");
            setNextActionAt(initialData.next_action_at?.split('T')[0] || "");
            setNote(initialData.note || "");

            if (initialData.customer) {
                setActiveTab('existing');
                setSelectedCustomer(initialData.customer);
            } else {
                setActiveTab('new');
                setSelectedCustomer(null);
            }

            setCustomerName("");
            setCustomerPhone("");
            setCustomerType("tap_hoa");
            setCustomerAddress("");
            setCustomerProvince("");
            setCustomerDistrict("");
            setSearchQuery("");
            setSearchResults([]);
            setExistingDeals([]);
            setShowDealWarning(false);
            setDuplicateCustomer(null);
        }
    }, [isOpen, initialData?.id]);

    // Check for duplicate phone when typing
    useEffect(() => {
        const checkPhone = async () => {
            if (customerPhone.length >= 8 && activeTab === 'new') {
                setIsCheckingPhone(true);
                const existing = await checkDuplicatePhone(customerPhone);
                setDuplicateCustomer(existing);
                setIsCheckingPhone(false);
            } else {
                setDuplicateCustomer(null);
            }
        };

        const timer = setTimeout(checkPhone, 500);
        return () => clearTimeout(timer);
    }, [customerPhone, activeTab]);

    // Search customers
    useEffect(() => {
        const doSearch = async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                const results = await searchCustomers(searchQuery, userId);
                setSearchResults(results);
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        };

        const timer = setTimeout(doSearch, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, userId]);

    // Check for existing open deals when customer selected
    useEffect(() => {
        const checkDeals = async () => {
            if (selectedCustomer && !isEditMode) {
                const openDeals = await checkOpenDeals(selectedCustomer.id);
                if (openDeals.length > 0) {
                    setExistingDeals(openDeals);
                    setShowDealWarning(true);
                } else {
                    setExistingDeals([]);
                    setShowDealWarning(false);
                }
            }
        };
        checkDeals();
    }, [selectedCustomer, isEditMode]);

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setSearchQuery("");
        setSearchResults([]);
        // Auto-fill title if empty
        if (!title) {
            setTitle(`Cơ hội - ${customer.name}`);
        }
    };

    const handleSave = () => {
        // Validation
        if (activeTab === 'new') {
            if (!customerName.trim()) {
                alert("Vui lòng nhập tên khách hàng");
                return;
            }
            if (!customerPhone.trim()) {
                alert("Vui lòng nhập số điện thoại");
                return;
            }
        } else {
            if (!selectedCustomer) {
                alert("Vui lòng chọn khách hàng");
                return;
            }
        }

        if (!title.trim()) {
            // Auto generate title
            const customerLabel = activeTab === 'new' ? customerName : selectedCustomer?.name;
            setTitle(`Cơ hội - ${customerLabel}`);
        }

        const dealData = {
            title: title.trim() || `Cơ hội - ${activeTab === 'new' ? customerName : selectedCustomer?.name}`,
            customer_id: selectedCustomer?.id || '', // Will be set after customer creation
            customer: selectedCustomer || undefined,
            stage,
            priority,
            expected_value: expectedValue ? parseInt(expectedValue.replace(/\D/g, '')) : undefined,
            next_action_at: nextActionAt || undefined,
            note: note.trim() || undefined,
            isNewCustomer: activeTab === 'new',
            newCustomerData: activeTab === 'new' ? {
                name: customerName.trim(),
                phone: customerPhone.trim(),
                type: customerType,
                address: customerAddress.trim() || undefined,
                province: customerProvince ? PROVINCES.find(p => p.code === customerProvince)?.name : undefined,
                district: customerDistrict ? districts.find(d => d.code === customerDistrict)?.name : undefined,
                owner_user_id: userId
            } : undefined
        };

        onSave(dealData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-slate-50">
                    <h3 className="font-semibold text-slate-900">
                        {isEditMode ? "Sửa cơ hội" : "Tạo cơ hội mới"}
                    </h3>
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); onClose(); }}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs - Show always */}
                <div className="flex border-b">
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'new'
                            ? 'border-b-2 border-primary-500 text-primary-600 bg-primary-50/50'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        onClick={() => { setActiveTab('new'); setSelectedCustomer(null); }}
                    >
                        <Plus className="w-4 h-4 inline mr-1" />
                        Khách mới
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'existing'
                            ? 'border-b-2 border-primary-500 text-primary-600 bg-primary-50/50'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        onClick={() => setActiveTab('existing')}
                    >
                        <User className="w-4 h-4 inline mr-1" />
                        Khách cũ
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">

                    {/* Tab: Khách mới */}
                    {activeTab === 'new' && (
                        <div className="space-y-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                            <h4 className="text-sm font-medium text-blue-900 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Thông tin khách hàng mới
                            </h4>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Tên cửa hàng *</label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="VD: Tạp hóa Hương Mai"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">SĐT *</label>
                                    <input
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${duplicateCustomer ? 'border-orange-400 ring-orange-200' : 'border-slate-300 focus:ring-primary-500'}`}
                                        placeholder="0901234567"
                                    />
                                </div>
                            </div>

                            {/* Duplicate Phone Warning */}
                            {duplicateCustomer && (
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="text-sm font-medium text-orange-800 mb-1">
                                        ⚠️ SĐT này đã có trong hệ thống!
                                    </div>
                                    <div className="text-xs text-orange-700 mb-2">
                                        <strong>{duplicateCustomer.name}</strong> - {duplicateCustomer.phone}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleSelectCustomer(duplicateCustomer);
                                            setActiveTab('existing');
                                            setDuplicateCustomer(null);
                                            setCustomerPhone('');
                                            setCustomerName('');
                                        }}
                                        className="text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                                    >
                                        Chọn khách này
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Tỉnh/Thành</label>
                                    <select
                                        value={customerProvince}
                                        onChange={(e) => {
                                            setCustomerProvince(e.target.value);
                                            setCustomerDistrict(""); // Reset district
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">-- Chọn Tỉnh --</option>
                                        {PROVINCES.map(p => (
                                            <option key={p.code} value={p.code}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Quận/Huyện</label>
                                    <select
                                        value={customerDistrict}
                                        onChange={(e) => setCustomerDistrict(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        disabled={!customerProvince}
                                    >
                                        <option value="">-- Chọn Quận --</option>
                                        {districts.map(d => (
                                            <option key={d.code} value={d.code}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Loại khách</label>
                                    <select
                                        value={customerType}
                                        onChange={(e) => setCustomerType(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        {CUSTOMER_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Địa chỉ</label>
                                    <input
                                        type="text"
                                        value={customerAddress}
                                        onChange={(e) => setCustomerAddress(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Số nhà, đường..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Khách cũ */}
                    {activeTab === 'existing' && (
                        <div className="space-y-3 p-3 bg-green-50/50 rounded-lg border border-green-100">
                            <h4 className="text-sm font-medium text-green-900 flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                Tìm khách hàng
                            </h4>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Nhập tên hoặc SĐT..."
                                />
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                                    {searchResults.map(customer => (
                                        <button
                                            key={customer.id}
                                            onClick={() => handleSelectCustomer(customer)}
                                            className="w-full p-2 text-left hover:bg-slate-50 flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                                                <Building className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm text-slate-900 truncate">{customer.name}</div>
                                                <div className="text-xs text-slate-500">{customer.phone}</div>
                                            </div>
                                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{customer.type}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {isSearching && (
                                <div className="text-center py-3 text-sm text-slate-500">Đang tìm...</div>
                            )}

                            {/* Selected Customer */}
                            {selectedCustomer && (
                                <div className="p-3 bg-white border border-green-300 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <Building className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{selectedCustomer.name}</div>
                                                <div className="text-sm text-slate-500 flex items-center gap-2">
                                                    <Phone className="w-3 h-3" /> {selectedCustomer.phone}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedCustomer(null)}
                                            className="text-slate-400 hover:text-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Warning: Existing open deals */}
                            {showDealWarning && existingDeals.length > 0 && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="text-sm font-medium text-yellow-800 mb-1">
                                        ⚠️ Khách đang có {existingDeals.length} cơ hội mở
                                    </div>
                                    <div className="text-xs text-yellow-700">
                                        {existingDeals.map(d => d.title).join(', ')}
                                    </div>
                                    <div className="mt-2 text-xs text-yellow-600">
                                        Bạn vẫn có thể tạo cơ hội mới.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}



                    {/* Deal Fields */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề cơ hội</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="VD: Nhắc nhập UHi tháng 1"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Giai đoạn</label>
                                <select
                                    value={stage}
                                    onChange={(e) => setStage(e.target.value as DealStage)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    {Object.entries(DEAL_STAGE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Độ ưu tiên</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as DealPriority)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    {Object.entries(DEAL_PRIORITY_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Giá trị dự kiến (VNĐ)</label>
                                <input
                                    type="text"
                                    value={expectedValue ? new Intl.NumberFormat('vi-VN').format(parseInt(expectedValue.replace(/\D/g, '') || '0')) : ''}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/\D/g, '');
                                        setExpectedValue(rawValue);
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nhắc việc</label>
                                <input
                                    type="date"
                                    value={nextActionAt}
                                    onChange={(e) => setNextActionAt(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                placeholder="Ghi chú về cơ hội..."
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t flex justify-between">
                    <div>
                        {isEditMode && onDelete && (
                            <button
                                onClick={onDelete}
                                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Xóa
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Lưu
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
