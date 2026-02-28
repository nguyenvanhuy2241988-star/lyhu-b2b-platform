"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Save, Trash2, GripVertical, AlertTriangle, Phone, ShoppingBag, Share2, MessageSquare, Users, DollarSign, TrendingUp, Target } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getRealtimeClient } from "@/lib/supabaseClient";
import {
    KpiMetricDefinition,
    fetchKpiMetrics,
    upsertKpiMetric,
    deleteKpiMetric,
    updateKpiMetricsBatch
} from "@/lib/kpiSalaryStore";

const ICON_MAP: Record<string, React.ReactNode> = {
    Phone: <Phone className="w-4 h-4" />,
    ShoppingBag: <ShoppingBag className="w-4 h-4" />,
    Share2: <Share2 className="w-4 h-4" />,
    MessageSquare: <MessageSquare className="w-4 h-4" />,
    Users: <Users className="w-4 h-4" />,
    DollarSign: <DollarSign className="w-4 h-4" />,
    TrendingUp: <TrendingUp className="w-4 h-4" />,
    Target: <Target className="w-4 h-4" />,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

export default function AdminKpiSettingsPage() {
    const { session } = useAuth();
    const [metrics, setMetrics] = useState<KpiMetricDefinition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMetric, setNewMetric] = useState({
        key: '',
        label: '',
        description: '',
        data_source: 'manual' as 'auto' | 'manual',
        icon: 'Target',
        field_type: 'number' as 'number' | 'currency' | 'percentage',
        salary_percent: 0,
        monthly_target: 0
    });

    const loadMetrics = useCallback(async () => {
        setIsLoading(true);
        const data = await fetchKpiMetrics();
        setMetrics(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadMetrics();
    }, [loadMetrics]);

    // Realtime subscription
    useEffect(() => {
        const rt = getRealtimeClient();
        const channel = rt
            .channel('admin-kpi-metrics-rt')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kpi_metric_definitions' }, () => {
                loadMetrics();
            })
            .subscribe();

        return () => { rt.removeChannel(channel); };
    }, [loadMetrics]);

    const totalPercent = metrics.filter(m => m.is_active).reduce((sum, m) => sum + (m.salary_percent || 0), 0);

    const handleFieldChange = (id: string, field: keyof KpiMetricDefinition, value: any) => {
        setMetrics(prev => prev.map(m =>
            m.id === id ? { ...m, [field]: value } : m
        ));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const success = await updateKpiMetricsBatch(metrics);
        if (success) {
            alert('✅ Đã lưu cài đặt KPI thành công!');
        } else {
            alert('❌ Lỗi khi lưu cài đặt');
        }
        setIsSaving(false);
    };

    const handleAddMetric = async () => {
        if (!newMetric.key || !newMetric.label) {
            alert('Vui lòng nhập Key và Tên hiển thị');
            return;
        }

        const maxSort = Math.max(0, ...metrics.map(m => m.sort_order));
        const success = await upsertKpiMetric({
            ...newMetric,
            is_active: true,
            sort_order: maxSort + 1
        });

        if (success) {
            setShowAddForm(false);
            setNewMetric({
                key: '', label: '', description: '', data_source: 'manual',
                icon: 'Target', field_type: 'number', salary_percent: 0, monthly_target: 0
            });
            loadMetrics();
        } else {
            alert('❌ Lỗi khi thêm chỉ số');
        }
    };

    const handleDelete = async (metric: KpiMetricDefinition) => {
        if (metric.data_source === 'auto') {
            alert('Không thể xóa chỉ số tự động. Bạn có thể ẩn bằng cách tắt Active.');
            return;
        }
        if (!confirm(`Xóa chỉ số "${metric.label}"?`)) return;

        const success = await deleteKpiMetric(metric.id);
        if (success) {
            loadMetrics();
        } else {
            alert('❌ Lỗi khi xóa chỉ số');
        }
    };

    const formatTargetDisplay = (value: number, type: string) => {
        if (type === 'currency') {
            return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
        }
        if (type === 'percentage') return value + '%';
        return value.toLocaleString('vi-VN');
    };

    if (isLoading) {
        return <div className="p-6">Đang tải cài đặt KPI...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Cài đặt Chỉ số KPI & Trọng số Lương</h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý các chỉ số KPI và % lương tương ứng cho Telesales</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm chỉ số
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
                    </button>
                </div>
            </div>

            {/* Total % Warning */}
            {totalPercent !== 100 && (
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${totalPercent > 100 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                    <AlertTriangle className={`w-5 h-5 ${totalPercent > 100 ? 'text-red-500' : 'text-amber-500'}`} />
                    <div>
                        <p className={`text-sm font-semibold ${totalPercent > 100 ? 'text-red-800' : 'text-amber-800'}`}>
                            Tổng trọng số: {totalPercent}% (cần = 100%)
                        </p>
                        <p className={`text-xs ${totalPercent > 100 ? 'text-red-600' : 'text-amber-600'}`}>
                            {totalPercent > 100 ? 'Tổng vượt quá 100%. Hãy giảm bớt một số chỉ số.' : `Còn thiếu ${100 - totalPercent}%. Hãy phân bổ đủ 100%.`}
                        </p>
                    </div>
                </div>
            )}

            {totalPercent === 100 && (
                <div className="flex items-center gap-3 p-4 rounded-xl border bg-green-50 border-green-200">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">✓</div>
                    <p className="text-sm font-semibold text-green-800">Tổng trọng số: 100% ✅</p>
                </div>
            )}

            {/* Add Form */}
            {showAddForm && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800">Thêm chỉ số KPI mới</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Key (unique)</label>
                            <input
                                type="text"
                                value={newMetric.key}
                                onChange={e => setNewMetric(prev => ({ ...prev, key: e.target.value.replace(/\s/g, '_').toLowerCase() }))}
                                placeholder="vd: order_count"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Tên hiển thị</label>
                            <input
                                type="text"
                                value={newMetric.label}
                                onChange={e => setNewMetric(prev => ({ ...prev, label: e.target.value }))}
                                placeholder="vd: Số đơn hàng"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Target /tháng</label>
                            <input
                                type="number"
                                value={newMetric.monthly_target}
                                onChange={e => setNewMetric(prev => ({ ...prev, monthly_target: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">% Lương</label>
                            <input
                                type="number"
                                value={newMetric.salary_percent}
                                onChange={e => setNewMetric(prev => ({ ...prev, salary_percent: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Mô tả</label>
                            <input
                                type="text"
                                value={newMetric.description}
                                onChange={e => setNewMetric(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Mô tả ngắn"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Icon</label>
                            <select
                                value={newMetric.icon}
                                onChange={e => setNewMetric(prev => ({ ...prev, icon: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                            >
                                {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Loại giá trị</label>
                            <select
                                value={newMetric.field_type}
                                onChange={e => setNewMetric(prev => ({ ...prev, field_type: e.target.value as any }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                            >
                                <option value="number">Số</option>
                                <option value="currency">Tiền tệ</option>
                                <option value="percentage">Phần trăm</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleAddMetric}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                        >
                            Thêm
                        </button>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            )}

            {/* Metrics Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-left border-b border-slate-200">
                                <th className="p-4 font-semibold w-8"></th>
                                <th className="p-4 font-semibold">Chỉ số KPI</th>
                                <th className="p-4 font-semibold">Mô tả</th>
                                <th className="p-4 font-semibold text-center">Target /tháng</th>
                                <th className="p-4 font-semibold text-center">% Lương</th>
                                <th className="p-4 font-semibold text-center">Nguồn</th>
                                <th className="p-4 font-semibold text-center">Active</th>
                                <th className="p-4 font-semibold text-center w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {metrics.map((metric) => (
                                <tr key={metric.id} className={`hover:bg-slate-50/50 transition-colors ${!metric.is_active ? 'opacity-50' : ''}`}>
                                    <td className="p-4 text-center">
                                        <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                                                {ICON_MAP[metric.icon] || <Target className="w-4 h-4" />}
                                            </div>
                                            <input
                                                type="text"
                                                value={metric.label}
                                                onChange={e => handleFieldChange(metric.id, 'label', e.target.value)}
                                                className="font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary-500 outline-none px-1 py-0.5 transition-colors"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="text"
                                            value={metric.description}
                                            onChange={e => handleFieldChange(metric.id, 'description', e.target.value)}
                                            className="text-xs text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary-500 outline-none w-full px-1 py-0.5 transition-colors"
                                        />
                                    </td>
                                    <td className="p-4 text-center">
                                        <input
                                            type="number"
                                            value={metric.monthly_target}
                                            onChange={e => handleFieldChange(metric.id, 'monthly_target', Number(e.target.value))}
                                            className="w-24 text-center font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        />
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <input
                                                type="number"
                                                value={metric.salary_percent}
                                                onChange={e => handleFieldChange(metric.id, 'salary_percent', Number(e.target.value))}
                                                className="w-16 text-center font-bold text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                            />
                                            <span className="text-xs font-bold text-primary-600">%</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${metric.data_source === 'auto'
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {metric.data_source === 'auto' ? '🤖 Tự động' : '📝 Nhập tay'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => handleFieldChange(metric.id, 'is_active', !metric.is_active)}
                                            className={`w-10 h-6 rounded-full relative transition-colors ${metric.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                                        >
                                            <span className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all ${metric.is_active ? 'left-5' : 'left-1'}`} />
                                        </button>
                                    </td>
                                    <td className="p-4 text-center">
                                        {metric.data_source !== 'auto' && (
                                            <button
                                                onClick={() => handleDelete(metric)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-50 border-t border-slate-200">
                                <td colSpan={4} className="p-4 text-right font-bold text-slate-700">Tổng trọng số:</td>
                                <td className="p-4 text-center">
                                    <span className={`text-lg font-black ${totalPercent === 100 ? 'text-green-600' : totalPercent > 100 ? 'text-red-600' : 'text-amber-600'}`}>
                                        {totalPercent}%
                                    </span>
                                </td>
                                <td colSpan={3}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Info */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">📌 Hướng dẫn</h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    <li><strong>% Lương</strong>: Tỷ lệ lương cơ bản gắn với chỉ số KPI này. Tổng tất cả chỉ số nên = 100%.</li>
                    <li><strong>Target /tháng</strong>: Mục tiêu cần đạt trong 1 tháng. Có thể override riêng cho từng nhân viên.</li>
                    <li><strong>Tự động</strong>: Hệ thống tự đếm từ CRM (cuộc gọi, data, doanh số). <strong>Nhập tay</strong>: Nhân viên báo cáo hàng ngày.</li>
                    <li><strong>Công thức</strong>: Lương KPI = Lương cơ bản × Σ(min(thực tế/target, 1) × % Lương)</li>
                </ul>
            </div>
        </div>
    );
}
