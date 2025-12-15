"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Plus, MessageSquare, ShoppingCart, Clock } from "lucide-react";
import { CreateTaskModal } from "@/components/telesales/CreateTaskModal";
import { addTask, loadColumns, TelesalesColumn } from "@/lib/telesalesTasksStore";

// Mock Data for Leads (Simulating a store/API)
// In a real app, this would come from a leadsStore or API
const MOCK_LEAD_DETAILS = {
    id: "lead-123",
    name: "Nguyễn Văn A",
    phone: "0909123456",
    email: "vana@example.com",
    source: "Facebook Ads",
    status: "new", // new, contacting, qualified, converted, lost
    address: "123 Đường ABC, Quận 1, TP.HCM",
    notes: "Khách hàng quan tâm đến sản phẩm bia craft.",
    history: [
        { id: 1, action: "Gửi báo giá", date: "2023-10-25T10:00:00Z", user: "Sale 1" },
        { id: 2, action: "Gọi điện lần 1", date: "2023-10-26T14:30:00Z", user: "Sale 1" },
    ]
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'new': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Mới</span>;
        case 'contacting': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Đang liên hệ</span>;
        case 'qualified': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">Tiềm năng</span>;
        case 'converted': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Đã chuyển đổi</span>;
        case 'lost': return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">Đã mất</span>;
        default: return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">{status}</span>;
    }
};

export default function LeadDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const leadId = params.id as string;

    // In reality, fetch lead by ID. For now use mock with ID injection
    const lead = { ...MOCK_LEAD_DETAILS, id: leadId, name: `Khách hàng ${leadId.substring(0, 6)}` };

    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [columns, setColumns] = useState<TelesalesColumn[]>([]);

    useEffect(() => {
        setColumns(loadColumns());
    }, []);

    const handleCreateTask = (taskData: any) => {
        // Enforce inbox status as requested, though modal might allow selection
        // We will pass initialStatus="inbox" to modal
        addTask({
            ...taskData,
            leadId: lead.id,
            relatedLeadId: lead.id,
            customerName: lead.name,
            phone: lead.phone
        });
        alert("Đã tạo việc cần làm thành công!"); // Simple feedback
    };

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Link href="/telesales/leads-queue" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        {lead.name}
                        {getStatusBadge(lead.status)}
                    </h1>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                        <span>ID: {lead.id}</span>
                        <span>•</span>
                        <span>Nguồn: {lead.source}</span>
                    </p>
                </div>
                <div className="ml-auto flex gap-3">
                    <button
                        onClick={() => setIsCreateTaskModalOpen(true)}
                        className="flex items-center gap-2 bg-white border border-primary-600 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors font-medium shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tạo việc cần làm</span>
                    </button>
                    <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm">
                        <ShoppingCart className="w-4 h-4" />
                        <span>Tạo đơn hàng</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Info */}
                <div className="md:col-span-2 space-y-6">
                    {/* Contact Info Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <User className="w-4 h-4 text-primary-600" />
                            Thông tin liên hệ
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <Phone className="w-4 h-4 text-slate-400 mt-1" />
                                <div>
                                    <p className="text-xs text-slate-500">Số điện thoại</p>
                                    <p className="font-medium text-slate-900">{lead.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail className="w-4 h-4 text-slate-400 mt-1" />
                                <div>
                                    <p className="text-xs text-slate-500">Email</p>
                                    <p className="font-medium text-slate-900">{lead.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 sm:col-span-2">
                                <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                                <div>
                                    <p className="text-xs text-slate-500">Địa chỉ</p>
                                    <p className="font-medium text-slate-900">{lead.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary-600" />
                            Ghi chú
                        </h3>
                        <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-line border border-slate-100">
                            {lead.notes}
                        </div>
                    </div>
                </div>

                {/* Right Column: History/Timeline */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary-600" />
                            Lịch sử chăm sóc
                        </h3>
                        <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100">
                            {lead.history.map((item, idx) => (
                                <div key={idx} className="relative pl-8">
                                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-primary-500 box-content"></div>
                                    <p className="text-sm font-medium text-slate-900">{item.action}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {new Date(item.date).toLocaleDateString('vi-VN')} • {item.user}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <CreateTaskModal
                isOpen={isCreateTaskModalOpen}
                onClose={() => setIsCreateTaskModalOpen(false)}
                onSave={handleCreateTask}
                initialStatus="inbox" // Default to Inbox per legacy request
                columns={columns}
                // Pre-fill data if supported by Modal props (will add next if strictly needed, current Modal supports initialStatus only? Need to check)
                initialData={{
                    title: `Gọi lại ${lead.name}`,
                    customerName: lead.name,
                    phone: lead.phone
                }}
            />
        </div>
    );
}
