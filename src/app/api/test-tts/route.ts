import { NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata("vi-VN-NamMinhNeural", OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
        const { audioStream } = tts.toStream("Xin chào, kiểm tra kết nối Edge TTS", { rate: "+0%", pitch: "+0Hz" });
        const chunks: Buffer[] = [];
        const result = await new Promise<{ size: number; duration: number }>((resolve, reject) => {
            const start = Date.now();
            audioStream.on("data", (c: Buffer) => chunks.push(c));
            audioStream.on("end", () => resolve({ size: Buffer.concat(chunks).length, duration: Date.now() - start }));
            audioStream.on("error", (err: any) => reject(err));
            setTimeout(() => reject(new Error("Timeout after 10s")), 10000);
        });
        return NextResponse.json({ success: true, ...result });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message, stack: err.stack }, { status: 500 });
    }
}
