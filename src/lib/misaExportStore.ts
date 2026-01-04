/**
 * MISA Export Utility
 * Generates CSV files formatted for MISA SME / AMIS import.
 */

export function exportRevenueToMISA(orders: any[], customers: any[]) {
    // Header row for MISA (example: Bán hàng chưa thu tiền)
    // Ref: MISA Import Template Columns
    const headers = [
        "Số chứng từ", "Ngày hạch toán", "Ngày chứng từ",
        "Mã khách hàng", "Tên khách hàng", "Mã số thuế",
        "Diễn giải", "TK Nợ", "TK Có", "Số tiền"
    ];

    const rows = orders.map(order => {
        const customer = customers.find(c => c.id === order.customerId);
        return [
            `ORD${order.readableId}`,
            new Date(order.createdAt).toLocaleDateString('vi-VN'),
            new Date(order.createdAt).toLocaleDateString('vi-VN'),
            customer?.misa_code || "",
            order.customerName,
            customer?.tax_code || "",
            `Doanh thu đơn hàng #${order.readableId}`,
            "131", // TK Nợ: Phải thu khách hàng
            "511", // TK Có: Doanh thu bán hàng
            order.totalAmount
        ];
    });

    downloadCSV("MISA_Revenue_Export.csv", [headers, ...rows]);
}

export function exportExpensesToMISA(expenses: any[]) {
    const headers = [
        "Số chứng từ", "Ngày hạch toán", "Ngày chứng từ",
        "Diễn giải", "TK Nợ", "TK Có", "Số tiền", "Loại chi phí"
    ];

    const rows = expenses.map(exp => [
        `EXP${exp.id.slice(0, 6).toUpperCase()}`,
        new Date(exp.spent_at).toLocaleDateString('vi-VN'),
        new Date(exp.spent_at).toLocaleDateString('vi-VN'),
        exp.description,
        exp.accounting_account || "642", // Default to 642 if not set
        "111", // Default to Cash (111) or 112
        exp.amount,
        exp.category
    ]);

    downloadCSV("MISA_Expenses_Export.csv", [headers, ...rows]);
}

export function exportPayrollToMISA(earnings: any[], month: number, year: number) {
    const headers = [
        "Số chứng từ", "Ngày hạch toán", "Ngày chứng từ",
        "Diễn giải", "Mã nhân viên", "Tên nhân viên",
        "TK Nợ", "TK Có", "Số tiền", "Loại lương"
    ];

    const rows: any[][] = [];

    earnings.forEach(e => {
        const docDate = new Date(year, month, 0).toLocaleDateString('vi-VN'); // Last day of month

        // 1. Hạch toán lương cơ bản
        if (e.baseSalary > 0) {
            rows.push([
                `PAY${month}${year}`,
                docDate,
                docDate,
                `Lương cơ bản tháng ${month}/${year} - ${e.user.name}`,
                e.user.email, // Use email as mock code
                e.user.name,
                "6421", // Chi phí nhân viên
                "334",  // Phải trả người lao động
                e.baseSalary,
                "Lương cơ bản"
            ]);
        }

        // 2. Hạch toán hoa hồng
        if (e.commissions > 0) {
            rows.push([
                `COM${month}${year}`,
                docDate,
                docDate,
                `Hoa hồng tháng ${month}/${year} - ${e.user.name}`,
                e.user.email,
                e.user.name,
                "6411", // Chi phí bán hàng
                "334",
                e.commissions,
                "Hoa hồng"
            ]);
        }

        // 3. Hạch toán thưởng
        if (e.bonuses > 0) {
            rows.push([
                `BN${month}${year}`,
                docDate,
                docDate,
                `Thưởng tháng ${month}/${year} - ${e.user.name}`,
                e.user.email,
                e.user.name,
                "6421",
                "334",
                e.bonuses,
                "Khen thưởng"
            ]);
        }
    });

    downloadCSV(`MISA_Payroll_${month}_${year}.csv`, [headers, ...rows]);
}

function downloadCSV(filename: string, data: any[][]) {
    // Add BOM for Excel UTF-8 support
    const BOM = '\uFEFF';
    const csvContent = BOM + data.map(row =>
        row.map(cell => {
            const str = String(cell).replace(/"/g, '""');
            return `"${str}"`;
        }).join(",")
    ).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
