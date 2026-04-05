'use client';

import React, { useRef, useState, useEffect } from 'react';
import { COMPANY_INFO } from '@/lib/companyConfig';
import { Printer, Download, X, FileText, Check } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

const fmtPrice = (n: number | null | undefined) => new Intl.NumberFormat('vi-VN').format(n || 0);

interface EquipmentItem {
    id: string;
    name: string;
    equipment_type: string;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    status: string;
    condition: string;
    notes: string | null;
    image_url?: string | null;
    warranty_info?: string | null;
    warranty_expiry?: string | null;
    value_amount?: number | null;
    created_at: string;
}

interface EquipmentHandoverModalProps {
    items: EquipmentItem[];
    onClose: () => void;
}

const DEFAULT_TERMS = `- Sinh hoạt và làm việc bảo quản tài sản của công ty.
- Không tự ý cho mượn, tháo rời hoặc mang thiết bị ra khỏi phạm vi ủy quyền khi chưa được sự đồng ý.
- Sử dụng đúng mục đích cho công việc và dự án đã được giao phó.
- Trong quá trình sử dụng nếu xảy ra hỏng hóc vật lý, rơi vỡ, vào nước (lỗi chủ quan), người nhận bàn giao phải chịu trách nhiệm đền bù theo % mức giá trị tài sản đã kê khai.
- Hoàn trả nguyên trạng thiết bị đúng thời hạn yêu cầu hoặc khi kết thúc dự án.`;

