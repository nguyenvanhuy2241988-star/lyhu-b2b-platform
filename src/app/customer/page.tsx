"use client";

import { ShoppingBag, ShoppingCart, FileText, User, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CustomerDashboard() {
    const { user: authUser } = useAuth();
    
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ text: "", type: "" });

    useEffect(() => {
        if (authUser) {
            // Note: AuthProvider spreads user_metadata directly into authUser
            setName(authUser.full_name || authUser.customerName || "");
            setPhone(authUser.phone || authUser.customerPhone || "");
            setAddress(authUser.address || "");
        }
    }, [authUser]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveMessage({ text: "", type: "" });

        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: name,
                    customerName: name,
                    phone: phone,
                    customerPhone: phone,
                    address: address
                }
            });

            if (error) throw error;
            
            setSaveMessage({ text: "Đã lưu thông tin thành công!", type: "success" });
            setTimeout(() => setSaveMessage({ text: "", type: "" }), 3000);
        } catch (err: any) {
            console.error("Lỗi khi lưu profile:", err);
            setSaveMessage({ text: "Có lỗi xảy ra: " + err.message, type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Tổng quan Khách hàng</h1>
                <p className="text-slate-500">Chào mừng bạn quay trở lại!</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                <Link href="/customer/catalogue" className="block group">
                    <div className="p-3.5 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-[#00AFA9] transition-colors h-full flex flex-col items-center sm:items-start text-center sm:text-left">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-2 sm:mb-3 text-[#00AFA9]">
                            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs sm:text-base">Mua sỉ</h3>
                        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 hidden sm:block">Xem danh mục & đặt hàng</p>
                    </div>
                </Link>

                <Link href="/customer/cart" className="block group">
                    <div className="p-3.5 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-[#00AFA9] transition-colors h-full flex flex-col items-center sm:items-start text-center sm:text-left">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-lime-50 rounded-xl flex items-center justify-center mb-2 sm:mb-3 text-[#7eb336]">
                            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs sm:text-base">Giỏ hàng</h3>
                        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 hidden sm:block">Kiểm tra sản phẩm đã chọn</p>
                    </div>
                </Link>

                <Link href="/customer/orders" className="block group">
                    <div className="p-3.5 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-[#00AFA9] transition-colors h-full flex flex-col items-center sm:items-start text-center sm:text-left">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-2 sm:mb-3 text-slate-700">
                            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs sm:text-base">Đơn hàng</h3>
                        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 hidden sm:block">Theo dõi trạng thái đơn</p>
                    </div>
                </Link>
            </div>

            {/* Thông tin cá nhân */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#00AFA9]" />
                    <h2 className="font-bold text-slate-800 text-sm sm:text-base">Thông tin nhận hàng mặc định</h2>
                </div>
                <div className="p-5 sm:p-6">
                    <p className="text-xs sm:text-sm text-slate-500 mb-6">
                        Lưu sẵn thông tin giao hàng để hệ thống tự động điền giúp bạn trong các lần mua hàng tiếp theo.
                    </p>

                    <form onSubmit={handleSaveProfile} className="max-w-2xl space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Họ và Tên</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:border-[#00AFA9] outline-none"
                                    placeholder="Nhập họ tên người nhận"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:border-[#00AFA9] outline-none"
                                    placeholder="Nhập SĐT nhận hàng"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Địa chỉ giao hàng</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:border-[#00AFA9] outline-none"
                                placeholder="Nhập địa chỉ nhận hàng chi tiết"
                            />
                        </div>

                        <div className="pt-2 flex items-center gap-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="bg-[#00AFA9] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#009893] transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Lưu thông tin
                            </button>
                            
                            {saveMessage.text && (
                                <span className={`text-xs sm:text-sm font-semibold ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                    {saveMessage.text}
                                </span>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
