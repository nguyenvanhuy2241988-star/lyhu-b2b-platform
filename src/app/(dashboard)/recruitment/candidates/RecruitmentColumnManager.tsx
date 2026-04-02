'use client';

import { useState, useEffect } from 'react';
import { X, Plus, ArrowUp, ArrowDown, Save, Trash2, Edit2 } from 'lucide-react';
import { RecruitmentColumn, getKanbanColumns, createKanbanColumn, updateKanbanColumn, deleteKanbanColumn, updateKanbanColumnsOrder } from '@/lib/recruitmentStore';

const COLOR_PRESETS = [
    { label: 'Xám', value: 'bg-slate-50 text-slate-700' },
    { label: 'Xanh dương', value: 'bg-primary-50 text-primary-700' },
    { label: 'Tím', value: 'bg-purple-50 text-purple-700' },
    { label: 'Cam', value: 'bg-orange-50 text-orange-700' },
    { label: 'Vàng', value: 'bg-yellow-50 text-yellow-700' },
    { label: 'Xanh lá', value: 'bg-green-50 text-green-700' },
    { label: 'Đỏ', value: 'bg-red-50 text-red-700' },
    { label: 'Hồng', value: 'bg-pink-50 text-pink-700' },
    { label: 'Chàm', value: 'bg-indigo-50 text-indigo-700' },
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onColumnsChanged: () => void;
}

export default function RecruitmentColumnManager({ isOpen, onClose, onColumnsChanged }: Props) {
    const [columns, setColumns] = useState<RecruitmentColumn[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit state
    const [editingCol, setEditingCol] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [editColor, setEditColor] = useState('');

    // Add new state
    const [isAdding, setIsAdding] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newColor, setNewColor] = useState(COLOR_PRESETS[0].value);

    useEffect(() => {
        if (isOpen) {
            loadColumns();
        }
    }, [isOpen]);

    const loadColumns = async () => {
        setLoading(true);
        try {
            const cols = await getKanbanColumns();
            setColumns(cols);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === columns.length - 1) return;

        const newCols = [...columns];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap
        const temp = newCols[index];
        newCols[index] = newCols[swapIndex];
        newCols[swapIndex] = temp;

        // Update order_indexes
        const updatedCols = newCols.map((col, i) => ({ ...col, order_index: i + 1 }));
        setColumns(updatedCols);

        try {
            await updateKanbanColumnsOrder(updatedCols.map(c => ({ id: c.id, order_index: c.order_index })));
            onColumnsChanged();
        } catch (error) {
            console.error("Failed to reorder", error);
            loadColumns(); // Revert on failure
        }
    };

    const handleDelete = async (col: RecruitmentColumn) => {
        if (col.is_system) {
            alert('Không thể xóa cột hệ thống.');
            return;
        }

        if (confirm(`Bạn có chắc muốn xóa cột "${col.label}"?`)) {
            try {
                await deleteKanbanColumn(col.id);
                setColumns(columns.filter(c => c.id !== col.id));
                onColumnsChanged();
            } catch (error: any) {
                console.error(error);
                alert(error.message || 'Có lỗi xảy ra khi xóa cột.');
            }
        }
    };

    const handleStartEdit = (col: RecruitmentColumn) => {
        setEditingCol(col.id);
        setEditLabel(col.label);
        setEditColor(col.color);
    };

    const handleSaveEdit = async (col: RecruitmentColumn) => {
        if (!editLabel.trim()) return;
        try {
            const updated = await updateKanbanColumn(col.id, { label: editLabel, color: editColor });
            setColumns(columns.map(c => c.id === col.id ? updated : c));
            setEditingCol(null);
            onColumnsChanged();
        } catch (error) {
            console.error(error);
            alert('Có lỗi khi lưu.');
        }
    };

    const handleAdd = async () => {
        if (!newLabel.trim()) return;
        try {
            const tempOrder = columns.length > 0 ? Math.max(...columns.map(c => c.order_index)) + 1 : 1;
            await createKanbanColumn({
                label: newLabel,
                color: newColor,
                order_index: tempOrder,
                is_system: false
            });
            setIsAdding(false);
            setNewLabel('');
            setNewColor(COLOR_PRESETS[0].value);
            await loadColumns();
            onColumnsChanged();
        } catch (error) {
            console.error(error);
            alert('Có lỗi khi thêm.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Cấu hình Cột Trạng thái Kanban</h2>
                        <p className="text-xs text-slate-500 mt-1">Tùy chỉnh các giai đoạn trong quy trình tuyển dụng.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Đang tải cấu hình...</div>
                    ) : (
                        <div className="space-y-3">
                            {columns.map((col, index) => (
                                <div key={col.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl group hover:border-primary-300 transition">
                                    {/* Arrows */}
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleMove(index, 'up')}
                                            disabled={index === 0}
                                            className={`p-1 rounded ${index === 0 ? 'text-slate-300' : 'text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleMove(index, 'down')}
                                            disabled={index === columns.length - 1}
                                            className={`p-1 rounded ${index === columns.length - 1 ? 'text-slate-300' : 'text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        {editingCol === col.id ? (
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <input
                                                    className="flex-1 px-3 py-1.5 border border-primary-300 rounded outline-none focus:ring-2 focus:ring-primary-100 text-sm font-semibold"
                                                    value={editLabel}
                                                    onChange={(e) => setEditLabel(e.target.value)}
                                                    placeholder="Tên cột..."
                                                    autoFocus
                                                />
                                                <select
                                                    className="border border-primary-300 rounded px-2 py-1.5 text-sm bg-white outline-none"
                                                    value={editColor}
                                                    onChange={(e) => setEditColor(e.target.value)}
                                                >
                                                    {COLOR_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                                </select>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleSaveEdit(col)} className="p-2 text-green-600 hover:bg-green-100 rounded transition" title="Lưu">
                                                        <Save className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setEditingCol(null)} className="p-2 text-slate-500 hover:bg-slate-200 rounded transition" title="Hủy">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${col.color}`}>A</span>
                                                    <div>
                                                        <span className="font-semibold text-slate-800">{col.label}</span>
                                                        {col.is_system && <span className="ml-2 text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wide">Mặc định</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                                    <button onClick={() => handleStartEdit(col)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded" title="Sửa">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(col)}
                                                        disabled={col.is_system}
                                                        className={`p-1.5 rounded ${col.is_system ? 'text-slate-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                                                        title={col.is_system ? "Không thể xóa" : "Xóa"}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Add New Block */}
                            {isAdding ? (
                                <div className="flex flex-col sm:flex-row gap-2 items-center p-3 bg-primary-50/50 border border-primary-200 border-dashed rounded-xl mt-4">
                                    <input
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 text-sm font-semibold"
                                        value={newLabel}
                                        onChange={(e) => setNewLabel(e.target.value)}
                                        placeholder="Nhập tên trạng thái mới..."
                                        autoFocus
                                    />
                                    <select
                                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400"
                                        value={newColor}
                                        onChange={(e) => setNewColor(e.target.value)}
                                    >
                                        {COLOR_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleAdd} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-semibold">
                                            Hoàn tất
                                        </button>
                                        <button onClick={() => setIsAdding(false)} className="px-3 py-2 text-slate-500 hover:bg-slate-200 rounded-lg transition text-sm">
                                            Hủy
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="w-full flex justify-center items-center gap-2 p-3 mt-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition font-medium"
                                >
                                    <Plus className="w-5 h-5" />
                                    Thêm trạng thái mới
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
