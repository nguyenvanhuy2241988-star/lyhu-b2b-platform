"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { User, Mail, Shield, Calendar, Phone, MapPin, Camera, Edit2, Users, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
    const { user, role } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [colleagues, setColleagues] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profileData);

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
    }, [user?.id]);

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user, fetchData]);

    const filteredColleagues = colleagues.filter(c =>
        c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setIsUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }
            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload image to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                throw uploadError;
            }

            // 2. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) {
                throw updateError;
            }

            setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
            toast.success('Cập nhật ảnh đại diện thành công!');
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            toast.error('Lỗi khi tải ảnh lên: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const joinDate = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
        : "Chưa rõ";

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Banner */}
            <div className="relative h-40 rounded-2xl bg-gradient-to-r from-primary/90 to-primary-600 shadow-sm mb-8">
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>
                <div className="absolute -bottom-12 left-6 flex items-end gap-5 z-10">
                    <div className="relative group">
                        <div className="w-28 h-28 rounded-2xl bg-white p-1 shadow-lg">
                            <div className="w-full h-full rounded-[0.85rem] bg-slate-100 flex items-center justify-center overflow-hidden">
                                {profile?.avatar_url ? (
                                    <Image src={profile.avatar_url} alt="Avatar" width={112} height={112} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-slate-300" />
                                )}
                            </div>
                        </div>
                        <label className={`absolute bottom-1 right-1 p-1.5 bg-white rounded-lg shadow-md transition-colors border border-slate-100 z-20 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer'}`}>
                            {isUploading ? <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" /> : <Camera className="w-3.5 h-3.5 text-primary" />}
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleAvatarUpload}
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                    <div className="pb-14">
                        <h2 className="text-2xl font-bold text-white drop-shadow-sm">{profile?.full_name || user?.email}</h2>
                        <p className="text-white/90 flex items-center gap-1.5 mt-0.5 drop-shadow-sm">
                            <Shield className="w-3.5 h-3.5" />
                            <span className="uppercase tracking-wider text-xs font-medium">{profile?.role || "Thành viên"}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                {/* Left: Personal Info */}
                <div className="lg:col-span-1 space-y-5">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-slate-800 text-sm">Thông tin cá nhân</h3>
                            <button className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-primary">
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {[
                                { icon: Mail, label: "Email", value: user?.email, color: "primary" },
                                { icon: Phone, label: "Số điện thoại", value: profile?.phone || "Chưa cập nhật", color: "primary" },
                                { icon: MapPin, label: "Địa chỉ", value: profile?.address || "Việt Nam", color: "primary" },
                                { icon: Calendar, label: "Ngày tham gia", value: joinDate, color: "primary" },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-center gap-3 group">
                                    <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary transition-colors">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                                        <p className="text-sm font-medium text-slate-700 truncate">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Member Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary rounded-l-2xl"></div>
                        <div className="relative z-10 pl-2">
                            <h3 className="font-bold text-sm text-slate-800 mb-1">Thẻ thành viên LYHU</h3>
                            <p className="text-[11px] text-slate-500 mb-5">Mã {role === 'customer' ? 'khách hàng' : 'nhân viên'}: LH-{user?.id?.slice(0, 8).toUpperCase()}</p>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Tên hiển thị</p>
                                    <p className="font-mono text-base font-semibold text-slate-800 mt-0.5">{profile?.full_name?.toUpperCase() || "NEW USER"}</p>
                                </div>
                                <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center border border-primary-100">
                                    <Shield className="w-4 h-4 text-primary" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                    </div>
                </div>

                {/* Right: Colleagues */}
                {role !== 'customer' && (
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 h-full">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                        <Users className="w-4 h-4 text-primary" />
                                        Đội ngũ đồng nghiệp
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Kết nối và trò chuyện với mọi người trong hệ thống</p>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary w-44 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {filteredColleagues.length > 0 ? filteredColleagues.map((col: any) => (
                                    <div key={col.id} className="group p-3 rounded-xl border border-slate-100 hover:border-primary-100 hover:bg-primary-50/30 transition-all flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                            {col.avatar_url ? (
                                                <Image src={col.avatar_url} alt={col.full_name} width={40} height={40} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-slate-400 font-bold uppercase text-sm">{col.full_name?.charAt(0) || col.email?.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">{col.full_name || col.email}</p>
                                            <p className="text-[11px] font-medium text-primary uppercase tracking-tight">{col.role || "Thành viên"}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-2 py-10 text-center text-slate-400 text-sm">
                                        Không tìm thấy đồng nghiệp nào.
                                    </div>
                                )}
                            </div>

                            {colleagues.length > 0 && (
                                <button className="w-full mt-5 py-2.5 text-sm font-medium text-slate-500 hover:text-primary hover:bg-primary-50 rounded-xl transition-all border border-dashed border-slate-200 hover:border-primary-200">
                                    Xem tất cả thành viên
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
