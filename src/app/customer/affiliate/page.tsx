"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { AffiliatePanel } from "@/components/customer/AffiliatePanel";

export default function CustomerAffiliatePage() {
    const { user: authUser } = useAuth();
    
    if (!authUser?.id) {
        return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Quản trị Tiếp thị liên kết</h1>
                <p className="text-slate-500">Chương trình đối tác Affiliate của LYHU</p>
            </div>
            
            <div className="-mx-6 -my-6 sm:mx-0 sm:my-0">
                <AffiliatePanel userId={authUser.id} />
            </div>
        </div>
    );
}
