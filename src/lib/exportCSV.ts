/**
 * CSV Export utility functions
 */

export interface CSVColumn<T> {
    header: string;
    accessor: keyof T | ((item: T) => string | number);
}

/**
 * Convert array of objects to CSV string
 */
export function objectsToCSV<T>(data: T[], columns: CSVColumn<T>[]): string {
    // Header row
    const header = columns.map(col => `"${col.header}"`).join(',');

    // Data rows
    const rows = data.map(item => {
        return columns.map(col => {
            let value: string | number;
            if (typeof col.accessor === 'function') {
                value = col.accessor(item);
            } else {
                value = item[col.accessor] as string | number;
            }
            // Escape quotes and wrap in quotes
            if (typeof value === 'string') {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
        }).join(',');
    });

    return [header, ...rows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${formatDateForFile(new Date())}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Format date for filename
 */
function formatDateForFile(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

/**
 * Export orders to CSV
 */
export function exportOrdersToCSV(orders: any[]): void {
    const columns: CSVColumn<any>[] = [
        { header: 'Mã đơn', accessor: (o) => o.readableId || o.id },
        { header: 'Khách hàng', accessor: 'customerName' },
        { header: 'Tổng tiền', accessor: 'totalAmount' },
        { header: 'Trạng thái', accessor: 'status' },
        { header: 'Nguồn', accessor: 'source' },
        { header: 'Ngày tạo', accessor: (o) => new Date(o.createdAt).toLocaleDateString('vi-VN') },
    ];

    const csv = objectsToCSV(orders, columns);
    downloadCSV(csv, 'don_hang');
}

/**
 * Export inventory to CSV
 */
export function exportInventoryToCSV(inventory: any[]): void {
    const columns: CSVColumn<any>[] = [
        { header: 'Sản phẩm', accessor: 'productName' },
        { header: 'SKU', accessor: 'sku' },
        { header: 'Tồn thực tế', accessor: 'quantityOnHand' },
        { header: 'Đang giữ', accessor: 'quantityCommitted' },
        { header: 'Có thể bán', accessor: (i) => i.quantityOnHand - i.quantityCommitted },
        { header: 'Kho', accessor: 'warehouseName' },
    ];

    const csv = objectsToCSV(inventory, columns);
    downloadCSV(csv, 'ton_kho');
}
