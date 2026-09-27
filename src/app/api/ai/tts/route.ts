import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            text,
            voice = "vi-VN-HoaiMyNeural",
            rate = "+0%",
            pitch = "+0Hz"
        } = body;

        if (!text || typeof text !== "string" || !text.trim()) {
            return NextResponse.json(
                { error: "Vui lòng nhập nội dung văn bản cần lồng tiếng." },
                { status: 400 }
            );
        }

        const cleanText = text.trim();
        if (cleanText.length > 5000) {
            return NextResponse.json(
                { error: "Văn bản quá dài (tối đa 5.000 ký tự mỗi lần tạo)." },
                { status: 400 }
            );
        }

        const tts = new MsEdgeTTS();
        await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

        const { audioStream } = tts.toStream(cleanText, {
            rate: rate,
            pitch: pitch
        });

        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
            audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
            audioStream.on("end", () => resolve());
            audioStream.on("error", (err: any) => reject(err));
        });

        const audioBuffer = Buffer.concat(chunks);

        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": audioBuffer.length.toString(),
                "Content-Disposition": 'inline; filename="voiceover_lyhu.mp3"',
                "Cache-Control": "no-store, no-cache, must-revalidate"
            }
        });
    } catch (err: any) {
        console.error("[TTS API Error]:", err);
        return NextResponse.json(
            { error: err.message || "Lỗi khi tạo giọng đọc AI. Vui lòng thử lại." },
            { status: 500 }
        );
    }
}
