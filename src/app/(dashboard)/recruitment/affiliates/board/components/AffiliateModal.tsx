"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Upload, XCircle, ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabaseClient';

const PLATFORMS = ['TikTok', 'Facebook', 'Shopee', 'Lazada', 'Instagram', 'YouTube', 'Website', 'Khác'];

export function AffiliateModal({ isOpen, onClose, partner, onSaved }: any) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'CTV',
    platform: 'TikTok',
    profile_link: '',
    phone: '',
    email: '',
    zalo: '',
    collaboration_types: [] as string[],
    status: 'LEAD',
    notes: '',
    evidence_images: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [usePhoneForZalo, setUsePhoneForZalo] = useState(false);

  useEffect(() => {
    if (partner) {
      setFormData({
        ...partner,
        collaboration_types: partner.collaboration_types || [],
        evidence_images: partner.evidence_images || [],
        platform: partner.platform || 'TikTok'
      });
      if (partner.phone && partner.phone === partner.zalo) {
        setUsePhoneForZalo(true);
      }
    } else {
      setFormData({
        name: '',
        type: 'CTV',
        platform: 'TikTok',
        profile_link: '',
        phone: '',
        email: '',
        zalo: '',
        collaboration_types: [],
        status: 'LEAD',
        notes: '',
        evidence_images: []
      });
      setUsePhoneForZalo(false);
    }
  }, [partner]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'phone' && usePhoneForZalo) {
        next.zalo = value;
      }
      return next;
    });
  };

  const handleCheckboxChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      collaboration_types: prev.collaboration_types.includes(type)
        ? prev.collaboration_types.filter(t => t !== type)
        : [...prev.collaboration_types, type]
    }));
  };

  const handleUsePhoneForZalo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setUsePhoneForZalo(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, zalo: prev.phone }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const supabase = createClient();
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `affiliates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        evidence_images: [...prev.evidence_images, data.publicUrl]
      }));
      toast.success('Tải ảnh lên thành công');
    } catch (e) {
      toast.error('Lỗi upload ảnh');
      console.error(e);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      evidence_images: prev.evidence_images.filter((_, i) => i !== indexToRemove)
    }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Vui lòng nhập tên đối tác');
      return;
    }

    setLoading(true);
    try {
      const method = partner ? 'PUT' : 'POST';
      const body = partner ? { ...formData, id: partner.id } : formData;

      const res = await fetch('/api/recruitment/affiliates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Cập nhật thất bại');
      }
      
      toast.success(partner ? 'Cập nhật thành công' : 'Thêm mới thành công');
      onSaved();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error('Có lỗi xảy ra: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-slate-800">
            {partner ? 'Chỉnh sửa Đối tác' : 'Thêm Đối tác Mới'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên đối tác / Kênh *</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
                placeholder="Ví dụ: Kênh Của Bạn..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phân loại</label>
              <select 
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="CTV">Cộng tác viên (CTV)</option>
                <option value="KOL">KOL (Người nổi tiếng)</option>
                <option value="KOC">KOC (Người tiêu dùng)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nền tảng</label>
              <select 
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {PLATFORMS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Link Kênh/Profile</label>
              <input 
                type="text" 
                name="profile_link"
                value={formData.profile_link}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg" 
                placeholder="https://tiktok.com/@..."
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Điện thoại</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Zalo</label>
                <label className="flex items-center space-x-1 text-xs cursor-pointer">
                  <input type="checkbox" checked={usePhoneForZalo} onChange={handleUsePhoneForZalo} className="rounded text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-slate-500">Dùng SĐT</span>
                </label>
              </div>
              <input type="text" name="zalo" value={formData.zalo} onChange={handleChange} disabled={usePhoneForZalo} className="w-full px-3 py-2 border rounded-lg disabled:bg-slate-100 disabled:text-slate-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-3">Hình thức hợp tác</label>
            <div className="flex space-x-6">
              {[
                { id: 'VIDEO', label: 'Làm Video' },
                { id: 'PRODUCT', label: 'Tặng Sản phẩm' },
                { id: 'MONEY', label: 'Cát-xê (Tiền)' }
              ].map(type => (
                <label key={type.id} className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.collaboration_types.includes(type.id)}
                    onChange={() => handleCheckboxChange(type.id)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="text-slate-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú (Tình trạng trao đổi, Báo giá...)</label>
            <textarea 
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg resize-none"
              placeholder="Nhập nội dung trao đổi chi tiết..."
            />
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Minh chứng (Ảnh chụp tin nhắn, email)</label>
            
            {formData.evidence_images.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                {formData.evidence_images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200">
                    <img src={img} alt="Evidence" className="w-full h-24 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => removeImage(idx)} className="p-1 bg-white rounded-full text-red-500 hover:text-red-600 transition-colors">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <label className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors cursor-pointer rounded-lg p-6 flex flex-col items-center justify-center text-emerald-600 bg-emerald-50/50">
              {uploading ? <Loader2 className="w-6 h-6 mb-2 animate-spin" /> : <Upload className="w-6 h-6 mb-2" />}
              <span className="text-sm font-medium">{uploading ? 'Đang tải lên...' : 'Bấm để tải ảnh lên'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>

        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-slate-50 sticky bottom-0">
          <button onClick={onClose} disabled={loading || uploading} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50">Hủy</button>
          <button onClick={handleSave} disabled={loading || uploading} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Đang lưu...' : 'Lưu Hồ Sơ'}
          </button>
        </div>
      </div>
    </div>
  );
}
