"use client";

import { useState, useEffect, useCallback } from "react";
import {
    fetchExpenses, createExpense, updateExpense, deleteExpense,
    Expense, EXPENSE_CATEGORY_LABELS, ExpenseCategory,
    markExpensesAsSynced
} from "@/lib/expensesStore";
import {
    Plus, Search, Filter, Loader2, Trash2,
    Pencil, Save, X, Receipt, Wallet,
    TrendingDown, Calendar, Tag, FileText,
    CheckCircle, Clock, CheckSquare, Square
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { exportExpensesToMISA } from "@/lib/misaExportStore";

export default function AccountantExpensesPage() {
    const { user, session } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState<number>(0);
    const [category, setCategory] = useState<ExpenseCategory>("other");
    const [spentAt, setSpentAt] = useState(new Date().toISOString().split('T')[0]);
    const [account, setAccount] = useState("");
    const [accountingObject, setAccountingObject] = useState("");

    // Selection for bulk sync
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchExpenses(session?.access_token);
            setExpenses(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || amount <= 0) {
            alert("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                description,
                amount,
                category,
                spent_at: spentAt,
                accounting_account: account,
                accounting_object: accountingObject,
                created_by: user?.id
            };

            let success = false;
            if (editingExpense) {
                success = await updateExpense(editingExpense.id, payload, session?.access_token);
            } else {
                const res = await createExpense(payload, session?.access_token);
                success = !!res;
            }

            if (success) {
                closeModal();
                loadData();
            } else {
                alert("Không thể lưu chi phí. Vui lòng thử lại.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBulkSync = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Xác nhận đánh dấu ${selectedIds.length} khoản chi đã đồng bộ MISA?`)) return;

        const success = await markExpensesAsSynced(selectedIds, session?.access_token);
        if (success) {
            setSelectedIds([]);
            loadData();
        } else {
            alert("Lỗi khi cập nhật trạng thái.");
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === expenses.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(expenses.map(e => e.id));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa khoản chi này?")) return;

        try {
            const success = await deleteExpense(id, session?.access_token);
            if (success) loadData();
        } catch (err) {
            console.error(err);
        }
    };

    const openEditModal = (expense: Expense) => {
        setEditingExpense(expense);
        setDescription(expense.description);
        setAmount(expense.amount);
        setCategory(expense.category);
        setSpentAt(new Date(expense.spent_at).toISOString().split('T')[0]);
        setAccount(expense.accounting_account || "");
        setAccountingObject(expense.accounting_object || "");
        setShowAddModal(true);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingExpense(null);
        setDescription("");
        setAmount(0);
        setCategory("other");
        setSpentAt(new Date().toISOString().split('T')[0]);
        setAccount("");
        setAccountingObject("");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Chi phí</h1>
                    <p className="text-sm text-slate-600 mt-1">Ghi nhận và quản lý các khoản chi vận hành</p>
                </div>
                <div className="flex gap-3">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkSync}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Đánh dấu Sync ({selectedIds.length})
                        </button>
                    )}
                    <button
                        onClick={() => exportExpensesToMISA(expenses)}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        Xuất MISA Excel
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm phiếu chi
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Tổng chi tháng này</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                            expenses.reduce((sum, e) => sum + e.amount, 0)
                        )}
                    </div>
                </div>
                {/* More stats if needed */}
            </div>

            {/* Expense List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Wallet className="w-12 h-12 text-slate-200 mb-4" />
                        <p className="text-slate-500">Chưa có dữ liệu chi phí.</p>
                    </div>
                ) : (
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 border-b text-slate-600 font-medium">
                                <tr>
                                    <th className="px-6 py-4 w-10">
                                        <button onClick={toggleSelectAll} className="p-1 hover:bg-slate-200 rounded">
                                            {selectedIds.length === expenses.length ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4" />}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4">Ngày</th>
                                    <th className="px-6 py-4">Nội dung / Phân loại</th>
                                    <th className="px-6 py-4">Đồng bộ MISA</th>
                                    <th className="px-6 py-4">Số tiền</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {expenses.map((expense) => (
                                    <tr key={expense.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(expense.id) ? 'bg-primary-50/30' : ''}`}>
                                        <td className="px-6 py-4">
                                            <button onClick={() => toggleSelect(expense.id)} className="p-1 hover:bg-slate-200 rounded transition-colors">
                                                {selectedIds.includes(expense.id) ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                {new Date(expense.spent_at).toLocaleDateString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{expense.description}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">
                                                    {EXPENSE_CATEGORY_LABELS[expense.category]}
                                                </span>
                                                {expense.accounting_account && (
                                                    <span className="text-[10px] text-primary-600 font-mono">TK {expense.accounting_account}</span>
                                                )}
                                                {expense.accounting_object && (
                                                    <span className="text-[10px] text-indigo-500 font-mono">/ DT: {expense.accounting_object}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {expense.misa_sync_status === 'synced' ? (
                                                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    ĐÃ SYNC
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs bg-slate-50 px-2 py-1 rounded-lg w-fit">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    CHỜ SYNC
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-red-600">
                                                -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expense.amount)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(expense)}
                                                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* Mobile Card List View */}
                {!isLoading && expenses.length > 0 && (
                    <div className="lg:hidden divide-y divide-slate-100">
                        {expenses.map((expense) => (
                            <div key={expense.id} className={`p-4 bg-white hover:bg-slate-50 transition-colors ${selectedIds.includes(expense.id) ? 'bg-primary-50/30' : ''}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-3">
                                        <button onClick={() => toggleSelect(expense.id)} className="p-1 hover:bg-slate-200 rounded transition-colors mt-0.5">
                                            {selectedIds.includes(expense.id) ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                                        </button>
                                        <div>
                                            <div className="font-bold text-slate-900 line-clamp-2">{expense.description}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                <span className="text-xs text-slate-500">{new Date(expense.spent_at).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-red-600 text-base">
                                            -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expense.amount)}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">
                                            {EXPENSE_CATEGORY_LABELS[expense.category]}
                                        </span>
                                        {expense.accounting_account && (
                                            <span className="text-[10px] text-primary-600 font-mono">TK {expense.accounting_account}</span>
                                        )}
                                        {expense.accounting_object && (
                                            <span className="text-[10px] text-indigo-500 font-mono line-clamp-1">DT: {expense.accounting_object}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                                        <span className="text-xs text-slate-500">MISA Sync:</span>
                                        {expense.misa_sync_status === 'synced' ? (
                                            <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase">
                                                <CheckCircle className="w-3 h-3" />
                                                Đã Sync
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-slate-400 font-bold text-[10px] uppercase">
                                                <Clock className="w-3 h-3" />
                                                Chờ Sync
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(expense)}
                                        className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(expense.id)}
                                        className="flex-1 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Post Expense Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-slate-900">
                                {editingExpense ? "Cập nhật phiếu chi" : "Tạo phiếu chi mới"}
                            </h3>
                            <button onClick={closeModal} className="p-1 hover:bg-slate-200 rounded-lg">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nội dung chi *</label>
                                <input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ví dụ: Thanh toán tiền điện tháng 12"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Số tiền (VND) *</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ngày chi</label>
                                    <input
                                        type="date"
                                        value={spentAt}
                                        onChange={(e) => setSpentAt(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phân loại</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    >
                                        {Object.entries(EXPENSE_CATEGORY_LABELS).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">TK Mẫu MISA</label>
                                        <input
                                            value={account}
                                            onChange={(e) => setAccount(e.target.value)}
                                            placeholder="641, 642, 111..."
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Đối tượng hạch toán</label>
                                        <input
                                            value={accountingObject}
                                            onChange={(e) => setAccountingObject(e.target.value)}
                                            placeholder="Mã NCC hoặc NV"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {editingExpense ? "Cập nhật" : "Lưu phiếu chi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
