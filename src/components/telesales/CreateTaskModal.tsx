"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Calendar, User, Phone, UserPlus, CheckCircle, AlertTriangle, Trash2, Eye, Download, CheckSquare, Plus } from "lucide-react";
import {
    TaskStatus,
    TaskPriority,
    TASK_STATUS_LABELS,
    TelesalesTask,
    TelesalesColumn,
    TaskType,
    SubtaskItem,
    TASK_STAGE_LABELS,
    extractTaskMetadata,
    packMetadataToNote,
    TASK_DEPARTMENTS
} from "@/lib/telesalesTasksStore";
import { supabase } from "@/lib/supabaseClient";

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: any) => void;
    onDelete?: (taskId: string) => void; // New: Delete handler
    initialStatus?: TaskStatus;
    initialData?: Partial<TelesalesTask>; // New: Pre-fill data
    columns?: (TelesalesColumn & { column_type?: string })[]; // Support dynamic columns
}

interface TaskFormData {
    title: string;
    customerName: string;
    phone: string;
    priority: TaskPriority;
    dueDate: string;
    status: TaskStatus;
    stage: string;
    description: string;
    department?: string;
    assigneeIds: string[];
    leaderId: string;
}

interface Profile {
    id: string;
    full_name: string;
    email: string;
}

