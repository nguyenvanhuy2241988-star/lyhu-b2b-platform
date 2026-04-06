"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { ClipboardList, Camera, Film, Plus, Clock, CheckCircle, XCircle, Pencil, Search, Filter, Users } from "lucide-react";
import MediaProjectModal from "@/components/media/MediaProjectModal";

const STATUS_COLUMNS = [
    { key: "planned", label: "Kế hoạch", color: "bg-slate-500", border: "border-slate-500" },
    { key: "shooting", label: "Chụp/Quay", color: "bg-amber-500", border: "border-amber-500" },
    { key: "editing", label: "Dựng/Chỉnh", color: "bg-blue-500", border: "border-blue-500" },
    { key: "review", label: "Review", color: "bg-purple-500", border: "border-purple-500" },
    { key: "completed", label: "Hoàn thành", color: "bg-green-500", border: "border-green-500" },
];

const PRIORITY_BADGES: Record<string, string> = {
    urgent: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    normal: "bg-slate-100 text-slate-600",
    low: "bg-slate-50 text-slate-400",
};

export default function AdminMediaProjectsPage() {
    const supabase = createClient();
    const { user } = useAuth();
    const [projects, setProjects] = useState<any[]>([]);
    const [mediaUsers, setMediaUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [assigneeFilter, setAssigneeFilter] = useState("all");
    const [modalDefaultStatus, setModalDefaultStatus] = useState<string>("planned");

    // Drag and Drop State
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverCol, setDragOverCol] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Load all projects except cancelled
            const { data: pData } = await supabase
                .from("media_projects")
                .select("*, assignee:assigned_to(full_name)")
                .neq("status", "cancelled")
                .order("created_at", { ascending: false });
            
            // Load media users for filter
            const { data: uData } = await supabase.rpc('get_users_activity_stats');
            if (uData) {
                setMediaUsers(uData.filter((u: any) => u.role === 'media_creator' || u.role === 'admin' || u.role === 'marketing'));
            }

            setProjects(pData || []);
        } catch (err) {
            console.error("loadData error:", err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => { loadData(); }, [loadData]);

    const updateStatus = async (id: string, newStatus: string) => {
        // Optimistic update
        setProjects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
        
        const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
        if (newStatus === "completed") updates.completed_at = new Date().toISOString();
        
        await supabase.from("media_projects").update(updates).eq("id", id);
        // Background sync
        loadData();
    };

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggingId(id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
        setTimeout(() => {
            const el = document.getElementById(`admin-project-${id}`);
            if (el) el.classList.add("opacity-50");
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent, id: string) => {
        setDraggingId(null);
        setDragOverCol(null);
        const el = document.getElementById(`admin-project-${id}`);
        if (el) el.classList.remove("opacity-50");
    };

    const handleDragOver = (e: React.DragEvent, colKey: string) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = "move";
        if (dragOverCol !== colKey) setDragOverCol(colKey);
    };

    const handleDragLeave = (e: React.DragEvent, colKey: string) => {
        e.preventDefault();
        if (dragOverCol === colKey) setDragOverCol(null);
    };

    const handleDrop = (e: React.DragEvent, colKey: string) => {
        e.preventDefault();
        setDragOverCol(null);
        const id = e.dataTransfer.getData("text/plain");
        if (id && draggingId === id) {
            const project = projects.find(p => p.id === id);
            if (project && project.status !== colKey) {
                updateStatus(id, colKey);
            }
        }
    };

    const openModalForNew = (defaultStatus: string = "planned") => {
        setSelectedProject(null);
        setModalDefaultStatus(defaultStatus);
        setIsModalOpen(true);
    };

    const filteredProjects = projects.filter(p => {
        if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;
        if (typeFilter !== 'all' && p.media_type !== typeFilter) return false;
        if (assigneeFilter !== 'all') {
            if (assigneeFilter === "unassigned" && p.assigned_to !== null) return false;
            if (assigneeFilter !== "unassigned" && p.assigned_to !== assigneeFilter) return false;
        }
        return true;
    });

    const getColumnProjects = (statusKey: string) => filteredProjects.filter(p => p.status === statusKey);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Quản trị Dự án Media</h1>
                    <p className="text-sm text-slate-500 mt-1">Giám sát và điều phối toàn bộ dự án của phòng Media</p>
                </div>
                <button
                    onClick={() => openModalForNew("planned")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Tạo & Giao Dự án
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm dự án..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400 ml-1" />
                    <select
                        value={assigneeFilter}
                        onChange={(e) => setAssigneeFilter(e.target.value)}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                    >
                        <option value="all">Tất cả nhân sự</option>
                        <option value="unassigned">⚠ Chưa phân công</option>
                        {mediaUsers.map(u => (
                            <option key={u.user_id} value={u.user_id}>{u.full_name}</option>
                        ))}
                    </select>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tất cả loại hình</option>
                        <option value="photo">Chỉ Ảnh</option>
                        <option value="video">Chỉ Video</option>
                        <option value="both">Ảnh + Video</option>
                    </select>
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Mọi mức độ</option>
                        <option value="urgent">Gấp!</option>
                        <option value="high">Cao</option>
                        <option value="normal">Bình thường</option>
                    </select>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
                    ))}
                </div>
            ) : (
                /* Kanban Board */
                <div className="flex gap-4 overflow-x-auto pb-6 h-[calc(100vh-220px)] min-h-[500px]">
                    {STATUS_COLUMNS.map(col => {
                        const colProjects = getColumnProjects(col.key);
                        const isOver = dragOverCol === col.key;
                        
                        return (
                            <div 
                                key={col.key} 
                                className="min-w-[280px] flex-1 flex flex-col"
                                onDragOver={(e) => handleDragOver(e, col.key)}
                                onDragLeave={(e) => handleDragLeave(e, col.key)}
                                onDrop={(e) => handleDrop(e, col.key)}
                            >
                                <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${col.border}`}>
                                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{col.label}</h3>
                                    <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full ml-auto">
                                        {colProjects.length}
                                    </span>
                                </div>
                                
                                <div className={`flex-1 overflow-y-auto space-y-3 p-2 -mx-2 rounded-xl transition-colors flex flex-col ${isOver ? 'bg-slate-100 ring-2 ring-blue-400 ring-inset' : 'bg-slate-50/50'}`}>
                                    {colProjects.map(project => (
                                        <div 
                                            key={project.id} 
                                            id={`admin-project-${project.id}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, project.id)}
                                            onDragEnd={(e) => handleDragEnd(e, project.id)}
                                            onClick={() => { setSelectedProject(project); setIsModalOpen(true); }}
                                            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-grab active:cursor-grabbing group relative"
                                        >
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-600 text-slate-500 rounded-lg">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="flex items-start justify-between mb-2 pr-6">
                                                <h4 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">{project.title}</h4>
                                            </div>
                                            
                                            {/* Assignee Badge */}
                                            <div className="mb-2">
                                                {project.assignee ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 max-w-full">
                                                        <Users className="w-3 h-3 shrink-0" />
                                                        <span className="truncate">{project.assignee.full_name}</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                                                        <Users className="w-3 h-3" />
                                                        Chưa gán người
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGES[project.priority] || PRIORITY_BADGES.normal}`}>
                                                    {project.priority === "urgent" ? "Urgent" : project.priority === "high" ? "High" : project.priority === "low" ? "Low" : "Normal"}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                    {project.media_type === "video" ? <Film className="w-3.5 h-3.5" /> : project.media_type === "both" ? <div className="flex"><Camera className="w-3 h-3"/><Film className="w-3 h-3 -ml-1"/></div> : <Camera className="w-3.5 h-3.5" />}
                                                    <span>{project.media_type === "photo" ? "Photo" : project.media_type === "video" ? "Video" : "Mix"}</span>
                                                    {project.asset_count > 0 && <span className="text-blue-600 font-bold ml-1">· {project.asset_count}</span>}
                                                </div>
                                                {project.deadline && (
                                                    <span className={`text-[11px] font-medium flex items-center gap-1 ${new Date(project.deadline) < new Date() && project.status !== 'completed' ? 'text-red-500' : 'text-slate-500'}`}>
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {new Date(project.deadline).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {colProjects.length === 0 && (
                                        <div className={`flex flex-col items-center justify-center py-6 text-xs font-medium border-2 border-dashed rounded-xl transition-colors ${isOver ? 'border-blue-400 text-blue-500 bg-blue-50' : 'border-slate-200 text-slate-400'}`}>
                                            <div className={`p-2 rounded-full mb-1 ${isOver ? 'bg-blue-100' : 'bg-slate-100'}`}>
                                                <Plus className={`w-4 h-4 ${isOver ? 'text-blue-500 animate-bounce' : 'text-slate-400'}`} />
                                            </div>
                                            {isOver ? "Thả dự án vào đây" : "Kéo thả dự án vào cột"}
                                        </div>
                                    )}

                                    {/* Add Button per Column */}
                                    <button
                                        onClick={() => openModalForNew(col.key)}
                                        className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors group"
                                    >
                                        <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                        Thêm thẻ mới
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <MediaProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadData}
                currentUser={user}
                isAdmin={true} // Allow unassigned editing & assigning any user
                project={selectedProject}
                defaultStatus={modalDefaultStatus}
            />
        </div>
    );
}
