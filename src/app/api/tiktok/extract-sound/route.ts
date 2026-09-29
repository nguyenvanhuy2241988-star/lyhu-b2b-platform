import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url } = body;

        if (!url || typeof url !== "string" || !url.includes("tiktok.com")) {
            return NextResponse.json({ error: "Vui lòng nhập link video TikTok hợp lệ (chứa tiktok.com)" }, { status: 400 });
        }

        const res = await fetch(url.trim(), {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8"
            }
        });

        if (!res.ok) {
            return NextResponse.json({ error: `Không thể kết nối tới TikTok (Mã lỗi ${res.status})` }, { status: 502 });
        }

        const html = await res.text();
        const match = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);

        if (!match) {
            return NextResponse.json({ error: "Không tìm thấy dữ liệu âm thanh từ link TikTok này" }, { status: 404 });
        }

        const json = JSON.parse(match[1]);
        const item = json["__DEFAULT_SCOPE__"]?.["webapp.video-detail"]?.itemInfo?.itemStruct;

        if (!item || !item.music) {
            return NextResponse.json({ error: "Video này không có thông tin bài hát hoặc là video riêng tư" }, { status: 404 });
        }

        const music = item.music;
        const playUrl = music.playUrl || "";

        if (!playUrl) {
            return NextResponse.json({ error: "Không tìm thấy link phát âm thanh trực tiếp từ video này" }, { status: 404 });
        }

        const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(playUrl)}`;

        return NextResponse.json({
            success: true,
            sound: {
                id: music.id || `tiktok-${Date.now()}`,
                title: music.title || "Âm thanh TikTok",
                author: music.authorName || item.author?.nickname || "TikTok Creator",
                duration: music.duration || 30,
                cover: music.coverThumb || music.coverLarge || "",
                playUrl,
                proxyUrl
            }
        });
    } catch (err: any) {
        console.error("Extract TikTok sound error:", err);
        return NextResponse.json({ error: "Lỗi máy chủ khi trích xuất âm thanh: " + err.message }, { status: 500 });
    }
}
