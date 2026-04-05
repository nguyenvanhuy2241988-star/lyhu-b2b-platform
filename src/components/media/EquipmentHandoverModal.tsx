'use client';

import React, { useRef, useState, useEffect } from 'react';
import { COMPANY_INFO } from '@/lib/companyConfig';
import { Printer, Download, X, FileText } from 'lucide-react';
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

const DEFAULT_TERMS = `Bên B xác nhận đã kiểm tra kỹ tình trạng, số lượng thiết bị và đồng ý ký nhận với các điều khoản trách nhiệm sau:

Điều 1. Mục đích sử dụng
1.1. Chỉ sử dụng thiết bị đúng mục đích phục vụ cho công việc và dự án đã được Công ty giao phó.
1.2. Tuyệt đối KHÔNG tự ý mang thiết bị ra khỏi phạm vi ủy quyền, không cho mượn, cho thuê, cầm cố hoặc sử dụng cho mục đích cá nhân khi chưa có sự đồng ý bằng văn bản của Bạn Giám đốc.

Điều 2. Trách nhiệm bảo quản và Quy trình vận hành
Bên B chịu trách nhiệm hoàn toàn trong việc bảo quản an toàn tài sản và cam kết tuân thủ nghiêm ngặt quy trình vận hành thiết bị của Công ty:
2.1. Trước khi sử dụng (Setup): Đảm bảo thiết bị được vệ sinh sạch sẽ. Khu vực lắp đặt phải khô ráo, an toàn. Khi gắn máy ảnh lên chân máy hoặc lắp đèn lên chân đèn, Bên B phải kiểm tra kỹ các chốt khóa, ngàm giữ. Bắt buộc có biện pháp gia cố (vd: bao cát đối trọng) cho các thiết bị tản sáng lớn để tránh ngã đổ.
2.2. Trong và sau quá trình sử dụng: Tuyệt đối cẩn trọng khi thao tác gần các sản phẩm có chứa chất lỏng, dầu mỡ, hoặc vụn thực phẩm. Phải vệ sinh thiết bị ngay lập tức nếu dính bẩn. Bắt buộc tắt nguồn máy ảnh trước khi tháo/lắp ống kính. Đối với đèn công suất cao phải tắt nguồn và để làm mát từ 5-10 phút.
2.3. Lưu kho và bảo quản định kỳ: Khi không sử dụng, máy ảnh và ống kính bắt buộc phải bảo quản trong tủ chống ẩm của Công ty (độ ẩm 40%-50%). Tháo rời pin khỏi máy ảnh và thiết bị điện tử nếu không sử dụng từ 03 ngày trở lên.

Điều 3. Quản lý dữ liệu số
Mọi dữ liệu hình ảnh, video lưu trữ trên thẻ nhớ hoặc máy ảnh thuộc bản quyền sở hữu của Bên A. Bên B có trách nhiệm bảo mật và bàn giao toàn bộ dữ liệu dự án nguyên vẹn trước khi hoàn trả thiết bị hoặc khi có yêu cầu.

Điều 4. Trách nhiệm bồi thường và Xử lý sự cố
4.1. Trong trường hợp xảy ra hỏng hóc vật lý, rơi vỡ, vào nước, chập cháy do lỗi chủ quan hoặc do việc sử dụng sai quy định, Bên B có trách nhiệm phải báo cáo ngay lập tức về tình trạng thiết bị.
4.2. Bên B sẽ chịu trách nhiệm đền bù % giá trị tài sản đã kê khai tùy theo mức độ thiệt hại của thiết bị theo quyết định của Ban Giám Đốc.`;

