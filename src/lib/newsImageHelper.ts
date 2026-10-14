/**
 * News Image Helper - Đảm bảo hình ảnh bài viết luôn đúng bối cảnh,
 * sang trọng, chuẩn nhận diện thương hiệu B2B LYHU, bài trừ triệt để ảnh rác/lạc đề/phản cảm.
 */

export interface ImagePool {
    banner: string;
    body1: string;
    body2: string;
}

// Thư viện ảnh nội bộ chất lượng cao chuẩn nhận diện thương hiệu LYHU
export const CURATED_ASSET_LIBRARY = {
    boyo: [
        '/boyo_news_banner.jpg',
        '/boyo_65g_poster.jpg',
        '/boyo_dish_fries.jpg',
        '/boyo_dish_chicken.jpg',
        '/boyo_dish_popcorn.jpg'
    ],
    cvt: [
        'https://wepxcpifgxghfvdgnkeh.supabase.co/storage/v1/object/public/report-images/product_img_1775408989723_ybzt28.png',
        'https://wepxcpifgxghfvdgnkeh.supabase.co/storage/v1/object/public/report-images/product_img_1775409014434_iyl9zu.png',
        'https://wepxcpifgxghfvdgnkeh.supabase.co/storage/v1/object/public/report-images/product_img_1775409056235_rm8te8.png'
    ],
    uhi: [
        'https://wepxcpifgxghfvdgnkeh.supabase.co/storage/v1/object/public/report-images/product_img_1775409242694_t72gaa.jpeg',
        'https://wepxcpifgxghfvdgnkeh.supabase.co/storage/v1/object/public/report-images/product_img_1775409226372_4x53qa.jpeg',
        'https://wepxcpifgxghfvdgnkeh.supabase.co/storage/v1/object/public/report-images/product_img_1775409267851_0ueb2a.jpeg'
    ],
    abi: [
        'https://wepxcpifgxghfvdgnkeh.supabase.co/storage/v1/object/public/report-images/product_img_1775415527421_k85b9b.jpg',
        'https://wepxcpifgxghfvdgnkeh.supabase.co/storage/v1/object/public/report-images/product_img_1775415286851_04wq2m.jpg',
        'https://wepxcpifgxghfvdgnkeh.supabase.co/storage/v1/object/public/report-images/product_img_1775415221604_jzhah2.jpg'
    ],
    baTuyet: [
        '/news/chan_ga_ba_tuyet_tieu_huy_nhat_ban.jpg',
        '/news/chan_ga_ba_tuyet_phan_hoi.png',
        '/news/chan_ga_kho_hang_b2b.jpg'
    ],
    chanGa: [
        '/news/chan_ga_tmdt_banner.jpg',
        '/news/chan_ga_kiem_dinh_lab.jpg',
        '/news/chan_ga_kho_hang_b2b.jpg'
    ],
    deliveryApps: [
        '/news/grabmart_shopeefood_delivery.jpg',
        '/emagazine/grocery_handshake.jpg',
        '/news/chan_ga_kho_hang_b2b.jpg'
    ],
    healthySnacks: [
        '/news/snack_healthy_organic.jpg',
        '/emagazine/snacks_culinary_prep.jpg',
        '/boyo_cheese_lineup.jpg'
    ],
    warehouseLogistics: [
        '/emagazine/founder_warehouse.jpg',
        '/emagazine/lyhu_truck.jpg',
        '/news/chan_ga_kho_hang_b2b.jpg',
        '/emagazine/grocery_handshake.jpg'
    ],
    retailGrocery: [
        '/emagazine/grocery_handshake.jpg',
        '/emagazine/lyhu_interior.jpg',
        '/news/grabmart_shopeefood_delivery.jpg',
        'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=1200', // Kệ hàng siêu thị hiện đại
        'https://images.pexels.com/photos/1000633/pexels-photo-1000633.jpeg?auto=compress&cs=tinysrgb&w=1200'  // Thực phẩm đóng gói sạch sẽ
    ],
    cookingLifestyle: [
        '/emagazine/snacks_culinary_prep.jpg',
        '/boyo_dish_fries.jpg',
        '/boyo_dish_chicken.jpg',
        'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200', // Bàn ăn gia đình
        'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=1200'  // Món ăn healthy
    ]
};

/**
 * Kiểm tra xem chủ đề có khớp với bộ nhận diện thương hiệu độc quyền hoặc chủ đề đặc thù không
 */
