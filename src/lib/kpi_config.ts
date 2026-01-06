export type KpiFieldType = 'number' | 'currency' | 'percentage';

export interface KpiField {
    key: string;
    label: string;
    type: KpiFieldType;
    suffix?: string;
    description?: string;
}

export interface KpiTemplate {
    label: string;
    fields: KpiField[];
    hasCommission: boolean;
}

export const KPI_TEMPLATES: Record<string, KpiTemplate> = {
    telesales: {
        label: "KPI Telesales FMCG (B2B)",
        fields: [
            {
                key: 'kpi_self_sourced_leads',
                label: 'Data Tự kiếm',
                type: 'number',
                suffix: 'lead',
                description: 'Số khách hàng tiềm năng tự tìm kiếm (Source = Self Sourced)'
            },
            {
                key: 'kpi_logged_activities',
                label: 'Nỗ lực tương tác (Task Done)',
                type: 'number',
                suffix: 'task',
                description: 'Tổng số nhiệm vụ (Gọi/Nhắn tin) đã hoàn thành'
            },
            {
                key: 'kpi_new_outlets',
                label: 'Mở mới Đại lý (Activation)',
                type: 'number',
                suffix: 'đại lý',
                description: 'Số khách hàng mới phát sinh đơn thành công đầu tiên'
            },
            {
                key: 'kpi_monthly_revenue',
                label: 'Doanh số Thực thu',
                type: 'currency',
                suffix: 'đ',
                description: 'Tổng tiền đơn hàng giao thành công (Delivered)'
            },
            {
                key: 'kpi_retention_rate',
                label: 'Tỷ lệ Đặt lại (Retention)',
                type: 'percentage',
                suffix: '%',
                description: '% Khách cũ quay lại đặt hàng trong tháng'
            },
            {
                key: 'kpi_debt_collection',
                label: 'Thu hồi Công nợ',
                type: 'currency',
                suffix: 'đ',
                description: 'Tiền thu về từ công nợ cũ'
            }
        ],
        hasCommission: true
    },
    // Future templates for Warehouse, Recruiter, Accountant can be added here
};

export function formatKpiValue(value: number, type: KpiFieldType): string {
    if (value === undefined || value === null) return '0';

    switch (type) {
        case 'currency':
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
        case 'percentage':
            return `${value}%`;
        default:
            return value.toLocaleString('vi-VN');
    }
}
