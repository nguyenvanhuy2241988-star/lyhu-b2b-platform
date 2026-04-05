'use client';

import React, { useRef, useState } from 'react';
import type { Quote, QuoteItem } from '@/lib/quotesStore';
import { COMPANY_INFO } from '@/lib/companyConfig';
import { Printer, Download, X, FileText } from 'lucide-react';

const fmtPrice = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

interface QuotePrintViewProps {
    quote: Quote;
    onClose: () => void;
    products?: any[];
}

export default function QuotePrintView({ quote, onClose, products }: QuotePrintViewProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const [paperSize, setPaperSize] = useState<'A4' | 'A5'>('A4');

    const handlePrint = () => window.print();

    const handleExportPDF = () => {
        // Browser print dialog with "Save as PDF" option
        window.print();
    };

    const items = quote.items || [];
    const validDate = quote.valid_until ? fmtDate(quote.valid_until) : null;
    const isPriceList = quote.quote_type === 'price_list';

    return (
        <>
            {/* Print styles */}
            <style>{`
                @media print {
                    body {
                        visibility: hidden;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .quote-print-overlay {
                        visibility: visible !important;
                        position: absolute !important;
                        left: 0;
                        top: 0;
                        width: 100vw;
                        background: white !important;
                    }
                    .quote-controls { display: none !important; }
                    .quote-scroll-container {
                        max-height: none !important;
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                        padding: 0 !important;
                    }
                    .quote-print-page {
                        box-shadow: none !important;
                        margin: 0 !important;
                        border-radius: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    @page { size: ${paperSize}; margin: 12mm 15mm; }
                }
            `}</style>

            <div className="quote-print-overlay fixed inset-0 bg-black/60 z-50 flex flex-col">
                {/* Controls */}
                <div className="quote-controls bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary-600" />
                        <h2 className="text-base font-bold text-slate-800">Xem trước báo giá #{quote.readable_id}</h2>
                        <select
                            value={paperSize}
                            onChange={e => setPaperSize(e.target.value as 'A4' | 'A5')}
                            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-600 bg-slate-50"
                        >
                            <option value="A4">A4</option>
                            <option value="A5">A5</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint}
                            className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors">
                            <Printer className="w-4 h-4" /> In
                        </button>
                        <button onClick={handleExportPDF}
                            className="flex items-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition-colors">
                            <Download className="w-4 h-4" /> Xuất PDF
                        </button>
                        <button onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable preview */}
                <div className="quote-scroll-container flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center">
                    <div ref={printRef}
                        className="quote-print-page bg-white w-full max-w-[800px] rounded-lg shadow-2xl"
                        style={{ fontFamily: "'Segoe UI', 'Roboto', sans-serif", fontSize: '13px', color: '#1e293b' }}>

                        {/* ===== HEADER ===== */}
                        <div className="px-10 pt-8 pb-5">
                            <div className="flex items-start justify-between gap-6">
                                {/* Logo + Company info */}
                                <div className="flex items-start gap-4">
                                    <div className="w-32 shrink-0 flex items-center justify-center relative -top-3">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src="/logo-full.png" alt="LYHU" className="w-full object-contain" />
                                    </div>
                                    <div>
                                        <h1 className="text-base font-extrabold text-slate-900 uppercase">{COMPANY_INFO.name}</h1>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                            MST: <strong>0110940697</strong>
                                        </p>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">
                                            Địa chỉ: {COMPANY_INFO.address}
                                        </p>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">
                                            Hotline: <strong>{quote.sales_phone || COMPANY_INFO.hotline}</strong>
                                            {quote.creator_name && <span> (NV Kinh Doanh: {quote.creator_name})</span>}
                                            &nbsp;|&nbsp; Email: {COMPANY_INFO.email}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <div className="text-center mt-6 mb-2">
                                <h2 className="text-xl font-extrabold text-primary-700 uppercase tracking-wide">
                                    BÁO GIÁ SẢN PHẨM
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    Số: <strong className="text-slate-600">BG-{quote.readable_id}</strong>
                                    &nbsp;&nbsp;|&nbsp;&nbsp;
                                    Ngày: <strong className="text-slate-600">{fmtDate(quote.created_at)}</strong>
                                    {validDate && (
                                        <>
                                            &nbsp;&nbsp;|&nbsp;&nbsp;
                                            Hiệu lực đến: <strong className="text-slate-600">{validDate}</strong>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* ===== DIVIDER ===== */}
                        <div className="mx-10 h-[2px] bg-gradient-to-r from-primary-500 via-primary-400 to-secondary-400" />

                        {/* ===== CUSTOMER INFO ===== */}
                        {(!isPriceList || quote.customer_name !== 'Kính gửi Quý khách hàng') && (
                            <div className="px-10 py-5">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thông tin khách hàng</p>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xs text-slate-400 w-16 shrink-0">Khách hàng:</span>
                                            <span className="text-sm font-bold text-slate-800">{quote.customer_name}</span>
                                        </div>
                                        {quote.customer_phone && (
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xs text-slate-400 w-12 shrink-0">SĐT:</span>
                                                <span className="text-sm font-semibold text-slate-700">{quote.customer_phone}</span>
                                            </div>
                                        )}
                                        {quote.customer_address && (
                                            <div className="flex items-baseline gap-2 col-span-2">
                                                <span className="text-xs text-slate-400 w-16 shrink-0">Địa chỉ:</span>
                                                <span className="text-sm text-slate-700">{quote.customer_address}</span>
                                            </div>
                                        )}
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xs text-slate-400 w-16 shrink-0">NV kinh doanh:</span>
                                                    <span className="text-sm text-slate-700 font-semibold">{quote.creator_name || '-'}</span>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xs text-slate-400 w-16 shrink-0">SĐT hỗ trợ:</span>
                                                    <span className="text-sm text-slate-700">{quote.sales_phone || COMPANY_INFO.hotline}</span>
                                                </div>
                                            </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isPriceList && (
                            <div className="px-10 pb-4 pt-2">
                                <p className="text-[13px] font-bold text-slate-800 uppercase">Kính gửi: Quý khách hàng!</p>
                                <p className="text-[12px] text-slate-700 leading-relaxed italic">
                                    Công ty TNHH LYHU là đơn vị sản xuất, phân phối các mặt hàng tiêu dùng nhanh.<br/>
                                    Cảm ơn quý khách hàng đã quan tâm đến các sản phẩm của Công ty LYHU. Chúng tôi xin trân trọng giới thiệu bảng báo giá các sản phẩm như sau:
                                </p>
                            </div>
                        )}

                        {/* ===== PRODUCTS TABLE ===== */}
                        <div className="px-10 pb-6">
                            <table className="w-full border-collapse" style={{ fontSize: '11px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#00afa9' }}>
                                        <th className="px-1.5 py-2 text-white text-center font-bold border border-white/30" style={{ width: '4%' }}>STT</th>
                                        <th className="px-1.5 py-2 text-white text-center font-bold border border-white/30" style={{ width: '12%' }}>Mã Sản Phẩm</th>
                                        <th className="px-2 py-2 text-white text-left font-bold border border-white/30" style={{ width: '20%' }}>Tên Sản Phẩm</th>
                                        {isPriceList ? (
                                            <>
                                                <th className="px-1.5 py-2 text-white text-center font-bold border border-white/30" style={{ width: '6%' }}>Đơn Vị</th>
                                                <th className="px-1.5 py-2 text-white text-center font-bold border border-white/30" style={{ width: '8%' }}>Tr.Lượng</th>
                                                <th className="px-1.5 py-2 text-white text-center font-bold border border-white/30" style={{ width: '6%' }}>HSD</th>
                                                <th className="px-1.5 py-2 text-white text-center font-bold border border-white/30" style={{ width: '8%' }}>Quy Cách<br/><span className="text-[9px] font-normal italic">(Thùng)</span></th>
                                                <th className="px-1.5 py-2 text-white text-right font-bold border border-white/30" style={{ width: '10%' }}>Giá Lẻ</th>
                                                <th className="px-1.5 py-2 text-white text-right font-bold border border-white/30" style={{ width: '10%' }}>Giá Sỉ</th>
                                                <th className="px-1.5 py-2 text-white text-center font-bold border border-white/30" style={{ width: '10%' }}>Hình Ảnh</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-2 py-2 text-white text-center font-bold border border-white/30" style={{ width: '10%' }}>Đơn vị</th>
                                                <th className="px-2 py-2 text-white text-center font-bold border border-white/30" style={{ width: '10%' }}>SL</th>
                                                <th className="px-2 py-2 text-white text-right font-bold border border-white/30" style={{ width: '18%' }}>Đơn giá</th>
                                                <th className="px-2 py-2 text-white text-right font-bold border border-white/30" style={{ width: '22%' }}>Thành tiền</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        if (!isPriceList) {
                                            return items.map((item, idx) => {
                                                const lineTotal = item.subtotal || (item.unitPrice || 0) * (item.quantity || 0);
                                                const isEven = idx % 2 === 0;
                                                return (
                                                    <tr key={idx} style={{ backgroundColor: isEven ? '#ffffff' : '#f8fafc', pageBreakInside: 'avoid' }}>
                                                        <td className="px-1.5 py-2 text-center border border-slate-300 font-semibold text-slate-600 align-middle">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="px-1.5 py-2 text-center border border-slate-300 text-slate-700 font-medium align-middle">
                                                            {item.sku || '---'}
                                                        </td>
                                                        <td className="px-2 py-2 border border-slate-300 align-middle">
                                                            <p className="font-semibold text-slate-800">{item.name}</p>
                                                            {item.isGift && (
                                                                <span className="inline-block text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded mt-0.5 font-bold">🎁 Quà tặng</span>
                                                            )}
                                                        </td>
                                                        <td className="px-2 py-2 text-center border border-slate-300 text-slate-600 align-middle">{item.isGift ? 'KM' : 'Cái'}</td>
                                                        <td className="px-2 py-2 text-center border border-slate-300 font-bold text-slate-700 align-middle">{item.quantity}</td>
                                                        <td className="px-2 py-2 text-right border border-slate-300 text-slate-700 align-middle">{item.isGift ? '—' : fmtPrice(item.unitPrice || 0)}</td>
                                                        <td className="px-2 py-2 text-right border border-slate-300 font-bold text-slate-800 align-middle">{item.isGift ? 'Miễn phí' : fmtPrice(lineTotal)}</td>
                                                    </tr>
                                                );
                                            });
                                        }

                                        // Price List mode
                                        const groups: { category: string, items: QuoteItem[] }[] = [];
                                        items.forEach(item => {
                                            let finalCategory = item.category;
                                            if (products && item.productId) {
                                                const p = products.find((p: any) => p.id === item.productId);
                                                if (p && p.brand) {
                                                    finalCategory = p.brand;
                                                }
                                            }
                                            const cat = (finalCategory || 'SẢN PHẨM KHÁC').trim().toUpperCase();
                                            let group = groups.find(g => g.category === cat);
                                            if (!group) {
                                                group = { category: cat, items: [] };
                                                groups.push(group);
                                            }
                                            group.items.push(item);
                                        });
                                        
                                        // Sort groups alphabetically, put 'SẢN PHẨM KHÁC' at the end
                                        groups.sort((a, b) => {
                                            if (a.category === 'SẢN PHẨM KHÁC') return 1;
                                            if (b.category === 'SẢN PHẨM KHÁC') return -1;
                                            return a.category.localeCompare(b.category);
                                        });

                                        // Sort items alphabetically inside each group
                                        groups.forEach(group => {
                                            group.items.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
                                        });

                                        let globalIdx = 1;
                                        return groups.map((group, gIdx) => (
                                            <React.Fragment key={gIdx}>
                                                {groups.length > 1 || group.category !== 'SẢN PHẨM KHÁC' ? (
                                                    <tr style={{ backgroundColor: '#48adb9', pageBreakInside: 'avoid' }}>
                                                        <td colSpan={10} className="px-2 py-2 text-white text-center font-extrabold uppercase tracking-wide border border-white/30 text-[12px]">
                                                            {group.category}
                                                        </td>
                                                    </tr>
                                                ) : null}
                                                {group.items.map((item, iIdx) => {
                                                    const isEven = iIdx % 2 === 0;
                                                    const currentIdx = globalIdx++;
                                                    return (
                                                        <tr key={`${gIdx}-${iIdx}`} style={{ backgroundColor: isEven ? '#ffffff' : '#f8fafc', pageBreakInside: 'avoid' }}>
                                                            <td className="px-1.5 py-2 text-center border border-slate-300 font-semibold text-slate-600 align-middle">
                                                                {currentIdx}
                                                            </td>
                                                            <td className="px-1.5 py-2 text-center border border-slate-300 text-slate-700 font-medium align-middle">
                                                                {item.sku || '---'}
                                                            </td>
                                                            <td className="px-2 py-2 border border-slate-300 align-middle">
                                                                <p className="font-semibold text-slate-800">{item.name}</p>
                                                                {item.isGift && (
                                                                    <span className="inline-block text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded mt-0.5 font-bold">🎁 Quà tặng</span>
                                                                )}
                                                            </td>
                                                            <td className="px-1.5 py-2 text-center border border-slate-300 text-slate-700 align-middle">{item.unit || '-'}</td>
                                                            <td className="px-1.5 py-2 text-center border border-slate-300 text-slate-700 align-middle">{item.weight || '-'}</td>
                                                            <td className="px-1.5 py-2 text-center border border-slate-300 text-slate-700 align-middle">{item.expiry || '-'}</td>
                                                            <td className="px-1.5 py-2 text-center border border-slate-300 text-slate-700 align-middle">{item.packSize || '-'}</td>
                                                            <td className="px-1.5 py-2 text-right border border-slate-300 font-bold text-slate-700 align-middle">{fmtPrice(item.retailPrice || 0)}</td>
                                                            <td className="px-1.5 py-2 text-right border border-slate-300 font-bold text-primary-700 align-middle">{fmtPrice(item.wholesalePrice || 0)}</td>
                                                            <td className="px-1.5 py-1 text-center border border-slate-300 align-middle">
                                                                {item.imageUrl ? (
                                                                    <div className="w-12 h-12 mx-auto overflow-hidden rounded bg-white">
                                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                                                                    </div>
                                                                ) : '-'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>

                        {/* ===== TOTALS ===== */}
                        {!isPriceList && (
                            <div className="px-10 pb-6">
                                <div className="flex justify-end">
                                    <div className="w-[320px]">
                                        <table className="w-full border-collapse" style={{ fontSize: '12px' }}>
                                            <tbody>
                                                <tr>
                                                    <td className="px-3 py-2 border border-slate-200 text-slate-600 font-medium">Tạm tính</td>
                                                    <td className="px-3 py-2 border border-slate-200 text-right font-semibold text-slate-800 w-36">
                                                        {fmtPrice(quote.subtotal)} đ
                                                    </td>
                                                </tr>
                                                {quote.discount_amount > 0 && (
                                                    <tr>
                                                        <td className="px-3 py-2 border border-slate-200 text-slate-600 font-medium">Chiết khấu</td>
                                                        <td className="px-3 py-2 border border-slate-200 text-right font-semibold text-red-600 w-36">
                                                            - {fmtPrice(quote.discount_amount)} đ
                                                        </td>
                                                    </tr>
                                                )}
                                                {quote.vat_percent > 0 && (
                                                    <tr>
                                                        <td className="px-3 py-2 border border-slate-200 text-slate-600 font-medium">
                                                            VAT ({quote.vat_percent}%)
                                                        </td>
                                                        <td className="px-3 py-2 border border-slate-200 text-right font-semibold text-slate-800 w-36">
                                                            {fmtPrice(Math.round(quote.subtotal * quote.vat_percent / 100))} đ
                                                        </td>
                                                    </tr>
                                                )}
                                                {quote.shipping_fee > 0 && (
                                                    <tr>
                                                        <td className="px-3 py-2 border border-slate-200 text-slate-600 font-medium">Phí vận chuyển</td>
                                                        <td className="px-3 py-2 border border-slate-200 text-right font-semibold text-slate-800 w-36">
                                                            {fmtPrice(quote.shipping_fee)} đ
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr style={{ backgroundColor: '#00afa9' }}>
                                                    <td className="px-3 py-3 border border-primary-400 text-white font-extrabold text-sm uppercase">
                                                        Tổng cộng
                                                    </td>
                                                    <td className="px-3 py-3 border border-primary-400 text-right font-extrabold text-white text-sm w-36">
                                                        {fmtPrice(quote.total)} đ
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ===== NOTES & TERMS ===== */}
                        <div className="px-10 pb-6 space-y-4">
                            {quote.notes && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Ghi chú</p>
                                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{quote.notes}</p>
                                </div>
                            )}

                            {/* Default terms */}
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Điều khoản & Điều kiện</p>
                                <ul className="text-[11px] text-slate-600 space-y-1 leading-relaxed list-disc list-inside">
                                    {quote.terms ? (
                                        quote.terms.split('\n').filter(t => t.trim()).map((t, idx) => (
                                            <li key={idx} className="whitespace-pre-line">{t}</li>
                                        ))
                                    ) : (
                                        <>
                                            <li>Giá trên chưa bao gồm phí vận chuyển (nếu có).</li>
                                            <li>Báo giá có hiệu lực {validDate ? `đến ${validDate}` : '30 ngày'} kể từ ngày phát hành.</li>
                                            <li>Thanh toán: Chuyển khoản trước khi giao hàng hoặc COD.</li>
                                            <li>Hàng hóa được đổi trả trong vòng 7 ngày nếu có lỗi từ nhà sản xuất.</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* ===== BANK INFO ===== */}
                        <div className="px-10 pb-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-[10px] font-bold text-blue-600 uppercase mb-1.5">Thông tin thanh toán</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {COMPANY_INFO.bankAccounts.map((bank, idx) => (
                                        <div key={idx} className="text-[11px] text-slate-700 space-y-0.5">
                                            <p className="font-bold text-slate-800">{bank.bankName}</p>
                                            <p>STK: <strong className="tracking-wide">{bank.accountNumber}</strong></p>
                                            <p>Chủ TK: {bank.accountName}</p>
                                            <p className="text-slate-500">{bank.branch}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ===== SIGNATURE ===== */}
                        <div className="px-10 pb-6">
                            <div className="flex justify-end pt-4 pr-16">
                                <div className="text-center w-64">
                                    <p className="text-xs font-bold text-slate-700 uppercase">Đại diện {COMPANY_INFO.name}</p>
                                    <p className="text-[10px] text-slate-400 italic mt-1">(Ký, đóng dấu và ghi rõ họ tên)</p>
                                    <div className="relative h-24 flex items-center justify-center">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src="/stamp.png" className="absolute opacity-80 h-32 w-32 -top-4 pointer-events-none" alt="seal" onError={e => e.currentTarget.style.display='none'} />
                                    </div>
                                    <p className="font-bold text-[13px] text-slate-800 uppercase">GIÁM ĐỐC</p>
                                </div>
                            </div>
                        </div>

                        {/* ===== FOOTER ===== */}
                        <div className="px-10 py-4" style={{ backgroundColor: '#00afa9' }}>
                            <div className="flex items-center justify-between text-white">
                                <div>
                                    <p className="text-xs font-bold">CÔNG TY TNHH LYHU</p>
                                    <p className="text-[10px] opacity-80">Green Solutions for Life</p>
                                </div>
                                <div className="text-right text-[10px] opacity-80">
                                    <p>Hotline: {COMPANY_INFO.hotline}</p>
                                    <p>{COMPANY_INFO.email} | {COMPANY_INFO.website}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
