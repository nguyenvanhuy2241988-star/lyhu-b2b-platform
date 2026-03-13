'use client';

import { useState, useRef, useCallback } from 'react';
import {
    Copy, Check, RefreshCw, Image, Palette, Type, Sparkles,
    ChevronRight, ChevronLeft, Wand2, Download, Upload, X, Loader2, Camera, Zap
} from 'lucide-react';
import {
    PosterType, AspectRatio, DesignStyle, TextStyle, PosterFormData, BrandProfile,
    ReferenceFormData,
    POSTER_TYPES, ASPECT_RATIOS, DESIGN_STYLES, TEXT_STYLES, DEFAULT_BRANDS,
    generatePosterPrompt, generateRefinementPrompt, generateReferencePrompt,
} from '@/lib/posterPromptEngine';

export default function PosterStudioPage() {
    // ============ STATE ============
    const [mode, setMode] = useState<'create' | 'reference'>('create');
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

    // Brand images
    const [analyzing, setAnalyzing] = useState(false);
    const logoFileInput = useRef<HTMLInputElement>(null);
    const productFileInput = useRef<HTMLInputElement>(null);

    // Reference mode
    const [referenceNotes, setReferenceNotes] = useState('');
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const refFileInput = useRef<HTMLInputElement>(null);

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

    // ============ BRAND IMAGE UPLOAD & ANALYSIS ============
    const handleLogoUpload = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        // Resize to thumbnail for localStorage
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxSize = 256;
                const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const thumbnail = canvas.toDataURL('image/png', 0.8);
                setSelectedBrand(prev => ({ ...prev, logo_image: thumbnail }));
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleProductImageUpload = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        const currentImages = selectedBrand.product_images || [];
        if (currentImages.length >= 3) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxSize = 256;
                const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
                setSelectedBrand(prev => ({
                    ...prev,
                    product_images: [...(prev.product_images || []), thumbnail],
                }));
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveProductImage = (index: number) => {
        setSelectedBrand(prev => ({
            ...prev,
            product_images: (prev.product_images || []).filter((_, i) => i !== index),
        }));
    };

    const analyzeBrand = async () => {
        if (!selectedBrand.logo_image) return;
        setAnalyzing(true);
        try {
            const res = await fetch('/api/marketing/analyze-brand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    logo_image: selectedBrand.logo_image,
                    product_image: selectedBrand.product_images?.[0] || undefined,
                }),
            });
            if (!res.ok) throw new Error('API error');
            const data = await res.json();
            setSelectedBrand(prev => ({
                ...prev,
                primary_color: data.primary_color || prev.primary_color,
                secondary_color: data.secondary_color || prev.secondary_color,
                detected_colors: data.additional_colors || [],
                industry: data.industry_guess || prev.industry,
                style_keywords: data.style_keywords || prev.style_keywords,
                font_suggestion: data.font_suggestion || undefined,
                default_instructions: prev.default_instructions || data.brand_description || '',
            }));
        } catch (err) {
            console.error('Brand analysis failed:', err);
            alert('Phân tích thất bại. Kiểm tra lại kết nối hoặc ảnh logo.');
        } finally {
            setAnalyzing(false);
        }
    };

    // ============ REFERENCE IMAGE HANDLING ============
    const handleRefImageUpload = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => setReferenceImage(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleRefDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleRefImageUpload(file);
    };

    const handleRefPaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                const file = items[i].getAsFile();
                if (file) handleRefImageUpload(file);
                break;
            }
        }
    };

    // ============ GENERATE ============
    const generatePrompt = () => {
        if (mode === 'reference') {
            const refData: ReferenceFormData = {
                brand: selectedBrand,
                aspect_ratio: aspectRatio,
                headline,
                subheadline: subheadline || undefined,
                product_name: productName || undefined,
                selling_points: sellingPoints.filter(s => s.trim()),
                cta: cta || undefined,
                product_description: productDesc || undefined,
                has_character: hasCharacter,
                character_description: characterDesc || undefined,
                reference_notes: referenceNotes || undefined,
                extra_instructions: extraInstructions || undefined,
            };
            const prompt = generateReferencePrompt(refData);
            setGeneratedPrompt(prompt);
            setStep(4);
            return;
        }

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

            {/* Mode Toggle */}
            <div className="flex gap-2 bg-white rounded-xl p-2 border border-slate-200 shadow-sm w-fit">
                <button
                    onClick={() => { setMode('create'); setStep(1); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        mode === 'create'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-500 hover:bg-slate-100'
                    }`}
                >
                    <Sparkles className="w-4 h-4" />
                    Tạo mới
                </button>
                <button
                    onClick={() => { setMode('reference'); setStep(1); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        mode === 'reference'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-slate-500 hover:bg-slate-100'
                    }`}
                >
                    <Image className="w-4 h-4" />
                    Thiết kế theo mẫu
                </button>
            </div>
            </div>

            {/* Progress Steps — Different for each mode */}
            {mode === 'create' ? (
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
            ) : (
                <div className="flex items-center gap-2 bg-white rounded-xl p-4 border border-purple-200 shadow-sm">
                    {[
                        { num: 1, label: 'Mẫu & Nội dung', icon: Image },
                        { num: 4, label: 'Prompt', icon: Wand2 },
                    ].map((s, i) => (
                        <div key={s.num} className="flex items-center">
                            <button
                                onClick={() => { if (s.num <= step) setStep(s.num); }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    step === s.num
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : step > s.num
                                        ? 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200'
                                        : 'bg-slate-100 text-slate-400'
                                }`}
                            >
                                <s.icon className="w-4 h-4" />
                                {s.label}
                            </button>
                            {i < 1 && <ChevronRight className="w-4 h-4 text-purple-300 mx-1" />}
                        </div>
                    ))}
                </div>
            )}

            {/* Step Content */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

                {/* ===== REFERENCE MODE: Combined Form ===== */}
                {mode === 'reference' && step === 1 && (
                    <div className="p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Image className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Thiết kế theo mẫu</h2>
                                <p className="text-sm text-slate-500">Mô tả ảnh mẫu bạn thích + điền nội dung của bạn</p>
                            </div>
                        </div>

                        {/* Reference image upload */}
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                            <h3 className="font-bold text-purple-800 text-sm flex items-center gap-2">
                                🖼️ Ảnh mẫu tham khảo
                            </h3>

                            {!referenceImage ? (
                                <div
                                    onClick={() => refFileInput.current?.click()}
                                    onDrop={handleRefDrop}
                                    onDragOver={e => e.preventDefault()}
                                    onPaste={handleRefPaste}
                                    tabIndex={0}
                                    className="border-2 border-dashed border-purple-300 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple-500 hover:bg-purple-100/50 transition-all group"
                                >
                                    <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition">
                                        <Upload className="w-6 h-6 text-purple-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-purple-700">Kéo thả ảnh mẫu vào đây</p>
                                        <p className="text-xs text-purple-500 mt-1">hoặc nhấn để chọn • hỗ trợ Ctrl+V dán ảnh</p>
                                    </div>
                                    <input
                                        ref={refFileInput}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) handleRefImageUpload(file);
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="relative group">
                                    <img
                                        src={referenceImage}
                                        alt="Ảnh mẫu"
                                        className="w-full max-h-[300px] object-contain rounded-xl border border-purple-200"
                                    />
                                    <button
                                        onClick={() => setReferenceImage(null)}
                                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => refFileInput.current?.click()}
                                        className="absolute bottom-2 right-2 px-3 py-1.5 bg-white/90 text-purple-700 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white border border-purple-200"
                                    >
                                        Đổi ảnh
                                    </button>
                                    <input ref={refFileInput} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleRefImageUpload(file); }} />
                                </div>
                            )}

                            <div className="pt-2">
                                <label className="text-xs font-medium text-purple-700 mb-1 block">Điểm bạn thích ở ảnh mẫu (tuỳ chọn)</label>
                                <textarea
                                    value={referenceNotes}
                                    onChange={e => setReferenceNotes(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-2.5 text-sm border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                    placeholder="VD: Chữ 3D vàng gold, sản phẩm bày từ hộp, mascot dễ thương, nền đỏ lễ hội..."
                                />
                            </div>

                            <p className="text-xs text-purple-500 bg-purple-100/50 rounded-lg px-3 py-2">
                                💡 <strong>Lưu ý:</strong> Sau khi copy prompt, hãy upload chính ảnh mẫu này vào AI Studio cùng với prompt để AI nhìn được mẫu thiết kế
                            </p>
                        </div>

                        {/* Brand selector (compact) */}
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-2 block">Thương hiệu</label>
                            <div className="flex gap-3 flex-wrap">
                                {brands.map(b => (
                                    <button
                                        key={b.id}
                                        onClick={() => setSelectedBrand(b)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                                            selectedBrand.id === b.id
                                                ? 'border-purple-500 bg-purple-50 shadow-md'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ background: b.primary_color }} />
                                        <span className="font-medium text-sm">{b.brand_name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Aspect ratio */}
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-2 block">Tỷ lệ hình</label>
                            <div className="flex gap-2 flex-wrap">
                                {Object.entries(ASPECT_RATIOS).map(([key, val]) => (
                                    <button
                                        key={key}
                                        onClick={() => setAspectRatio(key as AspectRatio)}
                                        className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                                            aspectRatio === key
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        {val.label} <span className="text-slate-400">{val.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content fields */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-700 text-sm">Nội dung của bạn</h3>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Tiêu đề chính *</label>
                                <input
                                    type="text"
                                    value={headline}
                                    onChange={e => setHeadline(e.target.value)}
                                    className="w-full mt-1 px-4 py-3 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                                    placeholder="VD: LYHU Khoai Môn — Siêu Hot Mùa Tết"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Tiêu đề phụ</label>
                                    <input
                                        type="text"
                                        value={subheadline}
                                        onChange={e => setSubheadline(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="VD: Đặt ngay kẻo hết"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Sản phẩm</label>
                                    <input
                                        type="text"
                                        value={productName}
                                        onChange={e => setProductName(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="VD: Khoai môn LYHU, Snack bò"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">CTA</label>
                                <input
                                    type="text"
                                    value={cta}
                                    onChange={e => setCta(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="VD: Đặt hàng ngay hôm nay"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">Điểm nổi bật</label>
                                <div className="space-y-2">
                                    {sellingPoints.map((sp, i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            value={sp}
                                            onChange={e => {
                                                const arr = [...sellingPoints];
                                                arr[i] = e.target.value;
                                                setSellingPoints(arr);
                                            }}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                            placeholder={`VD: ${i === 0 ? 'Giảm 20%' : i === 1 ? 'Free Ship' : 'Mua 10 tặng 1'}`}
                                        />
                                    ))}
                                    <button onClick={() => setSellingPoints([...sellingPoints, ''])} className="text-xs text-purple-600 hover:underline">+ Thêm điểm</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Mô tả sản phẩm (visual)</label>
                                <input
                                    type="text"
                                    value={productDesc}
                                    onChange={e => setProductDesc(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="VD: Gói khoai môn bay ra từ hộp, voucher rơi"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={hasCharacter} onChange={e => setHasCharacter(e.target.checked)} className="w-4 h-4 rounded text-purple-600" />
                                    <span className="text-sm font-medium text-slate-700">Có nhân vật</span>
                                </label>
                                {hasCharacter && (
                                    <input type="text" value={characterDesc} onChange={e => setCharacterDesc(e.target.value)} className="w-full mt-2 px-3 py-2 text-sm border border-slate-300 rounded-lg" placeholder="VD: Nữ nhân viên mặc áo LYHU xanh ngọc" />
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Yêu cầu thêm</label>
                                <textarea
                                    value={extraInstructions}
                                    onChange={e => setExtraInstructions(e.target.value)}
                                    rows={2}
                                    className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="VD: Thêm hiệu ứng confetti, đổi tông màu xanh thay cho đỏ..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button onClick={generatePrompt} disabled={!headline.trim()} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                                <Wand2 className="w-4 h-4" /> Tạo Prompt theo mẫu
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== CREATE MODE: STEP 1: Brand ===== */}
                {mode === 'create' && step === 1 && (
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
                            <div className="bg-slate-50 rounded-xl p-5 space-y-5 border border-slate-200">
                                <h3 className="font-bold text-slate-700">Thông tin thương hiệu</h3>

                                {/* Logo & Product Image Upload */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Logo Upload */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                            <Camera className="w-3.5 h-3.5" /> Logo thương hiệu
                                        </label>
                                        {!selectedBrand.logo_image ? (
                                            <div
                                                onClick={() => logoFileInput.current?.click()}
                                                className="border-2 border-dashed border-blue-300 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition">
                                                    <Upload className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <p className="text-xs font-medium text-blue-600">Upload logo</p>
                                                <p className="text-xs text-blue-400">PNG, SVG, JPG</p>
                                            </div>
                                        ) : (
                                            <div className="relative group">
                                                <div className="border-2 border-blue-200 rounded-xl p-3 bg-white flex items-center justify-center min-h-[120px]">
                                                    <img src={selectedBrand.logo_image} alt="Logo" className="max-h-[100px] object-contain" />
                                                </div>
                                                <button
                                                    onClick={() => setSelectedBrand(prev => ({ ...prev, logo_image: undefined }))}
                                                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 text-xs"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => logoFileInput.current?.click()}
                                                    className="absolute bottom-1 right-1 px-2 py-1 bg-white/90 text-blue-600 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow border border-blue-200"
                                                >
                                                    Đổi
                                                </button>
                                            </div>
                                        )}
                                        <input ref={logoFileInput} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ''; }} />
                                    </div>

                                    {/* Product Image Upload */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                            <Image className="w-3.5 h-3.5" /> Ảnh sản phẩm (tùy chọn, tối đa 3)
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(selectedBrand.product_images || []).map((img, i) => (
                                                <div key={i} className="relative group">
                                                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white aspect-square flex items-center justify-center">
                                                        <img src={img} alt={`SP ${i + 1}`} className="w-full h-full object-cover" />
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveProductImage(i)}
                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow text-xs"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {(selectedBrand.product_images || []).length < 3 && (
                                                <div
                                                    onClick={() => productFileInput.current?.click()}
                                                    className="border-2 border-dashed border-slate-300 rounded-lg aspect-square flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                                                >
                                                    <Upload className="w-4 h-4 text-slate-400" />
                                                    <span className="text-xs text-slate-400">Thêm</span>
                                                </div>
                                            )}
                                        </div>
                                        <input ref={productFileInput} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleProductImageUpload(f); e.target.value = ''; }} />
                                    </div>
                                </div>

                                {/* Auto-Analysis Button */}
                                {selectedBrand.logo_image && (
                                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-purple-800 flex items-center gap-2">
                                                    <Zap className="w-4 h-4" /> Phân tích tự động bằng AI
                                                </h4>
                                                <p className="text-xs text-purple-600 mt-0.5">
                                                    Trích xuất mã màu, phong cách thiết kế, font chữ từ logo{selectedBrand.product_images?.length ? ' & sản phẩm' : ''}
                                                </p>
                                            </div>
                                            <button
                                                onClick={analyzeBrand}
                                                disabled={analyzing}
                                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                {analyzing ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang phân tích...</>
                                                ) : (
                                                    <><Wand2 className="w-4 h-4" /> Phân tích</>  
                                                )}
                                            </button>
                                        </div>

                                        {/* Font Suggestion Badge */}
                                        {selectedBrand.font_suggestion && (
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className="text-xs font-medium text-purple-700">🔤 Font gợi ý:</span>
                                                <span className="px-2.5 py-1 bg-white/80 border border-purple-200 rounded-full text-xs font-medium text-purple-800 shadow-sm">
                                                    {selectedBrand.font_suggestion}
                                                </span>
                                            </div>
                                        )}

                                        {/* Detected Colors Palette */}
                                        {selectedBrand.detected_colors && selectedBrand.detected_colors.length > 0 && (
                                            <div className="mt-3">
                                                <span className="text-xs font-medium text-purple-700 mb-1.5 block">🎨 Bảng màu phát hiện (nhấn để chọn):</span>
                                                <div className="flex gap-2 flex-wrap">
                                                    {[selectedBrand.primary_color, selectedBrand.secondary_color, ...selectedBrand.detected_colors].map((color, i) => (
                                                        <button
                                                            key={`${color}-${i}`}
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(color);
                                                            }}
                                                            className="group relative"
                                                            title={`${color} — Click để copy`}
                                                        >
                                                            <div
                                                                className={`w-8 h-8 rounded-lg border-2 shadow-sm transition-all hover:scale-110 ${
                                                                    i === 0 ? 'border-blue-500 ring-2 ring-blue-200' :
                                                                    i === 1 ? 'border-green-500 ring-2 ring-green-200' :
                                                                    'border-white hover:border-slate-300'
                                                                }`}
                                                                style={{ backgroundColor: color }}
                                                            />
                                                            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                                                {color}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex gap-4 mt-3 text-[10px] text-slate-400">
                                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Chính</span>
                                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Phụ</span>
                                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded border border-slate-300" /> Accent</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Brand Info Fields */}
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

                {/* ===== CREATE MODE: STEP 2: Content ===== */}
                {mode === 'create' && step === 2 && (
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

                {/* ===== CREATE MODE: STEP 3: Design Options ===== */}
                {mode === 'create' && step === 3 && (
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
                            {mode === 'reference'
                                ? <span>🖼️ Upload ảnh mẫu + Copy prompt → Dán vào AI Studio → Đính kèm logo/ảnh SP → Generate!</span>
                                : <span>📋 Copy prompt → Dán vào Google AI Studio → Đính kèm ảnh logo/sản phẩm → Generate</span>
                            }
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
                                <Sparkles className="w-4 h-4" /> {mode === 'reference' ? 'Thêm mẫu khác' : 'Tạo poster mới'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
