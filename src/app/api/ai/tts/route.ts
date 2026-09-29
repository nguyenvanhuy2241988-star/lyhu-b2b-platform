import { NextRequest, NextResponse } from "next/server";
import { normalizeVietnamesePhonetics } from "@/lib/ttsHelper";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Helper: Run promise with timeout
function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(errorMsg)), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// --------------- Microsoft Edge Neural TTS Engine ---------------

interface EdgeVoiceConfig {
    voice: string;
    rate: string;
    pitch: string;
}

const VOICE_PRESETS: Record<string, EdgeVoiceConfig> = {
    "female-genz": {
        voice: "vi-VN-HoaiMyNeural",
        rate: "+12%",
        pitch: "+15Hz"
    },
    "female-sweet": {
        voice: "vi-VN-HoaiMyNeural",
        rate: "+2%",
        pitch: "+6Hz"
    },
    "female-pro": {
        voice: "vi-VN-HoaiMyNeural",
        rate: "+6%",
        pitch: "+0Hz"
    },
    "male-genz": {
        voice: "vi-VN-NamMinhNeural",
        rate: "+10%",
        pitch: "+10Hz"
    },
    "male-pro": {
        voice: "vi-VN-NamMinhNeural",
        rate: "+2%",
        pitch: "-4Hz"
    },
    "female": {
        voice: "vi-VN-HoaiMyNeural",
        rate: "+8%",
        pitch: "+5Hz"
    },
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
    const edgePromise = new Promise<Buffer>(async (resolve, reject) => {
        try {
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
                    resolve(finalBuf);
                }
            });
            result.audioStream.on("error", (err: any) => reject(err));
        } catch (err) {
            reject(err);
        }
    });

    // Cắt timeout ở 3.5 giây để nếu máy chủ Vercel bị chặn WebSocket thì chuyển ngay sang Google TTS
    return withTimeout(edgePromise, 3500, "Edge TTS timeout after 3.5s");
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
                }),
                signal: AbortSignal.timeout(8000)
            });

            if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                return Buffer.from(arrayBuffer);
            }
        } catch (e: any) {
            console.warn(`[ElevenLabs] Error with model ${modelId}:`, e.message);
        }
    }

    throw new Error("ElevenLabs failed with all models");
}

// --------------- Google Translate High-Speed Edge TTS ---------------

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
    const chunks = splitTextIntoChunks(text, 140);
    if (chunks.length === 0) throw new Error("No text chunks.");

    // Fetch concurrent chunks simultaneously (takes < 600ms total)
    const chunkPromises = chunks.map(async (chunk) => {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(chunk)}`;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                Referer: "https://translate.google.com/"
            },
            signal: AbortSignal.timeout(3500)
        });

        if (!res.ok) {
            throw new Error(`Google chunk failed (${res.status})`);
        }
        return Buffer.from(await res.arrayBuffer());
    });

    const audioBuffers = await Promise.all(chunkPromises);
    if (audioBuffers.length === 0) throw new Error("All Google Translate chunks failed.");
    return Buffer.concat(audioBuffers);
}

// --------------- Main Handler ---------------

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, voice = "female", rate, pitch, style = "female", voiceId, elevenApiKey, provider } = body;

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

        let audioBuffer: Buffer | null = null;
        const apiKey = elevenApiKey || process.env.ELEVENLABS_API_KEY;

        // Ưu tiên 1: ElevenLabs nếu người dùng cấu hình giọng nhân bản riêng
        if (voiceId && apiKey) {
            try {
                console.log("[TTS] Trying ElevenLabs Voice Cloning for voiceId:", voiceId);
                audioBuffer = await synthesizeWithElevenLabs(normalizedText, voiceId, apiKey);
                console.log("[TTS] ElevenLabs SUCCESS:", audioBuffer.length, "bytes");
            } catch (elevenErr: any) {
                console.warn("[TTS] ElevenLabs failed:", elevenErr.message);
            }
        }

        // Nếu người dùng chọn Google trực tiếp hoặc ElevenLabs thất bại
        if (!audioBuffer) {
            if (provider === "google") {
                audioBuffer = await synthesizeWithGoogleTranslate(normalizedText);
            } else {
                // Thử Microsoft Edge Neural TTS trước (với timeout bảo vệ 3.5s)
                try {
                    audioBuffer = await synthesizeWithEdgeTTS(normalizedText, targetVoice, targetRate, targetPitch);
                    console.log("[TTS] Edge Neural TTS SUCCESS:", audioBuffer.length, "bytes");
                } catch (edgeErr: any) {
                    console.warn("[TTS] Edge TTS fallback triggering Google Translate:", edgeErr.message);
                    // Lập tức fallback sang Google Translate tốc độ cao (< 600ms), không bao giờ bị 504
                    audioBuffer = await synthesizeWithGoogleTranslate(normalizedText);
                    console.log("[TTS] Google Translate fallback SUCCESS:", audioBuffer.length, "bytes");
                }
            }
        }

        if (!audioBuffer || audioBuffer.length === 0) {
            throw new Error("Không thể tạo giọng đọc audio.");
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
