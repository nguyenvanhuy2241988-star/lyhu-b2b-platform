"use client";

import { useState, useEffect } from "react";
import { Copy, Link as LinkIcon, TrendingUp, DollarSign, MousePointerClick, ShoppingCart, CreditCard, Clock, History, Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { updatePaymentInfo, requestWithdrawal, getWithdrawalHistory, AffiliateWithdrawal } from "@/lib/affiliateStore";

interface AffiliatePanelProps {
    userId: string;
}

export function AffiliatePanel({ userId }: AffiliatePanelProps) {
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ clicks: 0, orders: 0, revenue: 0, commission: 0, availableBalance: 0 });
    const [targetUrl, setTargetUrl] = useState("");
    const [generatedUrl, setGeneratedUrl] = useState("");
    const [orders, setOrders] = useState<any[]>([]);
    const [productsRates, setProductsRates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'payment' | 'history'>('overview');

    // Payment Form
    const [bankName, setBankName] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [isSavingBank, setIsSavingBank] = useState(false);

    // Withdrawal Form
    const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    // History
    const [withdrawals, setWithdrawals] = useState<AffiliateWithdrawal[]>([]);

    useEffect(() => {
        if (userId) {
            fetchData();
        }
    }, [userId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch profile
            const { data: pData, error: pError } = await supabase
                .from('affiliate_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (pError && pError.code !== 'PGRST116') throw pError;
            setProfile(pData);

            if (pData) {
                setBankName(pData.bank_name || "");
                setAccountName(pData.bank_account_name || "");
                setAccountNumber(pData.bank_account_number || "");

                // Fetch stats (clicks)
                const { count: clicks } = await supabase
                    .from('affiliate_clicks')
                    .select('*', { count: 'exact', head: true })
                    .eq('affiliate_id', pData.id);

                // Fetch orders
                const { data: oData } = await supabase
                    .from('orders')
                    .select('id, total_amount, commission_amount, affiliate_status, created_at, order_items(quantity, products(name))')
                    .eq('affiliate_id', pData.id)
                    .order('created_at', { ascending: false });

                const safeData = oData || [];
                const revenue = safeData.reduce((acc: number, o: any) => acc + Number(o.total_amount), 0);
                const commission = safeData.reduce((acc: number, o: any) => acc + Number(o.commission_amount), 0);
                
                // Calculate Available Balance (only from approved orders minus total withdrawn)
                const approvedCommission = safeData
                    .filter((o: any) => o.affiliate_status === 'approved' || o.affiliate_status === 'paid')
                    .reduce((acc: number, o: any) => acc + Number(o.commission_amount), 0);
                const totalWithdrawn = pData.total_withdrawn || 0;
                const availableBalance = Math.max(0, approvedCommission - totalWithdrawn);

                setStats({
                    clicks: clicks || 0,
                    orders: safeData.length,
                    revenue,
                    commission,
                    availableBalance
                });
                
                setOrders(oData.slice(0, 10)); // Lấy 10 đơn gần nhất

                // Fetch Products
                const { data: productsData } = await supabase
                    .from('products')
                    .select('id, name, affiliate_commission_rate, image_url')
                    .eq('is_active', true);

                const { data: customRatesData } = await supabase
                    .from('affiliate_custom_rates')
                    .select('product_id, commission_rate')
                    .eq('affiliate_id', pData.id);

                const customRatesMap = new Map(customRatesData?.map((c: any) => [c.product_id, c.commission_rate]) || []);

                const mappedProducts = (productsData || []).map((p: any) => {
                    let rate = pData.commission_rate;
                    let isCustom = false;
                    let isProductGlobal = false;

                    if (customRatesMap.has(p.id)) {
                        rate = customRatesMap.get(p.id);
                        isCustom = true;
                    } else if (p.affiliate_commission_rate > 0) {
                        rate = p.affiliate_commission_rate;
                        isProductGlobal = true;
                    }
                    return { ...p, effective_rate: rate, isCustom, isProductGlobal };
                });
                
                mappedProducts.sort((a: any, b: any) => b.effective_rate - a.effective_rate);
                setProductsRates(mappedProducts);

                // Fetch Withdrawal History
                const history = await getWithdrawalHistory(pData.id);
                setWithdrawals(history);
            }

        } catch (error) {
            console.error("Error fetching affiliate data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBankInfo = async () => {
        if (!bankName || !accountName || !accountNumber) {
            alert("Vui lòng điền đầy đủ thông tin ngân hàng.");
            return;
        }
        setIsSavingBank(true);
        const success = await updatePaymentInfo(profile.id, {
            bank_name: bankName,
            bank_account_name: accountName,
            bank_account_number: accountNumber
        });
        setIsSavingBank(false);
        if (success) {
            alert("Đã lưu thông tin thanh toán thành công!");
            setProfile({ ...profile, bank_name: bankName, bank_account_name: accountName, bank_account_number: accountNumber });
        } else {
            alert("Lỗi khi lưu thông tin. Vui lòng thử lại.");
        }
    };

    const handleWithdraw = async () => {
        if (!withdrawAmount || Number(withdrawAmount) <= 0) {
            alert("Vui lòng nhập số tiền hợp lệ.");
            return;
        }
        if (Number(withdrawAmount) < 100000) {
            alert("Số tiền rút tối thiểu là 100.000đ.");
            return;
        }
        // Also subtract pending withdrawals from available balance
        const pendingAmount = withdrawals
            .filter(w => w.status === 'pending')
            .reduce((sum, w) => sum + Number(w.amount), 0);
        
        const realAvailable = stats.availableBalance - pendingAmount;

        if (Number(withdrawAmount) > realAvailable) {
            alert(`Số dư khả dụng không đủ. (Số tiền đang chờ duyệt: ${pendingAmount.toLocaleString()}đ)`);
            return;
        }
        if (!profile.bank_name || !profile.bank_account_number) {
            alert("Vui lòng cập nhật thông tin tài khoản ngân hàng trước khi rút tiền.");
            setActiveTab('payment');
            return;
        }

        setIsWithdrawing(true);
        const success = await requestWithdrawal(profile.id, Number(withdrawAmount), {
            bank_name: profile.bank_name,
            bank_account_name: profile.bank_account_name,
            bank_account_number: profile.bank_account_number
        });
        setIsWithdrawing(false);
        if (success) {
            alert("Đã gửi yêu cầu rút tiền thành công! Vui lòng chờ Admin duyệt.");
            setWithdrawAmount('');
            fetchData(); // Reload
        } else {
            alert("Đã xảy ra lỗi khi tạo yêu cầu rút tiền.");
        }
    };

    const handleGenerate = () => {
        if (!targetUrl) return;
        if (!profile?.affiliate_code) return;

        try {
            let baseUrl = targetUrl;
            if (!/^https?:\/\//i.test(baseUrl)) {
                baseUrl = 'https://' + baseUrl;
            }
            const url = new URL(baseUrl);
            url.searchParams.set('ref', profile.affiliate_code);
            setGeneratedUrl(url.toString());
        } catch (error) {
            alert("Đường link không hợp lệ. Vui lòng nhập link chuẩn (vd: lyhu.com.vn/sp-1)");
        }
    };

    const copyToClipboard = () => {
        if (generatedUrl) {
            navigator.clipboard.writeText(generatedUrl);
            alert("Đã copy link thành công!");
        }
    };

    const copyProductLink = (productId: string) => {
        if (!profile?.affiliate_code) return;
        const baseUrl = window.location.origin;
        const url = new URL(baseUrl);
        url.searchParams.set('ref', profile.affiliate_code);
        url.searchParams.set('p', productId);
        navigator.clipboard.writeText(url.toString());
        alert("Đã copy link sản phẩm thành công!");
    };

    if (loading) {
        return <div className="py-8 text-center text-slate-500">Đang tải dữ liệu Affiliate...</div>;
    }

    if (!profile || profile.status !== 'active') {
        return null;
    }

    const pendingAmount = withdrawals
        .filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + Number(w.amount), 0);
    const realAvailable = stats.availableBalance - pendingAmount;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    <h2 className="font-bold text-slate-800">Chương trình Tiếp thị Liên kết (Affiliate)</h2>
                </div>
                <div className="flex gap-4 items-center">
                    {stats.revenue > 0 ? (
                        <div className="text-sm text-slate-600 font-medium">
                            Thực nhận trung bình: <span className="text-green-600 font-bold">{((stats.commission / stats.revenue) * 100).toFixed(1)}%</span>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-600 font-medium">
                            Hoa hồng mặc định: <span className="text-green-600 font-bold">{profile.commission_rate}%</span>
                        </div>
                    )}
                    <div className="h-4 w-px bg-slate-300"></div>
                    <div className="text-sm text-indigo-700 font-medium">Mã: <span className="font-mono bg-indigo-100 px-2 py-0.5 rounded">{profile.affiliate_code}</span></div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 px-6">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Tổng quan
                </button>
                <button
                    onClick={() => setActiveTab('payment')}
                    className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'payment' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Thông tin & Rút tiền
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Lịch sử rút tiền
                </button>
            </div>
            
            <div className="p-6">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Thống kê */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                                <div className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><MousePointerClick size={14}/> Lượt Click</div>
                                <div className="text-xl font-bold text-slate-800">{stats.clicks}</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                                <div className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><ShoppingCart size={14}/> Đơn hàng</div>
                                <div className="text-xl font-bold text-slate-800">{stats.orders}</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                                <div className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><TrendingUp size={14}/> Doanh thu</div>
                                <div className="text-xl font-bold text-slate-800">{stats.revenue.toLocaleString()}đ</div>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-center">
                                <div className="text-xs text-amber-700 mb-1 flex items-center justify-center gap-1"><DollarSign size={14}/> Hoa hồng</div>
                                <div className="text-xl font-bold text-amber-600">{stats.commission.toLocaleString()}đ</div>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 text-center md:col-span-2 lg:col-span-1 shadow-inner shadow-emerald-500/10">
                                <div className="text-xs text-emerald-700 mb-1 flex items-center justify-center gap-1"><CreditCard size={14}/> Khả dụng rút</div>
                                <div className="text-xl font-bold text-emerald-600">{realAvailable.toLocaleString()}đ</div>
                            </div>
                        </div>

                        {/* Tạo Link */}
                        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><LinkIcon size={16} className="text-indigo-600"/> Tạo Link chia sẻ</h3>
                            <div className="flex flex-col md:flex-row gap-2 mb-3">
                                <input 
                                    type="text" 
                                    placeholder="Dán link sản phẩm bạn muốn bán vào đây..." 
                                    className="flex-1 text-sm border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={targetUrl}
                                    onChange={(e: any) => setTargetUrl(e.target.value)}
                                />
                                <button onClick={handleGenerate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                                    Tạo Link
                                </button>
                            </div>
                            
                            {generatedUrl && (
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                                    <div className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-slate-600">
                                        {generatedUrl}
                                    </div>
                                    <button onClick={copyToClipboard} className="text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 p-1.5 rounded shrink-0 transition-colors" title="Copy Link">
                                        <Copy size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Bảng hoa hồng chi tiết */}
                        {productsRates.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold mb-3 text-slate-700">Mức Hoa hồng theo Sản phẩm</h3>
                                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                                            <tr>
                                                <th className="p-3 text-xs font-medium text-slate-500 w-[50%]">Sản phẩm</th>
                                                <th className="p-3 text-xs font-medium text-slate-500 w-[30%] text-right">Mức Hoa hồng</th>
                                                <th className="p-3 text-xs font-medium text-slate-500 w-[20%] text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {productsRates.map((p: any) => (
                                                <tr key={p.id} className="hover:bg-slate-50 text-sm">
                                                    <td className="p-3">
                                                        <div className="font-medium text-slate-800 line-clamp-1">{p.name}</div>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {p.isCustom && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Mức ưu đãi</span>}
                                                            {p.isProductGlobal && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Mức riêng</span>}
                                                            <span className="font-bold text-green-600">{p.effective_rate}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <button 
                                                            onClick={() => copyProductLink(p.id)}
                                                            className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1.5 rounded-md text-xs font-medium transition-colors"
                                                        >
                                                            <LinkIcon size={12} />
                                                            Lấy Link
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Lịch sử */}
                        {orders.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold mb-3 text-slate-700">Đơn hàng giới thiệu gần đây</h3>
                                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="p-3 text-xs font-medium text-slate-500">Mã đơn</th>
                                                <th className="p-3 text-xs font-medium text-slate-500">Ngày đặt</th>
                                                <th className="p-3 text-xs font-medium text-slate-500 w-[30%]">Sản phẩm</th>
                                                <th className="p-3 text-xs font-medium text-slate-500">Giá trị</th>
                                                <th className="p-3 text-xs font-medium text-slate-500">Hoa hồng</th>
                                                <th className="p-3 text-xs font-medium text-slate-500">Trạng thái HH</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {orders.map((o: any) => (
                                                <tr key={o.id} className="hover:bg-slate-50 text-sm align-top">
                                                    <td className="p-3 font-mono text-xs pt-4">...{o.id.substring(o.id.length - 6)}</td>
                                                    <td className="p-3 text-slate-600 pt-4">{new Date(o.created_at).toLocaleDateString('vi-VN')}</td>
                                                    <td className="p-3">
                                                        <div className="flex flex-col gap-1">
                                                            {o.order_items?.slice(0, 3).map((item: any, idx: number) => (
                                                                <div key={idx} className="text-xs text-slate-600 line-clamp-1" title={item.products?.name}>
                                                                    <span className="font-medium text-slate-700">{item.quantity}x</span> {item.products?.name || 'Sản phẩm đã xóa'}
                                                                </div>
                                                            ))}
                                                            {o.order_items?.length > 3 && (
                                                                <div className="text-[10px] text-slate-400 italic">
                                                                    + {o.order_items.length - 3} sản phẩm khác...
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 font-medium pt-4">{Number(o.total_amount).toLocaleString()}đ</td>
                                                    <td className="p-3 font-medium text-amber-600 pt-4">{Number(o.commission_amount).toLocaleString()}đ</td>
                                                    <td className="p-3 pt-4">
                                                        {o.affiliate_status === 'pending' && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">Chờ xử lý</span>}
                                                        {o.affiliate_status === 'approved' && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Đã giao (Khả dụng)</span>}
                                                        {o.affiliate_status === 'paid' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">Đã thanh toán</span>}
                                                        {o.affiliate_status === 'cancelled' && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-medium">Bị hủy</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'payment' && (
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Cập nhật thông tin ngân hàng */}
                        <div>
                            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <CreditCard size={18} className="text-indigo-600" />
                                Thông tin tài khoản ngân hàng
                            </h3>
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tên ngân hàng (VD: Vietcombank, MB Bank)</label>
                                    <input 
                                        type="text" 
                                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={bankName}
                                        onChange={e => setBankName(e.target.value)}
                                        placeholder="Tên ngân hàng chi nhánh..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tên chủ tài khoản</label>
                                    <input 
                                        type="text" 
                                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={accountName}
                                        onChange={e => setAccountName(e.target.value.toUpperCase())}
                                        placeholder="NGUYEN VAN A"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Số tài khoản</label>
                                    <input 
                                        type="text" 
                                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={accountNumber}
                                        onChange={e => setAccountNumber(e.target.value)}
                                        placeholder="Số tài khoản..."
                                    />
                                </div>
                                <button 
                                    onClick={handleSaveBankInfo}
                                    disabled={isSavingBank}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSavingBank && <Loader2 size={16} className="animate-spin" />}
                                    Lưu thông tin
                                </button>
                            </div>
                        </div>

                        {/* Yêu cầu rút tiền */}
                        <div>
                            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <DollarSign size={18} className="text-emerald-600" />
                                Yêu cầu rút tiền
                            </h3>
                            <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 space-y-4">
                                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-emerald-100">
                                    <span className="text-sm font-medium text-slate-600">Số dư khả dụng:</span>
                                    <span className="text-lg font-bold text-emerald-600">{realAvailable.toLocaleString()}đ</span>
                                </div>
                                {pendingAmount > 0 && (
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs font-medium text-slate-500">Đang chờ duyệt:</span>
                                        <span className="text-xs font-bold text-amber-500">{pendingAmount.toLocaleString()}đ</span>
                                    </div>
                                )}
                                
                                <div className="pt-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Số tiền muốn rút (Tối thiểu 100k)</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-3 outline-none focus:ring-2 focus:ring-emerald-500 pr-12 font-bold text-slate-800"
                                            value={withdrawAmount}
                                            onChange={e => setWithdrawAmount(e.target.value ? Number(e.target.value) : '')}
                                            placeholder="0"
                                            min="100000"
                                            max={realAvailable}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">VNĐ</span>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={handleWithdraw}
                                    disabled={isWithdrawing || realAvailable < 100000}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {isWithdrawing && <Loader2 size={16} className="animate-spin" />}
                                    Gửi yêu cầu rút tiền
                                </button>
                                
                                <p className="text-xs text-slate-500 text-center">
                                    Lệnh rút tiền thường được xử lý trong vòng 24-48 giờ làm việc. Tiền sẽ được chuyển vào Tài khoản ngân hàng bạn đã lưu bên cạnh.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div>
                        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <History size={18} className="text-slate-600" />
                            Lịch sử yêu cầu rút tiền
                        </h3>
                        
                        {withdrawals.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
                                <Clock size={32} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-slate-500 text-sm">Bạn chưa có lịch sử rút tiền nào.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-3 text-xs font-medium text-slate-500">Mã lệnh</th>
                                            <th className="p-3 text-xs font-medium text-slate-500">Ngày tạo</th>
                                            <th className="p-3 text-xs font-medium text-slate-500">Số tiền rút</th>
                                            <th className="p-3 text-xs font-medium text-slate-500">Thông tin nhận tiền</th>
                                            <th className="p-3 text-xs font-medium text-slate-500">Trạng thái</th>
                                            <th className="p-3 text-xs font-medium text-slate-500">Ghi chú</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {withdrawals.map(w => (
                                            <tr key={w.id} className="hover:bg-slate-50 text-sm align-top">
                                                <td className="p-3 font-mono text-xs text-slate-500 pt-4">...{w.id.substring(w.id.length - 8)}</td>
                                                <td className="p-3 text-slate-600 pt-4">{new Date(w.created_at).toLocaleString('vi-VN')}</td>
                                                <td className="p-3 font-bold text-slate-800 pt-4">{Number(w.amount).toLocaleString()}đ</td>
                                                <td className="p-3 pt-4">
                                                    <div className="text-xs text-slate-700">
                                                        <p className="font-semibold">{w.bank_info?.bank_name}</p>
                                                        <p>{w.bank_info?.bank_account_name}</p>
                                                        <p className="font-mono">{w.bank_info?.bank_account_number}</p>
                                                    </div>
                                                </td>
                                                <td className="p-3 pt-4">
                                                    {w.status === 'pending' && <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded font-medium"><Clock size={10}/> Chờ xử lý</span>}
                                                    {w.status === 'approved' && <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-medium"><CheckCircle size={10}/> Đã duyệt</span>}
                                                    {w.status === 'rejected' && <span className="inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-medium"><XCircle size={10}/> Từ chối</span>}
                                                </td>
                                                <td className="p-3 text-xs text-slate-500 pt-4 italic max-w-[200px]">
                                                    {w.note || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
