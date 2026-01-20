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
    address: "Số 11 - Liền kề 9 - Khu đô thị mới Phú Lương - Phường Phú La - Quận Hà Đông - TP Hà Nội",
    hotline: "0969 069 298",
    email: "lyhu.vn@gmail.com",
    website: "www.lyhu.vn",
    // Bank info for payment method = BANKING
    bankAccounts: [
        {
            bankName: "Ngân hàng Techcombank",
            accountNumber: "25811998",
            accountName: "CÔNG TY TNHH LYHU",
            branch: "Chi nhánh Hà Tây"
        },
        {
            bankName: "Ngân hàng TP Bank",
            accountNumber: "00368866368",
            accountName: "NGUYỄN VĂN HUY",
            branch: "Chi nhánh Hà Nội"
        }
    ]
};
