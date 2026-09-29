import { NextRequest, NextResponse } from "next/server";
import { normalizeVietnamesePhonetics } from "@/lib/ttsHelper";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Helper: Run promise with timeout
function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(errorMsg)), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// --------------- Microsoft Edge Neural Voices (Chuẩn Azure Speech Studio) ---------------

interface VoiceConfig {
    voice: string;
    rate: string;
    pitch: string;
}

const VOICE_PRESETS: Record<string, VoiceConfig> = {
    // Nữ Gen Z - tươi vui, nhanh nhẹn, chuẩn TikTok viral
    "female-genz": {
        voice: "vi-VN-HoaiMyNeural",
        rate: "+12%",
        pitch: "+8Hz"
    },
    // Nữ dịu dàng - ngọt ngào, ấm áp, tâm sự kho hàng
    "female-sweet": {
        voice: "vi-VN-HoaiMyNeural",
        rate: "+2%",
        pitch: "+4Hz"
    },
    // Nữ chuyên nghiệp - tự tin, rành mạch, giới thiệu đối tác sỉ B2B
    "female-pro": {
        voice: "vi-VN-HoaiMyNeural",
        rate: "+6%",
        pitch: "+0Hz"
    },
    // Nam Gen Z - năng động, trẻ trung, tự nhiên, hóm hỉnh
    "male-genz": {
        voice: "vi-VN-NamMinhNeural",
        rate: "+8%",
        pitch: "+6Hz"
    },
    // Nam chuyên nghiệp - trầm ấm, uy tín, chuẩn phát thanh viên doanh nghiệp
    "male-pro": {
        voice: "vi-VN-NamMinhNeural",
        rate: "+2%",
        pitch: "-2Hz"
    },
    // Nữ mặc định
    "female": {
        voice: "vi-VN-HoaiMyNeural",
        rate: "+8%",
        pitch: "+5Hz"
    },
    // Nam mặc định
    "male": {
        voice: "vi-VN-NamMinhNeural",
        rate: "+6%",
        pitch: "+2Hz"
    }
};

async function synthesizeWithEdgeTTS(
    text: string,
    voiceName: string,
    rate = "+6%",
    pitch = "+0Hz"
): Promise<Buffer> {
    const edgePromise = new Promise<Buffer>(async (resolve, reject) => {
        try {
            console.log(`[EdgeTTS] Connecting WebSocket for voice: ${voiceName}, rate: ${rate}, pitch: ${pitch}`);
            const tts = new MsEdgeTTS();
            await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
            const result = tts.toStream(text, { rate, pitch });

            const chunks: Buffer[] = [];
            result.audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
            result.audioStream.on("end", () => {
                const finalBuf = Buffer.concat(chunks);
                if (finalBuf.length === 0) {
                    reject(new Error("MsEdgeTTS returned empty audio stream"));
                } else {
                    console.log(`[EdgeTTS] Success: ${finalBuf.length} bytes for ${voiceName}`);
                    resolve(finalBuf);
                }
            });
            result.audioStream.on("error", (err: any) => reject(err));
        } catch (err) {
            reject(err);
        }
    });

    // Cho phép thời gian chờ đủ dài (25s) để stream trọn vẹn văn bản dài mà không bị cắt nửa chừng
    return withTimeout(edgePromise, 25000, "Edge TTS timeout after 25s");
}

// --------------- ElevenLabs Voice Cloning Engine ---------------

async function synthesizeWithElevenLabs(text: string, voiceId: string, apiKey: string): Promise<Buffer> {
    console.log(`[ElevenLabs] Synthesizing voiceId ${voiceId}...`);
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            language_code: "vi",
            voice_settings: {
                stability: 0.65,
                similarity_boost: 0.80,
                style: 0.05,
                use_speaker_boost: true
            }
        }),
        signal: AbortSignal.timeout(18000)
    });

    if (!res.ok) throw new Error(`ElevenLabs error ${res.status}: ${await res.text()}`);
    return Buffer.from(await res.arrayBuffer());
}