export default function EquipmentHandoverModal({ items, onClose }: EquipmentHandoverModalProps) {
    const supabase = createClient();
    const printRef = useRef<HTMLDivElement>(null);
    
    const [companyInfo, setCompanyInfo] = useState({
        name: COMPANY_INFO.name,
        taxCode: '0110940697',
        phone: COMPANY_INFO.hotline,
        email: COMPANY_INFO.email,
        website: COMPANY_INFO.website,
        address: COMPANY_INFO.address
    });
    
    const [giverInfo, setGiverInfo] = useState({
        name: 'Thủ kho / Quản lý Media',
        phone: COMPANY_INFO.hotline,
    });

    const [receiverInfo, setReceiverInfo] = useState({
        name: '',
        phone: '',
        idCard: '',
        position: '',
        address: ''
    });

    const [profileList, setProfileList] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    
    const [terms, setTerms] = useState(DEFAULT_TERMS);

    useEffect(() => {
        const loadUsers = async () => {
            const { data } = await supabase.from('profiles').select('*').order('full_name');
            if (data) setProfileList(data.filter((u: any) => u.full_name));
        };
        loadUsers();
    }, [supabase]);

    const handlePrint = () => window.print();

    const handleExportPDF = () => {
        window.print();
    };

    const totalValue = items.reduce((sum, item) => sum + (Number(item.value_amount) || 0), 0);
    const today = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const renderTermLine = (t: string, idx: number) => {
        const text = t.trim();
        const isHeading = /^điều\s*\d+[:.]?/i.test(text);
        if (isHeading) {
            return <p key={idx} className="mt-4 mb-2 uppercase font-bold text-[14px] text-teal-800">{text}</p>;
        }
        
        const isSubHeading = /^\d+\.\d+\.?/.test(text);
        if (isSubHeading) {
            return (
                <p key={idx} className="mb-2 text-justify leading-relaxed ml-2 text-[13px]">
                    <span className="font-semibold text-teal-800 underline mr-1">{text.match(/^\d+\.\d+\.?/)?.[0]}</span>
                    <span>{text.replace(/^\d+\.\d+\.?/, '').trim()}</span>
                </p>
            );
        }

        return <p key={idx} className="mb-2 text-justify leading-relaxed italic text-[13px] text-slate-800">{text}</p>;
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/40 backdrop-blur-sm print:block print:bg-white print:static">
            {/* Control Header */}
            <div className="bg-slate-900 text-white p-4 shadow-xl flex items-center justify-between shrink-0 relative z-10 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-teal-400 font-bold px-4 py-1.5 bg-teal-950/50 border border-teal-800 rounded-lg">
                        <FileText className="w-4 h-4" /> BIÊN BẢN BÀN GIAO THIẾT BỊ
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl transition-colors">
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

            <div className="flex flex-1 overflow-hidden print:overflow-visible print:block pb-[100px] print:pb-0">
                {/* SETTINGS SIDEBAR */}
                <div className="w-[300px] sm:w-[350px] md:w-[450px] bg-white border-r border-slate-200 p-6 overflow-y-auto shrink-0 print:hidden shadow-lg z-10">
                    <h3 className="font-bold text-slate-800 mb-6 uppercase text-sm tracking-wide border-b border-teal-500 pb-2 inline-block">Cấu hình biên bản</h3>
                    
                    <div className="space-y-8">
                        {/* Company Info */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-teal-500 rounded-full" /> THÔNG TIN CÔNG TY</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tên công ty</label>
                                    <input type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm shadow-sm"
                                        value={companyInfo.name} onChange={e => setCompanyInfo({...companyInfo, name: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Mã số thuế</label>
                                        <input type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm shadow-sm"
                                            value={companyInfo.taxCode} onChange={e => setCompanyInfo({...companyInfo, taxCode: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Hotline</label>
                                        <input type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm shadow-sm"
                                            value={companyInfo.phone} onChange={e => setCompanyInfo({...companyInfo, phone: e.target.value})} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                                        <input type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm shadow-sm"
                                            value={companyInfo.email} onChange={e => setCompanyInfo({...companyInfo, email: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Website</label>
                                        <input type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm shadow-sm"
                                            value={companyInfo.website} onChange={e => setCompanyInfo({...companyInfo, website: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ trụ sở</label>
                                    <textarea className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm shadow-sm" rows={2}
                                        value={companyInfo.address} onChange={e => setCompanyInfo({...companyInfo, address: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {/* Giver Info */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> ĐẠI DIỆN BÊN GIAO</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Người bàn giao</label>
                                    <input type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm shadow-sm"
                                        value={giverInfo.name} onChange={e => setGiverInfo({...giverInfo, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Điện thoại</label>
                                    <input type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm shadow-sm"
                                        value={giverInfo.phone} onChange={e => setGiverInfo({...giverInfo, phone: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {/* Receiver Info */}
                        <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-200">
                            <h4 className="text-xs font-bold text-teal-700 mb-3 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-teal-600 rounded-full" /> BÊN NHẬN (NGƯỜI MƯỢN)</h4>
                            <div className="space-y-3">
                                <div className="relative">
                                    <label className="block text-xs font-semibold text-teal-900 mb-1">Họ và tên *</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-teal-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 font-bold bg-white shadow-sm placeholder:font-normal placeholder:text-slate-400"
                                        placeholder="Gõ tên để tìm trên hệ thống..."
                                        value={receiverInfo.name}
                                        onChange={(e) => {
                                            setReceiverInfo({...receiverInfo, name: e.target.value});
                                            setShowDropdown(true);
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                    />
                                    {showDropdown && profileList.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                            {profileList.filter(p => (p.full_name || '').toLowerCase().includes(receiverInfo.name.toLowerCase())).map(p => (
                                                <div key={p.id} 
                                                    className="px-3 py-2 text-sm text-slate-700 hover:bg-teal-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                    onClick={() => {
                                                        setReceiverInfo({
                                                            ...receiverInfo,
                                                            name: p.full_name,
                                                            phone: p.phone || '',
                                                            position: p.role || ''
                                                        });
                                                        setShowDropdown(false);
                                                    }}
                                                >
                                                    <div className="font-bold">{p.full_name}</div>
                                                    <div className="text-[10px] text-slate-400">{p.role} - {p.phone}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Căn cước công dân</label>
                                        <input type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm shadow-sm bg-white" placeholder="0010..."
                                            value={receiverInfo.idCard} onChange={e => setReceiverInfo({...receiverInfo, idCard: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Điện thoại</label>
                                        <input type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm shadow-sm bg-white" placeholder="09..."
                                            value={receiverInfo.phone} onChange={e => setReceiverInfo({...receiverInfo, phone: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Vị trí công tác</label>
                                    <input type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm shadow-sm bg-white" placeholder="Media Creator, Editor..."
                                        value={receiverInfo.position} onChange={e => setReceiverInfo({...receiverInfo, position: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ thường trú</label>
                                    <textarea className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm shadow-sm bg-white" rows={2} placeholder="Số nhà, đường, phường/xã..."
                                        value={receiverInfo.address} onChange={e => setReceiverInfo({...receiverInfo, address: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="mb-10">
                            <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-400 rounded-full" /> ĐIỀU KHOẢN (AI Auto Parse Định Dạng)</h4>
                            <p className="text-[10px] text-slate-400 mb-2 italic">Mẹo: Bắt đầu dòng bằng "Điều 1." máy sẽ tự IN ĐẬM. Bắt đầu bằng "1.1." máy sẽ căn lề tạo điểm nhấn.</p>
                            <textarea
                                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-[13px] font-mono text-slate-700 focus:ring-2 focus:ring-teal-500 min-h-[300px] shadow-inner leading-relaxed"
                                value={terms}
                                onChange={(e) => setTerms(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* PREVIEW PANEL */}
                <div className="flex-1 overflow-y-auto bg-slate-200 p-4 sm:p-8 handover-scroll-container print:overflow-visible print:block print:p-0 print:bg-white">
                    <style>{`
                        @media print {
                            @page {
                                size: A4;
                                margin: 15mm;
                            }
                            body {
                                visibility: hidden;
                                background: white;
                            }
                            .handover-scroll-container {
                                visibility: visible !important;
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100vw;
                            }
                        }
                    `}</style>
                    <div ref={printRef}
                        className="print:shadow-none print:mx-0 print:my-0 bg-white w-full max-w-[800px] mx-auto min-h-[1100px] rounded-sm shadow-2xl flex flex-col relative print:border-none"
                        style={{ fontFamily: "'Times New Roman', Times, serif", color: '#000' }}>
                        
                        {/* HEADER */}
                        <div className="px-10 pt-10 pb-4 flex justify-between items-start border-b-[3px] border-teal-700 mx-10 mb-6">
                            <div className="flex items-start gap-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/logo-full.png" alt="LYHU" className="h-12 object-contain mt-1" />
                                <div>
                                    <p className="font-bold text-[14px] tracking-wide text-teal-800 uppercase">{companyInfo.name}</p>
                                    <div className="text-[11px] text-slate-800 mt-1 space-y-0.5">
                                        <p>Đ/C: {companyInfo.address}</p>
                                        <div className="flex items-center gap-4">
                                            <p>MST: {companyInfo.taxCode}</p>
                                            <p>Hotline: {companyInfo.phone}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p>Website: {companyInfo.website}</p>
                                            <p>Email: {companyInfo.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center font-bold">
                                <p className="text-[14px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                <p className="text-[13px] underline underline-offset-4 mt-0.5">Độc lập - Tự do - Hạnh phúc</p>
                            </div>
                        </div>

                        {/* TITLE */}
                        <div className="text-center mb-6 px-10">
                            <h1 className="text-[22px] font-bold uppercase tracking-wide">BIÊN BẢN BÀN GIAO THIẾT BỊ MEDIA</h1>
                            <p className="text-sm italic mt-2">Hà Nội, ngày {today.split('/')[0]} tháng {today.split('/')[1]} năm {today.split('/')[2]}</p>
                        </div>

                        <div className="px-12 text-[14px] leading-relaxed space-y-4">
                            <p className="italic">Hôm nay, ngày {today}, chúng tôi gồm có:</p>
                            
                            {/* PARTIES */}
                            <div className="space-y-4">
                                {/* Bên Giao */}
                                <div>
                                    <p className="font-bold uppercase tracking-wide text-teal-800">I. BÊN GIAO: ĐẠI DIỆN {companyInfo.name}</p>
                                    <ul className="list-disc pl-6 mt-1 space-y-1">
                                        <li>Người bàn giao: <strong className="uppercase">{giverInfo.name}</strong></li>
                                        <li>Điện thoại liên hệ: {giverInfo.phone}</li>
                                    </ul>
                                </div>
                                {/* Bên Nhận */}
                                <div>
                                    <p className="font-bold uppercase tracking-wide text-teal-800">II. BÊN NHẬN (NGƯỜI CHỊU TRÁCH NHIỆM BẢO QUẢN)</p>
                                    <ul className="list-disc pl-6 mt-1 space-y-1">
                                        <li className="grid grid-cols-[120px_1fr] items-center">
                                            <span>Họ và tên:</span>
                                            <strong className="uppercase border-b border-dotted border-slate-400 leading-tight pb-0.5 block">{receiverInfo.name || '\u00A0'}</strong>
                                        </li>
                                        <li className="grid grid-cols-[120px_1fr] items-center">
                                            <span>CCCD/CMND:</span>
                                            <strong className="border-b border-dotted border-slate-400 leading-tight pb-0.5 block">{receiverInfo.idCard || '\u00A0'}</strong>
                                        </li>
                                        <li className="grid grid-cols-[120px_1fr] items-center">
                                            <span>Điện thoại:</span>
                                            <strong className="border-b border-dotted border-slate-400 leading-tight pb-0.5 block">{receiverInfo.phone || '\u00A0'}</strong>
                                        </li>
                                        <li className="grid grid-cols-[120px_1fr] items-center">
                                            <span>Vị trí công tác:</span>
                                            <strong className="border-b border-dotted border-slate-400 leading-tight pb-0.5 block">{receiverInfo.position || '\u00A0'}</strong>
                                        </li>
                                        <li className="grid grid-cols-[120px_1fr] items-center">
                                            <span>Địa chỉ:</span>
                                            <strong className="border-b border-dotted border-slate-400 leading-tight pb-0.5 block">{receiverInfo.address || '\u00A0'}</strong>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <p className="pt-2 font-bold italic">Bên Giao đồng ý bàn giao và Bên Nhận đồng ý nhận các trang thiết bị với chi tiết như sau:</p>

                            {/* TABLE */}
                            <div className="border border-slate-800 mx-auto w-full">
                                <table className="w-full text-[13px] border-collapse relative z-10 bg-transparent">
                                    <thead>
                                        <tr className="bg-teal-50">
                                            <th className="border border-slate-800 p-2 text-center w-12 font-bold">STT</th>
                                            <th className="border border-slate-800 p-2 text-left font-bold w-[35%]">TÊN THIẾT BỊ / MODEL</th>
                                            <th className="border border-slate-800 p-2 text-center font-bold">SERIAL NO.</th>
                                            <th className="border border-slate-800 p-2 text-center font-bold">TÌNH TRẠNG</th>
                                            <th className="border border-slate-800 p-2 text-center font-bold">HẠN BẢO HÀNH</th>
                                            <th className="border border-slate-800 p-2 text-right font-bold">GIÁ TRỊ (VNĐ)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {items.map((it, idx) => (
                                            <tr key={idx}>
                                                <td className="border border-slate-800 p-2 text-center">{idx + 1}</td>
                                                <td className="border border-slate-800 p-2">
                                                    <div className="font-bold">{it.name}</div>
                                                    {it.model && <div className="text-[11px] text-slate-600 mt-0.5">{it.model}</div>}
                                                </td>
                                                <td className="border border-slate-800 p-2 text-center font-mono text-xs">{it.serial_number || '-'}</td>
                                                <td className="border border-slate-800 p-2 text-center">{it.condition === 'excellent' ? 'Rất tốt' : it.condition === 'good' ? 'Tốt' : it.condition === 'fair' ? 'Trung bình' : 'Cần sửa'}</td>
                                                <td className="border border-slate-800 p-2 text-center">{it.warranty_expiry ? new Date(it.warranty_expiry).toLocaleDateString('vi-VN') : '-'}</td>
                                                <td className="border border-slate-800 p-2 text-right font-bold">{fmtPrice(it.value_amount)}</td>
                                            </tr>
                                        ))}
                                        {/* Total Summary */}
                                        <tr className="bg-teal-50">
                                            <td colSpan={5} className="border border-slate-800 p-2 text-right font-bold uppercase text-teal-800">TỔNG CỘNG GIÁ TRỊ BÀN GIAO:</td>
                                            <td className="border border-slate-800 p-2 text-right font-bold text-[15px] text-teal-900">{fmtPrice(totalValue)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* TERMS & CONDITIONS */}
                            <div className="pt-6 space-y-1">
                                {terms.split('\n').filter(t => t.trim()).map((t, i) => renderTermLine(t, i))}
                            </div>
                            
                            <p className="pt-2 italic text-[13px] text-center font-medium mt-4 border-t border-slate-200 pt-4">
                                Biên bản này được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 (một) bản kể từ ngày ký.
                            </p>
                        </div>

                        {/* SIGNATURES - Kept Together */}
                        <div className="mt-8 px-12 pb-[100px] flex justify-between" style={{ pageBreakInside: 'avoid' }}>
                            <div className="text-center w-64">
                                <p className="font-bold text-[15px] uppercase">ĐẠI DIỆN BÊN GIAO</p>
                                <p className="text-[13px] italic mt-1">(Ký và ghi rõ họ tên)</p>
                                {/* Leave blank vertical space for signature */}
                                <div className="h-32"></div>
                                <div className="border-b border-dotted border-slate-400 w-3/4 mx-auto mb-1"></div>
                                <p className="font-bold uppercase">{giverInfo.name}</p>
                            </div>
                            <div className="text-center w-64">
                                <p className="font-bold text-[15px] uppercase">ĐẠI DIỆN BÊN NHẬN</p>
                                <p className="text-[13px] italic mt-1">(Ký và ghi rõ họ tên)</p>
                                {/* Leave blank vertical space for signature */}
                                <div className="h-32"></div>
                                <div className="border-b border-dotted border-slate-400 w-3/4 mx-auto mb-1"></div>
                                <p className="font-bold uppercase">{receiverInfo.name}</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
