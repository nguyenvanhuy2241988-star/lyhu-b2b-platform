import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Plus, Trash, CheckCircle, XCircle } from "lucide-react";

export function AffiliateRulesTab() {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form states
    const [ruleName, setRuleName] = useState("");
    const [ruleBrand, setRuleBrand] = useState("");
    const [ruleRate, setRuleRate] = useState(10);
    const [rulePriority, setRulePriority] = useState(1);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnon);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('affiliate_commission_rules')
                .select('*')
                .order('priority', { ascending: false });

            if (error) throw error;
            setRules(data || []);
        } catch (error) {
            console.error("Error fetching rules", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRule = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload: any = {
                name: ruleName,
                commission_rate: ruleRate,
                priority: rulePriority,
                is_active: true
            };

            // Nếu nhập brand thì lưu vào, ko thì null (áp dụng cho tất cả)
            if (ruleBrand.trim() !== "") {
                payload.brand = ruleBrand.trim();
            }

            const { error } = await supabase
                .from('affiliate_commission_rules')
                .insert(payload);

            if (error) throw error;

            alert("Đã thêm quy tắc thành công!");
            setIsModalOpen(false);
            setRuleName("");
            setRuleBrand("");
            setRuleRate(10);
            setRulePriority(1);
            fetchRules();
        } catch (error: any) {
            alert("Lỗi thêm quy tắc: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleRuleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('affiliate_commission_rules')
                .update({ is_active: !currentStatus })
                .eq('id', id);
            
            if (error) throw error;
            fetchRules();
        } catch (error) {
            alert("Lỗi cập nhật trạng thái");
        }
    };

    const deleteRule = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa quy tắc này?")) return;
        try {
            const { error } = await supabase
                .from('affiliate_commission_rules')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            fetchRules();
        } catch (error) {
            alert("Lỗi xóa quy tắc");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <p className="text-slate-600">Thiết lập tỷ lệ hoa hồng linh hoạt theo nhãn hiệu hoặc độ ưu tiên.</p>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
                >
                    <Plus size={18} /> Thêm Quy tắc
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-medium text-slate-500 text-sm">Tên Quy tắc</th>
                                <th className="p-4 font-medium text-slate-500 text-sm">Phạm vi áp dụng</th>
                                <th className="p-4 font-medium text-slate-500 text-sm">Độ ưu tiên</th>
                                <th className="p-4 font-medium text-slate-500 text-sm">Tỷ lệ (%)</th>
                                <th className="p-4 font-medium text-slate-500 text-sm">Trạng thái</th>
                                <th className="p-4 font-medium text-slate-500 text-sm">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">Đang tải...</td>
                                </tr>
                            ) : rules.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">Chưa có quy tắc hoa hồng nào.</td>
                                </tr>
                            ) : rules.map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium">{r.name}</td>
                                    <td className="p-4">
                                        {r.brand ? (
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">Nhãn hiệu: {r.brand}</span>
                                        ) : r.product_id ? (
                                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">Sản phẩm cụ thể</span>
                                        ) : (
                                            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">Toàn hệ thống (Mặc định)</span>
                                        )}
                                        {r.affiliate_id && (
                                            <div className="mt-1"><span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">KOL cụ thể</span></div>
                                        )}
                                    </td>
                                    <td className="p-4 text-slate-600">Mức {r.priority}</td>
                                    <td className="p-4 font-bold text-green-600">{r.commission_rate}%</td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => toggleRuleStatus(r.id, r.is_active)}
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                                        >
                                            {r.is_active ? 'Đang bật' : 'Đã tắt'}
                                        </button>
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        <button onClick={() => deleteRule(r.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa">
                                            <Trash size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Thêm Quy tắc Hoa hồng</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddRule} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên quy tắc</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Vd: Ưu đãi cho Mì Hảo Hảo"
                                    value={ruleName}
                                    onChange={e => setRuleName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nhãn hiệu (Tùy chọn)</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Nhập chính xác tên nhãn hiệu (VD: CVT, ABI...)"
                                    value={ruleBrand}
                                    onChange={e => setRuleBrand(e.target.value)}
                                />
                                <p className="text-xs text-slate-500 mt-1">Bỏ trống nếu áp dụng cho toàn bộ nhãn hiệu.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tỷ lệ (%)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        min="0" max="100" step="0.5"
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                                        value={ruleRate}
                                        onChange={e => setRuleRate(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Độ ưu tiên</label>
                                    <input 
                                        type="number" 
                                        required 
                                        min="0"
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                                        value={rulePriority}
                                        onChange={e => setRulePriority(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-slate-500">Độ ưu tiên: Số càng cao, quy tắc càng được ưu tiên áp dụng nếu có trùng lặp điều kiện.</p>
                            
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50"
                                >
                                    {isSubmitting ? "Đang xử lý..." : "Lưu quy tắc"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
