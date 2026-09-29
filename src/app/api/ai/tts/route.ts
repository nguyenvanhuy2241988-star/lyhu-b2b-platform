import { NextRequest, NextResponse } from "next/server";
import { normalizeVietnamesePhonetics } from "@/lib/ttsHelper";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// --------------- Microsoft Edge Neural TTS Engine (100% Stable & Consistent) ---------------

interface EdgeVoiceConfig {
    voice: string;
    rate: string;
    pitch: string;
}

const VOICE_PRESETS: Record<string, EdgeVoiceConfig> = {
    // Nữ Gen Z - tươi vui, nhanh nhẹn, chuẩn TikTok viral
    "female-genz": {
        voice: "vi-VN-HoaiMyNeural",
        rate: "+12%",
        pitch: "+15Hz"
    },
    // Nữ dịu dàng - ngọt ngào, ấm áp, tâm sự kho hàng
    "female-sweet": {
        voice: "vi-VN-HoaiMyNeural",
        rate: "+2%",
        pitch: "+6Hz"
    },
    // Nữ chuyên nghiệp - tự tin, rành mạch, giới thiệu sản phẩm & quảng cáo
    "female-pro": {
        voice: "vi-VN-HoaiMyNeural",
        rate: "+6%",
        pitch: "+0Hz"
    },
    // Nam Gen Z - năng động, trẻ trung, tự nhiên
    "male-genz": {
        voice: "vi-VN-NamMinhNeural",
        rate: "+10%",
        pitch: "+10Hz"
    },
    // Nam chuyên nghiệp - trầm ấm, uy tín, chuẩn phát thanh viên B2B
    "male-pro": {
        voice: "vi-VN-NamMinhNeural",
        rate: "+2%",
        pitch: "-4Hz"
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
        pitch: "+0Hz"
    }
};

async function synthesizeWithEdgeTTS(
    text: string,
    voiceName = "vi-VN-HoaiMyNeural",
    rate = "+0%",
    pitch = "+0Hz"
): Promise<Buffer> {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const result = tts.toStream(text, {
        rate,
        pitch
    });

    const chunks: Buffer[] = [];
    return new Promise<Buffer>((resolve, reject) => {
        result.audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
        result.audioStream.on("end", () => {
            const finalBuf = Buffer.concat(chunks);
            if (finalBuf.length === 0) {
                reject(new Error("MsEdgeTTS returned empty audio stream"));
            } else {
                resolve(finalBuf);
            }
        });
        result.audioStream.on("error", (err: any) => reject(err));
    });
}

// --------------- ElevenLabs Voice Cloning Engine ---------------

async function synthesizeWithElevenLabs(
    text: string,
    voiceId: string,
    apiKey: string
): Promise<Buffer> {
    const models = ["eleven_multilingual_v2", "eleven_turbo_v2_5"];

    for (const modelId of models) {
        try {
            console.log(`[ElevenLabs] Calling TTS with model: ${modelId}, voiceId: ${voiceId}`);
            const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: "POST",
                headers: {
                    "xi-api-key": apiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text,
                    model_id: modelId,
                    language_code: "vi",
                    voice_settings: {
                        stability: 0.65,
                        similarity_boost: 0.80,
                        style: 0.05,
                        use_speaker_boost: true
                    }
                })
            });

            if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                console.log(`[ElevenLabs] Success with model ${modelId}:`, arrayBuffer.byteLength, "bytes");
                return Buffer.from(arrayBuffer);
            }

            const errText = await res.text();
            console.warn(`[ElevenLabs] Model ${modelId} failed (${res.status}):`, errText);
        } catch (e: any) {
            console.warn(`[ElevenLabs] Error with model ${modelId}:`, e.message);
        }
    }

    throw new Error("ElevenLabs failed with all models");
}

// --------------- Google Translate Fallback (Last-Resort) ---------------

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

async function synthesizeWithGoogleTranslate(text: string): Promise<Buffer> {
    const chunks = splitTextIntoChunks(text);
    if (chunks.length === 0) throw new Error("No text chunks.");

    const audioBuffers: Buffer[] = [];
    for (const chunk of chunks) {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(chunk)}`;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                Referer: "https://translate.google.com/"
            }
        });

        if (!res.ok) continue;
        audioBuffers.push(Buffer.from(await res.arrayBuffer()));
    }

    if (audioBuffers.length === 0) throw new Error("All Google Translate chunks failed.");
    return Buffer.concat(audioBuffers);
}

// --------------- Main Handler ---------------

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, voice = "female", rate, pitch, style = "female", voiceId, elevenApiKey } = body;

        if (!text || typeof text !== "string" || !text.trim()) {
            return NextResponse.json(
                { error: "Vui lòng nhập nội dung văn bản cần lồng tiếng." },
                { status: 400 }
            );
        }

        // Normalize Vietnamese phonetics (LYHU -> Ly Hu, CVT -> C V T, date -> đết, container -> con ten nơ, v.v.)
        const normalizedText = normalizeVietnamesePhonetics(text);

        // Determine preset configuration
        let styleKey = style || voice || "female-genz";
        if (styleKey.includes("HoaiMy") || (styleKey.includes("female") && !VOICE_PRESETS[styleKey])) {
            styleKey = "female-genz";
        }
        if (styleKey.includes("NamMinh") || (styleKey.includes("male") && !VOICE_PRESETS[styleKey])) {
            styleKey = "male-genz";
        }

        const preset = VOICE_PRESETS[styleKey] || VOICE_PRESETS["female-genz"];
        const targetVoice = voice && (voice.includes("NamMinh") || voice.includes("HoaiMy")) ? voice : preset.voice;
        const targetRate = rate || preset.rate;
        const targetPitch = pitch || preset.pitch;

        let audioBuffer: Buffer;
        const apiKey = elevenApiKey || process.env.ELEVENLABS_API_KEY;

        // Ưu tiên 1: ElevenLabs nếu người dùng cấu hình giọng nhân bản riêng
        if (voiceId && apiKey) {
            try {
                console.log("[TTS] Trying ElevenLabs Voice Cloning for voiceId:", voiceId);
                audioBuffer = await synthesizeWithElevenLabs(normalizedText, voiceId, apiKey);
                console.log("[TTS] ElevenLabs SUCCESS:", audioBuffer.length, "bytes");
            } catch (elevenErr: any) {
                console.warn("[TTS] ElevenLabs failed, falling back to Microsoft Edge Neural TTS:", elevenErr.message);
                audioBuffer = await synthesizeWithEdgeTTS(normalizedText, targetVoice, targetRate, targetPitch);
            }
        } else {
            // Ưu tiên 2: Microsoft Edge Neural TTS (Chuẩn phòng thu, ổn định 100%, không bị đổi giọng thất thường)
            try {
                console.log(`[TTS] Synthesizing with Edge Neural TTS: voice=${targetVoice}, rate=${targetRate}, pitch=${targetPitch}`);
                audioBuffer = await synthesizeWithEdgeTTS(normalizedText, targetVoice, targetRate, targetPitch);
                console.log("[TTS] Edge Neural TTS SUCCESS:", audioBuffer.length, "bytes");
            } catch (edgeErr: any) {
                console.warn("[TTS] Edge TTS failed, falling back to Google Translate:", edgeErr.message);
                audioBuffer = await synthesizeWithGoogleTranslate(normalizedText);
                console.log("[TTS] Google Translate fallback SUCCESS:", audioBuffer.length, "bytes");
            }
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