// --------------- Google Translate Fast Fallback ---------------

function splitTextIntoChunks(text: string, maxLen = 140): string[] {
    const clean = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
    if (!clean) return [];

    const sentences = clean.split(/(?<=[.!?,;:\n])\s+/);
    const chunks: string[] = [];
    let current = "";

    for (const sentence of sentences) {
        if ((current + " " + sentence).trim().length <= maxLen) {
            current = (current + " " + sentence).trim();
        } else {
            if (current) chunks.push(current);
            current = sentence;
        }
    }
    if (current) chunks.push(current);
    return chunks;
}

async function synthesizeWithGoogleTranslate(text: string): Promise<Buffer> {
    const chunks = splitTextIntoChunks(text, 140);
    if (chunks.length === 0) throw new Error("No text chunks.");

    const chunkPromises = chunks.map(async (chunk) => {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(chunk)}`;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                Referer: "https://translate.google.com/"
            },
            signal: AbortSignal.timeout(5000)
        });

        if (!res.ok) throw new Error("Google chunk failed");
        return Buffer.from(await res.arrayBuffer());
    });

    const buffers = await Promise.all(chunkPromises);
    return Buffer.concat(buffers);
}

// --------------- Main Handler ---------------

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, voice, rate, pitch, style = "female-genz", voiceId, elevenApiKey } = body;

        if (!text || typeof text !== "string" || !text.trim()) {
            return NextResponse.json(
                { error: "Vui lòng nhập nội dung văn bản cần lồng tiếng." },
                { status: 400 }
            );
        }

        const normalizedText = normalizeVietnamesePhonetics(text);

        // Xác định chính xác style và giới tính người nói
        let styleKey = style || "female-genz";
        if (voice && (voice.includes("NamMinh") || voice.includes("male"))) {
            if (!styleKey.includes("male")) styleKey = "male-genz";
        }

        const preset = VOICE_PRESETS[styleKey] || VOICE_PRESETS["female-genz"];
        const isMale = styleKey.includes("male") || (voice && (voice.includes("NamMinh") || voice.includes("male")));
        const targetVoice = isMale ? "vi-VN-NamMinhNeural" : "vi-VN-HoaiMyNeural";
        const targetRate = rate || preset.rate;
        const targetPitch = pitch || preset.pitch;

        console.log(`[TTS] Request received: styleKey=${styleKey}, isMale=${isMale}, targetVoice=${targetVoice}`);

        let audioBuffer: Buffer | null = null;
        const apiKey = elevenApiKey || process.env.ELEVENLABS_API_KEY;

        // ƯU TIÊN 1: ElevenLabs nếu người dùng cấu hình giọng nhân bản
        if (voiceId && apiKey) {
            try {
                audioBuffer = await synthesizeWithElevenLabs(normalizedText, voiceId, apiKey);
            } catch (elevenErr: any) {
                console.warn("[TTS] ElevenLabs failed, falling back to Edge Neural TTS:", elevenErr.message);
            }
        }

        // ƯU TIÊN 2: Microsoft Edge Neural TTS (Chuẩn Azure Speech: Hoài My & Nam Minh - Tự nhiên, tách bạch Nam/Nữ rõ ràng)
        if (!audioBuffer) {
            try {
                audioBuffer = await synthesizeWithEdgeTTS(normalizedText, targetVoice, targetRate, targetPitch);
            } catch (edgeErr: any) {
                console.warn("[TTS] Edge TTS failed, falling back to Google Translate:", edgeErr.message);
                audioBuffer = await synthesizeWithGoogleTranslate(normalizedText);
            }
        }

        if (!audioBuffer || audioBuffer.length === 0) {
            throw new Error("Không thể tạo dữ liệu âm thanh.");
        }

        return new NextResponse(new Uint8Array(audioBuffer), {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": audioBuffer.length.toString(),
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
