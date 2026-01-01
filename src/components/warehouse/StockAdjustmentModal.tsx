import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';

interface StockAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newQuantity: number, note: string) => Promise<void>;
    productName: string;
    currentStock: number;
}

export function StockAdjustmentModal({ isOpen, onClose, onSave, productName, currentStock }: StockAdjustmentModalProps) {
    const [quantity, setQuantity] = useState(currentStock);
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setQuantity(currentStock);
            setNote('');
        }
    }, [isOpen, currentStock]);

    const handleSave = async () => {
        if (quantity < 0) return;
        setIsLoading(true);
        await onSave(quantity, note || 'Kiểm kê kho');
        setIsLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-bold text-lg text-slate-900">Điều chỉnh tồn kho</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 text-sm text-amber-800">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <div>
                            Bạn đang sửa tồn kho của <strong>{productName}</strong>.
                            Hệ thống sẽ ghi lại lịch sử kiểm kê này.
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tồn kho thực tế (Cái)</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            min="0"
                        />
                        <div className="mt-1 text-xs text-slate-500 flex justify-between">
                            <span>Tồn hiện tại: {currentStock}</span>
                            <span className={quantity !== currentStock ? "text-indigo-600 font-medium" : ""}>
                                Thay đổi: {quantity - currentStock > 0 ? '+' : ''}{quantity - currentStock}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú / Lý do</label>
                        <textarea
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="VD: Kiểm kê định kỳ, Phát hiện sai lệch..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
                        disabled={isLoading}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
}
