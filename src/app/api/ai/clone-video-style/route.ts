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

        if (!userTopic || typeof userTopic !== "string" || !userTopic.trim()) {
            return NextResponse.json({ error: "Vui lòng nhập chủ đề video của bạn" }, { status: 400 });
        }

        const topic = userTopic.trim();

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

        // 1. Call Gemini API if Key is available
        if (GEMINI_API_KEY) {
            const prompt = `Bạn là Đạo diễn nội dung xuất sắc kiêm chuyên gia sản xuất Video ngắn triệu view trên TikTok & Reels cho công ty LYHU (sản xuất, nhập khẩu và phân phối bánh kẹo, đồ ăn vặt & gia vị các loại).
CÁC THƯƠNG HIỆU ĐỘC QUYỀN CỦA LYHU:
- BOYO: Bột phô mai dành cho nhà hàng, gia đình, quán gà rán, khoai tây lắc.
- CVT: Khoai môn sấy tẩm vị (trứng cua, nấm truffle...) nhập khẩu độc quyền từ Trung Quốc.
- UHi: Kẹo các loại nhập khẩu độc quyền từ Hàn Quốc.
- Abi Snack: Bánh tráng và đồ ăn vặt độc quyền miền Bắc.

THÔNG TIN VIDEO MẪU THAM CHIẾU:
${refInfo || "Phong cách mộc mạc, gần gũi, xưng 'bọn mình', mở đầu bằng câu chuyện đời thường, nhịp cắt 2.5s dồn dập, tự hào về chất lượng phục vụ, không quảng cáo sáo rỗng."}

CHỦ ĐỀ SẢN PHẨM CẦN VIẾT KỊCH BẢN:
"${topic}"

YÊU CẦU ĐẦU RA BẮT BUỘC (JSON chuẩn, không markdown):
{
  "hookTitle": "Tiêu đề giật tít 3.5s đầu in hoa có icon (phù hợp với chủ đề ${topic})",
  "script": "Nội dung lời thoại hoàn chỉnh (tầm 110 - 130 từ, đọc khoảng 35 - 45 giây). Văn phong mộc mạc, xưng bọn mình/LYHU, nói chuyện chân thành như người nhà, cuốn hút, đúng sản phẩm được yêu cầu.",
  "pacing": 2.5,
  "transition": "auto",
  "textColor": "#FACC15",
  "subtitleStyle": "tiktok_stroke",
  "textAnimationEffect": "tiktok_pop",
  "keyPowerWords": ["TỪ KHÓA 1", "TỪ KHÓA 2", "TỪ KHÓA 3", "TỪ KHÓA 4"],
  "directorGuide": {
    "hookVisual": "Hành động thị giác 3s đầu bẻ khóa sự chú ý",
    "spokenHook": "Câu nói mở đầu giật tít",
    "pacingSpeed": "2.5s / cảnh - Jump cut dồn dập",
    "keyPowerWords": ["DATE MỚI TINH", "GIÁ SỈ TẬN XƯỞNG", "GIÒN RỤM"],
    "callToAction": "Câu chốt kêu gọi hành động cuối clip",
    "shootingTips": [
      "Quay dọc 9:16 bằng điện thoại, cầm chắc tay hoặc lia nhẹ theo chiều ngang.",
      "Ưu tiên góc quay cận cảnh chi tiết bao bì hoặc cận cảnh thưởng thức.",
      "Tận dụng ánh sáng tự nhiên để tạo độ chân thật."
    ],
    "shots": [
      {
        "shotNumber": 1,
        "shotType": "Cận cảnh Hook",
        "cameraMovement": "Zoom in dứt khoát",
        "action": "Mở đầu giật mắt với hành động thực tế",
        "duration": 2.5,
        "dialogueSnippet": "Câu thoại đoạn 1",
        "sfx": "Tiếng động giòn rụm hoặc chuông ting"
      },
      {
        "shotNumber": 2,
        "shotType": "Trung cảnh",
        "cameraMovement": "Pan ngang mượt",
        "action": "Thao tác trên sản phẩm",
        "duration": 2.5,
        "dialogueSnippet": "Câu thoại đoạn 2",
        "sfx": "Tiếng mở gói hoặc tiếng kho"
      },
      {
        "shotNumber": 3,
        "shotType": "Cực cận Macro",
        "cameraMovement": "Cố định",
        "action": "Soi rõ chi tiết chất lượng hoặc date",
        "duration": 2.5,
        "dialogueSnippet": "Câu thoại đoạn 3",
        "sfx": "Tiếng lạo xạo"
      },
      {
        "shotNumber": 4,
        "shotType": "Toàn cảnh",
        "cameraMovement": "Góc thấp",
        "action": "Đóng gói hoặc giao hàng",
        "duration": 2.5,
        "dialogueSnippet": "Câu thoại đoạn 4",
        "sfx": "Tiếng dán băng dính"
      },
      {
        "shotNumber": 5,
        "shotType": "Cận cảnh CTA",
        "cameraMovement": "Chĩa thẳng sản phẩm",
        "action": "Giơ sản phẩm mời chào thân thiện",
        "duration": 2.5,
        "dialogueSnippet": "Câu thoại kết",
        "sfx": "Tiếng ting ting chốt đơn"
      }
    ]
  }
}`;

            try {
                const aiRes = await fetch(GEMINI_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ role: "user", parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.75,
                            maxOutputTokens: 2500,
                            responseMimeType: "application/json"
                        }
                    }),
                    signal: AbortSignal.timeout(30000)
                });

                if (aiRes.ok) {
                    const aiData = await aiRes.json();
                    const rawText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (rawText) {
                        const parsed = JSON.parse(rawText);
                        const storyboard = parsed.directorGuide?.shots?.map(
                            (s: any) => `Góc ${s.shotNumber} (${s.shotType}): ${s.action} - [${s.cameraMovement}]`
                        ) || [];
                        return NextResponse.json({
                            success: true,
                            ...parsed,
                            storyboard,
                            styleSummary: `Đạo diễn AI đã thiết kế kịch bản & 5 góc quay thực chiến cho chủ đề "${topic}"!`
                        });
                    }
                }
            } catch (geminiErr) {
                console.warn("[Clone Style] Gemini call failed, using intelligent product template:", geminiErr);
            }
        }

        // 2. Intelligent Product-Specific Template Generator (LYHU Portfolio)
        const isBoyo = /boyo|phô mai|pho mai|bột phô mai|bắp lắc|khoai tây lắc/i.test(topic);
        const isCVT = /cvt|khoai môn|khoai mon|trứng cua|trung cua|tẩm vị|tam vi/i.test(topic);
        const isUHi = /uhi|kẹo|keo|kẹo dẻo|keo deo|hàn quốc|han quoc/i.test(topic);
        const isAbi = /abi|bánh tráng|banh trang|ăn vặt|an vat|da cá/i.test(topic);
        const isNightWarehouse = /đêm|khuya|kho đêm|kho dem|container|bốc dỡ/i.test(topic);

        let hookTitle = `🔥 ${topic.toUpperCase()} GIÁ SỈ TẬN XƯỞNG LYHU!`;
        let script = "";
        let hookVisual = "";
        let keyPowerWords: string[] = [];
        let textColor = "#FACC15";

        if (isBoyo) {
            hookTitle = `🧀 BỘT PHÔ MAI BOYO: GIÁ SỈ TẬN XƯỞNG CHO QUÁN ĂN & GIA ĐÌNH!`;
            hookVisual = "Rắc bột phô mai BOYO vàng cam óng ả phủ đều lên khay khoai tây lắc nóng hổi khói nghi ngút";
            keyPowerWords = ["BOYO CHÍNH HÃNG", "THƠM BÉO ĐẬM ĐÀ", "SỈ TỪ 1KG", "TIẾT KIỆM CHI PHÍ"];
            script = `500 anh em chủ quán gà rán, khoai tây lắc và các quán F&B ơi! Lô bột phô mai BOYO chính hãng vừa cập bến tổng kho LYHU với giá sỉ tận xưởng cực kỳ hấp dẫn. Hạt bột mịn màng, thơm nức mũi, vị mặn ngọt béo ngậy chuẩn công thức độc quyền cho quán ăn và gia đình. Lấy bao 1kg tiết kiệm chi phí tối đa, bao đổi trả nếu không chuẩn vị. Cần bảng giá sỉ và mẫu thử miễn phí cứ để lại bình luận cho LYHU nha!`;
            textColor = "#FACC15";
        } else if (isCVT) {
            hookTitle = `🥔 KHOAI MÔN SẤY TẨM VỊ CVT: ĐỘC QUYỀN TRUNG QUỐC SIÊU CUỐN!`;
            hookVisual = "Bẻ đôi thanh khoai môn sấy giòn rụm trước ống kính, lộ rõ lớp trứng cua và gia vị phủ kín";
            keyPowerWords = ["CVT ĐỘC QUYỀN", "SẤY THĂNG HOA", "GIÒN RỤM", "LÃI GẤP ĐÔI"];
            script = `Nhiều người bảo snack khoai môn trên thị trường thiếu gì, sao LYHU lại nhập khẩu độc quyền thanh khoai môn tẩm vị CVT này từ Trung Quốc? Nói thật là vì vị nó quá cuốn! Công nghệ sấy thăng hoa giòn rụm, tẩm vị trứng cua béo ngậy mằn mặn, ăn là dính. Kênh quán ăn, trà sữa hay phòng hát karaoke đưa món này lên menu là khách gọi lai rai suốt buổi. Chủ quán muốn lấy thử thùng sỉ trải nghiệm nhắn liền cho LYHU nha!`;
            textColor = "#22D3EE";
        } else if (isUHi) {
            hookTitle = `🍬 KẸO DẺO UHi HÀN QUỐC: PHÂN PHỐI ĐỘC QUYỀN DATE MỚI TINH!`;
            hookVisual = "Bóc túi kẹo dẻo UHi đầy màu sắc thơm lừng, kéo dẻo mềm mọng nước trước camera";
            keyPowerWords = ["UHi HÀN QUỐC", "ĐỘC QUYỀN CHÍNH NGẠCH", "DATE MỚI TINH", "CHIẾT KHẤU CAO"];
            script = `Các nhà phân phối tỉnh, chuỗi siêu thị và mini mart đang tìm dòng bánh kẹo nhập khẩu cao cấp thì xem ngay lô kẹo UHi Hàn Quốc này nha! LYHU nhập khẩu độc quyền chính ngạch, đầy đủ giấy tờ công bố và hóa đơn đỏ. Viên kẹo dẻo mềm, thơm ngát vị trái cây tự nhiên, bao bì bắt mắt các bạn trẻ và phụ huynh cực kỳ thích. Date mới tinh vừa về kho, chính sách chiết khấu đại lý tốt nhất. Nhắn LYHU để nhận ngay bảng giá sỉ sập sàn nhé!`;
            textColor = "#FB7185";
        } else if (isAbi) {
            hookTitle = `🍘 BÁNH TRÁNG ABI SNACK ĐỘC QUYỀN MIỀN BẮC: LÃI CỰC ĐỈNH!`;
            hookVisual = "Cận cảnh xé bao bánh tráng Abi Snack bơ tỏi sa tế thơm lừng, sốt óng ánh sánh mịn";
            keyPowerWords = ["ABI SNACK", "ĐỘC QUYỀN MIỀN BẮC", "SỈ TỪ 1 THÙNG", "BAO ĐỔI TRẢ"];
            script = `Các tiệm tạp hóa, căng tin trường học và quán ăn vặt miền Bắc ơi! LYHU hiện là nhà phân phối độc quyền thương hiệu Abi Snack tại miền Bắc. Nào là bánh tráng bơ sa tế, khô gà cay, rong biển cháy tỏi... gia vị đậm đà độc quyền ăn là ghiền. Hàng về liên tục date mới tinh xuất xưởng trong tuần, hỗ trợ sỉ từ 1 thùng giao tận quán. Cần mẫu ăn thử và bảng giá đại lý cứ nhắn liền cho LYHU nha!`;
            textColor = "#F43F5E";
        } else if (isNightWarehouse) {
            hookTitle = `🌙 11H ĐÊM KHO SỈ LYHU VẪN ĐÓNG HÀNG CHO KHÁCH SỈ!`;
            hookVisual = "Xe container lùi vào cổng kho trong đêm, công nhân bật đèn pha soi rọi kiểm đếm từng kiện hàng";
            keyPowerWords = ["DATE MỚI TINH", "11H ĐÊM", "GIÁ SỈ TẬN KHO", "VỪA CẬP BẾN"];
            script = `Nhiều người bảo giờ này chỉ có đi ngủ, nhưng ở tổng kho sỉ LYHU thì bọn mình vẫn đang kiểm từng kiện hàng để sáng mai kịp giao cho các nhà phân phối tỉnh và chuỗi siêu thị. Nào là thanh khoai môn sấy CVT, kẹo UHi Hàn Quốc, bánh tráng Abi với bột phô mai Boyo. Khách đặt cả trăm thùng thì dù khuya mấy bọn mình cũng đóng gói cẩn thận. Cần mẫu thử hay bảng giá sỉ cứ nhắn bọn mình nha!`;
            textColor = "#FACC15";
        } else {
            hookTitle = `🔥 TỔNG KHO LYHU: ${topic.toUpperCase()} GIÁ SỈ TẬN GỐC!`;
            hookVisual = `Cận cảnh mở thùng hàng ${topic}, soi rõ tem mác và nhãn date mới tinh vừa xuất xưởng`;
            keyPowerWords = ["DATE MỚI TOANH", "GIÁ SỈ TẬN XƯỞNG", "GIAO NHANH", "MẪU THỬ MIỄN PHÍ"];
            script = `500 anh em đối tác và các chủ quán ơi! Lô hàng ${topic} chất lượng cao chính thức có mặt tại tổng kho LYHU rồi nè. Hàng nhập khẩu chính ngạch, date mới tinh, bao đổi trả nếu không chuẩn chất lượng. Với chính sách chiết khấu tận xưởng không qua trung gian, các nhà phân phối và đại lý tha hồ yên tâm lên đơn. Nhắn liền cho LYHU để nhận bảng giá sỉ và gửi mẫu trải nghiệm tận nơi nhé!`;
            textColor = "#FACC15";
        }

        const directorGuide = {
            hookVisual,
            spokenHook: script.slice(0, 65) + "...",
            pacingSpeed: "2.5s / cảnh - Chuẩn Jump Cut TikTok",
            keyPowerWords,
            callToAction: "Các chủ quán cần bảng giá sỉ hoặc mẫu thử cứ nhắn liền cho LYHU nha!",
            shootingTips: [
                "Quay dọc chuẩn 9:16 bằng điện thoại thông thường, lau sạch mắt kính camera.",
                "Mỗi góc quay chỉ giữ từ 2 đến 3 giây, đổi góc liên tục để giữ chân người xem.",
                "Tập trung quay thật gần các chi tiết xé gói, bốc hàng, soi nhãn date để tạo niềm tin 100%."
            ],
            shots: [
                {
                    shotNumber: 1,
                    shotType: "Cận cảnh Macro (Hook 3s)",
                    cameraMovement: "Zoom in nhanh dứt khoát",
                    action: hookVisual,
                    duration: 2.5,
                    dialogueSnippet: script.slice(0, 45) + "...",
                    sfx: "Tiếng xé bọc / giòn rụm hoặc tiếng chuông ting"
                },
                {
                    shotNumber: 2,
                    shotType: "Trung cảnh hành động",
                    cameraMovement: "Pan ngang theo chiều tay",
                    action: "Mở thùng hàng lộ các kiện sản phẩm xếp cao ngay ngắn",
                    duration: 2.5,
                    dialogueSnippet: script.slice(45, 100) + "...",
                    sfx: "Tiếng mở thùng hàng"
                },
                {
                    shotNumber: 3,
                    shotType: "Góc nhìn người xem (POV)",
                    cameraMovement: "Lia máy theo nhịp bước chân",
                    action: "Ngón tay chỉ vào nhãn Date in mới toanh trên bao bì sản phẩm",
                    duration: 2.5,
                    dialogueSnippet: "Hàng date mới toanh, chất lượng chuẩn chỉnh...",
                    sfx: "Tiếng sột soạt kiểm hàng"
                },
                {
                    shotNumber: 4,
                    shotType: "Toàn cảnh uy tín kho",
                    cameraMovement: "Góc thấp hất lên",
                    action: "Quay các dãy kệ hàng và thùng sỉ xếp ngay ngắn tại kho LYHU",
                    duration: 2.5,
                    dialogueSnippet: "Sẵn kho số lượng lớn, giao ngay trong ngày...",
                    sfx: "Tiếng dán băng keo đóng hàng"
                },
                {
                    shotNumber: 5,
                    shotType: "Cận cảnh kêu gọi (CTA)",
                    cameraMovement: "Chĩa thẳng sản phẩm",
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
            textColor,
            subtitleStyle: "tiktok_stroke",
            textAnimationEffect: "tiktok_pop",
            keyPowerWords,
            directorGuide,
            storyboard,
            styleSummary: `Đạo diễn AI đã thiết kế kịch bản & 5 góc quay thực chiến chuẩn cho chủ đề "${topic}"!`
        });

    } catch (e: any) {
        console.error("[Clone Style API] Error:", e);
        return NextResponse.json({ error: e.message || "Lỗi xử lý AI" }, { status: 500 });
    }
}
