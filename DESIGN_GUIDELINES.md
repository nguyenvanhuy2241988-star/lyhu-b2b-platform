# LYHU B2B - Design Guidelines

## Quy ước giao diện

### 1. CORE APP (Admin, Sales, CTV)
**Mục đích**: Dashboard nội bộ, ưu tiên hiệu suất làm việc và dễ đọc.

**Phong cách**:
- Minimal + Dashboard + Material/Flat
- Dễ đọc, thao tác nhanh
- Không lòe loẹt, tập trung vào dữ liệu

**Màu sắc**:
- Nền: Sáng, trung tính (`bg-slate-50`, `bg-white`)
- Text: `text-slate-900` (chính), `text-slate-600` (phụ)
- Màu nhấn: Xanh ngọc/xanh dương LYHU cho button chính, link, icon quan trọng
- Border: `border-slate-200`

**Bố cục**:
- Sidebar trái + Topbar trên
- Nội dung: Card KPI, bảng (table), filter
- Layout dashboard: Nhiều card nhỏ, có khoảng trắng, không nhồi nhét

**Tailwind Components**:
```jsx
// Card
<div className="rounded-xl shadow-sm border border-slate-200 p-4 lg:p-6 bg-white">

// Button Primary
<button className="bg-primary-500 text-white hover:bg-primary-600 px-4 py-2 rounded-lg">

// Table Header
<thead className="bg-slate-50 text-slate-600">
```

**Tránh**:
- Màu đậm quá nhiều
- Gradient lòe loẹt
- Icon rối mắt trong khu vực làm việc

---

### 2. TRANG KHÁCH HÀNG B2B (Catalogue, Giỏ hàng, Đặt đơn)
**Mục đích**: Trải nghiệm mua hàng, được phép đậm brand hơn.

**Phong cách**:
- Vẫn clean, dễ đọc
- Cho phép sử dụng màu thương hiệu mạnh mẽ hơn
- Hiệu ứng nhẹ cho hero/banner

**Card sản phẩm**:
- Hình ảnh + tên + giá + tag khuyến mãi + nút "Thêm vào giỏ"
- Dùng màu thương hiệu ở viền hoặc badge (cam UHI, tím BOYO, xanh CVT...)
- Hover effects rõ ràng

**Banner / Promotion**:
- Cho phép glassmorphism nhẹ:
  ```jsx
  <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/30">
  ```
- Chỉ dùng cho hero/banner, không mờ toàn màn hình
- Text phải dễ đọc, đủ tương phản

**Button**:
- Rõ ràng: `bg-brand-500 text-white hover:bg-brand-600`
- Call-to-action nổi bật

---

### 3. Responsive - Mobile First
**Quy tắc**:
- Một codebase cho desktop / tablet / mobile
- Tailwind breakpoints: `sm`, `md`, `lg`, `xl`

**Behavior**:
- **Desktop (lg, xl)**: Sidebar luôn hiện, card nhiều cột
- **Tablet (md)**: Sidebar có thể thu hẹp
- **Mobile (default, sm)**: Sidebar ẩn → hamburger menu, card 1 cột

**Ví dụ**:
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards */}
</div>

<aside className="fixed lg:static transform -translate-x-full lg:translate-x-0">
  {/* Sidebar */}
</aside>
```

---

## Áp dụng cho từng Role

| Role | Style Guide | Đặc điểm |
|------|-------------|----------|
| Admin | CORE APP | Minimal dashboard, nhiều bảng và KPI |
| Sales | CORE APP | Dashboard theo dõi hiệu suất, list khách hàng |
| CTV | CORE APP | Quản lý lead đơn giản |
| Customer (B2B) | TRANG KHÁCH HÀNG | Product catalogue, shopping experience |

---

## Brand Colors (LYHU)
Cập nhật trong `tailwind.config.ts`:
```ts
colors: {
  primary: {
    50: '#e6f9f5',
    100: '#ccf3eb',
    200: '#99e7d7',
    300: '#66dbc3',
    400: '#33cfaf',
    500: '#00BFA5', // Main brand color
    600: '#00a087',
    700: '#007d67',
    800: '#005a47',
    900: '#003727',
  },
  // Add more brand colors if needed
}
```
