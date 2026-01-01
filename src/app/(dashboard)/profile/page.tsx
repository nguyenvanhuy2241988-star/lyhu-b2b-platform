"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { User, Mail, Shield, Calendar, Phone, MapPin, Camera, Edit2, Users, Search } from "lucide-react";

export default function ProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [colleagues, setColleagues] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch current user profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(profileData);

                // Fetch colleagues
                const { data: colleaguesData } = await supabase
                    .from('profiles')
                    .select('id, full_name, role, email, avatar_url')
                    .neq('id', user.id)
                    .limit(20);
                setColleagues(colleaguesData || []);
            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const filteredColleagues = colleagues.filter(c =>
        c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="relative h-48 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 overflow-hidden shadow-lg">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="absolute -bottom-16 left-8 flex items-end gap-6">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-3xl bg-white p-1 shadow-xl">
                            <div className="w-full h-full rounded-[1.4rem] bg-slate-100 flex items-center justify-center overflow-hidden">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-16 h-16 text-slate-300" />
                                )}
                            </div>
                        </div>
                        <button className="absolute bottom-2 right-2 p-2 bg-white rounded-xl shadow-lg hover:bg-slate-50 transition-colors border border-slate-100">
                            <Camera className="w-4 h-4 text-blue-600" />
                        </button>
                    </div>
                    <div className="pb-20">
                        <h1 className="text-3xl font-bold text-white tracking-tight">{profile?.full_name || user?.email}</h1>
                        <p className="text-blue-100 font-medium flex items-center gap-2 mt-1">
                            <Shield className="w-4 h-4" />
                            <span className="uppercase tracking-wider text-xs">{profile?.role || "Thành viên"}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
                {/* Left Column: Personal Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-900">Thông tin cá nhân</h3>
                            <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-blue-600">
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 group">
                                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</p>
                                    <p className="text-sm font-medium text-slate-700 truncate">{user?.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group">
                                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Số điện thoại</p>
                                    <p className="text-sm font-medium text-slate-700">{profile?.phone || "Chưa cập nhật"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group">
                                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Địa chỉ</p>
                                    <p className="text-sm font-medium text-slate-700">{profile?.address || "Việt Nam"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group">
                                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ngày tham gia</p>
                                    <p className="text-sm font-medium text-slate-700">Tháng 12, 2025</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-lg overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="font-bold mb-2">Thẻ thành viên LYHU</h3>
                            <p className="text-xs text-slate-400 mb-6">Mã nhân viên: LH-{user?.id?.slice(0, 8).toUpperCase()}</p>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Tên hiển thị</p>
                                    <p className="font-mono text-lg">{profile?.full_name?.toUpperCase() || "NEW USER"}</p>
                                </div>
                                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md">
                                    <Shield className="w-6 h-6 text-blue-400" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
                    </div>
                </div>

                {/* Right Column: Colleagues / Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    Đội ngũ đồng nghiệp
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Kết nối và trò chuyện với mọi người trong hệ thống</p>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 w-48 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredColleagues.length > 0 ? filteredColleagues.map((col: any) => (
                                <div key={col.id} className="group p-4 rounded-2xl border border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                                        {col.avatar_url ? (
                                            <img src={col.avatar_url} alt={col.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-slate-400 font-bold uppercase text-lg">{col.full_name?.charAt(0) || col.email?.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate">{col.full_name || col.email}</p>
                                        <p className="text-[11px] font-medium text-blue-600 uppercase tracking-tight">{col.role || "Thành viên"}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-2 py-12 text-center text-slate-400">
                                    Không tìm thấy đồng nghiệp nào.
                                </div>
                            )}
                        </div>

                        {colleagues.length > 0 && (
                            <button className="w-full mt-6 py-3 text-sm font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-dashed border-slate-200 hover:border-blue-200">
                                Xem tất cả thành viên
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
