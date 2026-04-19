"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/auth/AuthProvider';
import { Image as ImageIcon, Layout, Tag, Link, Trash2, Edit2, Upload, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface WholesaleBanner {
    id: string;
    image_url: string;
    link_url?: string;
    position: 'main_slider' | 'side_top' | 'side_bottom' | 'popup';
    sort_order: number;
    is_active: boolean;
}

export default function B2bCampaignsPage() {
    const supabase = getSupabase();
    const { session } = useAuth();
    const [activeTab, setActiveTab] = useState<'banners' | 'promotions'>('banners');

    // Banners state
    const [banners, setBanners] = useState<WholesaleBanner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // New Banner Form
    const [newBanner, setNewBanner] = useState<Partial<WholesaleBanner>>({ position: 'main_slider', sort_order: 1, is_active: true });
    
    // Promotions state
    const [promotions, setPromotions] = useState<any[]>([]);
    const [isLoadingPromos, setIsLoadingPromos] = useState(false);
    const [newPromo, setNewPromo] = useState({ name: '', discount: 15, minQty: 10 });

    // Fetch Banners
    const fetchBanners = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('wholesale_banners').select('*').order('sort_order', { ascending: true });
        if (error) {
            toast.error("Lỗi khi tải Banners: " + error.message);
        } else {
            setBanners(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    // High-Productivity Upload Pattern (Clipboard / Drag&Drop)
    const handleUpload = useCallback(async (file: File) => {
        try {
            setIsUploading(true);
            const ext = file.name.split('.').pop();
            const fileName = `b2b_banner_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
            
            const { error: uploadError } = await supabase.storage.from('media').upload(`banners/${fileName}`, file, { cacheControl: '3600', upsert: false });
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('media').getPublicUrl(`banners/${fileName}`);
            
            setNewBanner(prev => ({ ...prev, image_url: data.publicUrl }));
            toast.success("Tải ảnh lên thành công! Bấm Lưu để tạo Banner.");
        } catch (err: any) {
            toast.error("Lỗi tải ảnh: " + err.message);
        } finally {
            setIsUploading(false);
        }
    }, []);

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) handleUpload(file);
                break;
            }
        }
    };

    const handleSaveBanner = async () => {
        if (!newBanner.image_url) return toast.warning("Bạn cần tải ảnh lên trước!");
        
        const payload = {
            image_url: newBanner.image_url,
            position: newBanner.position,
            link_url: newBanner.link_url || null,
            sort_order: newBanner.sort_order || 0,
            is_active: newBanner.is_active
        };

        const { error } = await supabase.from('wholesale_banners').insert(payload);
        if (error) {
            toast.error("Lỗi lưu banner: " + error.message);
        } else {
            toast.success("Đã thêm Banner mới!");
            setNewBanner({ position: 'main_slider', sort_order: 1, is_active: true }); // reset
            fetchBanners();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Xóa banner này?")) return;
        const { error } = await supabase.from('wholesale_banners').delete().eq('id', id);
        if (!error) {
            toast.success("Đã xóa banner", { duration: 1500 });
            setBanners(prev => prev.filter(b => b.id !== id));
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase.from('wholesale_banners').update({ is_active: !currentStatus }).eq('id', id);
        if (!error) {
            setBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
        }
    };

    // --- PROMOTIONS LOGIC ---
    const fetchPromotions = async () => {
        setIsLoadingPromos(true);
        const { data, error } = await supabase
            .from('wholesale_promotions')
            .select(`
                *,
                conditions:wholesale_promotion_conditions(*),
                actions:wholesale_promotion_actions(*)
            `)
            .order('created_at', { ascending: false });
        
        if (error) toast.error("Lỗi tải khuyến mãi: " + error.message);
        else setPromotions(data || []);
        setIsLoadingPromos(false);
    };

    useEffect(() => {
        if (activeTab === 'promotions') fetchPromotions();
    }, [activeTab]);

    const handleSavePromo = async () => {
        if (!newPromo.name) return toast.warning("Vui lòng nhập tên chương trình");
        
        // 1. Create Promotion
        const { data: promo, error: promoErr } = await supabase.from('wholesale_promotions').insert({
            name: newPromo.name,
            description: `Giảm ${newPromo.discount}% cho đơn từ ${newPromo.minQty} sản phẩm`,
            is_active: true,
            priority: 10
        }).select().single();

        if (promoErr) return toast.error(promoErr.message);

        // 2. Create Condition (min_cart_qty)
        await supabase.from('wholesale_promotion_conditions').insert({
            promotion_id: promo.id,
            condition_type: 'min_cart_qty',
            required_value: newPromo.minQty
        });

        // 3. Create Action (discount_percent)
        await supabase.from('wholesale_promotion_actions').insert({
            promotion_id: promo.id,
            action_type: 'discount_percent',
            reward_value: newPromo.discount
        });

        toast.success("✅ Đã tạo chương trình chiết khấu!");
        setNewPromo({ name: '', discount: 15, minQty: 10 });
        fetchPromotions();
    };

    const handleTogglePromo = async (id: string, status: boolean) => {
        const { error } = await supabase.from('wholesale_promotions').update({ is_active: !status }).eq('id', id);
        if (!error) setPromotions(prev => prev.map(p => p.id === id ? { ...p, is_active: !status } : p));
    };

    const handleDeletePromo = async (id: string) => {
        if (!confirm("Chắc chắn xóa chương trình này?")) return;
        const { error } = await supabase.from('wholesale_promotions').delete().eq('id', id);
        if (!error) {
            toast.success("Đã xóa");
            setPromotions(prev => prev.filter(p => p.id !== id));
        }
    };

    return (
        <div className="p-6 space-y-6 flex-1 bg-slate-50 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Layout className="w-6 h-6 text-primary-600" />
                        Quản lý Chiến dịch Sỉ (B2B)
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Thiết lập Banners, Khuyến mãi và Flash Sale hiển thị tại lyhu.vn/wholesale</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white p-1 rounded-md border border-slate-200 w-fit">
                <button onClick={() => setActiveTab('banners')} className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === 'banners' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>Banners Shopee-Style</button>
                <button onClick={() => setActiveTab('promotions')} className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === 'promotions' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>Khuyến mãi & Flash Sale</button>
            </div>

            {activeTab === 'banners' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Component */}
                    <div className="col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 h-fit">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><Layout className="w-5 h-5 text-slate-400" /> Thêm Banner Mới</h3>
                        
                        <div 
                            className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 relative focus-within:ring-2 focus-within:ring-primary-500 transition-colors"
                            onPaste={handlePaste}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]); }}
                        >
                            {isUploading ? (
                                <div className="flex flex-col items-center text-primary-600"><Loader2 className="w-8 h-8 animate-spin mb-2" /><span>Đang tải...</span></div>
                            ) : newBanner.image_url ? (
                                <div className="relative w-full aspect-video rounded overflow-hidden shadow-sm group">
                                    <img src={newBanner.image_url} alt="Preview" className="w-full h-full object-cover" />
                                    <button onClick={() => setNewBanner(p => ({...p, image_url: undefined}))} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                                        <Upload className="w-6 h-6 text-primary-500" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-700">Kéo thả ảnh vào đây</p>
                                    <p className="text-xs text-slate-500 mt-1">hoặc <kbd className="bg-white border rounded px-1 text-slate-700 font-mono">Ctrl + V</kbd></p>
                                    <label className="mt-4 px-4 py-2 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded text-sm font-medium cursor-pointer transition-colors">
                                        Chọn từ máy tính
                                        <input type="file" className="hidden" accept="image/*" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
                                    </label>
                                </>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Vị trí hiển thị</label>
                                <select 
                                    className="w-full mt-1 border border-slate-300 rounded-md py-2 px-3 text-sm outline-none focus:border-primary-500"
                                    value={newBanner.position}
                                    onChange={e => setNewBanner(p => ({...p, position: e.target.value as any}))}
                                >
                                    <option value="main_slider">Slider Trượt Chính (Tỷ lệ 2/3)</option>
                                    <option value="side_top">Banner Cố Định - Góc Trên (Tỷ lệ 1/3)</option>
                                    <option value="side_bottom">Banner Cố Định - Góc Dưới (Tỷ lệ 1/3)</option>
                                    <option value="popup">Popup Banner (Hiển thị khi vào trang)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Link truy cập (Tuỳ chọn)</label>
                                <input 
                                    type="text" 
                                    placeholder="VD: /wholesale?brand=abi hoặc #flash-sale"
                                    className="w-full mt-1 border border-slate-300 rounded-md py-2 px-3 text-sm outline-none focus:border-primary-500 placeholder:text-slate-400"
                                    value={newBanner.link_url || ''}
                                    onChange={e => setNewBanner(p => ({...p, link_url: e.target.value}))}
                                />
                            </div>
                            <button 
                                onClick={handleSaveBanner}
                                disabled={isUploading || !newBanner.image_url}
                                className="w-full bg-primary-600 text-white font-medium py-2.5 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                            >
                                <Save className="w-4 h-4" /> Lưu Banner
                            </button>
                        </div>
                    </div>

                    {/* Preview Component */}
                    <div className="col-span-2 space-y-4">
                        {isLoading ? (
                            <div className="h-40 flex items-center justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
                        ) : (
                            <>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-slate-400" /> Banners Đang Hiển Thị</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {banners.map(banner => (
                                        <div key={banner.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm flex flex-col group">
                                            <div className="relative aspect-video bg-slate-100">
                                                <img src={banner.image_url} className={`w-full h-full object-cover transition-opacity ${!banner.is_active ? 'opacity-40 grayscale' : ''}`} />
                                                <div className="absolute top-2 right-2 flex gap-1">
                                                    <button onClick={() => handleDelete(banner.id)} className="bg-red-500 text-white hover:bg-red-600 rounded p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider backdrop-blur-sm">
                                                    {banner.position === 'main_slider' ? 'SLIDER CHÍNH' : banner.position === 'side_top' ? 'GÓC TRÊN' : banner.position === 'popup' ? 'POPUP' : 'GÓC DƯỚI'}
                                                </span>
                                            </div>
                                            <div className="p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs text-slate-500 truncate max-w-[120px]">
                                                    <Link className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="truncate">{banner.link_url || 'Không có link'}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <button 
                                                        onClick={() => handleToggleActive(banner.id, banner.is_active)}
                                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${banner.is_active ? 'bg-primary-600' : 'bg-slate-300'}`}
                                                    >
                                                        <span className="sr-only">Toggle</span>
                                                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${banner.is_active ? 'translate-x-2' : '-translate-x-2'}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'promotions' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Add Promo Form */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><Tag className="w-5 h-5 text-slate-400" /> Tạo Chiết Khấu Mới</h3>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Tên chương trình</label>
                            <input type="text" value={newPromo.name} onChange={e => setNewPromo(p => ({...p, name: e.target.value}))} placeholder="VD: Siêu Sale Tháng 5" className="w-full mt-1 border border-slate-300 rounded-md py-2 px-3 text-sm outline-none focus:border-primary-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">SL tối thiểu</label>
                                <input type="number" value={newPromo.minQty} onChange={e => setNewPromo(p => ({...p, minQty: Number(e.target.value)}))} className="w-full mt-1 border border-slate-300 rounded-md py-2 px-3 text-sm outline-none focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">% Chiết khấu</label>
                                <input type="number" value={newPromo.discount} onChange={e => setNewPromo(p => ({...p, discount: Number(e.target.value)}))} className="w-full mt-1 border border-slate-300 rounded-md py-2 px-3 text-sm outline-none focus:border-primary-500" />
                            </div>
                        </div>
                        <button onClick={handleSavePromo} className="w-full bg-primary-600 text-white font-medium py-2.5 rounded-md hover:bg-primary-700 flex items-center justify-center gap-2 mt-2 transition-colors">
                            <Save className="w-4 h-4" /> Lưu Khuyến Mãi
                        </button>
                    </div>

                    {/* Promos List */}
                    <div className="col-span-2 space-y-4">
                        {isLoadingPromos ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                        ) : promotions.length === 0 ? (
                            <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-slate-400">
                                <Tag className="w-16 h-16 opacity-30 mb-4" />
                                <p>Chưa có chương trình nào.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {promotions.map(promo => {
                                    const cond = promo.conditions?.[0];
                                    const action = promo.actions?.[0];
                                    return (
                                        <div key={promo.id} className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between shadow-sm">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className={`font-bold text-lg ${promo.is_active ? 'text-primary-700' : 'text-slate-500'}`}>{promo.name}</h4>
                                                    {!promo.is_active && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold uppercase">Đã tắt</span>}
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    Đơn từ <span className="font-bold text-slate-900">{cond?.required_value || 0} sản phẩm</span> 
                                                    {' -> '} Giảm <span className="font-bold text-red-500">{action?.reward_value || 0}%</span>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => handleTogglePromo(promo.id, promo.is_active)}
                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${promo.is_active ? 'bg-primary-600' : 'bg-slate-300'}`}
                                                >
                                                    <span className="sr-only">Toggle</span>
                                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${promo.is_active ? 'translate-x-2' : '-translate-x-2'}`} />
                                                </button>
                                                <button onClick={() => handleDeletePromo(promo.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1"><Trash2 className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
