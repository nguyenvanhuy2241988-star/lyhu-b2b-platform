'use client';

import { useState, useEffect } from 'react';
import { Tag } from 'lucide-react';

export default function BlogVoucherList({ vouchers }: { vouchers: any[] }) {
    const [savedVouchers, setSavedVouchers] = useState<string[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('lyhu_saved_vouchers');
        if (saved) {
            try {
                setSavedVouchers(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse saved vouchers', e);
            }
        }
    }, []);

    const handleSaveVoucher = (id: string) => {
        if (savedVouchers.includes(id)) return;
        const newSaved = [...savedVouchers, id];
        setSavedVouchers(newSaved);
        localStorage.setItem('lyhu_saved_vouchers', JSON.stringify(newSaved));
        alert('Đã lưu mã vào ví thành công!');
    };

    // Fallback if no active vouchers in DB
    const displayVouchers = vouchers && vouchers.length > 0 ? vouchers : [
        { id: 'mock-1', name: 'Giảm 15K', description: 'Đơn từ 500K' },
        { id: 'mock-2', name: 'Freeship', description: 'Đơn từ 1 Triệu' },
        { id: 'mock-3', name: 'Tặng Quà', description: 'Mua lốc Coca Cola' }
    ];

    return (
        <div className="mb-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {displayVouchers.map(v => (
                <div key={v.id} className="min-w-[160px] md:min-w-[200px] shrink-0 bg-primary-50 rounded-lg p-3 border border-primary-200 border-dashed flex flex-col justify-between snap-start">
                    <div className="flex items-start gap-2 mb-3">
                        <Tag className="w-5 h-5 text-primary-600 shrink-0" />
                        <div>
                            <p className="font-bold text-primary-800 text-sm">{v.name}</p>
                            {v.description && <p className="text-xs text-primary-600 line-clamp-1 mt-0.5">{v.description}</p>}
                        </div>
                    </div>
                    <button
                        onClick={() => handleSaveVoucher(v.id)}
                        disabled={savedVouchers.includes(v.id)}
                        className={`w-full py-1.5 rounded text-xs font-bold transition-colors ${
                            savedVouchers.includes(v.id) 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                    >
                        {savedVouchers.includes(v.id) ? 'Đã lưu' : 'Lưu mã ngay'}
                    </button>
                </div>
            ))}
        </div>
    );
}