export const CreateTaskModal = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialStatus = "today",
    initialData,
    columns = []
}: CreateTaskModalProps) => {
    const isEditMode = !!initialData?.id;

    // Helper: compute default column and due date
    const computeInitialDateAndStatus = useCallback(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        let defStatus = initialStatus;
        let defDueDate = todayStr;

        // If initialStatus corresponds to today
        const matchedCol = columns.find(c => c.id === initialStatus || c.column_type === initialStatus);
        const colType = matchedCol?.column_type || initialStatus;

        if (colType === 'date_today' || initialStatus === 'today' || matchedCol?.label?.toLowerCase().includes('hôm nay')) {
            defDueDate = todayStr;
        } else if (colType === 'date_tomorrow' || initialStatus === 'tomorrow' || matchedCol?.label?.toLowerCase().includes('ngày mai')) {
            const tmr = new Date();
            tmr.setDate(tmr.getDate() + 1);
            defDueDate = tmr.toISOString().split('T')[0];
        } else if (colType === 'system_inbox' || initialStatus === 'inbox' || matchedCol?.label?.toLowerCase().includes('hộp thư')) {
            defDueDate = "";
        }
        return { defStatus, defDueDate };
    }, [initialStatus, columns]);

    const [hasDraftRestored, setHasDraftRestored] = useState(false);

    const [formData, setFormData] = useState<TaskFormData>(() => {
        const { defStatus, defDueDate } = computeInitialDateAndStatus();
        const initialMeta = initialData ? extractTaskMetadata(initialData as any) : null;
        return {
            title: "",
            customerName: "",
            phone: "",
            priority: "normal",
            dueDate: defDueDate,
            status: defStatus,
            stage: "in_progress",
            description: "",
            department: (initialData as any)?.department || initialMeta?.department || "telesales",
            assigneeIds: initialData?.assignee_ids || [],
            leaderId: initialData?.leader_id || ""
        };
    });

    const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

    const [profiles, setProfiles] = useState<Profile[]>([]);

    const [showContactFields, setShowContactFields] = useState(false); // Collapsible contact

    const taskType: TaskType = 'task'; // Phase 3: Always 'task', removed type selector

    const [attachments, setAttachments] = useState<any[]>(initialData?.attachments || []);
    const [isUploading, setIsUploading] = useState(false);

    // Track if user has made local edits (dirty state)
    const [hasUserEdited, setHasUserEdited] = useState(false);
    const [lastSyncedTaskId, setLastSyncedTaskId] = useState<string | null>(null);

    // Load profiles
    useEffect(() => {
        const loadProfiles = async () => {
            const { data } = await supabase.from('profiles').select('id, full_name, email').order('full_name');
            if (data) setProfiles(data);
        };
        loadProfiles();
    }, []);

    // Draft Auto-Save: save whenever user inputs in Create mode
    useEffect(() => {
        if (!isEditMode && isOpen) {
            if (formData.title || formData.customerName || formData.phone || formData.description || subtasks.length > 0 || attachments.length > 0) {
                try {
                    localStorage.setItem('lyhu_task_create_draft', JSON.stringify({ formData, subtasks, attachments }));
                } catch (e) { }
            }
        }
    }, [formData, subtasks, attachments, isEditMode, isOpen]);

    const handleClearDraft = () => {
        try {
            localStorage.removeItem('lyhu_task_create_draft');
        } catch (e) { }
        const { defStatus, defDueDate } = computeInitialDateAndStatus();
        setFormData({
            title: "",
            customerName: "",
            phone: "",
            priority: "normal",
            dueDate: defDueDate,
            status: defStatus,
            stage: "in_progress",
            description: "",
            department: "telesales",
            assigneeIds: [],
            leaderId: ""
        });
        setSubtasks([]);
        setAttachments([]);
        setHasDraftRestored(false);
        setHasUserEdited(false);
    };

    const prevIsOpenRef = React.useRef(false);

    // Robust sync logic:
    // 1. Sync on modal open or when target task ID changes
    // 2. In create mode: restore local draft if available so user doesn't lose progress
    // 3. DO NOT reset or re-sync while modal remains open
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            prevIsOpenRef.current = true;
            if (initialData) {
                const meta = extractTaskMetadata(initialData as any);
                const initialDueDate = initialData.due_date ? new Date(initialData.due_date).toISOString().split('T')[0] : "";

                let targetColId = initialStatus;
                if (initialData.due_date) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const tmr = new Date();
                    tmr.setDate(tmr.getDate() + 1);
                    const tmrStr = tmr.toISOString().split('T')[0];
                    if (initialDueDate === todayStr) {
                        const col = columns.find(c => c.column_type === 'date_today' || c.id === 'today');
                        if (col) targetColId = col.id as TaskStatus;
                    } else if (initialDueDate === tmrStr) {
                        const col = columns.find(c => c.column_type === 'date_tomorrow' || c.id === 'tomorrow');
                        if (col) targetColId = col.id as TaskStatus;
                    }
                }

                setFormData({
                    title: initialData.title || "",
                    customerName: initialData.customer_name || "",
                    phone: initialData.phone || "",
                    priority: initialData.priority || "normal",
                    dueDate: initialDueDate,
                    status: targetColId,
                    stage: meta.stage || (initialData.stage as string) || "in_progress",
                    description: meta.cleanNote || "",
                    department: (initialData as any).department || meta.department || "telesales",
                    assigneeIds: initialData.assignee_ids || [],
                    leaderId: initialData.leader_id || ""
                });
                setSubtasks((meta.subtasks && meta.subtasks.length > 0) ? meta.subtasks : (Array.isArray(initialData.subtasks) ? initialData.subtasks : []));
                setAttachments(initialData.attachments || []);
                setLastSyncedTaskId(initialData.id || null);
                setHasUserEdited(false);
                setNewSubtaskTitle("");
            } else {
                // Fresh create mode - check for saved draft first
                let restored = false;
                const draftStr = typeof window !== 'undefined' ? localStorage.getItem('lyhu_task_create_draft') : null;
                if (draftStr) {
                    try {
                        const draft = JSON.parse(draftStr);
                        if (draft.formData?.title || draft.formData?.description || (draft.subtasks && draft.subtasks.length > 0) || (draft.attachments && draft.attachments.length > 0)) {
                            setFormData(draft.formData);
                            setSubtasks(draft.subtasks || []);
                            setAttachments(draft.attachments || []);
                            setHasDraftRestored(true);
                            restored = true;
                        }
                    } catch (e) { }
                }

                if (!restored) {
                    const { defStatus, defDueDate } = computeInitialDateAndStatus();
                    setFormData({
                        title: "",
                        customerName: "",
                        phone: "",
                        priority: "normal",
                        dueDate: defDueDate,
                        status: defStatus,
                        stage: "in_progress",
                        description: "",
                        department: "telesales",
                        assigneeIds: [],
                        leaderId: ""
                    });
                    setSubtasks([]);
                    setAttachments([]);
                    setHasDraftRestored(false);
                }
                setHasUserEdited(false);
                setLastSyncedTaskId(null);
                setNewSubtaskTitle("");
            }
        } else if (isOpen && prevIsOpenRef.current && initialData && initialData.id !== lastSyncedTaskId) {
            // Task changed while modal was open
            const meta = extractTaskMetadata(initialData as any);
            const initialDueDate = initialData.due_date ? new Date(initialData.due_date).toISOString().split('T')[0] : "";

            let targetColId = initialStatus;
            if (initialData.due_date) {
                const todayStr = new Date().toISOString().split('T')[0];
                const tmr = new Date();
                tmr.setDate(tmr.getDate() + 1);
                const tmrStr = tmr.toISOString().split('T')[0];
                if (initialDueDate === todayStr) {
                    const col = columns.find(c => c.column_type === 'date_today' || c.id === 'today');
                    if (col) targetColId = col.id as TaskStatus;
                } else if (initialDueDate === tmrStr) {
                    const col = columns.find(c => c.column_type === 'date_tomorrow' || c.id === 'tomorrow');
                    if (col) targetColId = col.id as TaskStatus;
                }
            }

            setFormData({
                title: initialData.title || "",
                customerName: initialData.customer_name || "",
                phone: initialData.phone || "",
                priority: initialData.priority || "normal",
                dueDate: initialDueDate,
                status: targetColId,
                stage: meta.stage || (initialData.stage as string) || "in_progress",
                description: meta.cleanNote || "",
                department: (initialData as any).department || meta.department || "telesales",
                assigneeIds: initialData.assignee_ids || [],
                leaderId: initialData.leader_id || ""
            });
            setSubtasks((meta.subtasks && meta.subtasks.length > 0) ? meta.subtasks : (Array.isArray(initialData.subtasks) ? initialData.subtasks : []));
            setAttachments(initialData.attachments || []);
            setLastSyncedTaskId(initialData.id || null);
            setHasUserEdited(false);
            setNewSubtaskTitle("");
        } else if (!isOpen) {
            prevIsOpenRef.current = false;
            setHasUserEdited(false);
            setLastSyncedTaskId(null);
            setNewSubtaskTitle("");
        }
    }, [isOpen, initialData?.id]);

    // Handle column selection with automatic due date synchronization
    const handleColumnChange = (selectedColId: string) => {
        setHasUserEdited(true);
        const matchedCol = columns.find(c => c.id === selectedColId || c.column_type === selectedColId);
        const colType = matchedCol?.column_type || selectedColId;

        let newDueDate = formData.dueDate;
        let newStage = formData.stage;

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        if (colType === 'date_today' || selectedColId === 'today' || matchedCol?.label?.toLowerCase().includes('hôm nay')) {
            newDueDate = todayStr;
        } else if (colType === 'date_tomorrow' || selectedColId === 'tomorrow' || matchedCol?.label?.toLowerCase().includes('ngày mai')) {
            const tmr = new Date(today);
            tmr.setDate(tmr.getDate() + 1);
            newDueDate = tmr.toISOString().split('T')[0];
        } else if (colType === 'date_this_week' || selectedColId === 'this_week' || matchedCol?.label?.toLowerCase().includes('tuần này')) {
            const thisWeek = new Date(today);
            thisWeek.setDate(today.getDate() + 4);
            newDueDate = thisWeek.toISOString().split('T')[0];
        } else if (colType === 'system_inbox' || selectedColId === 'inbox' || matchedCol?.label?.toLowerCase().includes('hộp thư')) {
            newDueDate = "";
        } else if (colType === 'system_done' || selectedColId === 'done' || matchedCol?.label?.toLowerCase().includes('đã xong')) {
            newStage = 'completed';
        }

        setFormData(prev => ({
            ...prev,
            status: selectedColId as TaskStatus,
            dueDate: newDueDate,
            stage: newStage
        }));
    };

    // Handle due date selection with automatic column synchronization
    const handleDueDateChange = (newDateStr: string) => {
        setHasUserEdited(true);
        let newStatus = formData.status;

        if (newDateStr) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const targetDate = new Date(newDateStr);
            targetDate.setHours(0, 0, 0, 0);

            const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                const todayCol = columns.find(c => c.column_type === 'date_today' || c.id === 'today');
                if (todayCol) newStatus = todayCol.id as TaskStatus;
            } else if (diffDays === 1) {
                const tomorrowCol = columns.find(c => c.column_type === 'date_tomorrow' || c.id === 'tomorrow');
                if (tomorrowCol) newStatus = tomorrowCol.id as TaskStatus;
            } else if (diffDays > 1 && diffDays <= 7) {
                const thisWeekCol = columns.find(c => c.column_type === 'date_this_week' || c.id === 'this_week');
                if (thisWeekCol) newStatus = thisWeekCol.id as TaskStatus;
            } else if (diffDays < 0) {
                const overdueCol = columns.find(c => c.column_type === 'date_overdue' || c.id === 'overdue');
                if (overdueCol) newStatus = overdueCol.id as TaskStatus;
            }
        } else {
            const inboxCol = columns.find(c => c.column_type === 'system_inbox' || c.id === 'inbox');
            if (inboxCol) newStatus = inboxCol.id as TaskStatus;
        }

        setFormData(prev => ({
            ...prev,
            dueDate: newDateStr,
            status: newStatus
        }));
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        setHasUserEdited(true);
        const files = Array.from(e.target.files);

        try {
            const uploadedItems: any[] = [];
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${fileName}`;
                const determinedMime = getMimeType(file);

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

                uploadedItems.push({
                    name: file.name,
                    url: publicUrlData.publicUrl,
                    type: determinedMime,
                    size: file.size
                });
            }

            setAttachments(prev => [...prev, ...uploadedItems]);
        } catch (error: any) {
            console.error("Upload error:", error);
            alert(`Lỗi upload tài liệu/ảnh: ${error.message || JSON.stringify(error)}`);
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
        setHasUserEdited(true);
    };

    const handleDownload = (url: string, fileName: string) => {
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

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
        setHasUserEdited(true);
    };

    const handleToggleSubtask = (subId: string) => {
        setSubtasks(prev => prev.map(s => s.id === subId ? { ...s, completed: !s.completed } : s));
        setHasUserEdited(true);
    };

    const handleDeleteSubtask = (subId: string) => {
        setSubtasks(prev => prev.filter(s => s.id !== subId));
        setHasUserEdited(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Auto-commit pending subtask from input if user typed but did not click "+ Thêm bước"
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

        // Ensure due_date is populated if status corresponds to a date column
        let finalDueDate = formData.dueDate;
        const matchedCol = columns.find(c => c.id === formData.status || c.column_type === formData.status);
        const colType = matchedCol?.column_type || formData.status;
        const todayStr = new Date().toISOString().split('T')[0];

        if ((colType === 'date_today' || formData.status === 'today' || matchedCol?.label?.toLowerCase().includes('hôm nay')) && !finalDueDate) {
            finalDueDate = todayStr;
        } else if ((colType === 'date_tomorrow' || formData.status === 'tomorrow' || matchedCol?.label?.toLowerCase().includes('ngày mai')) && !finalDueDate) {
            const tmr = new Date();
            tmr.setDate(tmr.getDate() + 1);
            finalDueDate = tmr.toISOString().split('T')[0];
        } else if ((colType === 'date_this_week' || formData.status === 'this_week' || matchedCol?.label?.toLowerCase().includes('tuần này')) && !finalDueDate) {
            const thisWeek = new Date();
            thisWeek.setDate(thisWeek.getDate() + 4);
            finalDueDate = thisWeek.toISOString().split('T')[0];
        }

        onSave({
            id: initialData?.id,
            title: formData.title,
            customer_name: formData.customerName,
            phone: formData.phone,
            priority: formData.priority,
            status: formData.status,
            stage: formData.stage,
            department: formData.department,
            subtasks: finalSubtasks,
            due_date: finalDueDate || null,
            note: packMetadataToNote(formData.description, finalSubtasks, formData.stage, formData.department),
            assignee_ids: formData.assigneeIds,
            leader_id: formData.leaderId || null,
            type: initialData?.type || taskType,
            attachments: attachments
        });

        // Clear draft on successful submit
        try {
            localStorage.removeItem('lyhu_task_create_draft');
        } catch (err) { }
        setHasDraftRestored(false);
        onClose();
    };

    const handleDelete = () => {
        if (isEditMode && onDelete && initialData?.id) {
            if (window.confirm("Bạn có chắc muốn xóa việc này không? Hành động này không thể hoàn tác.")) {
                onDelete(initialData.id);
                onClose();
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg text-slate-900">
                                {isEditMode ? "✏️ Chỉnh sửa" : "➕ Thêm mới"}
                            </h3>
                            {hasDraftRestored && !isEditMode && (
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
                        {isEditMode && initialData?.title && (
                            <div className="text-sm text-slate-600 truncate max-w-[250px]">
                                {initialData.title}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Type selector removed - Phase 3: Tasks only */}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Tiêu đề công việc <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AFA9]"
                            placeholder="Ví dụ: Gọi lại khách A"
                            value={formData.title}
                            onChange={e => { setFormData(prev => ({ ...prev, title: e.target.value })); setHasUserEdited(true); }}
                        />
                    </div>

                    {/* Collapsible Contact Section - Phase B */}
                    <div className="border border-slate-200 rounded-lg p-3">
                        <button
                            type="button"
                            onClick={() => setShowContactFields(!showContactFields)}
                            className="flex items-center justify-between w-full text-left"
                        >
                            <span className="text-sm font-medium text-slate-700">
                                👤 Thông tin liên hệ (tùy chọn)
                            </span>
                            <span className="text-slate-400">
                                {showContactFields ? '▲' : '▼'}
                            </span>
                        </button>

                        {showContactFields && (
                            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Khách hàng</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AFA9]"
                                        placeholder="Tên khách..."
                                        value={formData.customerName}
                                        onChange={e => { setFormData(prev => ({ ...prev, customerName: e.target.value })); setHasUserEdited(true); }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">SĐT</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AFA9]"
                                        placeholder="09xxx"
                                        value={formData.phone}
                                        onChange={e => { setFormData(prev => ({ ...prev, phone: e.target.value })); setHasUserEdited(true); }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Priority, Workflow Stage & Department */}
                    <div className="grid grid-cols-3 gap-2.5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Độ ưu tiên</label>
                            <select
                                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00AFA9] bg-white"
                                value={formData.priority}
                                onChange={e => { setFormData(prev => ({ ...prev, priority: e.target.value as TaskPriority })); setHasUserEdited(true); }}
                            >
                                <option value="low">Thấp</option>
                                <option value="normal">Bình thường</option>
                                <option value="high">Cao</option>
                                <option value="urgent">Khẩn</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Giai đoạn</label>
                            <select
                                className="w-full px-2.5 py-2 border border-teal-200 bg-teal-50/40 rounded-lg text-sm font-medium text-teal-900 focus:outline-none focus:ring-2 focus:ring-[#00AFA9]"
                                value={formData.stage}
                                onChange={e => { setFormData(prev => ({ ...prev, stage: e.target.value })); setHasUserEdited(true); }}
                            >
                                <option value="not_started">⚪ Chưa bắt đầu</option>
                                <option value="in_progress">🔵 Đang làm</option>
                                <option value="waiting">🟠 Chờ duyệt</option>
                                <option value="completed">🟢 Đã xong</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Phòng ban</label>
                            <select
                                className="w-full px-2.5 py-2 border border-indigo-200 bg-indigo-50/30 rounded-lg text-sm font-medium text-indigo-950 focus:outline-none focus:ring-2 focus:ring-[#00AFA9]"
                                value={formData.department || 'telesales'}
                                onChange={e => { setFormData(prev => ({ ...prev, department: e.target.value })); setHasUserEdited(true); }}
                            >
                                {TASK_DEPARTMENTS.map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.icon} {d.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Column placement & Due Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Cột hiển thị (Kanban)
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00AFA9] bg-white cursor-pointer font-medium"
                                value={formData.status}
                                onChange={e => handleColumnChange(e.target.value)}
                            >
                                {columns.length > 0 ? (
                                    columns.map(col => (
                                        <option key={col.id} value={col.id}>{col.label}</option>
                                    ))
                                ) : (
                                    Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Hạn hoàn thành</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00AFA9] text-slate-700 cursor-pointer font-medium"
                                value={formData.dueDate}
                                onChange={e => handleDueDateChange(e.target.value)}
                            />
                            {!formData.dueDate && (
                                <p className="text-[10px] text-slate-400 mt-0.5">Không chọn ngày sẽ tự động vào "Hộp thư đến".</p>
                            )}
                        </div>
                    </div>

                    {/* Checklist / Subtasks (Công việc con) */}
                    <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                                <CheckSquare className="w-4 h-4 text-[#00AFA9]" />
                                Các bước thực hiện ({subtasks.filter(s => s.completed).length}/{subtasks.length})
                            </label>
                            {subtasks.length > 0 && (
                                <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                                    {Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100)}% hoàn thành
                                </span>
                            )}
                        </div>

                        {/* Progress Bar */}
                        {subtasks.length > 0 && (
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2.5">
                                <div
                                    className="bg-[#00AFA9] h-full transition-all duration-300"
                                    style={{ width: `${(subtasks.filter(s => s.completed).length / subtasks.length) * 100}%` }}
                                />
                            </div>
                        )}

                        {/* Subtasks List */}
                        {subtasks.length > 0 && (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto mb-2.5">
                                {subtasks.map((st) => (
                                    <div
                                        key={st.id}
                                        className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-colors ${st.completed ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200 text-slate-800'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={st.completed}
                                            onChange={() => handleToggleSubtask(st.id)}
                                            className="w-4 h-4 text-[#00AFA9] rounded border-slate-300 focus:ring-[#00AFA9] cursor-pointer"
                                        />
                                        <span className={`flex-1 text-xs sm:text-sm ${st.completed ? 'line-through text-slate-400' : 'font-medium'}`}>
                                            {st.title}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteSubtask(st.id)}
                                            className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-100 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Subtask Input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Thêm bước (vd: 1. Làm đối chiếu công nợ)..."
                                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00AFA9]"
                                value={newSubtaskTitle}
                                onChange={e => { setNewSubtaskTitle(e.target.value); setHasUserEdited(true); }}
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
                                className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-[#00AFA9] text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Thêm bước
                            </button>
                        </div>
                    </div>

                    {/* Roles Assignment */}
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Người phối hợp thực hiện</label>
                            <div className="flex flex-wrap gap-2 mb-2 p-2 border border-slate-200 rounded-lg bg-slate-50 min-h-[40px]">
                                {formData.assigneeIds.map(id => {
                                    const p = profiles.find(prof => prof.id === id);
                                    return (
                                        <span key={id} className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700">
                                            {p?.full_name || p?.email || id}
                                            <button
                                                type="button"
                                                onClick={() => { setFormData(prev => ({ ...prev, assigneeIds: prev.assigneeIds.filter(aid => aid !== id) })); setHasUserEdited(true); }}
                                                className="text-slate-400 hover:text-red-500"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    );
                                })}
                                {formData.assigneeIds.length === 0 && (
                                    <span className="text-xs text-slate-400 italic self-center">Chưa chọn ai...</span>
                                )}
                            </div>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00AFA9] bg-white"
                                value=""
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val && !formData.assigneeIds.includes(val)) {
                                        setFormData(prev => ({ ...prev, assigneeIds: [...prev.assigneeIds, val] }));
                                        setHasUserEdited(true);
                                    }
                                }}
                            >
                                <option value="">+ Thêm người tham gia...</option>
                                {profiles.map(p => (
                                    <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Trưởng nhóm (Lead)</label>
                            <select
                                className="w-full px-3 py-2 border border-blue-200 bg-blue-50/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.leaderId}
                                onChange={e => { setFormData(prev => ({ ...prev, leaderId: e.target.value })); setHasUserEdited(true); }}
                            >
                                <option value="">-- Không có --</option>
                                {profiles.filter(p => formData.assigneeIds.includes(p.id)).map(p => (
                                    <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-slate-700">Ghi chú & Đính kèm</label>
                            <label className="cursor-pointer text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1">
                                {isUploading ? 'Đang tải...' : (
                                    <>
                                        <span>+ Thêm file/ảnh</span>
                                        <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                                    </>
                                )}
                            </label>
                        </div>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AFA9] min-h-[80px]"
                            placeholder="Ghi chú thêm..."
                            value={formData.description}
                            onChange={e => { setFormData(prev => ({ ...prev, description: e.target.value })); setHasUserEdited(true); }}
                        />

                        {/* Attachments List */}
                        {attachments.length > 0 && (
                            <div className="grid grid-cols-1 gap-2 mt-2">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="group flex items-center justify-between p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {/* Thumbnail / Icon */}
                                            <div className="flex-shrink-0 w-10 h-10 bg-slate-200 rounded overflow-hidden flex items-center justify-center">
                                                {file.type?.startsWith('image/') ? (
                                                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-500">FILE</span>
                                                )}
                                            </div>
                                            {/* Info */}
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-medium text-slate-700 truncate" title={file.name}>{file.name}</p>
                                                <p className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Xem trực tiếp"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </a>
                                            <a
                                                href={file.url}
                                                download={file.name}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                                title="Tải xuống"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(idx)}
                                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        {/* Delete Button (Left aligned) */}
                        <div>
                            {isEditMode && onDelete && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="px-3 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg flex items-center gap-2 transition-colors"
                                    title="Xóa công việc này"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Xóa</span>
                                </button>
                            )}
                        </div>

                        {/* Action Buttons (Right aligned) */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                Hủy
                            </button>
                            {isEditMode && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        let currentSubtasks = [...subtasks];
                                        if (newSubtaskTitle.trim()) {
                                            currentSubtasks.push({
                                                id: `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                                                title: newSubtaskTitle.trim(),
                                                completed: false
                                            });
                                            setNewSubtaskTitle("");
                                        }
                                        const completedSubtasks = currentSubtasks.map(s => ({ ...s, completed: true }));
                                        onSave({
                                            id: initialData?.id,
                                            title: formData.title,
                                            customer_name: formData.customerName,
                                            phone: formData.phone,
                                            priority: formData.priority,
                                            due_date: formData.dueDate || null,
                                            completed_at: new Date().toISOString(),
                                            stage: 'completed',
                                            department: formData.department,
                                            subtasks: completedSubtasks,
                                            note: packMetadataToNote(formData.description, completedSubtasks, 'completed', formData.department),
                                            status: 'done' as TaskStatus,  // Set to done
                                            assignee_ids: formData.assigneeIds,
                                            leader_id: formData.leaderId || null,
                                            type: initialData?.type || taskType,
                                            attachments: attachments
                                        });
                                        onClose();
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Hoàn thành
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isUploading}
                                className="px-4 py-2 text-sm font-medium text-white bg-[#00AFA9] hover:bg-[#009690] rounded-lg disabled:opacity-50"
                            >
                                {isEditMode ? "Lưu thay đổi" : "Lưu công việc"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
