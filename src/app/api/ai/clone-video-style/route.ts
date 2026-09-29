import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Helper to fetch TikTok metadata if a TikTok URL is provided
async function extractTikTokMeta(url: string): Promise<{ title: string; desc: string; author: string } | null> {
    try {
        if (!url || !url.includes("tiktok.com")) return null;

        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8"
            }
        });

        if (!res.ok) return null;
        const html = await res.text();

        // Try extracting Universal Data
        const regex = /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/;
        const match = html.match(regex);
        if (match) {
            const data = JSON.parse(match[1]);
            const item = data?.["__DEFAULT_SCOPE__"]?.["webapp.video-detail"]?.itemInfo?.itemStruct;
            if (item) {
                return {
                    title: item.desc || "",
                    desc: item.desc || "",
                    author: item.author?.nickname || item.author?.uniqueId || ""
                };
            }
        }

        // Fallback meta tags
        const descMatch = html.match(/name="description" content="([^"]+)"/i) || html.match(/property="og:description" content="([^"]+)"/i);
        return {
            title: "",
            desc: descMatch ? descMatch[1] : "",
            author: ""
        };
    } catch (e) {
        console.warn("Could not fetch TikTok meta:", e);
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { referenceUrl, referenceDesc, userTopic } = body;

        if (!userTopic) {
            return NextResponse.json({ error: "Vui lòng nhập chủ đề video của bạn" }, { status: 400 });
        }

        let refInfo = "";
        if (referenceUrl) {
            const meta = await extractTikTokMeta(referenceUrl);
            if (meta && meta.desc) {
                refInfo = `Nội dung/Caption video mẫu: "${meta.desc}". Tác giả: "${meta.author}". Link: ${referenceUrl}`;
            } else {
                refInfo = `Link video mẫu tham chiếu: ${referenceUrl}`;
            }
        }
        if (referenceDesc) {
            refInfo += `\nGhi chú thêm về phong cách mẫu: "${referenceDesc}"`;
        }

        // Check if Gemini API Key is available
        if (GEMINI_API_KEY) {
            const prompt = `Bạn là Đạo diễn nội dung xuất sắc kiêm chuyên gia sản xuất Video ngắn triệu view trên TikTok & Reels (phong cách mộc mạc, gần gũi, đời thường, cuốn hút như kênh Trà My 24Zone).
Nhiệm vụ: Phân tích phong cách của video mẫu và áp dụng 100% phong cách đó để viết kịch bản, bảng phân cảnh đạo diễn (Shooting Shotlist) và hiệu ứng chữ động cho thương hiệu LYHU! (Tổng kho sỉ đồ ăn vặt & gia vị F&B).

THÔNG TIN VIDEO MẪU THAM CHIẾU:
${refInfo || "Phong cách Trà My 24Zone: Mộc mạc, xưng 'bọn mình', mở đầu bằng câu chuyện đời thường/nỗi niềm địa phương, nhịp cắt 2.5s dồn dập, tự hào về chất lượng phục vụ, không quảng cáo sáo rỗng."}

CHỦ ĐỀ SẢN PHẨM LYHU CẦN DỰNG:
"${userTopic}"

YÊU CẦU ĐẦU RA BẮT BUỘC (JSON chuẩn, không kèm markdown):
{
  "hookTitle": "Tiêu đề giật tít 3.5s đầu in hoa có icon (VD: 🚛 12H ĐÊM CONTAINER KHOAI MÔN CVT CẬP KHO!)",
  "script": "Nội dung lời thoại hoàn chỉnh (tầm 110 - 130 từ, đọc khoảng 35 - 45 giây). Văn phong mộc mạc, xưng bọn mình/LYHU, nói chuyện chân thành như người nhà, cuốn hút.",
  "pacing": 2.5,
  "transition": "auto",
  "textColor": "#FACC15",
  "subtitleStyle": "tiktok_stroke",
  "textAnimationEffect": "tiktok_pop",
  "keyPowerWords": ["TỪ KHÓA 1", "TỪ KHÓA 2", "TỪ KHÓA 3", "TỪ KHÓA 4"],
  "directorGuide": {
    "hookVisual": "Hành động thị giác 3s đầu bẻ khóa sự chú ý (VD: Cận cảnh soi đèn flash vào nhãn Date mới tinh vừa bốc khói)",
    "spokenHook": "Câu nói mở đầu giật tít",
    "pacingSpeed": "2.5s / cảnh - Jump cut dồn dập",
    "keyPowerWords": ["DATE MỚI TINH", "GIÁ SỈ TẬN XƯỞNG", "GIÒN RỤM"],
    "callToAction": "Câu chốt kêu gọi hành động cuối clip",
    "shootingTips": [
      "Quay dọc 9:16 bằng điện thoại, cầm chắc tay hoặc lia nhẹ theo chiều ngang.",
      "Ưu tiên góc quay cận cảnh chi tiết hạt gia vị hoặc bao bì sản phẩm.",
      "Tận dụng ánh sáng tự nhiên hoặc đèn pin điện thoại để tạo độ chân thật."
    ],
    "shots": [
      {
        "shotNumber": 1,
        "shotType": "Cận cảnh Macro / Hook",
        "cameraMovement": "Zoom in dứt khoát",
        "action": "Mở đầu giật mắt với hành động thực tế",
        "duration": 2.5,
        "dialogueSnippet": "Câu thoại đoạn 1",
        "sfx": "Tiếng động giòn rụm hoặc tiếng còi xe"
      },
      {
        "shotNumber": 2,
        "shotType": "Trung cảnh",
        "cameraMovement": "Pan ngang mượt",
        "action": "Khui thùng hoặc thao tác thực tế",
        "duration": 2.5,
        "dialogueSnippet": "Câu thoại đoạn 2",
        "sfx": "Tiếng xé bao bì"
      },
      {
        "shotNumber": 3,
        "shotType": "Góc nhìn thứ nhất (POV)",
        "cameraMovement": "Lia máy theo tay",
        "action": "Trực quan sản phẩm trên tay hoặc trên kệ",
        "duration": 2.5,
        "dialogueSnippet": "Câu thoại đoạn 3",
        "sfx": "Tiếng rộp rộp"
      },
      {
        "shotNumber": 4,
        "shotType": "Toàn cảnh kho / quầy",
        "cameraMovement": "Lùi dần tạo chiều sâu",
        "action": "Hàng hóa đầy ắp thể hiện độ uy tín",
        "duration": 2.5,
        "dialogueSnippet": "Câu thoại đoạn 4",
        "sfx": "Tiếng xe nâng hoặc đóng băng keo"
      },
      {
        "shotNumber": 5,
        "shotType": "Cận cảnh thân thiện / CTA",
        "cameraMovement": "Tĩnh cố định",
        "action": "Cười tươi vẫy tay hoặc giơ sản phẩm mời khách",
        "duration": 2.5,
        "dialogueSnippet": "Câu thoại chốt đơn",
        "sfx": "Tiếng chuông ting ting"
      }
    ]
  },
  "storyboard": [
    "Góc 1 (0s-3s - Hook): ...",
    "Góc 2 (3s-10s): ...",
    "Góc 3 (10s-20s): ...",
    "Góc 4 (20s-35s): ...",
    "Góc 5 (35s-45s - CTA): ..."
  ],
  "styleSummary": "Đã học phong cách kể chuyện đời thường 24Zone và áp dụng chuẩn xác cho sản phẩm LYHU!"
}`;

            const aiRes = await fetch(GEMINI_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.75,
                        maxOutputTokens: 2500,
                        responseMimeType: "application/json"
                    }
                })
            });

            if (aiRes.ok) {
                const aiData = await aiRes.json();
                const rawText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (rawText) {
                    try {
                        const parsed = JSON.parse(rawText);
                        return NextResponse.json({
                            success: true,
                            ...parsed
                        });
                    } catch (pe) {
                        console.warn("JSON parse error from Gemini:", pe);
                    }
                }
            }
        }

        // Smart Director Fallback Generator
        const isNightWarehouse = /đêm|khuya|kho|container|xe|cập bến|hàng về|bốc dỡ/i.test(userTopic);

        let hookTitle = `🔥 ${userTopic.toUpperCase()} CẬP BẾN TỔNG KHO LYHU!`;
        let script = "";
        let hookVisual = "";
        let keyPowerWords: string[] = [];

        if (isNightWarehouse) {
            hookTitle = `🚛 12H ĐÊM CONTAINER ${userTopic.toUpperCase().replace(/CONTAINER|XE|HÀNG/g, '').trim()} CẬP KHO!`;
            hookVisual = "Bác tài lùi xe container vào cổng kho trong bóng đêm, công nhân bật đèn pha soi rọi từng kiện hàng";
            keyPowerWords = ["DATE MỚI TINH", "12H ĐÊM", "GIÁ SỈ TẬN KHO", "VỪA CẬP BẾN", "ĐỦ VỊ"];
            script = `Tầm này cả thành phố ngủ hết rồi, nhưng cổng kho LYHU thì đèn vẫn sáng trưng đón xe container vừa kịp cập bến nè cả nhà ơi! Bác tài chạy ròng rã suốt ngày đêm để hàng về kịp, anh em trong kho lại hào hứng xắn tay áo bốc dỡ từng kiện hàng. Khách sỉ hối dữ lắm vì cháy hàng suốt tuần nay. Mở thùng kiểm tra là ưng cái bụng liền: Date mới tinh vừa mới xuất xưởng, gói nào gói nấy căng phồng! Toàn bộ đã được xếp ngay ngắn vào kho, sáng mai các chủ quán ăn vặt và đối tác sỉ tha hồ lên đơn nha. Cần bảng giá sỉ date mới tinh cứ nhắn liền cho LYHU nha!`;
        } else {
            hookTitle = `🔥 SIÊU PHẨM ${userTopic.toUpperCase()} GIÁ SỈ TẬN XƯỞNG!`;
            hookVisual = "Cận cảnh xé gói bao bì giòn rụm, màu sắc óng ánh bắt mắt và rải đều trên đĩa";
            keyPowerWords = ["GIÒN RỤM", "GIÁ SỈ TẬN XƯỞNG", "DATE MỚI TOANH", "MẪU THỬ MIỄN PHÍ"];
            script = `500 anh em chủ quán ăn vặt và F&B ơi! Siêu phẩm mà mọi người hỏi thăm suốt thời gian qua chính thức cập bến tổng kho LYHU rồi nè. Nhiều người bảo món này kén khách, nhưng vì chất lượng đỉnh quá nên bọn mình bắt buộc phải mang về. Hàng date mới toanh, hương vị đậm đà thơm nức, khách ăn một lần là quay lại gọi thêm đĩa thứ hai liền. Các chủ quán cần mẫu thử tận nơi hoặc bảng giá sỉ không qua trung gian cứ để lại bình luận cho LYHU nha!`;
        }

        const directorGuide = {
            hookVisual,
            spokenHook: script.slice(0, 70) + "...",
            pacingSpeed: "2.5s / cảnh - Chuẩn Jump Cut TikTok",
            keyPowerWords,
            callToAction: "Các chủ quán cần bảng giá sỉ hoặc mẫu thử cứ nhắn liền cho LYHU nha!",
            shootingTips: [
                "Quay dọc chuẩn 9:16 bằng điện thoại thông thường, không cần mua máy ảnh chuyên nghiệp.",
                "Mỗi góc quay chỉ giữ từ 2 đến 3 giây, đổi góc liên tục để giữ chân người xem.",
                "Tập trung quay thật gần các chi tiết xé gói, bốc hàng, soi nhãn date để tạo niềm tin 100%."
            ],
            shots: [
                {
                    shotNumber: 1,
                    shotType: "Cận cảnh Macro (Hook 3s)",
                    cameraMovement: "Zoom in nhanh dứt khoát",
                    action: isNightWarehouse ? "Soi đèn flash vào biển số xe container hoặc cổng kho rực sáng" : "Xé nhanh miệng túi giòn rụm hoặc đổ sản phẩm vàng óng",
                    duration: 2.5,
                    dialogueSnippet: "Tầm này cả thành phố ngủ hết rồi...",
                    sfx: "Tiếng rộp rộp hoặc tiếng còi xe"
                },
                {
                    shotNumber: 2,
                    shotType: "Trung cảnh hành động",
                    cameraMovement: "Pan ngang theo chiều tay",
                    action: isNightWarehouse ? "Mở thùng xe tải lộ các kiện hàng xếp cao" : "Cận cảnh gắp hoặc nếm thử với biểu cảm ưng ý",
                    duration: 2.5,
                    dialogueSnippet: "Bác tài chạy ròng rã suốt ngày đêm...",
                    sfx: "Tiếng xé thùng hàng"
                },
                {
                    shotNumber: 3,
                    shotType: "Góc nhìn người xem (POV)",
                    cameraMovement: "Lia máy theo nhịp bước chân",
                    action: "Ngón tay chỉ vào nhãn Date in mới toanh trên bao bì",
                    duration: 2.5,
                    dialogueSnippet: "Mở thùng kiểm tra là ưng cái bụng liền: Date mới tinh!",
                    sfx: "Tiếng cười nói rôm rả"
                },
                {
                    shotNumber: 4,
                    shotType: "Toàn cảnh uy tín kho",
                    cameraMovement: "Lùi dần tạo chiều sâu",
                    action: "Quay các dãy kệ hàng và thùng sỉ xếp ngay ngắn",
                    duration: 2.5,
                    dialogueSnippet: "Sáng mai các chủ quán tha hồ lên đơn nha...",
                    sfx: "Tiếng dán băng keo đóng hàng"
                },
                {
                    shotNumber: 5,
                    shotType: "Cận cảnh kêu gọi (CTA)",
                    cameraMovement: "Cố định, ánh sáng rõ ràng",
                    action: "Cầm sản phẩm giơ lên màn hình mời chào thân thiện",
                    duration: 2.5,
                    dialogueSnippet: "Cần bảng giá sỉ cứ nhắn liền cho LYHU nha!",
                    sfx: "Tiếng chuông ting ting"
                }
            ]
        };

        const storyboard = directorGuide.shots.map(s => `Góc ${s.shotNumber} (${s.shotType}): ${s.action} - [${s.cameraMovement}]`);

        return NextResponse.json({
            success: true,
            hookTitle,
            script,
            pacing: 2.5,
            transition: "auto",
            textColor: "#FACC15",
            subtitleStyle: "tiktok_stroke",
            textAnimationEffect: "tiktok_pop",
            keyPowerWords,
            directorGuide,
            storyboard,
            styleSummary: "Đạo diễn AI đã thiết kế kịch bản & 5 góc quay thực chiến chuẩn Trà My 24Zone cho LYHU!"
        });

    } catch (e: any) {
        console.error("[Clone Style API] Error:", e);
        return NextResponse.json({ error: e.message || "Lỗi xử lý AI" }, { status: 500 });
    }
}
