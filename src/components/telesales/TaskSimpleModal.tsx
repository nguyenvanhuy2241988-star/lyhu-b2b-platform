"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, User, FileText, Paperclip, Link as LinkIcon, Image as ImageIcon, CheckSquare, Plus } from "lucide-react";
import { TelesalesTask, SubtaskItem, packMetadataToNote } from "@/lib/telesalesTasksStore";
import { supabase } from "@/lib/supabaseClient";

interface TaskSimpleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Partial<TelesalesTask>) => void;
    currentUser: any; // User object from auth
}

interface Profile {
    id: string;
    full_name: string;
    email: string;
}

export const TaskSimpleModal = ({ isOpen, onClose, onSave, currentUser }: TaskSimpleModalProps) => {
    // const supabase = createClient(); // Switched to shared singleton
    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState<string>("");
    const [priority, setPriority] = useState("normal"); // Phase B: Added
    const [status, setStatus] = useState("today"); // Phase B: Added
    const [stage, setStage] = useState("in_progress");
    const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [leaderId, setLeaderId] = useState("");
    const [note, setNote] = useState("");
    const [attachments, setAttachments] = useState<{ type: 'image' | 'file' | 'link'; url: string; name: string; }[]>([]);

    // Profiles
    const [profiles, setProfiles] = useState<Profile[]>([]);

    // Attachment input state
    const [isAttachOpen, setIsAttachOpen] = useState(false);
    const [linkInput, setLinkInput] = useState("");

    // Load profiles on mount
    useEffect(() => {
        let mounted = true;
        const loadProfiles = async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, full_name, email")
                .order("full_name", { ascending: true });

            if (mounted && !error) {
                setProfiles(data || []);
            }
        };
        loadProfiles();
        return () => { mounted = false; };
    }, []);

    const [hasDraftRestored, setHasDraftRestored] = useState(false);

    // Reset or restore draft
    useEffect(() => {
        if (isOpen) {
            const todayStr = new Date().toISOString().split('T')[0];
            const draftStr = typeof window !== 'undefined' ? localStorage.getItem('lyhu_task_simple_draft') : null;

            if (draftStr) {
                try {
                    const draft = JSON.parse(draftStr);
                    if (draft.title || draft.note || (draft.subtasks && draft.subtasks.length > 0)) {
                        setTitle(draft.title || "");
                        setDueDate(draft.dueDate !== undefined ? draft.dueDate : todayStr);
                        setPriority(draft.priority || "normal");
                        setStatus(draft.status || "today");
                        setStage(draft.stage || "in_progress");
                        setSubtasks(draft.subtasks || []);
                        setNote(draft.note || "");
                        setAssignedTo(draft.assignedTo || currentUser?.id || "");
                        setAssigneeIds(draft.assigneeIds || (currentUser?.id ? [currentUser.id] : []));
                        setLeaderId(draft.leaderId || "");
                        setAttachments(draft.attachments || []);
                        setHasDraftRestored(true);
                        return;
                    }
                } catch (e) { }
            }

            setTitle("");
            setDueDate(todayStr); // Default to today!
            setPriority("normal");
            setStatus("today");
            setStage("in_progress");
            setSubtasks([]);
            setNewSubtaskTitle("");
            setAssignedTo(currentUser?.id || "");
            setAssigneeIds(currentUser?.id ? [currentUser.id] : []);
            setLeaderId("");
            setNote("");
            setAttachments([]);
            setIsAttachOpen(false);
            setLinkInput("");
            setHasDraftRestored(false);
        }
    }, [isOpen, currentUser]);

    // Auto-save draft
    useEffect(() => {
        if (isOpen) {
            if (title || note || subtasks.length > 0 || attachments.length > 0) {
                try {
                    localStorage.setItem('lyhu_task_simple_draft', JSON.stringify({
                        title, dueDate, priority, status, stage, subtasks, note, assignedTo, assigneeIds, leaderId, attachments
                    }));
                } catch (e) { }
            }
        }
    }, [isOpen, title, dueDate, priority, status, stage, subtasks, note, assignedTo, assigneeIds, leaderId, attachments]);

    const handleClearDraft = () => {
        try {
            localStorage.removeItem('lyhu_task_simple_draft');
        } catch (e) { }
        const todayStr = new Date().toISOString().split('T')[0];
        setTitle("");
        setDueDate(todayStr);
        setPriority("normal");
        setStatus("today");
        setStage("in_progress");
        setSubtasks([]);
        setNewSubtaskTitle("");
        setNote("");
        setHasDraftRestored(false);
    };

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        if (newStatus === 'today') {
            setDueDate(todayStr);
        } else if (newStatus === 'tomorrow') {
            const tmr = new Date(today);
            tmr.setDate(tmr.getDate() + 1);
            setDueDate(tmr.toISOString().split('T')[0]);
        } else if (newStatus === 'this_week') {
            const thisWeek = new Date(today);
            thisWeek.setDate(today.getDate() + 4);
            setDueDate(thisWeek.toISOString().split('T')[0]);
        } else if (newStatus === 'inbox') {
            setDueDate("");
        }
    };

    const handleDueDateChange = (newDateStr: string) => {
        setDueDate(newDateStr);
        if (newDateStr) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const target = new Date(newDateStr);
            target.setHours(0, 0, 0, 0);
            const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 0) setStatus('today');
            else if (diffDays === 1) setStatus('tomorrow');
            else if (diffDays > 1 && diffDays <= 7) setStatus('this_week');
            else if (diffDays < 0) setStatus('inbox');
        } else {
            setStatus('inbox');
        }
    };

    const handleAddSubtask = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newSubtaskTitle.trim()) return;
        const newSub: SubtaskItem = {
            id: `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            title: newSubtaskTitle.trim(),
            completed: false
        };
        setSubtasks(prev => [...prev, newSub]);
        setNewSubtaskTitle("");
    };

    const handleToggleSubtask = (subId: string) => {
        setSubtasks(prev => prev.map(s => s.id === subId ? { ...s, completed: !s.completed } : s));
    };

    const handleDeleteSubtask = (subId: string) => {
        setSubtasks(prev => prev.filter(s => s.id !== subId));
    };

    const handleSave = async () => {
        if (!title.trim()) return alert("Vui lòng nhập tên công việc");

        let finalSubtasks = [...subtasks];
        if (newSubtaskTitle.trim()) {
            finalSubtasks.push({
                id: `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                title: newSubtaskTitle.trim(),
                completed: false
            });
            setSubtasks(finalSubtasks);
            setNewSubtaskTitle("");
        }

        // Guarantee due_date for today/tomorrow/this_week
        let finalDueDate = dueDate;
        const todayStr = new Date().toISOString().split('T')[0];
        if (status === 'today' && !finalDueDate) {
            finalDueDate = todayStr;
        } else if (status === 'tomorrow' && !finalDueDate) {
            const tmr = new Date();
            tmr.setDate(tmr.getDate() + 1);
            finalDueDate = tmr.toISOString().split('T')[0];
        } else if (status === 'this_week' && !finalDueDate) {
            const thisWeek = new Date();
            thisWeek.setDate(thisWeek.getDate() + 4);
            finalDueDate = thisWeek.toISOString().split('T')[0];
        }

        try {
            await onSave({
                title,
                priority: priority as any || 'normal',
                status: status as any || 'today',
                stage,
                subtasks: finalSubtasks,
                due_date: finalDueDate ? new Date(finalDueDate).toISOString() : null,
                note: packMetadataToNote(note, finalSubtasks, stage),
                type: 'task',
                assigned_to: assignedTo || currentUser?.id,
                assignee_ids: assigneeIds,
                leader_id: leaderId,
                attachments: attachments
            });
            try {
                localStorage.removeItem('lyhu_task_simple_draft');
            } catch (e) { }
            setHasDraftRestored(false);
            onClose();
        } catch (error) {
            console.error("Error saving task:", error);
            alert("Có lỗi xảy ra khi tạo công việc. Vui lòng thử lại.");
        }
    };

    const handleAddLink = () => {
        if (linkInput.trim()) {
            setAttachments([...attachments, { type: 'link', url: linkInput, name: linkInput }]);
            setLinkInput("");
            setIsAttachOpen(false);
        }
    };

    const getMimeType = (file: File): string => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const mimeMap: Record<string, string> = {
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ppt: 'application/vnd.ms-powerpoint',
            pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            txt: 'text/plain',
            csv: 'text/csv',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            webp: 'image/webp',
            gif: 'image/gif',
            zip: 'application/zip',
            rar: 'application/x-rar-compressed'
        };
        if (ext && mimeMap[ext]) return mimeMap[ext];
        return file.type || 'application/octet-stream';
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;
        const determinedMime = getMimeType(file);

        try {
            const { data, error } = await supabase.storage
                .from('task_attachments')
                .upload(filePath, file, {
                    contentType: determinedMime,
                    upsert: true
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('task_attachments')
                .getPublicUrl(filePath);

            const type = determinedMime.startsWith('image/') ? 'image' : 'file';
            setAttachments(prev => [...prev, {
                type,
                url: publicUrlData.publicUrl,
                name: file.name
            }]);
            setIsAttachOpen(false);
        } catch (error: any) {
            console.error("Upload error:", error);
            alert(`Lỗi upload tài liệu/ảnh: ${error.message || JSON.stringify(error)}`);
        } finally {
            if (e.target) e.target.value = '';
        }
    };

    if (!isOpen) return null;

    // Derived Display Name
    const currentAssigneeName = profiles.find(p => p.id === assignedTo)?.full_name || profiles.find(p => p.id === assignedTo)?.email || 'Tôi';
    const assigneeNames = profiles.filter(p => assigneeIds.includes(p.id)).map(p => p.full_name || p.email).join(', ');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">Thêm việc mới</h3>
                        {hasDraftRestored && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[11px] font-medium">
                                <span>📝 Tự khôi phục</span>
                                <button
                                    type="button"
                                    onClick={handleClearDraft}
                                    className="text-red-500 hover:text-red-700 underline ml-1 cursor-pointer"
                                    title="Xóa bản nháp và nhập mới"
                                >
                                    Xóa
                                </button>
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Title */}
                    <div>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Tên công việc cần làm..."
                            className="w-full text-lg font-medium placeholder:text-slate-400 border-none focus:ring-0 p-0 text-slate-900"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Priority, Stage & Column */}
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Độ ưu tiên</label>
                            <select
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00AFA9] bg-white cursor-pointer"
                                value={priority}
                                onChange={e => setPriority(e.target.value)}
                            >
                                <option value="low">Thấp</option>
                                <option value="normal">Bình thường</option>
                                <option value="high">Cao</option>
                                <option value="urgent">Khẩn</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Giai đoạn</label>
                            <select
                                className="w-full px-2.5 py-1.5 border border-teal-200 bg-teal-50/50 rounded-lg text-xs sm:text-sm font-medium text-teal-800 focus:outline-none focus:ring-2 focus:ring-[#00AFA9] cursor-pointer"
                                value={stage}
                                onChange={e => setStage(e.target.value)}
                            >
                                <option value="not_started">Chưa làm</option>
                                <option value="in_progress">Đang làm</option>
                                <option value="waiting">Chờ duyệt</option>
                                <option value="completed">Đã xong</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Cột Kanban</label>
                            <select
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00AFA9] bg-white cursor-pointer font-medium"
                                value={status}
                                onChange={e => handleStatusChange(e.target.value)}
                            >
                                <option value="today">Hôm nay</option>
                                <option value="tomorrow">Ngày mai</option>
                                <option value="this_week">Tuần này</option>
                                <option value="inbox">Hộp thư đến</option>
                            </select>
                        </div>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap gap-3">
                        {/* Due Date */}
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="date"
                                className={`w-full px-3 py-1.5 border rounded-lg text-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00AFA9] font-medium ${dueDate ? 'bg-white border-[#00AFA9] text-[#00AFA9]' : 'bg-slate-50 border-dashed border-slate-300 text-slate-400'}`}
                                value={dueDate}
                                onChange={(e) => handleDueDateChange(e.target.value)}
                                title="Thời gian hoàn thành"
                            />
                        </div>

                        {/* Assignees (Multi) */}
                        <div className="flex-1 min-w-[200px] border border-slate-200 rounded-lg p-2 bg-slate-50">
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tight">Người phối hợp ({assigneeIds.length})</label>
                            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto mb-2">
                                {profiles.filter(p => assigneeIds.includes(p.id)).map(p => (
                                    <span key={p.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-700">
                                        {p.full_name || p.email}
                                        <button onClick={() => setAssigneeIds(prev => prev.filter(id => id !== p.id))} className="text-slate-400 hover:text-red-500">
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </span>
                                ))}
                                {assigneeIds.length === 0 && <span className="text-[10px] text-slate-400 italic">Chọn bên dưới...</span>}
                            </div>
                            <select
                                className="w-full bg-transparent border-none text-[11px] font-medium focus:ring-0 p-0 text-[#00AFA9] outline-none cursor-pointer"
                                value=""
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val && !assigneeIds.includes(val)) {
                                        setAssigneeIds([...assigneeIds, val]);
                                    }
                                }}
                            >
                                <option value="">+ Thêm người phối hợp...</option>
                                {profiles.map(p => (
                                    <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                                ))}
                            </select>
                        </div>

                        {/* Leader */}
                        <div className={`flex-1 min-w-[150px] border rounded-lg p-2 transition-colors ${leaderId ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-slate-50'}`}>
                            <label className="block text-[10px] font-bold text-blue-600 mb-1 uppercase tracking-tight">Trưởng nhóm</label>
                            <select
                                className="w-full bg-transparent border-none text-[11px] font-semibold focus:ring-0 p-0 text-slate-700 outline-none cursor-pointer"
                                value={leaderId}
                                onChange={(e) => setLeaderId(e.target.value)}
                            >
                                <option value="">-- Chọn trưởng nhóm --</option>
                                {profiles.filter(p => assigneeIds.includes(p.id)).map(p => (
                                    <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Checklist / Subtasks */}
                    <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                                <CheckSquare className="w-3.5 h-3.5 text-[#00AFA9]" />
                                Các bước thực hiện ({subtasks.filter(s => s.completed).length}/{subtasks.length})
                            </label>
                            {subtasks.length > 0 && (
                                <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                                    {Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100)}%
                                </span>
                            )}
                        </div>

                        {/* Subtasks List */}
                        {subtasks.length > 0 && (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto mb-2">
                                {subtasks.map((st) => (
                                    <div
                                        key={st.id}
                                        className={`flex items-center gap-2 p-1.5 rounded-md border text-xs transition-colors ${st.completed ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200 text-slate-800'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={st.completed}
                                            onChange={() => handleToggleSubtask(st.id)}
                                            className="w-3.5 h-3.5 text-[#00AFA9] rounded border-slate-300 focus:ring-[#00AFA9] cursor-pointer"
                                        />
                                        <span className={`flex-1 ${st.completed ? 'line-through text-slate-400' : 'font-medium'}`}>
                                            {st.title}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteSubtask(st.id)}
                                            className="text-slate-400 hover:text-red-500 p-0.5 rounded hover:bg-slate-100 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Subtask Input */}
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                placeholder="Thêm bước (vd: 1. Làm đối chiếu công nợ)..."
                                className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#00AFA9]"
                                value={newSubtaskTitle}
                                onChange={e => setNewSubtaskTitle(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleAddSubtask();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleAddSubtask}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-[#00AFA9] text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" />
                                Thêm
                            </button>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="relative">
                        <textarea
                            placeholder="Ghi chú thêm..."
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00AFA9] resize-none"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    {/* Attachments List */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {attachments.map((att, idx) => (
                                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md text-xs border border-slate-200 max-w-full">
                                    {att.type === 'image' && <ImageIcon className="w-3 h-3 text-[#00AFA9]" />}
                                    {att.type === 'file' && <FileText className="w-3 h-3 text-blue-500" />}
                                    {att.type === 'link' && <LinkIcon className="w-3 h-3 text-green-500" />}
                                    <a
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="truncate max-w-[150px] hover:text-[#00AFA9] hover:underline"
                                        title={att.name}
                                    >
                                        {att.name}
                                    </a>
                                    <button
                                        onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                                        className="ml-1 text-slate-400 hover:text-red-500"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Attachment Actions */}
                    <div className="flex items-center gap-2 relative">
                        <button
                            onClick={() => setIsAttachOpen(!isAttachOpen)}
                            className="flex items-center gap-1.5 text-sm text-[#00AFA9] font-medium hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Paperclip className="w-4 h-4" />
                            Đính kèm
                        </button>

                        {isAttachOpen && (
                            <div className="absolute left-0 top-full mt-2 bg-white rounded-lg border border-slate-200 p-2 z-10 w-64 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100">
                                <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded cursor-pointer text-sm text-slate-700">
                                    <ImageIcon className="w-4 h-4 text-[#00AFA9]" />
                                    <span>Tải ảnh lên</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </label>
                                <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded cursor-pointer text-sm text-slate-700">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                    <span>Tải tệp lên</span>
                                    <input type="file" className="hidden" onChange={handleFileChange} />
                                </label>
                                <div className="border-t border-slate-100 my-1"></div>
                                <div className="p-2">
                                    <input
                                        type="text"
                                        placeholder="Dán liên kết..."
                                        className="w-full px-2 py-1 text-sm border border-slate-200 rounded mb-1 focus:outline-none focus:border-[#00AFA9]"
                                        value={linkInput}
                                        onChange={(e) => setLinkInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                                    />
                                    <button
                                        onClick={handleAddLink}
                                        className="w-full text-xs bg-[#00AFA9] text-white rounded py-1 hover:bg-[#009690]"
                                    >
                                        Thêm Link
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 text-sm font-medium text-white bg-[#00AFA9] hover:bg-[#009690] rounded-lg shadow-sm transition-all"
                    >
                        Tạo công việc
                    </button>
                </div>
            </div>
        </div>
    );
};