export function getMatchedCuratedImages(topic: string): string[] | null {
    const t = topic.toLowerCase();

    // 1. Thương hiệu độc quyền LYHU
    if (t.includes('boyo') || t.includes('bột phô mai') || t.includes('phô mai lắc') || t.includes('khoai lắc')) {
        return CURATED_ASSET_LIBRARY.boyo;
    }
    if (t.includes('cvt') || t.includes('khoai môn') || t.includes('khoai sấy')) {
        return CURATED_ASSET_LIBRARY.cvt;
    }
    if (t.includes('uhi') || t.includes('kẹo dẻo') || t.includes('kẹo chua')) {
        return CURATED_ASSET_LIBRARY.uhi;
    }
    if (t.includes('abi') || t.includes('bánh tráng') || t.includes('da cá')) {
        return CURATED_ASSET_LIBRARY.abi;
    }

    // 2. Các chủ đề thời sự / nhãn hàng cụ thể
    if (t.includes('bà tuyết') || t.includes('ba tuyet') || t.includes('ăn cùng bà tuyết') || t.includes('an cung ba tuyet')) {
        return CURATED_ASSET_LIBRARY.baTuyet;
    }

    // 3. Các chủ đề ăn vặt, thực phẩm đóng gói
    if (t.includes('chân gà') || t.includes('gà cay') || t.includes('hút chân không') || t.includes('ăn vặt cay')) {
        return CURATED_ASSET_LIBRARY.chanGa;
    }
    if (t.includes('grabmart') || t.includes('shopeefood') || t.includes('gojek') || t.includes('giao nhanh') || t.includes('app bán lẻ') || t.includes('giao hàng tức thì')) {
        return CURATED_ASSET_LIBRARY.deliveryApps;
    }
    if (t.includes('healthy') || t.includes('organic') || t.includes('sugar-free') || t.includes('không đường') || t.includes('ăn kiêng') || t.includes('eat clean') || t.includes('hạt dinh dưỡng') || t.includes('yến mạch')) {
        return CURATED_ASSET_LIBRARY.healthySnacks;
    }
    if (t.includes('kho bãi') || t.includes('logistics') || t.includes('vận tải') || t.includes('chuỗi cung ứng') || t.includes('tổng kho') || t.includes('nhà phân phối') || t.includes('nhập sỉ thùng')) {
        return CURATED_ASSET_LIBRARY.warehouseLogistics;
    }
    if (t.includes('tạp hóa') || t.includes('siêu thị mini') || t.includes('kênh gt') || t.includes('điểm bán') || t.includes('quầy kệ') || t.includes('mặt bằng') || t.includes('dòng tiền')) {
        return CURATED_ASSET_LIBRARY.retailGrocery;
    }
    if (t.includes('nấu ăn') || t.includes('công thức') || t.includes('món ngon') || t.includes('bếp núc') || t.includes('gia vị') || t.includes('mâm cơm')) {
        return CURATED_ASSET_LIBRARY.cookingLifestyle;
    }

    return null;
}

/**
 * Tìm kiếm ảnh Pexels an toàn, chuẩn trang 1 (Page 1) không nhảy sang trang ngẫu nhiên
 */
export async function fetchPexelsImageSafe(query: string, usedUrls: Set<string>): Promise<string | null> {
    const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
    if (!PEXELS_API_KEY || !query) return null;

    try {
        // Chỉ lấy page 1 - nơi Pexels trả về kết quả liên quan và chính xác nhất
        const sanitizedQuery = query
            .replace(/[^\w\s-]/g, '')
            .trim()
            .slice(0, 50);

        if (!sanitizedQuery) return null;

        const res = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(sanitizedQuery)}&per_page=10&page=1&orientation=landscape`,
            {
                headers: { Authorization: PEXELS_API_KEY },
                next: { revalidate: 3600 }
            }
        );

        if (!res.ok) return null;

        const data = await res.json();
        if (data.photos && data.photos.length > 0) {
            // Lấy ảnh đầu tiên chưa từng được sử dụng
            for (const photo of data.photos) {
                const url = photo.src.large2x || photo.src.original || photo.src.large;
                if (url && !usedUrls.has(url)) {
                    usedUrls.add(url);
                    return url;
                }
            }
            // Nếu đều đã dùng, bốc ảnh đầu tiên của Page 1
            return data.photos[0].src.large2x || data.photos[0].src.original;
        }
    } catch (e) {
        console.error('Lỗi khi fetch Pexels safe:', e);
    }

    return null;
}

/**
 * Lấy bộ 3 ảnh (thumbnail, body 1, body 2) an toàn tuyệt đối cho bài viết
 */
export async function resolveNewsImages(
    topic: string,
    imageQueries: string[] = [],
    existingUsedUrls: Set<string> = new Set()
): Promise<string[]> {
    // 1. Kiểm tra ảnh nội bộ độc quyền trước
    const matchedCurated = getMatchedCuratedImages(topic);
    if (matchedCurated && matchedCurated.length >= 3) {
        return matchedCurated.slice(0, 3);
    }

    // 2. Nếu có queries, thử fetch Pexels Page 1 an toàn
    const results: string[] = [];
    const usedUrls = new Set(existingUsedUrls);

    // Nếu matchedCurated có 1-2 ảnh, ưu tiên dùng làm thumbnail trước
    if (matchedCurated && matchedCurated.length > 0) {
        results.push(...matchedCurated);
    }

    // Duyệt qua từng search query cụ thể của AI
    for (const q of imageQueries) {
        if (results.length >= 3) break;
        const imgUrl = await fetchPexelsImageSafe(q, usedUrls);
        if (imgUrl) {
            results.push(imgUrl);
        }
    }

    // 3. Fallback an toàn từ thư viện Retail / FMCG nếu vẫn chưa đủ 3 ảnh
    const fallbackPool = [
        ...CURATED_ASSET_LIBRARY.retailGrocery,
        ...CURATED_ASSET_LIBRARY.warehouseLogistics,
        ...CURATED_ASSET_LIBRARY.healthySnacks
    ];

    let poolIdx = 0;
    while (results.length < 3 && poolIdx < fallbackPool.length) {
        const fallbackUrl = fallbackPool[poolIdx++];
        if (!results.includes(fallbackUrl)) {
            results.push(fallbackUrl);
        }
    }

    return results.slice(0, 3);
}
