import { NextRequest, NextResponse } from "next/server";
import { prepareTextForTTS } from "@/lib/ttsHelper";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ── IN-MEMORY PERSISTENT TTS CACHE (0đ Vercel, 0ms latency for repeated requests) ──
const globalTtsCache = new Map<string, { buffer: Buffer; mimeType: string; engineUsed: string; timestamp: number }>();

// ── EDGE NEURAL TTS CONFIGURATIONS (Hoài My & Nam Minh - Chuẩn Studio 100%) ──
interface VoicePreset {
    shortName: string;
    rate: string;
    pitch: string;
    description: string;
}

const VOICE_PRESETS: Record<string, VoicePreset> = {
    "female-genz": {
        shortName: "vi-VN-HoaiMyNeural",
        rate: "+12%",
        pitch: "+5Hz",
        description: "Nữ Gen Z - Trẻ trung, bắt trend, cuốn hút"
    },
    "female-sweet": {
        shortName: "vi-VN-HoaiMyNeural",
        rate: "+2%",
        pitch: "+0Hz",
        description: "Nữ dịu dàng - Ấm áp, tâm sự, truyền cảm"
    },
    "female-pro": {
        shortName: "vi-VN-HoaiMyNeural",
        rate: "+6%",
        pitch: "-2Hz",
        description: "Nữ chuyên nghiệp - Đĩnh đạc, rõ ràng, giới thiệu thương hiệu"
    },
    "male-genz": {
        shortName: "vi-VN-NamMinhNeural",
        rate: "+10%",
        pitch: "+4Hz",
        description: "Nam Gen Z - Hóm hỉnh, năng động, dứt khoát"
    },
    "male-pro": {
        shortName: "vi-VN-NamMinhNeural",
        rate: "+4%",
        pitch: "-4Hz",
        description: "Nam chuyên nghiệp - Trầm ấm, uy tín, phát thanh viên"
    },
    // Fallback aliases
    "female": {
        shortName: "vi-VN-HoaiMyNeural",
        rate: "+8%",
        pitch: "+2Hz",
        description: "Nữ tiêu chuẩn"
    },
    "male": {
        shortName: "vi-VN-NamMinhNeural",
        rate: "+6%",
        pitch: "-2Hz",
        description: "Nam tiêu chuẩn"
    }
};

/**
 * Tạo giọng đọc AI Studio bằng Microsoft Edge Neural TTS
 */
async function synthesizeWithEdgeTTS(
    text: string,
    styleKey: string,
    customRateMultiplier = 1.0
): Promise<{ buffer: Buffer; mimeType: string }> {
    const preset = VOICE_PRESETS[styleKey] || (styleKey.includes("male") ? VOICE_PRESETS["male-genz"] : VOICE_PRESETS["female-genz"]);
    
    // Điều chỉnh rate nếu người dùng chọn tốc độ tùy chỉnh
    let computedRate = preset.rate;
    if (customRateMultiplier !== 1.0) {
        const basePercent = parseInt(preset.rate.replace(/[%+]/g, "")) || 0;
        const adjustedPercent = Math.round(basePercent + (customRateMultiplier - 1.0) * 100);
        computedRate = (adjustedPercent >= 0 ? `+${adjustedPercent}%` : `${adjustedPercent}%`);
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(preset.shortName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    
    const { audioStream } = tts.toStream(text, {
        rate: computedRate,
        pitch: preset.pitch
    });

    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const timer = setTimeout(() => {
            reject(new Error("Quá thời gian kết nối máy chủ giọng đọc Edge Neural TTS (35s)."));
        }, 35000);

        audioStream.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
        });

        audioStream.on("end", () => {
            clearTimeout(timer);
            const buffer = Buffer.concat(chunks);
            if (buffer.length < 500) {
                return reject(new Error("Dữ liệu âm thanh trả về không đầy đủ."));
            }
            resolve({
                buffer,
                mimeType: "audio/mpeg"
            });
        });

        audioStream.on("error", (err: any) => {
            clearTimeout(timer);
            reject(err);
        });
    });
}

/**
 * Tạo giọng đọc qua ElevenLabs (nếu có API Key hoặc Voice Clone ID)
 */
async function synthesizeWithElevenLabs(text: string, voiceId: string, apiKey: string): Promise<Buffer> {
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
        signal: AbortSignal.timeout(20000)
    });

    if (!res.ok) {
        throw new Error(`ElevenLabs error (${res.status}): ${await res.text()}`);
    }
    return Buffer.from(await res.arrayBuffer());
}

/**
 * Chia văn bản thành các câu tự nhiên để xử lý âm thanh tốc độ cao
 */
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