export default function EquipmentHandoverModal({ items, onClose }: EquipmentHandoverModalProps) {
    const supabase = createClient();
    const printRef = useRef<HTMLDivElement>(null);
    
    const [receiverName, setReceiverName] = useState('');
    const [profileList, setProfileList] = useState<{ id: string, full_name: string }[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    
    const [terms, setTerms] = useState(DEFAULT_TERMS);

    useEffect(() => {
        // Load user profiles for autocomplete
        const loadUsers = async () => {
            const { data } = await supabase.from('profiles').select('id, full_name').order('full_name');
            if (data) setProfileList((data as any[]).filter((u: any) => u.full_name));
        };
        loadUsers();
    }, [supabase]);

    const handlePrint = () => window.print();

    const handleExportPDF = () => {
        window.print();
    };

    const totalValue = items.reduce((sum, item) => sum + (Number(item.value_amount) || 0), 0);
    const today = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <div className="handover-print-overlay fixed inset-0 z-[100] flex flex-col bg-slate-900/40 backdrop-blur-sm">
            {/* Control Header */}
            <div className="bg-slate-900 text-white p-4 shadow-xl flex items-center justify-between shrink-0 relative z-10 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-primary-400 font-bold px-4 py-1.5 bg-primary-950/50 border border-primary-800 rounded-lg">
                        <FileText className="w-4 h-4" /> BIÊN BẢN BÀN GIAO THIẾT BỊ
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors">
                        <Printer className="w-4 h-4" /> In
                    </button>
                    <button onClick={handleExportPDF}
                        className="flex items-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors">
                        <Download className="w-4 h-4" /> Xuất PDF
                    </button>
                    <button onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* SETTINGS SIDEBAR */}
                <div className="w-[300px] sm:w-[350px] bg-white border-r border-slate-200 p-6 overflow-y-auto shrink-0 print:hidden">
                    <h3 className="font-bold text-slate-800 mb-6 uppercase text-sm tracking-wide">Cấu hình biên bản</h3>
                    
                    <div className="space-y-6">
                        {/* Receiver Combobox */}
                        <div className="relative">
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Bên nhận (Người mượn)</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Gõ tên hoặc chọn danh sách..."
                                value={receiverName}
                                onChange={(e) => {
                                    setReceiverName(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                            />
                            {showDropdown && profileList.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                    {profileList.filter(p => p.full_name?.toLowerCase().includes(receiverName.toLowerCase())).map(p => (
                                        <div key={p.id} 
                                            className="px-3 py-2 text-sm text-slate-700 hover:bg-primary-50 cursor-pointer"
                                            onClick={() => {
                                                setReceiverName(p.full_name);
                                                setShowDropdown(false);
                                            }}
                                        >
                                            {p.full_name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Điều khoản & Trách nhiệm</label>
                            <textarea
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[250px]"
                                value={terms}
                                onChange={(e) => setTerms(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* PREVIEW PANEL */}
                <div className="flex-1 overflow-y-auto bg-slate-100 p-8 handover-scroll-container">
                    <style>{`
                        @media print {
                            body {
                                visibility: hidden;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            .handover-print-overlay {
                                visibility: visible !important;
                                position: absolute !important;
                                left: 0;
                                top: 0;
                                width: 100vw;
                                background: white !important;
                                display: block !important;
                            }
                            .handover-print-overlay > div {
                                display: block !important;
                                overflow: visible !important;
                            }
                            .handover-controls { display: none !important; }
                            .handover-scroll-container {
                                max-height: none !important;
                                height: auto !important;
                                overflow: visible !important;
                                background: white !important;
                                padding: 0 !important;
                                display: block !important;
                            }
                            .handover-print-page {
                                box-shadow: none !important;
                                margin: 0 !important;
                                border-radius: 0 !important;
                                width: 100% !important;
                                max-width: 100% !important;
                                display: block !important;
                            }
                            @page { size: A4; margin: 15mm; }
                        }
                    `}</style>
                    <div ref={printRef}
                        className="handover-print-page bg-white w-full max-w-[800px] mx-auto rounded-xl shadow-2xl overflow-hidden flex flex-col"
                        style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                        
                        {/* HEADER */}
                        <div className="px-10 pt-10 pb-6 flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/logo-full.png" alt="LYHU" className="h-12 object-contain" />
                                <div>
                                    <p className="font-bold text-sm tracking-wide text-slate-900 uppercase">{COMPANY_INFO.name}</p>
                                    <p className="text-xs text-slate-600 mt-0.5">Mã số thuế: 0110940697</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-sm">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                <p className="font-bold text-xs underline mt-0.5">Độc lập - Tự do - Hạnh phúc</p>
                            </div>
                        </div>

                        {/* TITLE */}
                        <div className="text-center mt-4 mb-8 px-10">
                            <h1 className="text-2xl font-bold uppercase tracking-wide">BIÊN BẢN BÀN GIAO THIẾT BỊ MEDIA</h1>
                            <p className="text-sm italic mt-2">Hà Nội, ngày {today.split('/')[0]} tháng {today.split('/')[1]} năm {today.split('/')[2]}</p>
                        </div>

                        <div className="px-10 text-[14px] leading-relaxed space-y-4">
                            <p>Hôm nay, ngày {today}, chúng tôi gồm có:</p>
                            
                            {/* PARTIES */}
                            <div className="space-y-3">
                                <div>
                                    <p className="font-bold uppercase tracking-wide">BÊN GIAO: ĐẠI DIỆN {COMPANY_INFO.name}</p>
                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                        <li>Người bàn giao: <strong>Thủ kho / Quản lý Media</strong></li>
                                        <li>Điện thoại liên hệ: {COMPANY_INFO.hotline}</li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-bold uppercase tracking-wide">BÊN NHẬN (NGƯỜI CHỊU TRÁCH NHIỆM CHÍNH):</p>
                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                        <li>Họ và tên: <strong className="uppercase">{receiverName || '...................................................'}</strong></li>
                                    </ul>
                                </div>
                            </div>

                            <p>Bên Giao đồng ý bàn giao và Bên Nhận đồng ý nhận các trang thiết bị với chi tiết như sau:</p>

                            {/* TABLE */}
                            <div className="mt-4 border border-slate-900 mx-auto w-full">
                                <table className="w-full text-[13px] border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100/50">
                                            <th className="border border-slate-900 p-2 text-center w-12">STT</th>
                                            <th className="border border-slate-900 p-2 text-left">Tên thiết bị / Model</th>
                                            <th className="border border-slate-900 p-2 text-center">Serial Number</th>
                                            <th className="border border-slate-900 p-2 text-center">Tình trạng</th>
                                            <th className="border border-slate-900 p-2 text-center">Hạn BH</th>
                                            <th className="border border-slate-900 p-2 text-right">Giá trị (VNĐ)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((it, idx) => (
                                            <tr key={idx}>
                                                <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                                                <td className="border border-slate-900 p-2">
                                                    <div className="font-bold">{it.name}</div>
                                                    {it.model && <div className="text-xs text-slate-600">{it.model}</div>}
                                                </td>
                                                <td className="border border-slate-900 p-2 text-center font-mono text-xs">{it.serial_number || '-'}</td>
                                                <td className="border border-slate-900 p-2 text-center">{it.condition === 'excellent' ? 'Rất tốt' : it.condition === 'good' ? 'Tốt' : it.condition === 'fair' ? 'Trung bình' : 'Cần sửa'}</td>
                                                <td className="border border-slate-900 p-2 text-center">{it.warranty_expiry ? new Date(it.warranty_expiry).toLocaleDateString('vi-VN') : '-'}</td>
                                                <td className="border border-slate-900 p-2 text-right font-bold">{fmtPrice(it.value_amount)}</td>
                                            </tr>
                                        ))}
                                        {/* Total Summary */}
                                        <tr>
                                            <td colSpan={5} className="border border-slate-900 p-2 text-right font-bold uppercase">Tổng cộng giá trị bàn giao</td>
                                            <td className="border border-slate-900 p-2 text-right font-bold text-base">{fmtPrice(totalValue)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* TERMS & CONDITIONS (Kept together with signatures if possible, but standard layout allows breaking) */}
                            <div className="pt-4 space-y-2">
                                <p className="font-bold uppercase tracking-wide">CAM KẾT & TRÁCH NHIỆM BÊN NHẬN:</p>
                                <div className="pl-4">
                                    {terms.split('\n').filter(t => t.trim()).map((t, i) => (
                                        <p key={i} className="mb-2 whitespace-pre-line text-justify">{t.trim()}</p>
                                    ))}
                                </div>
                            </div>
                            
                            <p className="pt-2 italic text-[13px] text-justify">
                                Biên bản này được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 (một) bản kể từ ngày lý. Mọi vấn đề phát sinh sẽ được giải quyết dựa trên quy định bồi thường trang thiết bị của công ty.
                            </p>
                        </div>

                        {/* SIGNATURES - Kept Together */}
                        <div className="mt-12 px-10 pb-20 flex justify-between" style={{ pageBreakInside: 'avoid' }}>
                            <div className="text-center w-64">
                                <p className="font-bold text-sm uppercase">ĐẠI DIỆN BÊN GIAO</p>
                                <p className="text-xs italic mt-1">(Ký và ghi rõ họ tên)</p>
                                {/* Leave blank vertical space for signature */}
                                <div className="h-28"></div>
                                <div className="border-b border-dotted border-slate-400 w-3/4 mx-auto mb-1"></div>
                            </div>
                            <div className="text-center w-64">
                                <p className="font-bold text-sm uppercase">ĐẠI DIỆN BÊN NHẬN</p>
                                <p className="text-xs italic mt-1">(Ký và ghi rõ họ tên)</p>
                                {/* Leave blank vertical space for signature */}
                                <div className="h-28"></div>
                                <div className="border-b border-dotted border-slate-400 w-3/4 mx-auto mb-1"></div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

