"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/auth/AuthProvider';
import { Image as ImageIcon, Layout, Tag, Link, Trash2, Edit2, Upload, Loader2, Save, Zap, Gift, Clock, AlertCircle, Plus } from 'lucide-react';
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

    // --- BANNERS STATE ---
    const [banners, setBanners] = useState<WholesaleBanner[]>([]);
    const [isLoadingBanners, setIsLoadingBanners] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [newBanner, setNewBanner] = useState<Partial<WholesaleBanner>>({ position: 'main_slider', sort_order: 1, is_active: true });
    
    const fetchBanners = async () => {
        setIsLoadingBanners(true);
        const { data, error } = await supabase.from('wholesale_banners').select('*').order('sort_order', { ascending: true });
        if (error) toast.error("Lỗi khi tải Banners: " + error.message);
        else setBanners(data || []);
        setIsLoadingBanners(false);
    };

    // --- PRODUCTS FOR PROMOTIONS/FLASH SALES ---
    const [products, setProducts] = useState<any[]>([]);
    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('id, name, sku, price').order('name');
        if (data) setProducts(data);
    };

    useEffect(() => {
        fetchBanners();
        fetchProducts(); // Load once for all dropdowns
    }, []);

    // --- BANNER HANDLERS ---
    const handleUpload = useCallback(async (file: File) => {
        try {
            setIsUploading(true);
            const ext = file.name.split('.').pop();
            const fileName = `b2b_banner_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
            const { error: uploadError } = await supabase.storage.from('media').upload(`banners/${fileName}`, file);
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
        const { error } = await supabase.from('wholesale_banners').insert(newBanner);
        if (error) toast.error("Lỗi lưu banner: " + error.message);
        else {
            toast.success("Đã thêm Banner mới!");
            setNewBanner({ position: 'main_slider', sort_order: 1, is_active: true });
            fetchBanners();
        }
    };

    const handleDeleteBanner = async (id: string) => {
        if (!confirm("Xóa banner này?")) return;
        const { error } = await supabase.from('wholesale_banners').delete().eq('id', id);
        if (!error) {
            toast.success("Đã xóa banner");
            setBanners(prev => prev.filter(b => b.id !== id));
        }
    };

    const handleToggleBanner = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase.from('wholesale_banners').update({ is_active: !currentStatus }).eq('id', id);
        if (!error) setBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
    };

    // ==========================================
    // --- ADVANCED PROMOTIONS & FLASH SALES ---
    // ==========================================
    const [promoTab, setPromoTab] = useState<'promos' | 'flash'>('promos');

    // --- Promotions State ---
    const [promotions, setPromotions] = useState<any[]>([]);
    const [isLoadingPromos, setIsLoadingPromos] = useState(false);
    const [newPromo, setNewPromo] = useState({
        name: '', description: '', priority: 1,
        conditionType: 'min_cart_qty', requiredValue: 1, targetProducts: [] as string[],
        actionType: 'discount_percent', rewardValue: 10, rewardProduct: ''
    });

    const fetchPromotions = async () => {
        setIsLoadingPromos(true);
        const { data, error } = await supabase.from('wholesale_promotions').select(`
            *, conditions:wholesale_promotion_conditions(*), actions:wholesale_promotion_actions(*)
        `).order('priority', { ascending: false });
        if (error) toast.error("Lỗi tải khuyến mãi: " + error.message);
        else setPromotions(data || []);
        setIsLoadingPromos(false);
    };

    useEffect(() => { if (activeTab === 'promotions' && promoTab === 'promos') fetchPromotions(); }, [activeTab, promoTab]);

    const handleSavePromo = async () => {
        if (!newPromo.name) return toast.warning("Nhập tên chương trình");
        if (newPromo.actionType === 'free_items' && !newPromo.rewardProduct) return toast.warning("Chọn SP tặng");

        // 1. Create Promotion
        const { data: promo, error: promoErr } = await supabase.from('wholesale_promotions').insert({
            name: newPromo.name, description: newPromo.description, is_active: true, priority: newPromo.priority
        }).select().single();
        if (promoErr) return toast.error(promoErr.message);

        // 2. Condition
        await supabase.from('wholesale_promotion_conditions').insert({
            promotion_id: promo.id,
            condition_type: newPromo.conditionType,
            required_value: newPromo.requiredValue,
            target_product_ids: newPromo.targetProducts.length > 0 ? newPromo.targetProducts : []
        });

        // 3. Action
        await supabase.from('wholesale_promotion_actions').insert({
            promotion_id: promo.id,
            action_type: newPromo.actionType,
            reward_value: newPromo.rewardValue,
            reward_product_id: newPromo.actionType === 'free_items' ? newPromo.rewardProduct : null
        });

        toast.success("✅ Đã tạo chương trình KM!");
        setNewPromo({ ...newPromo, name: '', description: '' });
        fetchPromotions();
    };

    const handleDeletePromo = async (id: string) => {
        if (!confirm("Xóa chương trình này?")) return;
        const { error } = await supabase.from('wholesale_promotions').delete().eq('id', id);
        if (!error) { toast.success("Đã xóa"); fetchPromotions(); }
    };
    const handleTogglePromo = async (id: string, status: boolean) => {
        const { error } = await supabase.from('wholesale_promotions').update({ is_active: !status }).eq('id', id);
        if (!error) fetchPromotions();
    };

    // --- Flash Sales State ---
    const [flashSales, setFlashSales] = useState<any[]>([]);
    const [isLoadingFlash, setIsLoadingFlash] = useState(false);
    const [newFlashSale, setNewFlashSale] = useState({ name: '', startTime: '', endTime: '' });
    
    // Items management inside Flash Sale
    const [activeFS, setActiveFS] = useState<any>(null); // expanded flash sale to manage items
    const [fsItems, setFsItems] = useState<any[]>([]);
    const [newFsItem, setNewFsItem] = useState({ productIds: [] as string[], discountPrice: 0, qtyLimit: 100 });

    const fetchFlashSales = async () => {
        setIsLoadingFlash(true);
        const { data, error } = await supabase.from('wholesale_flash_sales').select('*').order('start_time', { ascending: false });
        if (error) toast.error("Lỗi FS: " + error.message);
        else setFlashSales(data || []);
        setIsLoadingFlash(false);
    };

    useEffect(() => { if (activeTab === 'promotions' && promoTab === 'flash') fetchFlashSales(); }, [activeTab, promoTab]);

    const handleSaveFlashSale = async () => {
        if (!newFlashSale.name || !newFlashSale.startTime || !newFlashSale.endTime) return toast.warning("Điền đủ thông tin FS");
        const { error } = await supabase.from('wholesale_flash_sales').insert({
            name: newFlashSale.name, start_time: new Date(newFlashSale.startTime).toISOString(), end_time: new Date(newFlashSale.endTime).toISOString(), is_active: true
        });
        if (error) return toast.error(error.message);
        toast.success("Tạo Flash Sale thành công");
        setNewFlashSale({ name: '', startTime: '', endTime: '' });
        fetchFlashSales();
    };

    const handleToggleFlashSale = async (id: string, status: boolean) => {
        await supabase.from('wholesale_flash_sales').update({ is_active: !status }).eq('id', id);
        fetchFlashSales();
    };
    const handleDeleteFlashSale = async (id: string) => {
        if (!confirm("Xóa Flash Sale này?")) return;
        await supabase.from('wholesale_flash_sales').delete().eq('id', id);
        fetchFlashSales();
    };

    // Manage FS Items
    const openFsItems = async (fs: any) => {
        setActiveFS(fs);
        const { data } = await supabase.from('wholesale_flash_sale_items').select('*, product:products(name, sku)').eq('flash_sale_id', fs.id);
        setFsItems(data || []);
    };
    const handleAddFsItem = async () => {
        if (newFsItem.productIds.length === 0 || !newFsItem.discountPrice) return toast.warning("Chọn SP và nhập giá Flash Sale!");
        
        const itemsToInsert = newFsItem.productIds.map(pid => ({
            flash_sale_id: activeFS.id,
            product_id: pid,
            discount_price: newFsItem.discountPrice,
            quantity_limit: newFsItem.qtyLimit
        }));

        const { error } = await supabase.from('wholesale_flash_sale_items').insert(itemsToInsert);
        if (error) return toast.error("Lỗi: " + error.message);
        toast.success("Đã thêm danh sách SP vào FS");
        setNewFsItem({ productIds: [], discountPrice: 0, qtyLimit: 100 });
        openFsItems(activeFS); // refresh
    };
    const handleDeleteFsItem = async (id: string) => {
        await supabase.from('wholesale_flash_sale_items').delete().eq('id', id);
        openFsItems(activeFS);
    };

    return (
        <div className="p-6 space-y-6 flex-1 bg-slate-50 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Layout className="w-6 h-6 text-primary-600" /> Quản lý Chiến dịch Sỉ (B2B)</h2>
                    <p className="text-slate-500 text-sm mt-1">Thiết lập Banners, Khuyến mãi và Flash Sale hiển thị tại lyhu.vn/wholesale</p>
                </div>
            </div>

            <div className="flex gap-2">
                <button onClick={() => setActiveTab('banners')} className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'banners' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>Banners Shopee-Style</button>
                <button onClick={() => setActiveTab('promotions')} className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'promotions' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>Khuyến mãi & Flash Sale</button>
            </div>

            {/* TAB: BANNERS (unchanged logically but UI re-rendered) */}
            {activeTab === 'banners' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-4" onPaste={handlePaste}>
                        <h3 className="font-bold text-slate-800 self-start mb-2 flex items-center gap-2"><Upload className="w-5 h-5 text-slate-400" /> Tạo Banner Mới</h3>
                        <div className="w-full relative group">
                            <input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors ${newBanner.image_url ? 'border-primary-300 bg-primary-50' : 'border-slate-300 hover:border-primary-400 bg-slate-50'}`}>
                                {isUploading ? <Loader2 className="w-8 h-8 text-primary-500 animate-spin" /> : newBanner.image_url ? <img src={newBanner.image_url} alt="Preview" className="max-h-32 object-contain rounded" /> : <><Upload className="w-8 h-8 text-slate-400 mb-2" /><p className="text-sm font-medium text-slate-600">Kéo thả ảnh hoặc Click</p><p className="text-xs text-slate-400 mt-1">(Hoặc Ctrl+V để dán trực tiếp)</p></>}
                            </div>
                        </div>
                        <div className="w-full space-y-3 mt-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Vị trí hiển thị</label>
                                <select value={newBanner.position} onChange={e => setNewBanner(p => ({...p, position: e.target.value as any}))} className="w-full mt-1 border border-slate-300 rounded-md py-2 px-3 text-sm focus:border-primary-500 outline-none">
                                    <option value="main_slider">Slider Trượt Chính (Tỷ lệ 2/3)</option>
                                    <option value="side_top">Banner Cố Định - Góc Trên (Tỷ lệ 1/3)</option>
                                    <option value="side_bottom">Banner Cố Định - Góc Dưới (Tỷ lệ 1/3)</option>
                                    <option value="popup">Popup Banner (Hiển thị khi vào trang)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Link URL (Tùy chọn)</label>
                                <input type="url" value={newBanner.link_url || ''} placeholder="https://" onChange={e => setNewBanner(p => ({...p, link_url: e.target.value}))} className="w-full mt-1 border border-slate-300 rounded-md py-2 px-3 text-sm outline-none focus:border-primary-500" />
                            </div>
                            <button onClick={handleSaveBanner} disabled={isUploading || !newBanner.image_url} className="w-full bg-primary-600 text-white font-medium py-2.5 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
                                <Save className="w-4 h-4" /> Lưu Banner
                            </button>
                        </div>
                    </div>
                    <div className="col-span-2 space-y-4">
                        {isLoadingBanners ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div> : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {banners.map(banner => (
                                    <div key={banner.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm flex flex-col group">
                                        <div className="relative aspect-video bg-slate-100">
                                            <img src={banner.image_url} className={`w-full h-full object-cover ${!banner.is_active ? 'opacity-40 grayscale' : ''}`} />
                                            <div className="absolute top-2 right-2 flex gap-1">
                                                <button onClick={() => handleDeleteBanner(banner.id)} className="bg-red-500 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5"/></button>
                                            </div>
                                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{banner.position}</span>
                                        </div>
                                        <div className="p-3 flex justify-between items-center bg-white border-t border-slate-100">
                                            <div className="flex items-center gap-2 text-xs text-slate-500 truncate max-w-[120px]"><Link className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{banner.link_url || 'Không link'}</span></div>
                                            <button onClick={() => handleToggleBanner(banner.id, banner.is_active)} className={`relative inline-flex h-5 w-9 rounded-full ${banner.is_active ? 'bg-primary-600' : 'bg-slate-300'}`}>
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${banner.is_active ? 'translate-x-4' : 'translate-x-1'}`} style={{marginTop: '2px'}}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: PROMOTIONS & FLASH SALES */}
            {activeTab === 'promotions' && (
                <div className="space-y-6">
                    <div className="flex border-b border-slate-200">
                        <button onClick={() => setPromoTab('promos')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${promoTab === 'promos' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Gift className="inline w-4 h-4 mr-2" /> Chương trình Khuyến Mãi</button>
                        <button onClick={() => setPromoTab('flash')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${promoTab === 'flash' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Zap className="inline w-4 h-4 mr-2" /> Flash Sale Giờ Vàng</button>
                    </div>

                    {/* === PROMOTIONS (CHIẾT KHẤU / TẶNG PHẨM) === */}
                    {promoTab === 'promos' && (
                        <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6">
                            {/* ADVANCED PROMO FORM */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Tag className="w-5 h-5 text-slate-400" /> Cấu hình Khuyến Mãi Mới</h3>
                                <div className="space-y-4">
                                    {/* Basics */}
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Tên CT</label>
                                        <input type="text" value={newPromo.name} onChange={e => setNewPromo(p => ({...p, name: e.target.value}))} placeholder="Vd: Mua 5 Tặng 1 Giờ Vàng" className="w-full mt-1 border border-slate-300 rounded-md py-2 px-3 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Mô tả hiển thị</label>
                                        <textarea value={newPromo.description} onChange={e => setNewPromo(p => ({...p, description: e.target.value}))} className="w-full mt-1 border border-slate-300 rounded-md py-2 px-3 text-sm min-h-[60px]" />
                                    </div>
                                    
                                    <div className="border-t border-slate-100 pt-4">
                                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block mb-3">1. ĐIỀU KIỆN ĐẠT ĐƯỢC (CONDITION)</span>
                                        <select value={newPromo.conditionType} onChange={e => setNewPromo(p => ({...p, conditionType: e.target.value}))} className="w-full border border-slate-300 rounded-md py-2 px-3 text-sm mb-3">
                                            <option value="min_cart_qty">Mua tối thiểu X sản phẩm (bất kỳ)</option>
                                            <option value="min_unique_items">Mua tối thiểu X mặt hàng khác nhau</option>
                                            <option value="specific_item_qty">Mua tối thiểu X sản phẩm CHỈ ĐỊNH</option>
                                        </select>
                                        
                                        {(newPromo.conditionType === 'specific_item_qty') && (
                                            <div className="mb-3">
                                                <label className="text-xs text-slate-500">Chọn SP Chỉ Định (bỏ trống để cảnh báo):</label>
                                                <select onChange={e => setNewPromo(p => ({...p, targetProducts: [e.target.value]}))} className="w-full border border-slate-300 rounded py-2 px-3 text-sm">
                                                    <option value="">-- Chọn 1 mặt hàng --</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-600">Với giá trị X là:</span>
                                            <input type="number" value={newPromo.requiredValue} onChange={e => setNewPromo(p => ({...p, requiredValue: Number(e.target.value)}))} className="w-24 border border-slate-300 rounded py-1 px-2 text-sm" />
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-4">
                                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block mb-3">2. ƯU ĐÃI NHẬN ĐƯỢC (ACTION)</span>
                                        <select value={newPromo.actionType} onChange={e => setNewPromo(p => ({...p, actionType: e.target.value}))} className="w-full border border-slate-300 rounded-md py-2 px-3 text-sm mb-3">
                                            <option value="discount_percent">Giảm % cho toàn bộ Đơn Hàng</option>
                                            <option value="free_items">Tặng X mặt hàng làm quà (Mua X Tặng Y)</option>
                                            <option value="override_price">Giảm thẳng tổng tiền (Tùy biến)</option>
                                        </select>
                                        
                                        {(newPromo.actionType === 'free_items') && (
                                            <div className="mb-3">
                                                <label className="text-xs text-slate-500">Chọn SP Quà Tặng:</label>
                                                <select value={newPromo.rewardProduct} onChange={e => setNewPromo(p => ({...p, rewardProduct: e.target.value}))} className="w-full border border-slate-300 rounded py-2 px-3 text-sm">
                                                    <option value="">-- Chọn --</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>[Có Hàng] {p.name}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-600">Giá trị Y (%, Quà, Tiền):</span>
                                            <input type="number" value={newPromo.rewardValue} onChange={e => setNewPromo(p => ({...p, rewardValue: Number(e.target.value)}))} className="w-full border border-slate-300 rounded py-1 px-2 text-sm" />
                                        </div>
                                    </div>

                                    <button onClick={handleSavePromo} className="w-full bg-primary-600 text-white font-medium py-3 rounded-md hover:bg-primary-700 mt-4 flex items-center justify-center gap-2">
                                        <Save className="w-4 h-4" /> Bắt đầu CT Khuyến Mãi này
                                    </button>
                                </div>
                            </div>

                            {/* Promos List */}
                            <div className="space-y-3">
                                {isLoadingPromos ? <Loader2 className="animate-spin text-slate-400 mx-auto" /> : promotions.map(promo => {
                                    const cond = promo.conditions?.[0];
                                    const action = promo.actions?.[0];
                                    return (
                                        <div key={promo.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className={`font-bold text-lg ${promo.is_active ? 'text-primary-700' : 'text-slate-400'}`}>{promo.name}</h4>
                                                    {!promo.is_active && <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Tạm Tắt</span>}
                                                </div>
                                                <p className="text-slate-600 text-sm mb-2">{promo.description}</p>
                                                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 bg-slate-50 p-2 rounded-lg inline-flex">
                                                    <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-blue-500"/> IF {cond?.condition_type === 'min_cart_qty' ? 'SP giỏ' : cond?.condition_type} &gt;= {cond?.required_value}</span>
                                                    <span className="flex items-center gap-1"><Gift className="w-3.5 h-3.5 text-red-500"/> THEN {action?.action_type === 'free_items' ? 'Tặng Quà' : action?.action_type === 'discount_percent' ? 'Giảm %' : 'Override Giá'} : {action?.reward_value}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-3 pl-4 border-l border-slate-100">
                                                <button onClick={() => handleTogglePromo(promo.id, promo.is_active)} className={`relative flex items-center rounded-full h-6 w-11 transition-colors ${promo.is_active ? 'bg-primary-600' : 'bg-slate-300'}`}>
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${promo.is_active ? 'translate-x-6' : 'translate-x-1'}`}/>
                                                </button>
                                                <button onClick={() => handleDeletePromo(promo.id)} className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* === FLASH SALES === */}
                    {promoTab === 'flash' && (
                        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
                            {/* FS CREATE FORM */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit space-y-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-orange-600"><Zap className="w-5 h-5" /> Mở Sự kiện Flash Sale</h3>
                                <div><label className="text-xs uppercase text-slate-500 font-bold">Tên Campaign</label><input type="text" value={newFlashSale.name} onChange={e=>setNewFlashSale({...newFlashSale, name: e.target.value})} placeholder="Vd: 11/11 Sale Điên Cuồng" className="w-full border border-slate-300 rounded px-3 py-2 text-sm mt-1" /></div>
                                <div><label className="text-xs uppercase text-slate-500 font-bold">Bắt đầu từ</label><input type="datetime-local" value={newFlashSale.startTime} onChange={e=>setNewFlashSale({...newFlashSale, startTime: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm mt-1" /></div>
                                <div><label className="text-xs uppercase text-slate-500 font-bold">Kết thúc lúc</label><input type="datetime-local" value={newFlashSale.endTime} onChange={e=>setNewFlashSale({...newFlashSale, endTime: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm mt-1" /></div>
                                <button onClick={handleSaveFlashSale} className="w-full bg-orange-500 text-white font-bold py-2.5 rounded-lg hover:bg-orange-600">Tạo Giờ Vàng Mới</button>
                            </div>

                            {/* FS LIST & MANAGE ITEMS */}
                            <div className="space-y-4">
                                {isLoadingFlash ? <Loader2 className="animate-spin text-slate-400 mx-auto" /> : flashSales.map(fs => (
                                    <div key={fs.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-300 ${activeFS?.id === fs.id ? 'border-orange-500 ring-2 ring-orange-100' : 'border-slate-200'}`}>
                                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50" onClick={() => openFsItems(fs)}>
                                            <div className="flex gap-4 items-center">
                                                <div className={`p-3 rounded-xl ${fs.is_active ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}><Zap className="w-6 h-6" /></div>
                                                <div>
                                                    <h4 className="font-bold text-lg text-slate-800">{fs.name}</h4>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                                                        <Clock className="w-3.5 h-3.5"/> <span>{new Date(fs.start_time).toLocaleString()} - {new Date(fs.end_time).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 px-2">
                                                <button onClick={(e) => { e.stopPropagation(); handleToggleFlashSale(fs.id, fs.is_active)}} className={`relative flex items-center rounded-full h-6 w-11 transition-colors ${fs.is_active ? 'bg-primary-600' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${fs.is_active ? 'translate-x-6' : 'translate-x-1'}`}/></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteFlashSale(fs.id)}} className="text-slate-400 hover:text-red-500 p-2"><Trash2 className="w-5 h-5"/></button>
                                            </div>
                                        </div>

                                        {/* FS Items Panel */}
                                        {activeFS?.id === fs.id && (
                                            <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-4">
                                                <div className="flex gap-2">
                                                    <div className="flex-1 border rounded bg-white relative group">
                                                        <div className="py-2 px-3 text-sm text-slate-500 cursor-pointer flex justify-between items-center">
                                                            {newFsItem.productIds.length === 0 ? '-- Chọn nhiều SP --' : `Đã chọn ${newFsItem.productIds.length} SP`}
                                                            <span>▼</span>
                                                        </div>
                                                        <div className="absolute top-full left-0 w-full bg-white border shadow-lg rounded-b z-20 hidden group-hover:block max-h-48 overflow-y-auto">
                                                            {products.map(p => (
                                                                <label key={p.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={newFsItem.productIds.includes(p.id)}
                                                                        onChange={(e) => {
                                                                            const checked = e.target.checked;
                                                                            setNewFsItem(prev => ({
                                                                                ...prev, 
                                                                                productIds: checked 
                                                                                    ? [...prev.productIds, p.id] 
                                                                                    : prev.productIds.filter(id => id !== p.id)
                                                                            }));
                                                                        }}
                                                                        className="w-4 h-4 accent-orange-500"
                                                                    />
                                                                    <span className="truncate">{p.name} (Gốc: {p.price?.toLocaleString()}đ)</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <input type="number" placeholder="Giá Flash Sale (đ)" value={newFsItem.discountPrice || ''} onChange={e=>setNewFsItem({...newFsItem, discountPrice: Number(e.target.value)})} className="w-40 border rounded py-2 px-3 text-sm"/>
                                                    <input type="number" placeholder="SL Tối đa" value={newFsItem.qtyLimit || ''} onChange={e=>setNewFsItem({...newFsItem, qtyLimit: Number(e.target.value)})} className="w-28 border rounded py-2 px-3 text-sm"/>
                                                    <button onClick={handleAddFsItem} className="bg-slate-800 text-white font-bold px-4 rounded hover:bg-slate-900"><Plus className="w-5 h-5"/></button>
                                                </div>

                                                <table className="w-full bg-white rounded border overflow-hidden mt-4 text-sm">
                                                    <thead className="bg-slate-200 text-slate-700 text-left text-xs uppercase font-bold">
                                                        <tr>
                                                            <th className="py-2 px-3">Sản phẩm</th>
                                                            <th className="py-2 px-3 text-right">Giá Xả Hàng</th>
                                                            <th className="py-2 px-3 text-center">Giới hạn Bán</th>
                                                            <th className="py-2 px-3 text-center">Đã Bán</th>
                                                            <th className="py-2 px-3 w-10"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {fsItems.length === 0 ? <tr><td colSpan={5} className="py-4 text-center text-slate-400">Chưa có mã hàng nào trong danh sách.</td></tr> : fsItems.map(item => (
                                                            <tr key={item.id}>
                                                                <td className="py-2 px-3">{item.product?.name} <span className="text-[10px] text-slate-400">({item.product?.sku})</span></td>
                                                                <td className="py-2 px-3 text-right font-bold text-orange-600">{Number(item.discount_price).toLocaleString()}đ</td>
                                                                <td className="py-2 px-3 text-center">{item.quantity_limit}</td>
                                                                <td className="py-2 px-3 text-center">{item.quantity_sold}</td>
                                                                <td className="py-2 px-3 text-center"><button onClick={()=>handleDeleteFsItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