/**
 * Động cơ HTTP trực tiếp siêu tốc (< 600ms) - bảo vệ tuyệt đối chống timeout trên Vercel Serverless
 */
async function synthesizeWithGoogleTTS(text: string): Promise<Buffer> {
    const chunks = splitTextIntoChunks(text, 140);
    if (chunks.length === 0) throw new Error("Văn bản rỗng.");

    const chunkPromises = chunks.map(async (chunk) => {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(chunk)}`;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                Referer: "https://translate.google.com/"
            },
            signal: AbortSignal.timeout(6000)
        });

        if (!res.ok) throw new Error("Lỗi tải phân đoạn âm thanh");
        return Buffer.from(await res.arrayBuffer());
    });

    const buffers = await Promise.all(chunkPromises);
    return Buffer.concat(buffers);
}

/**
 * Tạo giọng đọc qua Google Gemini AI Expressive Neural Audio (Kore, Puck, Aoede, Fenrir, Leda)
 */
async function synthesizeWithGeminiTTS(
    text: string,
    styleKey: string,
    providedApiKey?: string
): Promise<{ buffer: Buffer; mimeType: string; modelUsed: string }> {
    const apiKey = providedApiKey || GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("Chưa cấu hình GEMINI_API_KEY. Vui lòng cấu hình GEMINI_API_KEY trong .env.local để sử dụng giọng đọc AI tiên tiến của Google.");
    }

    const voiceMapping: Record<string, string> = {
        "female-genz": "Kore",
        "female-sweet": "Aoede",
        "female-pro": "Leda",
        "male-genz": "Puck",
        "male-pro": "Fenrir"
    };
    const voiceName = voiceMapping[styleKey] || (styleKey.includes("male") ? "Puck" : "Kore");

    // Clean script text to be spoken - NEVER add prompt instructions inside text, as Gemini TTS will speak them out loud!
    const cleanScript = text.trim();

    try {
        console.log(`[Gemini TTS] Trying Gemini Audio (voice: ${voiceName}, 3.5s fast-check)...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const body = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: cleanScript }]
                }
            ],
            generationConfig: {
                temperature: 0.0,
                seed: 4242,
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName
                        }
                    }
                }
            }
        };

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(3500)
        });

        if (res.ok) {
            const json = await res.json();
            const part = json.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData?.data) {
                return {
                    buffer: Buffer.from(part.inlineData.data, "base64"),
                    mimeType: part.inlineData.mimeType || "audio/wav",
                    modelUsed: "gemini-2.0-flash"
                };
            }
        }
    } catch (_) {}

    throw new Error("Gemini Audio không khả dụng, chuyển sang Microsoft Studio Neural.");
}

