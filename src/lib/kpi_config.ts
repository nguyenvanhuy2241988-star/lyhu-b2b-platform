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
    sales_gt: {
        label: "KPI Sales GT (Thị trường)",
        fields: [
            {
                key: 'kpi_checkins_per_day',
                label: 'Check-in / Ngày',
                type: 'number',
                suffix: 'lượt',
                description: 'Số lượt check-in GPS tại điểm bán mỗi ngày'
            },
            {
                key: 'kpi_new_outlets',
                label: 'Mở mới Điểm bán',
                type: 'number',
                suffix: 'điểm',
                description: 'Số điểm bán mới mở trong tháng'
            },
            {
                key: 'kpi_monthly_revenue',
                label: 'Doanh số Thực thu',
                type: 'currency',
                suffix: 'đ',
                description: 'Tổng tiền đơn hàng giao thành công (Delivered)'
            },
            {
                key: 'kpi_route_completion',
                label: 'Hoàn thành Tuyến',
                type: 'percentage',
                suffix: '%',
                description: '% tuyến được hoàn thành đúng lịch trong tháng'
            },
            {
                key: 'kpi_orders_count',
                label: 'Số đơn hàng',
                type: 'number',
                suffix: 'đơn',
                description: 'Tổng số đơn hàng tạo mới trong tháng'
            },
        ],
        hasCommission: true
    },
    // Future templates for Warehouse, Recruiter, Accountant can be added here
    recruiter: {
        label: "KPI Tuyển dụng",
        fields: [
            {
                key: 'kpi_candidates_sourced',
                label: 'Ứng viên đã Tìm',
                type: 'number',
                suffix: 'ứng viên',
                description: 'Số hồ sơ ứng viên mới tìm/tiếp nhận trong tháng'
            },
            {
                key: 'kpi_interviews_scheduled',
                label: 'Lịch phỏng vấn',
                type: 'number',
                suffix: 'buổi',
                description: 'Số buổi phỏng vấn đã sắp xếp thành công'
            },
            {
                key: 'kpi_hires_closed',
                label: 'Tuyển thành công',
                type: 'number',
                suffix: 'người',
                description: 'Số ứng viên nhận việc (Onboard) trong tháng'
            },
            {
                key: 'kpi_offer_acceptance_rate',
                label: 'Tỷ lệ nhận Offer',
                type: 'percentage',
                suffix: '%',
                description: '% ứng viên chấp nhận offer trên tổng offer gửi'
            },
            {
                key: 'kpi_time_to_fill',
                label: 'Thời gian tuyển TB',
                type: 'number',
                suffix: 'ngày',
                description: 'Số ngày trung bình từ đăng tin đến onboard'
            }
        ],
        hasCommission: false
    },
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
