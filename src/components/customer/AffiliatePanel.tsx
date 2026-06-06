import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Copy, Link as LinkIcon, TrendingUp, DollarSign, MousePointerClick, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface AffiliatePanelProps {
    userId: string;
}

export function AffiliatePanel({ userId }: AffiliatePanelProps) {
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ clicks: 0, orders: 0, revenue: 0, commission: 0 });
    const [targetUrl, setTargetUrl] = useState("");
    const [generatedUrl, setGeneratedUrl] = useState("");
    const [orders, setOrders] = useState<any[]>([]);
    const [productsRates, setProductsRates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

                setStats({
                    clicks: clicks || 0,
                    orders: safeData.length,
                    revenue,
                    commission
                });
                
                setOrders(oData.slice(0, 10)); // Lấy 10 đơn gần nhất

                // Lấy bảng hoa hồng chi tiết
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
                    let rate = pData.commission_rate; // Mức cơ bản
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
                
                // Sắp xếp sản phẩm có hoa hồng cao lên trước
                mappedProducts.sort((a: any, b: any) => b.effective_rate - a.effective_rate);
                setProductsRates(mappedProducts);
            }

        } catch (error) {
            console.error("Error fetching affiliate data", error);
        } finally {
            setLoading(false);
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

    // Nếu người dùng không phải là Affiliate thì không render gì cả
    if (!profile || profile.status !== 'active') {
        return null;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between">
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
            
            <div className="p-6 space-y-6">
                {/* Thống kê */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                                                {o.affiliate_status === 'approved' && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Có thể rút</span>}
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
        </div>
    );
}
