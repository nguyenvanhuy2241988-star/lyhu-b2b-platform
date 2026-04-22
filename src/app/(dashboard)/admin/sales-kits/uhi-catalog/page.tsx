'use client';

import React, { useEffect, useState } from 'react';
import { Printer, ArrowLeft, Loader2, Package, Check, MapPin, Award, FileText, BarChart3, ShieldCheck } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-sm text-slate-600 font-medium">Đang tải dữ liệu sản phẩm UHi...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:py-0 print:bg-white font-sans text-slate-900">
      {/* Nút bấm không hiển thị khi in */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href="/admin/sales-kits" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </Link>
        <button 
          onClick={handlePrint}
          className="bg-primary text-white px-5 py-2 rounded flex items-center gap-2 hover:bg-primary/90 font-medium text-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          Xuất file PDF (Ctrl + P)
        </button>
      </div>

      <div className="print:hidden max-w-[210mm] mx-auto mb-6 bg-blue-50 text-blue-800 p-4 rounded text-sm border border-blue-100">
        <p><strong>💡 Hướng dẫn in PDF:</strong> Chọn <strong>Destination: Save as PDF</strong>. Bật <strong>Background graphics</strong> và đặt Margins là <strong>None</strong> để bản in chuẩn khổ A4.</p>
      </div>

      {/* --- TRANG 1: BÌA CATALOG --- */}
      <div className="a4-page bg-white p-12 flex flex-col justify-between relative border border-slate-200 print:border-none">
        <div className="flex justify-between items-start">
          <div className="text-primary font-bold text-xl tracking-wide uppercase flex flex-col">
            <span>LYHU</span>
            <div className="w-6 h-1 bg-primary mt-1"></div>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-sm font-medium tracking-widest uppercase">Hồ Sơ Sản Phẩm</p>
            <p className="text-slate-400 text-xs mt-1">Năm 2026</p>
          </div>
        </div>

        <div className="my-auto">
          <p className="text-primary font-semibold text-lg tracking-[0.2em] uppercase mb-6 border-l-4 border-primary pl-4">Nhập Khẩu Độc Quyền</p>
          <h1 className="text-6xl font-bold uppercase tracking-tight text-slate-900 leading-tight mb-4">
            Kẹo Chua <br/><span className="text-primary">UHi Hàn Quốc</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-md">
            Sản phẩm kẹo dẻo siêu chua nhập khẩu chính ngạch 100% từ Hàn Quốc. Dành riêng cho hệ thống chuỗi siêu thị và đại lý phân phối toàn quốc.
          </p>
        </div>

        <div className="border-t border-slate-200 pt-8 flex justify-between items-end">
          <div>
            <p className="font-semibold text-slate-900 text-sm">Đơn vị nhập khẩu & phân phối độc quyền:</p>
            <p className="text-slate-500 text-sm mt-1">CÔNG TY TNHH LYHU GROUP</p>
          </div>
          <div className="text-right font-medium text-sm text-primary">
            www.lyhu.vn
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 2: VỀ LYHU GROUP --- */}
      <div className="a4-page bg-white p-12 relative border border-slate-200 print:border-none">
        <div className="border-b border-slate-200 pb-6 mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Về LYHU Group</h2>
            <p className="text-slate-500 text-sm mt-2 uppercase tracking-wider">Nhà Nhập Khẩu & Phân Phối</p>
          </div>
          <div className="text-slate-300 font-light text-5xl">01</div>
        </div>

        <div className="space-y-12">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <p className="text-slate-700 leading-relaxed text-sm text-justify">
                LYHU Group tự hào là doanh nghiệp uy tín trong lĩnh vực nhập khẩu và phân phối các sản phẩm tiêu dùng nhanh (FMCG) chất lượng cao tại thị trường Việt Nam. 
                <br/><br/>
                Chúng tôi chuyên tìm kiếm và mang về những sản phẩm mang xu hướng toàn cầu, đáp ứng nhu cầu thưởng thức đa dạng của người tiêu dùng trong nước, đặc biệt là phân khúc giới trẻ và gia đình.
              </p>
            </div>
            <div className="bg-slate-50 p-6 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Mạng Lưới Phân Phối
              </h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Kênh Hiện Đại (MT):</strong> Có mặt tại các chuỗi siêu thị tiện lợi, đại siêu thị trên toàn quốc.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Kênh Truyền Thống (GT):</strong> Phủ sóng hệ thống đại lý, cửa hàng tạp hóa tại 63 tỉnh thành.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Năng lực Logistics:</strong> Hệ thống kho bãi tiêu chuẩn, đảm bảo giao hàng trong 24h-48h.</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
             <h3 className="font-bold text-slate-900 mb-6 text-lg border-l-4 border-primary pl-4">Cam Kết Từ Nhà Nhập Khẩu</h3>
             <div className="grid grid-cols-3 gap-6">
               <div className="border border-slate-200 p-5">
                 <ShieldCheck className="w-8 h-8 text-primary mb-4" />
                 <h4 className="font-bold text-slate-900 text-sm mb-2">Pháp Lý Minh Bạch</h4>
                 <p className="text-slate-500 text-xs leading-relaxed">Đầy đủ tờ khai hải quan, chứng nhận xuất xứ (C/O) và công bố chất lượng theo quy định của Bộ Y Tế.</p>
               </div>
               <div className="border border-slate-200 p-5">
                 <Award className="w-8 h-8 text-primary mb-4" />
                 <h4 className="font-bold text-slate-900 text-sm mb-2">Độc Quyền Phân Phối</h4>
                 <p className="text-slate-500 text-xs leading-relaxed">LYHU Group là đối tác độc quyền duy nhất của UHi tại VN, đảm bảo nguồn hàng ổn định, không đứt gãy.</p>
               </div>
               <div className="border border-slate-200 p-5">
                 <BarChart3 className="w-8 h-8 text-primary mb-4" />
                 <h4 className="font-bold text-slate-900 text-sm mb-2">Chính Sách Chống Phá Giá</h4>
                 <p className="text-slate-500 text-xs leading-relaxed">Kiểm soát chặt chẽ giá bán lẻ, bảo vệ biên độ lợi nhuận tối đa cho các hệ thống siêu thị đối tác.</p>
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 3: VỀ THƯƠNG HIỆU UHi HÀN QUỐC --- */}
      <div className="a4-page bg-white p-12 relative border border-slate-200 print:border-none flex flex-col">
        <div className="border-b border-slate-200 pb-6 mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Thương Hiệu UHi</h2>
            <p className="text-slate-500 text-sm mt-2 uppercase tracking-wider">Xuất xứ: Hàn Quốc (Made in Korea)</p>
          </div>
          <div className="text-slate-300 font-light text-5xl">02</div>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-12">
          <div className="text-center max-w-2xl mx-auto">
             <h3 className="text-2xl font-bold text-slate-900 mb-4">Cơn Sốt Kẹo Chua Bùng Nổ Tại Châu Á</h3>
             <p className="text-slate-600 text-sm leading-relaxed">
               UHi là thương hiệu kẹo dẻo và kẹo cứng nổi tiếng được sản xuất trực tiếp tại các nhà máy đạt chuẩn quốc tế ở Hàn Quốc. Bắt kịp xu hướng thưởng thức kẹo cảm giác mạnh của giới trẻ (Gen Z, Gen Alpha), UHi mang đến sự kết hợp hoàn hảo giữa vị chua bùng nổ ngay đầu lưỡi và hậu vị trái cây ngọt thanh tươi mát.
             </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div className="bg-primary text-white p-8">
                <h4 className="font-bold text-lg mb-4">Điểm Nổi Bật Của UHi</h4>
                <ul className="space-y-4 text-sm opacity-90">
                  <li className="flex gap-3"><Check className="w-5 h-5 shrink-0" /> Sản xuất trên dây chuyền công nghệ cao của Hàn Quốc, đảm bảo chất lượng đồng đều.</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 shrink-0" /> Thành phần an toàn, không sử dụng chất tạo màu hóa học độc hại.</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 shrink-0" /> Thiết kế bao bì hiện đại, màu sắc bắt mắt, tối ưu không gian trưng bày trên kệ siêu thị.</li>
                </ul>
             </div>
             <div className="bg-slate-900 text-white p-8">
                <h4 className="font-bold text-lg mb-4">Chứng Nhận Quốc Tế</h4>
                <ul className="space-y-4 text-sm opacity-90">
                  <li className="flex gap-3"><FileText className="w-5 h-5 shrink-0 text-primary" /> ISO 22000: Hệ thống quản lý an toàn thực phẩm.</li>
                  <li className="flex gap-3"><FileText className="w-5 h-5 shrink-0 text-primary" /> HACCP: Hệ thống phân tích mối nguy và kiểm soát điểm tới hạn (Hàn Quốc).</li>
                  <li className="flex gap-3"><FileText className="w-5 h-5 shrink-0 text-primary" /> Tiêu chuẩn FDA (Sẵn sàng xuất khẩu toàn cầu).</li>
                </ul>
             </div>
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 4: THÔNG SỐ SẢN PHẨM --- */}
      <div className="a4-page bg-white p-12 relative border border-slate-200 print:border-none">
        <div className="border-b border-slate-200 pb-6 mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Danh Mục Sản Phẩm</h2>
            <p className="text-slate-500 text-sm mt-2 uppercase tracking-wider">SKU Data & Quy Cách</p>
          </div>
          <div className="text-slate-300 font-light text-5xl">03</div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {products.map((product) => (
            <div key={product.id} className="border border-slate-200 flex flex-col h-full bg-white">
              <div className="h-48 border-b border-slate-100 flex items-center justify-center p-6">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image_url} alt={product.name} className="h-full object-contain" />
                ) : (
                  <Package className="w-12 h-12 text-slate-200" />
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-900 text-lg mb-1">{product.name}</h3>
                <p className="text-xs font-mono text-slate-500 mb-4">SKU: {product.sku}</p>
                
                <div className="space-y-3 mt-auto text-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Giá bán lẻ (MSRP)</span>
                    <span className="font-bold text-primary">{formatPrice(product.price)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Mã vạch (EAN-13)</span>
                    <span className="font-mono text-slate-900">880... (Korea Barcode)</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Quy cách</span>
                    <span className="text-slate-900 text-right max-w-[150px]">{product.packaging_spec || '12 gói/dây - 120 gói/thùng'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Trọng lượng</span>
                    <span className="text-slate-900">{product.weight || '40g'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-slate-500">Hạn sử dụng</span>
                    <span className="text-slate-900">12 Tháng</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {products.length === 0 && (
            <div className="col-span-2 text-center py-20 border border-dashed border-slate-300 bg-slate-50">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-sm">Hệ thống chưa có sản phẩm UHi nào.</p>
            </div>
          )}
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 5: HỒ SƠ PHÁP LÝ TẠI VN --- */}
      <div className="a4-page bg-white p-12 relative border border-slate-200 print:border-none">
        <div className="border-b border-slate-200 pb-6 mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Hồ Sơ Pháp Lý</h2>
            <p className="text-slate-500 text-sm mt-2 uppercase tracking-wider">Tiêu Chuẩn Nhập Khẩu Tại Việt Nam</p>
          </div>
          <div className="text-slate-300 font-light text-5xl">04</div>
        </div>

        <div className="space-y-8">
           <p className="text-sm text-slate-700">Tất cả sản phẩm thương hiệu UHi do LYHU Group nhập khẩu đều tuân thủ nghiêm ngặt các quy định về An toàn vệ sinh thực phẩm và pháp luật hải quan Việt Nam. Hồ sơ bản cứng sẽ được đính kèm khi ký hợp đồng phân phối.</p>

           <div className="grid grid-cols-2 gap-6">
              <div className="border border-slate-200 p-6 flex items-start gap-4">
                 <div className="w-10 h-10 rounded bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-slate-600" />
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">Tờ Khai Hải Quan</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Chứng minh nguồn gốc xuất xứ hàng hóa nhập khẩu chính ngạch 100%.</p>
                 </div>
              </div>
              <div className="border border-slate-200 p-6 flex items-start gap-4">
                 <div className="w-10 h-10 rounded bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-slate-600" />
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">Giấy Chứng Nhận C/O</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Certificate of Origin (Form AK/VK) xác nhận xuất xứ Hàn Quốc.</p>
                 </div>
              </div>
              <div className="border border-slate-200 p-6 flex items-start gap-4">
                 <div className="w-10 h-10 rounded bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-slate-600" />
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">Bản Tự Công Bố Sản Phẩm</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Đã đăng ký công bố chất lượng tại Chi cục ATVSTP địa phương theo nghị định 15/2018/NĐ-CP.</p>
                 </div>
              </div>
              <div className="border border-slate-200 p-6 flex items-start gap-4">
                 <div className="w-10 h-10 rounded bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-slate-600" />
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">Kết Quả Kiểm Nghiệm</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Phiếu kiểm nghiệm (Test Report) định kỳ từ trung tâm kiểm định độc lập được nhà nước cấp phép.</p>
                 </div>
              </div>
           </div>

           <div className="bg-slate-50 border border-slate-200 p-6 mt-8">
              <h3 className="font-bold text-slate-900 text-sm mb-2">Nhãn Phụ Tiếng Việt</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tất cả sản phẩm khi xuất kho lên kệ siêu thị đều đã được dán nhãn phụ Tiếng Việt theo đúng quy định của pháp luật về nhãn hàng hóa nhập khẩu, bao gồm đầy đủ thông tin: Thành phần, NSX, HSD, Thông tin nhà sản xuất tại Hàn Quốc, Thông tin đơn vị nhập khẩu LYHU Group.
              </p>
           </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 6: TRADE MARKETING & LIÊN HỆ --- */}
      <div className="a4-page bg-slate-900 text-white p-12 flex flex-col relative border border-slate-900 print:border-none">
        <div className="border-b border-slate-700 pb-6 mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Hỗ Trợ & Hợp Tác</h2>
            <p className="text-slate-400 text-sm mt-2 uppercase tracking-wider">Cam Kết Dành Cho Đối Tác</p>
          </div>
          <div className="text-slate-700 font-light text-5xl">05</div>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <h3 className="text-lg font-bold mb-6 text-primary uppercase">Trade Marketing</h3>
              <ul className="space-y-6">
                <li className="border-l-2 border-primary pl-4">
                  <h4 className="font-bold text-white text-sm mb-1">Chương Trình Khuyến Mãi (Promotion)</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">Ngân sách hỗ trợ chạy CTKM định kỳ như Mua 2 Tặng 1, chiết khấu sâu vào cuối tuần để đẩy mạnh Sell-out.</p>
                </li>
                <li className="border-l-2 border-primary pl-4">
                  <h4 className="font-bold text-white text-sm mb-1">Vật Phẩm Trưng Bày (POSM)</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">Cung cấp miễn phí Hanger, Wobbler, Shelf-talker, Standee mini phù hợp với không gian quầy kệ siêu thị.</p>
                </li>
                <li className="border-l-2 border-primary pl-4">
                  <h4 className="font-bold text-white text-sm mb-1">Hỗ Trợ Hàng Cận Date</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">Cam kết tỷ lệ đổi trả hàng cận date linh hoạt theo quy định, giảm thiểu tối đa rủi ro tồn kho cho siêu thị.</p>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-6 text-primary uppercase">Chính Sách Bán Hàng</h3>
              <ul className="space-y-6">
                <li className="border-l-2 border-primary pl-4">
                  <h4 className="font-bold text-white text-sm mb-1">Biên Độ Lợi Nhuận (Margin)</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">Mức chiết khấu cạnh tranh cao nhất trong ngành hàng kẹo dẻo nhập khẩu. Có thưởng doanh số quý/năm (Rebate).</p>
                </li>
                <li className="border-l-2 border-primary pl-4">
                  <h4 className="font-bold text-white text-sm mb-1">Chi Phí Lên Kệ (Listing Fee)</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">Ngân sách hỗ trợ phí mở mã hàng, phí ụ khuyến mãi (Gondola end) tùy theo quy mô chuỗi.</p>
                </li>
                <li className="border-l-2 border-primary pl-4">
                  <h4 className="font-bold text-white text-sm mb-1">Thanh Toán & Công Nợ</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">Quy định công nợ linh hoạt 15 ngày, 30 ngày hoặc 45 ngày tùy theo hợp đồng nguyên tắc.</p>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 bg-white text-slate-900 p-8 flex justify-between items-center">
            <div>
              <h3 className="font-black text-xl mb-1 uppercase tracking-tight text-slate-900">Liên Hệ Phòng Kinh Doanh (B2B)</h3>
              <p className="text-sm text-slate-500 mb-6">Sẵn sàng hợp tác và đồng hành cùng sự phát triển của hệ thống bán lẻ.</p>
              
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-3 font-medium">
                  <span className="text-slate-400">Hotline:</span> 
                  <span className="font-bold text-lg text-primary">090.xxxx.xxx</span>
                </p>
                <p className="flex items-center gap-3 font-medium">
                  <span className="text-slate-400">Email:</span> 
                  <span>b2b@lyhu.vn</span>
                </p>
                <p className="flex items-center gap-3 font-medium">
                  <span className="text-slate-400">Trụ sở:</span> 
                  <span>Văn phòng CÔNG TY TNHH LYHU GROUP</span>
                </p>
              </div>
            </div>
            <div className="border border-slate-200 p-2">
              <div className="w-24 h-24 bg-slate-50 border border-slate-200 flex items-center justify-center text-center">
                <p className="text-xs font-bold text-slate-400">QR Code<br/>Zalo OA</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .a4-page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto 20px auto;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
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
