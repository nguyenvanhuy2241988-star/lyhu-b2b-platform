"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, User, Phone, Calendar, DollarSign, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchCampaignLeads, MarketingLead } from "@/lib/marketingStore";
import { DEAL_STAGE_LABELS, DealStage } from "@/lib/crmDealsStore";

export default function MarketingLeadsPage() {
    const { session } = useAuth();
    const searchParams = useSearchParams();

    // Get params
    const campaignId = searchParams.get("campaign_id");
    const campaignName = searchParams.get("campaign_name");

    const [leads, setLeads] = useState<MarketingLead[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadLeads = async () => {
            if (session?.access_token && campaignId) {
                setIsLoading(true);
                const data = await fetchCampaignLeads(session.access_token, campaignId);
                setLeads(data);
                setIsLoading(false);
            } else {
                setIsLoading(false);
            }
        };
        loadLeads();
    }, [session, campaignId]);

    if (!campaignId) {
        return (
            <div className="p-8 text-center text-slate-500">
                <p>Vui lòng chọn một chiến dịch để xem danh sách khách hàng.</p>
                <Link href="/marketing" className="text-blue-600 hover:underline mt-2 inline-block">
                    Quay lại Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/marketing" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Danh sách Lead</h1>
                    <p className="text-sm text-slate-500">
                        Chiến dịch: <span className="font-semibold text-blue-600">{campaignName || "Không xác định"}</span>
                    </p>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <span className="font-medium text-slate-700">Tổng số: {leads.length} khách hàng</span>
                    </div>

                    {leads.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Khách hàng</th>
                                        <th className="px-6 py-3 font-medium">Liên hệ</th>
                                        <th className="px-6 py-3 font-medium">Trạng thái xử lý</th>
                                        <th className="px-6 py-3 font-medium">Sale phụ trách</th>
                                        <th className="px-6 py-3 font-medium text-right">Doanh thu dự kiến</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {leads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{lead.title}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                    <User className="w-3 h-3" />
                                                    {lead.customer_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    {lead.phone || "---"}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(lead.created_at).toLocaleDateString('vi-VN')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700`}>
                                                    {DEAL_STAGE_LABELS[lead.stage as DealStage] || lead.stage}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {lead.owner_name ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                            {lead.owner_name.charAt(0)}
                                                        </div>
                                                        <span className="text-slate-700">{lead.owner_name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Chưa phân công</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-900">
                                                {lead.expected_value
                                                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(lead.expected_value)
                                                    : '-'
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-500">
                            Chưa có dữ liệu khách hàng từ chiến dịch này.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
