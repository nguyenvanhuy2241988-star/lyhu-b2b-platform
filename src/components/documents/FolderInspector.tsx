'use client';

import React, { useState, useEffect } from 'react';
import { DocumentFolder, updateFolderGuidance, updateFolderPermissions, DEFAULT_FOLDER_ROLES } from '@/lib/documentsStore';
import {
    Info,
    Edit3,
    Save,
    X,
    Folder,
    Calendar,
    Users,
    ShieldCheck,
    Check
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TagSelector } from './TagSelector';

const AVAILABLE_ROLES = [
    { key: 'telesales', label: 'Telesales (Chăm sóc KH)' },
    { key: 'sales', label: 'Sales (Kinh doanh)' },
    { key: 'sale_admin', label: 'Sale Admin' },
    { key: 'ctv', label: 'Cộng tác viên (CTV)' },
    { key: 'sales_gt', label: 'Sales GT (Thị trường)' },
    { key: 'accountant', label: 'Kế toán' },
    { key: 'recruiter', label: 'HR / Tuyển dụng' },
    { key: 'warehouse', label: 'Kho vận' },
    { key: 'shipper', label: 'Vận chuyển (Shipper)' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'media_creator', label: 'Media Creator' },
    { key: 'livestream', label: 'Livestream' },
    { key: 'ecommerce', label: 'Thương mại điện tử' },
    { key: 'rnd', label: 'Nghiên cứu (R&D)' },
];

interface FolderInspectorProps {
    folder: DocumentFolder;
    readOnly?: boolean;
    onUpdate: (updatedFolder: DocumentFolder) => void;
    onClose?: () => void;
}

