"use client";

// --- Imports ---
import { useState, useEffect } from "react";
import { Phone, CheckCircle, XCircle, Clock, Filter, Search, ClipboardList, Loader2 } from "lucide-react";
import { fetchSalesLeads, SalesLead } from "@/lib/salesLeads"; // fetchSalesLeads
import { CreateTaskModal } from "@/components/telesales/CreateTaskModal";
import { addTask } from "@/lib/telesalesTasksStore";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LeadsQueuePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [leads, setLeads] = useState<SalesLead[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { user, isLoading: authIsLoading } = useAuth(); // Need auth context

    useEffect(() => {
        let mounted = true;

        const fetchLeads = async () => {
            setIsLoading(true);
            try {
                const data = await fetchSalesLeads(user?.id);

                if (!mounted) return;

                setLeads(data ?? []);
            } catch (error) {
                console.error("fetchSalesLeads error:", error);
                if (mounted) setLeads([]);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        if (user?.id) {
            fetchLeads();
        } else if (!authIsLoading) {
            setIsLoading(false);
        }

        return () => {
            mounted = false;
        };
    }, [user?.id, authIsLoading]);

    // Modal state
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [selectedLeadForTask, setSelectedLeadForTask] = useState<SalesLead | null>(null);

    // Apply filters
    const filteredLeads = leads.filter((lead) => {
        const matchesSearch =
            (lead.storeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead.contactName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead.phone || "").includes(searchTerm);

        const matchesStatus = statusFilter === "all" ||
            (lead.status.toLowerCase() === statusFilter.toLowerCase());

        return matchesSearch && matchesStatus;
    });

    const handleOpenCreateTask = (lead: SalesLead) => {
        setSelectedLeadForTask(lead);
        setIsCreateTaskModalOpen(true);
    };

    const handleSaveTask = async (taskData: any) => {
        await addTask(taskData);
        // Optional: show toast or feedback
        console.log("Created task for lead:", selectedLeadForTask?.id);
        setIsCreateTaskModalOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Lead cần gọi</h1>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm khách, SĐT..."
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="new">Mới</option>
                            <option value="contacted">Đã liên hệ</option>
                            <option value="won">Thành công</option>
                            <option value="lost">Thất bại</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Khách hàng / Cửa hàng</th>
                                <th className="px-6 py-3 font-medium">SĐT & Khu vực</th>
                                <th className="px-6 py-3 font-medium">Nguồn</th>
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                                <th className="px-6 py-3 font-medium">Ghi chú</th>
                                <th className="px-6 py-3 font-medium text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLeads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{lead.storeName}</div>
                                        <div className="text-xs text-slate-500">{lead.contactName}</div>
                                        <div className="text-xs text-slate-400 mt-1">{lead.type}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-900 font-medium">{lead.phone}</div>
                                        <div className="text-xs text-slate-500">{lead.area}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                            TELESALES
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lead.status === 'NEW' ? 'bg-blue-100 text-blue-800' :
                                            lead.status === 'CONTACTED' ? 'bg-yellow-100 text-yellow-800' :
                                                lead.status === 'WON' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'
                                            }`}>
                                            {lead.status === 'NEW' ? 'Mới' :
                                                lead.status === 'CONTACTED' ? 'Đã liên hệ' :
                                                    lead.status === 'WON' ? 'Đã chốt' : lead.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-slate-600 max-w-[200px] truncate" title={lead.notes}>
                                            {lead.notes}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenCreateTask(lead)}
                                                className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                                                title="Tạo việc cần làm"
                                            >
                                                <ClipboardList className="w-4 h-4" />
                                            </button>
                                            <button className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors" title="Gọi điện">
                                                <Phone className="w-4 h-4" />
                                            </button>
                                            <div className="relative group">
                                                <button className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">
                                                    <Clock className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredLeads.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="w-8 h-8 text-slate-300" />
                                            <p>Chưa có lead nào</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateTaskModal
                isOpen={isCreateTaskModalOpen}
                onClose={() => setIsCreateTaskModalOpen(false)}
                onSave={handleSaveTask}
                initialStatus="today"
                initialData={selectedLeadForTask ? {
                    title: `Gọi lại ${selectedLeadForTask.storeName}`,
                    customer_name: selectedLeadForTask.storeName,
                    phone: selectedLeadForTask.phone,
                    type: "task" // Phase 3: Changed from "lead" to "task"
                } : {}}
            />
        </div>
    );
}