// ── MAIN API HANDLER ──
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            text,
            voice,
            style = "female-genz",
            engine = "gemini",
            rateMultiplier = 1.0,
            voiceId,
            elevenApiKey,
            geminiApiKey
        } = body;

        if (!text || typeof text !== "string" || !text.trim()) {
            return NextResponse.json(
                { error: "Vui lòng nhập nội dung văn bản cần lồng tiếng." },
                { status: 400 }
            );
        }

        // Chuẩn hóa phát âm thương hiệu LYHU (BOYO, CVT, UHi, Abi Snack...)
        const normalizedText = prepareTextForTTS(text);

        // Xác định style key
        let styleKey = style || "female-genz";
        if (voice && (voice.includes("Puck") || voice.includes("Fenrir") || voice.includes("NamMinh") || voice.includes("male"))) {
            if (!styleKey.includes("male")) styleKey = "male-genz";
        }

        console.log(`[TTS API] Request: engine=${engine}, styleKey=${styleKey}, textLength=${normalizedText.length}`);

        // ── STEP 1: CHECK GLOBAL IN-MEMORY PERSISTENT AUDIO CACHE (0ms, 0đ) ──
        const speedVal = (Number(rateMultiplier) || 1.0).toFixed(2);
        const cacheKey = crypto
            .createHash("md5")
            .update(`${engine || "gemini"}_${styleKey}_${speedVal}_${normalizedText}`)
            .digest("hex");

        if (globalTtsCache.has(cacheKey)) {
            const cached = globalTtsCache.get(cacheKey)!;
            console.log(`[TTS API] Cache HIT (0ms latency, 0đ cost): ${cacheKey} (${cached.engineUsed})`);
            return new NextResponse(new Uint8Array(cached.buffer), {
                status: 200,
                headers: {
                    "Content-Type": cached.mimeType,
                    "Content-Length": cached.buffer.length.toString(),
                    "Content-Disposition": `inline; filename="voiceover_${styleKey}.${cached.mimeType.includes("wav") ? "wav" : "mp3"}"`,
                    "Cache-Control": "public, max-age=86400",
                    "X-TTS-Engine": cached.engineUsed,
                    "X-TTS-Voice": styleKey,
                    "X-TTS-Cache": "HIT"
                }
            });
        }

        let audioBuffer: Buffer | null = null;
        let mimeType = "audio/wav";
        let engineUsed = "gemini-flash-audio";

        const elevenKey = elevenApiKey || process.env.ELEVENLABS_API_KEY;

        // ƯU TIÊN 1: ElevenLabs Voice Cloning (nếu người dùng chọn engine elevenlabs hoặc truyền voiceId)
        if ((engine === "elevenlabs" || voiceId) && elevenKey) {
            try {
                audioBuffer = await synthesizeWithElevenLabs(normalizedText, voiceId || "21m00Tcm4TlvDq8ikWAM", elevenKey);
                engineUsed = "elevenlabs";
                mimeType = "audio/mpeg";
            } catch (elevenErr: any) {
                console.warn("[TTS] ElevenLabs failed:", elevenErr.message);
                if (engine === "elevenlabs") {
                    throw new Error(`Lỗi ElevenLabs Voice Cloning: ${elevenErr.message}`);
                }
            }
        }

        // ƯU TIÊN 2: GOOGLE GEMINI FLASH AUDIO (MẶC ĐỊNH SỐ 1 - GIỌNG AI TIÊN TIẾN NHẤT)
        if (!audioBuffer && (engine === "gemini" || !engine)) {
            try {
                const geminiResult = await synthesizeWithGeminiTTS(normalizedText, styleKey, geminiApiKey);
                audioBuffer = geminiResult.buffer;
                mimeType = geminiResult.mimeType;
                engineUsed = `gemini-${geminiResult.modelUsed}`;
            } catch (geminiErr: any) {
                console.warn("[TTS] Gemini Audio unavailable, synthesizing with Studio Neural Voice (Hoài My & Nam Minh):", geminiErr.message);
                try {
                    // Cố định giọng Edge Neural (Hoài My & Nam Minh) để bảo đảm 100% nhất quán âm sắc, không dùng timeout quá ngắn
                    const edgeResult = await synthesizeWithEdgeTTS(normalizedText, styleKey, Number(rateMultiplier) || 1.0);
                    audioBuffer = edgeResult.buffer;
                    mimeType = edgeResult.mimeType;
                    engineUsed = "studio-neural-hoaimy-namminh";
                } catch (edgeErr: any) {
                    console.error("[TTS] Studio Neural failed, using emergency backup:", edgeErr.message);
                    audioBuffer = await synthesizeWithGoogleTTS(normalizedText);
                    mimeType = "audio/mpeg";
                    engineUsed = "emergency-backup";
                }
            }
        }

        // ƯU TIÊN 3: Microsoft Edge (Chỉ dùng khi người dùng chủ động chọn engine "edge")
        if (!audioBuffer && engine === "edge") {
            try {
                const edgeResult = await synthesizeWithEdgeTTS(normalizedText, styleKey, Number(rateMultiplier) || 1.0);
                audioBuffer = edgeResult.buffer;
                mimeType = edgeResult.mimeType;
                engineUsed = "edge-neural";
            } catch {
                audioBuffer = await synthesizeWithGoogleTTS(normalizedText);
                mimeType = "audio/mpeg";
                engineUsed = "google-fast-audio";
            }
        }

        if (!audioBuffer || audioBuffer.length === 0) {
            throw new Error("Không thể tạo dữ liệu âm thanh.");
        }

        // ── SAVE TO SERVER IN-MEMORY CACHE ──
        globalTtsCache.set(cacheKey, {
            buffer: audioBuffer,
            mimeType,
            engineUsed,
            timestamp: Date.now()
        });
        if (globalTtsCache.size > 200) {
            const oldestKey = globalTtsCache.keys().next().value;
            if (oldestKey) globalTtsCache.delete(oldestKey);
        }

        return new NextResponse(new Uint8Array(audioBuffer), {
            status: 200,
            headers: {
                "Content-Type": mimeType,
                "Content-Length": audioBuffer.length.toString(),
                "Content-Disposition": `inline; filename="voiceover_${styleKey}.${mimeType.includes("wav") ? "wav" : "mp3"}"`,
                "Cache-Control": "public, max-age=86400",
                "X-TTS-Engine": engineUsed,
                "X-TTS-Voice": styleKey,
                "X-TTS-Cache": "MISS"
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
