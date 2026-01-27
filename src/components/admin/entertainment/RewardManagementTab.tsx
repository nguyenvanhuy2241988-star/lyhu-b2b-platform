"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Plus, Edit, Trash2, Image as ImageIcon, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { toast } from 'sonner';

interface Reward {
    id: string;
    name: string;
    description: string;
    cost: number;
    stock: number;
    image_url: string;
    is_active: boolean;
}

export const RewardManagementTab = () => {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Reward | null>(null);

    const supabase = createClient();

    // Default form state
    const [formData, setFormData] = useState<Partial<Reward>>({
        name: '',
        description: '',
        cost: 0,
        stock: 0,
        image_url: 'Gift',
        is_active: true
    });

    const fetchRewards = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('reward_store_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error("Lỗi tải danh sách quà: " + error.message);
        } else {
            setRewards(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRewards();
    }, []);

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            cost: 0,
            stock: 0,
            image_url: 'Gift',
            is_active: true
        });
        setEditingItem(null);
    };

    const handleOpenModal = (item?: Reward) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            name: formData.name,
            description: formData.description,
            cost: Number(formData.cost),
            stock: Number(formData.stock),
            image_url: formData.image_url,
            is_active: formData.is_active
        };

        let error;
        if (editingItem) {
            const { error: updateError } = await supabase
                .from('reward_store_items')
                .update(payload)
                .eq('id', editingItem.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('reward_store_items')
                .insert([payload]);
            error = insertError;
        }

        if (error) {
            toast.error("Lỗi lưu quà: " + error.message);
        } else {
            toast.success(editingItem ? "Đã cập nhật quà" : "Đã thêm quà mới");
            handleCloseModal();
            fetchRewards();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa vật phẩm này không?")) return;

        const { error } = await supabase
            .from('reward_store_items')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error("Lỗi xóa: " + error.message);
        } else {
            toast.success("Đã xóa vật phẩm");
            fetchRewards();
        }
    };

    const toggleStatus = async (item: Reward) => {
        const { error } = await supabase
            .from('reward_store_items')
            .update({ is_active: !item.is_active })
            .eq('id', item.id);

        if (error) {
            toast.error("Lỗi cập nhật trạng thái");
        } else {
            fetchRewards();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Quản Lý Kho Quà</h3>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium text-sm shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Thêm Quà Mới
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                        <tr>
                            <th className="px-4 py-3">Ảnh</th>
                            <th className="px-4 py-3">Tên vật phẩm</th>
                            <th className="px-4 py-3">Giá (Điểm)</th>
                            <th className="px-4 py-3">Tồn kho</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rewards.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-lg">
                                        {/* Simple Emoji Mapping based on text for MVP */}
                                        {item.image_url === 'Smartphone' ? '📱' :
                                            item.image_url === 'Clock' ? '⏰' :
                                                item.image_url === 'Coffee' ? '☕' :
                                                    item.image_url === 'CupSoda' ? '🥤' : '🎁'}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="font-bold text-slate-800">{item.name}</p>
                                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{item.description}</p>
                                </td>
                                <td className="px-4 py-3 font-bold text-yellow-600">{item.cost.toLocaleString()}</td>
                                <td className="px-4 py-3">{item.stock}</td>
                                <td className="px-4 py-3">
                                    <button onClick={() => toggleStatus(item)} className="text-slate-400 hover:text-teal-600">
                                        {item.is_active ?
                                            <span className="flex items-center gap-1 text-teal-600 text-xs font-bold bg-teal-50 px-2 py-1 rounded">Active</span> :
                                            <span className="flex items-center gap-1 text-slate-500 text-xs font-bold bg-slate-100 px-2 py-1 rounded">Hidden</span>
                                        }
                                    </button>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleOpenModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {rewards.length === 0 && !loading && (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-400">Chưa có vật phẩm nào</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                            <h3 className="font-bold text-slate-800">{editingItem ? 'Sửa Quà' : 'Thêm Quà Mới'}</h3>
                            <button onClick={handleCloseModal}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên vật phẩm</label>
                                <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                                <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" rows={2}
                                    value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Giá (Điểm)</label>
                                    <input required type="number" min="0" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                        value={formData.cost} onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tồn kho</label>
                                    <input required type="number" min="0" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                        value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Loại icon (Mã)</label>
                                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    value={formData.image_url || 'Gift'} onChange={e => setFormData({ ...formData, image_url: e.target.value })}>
                                    <option value="Gift">Gift (Hộp quà)</option>
                                    <option value="Smartphone">Smartphone</option>
                                    <option value="Clock">Clock (Đồng hồ)</option>
                                    <option value="Coffee">Coffee</option>
                                    <option value="CupSoda">CupSoda</option>
                                    <option value="Crown">Crown (Vương miện)</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <label className="text-sm font-medium text-slate-700">Hiển thị trên cửa hàng?</label>
                                <input type="checkbox" className="w-4 h-4 text-teal-600 rounded"
                                    checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={handleCloseModal} className="flex-1 py-2.5 border border-slate-300 rounded-lg font-medium hover:bg-slate-50">Hủy</button>
                                <button type="submit" className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
