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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-lg text-gray-600">Đang tải dữ liệu sản phẩm UHi...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:py-0 print:bg-white font-sans text-gray-900">
      {/* Nút bấm không hiển thị khi in */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href="/admin/sales-kits" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </Link>
        <button 
          onClick={handlePrint}
          className="bg-primary text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary/90 font-medium shadow-md transition-all"
        >
          <Printer className="w-5 h-5" />
          Xuất file PDF (Ctrl + P)
        </button>
      </div>

      <div className="print:hidden max-w-[210mm] mx-auto mb-6 bg-secondary/10 text-secondary-900 p-4 rounded-xl border border-secondary-200">
        <p><strong>💡 Mẹo in ấn:</strong> Chọn <strong>Destination: Save as PDF</strong>. Nhớ bật <strong>Background graphics</strong> (Đồ họa nền) và đặt Margins là <strong>None</strong> để bản in tràn viền đẹp nhất.</p>
      </div>

      {/* --- TRANG 1: BÌA CATALOG --- */}
      <div className="a4-page bg-gradient-to-br from-primary via-primary-400 to-secondary text-white flex flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-[300px] h-[300px] bg-secondary rounded-full mix-blend-multiply filter blur-2xl opacity-60"></div>
        
        <div className="relative z-10 flex justify-between items-start">
          <div className="bg-white text-primary px-8 py-3 font-black text-3xl tracking-widest rounded-br-3xl uppercase shadow-xl flex items-center gap-2">
            LYHU
          </div>
          <div className="text-right">
            <p className="font-bold text-xl uppercase tracking-wider">Hồ Sơ Năng Lực</p>
            <p className="text-sm font-medium opacity-90 border-b-2 border-white/50 pb-1 inline-block">Năm 2026</p>
          </div>
        </div>

        <div className="relative z-10 text-center my-auto">
          <p className="text-2xl font-bold mb-4 tracking-[0.3em] uppercase text-secondary-100">Bộ Sưu Tập</p>
          <h1 className="text-8xl font-black uppercase tracking-tighter drop-shadow-2xl mb-4 leading-none text-white">
            KẸO CHUA <br/><span className="text-secondary text-9xl">UHi</span>
          </h1>
          <div className="w-32 h-2 bg-secondary mx-auto my-8 rounded-full"></div>
          <p className="text-2xl font-bold bg-white text-primary inline-block px-10 py-4 rounded-full shadow-2xl">
            BÙNG NỔ VỊ GIÁC - ĐÁNH THỨC MỌI GIÁC QUAN
          </p>
        </div>

        <div className="relative z-10 border-t-2 border-white/30 pt-6 flex justify-between items-end">
          <div>
            <h3 className="font-black text-2xl uppercase tracking-wider">Kênh Siêu Thị (MT)</h3>
            <p className="font-medium text-lg opacity-90">Tài liệu dành cho đối tác phân phối</p>
          </div>
          <div className="text-right font-bold text-xl bg-primary-800/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/20">
            www.lyhu.vn
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 2: HỒ SƠ NĂNG LỰC --- */}
      <div className="a4-page bg-white p-12 relative">
        <div className="border-b-4 border-primary pb-4 mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black uppercase text-gray-900 tracking-tight">Về LYHU Group</h2>
            <p className="text-xl text-primary font-bold mt-1">Đối tác chiến lược ngành hàng FMCG</p>
          </div>
          <div className="text-gray-300">
            <span className="text-5xl font-black">01</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12">
          <div className="space-y-10">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 border-l-4 border-primary pl-4">Câu Chuyện Thương Hiệu</h3>
              <p className="text-gray-700 leading-relaxed text-lg text-justify">
                LYHU Group định vị là đơn vị tiên phong trong việc phát triển các dòng sản phẩm bánh kẹo "bắt trend" dành riêng cho giới trẻ. Với hệ thống xưởng sản xuất chuẩn hóa và đội ngũ R&D nhạy bén, chúng tôi liên tục cho ra mắt những sản phẩm tạo cơn sốt trên thị trường, đặc biệt là dòng Kẹo Chua UHi.
              </p>
            </div>

            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
              <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-3">
                Năng Lực Sản Xuất
              </h3>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span><strong>Diện tích xưởng:</strong> 60m² (Mô hình tối ưu hóa tinh gọn)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span><strong>Công suất:</strong> Lên đến 15 tấn/tháng</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span><strong>Quy trình:</strong> Khép kín, tự động hóa khâu đóng gói</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 border-l-4 border-secondary pl-4">Chứng Nhận Chất Lượng</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-5 bg-white p-5 rounded-2xl shadow-lg border border-gray-100 hover:border-primary transition-colors">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-2xl shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-1">Giấy chứng nhận VSATTP</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Cơ sở đủ điều kiện An toàn thực phẩm được cấp phép bởi Chi cục QLCL Nông lâm sản và Thủy sản.</p>
                </div>
              </div>
              <div className="flex items-start gap-5 bg-white p-5 rounded-2xl shadow-lg border border-gray-100 hover:border-secondary transition-colors">
                <div className="w-14 h-14 bg-secondary/20 rounded-xl flex items-center justify-center text-secondary-700 font-black text-2xl shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-1">Kiểm Nghiệm (Test Report)</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Đạt chuẩn 100% các chỉ tiêu vi sinh, kim loại nặng và hóa chất độc hại theo quy định của Bộ Y Tế.</p>
                </div>
              </div>
              <div className="flex items-start gap-5 bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-700 font-black text-2xl shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-1">Bản Tự Công Bố</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Hồ sơ công bố hợp quy minh bạch, đã đăng ký mã số mã vạch chuẩn quốc tế GS1, sẵn sàng lưu hành toàn quốc.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 3: THÔNG SỐ SẢN PHẨM --- */}
      <div className="a4-page bg-gray-50 p-12 relative overflow-hidden">
        {/* Background graphic */}
        <div className="absolute top-0 right-0 w-[600px] h-full bg-gradient-to-l from-primary/5 to-transparent z-0 pointer-events-none"></div>

        <div className="relative z-10 border-b-4 border-primary pb-4 mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black uppercase text-gray-900 tracking-tight">Danh Mục Sản Phẩm</h2>
            <p className="text-xl text-primary font-bold mt-1">Các dòng kẹo chua UHi hiện có</p>
          </div>
          <div className="text-gray-300">
            <span className="text-5xl font-black">02</span>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8">
          {products.map((product, index) => (
            <div key={product.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col h-full">
              <div className="h-48 bg-gray-100 relative flex items-center justify-center p-4">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image_url} alt={product.name} className="h-full object-contain mix-blend-multiply drop-shadow-lg" />
                ) : (
                  <Package className="w-20 h-20 text-gray-300" />
                )}
                <div className="absolute top-4 right-4 bg-primary text-white font-bold px-3 py-1 rounded-full text-sm">
                  Mới
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col border-t-4 border-secondary">
                <h3 className="font-bold text-xl text-gray-900 mb-1">{product.name}</h3>
                <p className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block w-max mb-4">SKU: {product.sku}</p>
                
                <div className="space-y-2 mt-auto">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-gray-500 text-sm">Giá niêm yết (MSRP)</span>
                    <span className="font-bold text-primary text-lg">{formatPrice(product.price)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-gray-500 text-sm">Quy cách đóng gói</span>
                    <span className="font-medium text-gray-900 text-sm text-right max-w-[150px]">{product.packaging_spec || '12 gói / lốc'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-gray-500 text-sm">Khối lượng tịnh</span>
                    <span className="font-medium text-gray-900 text-sm">{product.weight || '40g'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-gray-500 text-sm">Hạn sử dụng</span>
                    <span className="font-medium text-gray-900 text-sm">12 Tháng</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {products.length === 0 && (
            <div className="col-span-2 text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Chưa có sản phẩm nào thuộc thương hiệu UHi đang hoạt động.</p>
            </div>
          )}
        </div>

        <div className="relative z-10 mt-8 bg-gray-900 text-white p-6 rounded-2xl flex items-center justify-between shadow-2xl">
           <div>
             <h4 className="font-bold text-secondary text-lg mb-1">Giải pháp trưng bày (Shelf-Ready)</h4>
             <p className="text-sm text-gray-300">Sản phẩm đi kèm dây treo (hanger) chuyên dụng dành cho khu vực thu ngân.</p>
           </div>
           <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Mã vạch chuẩn quốc tế</p>
              <div className="font-mono bg-white text-black px-3 py-1 rounded text-sm font-bold tracking-[0.2em]">EAN-13 / ITF-14</div>
           </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 4: TRADE MARKETING & LIÊN HỆ --- */}
      <div className="a4-page bg-primary text-white p-12 flex flex-col relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-400 rounded-full mix-blend-overlay filter blur-3xl opacity-50"></div>

        <div className="relative z-10 border-b-4 border-secondary pb-4 mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black uppercase text-white tracking-tight">Hỗ Trợ Thương Mại</h2>
            <p className="text-xl text-primary-100 font-medium mt-1">Cam kết đồng hành cùng chuỗi siêu thị</p>
          </div>
          <div className="text-primary-300">
            <span className="text-5xl font-black">03</span>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-12 mb-auto">
          <div>
            <div className="bg-white/10 p-8 rounded-3xl border border-white/20 backdrop-blur-sm h-full">
              <h3 className="text-2xl font-bold mb-8 text-secondary border-b-2 border-secondary/30 pb-4 inline-block">Đề Xuất Hợp Tác</h3>
              <ul className="space-y-6 text-lg">
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary text-primary flex items-center justify-center shrink-0 mt-1 font-bold">✓</div>
                  <div>
                    <strong className="block text-white mb-1">Chiết khấu (Margin) cực tốt</strong>
                    <span className="text-primary-100 text-sm">Biên độ lợi nhuận hấp dẫn nhất trong ngành hàng kẹo dẻo.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary text-primary flex items-center justify-center shrink-0 mt-1 font-bold">✓</div>
                  <div>
                    <strong className="block text-white mb-1">Hỗ trợ Listing Fee</strong>
                    <span className="text-primary-100 text-sm">Thỏa thuận phí lên kệ linh hoạt và hỗ trợ chi phí mở mã.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary text-primary flex items-center justify-center shrink-0 mt-1 font-bold">✓</div>
                  <div>
                    <strong className="block text-white mb-1">Công nợ linh hoạt</strong>
                    <span className="text-primary-100 text-sm">Thanh toán công nợ 15 - 30 ngày, tối ưu dòng tiền cho chuỗi.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold mb-6 text-white">Ngân Sách Marketing</h3>
            <div className="bg-primary-800 p-6 rounded-2xl border border-primary-600 shadow-xl">
              <h4 className="font-bold text-lg text-secondary mb-2 flex items-center gap-2">
                <span className="text-2xl">🔥</span> Khuyến mãi kích cầu
              </h4>
              <p className="text-primary-100 text-sm leading-relaxed">Ngân sách chạy chương trình định kỳ (Mua 2 Tặng 1, Mua hóa đơn giảm giá) nhằm thu hút Traffic tối đa cho siêu thị.</p>
            </div>
            <div className="bg-primary-800 p-6 rounded-2xl border border-primary-600 shadow-xl">
              <h4 className="font-bold text-lg text-white mb-2 flex items-center gap-2">
                <span className="text-2xl">📱</span> Truyền thông Digital
              </h4>
              <p className="text-primary-100 text-sm leading-relaxed">Phủ sóng review TikTok Reels. Cam kết chạy Ads quét vị trí (Geo-targeting) bán kính 3km quanh điểm bán.</p>
            </div>
            <div className="bg-primary-800 p-6 rounded-2xl border border-primary-600 shadow-xl">
              <h4 className="font-bold text-lg text-white mb-2 flex items-center gap-2">
                <span className="text-2xl">♻️</span> Xử lý tồn kho linh hoạt
              </h4>
              <p className="text-primary-100 text-sm leading-relaxed">Hỗ trợ đổi trả hàng cận date, siêu thị KHÔNG chịu rủi ro hàng tồn đọng.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 bg-white text-gray-900 p-10 rounded-3xl shadow-2xl flex justify-between items-center border-b-8 border-secondary">
          <div>
            <h3 className="font-black text-3xl mb-3 uppercase tracking-tight text-primary">Liên Hệ Đặt Hàng</h3>
            <p className="font-bold text-xl text-gray-600 mb-6 border-b-2 border-gray-100 pb-4 inline-block">Bộ phận Khách Hàng B2B</p>
            <div className="space-y-3 text-lg">
              <p className="flex items-center gap-3"><span className="text-2xl">📞</span> Hotline: <span className="font-black text-2xl text-primary">090.xxxx.xxx</span></p>
              <p className="flex items-center gap-3"><span className="text-2xl">✉️</span> Email: <strong className="text-gray-700">b2b@lyhu.vn</strong></p>
            </div>
          </div>
          <div className="text-center">
            <div className="w-40 h-40 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center p-4 mb-3">
              <p className="font-bold text-gray-400">QR Code<br/>Zalo OA</p>
            </div>
            <p className="font-bold text-sm text-primary uppercase tracking-widest">Quét Để Chat</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .a4-page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto 20px auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
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
