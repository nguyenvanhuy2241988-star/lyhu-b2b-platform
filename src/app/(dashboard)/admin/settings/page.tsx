"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

interface BankAccount {
    bankName: string;
    accountNumber: string;
    accountName: string;
    branch: string;
}

interface CompanyInfo {
    name: string;
    address: string;
    hotline: string;
    email: string;
    website: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
}

export default function AdminSettingsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
        name: "",
        address: "",
        hotline: "",
        email: "",
        website: "",
        facebook: "",
        tiktok: "",
        youtube: ""
    });

    const [bankInfo, setBankInfo] = useState<BankAccount[]>([]);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            if (res.ok) {
                const data = await res.json();
                if (data.company_info) setCompanyInfo(data.company_info);
                if (data.bank_info) setBankInfo(data.bank_info);
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
            toast.error("Lỗi tải cấu hình hệ thống");
        } finally {
            setIsFetching(false);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_info: companyInfo,
                    bank_info: bankInfo
                })
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success("Đã lưu cài đặt hệ thống");
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Lỗi khi lưu cài đặt");
        } finally {
            setIsLoading(false);
        }
    };

    const addBankAccount = () => {
        setBankInfo([...bankInfo, { bankName: "", accountNumber: "", accountName: "", branch: "" }]);
    };

    const removeBankAccount = (index: number) => {
        setBankInfo(bankInfo.filter((_, i) => i !== index));
    };

    const updateBank = (index: number, field: keyof BankAccount, value: string) => {
        const newBanks = [...bankInfo];
        newBanks[index] = { ...newBanks[index], [field]: value };
        setBankInfo(newBanks);
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Cài đặt hệ thống</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Cấu hình thông tin doanh nghiệp và tài khoản nhận thanh toán
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Company Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Thông tin Công ty</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tên Công ty (hiển thị trên phiếu)</label>
                            <input
                                value={companyInfo.name}
                                onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="CÔNG TY TNHH ABC"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                            <input
                                value={companyInfo.address}
                                onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Hotline</label>
                                <input
                                    value={companyInfo.hotline}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, hotline: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    value={companyInfo.email}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                            <input
                                value={companyInfo.website}
                                onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Link Facebook</label>
                                <input
                                    value={companyInfo.facebook || ""}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, facebook: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="https://facebook.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Link TikTok</label>
                                <input
                                    value={companyInfo.tiktok || ""}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, tiktok: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="https://tiktok.com/@..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Link Youtube</label>
                                <input
                                    value={companyInfo.youtube || ""}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, youtube: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="https://youtube.com/..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bank Accounts */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-lg font-semibold text-slate-800">Tài khoản Ngân hàng</h2>
                        <button
                            onClick={addBankAccount}
                            className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 font-medium"
                        >
                            <Plus className="w-3 h-3" /> Thêm TK
                        </button>
                    </div>

                    <div className="space-y-6">
                        {bankInfo.map((bank, index) => (
                            <div key={index} className="bg-slate-50 p-4 rounded-lg relative group border border-slate-200">
                                <button
                                    onClick={() => removeBankAccount(index)}
                                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Xóa tài khoản"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Tên Ngân hàng</label>
                                        <input
                                            value={bank.bankName}
                                            onChange={(e) => updateBank(index, 'bankName', e.target.value)}
                                            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                                            placeholder="VD: Vietcombank"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Số Tài Khoản</label>
                                            <input
                                                value={bank.accountNumber}
                                                onChange={(e) => updateBank(index, 'accountNumber', e.target.value)}
                                                className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm font-mono font-bold text-slate-700"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Chủ Tài Khoản</label>
                                            <input
                                                value={bank.accountName}
                                                onChange={(e) => updateBank(index, 'accountName', e.target.value)}
                                                className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Chi nhánh</label>
                                        <input
                                            value={bank.branch}
                                            onChange={(e) => updateBank(index, 'branch', e.target.value)}
                                            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                                            placeholder="CN TP.HCM"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {bankInfo.length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                                Chưa có tài khoản nào
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Lưu thay đổi
                </button>
            </div>
        </div>
    );
}
