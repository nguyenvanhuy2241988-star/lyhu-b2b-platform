"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, User, FileText, Paperclip, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { TelesalesTask } from "@/lib/telesalesTasksStore";
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

    // Reset loop
    useEffect(() => {
        if (isOpen) {
            setTitle("");
            setDueDate("");
            setAssignedTo(currentUser?.id || "");
            setAssigneeIds(currentUser?.id ? [currentUser.id] : []);
            setLeaderId("");
            setNote("");
            setAttachments([]);
            setIsAttachOpen(false);
            setLinkInput("");
        }
    }, [isOpen, currentUser]);

    const handleSave = async () => {
        if (!title.trim()) return alert("Vui lòng nhập tên công việc");

        try {
            await onSave({
                title,
                priority: priority as any || 'normal',
                status: status as any || 'today',
                due_date: dueDate ? new Date(dueDate).toISOString() : null,
                note,
                type: 'task',
                assigned_to: assignedTo || currentUser?.id,
                assignee_ids: assigneeIds,
                leader_id: leaderId
            });
            // Form is reset by useEffect on next open or we can close
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            const type = file.type.startsWith('image/') ? 'image' : 'file';
            setAttachments([...attachments, { type, url, name: file.name }]);
        }
    };

    if (!isOpen) return null;

    // Derived Display Name
    const currentAssigneeName = profiles.find(p => p.id === assignedTo)?.full_name || profiles.find(p => p.id === assignedTo)?.email || 'Tôi';
    const assigneeNames = profiles.filter(p => assigneeIds.includes(p.id)).map(p => p.full_name || p.email).join(', ');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900">Thêm việc mới</h3>
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

                    {/* Priority and Status - Phase B */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Độ ưu tiên</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                            <label className="block text-xs font-medium text-slate-600 mb-1">Cột</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                            >
                                <option value="today">Hôm nay</option>
                                <option value="tomorrow">Ngày mai</option>
                                <option value="this_week">Tuần này</option>
                                <option value="inbox">Inbox</option>
                            </select>
                        </div>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap gap-3">
                        {/* Due Date */}
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="date"
                                className={`w-full px-3 py-1.5 border rounded-lg text-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium ${dueDate ? 'bg-white border-primary-200 text-primary-700' : 'bg-slate-50 border-dashed border-slate-300 text-slate-400'}`}
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
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
                                className="w-full bg-transparent border-none text-[11px] font-medium focus:ring-0 p-0 text-primary-600 outline-none cursor-pointer"
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

                    {/* Note */}
                    <div className="relative">
                        <textarea
                            placeholder="Ghi chú thêm..."
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    {/* Attachments List */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {attachments.map((att, idx) => (
                                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md text-xs border border-slate-200 max-w-full">
                                    {att.type === 'image' && <ImageIcon className="w-3 h-3 text-purple-500" />}
                                    {att.type === 'file' && <FileText className="w-3 h-3 text-blue-500" />}
                                    {att.type === 'link' && <LinkIcon className="w-3 h-3 text-green-500" />}
                                    <span className="truncate max-w-[150px]">{att.name}</span>
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
                            className="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Paperclip className="w-4 h-4" />
                            Đính kèm
                        </button>

                        {isAttachOpen && (
                            <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-10 w-64 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100">
                                <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded cursor-pointer text-sm text-slate-700">
                                    <ImageIcon className="w-4 h-4 text-purple-500" />
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
                                        className="w-full px-2 py-1 text-sm border border-slate-200 rounded mb-1 focus:outline-none focus:border-primary-500"
                                        value={linkInput}
                                        onChange={(e) => setLinkInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                                    />
                                    <button
                                        onClick={handleAddLink}
                                        className="w-full text-xs bg-primary-600 text-white rounded py-1 hover:bg-primary-700"
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
                        className="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-all hover:shadow-md"
                    >
                        Tạo công việc
                    </button>
                </div>
            </div>
        </div>
    );
};
