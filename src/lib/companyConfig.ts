export interface BankAccount {
    bankName: string;
    accountNumber: string;
    accountName: string;
    branch: string;
}

export interface CompanyInfo {
    name: string;
    address: string;
    hotline: string;
    email: string;
    website: string;
}

export const COMPANY_INFO: CompanyInfo & { bankAccounts: BankAccount[] } = {
    name: "CÔNG TY TNHH LYHU",
    address: "Số 123, Đường ABC, Quận XYZ, TP.HCM",
    hotline: "1900 1234",
    email: "contact@lyhu.vn",
    website: "www.lyhu.vn",
    // Bank info for payment method = BANKING
    bankAccounts: [
        {
            bankName: "Ngân hàng Á Châu (ACB)",
            accountNumber: "12345678",
            accountName: "CÔNG TY TNHH LYHU",
            branch: "PGD ABC"
        },
        {
            bankName: "Ngân hàng Quân Đội (MB Bank)",
            accountNumber: "88888888",
            accountName: "CÔNG TY TNHH LYHU",
            branch: "CN XYZ"
        }
    ]
};
