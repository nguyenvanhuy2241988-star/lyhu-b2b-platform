'use client';

import React from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UHiCatalogGenerator() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:py-0 print:bg-white font-sans text-gray-900">
      {/* Nút bấm không hiển thị khi in */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href="/admin/sales-kits" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
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

      <div className="print:hidden max-w-[210mm] mx-auto mb-4 bg-blue-50 text-blue-800 p-4 rounded-lg text-sm border border-blue-200">
        <p><strong>💡 Mẹo in ấn:</strong> Khi hộp thoại in hiện ra, hãy chọn <strong>Destination: Save as PDF</strong> (Lưu dưới dạng PDF). Nhớ bật tùy chọn <strong>Background graphics</strong> (Đồ họa nền) và đặt Margins là <strong>None</strong> để bản in tràn viền đẹp nhất.</p>
      </div>

      {/* --- TRANG 1: BÌA CATALOG --- */}
      <div className="a4-page bg-gradient-to-br from-[#ccff00] via-[#39ff14] to-[#00ffcc] text-gray-900 flex flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-[300px] h-[300px] bg-yellow-400 rounded-full mix-blend-multiply filter blur-2xl opacity-60"></div>
        
        <div className="relative z-10 flex justify-between items-start">
          <div className="bg-black text-white px-6 py-2 font-bold text-2xl tracking-widest rounded-br-2xl uppercase shadow-xl">
            LYHU Group
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">Sales Kit 2026</p>
            <p className="text-sm font-medium opacity-80">Kênh Siêu Thị (MT)</p>
          </div>
        </div>

        <div className="relative z-10 text-center my-auto transform -rotate-2">
          <h1 className="text-9xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-black to-gray-800 drop-shadow-2xl mb-4" style={{ WebkitTextStroke: '2px white' }}>
            UHi
          </h1>
          <h2 className="text-5xl font-extrabold uppercase tracking-tight text-white drop-shadow-lg mb-8 outline-black">
            SOUR CANDY
          </h2>
          <p className="text-2xl font-bold bg-black text-white inline-block px-8 py-3 rounded-full shadow-2xl transform rotate-3">
            BÙNG NỔ VỊ GIÁC - ĐÁNH THỨC MỌI GIÁC QUAN
          </p>
        </div>

        <div className="relative z-10 border-t-4 border-black pt-6 flex justify-between items-end">
          <div>
            <h3 className="font-black text-2xl uppercase">Hồ Sơ Sản Phẩm</h3>
            <p className="font-medium text-lg">Năng lực cung ứng & Thông số kỹ thuật</p>
          </div>
          <div className="text-right font-bold text-xl bg-white px-6 py-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            lyhu.vn/uhi
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 2: HỒ SƠ NĂNG LỰC --- */}
      <div className="a4-page bg-white p-12 relative">
        <div className="border-b-4 border-black pb-4 mb-10">
          <h2 className="text-4xl font-black uppercase text-black">01. Hồ Sơ Năng Lực</h2>
          <p className="text-xl text-gray-500 font-medium">LYHU Group - Đối tác chiến lược ngành hàng FMCG</p>
        </div>

        <div className="grid grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-pink-600 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-pink-600 text-white flex items-center justify-center rounded-full text-sm">1</span>
                Về Chúng Tôi
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg text-justify">
                LYHU Group định vị là đơn vị tiên phong trong việc phát triển các dòng sản phẩm bánh kẹo "bắt trend" dành riêng cho giới trẻ (Gen Z & Alpha). Với hệ thống xưởng sản xuất chuẩn hóa, chúng tôi tự tin đáp ứng nhu cầu khổng lồ của các chuỗi bán lẻ.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-green-500 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-500 text-white flex items-center justify-center rounded-full text-sm">2</span>
                Năng Lực Sản Xuất
              </h3>
              <ul className="space-y-4 text-lg">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-black"></div>
                  <span><strong>Diện tích xưởng:</strong> 60m² (Mô hình tối ưu hóa)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-black"></div>
                  <span><strong>Công suất:</strong> Lên đến 15 tấn/tháng</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-black"></div>
                  <span><strong>Quy trình:</strong> Đóng gói tự động, dán nhãn bằng máy</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-gray-50 p-8 rounded-2xl border-2 border-gray-200">
              <h3 className="text-2xl font-bold text-blue-600 mb-4">Chứng Nhận Chất Lượng</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-bold text-xl shrink-0">✓</div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Giấy chứng nhận VSATTP</h4>
                    <p className="text-sm text-gray-500">Cơ sở đủ điều kiện An toàn thực phẩm cấp bởi Chi cục QLCL.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl shrink-0">✓</div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Kiểm nghiệm sản phẩm (Test Report)</h4>
                    <p className="text-sm text-gray-500">Đạt chuẩn 100% các chỉ tiêu vi sinh và kim loại nặng.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-xl shrink-0">✓</div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Bản Tự Công Bố</h4>
                    <p className="text-sm text-gray-500">Hồ sơ công bố hợp quy minh bạch, sẵn sàng lưu hành toàn quốc.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 3: THÔNG SỐ KỸ THUẬT SẢN PHẨM --- */}
      <div className="a4-page bg-white p-12 relative overflow-hidden">
        {/* Background graphic */}
        <div className="absolute top-0 right-0 w-[500px] h-[100%] bg-gradient-to-l from-[#ccff00]/20 to-transparent z-0"></div>

        <div className="relative z-10 border-b-4 border-black pb-4 mb-10">
          <h2 className="text-4xl font-black uppercase text-black">02. Kẹo Dẻo Chua UHi</h2>
          <p className="text-xl text-gray-500 font-medium">Sour Gummy Belts - Vị Táo Xanh & Dâu Tây</p>
        </div>

        <div className="relative z-10 flex gap-12">
          {/* Cột trái: Bảng thông số */}
          <div className="flex-1 space-y-8">
            <div>
              <p className="text-lg text-gray-700 italic border-l-4 border-[#39ff14] pl-4">
                "Trải nghiệm vị giác độc đáo, đánh đúng tâm lý tò mò và thích cảm giác mạnh của Gen Z. Không dùng phẩm màu độc hại."
              </p>
            </div>

            <table className="w-full text-left border-collapse border-2 border-black">
              <tbody>
                <tr className="border-b-2 border-gray-200">
                  <th className="p-4 bg-gray-100 font-bold border-r-2 border-gray-200 w-1/3 text-lg">Mã SKU</th>
                  <td className="p-4 font-mono font-bold text-xl">UHI-DEO-20G</td>
                </tr>
                <tr className="border-b-2 border-gray-200">
                  <th className="p-4 bg-gray-100 font-bold border-r-2 border-gray-200 text-lg">Trọng lượng tịnh</th>
                  <td className="p-4 text-lg">20g / gói</td>
                </tr>
                <tr className="border-b-2 border-gray-200">
                  <th className="p-4 bg-gray-100 font-bold border-r-2 border-gray-200 text-lg">Hạn sử dụng</th>
                  <td className="p-4 text-lg font-bold text-red-600">12 Tháng</td>
                </tr>
                <tr className="border-b-2 border-gray-200">
                  <th className="p-4 bg-gray-100 font-bold border-r-2 border-gray-200 text-lg">Mã vạch (EAN-13)</th>
                  <td className="p-4">
                    <div className="font-mono text-lg tracking-[0.2em] font-bold">8 938541 234567</div>
                    <div className="mt-2 h-12 w-48 bg-black opacity-20 relative overflow-hidden">
                      {/* Giả lập hình mã vạch */}
                      <div className="absolute inset-0 flex">
                        {[...Array(40)].map((_, i) => (
                          <div key={i} className={`h-full bg-black ${i % 2 === 0 ? 'w-1' : (i % 3 === 0 ? 'w-2' : 'w-0.5')} mx-[1px]`}></div>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th className="p-4 bg-gray-100 font-bold border-r-2 border-gray-200 text-lg">Thành phần</th>
                  <td className="p-4 text-sm leading-relaxed">
                    Đường, mạch nha, gelatin, axit citric (chất tạo chua tự nhiên), hương liệu tự nhiên (táo xanh, dâu tây).
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cột phải: Quy cách đóng gói */}
          <div className="w-[300px] shrink-0">
            <div className="bg-black text-white p-6 rounded-2xl shadow-xl transform rotate-1 mb-8">
              <h3 className="text-xl font-bold mb-4 uppercase border-b border-gray-700 pb-2 text-[#ccff00]">Quy Cách Thùng (Carton)</h3>
              <ul className="space-y-3">
                <li className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Số lượng:</span>
                  <span className="font-bold">120 gói/thùng</span>
                </li>
                <li className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Kích thước:</span>
                  <span className="font-bold">40 x 30 x 20 cm</span>
                </li>
                <li className="flex justify-between pb-2">
                  <span className="text-gray-400">Barcode Thùng:</span>
                  <span className="font-mono">1893...</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#ccff00] p-6 rounded-2xl shadow-xl transform -rotate-1 border-2 border-black">
              <h3 className="text-xl font-bold mb-4 uppercase border-b border-black pb-2 text-black">Giải Pháp Trưng Bày</h3>
              <p className="font-bold text-lg mb-2">Dạng Dây Treo (Hanger)</p>
              <p className="text-sm text-gray-800 leading-relaxed mb-4">
                Dây 12 gói có sẵn lỗ treo nhựa. Phù hợp tuyệt đối cho khu vực quầy thu ngân (Checkout Counter) kích thích mua bốc đồng.
              </p>
              <p className="font-bold text-lg mb-2">Shelf-Ready Box</p>
              <p className="text-sm text-gray-800 leading-relaxed">
                Hộp trưng bày xé rãnh, đặt thẳng lên kệ tiện lợi.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* --- TRANG 4: TRADE MARKETING & LIÊN HỆ --- */}
      <div className="a4-page bg-gray-900 text-white p-12 flex flex-col relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ccff00] rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>

        <div className="relative z-10 border-b-4 border-[#ccff00] pb-4 mb-10">
          <h2 className="text-4xl font-black uppercase text-[#ccff00]">03. Hỗ Trợ Thương Mại & Liên Hệ</h2>
          <p className="text-xl text-gray-300 font-medium">Cam kết đồng hành cùng chuỗi siêu thị</p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-12 mb-auto">
          <div>
            <h3 className="text-2xl font-bold mb-6 text-white border-l-4 border-pink-500 pl-4">Ngân sách Trade Marketing</h3>
            <div className="space-y-6">
              <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
                <h4 className="font-bold text-lg text-pink-400 mb-2 flex items-center gap-2">
                  <span>🎯</span> Khuyến mãi kích cầu
                </h4>
                <p className="text-gray-300">Ngân sách chạy chương trình định kỳ Mua 2 Tặng 1, hoặc Giảm 15% vào cuối tuần để tăng Traffic cho siêu thị.</p>
              </div>
              <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
                <h4 className="font-bold text-lg text-[#ccff00] mb-2 flex items-center gap-2">
                  <span>📱</span> Truyền thông (Digital)
                </h4>
                <p className="text-gray-300">Sản phẩm được phủ sóng review liên tục trên TikTok Reels. Hỗ trợ chạy Ads quét vị trí (Geo-targeting) quanh khu vực có siêu thị bày bán.</p>
              </div>
              <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
                <h4 className="font-bold text-lg text-blue-400 mb-2 flex items-center gap-2">
                  <span>♻️</span> Xử lý tồn kho
                </h4>
                <p className="text-gray-300">Chính sách đổi trả hàng cận date linh hoạt, siêu thị KHÔNG chịu rủi ro hàng tồn.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-6 text-white border-l-4 border-blue-500 pl-4">Đề Xuất Hợp Tác</h3>
            <div className="bg-white text-black p-8 rounded-2xl shadow-2xl relative">
              {/* Fake Clip */}
              <div className="absolute top-[-15px] left-1/2 transform -translate-x-1/2 w-16 h-8 bg-gray-300 rounded-full border-4 border-gray-400"></div>
              
              <ul className="space-y-4 text-lg font-medium">
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-2xl">✓</span>
                  Tỷ lệ chiết khấu thương mại (Margin) hấp dẫn.
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-2xl">✓</span>
                  Hỗ trợ phí lên kệ (Listing Fee) theo thỏa thuận.
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-2xl">✓</span>
                  Công nợ thanh toán linh hoạt 15 - 30 ngày.
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-2xl">✓</span>
                  Sẵn sàng tích hợp hệ thống EDI.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 bg-[#ccff00] text-black p-8 rounded-2xl border-4 border-black">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-black text-3xl mb-2 uppercase">Liên Hệ Đặt Hàng</h3>
              <p className="font-bold text-lg text-gray-800">Bộ phận Quản lý Khách Hàng Doanh Nghiệp (KAM)</p>
              <div className="mt-4 space-y-2 text-lg font-medium">
                <p>📞 Hotline/Zalo: <span className="font-black text-xl">090.xxxx.xxx</span></p>
                <p>✉️ Email: <span className="font-bold">b2b@lyhu.vn</span></p>
                <p>🏢 Địa chỉ: Trụ sở LYHU Group</p>
              </div>
            </div>
            <div className="w-32 h-32 bg-white border-4 border-black flex items-center justify-center p-2 rounded-xl">
              <div className="w-full h-full border-2 border-dashed border-gray-400 flex items-center justify-center text-center">
                <p className="font-bold text-sm text-gray-500">Mã QR<br/>Zalo OA</p>
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
          box-shadow: 0 0 15px rgba(0,0,0,0.1);
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
