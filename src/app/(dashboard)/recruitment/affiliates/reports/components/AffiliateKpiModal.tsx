"use client";

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { toast } from 'sonner';

export function AffiliateKpiModal({ isOpen, onClose, onSaved }: any) {
  const [loading, setLoading] = useState(false);
  const [kpiData, setKpiData] = useState({
    user_id: '',
    found_target: 50,
    contacted_target: 30,
    won_target: 5
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recruitment/affiliates/kpi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kpiData)
      });
      if (!res.ok) throw new Error('Cập nhật thất bại');
      toast.success('Cập nhật KPI thành công');
      onSaved();
      onClose();
    } catch (e) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-800">Cài đặt Target KPI</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mã User ID (HR)</label>
            <input type="text" value={kpiData.user_id} onChange={e => setKpiData({...kpiData, user_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Nhập ID nhân viên..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chỉ tiêu: Tìm thấy mới</label>
            <input type="number" value={kpiData.found_target} onChange={e => setKpiData({...kpiData, found_target: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chỉ tiêu: Đã liên hệ</label>
            <input type="number" value={kpiData.contacted_target} onChange={e => setKpiData({...kpiData, contacted_target: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chỉ tiêu: Chốt hợp tác</label>
            <input type="number" value={kpiData.won_target} onChange={e => setKpiData({...kpiData, won_target: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <div className="flex justify-end p-6 border-t bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-700 mr-3 bg-white border rounded-lg">Hủy</button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Lưu Cài đặt</button>
        </div>
      </div>
    </div>
  );
}
