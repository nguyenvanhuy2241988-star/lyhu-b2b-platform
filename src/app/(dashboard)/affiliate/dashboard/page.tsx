"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/components/auth/AuthProvider";
import { Copy, Link as LinkIcon, TrendingUp, DollarSign, MousePointerClick, ShoppingCart } from "lucide-react";

export default function AffiliateDashboardPage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ clicks: 0, orders: 0, revenue: 0, commission: 0 });
    const [targetUrl, setTargetUrl] = useState("");
    const [generatedUrl, setGeneratedUrl] = useState("");
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnon);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch profile
            const { data: pData, error: pError } = await supabase
                .from('affiliate_profiles')
                .select('*')
                .eq('user_id', user?.id)
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
                const { data: ordersData } = await supabase
                    .from('orders')
                    .select('id, total_amount, commission_amount, affiliate_status, created_at')
                    .eq('affiliate_id', pData.id)
                    .order('created_at', { ascending: false });

                const oData = ordersData || [];
                const revenue = oData.reduce((acc, o) => acc + Number(o.total_amount), 0);
                const commission = oData.reduce((acc, o) => acc + Number(o.commission_amount), 0);

                setStats({
                    clicks: clicks || 0,
                    orders: oData.length,
                    revenue,
                    commission
                });
                
                setOrders(oData.slice(0, 10)); // Lấy 10 đơn gần nhất
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
            // Handle if they didn't put http
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

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>;
    }

    if (!profile || profile.status !== 'active') {
        return (
            <div className="p-8 max-w-lg mx-auto mt-10 bg-white rounded-xl shadow-sm border border-slate-200 text-center">
                <div className="bg-amber-100 text-amber-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp size={32} />
                </div>
                <h2 className="text-xl font-bold mb-2">Chưa phải là Affiliate</h2>
                <p className="text-slate-600 mb-6">
                    Tài khoản của bạn chưa được cấp mã giới thiệu Affiliate, hoặc đang trong trạng thái chờ duyệt. Vui lòng liên hệ Admin.
                </p>
                {/* Ở đây có thể làm Nút Đăng ký nếu chưa có profile */}
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900">Affiliate Dashboard</h1>

            {/* Thống kê */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><MousePointerClick size={24} /></div>
                    <div>
                        <div className="text-sm text-slate-500">Tổng Lượt Click</div>
                        <div className="text-2xl font-bold">{stats.clicks}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg"><ShoppingCart size={24} /></div>
                    <div>
                        <div className="text-sm text-slate-500">Đơn hàng</div>
                        <div className="text-2xl font-bold">{stats.orders}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><TrendingUp size={24} /></div>
                    <div>
                        <div className="text-sm text-slate-500">Doanh thu tạo ra</div>
                        <div className="text-2xl font-bold">{stats.revenue.toLocaleString()}đ</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><DollarSign size={24} /></div>
                    <div>
                        <div className="text-sm text-slate-500">Hoa hồng tạm tính</div>
                        <div className="text-2xl font-bold text-amber-600">{stats.commission.toLocaleString()}đ</div>
                    </div>
                </div>
            </div>

            {/* Công cụ tạo link */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><LinkIcon size={20} /> Tạo Link Affiliate</h2>
                <div className="text-sm text-slate-600 mb-4">
                    Mã của bạn là: <span className="font-mono font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded">{profile.affiliate_code}</span> (Hoa hồng: {profile.commission_rate}%)
                </div>
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        placeholder="Nhập đường link sản phẩm bất kỳ trên LYHU..." 
                        className="flex-1 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                        value={targetUrl}
                        onChange={e => setTargetUrl(e.target.value)}
                    />
                    <button onClick={handleGenerate} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium whitespace-nowrap">
                        Tạo Link
                    </button>
                </div>
                
                {generatedUrl && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-4">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm text-slate-700">
                            {generatedUrl}
                        </div>
                        <button onClick={copyToClipboard} className="text-slate-500 hover:text-slate-900 bg-white border border-slate-200 p-2 rounded shrink-0">
                            <Copy size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Lịch sử đơn hàng */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-bold">Đơn hàng giới thiệu gần đây</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-sm font-medium text-slate-500">Mã đơn</th>
                                <th className="p-4 text-sm font-medium text-slate-500">Ngày đặt</th>
                                <th className="p-4 text-sm font-medium text-slate-500">Giá trị đơn</th>
                                <th className="p-4 text-sm font-medium text-slate-500">Hoa hồng</th>
                                <th className="p-4 text-sm font-medium text-slate-500">Trạng thái HH</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Chưa có đơn hàng nào phát sinh từ link của bạn.</td>
                                </tr>
                            ) : orders.map((o) => (
                                <tr key={o.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono text-sm">...{o.id.substring(o.id.length - 6)}</td>
                                    <td className="p-4 text-sm text-slate-600">{new Date(o.created_at).toLocaleDateString('vi-VN')}</td>
                                    <td className="p-4 font-medium">{Number(o.total_amount).toLocaleString()}đ</td>
                                    <td className="p-4 font-medium text-amber-600">{Number(o.commission_amount).toLocaleString()}đ</td>
                                    <td className="p-4">
                                        {o.affiliate_status === 'pending' && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Chờ xử lý</span>}
                                        {o.affiliate_status === 'approved' && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Có thể rút</span>}
                                        {o.affiliate_status === 'paid' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Đã thanh toán</span>}
                                        {o.affiliate_status === 'cancelled' && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Bị hủy</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
