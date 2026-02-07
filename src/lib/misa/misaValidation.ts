
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}

export const MisaValidation = {
    validateOrder: (order: any, config: any): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 1. Validate Config
        if (!config?.accessCode) errors.push("Chưa cấu hình Access Code MISA");
        if (!config?.companyCode) errors.push("Chưa cấu hình Mã chi nhánh (Company Code)");

        // 2. Validate Customer
        const customerName = order.customerName || order.customer?.name;
        const customerPhone = order.receiverPhone || order.customer?.phone;

        if (!customerName) errors.push("Thiếu tên khách hàng");
        // MISA requires a customer code. We usually derive this from Phone.
        if (!customerPhone) {
            warnings.push("Thiếu số điện thoại khách hàng (Sẽ dùng mã mặc định KH_LE)");
        }

        // 3. Validate Items
        if (!order.items || order.items.length === 0) {
            errors.push("Đơn hàng không có sản phẩm nào");
        } else {
            order.items.forEach((item: any, index: number) => {
                const rowNum = index + 1;
                const productName = item.product?.name || item.name || `Sản phẩm #${rowNum}`;

                // Check MISA Code
                const misaCode = item.product?.misa_code;
                if (!misaCode) {
                    errors.push(`Sản phẩm "${productName}" chưa có Mã MISA (misa_code)`);
                }

                // Check Unit
                const unit = item.product?.unit || item.unit;
                if (!unit) {
                    warnings.push(`Sản phẩm "${productName}" thiếu Đơn vị tính (Sẽ dùng mặc định 'Gói')`);
                }

                // Check Price (Warn if 0, but maybe valid for gifts)
                if ((item.price || 0) <= 0 && !item.isGift) {
                    warnings.push(`Sản phẩm "${productName}" có giá bán bằng 0`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
};
