'use client';

import React, { useEffect, useState } from 'react';
import { Printer, ArrowLeft, Loader2, Package } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  image_url: string;
  weight: string;
  packaging_spec: string;
  items_per_carton: number;
}

export default function UHiCatalogGenerator() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('brand', 'UHi')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setProducts(data);
      }
      setIsLoading(false);
    };
    fetchProducts();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f2f2]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f2] py-8 print:py-0 print:bg-white font-sans text-gray-800">
      {/* --- NÚT IN --- */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href="/admin/sales-kits" className="flex items-center gap-2 text-gray-500 hover:text-primary font-medium text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </Link>
        <button 
          onClick={handlePrint}
          className="bg-primary text-white px-5 py-2 rounded flex items-center gap-2 hover:bg-primary/90 font-medium text-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          Xuất file PDF
        </button>
      </div>

      {/* --- TRANG 1: BÌA CATALOG --- */}
      <div className="a4-page bg-white p-16 flex flex-col justify-between border border-[#f2f2f2] print:border-none">
        <div className="flex justify-between items-start">
          <div className="text-primary font-black text-2xl tracking-[0.2em] uppercase">
            LYHU
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs font-bold tracking-[0.2em] uppercase">Catalog 2026</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <p className="text-secondary font-bold text-sm tracking-[0.3em] uppercase mb-4">Nhập Khẩu Độc Quyền</p>
          <h1 className="text-6xl font-black uppercase tracking-tighter text-gray-800 leading-none mb-2">
            Kẹo Chua
          </h1>
          <h1 className="text-[120px] font-black uppercase tracking-tighter text-primary leading-none mb-6">
            UHI
          </h1>
          <div className="w-16 h-1 bg-secondary mb-8"></div>
          <p className="text-gray-500 text-sm font-medium tracking-widest uppercase">
            Sản Xuất Tại Hàn Quốc (Made In Korea)
          </p>
        </div>

        <div className="border-t-2 border-[#f2f2f2] pt-8 flex justify-between items-end">
          <div>
            <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1">Nhà Phân Phối Trực Tiếp</p>
            <p className="font-bold text-gray-800 text-sm uppercase">Công Ty TNHH LYHU Group</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-sm text-primary uppercase tracking-widest">www.lyhu.vn</p>
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 2: TỔNG QUAN --- */}
      <div className="a4-page bg-white p-16 border border-[#f2f2f2] print:border-none flex flex-col">
        <div className="border-b-2 border-primary pb-4 mb-12 flex justify-between items-end">
          <h2 className="text-2xl font-black text-primary tracking-widest uppercase">Tổng Quan</h2>
          <span className="text-[#f2f2f2] font-black text-5xl leading-none">01</span>
        </div>

        <div className="grid grid-cols-2 gap-12 flex-1">
          {/* Cột 1: Về LYHU */}
          <div className="bg-[#f2f2f2] p-8 flex flex-col">
            <h3 className="text-lg font-black text-primary uppercase tracking-widest mb-6">Đơn Vị Nhập Khẩu</h3>
            <p className="text-gray-600 text-sm leading-loose text-justify mb-8">
              LYHU Group là doanh nghiệp chuyên nhập khẩu và phân phối các sản phẩm tiêu dùng nhanh (FMCG) từ thị trường quốc tế về Việt Nam. Chúng tôi sở hữu mạng lưới phân phối rộng khắp toàn quốc, bao phủ hệ thống siêu thị (MT) và đại lý (GT).
            </p>
            
            <h4 className="font-bold text-gray-800 text-xs uppercase tracking-widest mb-4">Năng Lực Phân Phối</h4>
            <ul className="space-y-4 text-sm text-gray-600 mt-auto">
              <li className="flex justify-between border-b border-white pb-2">
                <span>Phủ sóng kênh Siêu thị</span>
                <span className="font-bold text-primary">95%</span>
              </li>
              <li className="flex justify-between border-b border-white pb-2">
                <span>Tốc độ giao hàng kho DC</span>
                <span className="font-bold text-primary">24h - 48h</span>
              </li>
              <li className="flex justify-between border-b border-white pb-2">
                <span>Kho bãi tiêu chuẩn</span>
                <span className="font-bold text-primary">Có</span>
              </li>
            </ul>
          </div>

          {/* Cột 2: Về UHi */}
          <div className="border-2 border-[#f2f2f2] p-8 flex flex-col">
            <h3 className="text-lg font-black text-secondary uppercase tracking-widest mb-6">Thương Hiệu UHi</h3>
            <p className="text-gray-600 text-sm leading-loose text-justify mb-8">
              UHi là thương hiệu kẹo dẻo siêu chua được sản xuất trên dây chuyền công nghệ hiện đại tại Hàn Quốc. Sản phẩm đánh trúng tâm lý thích trải nghiệm cảm giác mạnh của giới trẻ, tạo nên cơn sốt trên toàn Châu Á.
            </p>
            
            <h4 className="font-bold text-gray-800 text-xs uppercase tracking-widest mb-4">Ưu Điểm Cốt Lõi</h4>
            <ul className="space-y-4 text-sm text-gray-600 mt-auto">
              <li className="flex gap-3">
                <span className="text-secondary font-black">•</span>
                <span>Hương vị bùng nổ: Chua mạnh, ngọt thanh.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-secondary font-black">•</span>
                <span>Thành phần an toàn, không phẩm màu độc hại.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-secondary font-black">•</span>
                <span>Bao bì Zip cao cấp, dễ bảo quản.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-secondary font-black">•</span>
                <span>Đạt chuẩn an toàn quốc tế (HACCP, ISO).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 3: SẢN PHẨM --- */}
      <div className="a4-page bg-white p-16 border border-[#f2f2f2] print:border-none flex flex-col">
        <div className="border-b-2 border-primary pb-4 mb-12 flex justify-between items-end">
          <h2 className="text-2xl font-black text-primary tracking-widest uppercase">Sản Phẩm</h2>
          <span className="text-[#f2f2f2] font-black text-5xl leading-none">02</span>
        </div>

        <div className="flex-1 flex flex-col gap-8">
          {products.length === 0 ? (
            <div className="w-full py-20 text-center bg-[#f2f2f2]">
              <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm uppercase tracking-widest">Không có dữ liệu</p>
            </div>
          ) : (
            products.slice(0, 2).map((product, idx) => (
              <div key={product.id} className="flex border-2 border-[#f2f2f2] h-64">
                {/* Hình ảnh */}
                <div className="w-1/3 bg-[#f2f2f2] p-6 flex items-center justify-center">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt={product.name} className="max-h-full object-contain mix-blend-multiply" />
                  ) : (
                    <Package className="w-10 h-10 text-gray-300" />
                  )}
                </div>
                {/* Thông tin */}
                <div className="w-2/3 p-8 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">SKU: {product.sku}</p>
                      <h3 className="text-xl font-black text-gray-800 uppercase tracking-wide">{product.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Giá Bán Lẻ</p>
                      <p className="text-xl font-black text-primary">{formatPrice(product.price)}</p>
                    </div>
                  </div>
                  
                  <table className="w-full text-sm text-left mt-auto">
                    <tbody>
                      <tr className="border-t border-[#f2f2f2]">
                        <th className="py-3 text-gray-500 font-medium uppercase tracking-wider text-[10px] w-1/3">Mã Vạch EAN</th>
                        <td className="py-3 text-gray-800 font-medium text-right">880...</td>
                      </tr>
                      <tr className="border-t border-[#f2f2f2]">
                        <th className="py-3 text-gray-500 font-medium uppercase tracking-wider text-[10px]">Trọng Lượng</th>
                        <td className="py-3 text-gray-800 font-medium text-right">{product.weight || '40g'}</td>
                      </tr>
                      <tr className="border-t border-[#f2f2f2]">
                        <th className="py-3 text-gray-500 font-medium uppercase tracking-wider text-[10px]">Quy Cách</th>
                        <td className="py-3 text-gray-800 font-medium text-right">{product.packaging_spec || '120 gói / thùng'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* NẾU CÓ HƠN 2 SẢN PHẨM -> THÊM TRANG 4 */}
      {products.length > 2 && (
        <>
          <div className="page-break"></div>
          <div className="a4-page bg-white p-16 border border-[#f2f2f2] print:border-none flex flex-col">
            <div className="border-b-2 border-primary pb-4 mb-12 flex justify-between items-end opacity-0">
              <h2 className="text-2xl font-black text-primary tracking-widest uppercase">Sản Phẩm</h2>
            </div>
            <div className="flex-1 flex flex-col gap-8">
              {products.slice(2, 4).map((product, idx) => (
                <div key={product.id} className="flex border-2 border-[#f2f2f2] h-64">
                  <div className="w-1/3 bg-[#f2f2f2] p-6 flex items-center justify-center">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image_url} alt={product.name} className="max-h-full object-contain mix-blend-multiply" />
                    ) : (
                      <Package className="w-10 h-10 text-gray-300" />
                    )}
                  </div>
                  <div className="w-2/3 p-8 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">SKU: {product.sku}</p>
                        <h3 className="text-xl font-black text-gray-800 uppercase tracking-wide">{product.name}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Giá Bán Lẻ</p>
                        <p className="text-xl font-black text-primary">{formatPrice(product.price)}</p>
                      </div>
                    </div>
                    
                    <table className="w-full text-sm text-left mt-auto">
                      <tbody>
                        <tr className="border-t border-[#f2f2f2]">
                          <th className="py-3 text-gray-500 font-medium uppercase tracking-wider text-[10px] w-1/3">Mã Vạch EAN</th>
                          <td className="py-3 text-gray-800 font-medium text-right">880...</td>
                        </tr>
                        <tr className="border-t border-[#f2f2f2]">
                          <th className="py-3 text-gray-500 font-medium uppercase tracking-wider text-[10px]">Trọng Lượng</th>
                          <td className="py-3 text-gray-800 font-medium text-right">{product.weight || '40g'}</td>
                        </tr>
                        <tr className="border-t border-[#f2f2f2]">
                          <th className="py-3 text-gray-500 font-medium uppercase tracking-wider text-[10px]">Quy Cách</th>
                          <td className="py-3 text-gray-800 font-medium text-right">{product.packaging_spec || '120 gói / thùng'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="page-break"></div>

      {/* --- TRANG CUỐI: PHÁP LÝ & CHÍNH SÁCH --- */}
      <div className="a4-page bg-white p-16 border border-[#f2f2f2] print:border-none flex flex-col">
        <div className="border-b-2 border-primary pb-4 mb-12 flex justify-between items-end">
          <h2 className="text-2xl font-black text-primary tracking-widest uppercase">Pháp Lý & Hỗ Trợ</h2>
          <span className="text-[#f2f2f2] font-black text-5xl leading-none">03</span>
        </div>

        <div className="flex-1 flex flex-col gap-10">
          {/* Box Pháp lý */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-6">Hồ Sơ Nhập Khẩu Tiêu Chuẩn</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#f2f2f2] p-6">
                <p className="font-bold text-gray-800 text-xs tracking-widest uppercase mb-2">Hải Quan</p>
                <p className="text-gray-500 text-xs leading-relaxed">Tờ khai hải quan nhập khẩu chính ngạch 100%.</p>
              </div>
              <div className="bg-[#f2f2f2] p-6">
                <p className="font-bold text-gray-800 text-xs tracking-widest uppercase mb-2">Xuất Xứ</p>
                <p className="text-gray-500 text-xs leading-relaxed">Chứng nhận C/O xác nhận xuất xứ Hàn Quốc.</p>
              </div>
              <div className="bg-[#f2f2f2] p-6">
                <p className="font-bold text-gray-800 text-xs tracking-widest uppercase mb-2">Bộ Y Tế</p>
                <p className="text-gray-500 text-xs leading-relaxed">Bản tự công bố chất lượng theo Nghị định 15.</p>
              </div>
              <div className="bg-[#f2f2f2] p-6">
                <p className="font-bold text-gray-800 text-xs tracking-widest uppercase mb-2">Tem Nhãn</p>
                <p className="text-gray-500 text-xs leading-relaxed">Dán tem nhãn phụ Tiếng Việt 100% trước khi giao.</p>
              </div>
            </div>
          </div>

          {/* Box Hỗ trợ */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-6">Chính Sách B2B</h3>
            <div className="border-2 border-secondary p-8 flex flex-col gap-4">
              <div className="flex items-start gap-4 pb-4 border-b border-[#f2f2f2]">
                <span className="text-secondary font-black mt-1">01</span>
                <div>
                  <p className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-1">Chiết Khấu & Công Nợ</p>
                  <p className="text-gray-500 text-xs">Biên lợi nhuận cạnh tranh. Công nợ 15-30 ngày.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-secondary font-black mt-1">02</span>
                <div>
                  <p className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-1">Trade Marketing</p>
                  <p className="text-gray-500 text-xs">Hỗ trợ khuyến mãi, POSM (Hanger treo siêu thị), đổi trả hàng cận date.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Liên hệ */}
          <div className="mt-auto pt-8 border-t-2 border-[#f2f2f2] flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-800 text-xs uppercase tracking-widest mb-2">Phòng Kinh Doanh</p>
              <p className="text-primary font-black text-2xl tracking-widest mb-1">090.XXXX.XXX</p>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">B2B@LYHU.VN</p>
            </div>
            <div className="text-right">
              <div className="w-16 h-16 bg-[#f2f2f2] inline-block mb-2"></div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">QR Code Zalo</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .a4-page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto 40px auto;
          box-shadow: 0 0 0 1px #f2f2f2;
        }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { 
            background: white !important;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          .a4-page {
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: always;
          }
          .page-break { page-break-after: always; }
        }
      `}</style>
    </div>
  );
}