export function FolderInspector({ folder, readOnly = false, onUpdate, onClose }: FolderInspectorProps) {
    const [editing, setEditing] = useState(false);
    const [guidance, setGuidance] = useState('');
    const [saving, setSaving] = useState(false);

    // Permission state
    const [visibility, setVisibility] = useState<'all' | 'roles' | 'private'>('all');
    const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
    const [savingPermissions, setSavingPermissions] = useState(false);
    const [permissionSavedSuccess, setPermissionSavedSuccess] = useState(false);

    useEffect(() => {
        setGuidance(folder.guidance_md || '');

        // If folder has explicit visibility or allowed_roles
        if (folder.visibility === 'roles' || (folder.allowed_roles && folder.allowed_roles.length > 0)) {
            setVisibility(folder.visibility || 'roles');
            setAllowedRoles(folder.allowed_roles || []);
        } else {
            // Infer from default department mapping
            const normalized = folder.name.trim().toLowerCase();
            const defaultMatch = Object.entries(DEFAULT_FOLDER_ROLES).find(([k]) => normalized === k || normalized.startsWith(k));
            if (defaultMatch && !defaultMatch[1].includes('*')) {
                setVisibility('roles');
                setAllowedRoles(defaultMatch[1].filter(r => r !== 'admin'));
            } else {
                setVisibility(folder.visibility || 'all');
                setAllowedRoles([]);
            }
        }
    }, [folder]);

    const handleSaveGuidance = async () => {
        setSaving(true);
        try {
            await updateFolderGuidance(folder.id, guidance);
            onUpdate({ ...folder, guidance_md: guidance });
            setEditing(false);
        } catch (error) {
            console.error(error);
            alert("Lỗi lưu hướng dẫn");
        } finally {
            setSaving(false);
        }
    };

    const handleSavePermissions = async () => {
        setSavingPermissions(true);
        try {
            await updateFolderPermissions(folder.id, visibility, allowedRoles);
            onUpdate({ ...folder, visibility, allowed_roles: allowedRoles });
            setPermissionSavedSuccess(true);
            setTimeout(() => setPermissionSavedSuccess(false), 2000);
        } catch (error) {
            console.error(error);
            alert("Lỗi lưu phân quyền thư mục");
        } finally {
            setSavingPermissions(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white border-l border-slate-200 w-80 lg:w-96 relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2 overflow-hidden">
                    <Folder className="w-5 h-5 text-[#00AFA9] shrink-0" />
                    <h3 className="font-semibold text-slate-800 truncate" title={folder.name}>
                        {folder.name}
                    </h3>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* Meta */}
                <div className="space-y-3 pb-4 border-b border-slate-100">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" /> Tạo ngày
                        </span>
                        <span className="text-slate-700 font-medium">
                            {format(new Date(folder.created_at), "dd/MM/yyyy", { locale: vi })}
                        </span>
                    </div>

                    {/* Tagging */}
                    <div className="pt-2 border-t border-slate-100 mt-2">
                        <TagSelector
                            entityId={folder.id}
                            entityType="folder"
                            currentTags={folder.tags}
                            onTagsChanged={() => onUpdate(folder)}
                        />
                    </div>
                </div>

                {/* Guidance */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Info className="w-4 h-4 text-[#00AFA9]" />
                            Hướng dẫn & Quy định
                        </h4>
                        {!editing && !readOnly && (
                            <button
                                onClick={() => setEditing(true)}
                                className="text-xs flex items-center gap-1 text-[#00AFA9] hover:text-[#009690] font-medium px-2 py-1 hover:bg-teal-50 rounded"
                            >
                                <Edit3 className="w-3 h-3" /> Sửa
                            </button>
                        )}
                    </div>

                    {editing ? (
                        <div className="space-y-2">
                            <textarea
                                className="w-full h-64 p-3 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#00AFA9] focus:border-transparent outline-none resize-none"
                                value={guidance}
                                onChange={e => setGuidance(e.target.value)}
                                placeholder="Nhập hướng dẫn (Markdown)..."
                                autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => {
                                        setEditing(false);
                                        setGuidance(folder.guidance_md || '');
                                    }}
                                    className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded"
                                    disabled={saving}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSaveGuidance}
                                    className="px-3 py-1.5 text-sm bg-[#00AFA9] text-white hover:bg-[#009690] rounded flex items-center gap-1"
                                    disabled={saving}
                                >
                                    {saving ? 'Lưu...' : <><Save className="w-3 h-3" /> Lưu</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 min-h-[100px] text-sm text-slate-700 prose prose-sm max-w-none whitespace-pre-wrap">
                            {guidance ? guidance : <span className="text-slate-400 italic">Chưa có nội dung hướng dẫn.</span>}
                        </div>
                    )}
                </div>

                {/* Role Permissions Section */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#00AFA9]" />
                            Quyền xem theo vai trò
                        </h4>
                        {!readOnly && (
                            <span className="text-[11px] text-[#00AFA9] bg-teal-50 px-2 py-0.5 rounded-full font-medium border border-teal-100">
                                Quản trị
                            </span>
                        )}
                    </div>

                    {!readOnly ? (
                        <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                                    <input
                                        type="radio"
                                        name="folder_visibility"
                                        checked={visibility === 'all'}
                                        onChange={() => setVisibility('all')}
                                        className="text-[#00AFA9] focus:ring-[#00AFA9]"
                                    />
                                    <span>Tất cả mọi người (Công khai toàn công ty)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                                    <input
                                        type="radio"
                                        name="folder_visibility"
                                        checked={visibility === 'roles'}
                                        onChange={() => setVisibility('roles')}
                                        className="text-[#00AFA9] focus:ring-[#00AFA9]"
                                    />
                                    <span>Chỉ định vai trò được xem</span>
                                </label>
                            </div>

                            {visibility === 'roles' && (
                                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                                    <p className="text-[11px] text-slate-500 font-medium mb-1.5">
                                        Chọn các vai trò được phép thấy thư mục này (Admin luôn có quyền):
                                    </p>
                                    <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                                        {AVAILABLE_ROLES.map(r => {
                                            const isChecked = allowedRoles.includes(r.key);
                                            return (
                                                <label
                                                    key={r.key}
                                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition ${isChecked
                                                        ? 'bg-teal-50 border-teal-300 text-teal-800 font-medium'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setAllowedRoles(prev => [...prev, r.key]);
                                                            } else {
                                                                setAllowedRoles(prev => prev.filter(k => k !== r.key));
                                                            }
                                                        }}
                                                        className="text-[#00AFA9] rounded focus:ring-[#00AFA9]"
                                                    />
                                                    <span className="truncate">{r.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 flex justify-end">
                                <button
                                    onClick={handleSavePermissions}
                                    disabled={savingPermissions}
                                    className="px-3 py-1.5 text-xs bg-[#00AFA9] hover:bg-[#009690] text-white rounded-lg flex items-center gap-1.5 font-medium shadow-sm transition disabled:opacity-50"
                                >
                                    {savingPermissions ? 'Đang lưu...' : permissionSavedSuccess ? <><Check className="w-3.5 h-3.5" /> Đã lưu</> : <><Save className="w-3.5 h-3.5" /> Lưu phân quyền</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
                            {visibility === 'all' ? (
                                <p className="text-slate-600 font-medium">🌐 Tài liệu chung cho toàn bộ công ty.</p>
                            ) : (
                                <div className="space-y-1">
                                    <p className="text-slate-500 font-medium">Thư mục nội bộ cho các bộ phận:</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {allowedRoles.length > 0 ? (
                                            allowedRoles.map(roleKey => {
                                                const label = AVAILABLE_ROLES.find(r => r.key === roleKey)?.label || roleKey;
                                                return (
                                                    <span key={roleKey} className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-[11px] font-medium border border-teal-200">
                                                        {label}
                                                    </span>
                                                );
                                            })
                                        ) : (
                                            <span className="text-slate-400 italic">Theo phân quyền phòng ban mặc định</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
