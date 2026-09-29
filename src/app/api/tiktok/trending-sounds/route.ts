import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface TrendingSoundItem {
    id: string;
    title: string;
    author: string;
    category: "warehouse_night" | "food_review" | "wholesale_sales" | "vinahouse_energy" | "lofi_chill";
    categoryLabel: string;
    tag: string;
    duration: string;
    url: string;
    playsCount: string;
    recommendationReason: string;
    isHot: boolean;
}

const TRENDING_SOUNDS_FEED: TrendingSoundItem[] = [
    {
        id: "tt_tramy_night",
        title: "âm thanh gốc - Trà My 24Zone (Kể chuyện kho đêm)",
        author: "Trà My 24Zone (Official)",
        category: "warehouse_night",
        categoryLabel: "Kể chuyện kho đêm",
        tag: "🔥 Hot Nhất 24Zone",
        duration: "0:51",
        url: "/audio/bgm/warehouse_flow.mp3",
        playsCount: "1.8M video",
        recommendationReason: "Âm hưởng tự sự, tiếng xe nâng, tiếng xé bao bì chân thật, giữ chân người xem 100%",
        isHot: true
    },
    {
        id: "tt_banhang_speedup",
        title: "Beat Chốt Đơn Sôi Động (Speed-up TikTok 2026)",
        author: "TikTok Viral Sounds",
        category: "wholesale_sales",
        categoryLabel: "Bán buôn & Xả kho",
        tag: "⚡ Kích Thích Mua",
        duration: "0:45",
        url: "/audio/bgm/trending.mp3",
        playsCount: "920K video",
        recommendationReason: "Nhịp trống dồn dập, đẩy nhịp tim người xem, kích thích hành động nhắn tin chốt đơn ngay",
        isHot: true
    },
    {
        id: "tt_food_crispy",
        title: "Vui Tươi Ăn Vặt & Review Ẩm Thực (Giòn Rụm)",
        author: "Foodie Daily Sound",
        category: "food_review",
        categoryLabel: "Review món ăn vặt",
        tag: "🍜 Review Đồ Ăn",
        duration: "0:42",
        url: "/audio/bgm/food_review.mp3",
        playsCount: "2.4M video",
        recommendationReason: "Tiếng acoustic trong trẻo, phù hợp quay cận cảnh thanh khoai môn, bột phô mai, bánh tráng",
        isHot: true
    },
    {
        id: "tt_vinahouse_bass",
        title: "Vinahouse Bass Căng (Nhạc Nền TikTok Hot 2026)",
        author: "Hot TikTok Vietnam",
        category: "vinahouse_energy",
        categoryLabel: "Vinahouse năng lượng",
        tag: "🎧 Bass Cực Cuốn",
        duration: "0:38",
        url: "/audio/bgm/trending.mp3",
        playsCount: "3.1M video",
        recommendationReason: "Dành cho video ngắn dưới 20 giây giật tít giảm giá cực sốc hoặc container cập bến",
        isHot: true
    },
    {
        id: "tt_lofi_logistics",
        title: "Lofi Nhẹ Nhàng Thư Giãn (Đóng Gói Đơn Hàng)",
        author: "Chill Packing BGM",
        category: "lofi_chill",
        categoryLabel: "Đóng gói & Kho bãi",
        tag: "📦 Mộc Mạc Uy Tín",
        duration: "0:48",
        url: "/audio/bgm/warehouse_flow.mp3",
        playsCount: "540K video",
        recommendationReason: "Nhạc piano nhẹ nhàng, tôn vinh hình ảnh công nhân làm việc chăm chỉ, tạo niềm tin lớn cho khách sỉ",
        isHot: false
    }
];

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category");

        let items = TRENDING_SOUNDS_FEED;
        if (category && category !== "all") {
            items = items.filter(s => s.category === category);
        }

        return NextResponse.json({
            success: true,
            updatedAt: new Date().toISOString(),
            total: items.length,
            sounds: items
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
