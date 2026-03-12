'use client';

import { useState, useRef } from 'react';
import {
    Copy, Check, RefreshCw, Image, Palette, Type, Sparkles,
    ChevronRight, ChevronLeft, Wand2, Download
} from 'lucide-react';
import {
    PosterType, AspectRatio, DesignStyle, TextStyle, PosterFormData, BrandProfile,
    POSTER_TYPES, ASPECT_RATIOS, DESIGN_STYLES, TEXT_STYLES, DEFAULT_BRANDS,
    generatePosterPrompt, generateRefinementPrompt,
} from '@/lib/posterPromptEngine';

export default function PosterStudioPage() {
    // ============ STATE ============
    const [step, setStep] = useState(1);
    const [copied, setCopied] = useState(false);

    // Brand
    const [brands, setBrands] = useState<BrandProfile[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('poster_brands');
            return saved ? JSON.parse(saved) : DEFAULT_BRANDS;
        }
        return DEFAULT_BRANDS;
    });
    const [selectedBrand, setSelectedBrand] = useState<BrandProfile>(brands[0]);
    const [showBrandEditor, setShowBrandEditor] = useState(false);

    // Poster type
    const [posterType, setPosterType] = useState<PosterType>('promotion');

    // Content
    const [headline, setHeadline] = useState('');
    const [subheadline, setSubheadline] = useState('');
    const [productName, setProductName] = useState('');
    const [sellingPoints, setSellingPoints] = useState<string[]>(['', '', '']);
    const [cta, setCta] = useState('');

    // Visual
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [designStyle, setDesignStyle] = useState<DesignStyle>('vibrant');
    const [textStyle, setTextStyle] = useState<TextStyle>('3d_pop');
    const [hasCharacter, setHasCharacter] = useState(false);
    const [characterDesc, setCharacterDesc] = useState('');
    const [productDesc, setProductDesc] = useState('');
    const [bgDesc, setBgDesc] = useState('');
    const [extraInstructions, setExtraInstructions] = useState('');

    // Result
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [refinementFeedback, setRefinementFeedback] = useState('');
    const promptRef = useRef<HTMLTextAreaElement>(null);

    // ============ BRAND MANAGEMENT ============
    const saveBrand = (brand: BrandProfile) => {
        const updated = brands.map(b => b.id === brand.id ? brand : b);
        if (!brands.find(b => b.id === brand.id)) updated.push(brand);
        setBrands(updated);
        setSelectedBrand(brand);
        localStorage.setItem('poster_brands', JSON.stringify(updated));
        setShowBrandEditor(false);
    };

    const addNewBrand = () => {
        const newBrand: BrandProfile = {
            id: `brand_${Date.now()}`,
            brand_name: '',
            primary_color: '#2196F3',
            secondary_color: '#FF9800',
            industry: '',
            style_keywords: 'modern, professional',
            default_instructions: '',
        };
        setSelectedBrand(newBrand);
        setShowBrandEditor(true);
    };

    // ============ GENERATE ============
    const generatePrompt = () => {
        const formData: PosterFormData = {
            brand: selectedBrand,
            type: posterType,
            headline,
            subheadline: subheadline || undefined,
            product_name: productName || undefined,
            selling_points: sellingPoints.filter(s => s.trim()),
            cta: cta || undefined,
            aspect_ratio: aspectRatio,
            style: designStyle,
            text_style: textStyle,
            has_character: hasCharacter,
            character_description: characterDesc || undefined,
            product_description: productDesc || undefined,
            background_description: bgDesc || undefined,
            extra_instructions: extraInstructions || undefined,
        };

        const prompt = generatePosterPrompt(formData);
        setGeneratedPrompt(prompt);
        setStep(4);
    };

    const copyPrompt = async (text?: string) => {
        const t = text || generatedPrompt;
        await navigator.clipboard.writeText(t);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const generateRefinement = () => {
        if (!refinementFeedback.trim()) return;
        const newPrompt = generateRefinementPrompt(generatedPrompt, refinementFeedback);
        setGeneratedPrompt(newPrompt);
        setRefinementFeedback('');
    };

    // ============ RENDER ============
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-amber-500" />
                        AI Poster Studio
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Tạo prompt thiết kế poster chuyên nghiệp trong 30 giây</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                {[
                    { num: 1, label: 'Thương hiệu', icon: Palette },
                    { num: 2, label: 'Nội dung', icon: Type },
                    { num: 3, label: 'Thiết kế', icon: Image },
                    { num: 4, label: 'Prompt', icon: Wand2 },
                ].map((s, i) => (
                    <div key={s.num} className="flex items-center">
                        <button
                            onClick={() => { if (s.num <= step) setStep(s.num); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                step === s.num
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : step > s.num
                                    ? 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200'
                                    : 'bg-slate-100 text-slate-400'
                            }`}
                        >
                            <s.icon className="w-4 h-4" />
                            {s.label}
                        </button>
                        {i < 3 && <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

                {/* ===== STEP 1: Brand ===== */}
                {step === 1 && (
                    <div className="p-6 space-y-6">
                        <h2 className="text-lg font-bold text-slate-800">Chọn thương hiệu & Loại poster</h2>

                        {/* Brand selector */}
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-2 block">Thương hiệu</label>
                            <div className="flex gap-3 flex-wrap">
                                {brands.map(b => (
                                    <button
                                        key={b.id}
                                        onClick={() => { setSelectedBrand(b); setShowBrandEditor(false); }}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                                            selectedBrand.id === b.id
                                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ background: b.primary_color }} />
                                        <span className="font-medium text-sm">{b.brand_name}</span>
                                    </button>
                                ))}
                                <button
                                    onClick={addNewBrand}
                                    className="px-4 py-2.5 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 text-sm transition"
                                >
                                    + Thêm Brand
                                </button>
                            </div>
                        </div>

                        {/* Brand Editor (inline) */}
                        {showBrandEditor && (
                            <div className="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-200">
                                <h3 className="font-bold text-slate-700">Thông tin thương hiệu</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Tên thương hiệu *</label>
                                        <input
                                            type="text"
                                            value={selectedBrand.brand_name}
                                            onChange={e => setSelectedBrand({ ...selectedBrand, brand_name: e.target.value })}
                                            className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="VD: LYHU"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Ngành hàng</label>
                                        <input
                                            type="text"
                                            value={selectedBrand.industry}
                                            onChange={e => setSelectedBrand({ ...selectedBrand, industry: e.target.value })}
                                            className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="VD: Thực phẩm đóng gói, snack"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Màu chính</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input type="color" value={selectedBrand.primary_color} onChange={e => setSelectedBrand({ ...selectedBrand, primary_color: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                                            <input type="text" value={selectedBrand.primary_color} onChange={e => setSelectedBrand({ ...selectedBrand, primary_color: e.target.value })} className="w-24 px-2 py-1 text-sm border rounded-lg font-mono" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Màu phụ</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input type="color" value={selectedBrand.secondary_color} onChange={e => setSelectedBrand({ ...selectedBrand, secondary_color: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                                            <input type="text" value={selectedBrand.secondary_color} onChange={e => setSelectedBrand({ ...selectedBrand, secondary_color: e.target.value })} className="w-24 px-2 py-1 text-sm border rounded-lg font-mono" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Hướng dẫn mặc định (đồng phục, logo...)</label>
                                    <textarea
                                        value={selectedBrand.default_instructions}
                                        onChange={e => setSelectedBrand({ ...selectedBrand, default_instructions: e.target.value })}
                                        rows={2}
                                        className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="VD: Áo đồng phục polo xanh ngọc, logo ngực trái. Sản phẩm: khoai môn, snack, bánh kẹo..."
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => saveBrand(selectedBrand)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Lưu Brand</button>
                                    <button onClick={() => setShowBrandEditor(false)} className="px-4 py-2 text-slate-500 rounded-lg text-sm hover:bg-slate-100 transition">Hủy</button>
                                </div>
                            </div>
                        )}

                        {/* Edit brand button */}
                        {!showBrandEditor && selectedBrand.brand_name && (
                            <button onClick={() => setShowBrandEditor(true)} className="text-xs text-blue-600 hover:underline">✏️ Chỉnh sửa "{selectedBrand.brand_name}"</button>
                        )}

                        {/* Poster Type */}
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-3 block">Loại poster</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(POSTER_TYPES).map(([key, val]) => (
                                    <button
                                        key={key}
                                        onClick={() => setPosterType(key as PosterType)}
                                        className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                                            posterType === key
                                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                                : 'border-slate-200 hover:border-slate-300 hover:shadow'
                                        }`}
                                    >
                                        <span className="text-2xl mb-1">{val.icon}</span>
                                        <span className="text-sm font-bold text-slate-800">{val.label}</span>
                                        <span className="text-xs text-slate-500">{val.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button onClick={() => setStep(2)} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm">
                                Tiếp theo <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== STEP 2: Content ===== */}
                {step === 2 && (
                    <div className="p-6 space-y-5">
                        <h2 className="text-lg font-bold text-slate-800">Nội dung poster</h2>
                        <p className="text-sm text-slate-500">Điền thông tin chính — hệ thống sẽ tự sinh prompt thiết kế chuyên nghiệp</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-slate-700">Tiêu đề chính *</label>
                                <input
                                    type="text"
                                    value={headline}
                                    onChange={e => setHeadline(e.target.value)}
                                    className="w-full mt-1 px-4 py-3 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                    placeholder="VD: Bảo vệ giá kênh"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-slate-700">Tiêu đề phụ</label>
                                <input
                                    type="text"
                                    value={subheadline}
                                    onChange={e => setSubheadline(e.target.value)}
                                    className="w-full mt-1 px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="VD: Chốt sớm để khóa vùng"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Sản phẩm nổi bật</label>
                                <input
                                    type="text"
                                    value={productName}
                                    onChange={e => setProductName(e.target.value)}
                                    className="w-full mt-1 px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="VD: Khoai môn LYHU"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Kêu gọi hành động (CTA)</label>
                                <input
                                    type="text"
                                    value={cta}
                                    onChange={e => setCta(e.target.value)}
                                    className="w-full mt-1 px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="VD: Liên hệ ngay, Đặt hàng hôm nay"
                                />
                            </div>
                        </div>

                        {/* Selling Points */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">Điểm nổi bật / Ưu đãi</label>
                            <div className="space-y-2">
                                {sellingPoints.map((sp, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400 w-6">{i + 1}.</span>
                                        <input
                                            type="text"
                                            value={sp}
                                            onChange={e => {
                                                const arr = [...sellingPoints];
                                                arr[i] = e.target.value;
                                                setSellingPoints(arr);
                                            }}
                                            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder={`VD: ${i === 0 ? 'Độc quyền khu vực' : i === 1 ? 'Miễn phí vận chuyển' : 'Mua 10 tặng 1'}`}
                                        />
                                    </div>
                                ))}
                                <button
                                    onClick={() => setSellingPoints([...sellingPoints, ''])}
                                    className="text-xs text-blue-600 hover:underline ml-6"
                                >+ Thêm điểm nổi bật</button>
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-2.5 text-slate-600 rounded-lg hover:bg-slate-100 transition text-sm">
                                <ChevronLeft className="w-4 h-4" /> Quay lại
                            </button>
                            <button onClick={() => setStep(3)} disabled={!headline.trim()} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                                Tiếp theo <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== STEP 3: Design Options ===== */}
                {step === 3 && (
                    <div className="p-6 space-y-6">
                        <h2 className="text-lg font-bold text-slate-800">Tùy chọn thiết kế</h2>

                        {/* Aspect Ratio */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-3 block">Tỷ lệ hình</label>
                            <div className="flex gap-3 flex-wrap">
                                {Object.entries(ASPECT_RATIOS).map(([key, val]) => (
                                    <button
                                        key={key}
                                        onClick={() => setAspectRatio(key as AspectRatio)}
                                        className={`flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all min-w-[100px] ${
                                            aspectRatio === key
                                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <span className="text-sm font-bold text-slate-800">{val.label}</span>
                                        <span className="text-xs text-slate-500">{val.desc}</span>
                                        <span className="text-xs text-slate-400 mt-1">{val.px}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Design Style */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-3 block">Phong cách thiết kế</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {Object.entries(DESIGN_STYLES).map(([key, val]) => (
                                    <button
                                        key={key}
                                        onClick={() => setDesignStyle(key as DesignStyle)}
                                        className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                                            designStyle === key
                                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <span className="text-sm font-bold text-slate-800">{val.label}</span>
                                        <span className="text-xs text-slate-500">{val.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Text Style — THE MOST IMPORTANT */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">Kiểu chữ tiêu đề ⭐</label>
                            <p className="text-xs text-slate-500 mb-3">Chọn hiệu ứng cho tiêu đề — ảnh hưởng lớn đến chất lượng poster</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {Object.entries(TEXT_STYLES).map(([key, val]) => (
                                    <button
                                        key={key}
                                        onClick={() => setTextStyle(key as TextStyle)}
                                        className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                                            textStyle === key
                                                ? 'border-purple-500 bg-purple-50 shadow-md ring-1 ring-purple-300'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <span className="text-sm font-bold text-slate-800">{val.label}</span>
                                        <span className="text-xs text-slate-500">{val.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Character */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hasCharacter}
                                    onChange={e => setHasCharacter(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-slate-700">Có nhân vật / người mẫu trong poster</span>
                            </label>
                            {hasCharacter && (
                                <textarea
                                    value={characterDesc}
                                    onChange={e => setCharacterDesc(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="VD: Nam thanh niên mặc áo đồng phục LYHU, tư thế năng động, đang giới thiệu sản phẩm"
                                />
                            )}
                        </div>

                        {/* Product Visual */}
                        <div>
                            <label className="text-sm font-medium text-slate-700">Mô tả sản phẩm (visual)</label>
                            <textarea
                                value={productDesc}
                                onChange={e => setProductDesc(e.target.value)}
                                rows={2}
                                className="w-full mt-1 px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="VD: Gói khoai môn bay ra kèm voucher giảm giá, hiệu ứng động"
                            />
                        </div>

                        {/* Background */}
                        <div>
                            <label className="text-sm font-medium text-slate-700">Nền / Background</label>
                            <input
                                type="text"
                                value={bgDesc}
                                onChange={e => setBgDesc(e.target.value)}
                                className="w-full mt-1 px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="VD: Gradient xanh ngọc → xanh lá, có hoa văn nhẹ"
                            />
                        </div>

                        {/* Extra */}
                        <div>
                            <label className="text-sm font-medium text-slate-700">Yêu cầu thêm (tùy chọn)</label>
                            <textarea
                                value={extraInstructions}
                                onChange={e => setExtraInstructions(e.target.value)}
                                rows={2}
                                className="w-full mt-1 px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="VD: Sao chép 100% tư thế nhân vật poster mẫu, thêm hiệu ứng confetti..."
                            />
                        </div>

                        <div className="flex justify-between pt-4">
                            <button onClick={() => setStep(2)} className="flex items-center gap-2 px-5 py-2.5 text-slate-600 rounded-lg hover:bg-slate-100 transition text-sm">
                                <ChevronLeft className="w-4 h-4" /> Quay lại
                            </button>
                            <button onClick={generatePrompt} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition shadow-sm">
                                <Wand2 className="w-4 h-4" /> Tạo Prompt
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== STEP 4: Generated Prompt ===== */}
                {step === 4 && (
                    <div className="p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Wand2 className="w-5 h-5 text-purple-600" />
                                Prompt đã tạo
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={() => setStep(3)} className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">
                                    <RefreshCw className="w-3.5 h-3.5" /> Chỉnh lại
                                </button>
                                <button
                                    onClick={() => copyPrompt()}
                                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition shadow-sm ${
                                        copied
                                            ? 'bg-green-600 text-white'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {copied ? <><Check className="w-3.5 h-3.5" /> Đã copy!</> : <><Copy className="w-3.5 h-3.5" /> Copy Prompt</>}
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-xl p-5 overflow-hidden">
                            <textarea
                                ref={promptRef}
                                value={generatedPrompt}
                                onChange={e => setGeneratedPrompt(e.target.value)}
                                className="w-full bg-transparent text-green-400 font-mono text-sm leading-relaxed resize-none focus:outline-none min-h-[350px]"
                                spellCheck={false}
                            />
                        </div>

                        <div className="text-xs text-slate-500 flex items-center gap-4">
                            <span>📋 Copy prompt → Dán vào Google AI Studio → Đính kèm ảnh logo/sản phẩm → Generate</span>
                        </div>

                        {/* Refinement */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                            <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Chỉnh sửa nhanh (nếu ảnh chưa ưng)
                            </h3>
                            <p className="text-xs text-amber-700">Mô tả thay đổi cần thiết → Prompt sẽ tự cập nhật. Copy prompt mới dán lại vào AI Studio.</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={refinementFeedback}
                                    onChange={e => setRefinementFeedback(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') generateRefinement(); }}
                                    className="flex-1 px-3 py-2 text-sm border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                                    placeholder="VD: Chữ to hơn, thêm hiệu ứng pháo hoa, đổi nền sang đỏ..."
                                />
                                <button
                                    onClick={generateRefinement}
                                    disabled={!refinementFeedback.trim()}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition disabled:opacity-40"
                                >
                                    Cập nhật
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between pt-2">
                            <button onClick={() => { setStep(1); setGeneratedPrompt(''); }} className="flex items-center gap-2 px-5 py-2.5 text-slate-600 rounded-lg hover:bg-slate-100 transition text-sm">
                                <Sparkles className="w-4 h-4" /> Tạo poster mới
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
