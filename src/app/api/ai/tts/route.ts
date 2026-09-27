import { NextRequest, NextResponse } from "next/server";
import { normalizeVietnamesePhonetics } from "@/lib/ttsHelper";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Helper to split long text into natural sentence chunks (< 150 chars) for Google TTS
function splitTextIntoChunks(text: string, maxLen = 140): string[] {
    const clean = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
    if (!clean) return [];

    // Split by punctuation marks first
    const sentences = clean.split(/(?<=[.!?,;:\n])\s+/);
    const chunks: string[] = [];
    let current = "";

    for (const sentence of sentences) {
        if ((current + " " + sentence).trim().length <= maxLen) {
            current = (current + " " + sentence).trim();
        } else {
            if (current) chunks.push(current);
            // If the sentence itself is too long, split by words
            if (sentence.length > maxLen) {
                const words = sentence.split(" ");
                let wordChunk = "";
                for (const w of words) {
                    if ((wordChunk + " " + w).trim().length <= maxLen) {
                        wordChunk = (wordChunk + " " + w).trim();
                    } else {
                        if (wordChunk) chunks.push(wordChunk);
                        wordChunk = w;
                    }
                }
                if (wordChunk) current = wordChunk;
                else current = "";
            } else {
                current = sentence;
            }
        }
    }

    if (current) chunks.push(current);
    return chunks;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, speed = 1 } = body;

        if (!text || typeof text !== "string" || !text.trim()) {
            return NextResponse.json(
                { error: "Vui lòng nhập nội dung văn bản cần lồng tiếng." },
                { status: 400 }
            );
        }

        // Chuẩn hóa phiên âm từ ngữ (LYHU -> Ly Hu, NPP -> Nhà phân phối...)
        const normalizedText = normalizeVietnamesePhonetics(text);

        const chunks = splitTextIntoChunks(normalizedText);
        if (chunks.length === 0) {
            return NextResponse.json(
                { error: "Không tìm thấy nội dung hợp lệ." },
                { status: 400 }
            );
        }

        // Fetch audio chunks from Google TTS concurrently with order preserved
        const audioBuffers: Buffer[] = [];
        for (const chunk of chunks) {
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(chunk)}`;
            const res = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    "Referer": "https://translate.google.com/"
                }
            });

            if (!res.ok) {
                console.error("[TTS Google] Failed chunk:", chunk, res.status);
                continue;
            }

            const arrayBuf = await res.arrayBuffer();
            audioBuffers.push(Buffer.from(arrayBuf));
        }

        if (audioBuffers.length === 0) {
            return NextResponse.json(
                { error: "Không thể lấy dữ liệu âm thanh từ máy chủ giọng đọc." },
                { status: 502 }
            );
        }

        const combinedAudio = Buffer.concat(audioBuffers);

        return new NextResponse(combinedAudio, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": combinedAudio.length.toString(),
                "Content-Disposition": 'inline; filename="voiceover_lyhu.mp3"',
                "Cache-Control": "public, max-age=3600"
            }
        });
    } catch (err: any) {
        console.error("[TTS API Error]:", err);
        return NextResponse.json(
            { error: err.message || "Lỗi xử lý giọng đọc trên hệ thống." },
            { status: 500 }
        );
    }
}
