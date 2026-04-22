'use client';

import React, { useEffect, useState } from 'react';
import { Printer, ArrowLeft, Loader2, Package, Check, MapPin, Award, FileText, BarChart3, ShieldCheck, Globe, Zap, Leaf, Target, Truck, BadgePercent, ThumbsUp, Calendar, Info } from 'lucide-react';
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
      {/* --- NÚT IN --- */}
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

      {/* --- TRANG 1: BÌA CATALOG --- */}
      <div className="a4-page bg-white p-12 flex flex-col justify-between relative border border-slate-200 print:border-none overflow-hidden">
        {/* Lưới nền tinh tế phong cách Minimalist */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-50 pointer-events-none"></div>

        <div className="relative z-10 flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-primary font-black text-2xl tracking-widest uppercase">LYHU</span>
            <span className="text-slate-400 text-[10px] font-bold tracking-[0.3em] uppercase mt-1">Exclusive Importer</span>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest mb-2">B2B Confidential</div>
            <p className="text-slate-500 text-sm font-medium tracking-widest uppercase">Hồ Sơ Sản Phẩm 2026</p>
          </div>
        </div>

        <div className="relative z-10 my-auto border-l-8 border-primary pl-8 py-4">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-blue-50 text-blue-700 px-3 py-1 text-xs font-bold uppercase tracking-widest border border-blue-200 flex items-center gap-1"><Globe className="w-3 h-3"/> Made in Korea</span>
            <span className="bg-green-50 text-green-700 px-3 py-1 text-xs font-bold uppercase tracking-widest border border-green-200 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> 100% Chính Ngạch</span>
          </div>
          <h1 className="text-7xl font-black uppercase tracking-tighter text-slate-900 leading-[0.9] mb-6">
            Kẹo Dẻo Siêu Chua <br/><span className="text-primary text-8xl">UHi</span>
          </h1>
          <p className="text-slate-600 text-xl font-medium max-w-lg leading-relaxed">
            Tuyệt tác hương vị từ Hàn Quốc. Trải nghiệm bùng nổ giác quan dành riêng cho thị trường Việt Nam.
          </p>
        </div>

        <div className="relative z-10 border-t-2 border-slate-900 pt-6 flex justify-between items-end">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs tracking-widest uppercase mb-1">Nhà Phân Phối Độc Quyền</p>
              <p className="text-slate-600 text-sm font-medium">CÔNG TY TNHH LYHU GROUP</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-slate-900">www.lyhu.vn</p>
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 2: VỀ LYHU GROUP (Corporate Profile) --- */}
      <div className="a4-page bg-white p-12 relative border border-slate-200 print:border-none flex flex-col">
        <div className="border-b-2 border-slate-900 pb-4 mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">LYHU Group</h2>
            <p className="text-primary text-sm font-bold mt-1 uppercase tracking-widest">Đối Tác Nhập Khẩu Chiến Lược</p>
          </div>
          <div className="text-slate-200 font-black text-6xl leading-none">01</div>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-10">
          {/* Cột trái */}
          <div className="col-span-5 flex flex-col justify-between">
            <div>
              <p className="text-slate-700 leading-relaxed text-sm text-justify mb-6">
                Với hơn 5 năm kinh nghiệm trong ngành FMCG, LYHU Group khẳng định vị thế là một trong những nhà nhập khẩu và phân phối uy tín hàng đầu tại Việt Nam. Chúng tôi cam kết mang đến những sản phẩm chất lượng quốc tế, minh bạch pháp lý và đem lại biên độ lợi nhuận tối ưu cho các đối tác bán lẻ.
              </p>
              
              <div className="bg-slate-50 border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 text-xs tracking-widest uppercase mb-6 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" /> Năng Lực Cốt Lõi
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Phủ Sóng Siêu Thị (MT)</span>
                      <span className="text-primary">95%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[95%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Tốc Độ Giao Hàng (SLA)</span>
                      <span className="text-primary">24h - 48h</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-800 w-[100%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Tỷ Lệ Đứt Hàng (Out-of-stock)</span>
                      <span className="text-primary">&lt; 2%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary w-[98%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải */}
          <div className="col-span-7 space-y-6">
            <h3 className="font-bold text-slate-900 text-lg border-l-4 border-primary pl-4 mb-6">Mô Hình Vận Hành</h3>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="border border-slate-200 p-5 flex flex-col bg-white">
                 <Globe className="w-8 h-8 text-primary mb-4" />
                 <h4 className="font-bold text-slate-900 text-sm mb-2 uppercase">Sourcing Quốc Tế</h4>
                 <p className="text-slate-500 text-xs leading-relaxed">Đội ngũ chuyên gia liên tục tìm kiếm các xu hướng ẩm thực mới nhất từ Hàn Quốc, Nhật Bản, Đài Loan.</p>
               </div>
               <div className="border border-slate-200 p-5 flex flex-col bg-white">
                 <ShieldCheck className="w-8 h-8 text-primary mb-4" />
                 <h4 className="font-bold text-slate-900 text-sm mb-2 uppercase">Kiểm Định Gắt Gao</h4>
                 <p className="text-slate-500 text-xs leading-relaxed">100% lô hàng qua hệ thống kiểm tra Hải quan và lấy mẫu xét nghiệm VSATTP tại Việt Nam trước khi nhập kho.</p>
               </div>
               <div className="border border-slate-200 p-5 flex flex-col bg-white">
                 <Truck className="w-8 h-8 text-primary mb-4" />
                 <h4 className="font-bold text-slate-900 text-sm mb-2 uppercase">Kho Bãi Tiêu Chuẩn</h4>
                 <p className="text-slate-500 text-xs leading-relaxed">Hệ thống kho lưu trữ kiểm soát nhiệt độ ẩm, đảm bảo chất lượng kẹo luôn ở trạng thái hoàn hảo nhất.</p>
               </div>
               <div className="border border-slate-200 p-5 flex flex-col bg-white">
                 <Target className="w-8 h-8 text-primary mb-4" />
                 <h4 className="font-bold text-slate-900 text-sm mb-2 uppercase">Phân Phối Đa Kênh</h4>
                 <p className="text-slate-500 text-xs leading-relaxed">Mạng lưới đối tác rộng khắp từ hệ thống CVS (Circle K, GS25) đến Đại siêu thị (Go!, Co.opmart).</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 3: VỀ THƯƠNG HIỆU UHi (Product Insight) --- */}
      <div className="a4-page bg-slate-900 text-white p-12 relative print:border-none flex flex-col overflow-hidden">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary opacity-10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="border-b border-slate-700 pb-4 mb-10 flex justify-between items-end relative z-10">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight uppercase">Thương Hiệu UHi</h2>
            <p className="text-primary text-sm font-bold mt-1 uppercase tracking-widest">Hàn Quốc (Made in Korea)</p>
          </div>
          <div className="text-slate-700 font-black text-6xl leading-none">02</div>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-12 relative z-10">
          <div className="col-span-5">
             <div className="bg-slate-800 p-8 border border-slate-700 h-full flex flex-col justify-center">
                <h3 className="text-2xl font-bold mb-6 text-white leading-snug">
                  Giải mã sức hút của <span className="text-primary border-b-2 border-primary">Kẹo Chua UHi</span>
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-8 text-justify">
                  UHi không chỉ là kẹo, mà là một "trải nghiệm thách thức". Sản xuất tại các nhà máy đạt chuẩn quốc tế tại Hàn Quốc, UHi đáp ứng hoàn hảo nhu cầu tìm kiếm cảm giác mạnh, kích thích sự tò mò và thích thú của thế hệ Gen Z.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <span className="text-sm font-medium text-slate-400">Khách hàng mục tiêu</span>
                    <span className="font-bold text-white">12 - 25 Tuổi</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <span className="text-sm font-medium text-slate-400">Xu hướng tìm kiếm (YoY)</span>
                    <span className="font-bold text-green-400 flex items-center gap-1">+340% <BarChart3 className="w-3 h-3"/></span>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-sm font-medium text-slate-400">Tỷ lệ mua lại (Retention)</span>
                    <span className="font-bold text-primary">68%</span>
                  </div>
                </div>
             </div>
          </div>

          <div className="col-span-7 flex flex-col justify-center gap-6">
             <div className="flex items-start gap-5 bg-white/5 p-6 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="bg-primary/20 p-3 shrink-0">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base mb-2 uppercase tracking-wide">3 Lớp Hương Vị Đột Phá</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Khởi đầu bằng vị siêu chua bùng nổ của axit citric tự nhiên, tiếp nối là độ dẻo dai vui miệng và kết thúc bằng vị ngọt thanh mát của trái cây thật (Cola, Đào, Chanh, Soda).
                  </p>
                </div>
             </div>

             <div className="flex items-start gap-5 bg-white/5 p-6 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="bg-primary/20 p-3 shrink-0">
                  <Leaf className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base mb-2 uppercase tracking-wide">Thành Phần An Toàn Cấp Độ FDA</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Sử dụng màu tự nhiên chiết xuất từ rau củ quả. Không chứa phẩm màu công nghiệp, không chất bảo quản độc hại. An toàn tuyệt đối cho trẻ em và thanh thiếu niên.
                  </p>
                </div>
             </div>

             <div className="flex items-start gap-5 bg-white/5 p-6 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="bg-primary/20 p-3 shrink-0">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base mb-2 uppercase tracking-wide">Bao Bì Hiện Đại (Shelf-Ready)</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Thiết kế túi Zip cao cấp giữ hương vị, màu sắc Neon bắt mắt nổi bật trên kệ hàng. Có sẵn định dạng dây treo (Hanger) tối ưu hóa khu vực quầy thu ngân (Checkout).
                  </p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 4: THÔNG SỐ SẢN PHẨM (Dynamic Data) --- */}
      <div className="a4-page bg-slate-50 p-12 relative border border-slate-200 print:border-none flex flex-col">
        <div className="border-b-2 border-slate-900 pb-4 mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Danh Mục Sản Phẩm</h2>
            <p className="text-primary text-sm font-bold mt-1 uppercase tracking-widest">Bảng Thông Số Kỹ Thuật (SKU)</p>
          </div>
          <div className="text-slate-200 font-black text-6xl leading-none">03</div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-2 gap-6 mb-8">
            {products.map((product) => (
              <div key={product.id} className="bg-white border border-slate-200 flex flex-col">
                <div className="h-40 border-b border-slate-100 flex items-center justify-center p-4 relative group">
                  {/* Label mới */}
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
                    Hot Item
                  </div>
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt={product.name} className="h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <Package className="w-10 h-10 text-slate-200" />
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-900 text-base leading-tight mb-2">{product.name}</h3>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-1">SKU: {product.sku}</span>
                    <span className="font-bold text-primary">{formatPrice(product.price)}</span>
                  </div>
                  
                  <table className="w-full text-xs text-left mt-auto">
                    <tbody>
                      <tr className="border-t border-slate-100">
                        <th className="py-2 text-slate-500 font-medium">Barcode (EAN-13)</th>
                        <td className="py-2 text-slate-900 font-mono text-right">880...</td>
                      </tr>
                      <tr className="border-t border-slate-100">
                        <th className="py-2 text-slate-500 font-medium">Quy cách đóng gói</th>
                        <td className="py-2 text-slate-900 font-medium text-right">{product.packaging_spec || '120 gói/thùng'}</td>
                      </tr>
                      <tr className="border-t border-slate-100">
                        <th className="py-2 text-slate-500 font-medium">Khối lượng tịnh</th>
                        <td className="py-2 text-slate-900 font-medium text-right">{product.weight || '40g'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            
            {products.length === 0 && (
              <div className="col-span-2 text-center py-20 bg-white border border-dashed border-slate-300">
                <Info className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Chưa có dữ liệu sản phẩm trong hệ thống.</p>
              </div>
            )}
          </div>

          {/* Logistics Box */}
          <div className="bg-slate-900 text-white p-6 mt-auto">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Truck className="w-8 h-8 text-primary" />
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-widest mb-1">Quy Chuẩn Giao Hàng Siêu Thị</h4>
                    <p className="text-slate-400 text-xs">Hàng hóa được đóng thùng Carton 5 lớp kiên cố. Tem nhãn phụ Tiếng Việt dán sẵn 100%.</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">Sẵn Sàng Giao Tuyến (DC)</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 5: TIÊU CHUẨN PHÁP LÝ --- */}
      <div className="a4-page bg-white p-12 relative border border-slate-200 print:border-none">
        <div className="border-b-2 border-slate-900 pb-4 mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Hồ Sơ Pháp Lý</h2>
            <p className="text-primary text-sm font-bold mt-1 uppercase tracking-widest">Đủ Điều Kiện Lưu Hành Toàn Quốc</p>
          </div>
          <div className="text-slate-200 font-black text-6xl leading-none">04</div>
        </div>

        <div className="space-y-10">
           <p className="text-sm text-slate-700 leading-relaxed text-justify border-l-4 border-primary pl-4">
             Sự an tâm của đối tác phân phối là ưu tiên hàng đầu của LYHU Group. Toàn bộ danh mục sản phẩm UHi đều tuân thủ các quy định pháp luật hiện hành về xuất nhập khẩu và Vệ sinh an toàn thực phẩm. Hồ sơ năng lực bản cứng (sao y công chứng) sẽ được đính kèm khi ký kết hợp đồng thương mại.
           </p>

           <div className="grid grid-cols-2 gap-6">
              {/* Box 1 */}
              <div className="border border-slate-200 p-6 flex flex-col group hover:border-primary transition-colors">
                 <div className="flex items-center justify-between mb-4">
                    <FileText className="w-8 h-8 text-slate-900 group-hover:text-primary transition-colors" />
                    <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 font-bold uppercase">Hải Quan</span>
                 </div>
                 <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide mb-2">Tờ Khai Nhập Khẩu</h3>
                 <p className="text-xs text-slate-500 leading-relaxed mt-auto">Minh bạch nguồn gốc. Tờ khai hải quan điện tử đã thông quan hàng hóa chính ngạch từ Hàn Quốc về cảng Việt Nam.</p>
              </div>

              {/* Box 2 */}
              <div className="border border-slate-200 p-6 flex flex-col group hover:border-primary transition-colors">
                 <div className="flex items-center justify-between mb-4">
                    <Award className="w-8 h-8 text-slate-900 group-hover:text-primary transition-colors" />
                    <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 font-bold uppercase">Xuất Xứ</span>
                 </div>
                 <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide mb-2">Giấy Chứng Nhận C/O</h3>
                 <p className="text-xs text-slate-500 leading-relaxed mt-auto">Certificate of Origin do cơ quan có thẩm quyền tại Hàn Quốc cấp, xác nhận hàng hóa 100% Made in Korea.</p>
              </div>

              {/* Box 3 */}
              <div className="border border-slate-200 p-6 flex flex-col group hover:border-primary transition-colors">
                 <div className="flex items-center justify-between mb-4">
                    <ShieldCheck className="w-8 h-8 text-slate-900 group-hover:text-primary transition-colors" />
                    <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 font-bold uppercase">Bộ Y Tế</span>
                 </div>
                 <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide mb-2">Bản Tự Công Bố</h3>
                 <p className="text-xs text-slate-500 leading-relaxed mt-auto">Hồ sơ công bố hợp quy theo Nghị định 15/2018/NĐ-CP. Được xét duyệt bởi Chi cục ATVSTP sở tại.</p>
              </div>

              {/* Box 4 */}
              <div className="border border-slate-200 p-6 flex flex-col group hover:border-primary transition-colors">
                 <div className="flex items-center justify-between mb-4">
                    <Check className="w-8 h-8 text-slate-900 group-hover:text-primary transition-colors" />
                    <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 font-bold uppercase">Kiểm Định</span>
                 </div>
                 <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide mb-2">Test Report VN</h3>
                 <p className="text-xs text-slate-500 leading-relaxed mt-auto">Phiếu kết quả kiểm nghiệm từ trung tâm thử nghiệm độc lập đạt chuẩn ISO/IEC 17025 tại Việt Nam.</p>
              </div>
           </div>

           {/* Labeling Rule */}
           <div className="bg-slate-50 border-l-4 border-slate-800 p-6">
              <div className="flex items-start gap-4">
                 <Info className="w-6 h-6 text-slate-800 shrink-0 mt-0.5" />
                 <div>
                   <h3 className="font-bold text-slate-900 text-sm mb-1 uppercase">Quy Định Nhãn Phụ Tiếng Việt</h3>
                   <p className="text-xs text-slate-600 leading-relaxed">
                     Trách nhiệm của nhà nhập khẩu là tuân thủ Nghị định 43/2017/NĐ-CP. LYHU Group cam kết 100% sản phẩm (cấp độ gói và cấp độ thùng) khi giao đến Trung tâm phân phối (DC) của Siêu thị đều đã được dán nhãn phụ Tiếng Việt thể hiện đầy đủ: Thành phần, NSX, HSD, Cảnh báo an toàn và Thông tin nhà phân phối độc quyền.
                   </p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 6: HỖ TRỢ THƯƠNG MẠI & LIÊN HỆ --- */}
      <div className="a4-page bg-white p-12 flex flex-col relative border border-slate-200 print:border-none">
        <div className="border-b-2 border-slate-900 pb-4 mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Hỗ Trợ & Liên Hệ</h2>
            <p className="text-primary text-sm font-bold mt-1 uppercase tracking-widest">Trade Marketing & Sales B2B</p>
          </div>
          <div className="text-slate-200 font-black text-6xl leading-none">05</div>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-10">
            {/* Trade Marketing */}
            <div>
              <h3 className="text-base font-bold mb-6 text-slate-900 uppercase flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Trade Marketing
              </h3>
              <ul className="space-y-6">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center shrink-0 mt-0.5"><BadgePercent className="w-3 h-3 text-slate-700"/></div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Chương Trình Khuyến Mãi</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">Ngân sách hỗ trợ CTKM định kỳ (Discount, BOGO) nhằm đẩy mạnh vòng quay hàng tồn kho (Sell-out).</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center shrink-0 mt-0.5"><ThumbsUp className="w-3 h-3 text-slate-700"/></div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Vật Phẩm Trưng Bày (POSM)</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">Tài trợ Hanger dây treo chuyên dụng cho quầy Checkout, wobbler và kệ mini tiết kiệm diện tích.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Sales Policies */}
            <div>
              <h3 className="text-base font-bold mb-6 text-slate-900 uppercase flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" /> Chính Sách Phân Phối
              </h3>
              <ul className="space-y-6">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center shrink-0 mt-0.5"><Zap className="w-3 h-3 text-slate-700"/></div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Chiết Khấu (Margin) Tối Ưu</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">Cấu trúc giá minh bạch, đảm bảo biên lợi nhuận cực kỳ cạnh tranh. Chính sách thưởng Target (Rebate) hấp dẫn.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center shrink-0 mt-0.5"><Calendar className="w-3 h-3 text-slate-700"/></div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Thanh Toán Công Nợ</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">Áp dụng thời hạn công nợ linh hoạt 15-30-45 ngày đối với các hệ thống siêu thị MT lớn.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-auto pt-10">
            <div className="bg-slate-900 text-white p-10 grid grid-cols-12 gap-8 items-center">
              <div className="col-span-8 border-r border-slate-700 pr-8">
                <p className="text-primary font-bold text-xs uppercase tracking-widest mb-2">Phòng Kinh Doanh B2B</p>
                <h3 className="font-black text-3xl mb-6 uppercase tracking-tight text-white">Kết Nối Ngay</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Đường dây nóng (Hotline)</span>
                    <span className="font-bold text-lg text-primary">090.xxxx.xxx</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Hộp thư điện tử (Email)</span>
                    <span className="font-medium text-white">b2b@lyhu.vn</span>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-slate-400">Địa chỉ văn phòng</span>
                    <span className="font-medium text-white text-right">Trụ sở CÔNG TY TNHH LYHU GROUP</span>
                  </div>
                </div>
              </div>
              <div className="col-span-4 flex flex-col items-center justify-center text-center">
                <div className="bg-white p-3 mb-3">
                  <div className="w-24 h-24 border border-dashed border-slate-300 flex items-center justify-center">
                    <p className="text-[10px] font-bold text-slate-400">QR Code<br/>Zalo OA</p>
                  </div>
                </div>
                <p className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Quét Để Liên Hệ</p>
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
