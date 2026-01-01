"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueDataPoint {
    date: string;
    revenue: number;
    orders: number;
}

interface RevenueChartProps {
    data: RevenueDataPoint[];
    isLoading?: boolean;
}

const formatCurrency = (value: number) => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
};

const formatTooltipValue = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value);
};

export default function RevenueChart({ data, isLoading }: RevenueChartProps) {
    if (isLoading) {
        return (
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                <div className="animate-pulse text-slate-400">Đang tải biểu đồ...</div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg">
                <div className="text-center">
                    <p className="text-sm">Chưa có dữ liệu doanh thu</p>
                    <p className="text-xs text-slate-400 mt-1">Tạo đơn hàng để xem biểu đồ</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        tickFormatter={formatCurrency}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any, name: any) => [
                            formatTooltipValue(Number(value) || 0),
                            name === 'revenue' ? 'Doanh thu' : 'Đơn hàng'
                        ]}
                        labelFormatter={(label) => `Ngày: ${label}`}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
