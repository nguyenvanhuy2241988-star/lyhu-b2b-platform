import { NextRequest, NextResponse } from "next/server";
import { prepareTextForTTS } from "@/lib/ttsHelper";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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
            reject(new Error("Quá thời gian kết nối máy chủ giọng đọc Edge Neural TTS (15s)."));
        }, 15000);

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
 * Tạo giọng đọc qua Gemini TTS (nếu có GEMINI_API_KEY)
 */
async function synthesizeWithGeminiTTS(
    text: string,
    styleKey: string
): Promise<{ buffer: Buffer; mimeType: string }> {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY chưa được cấu hình.");
    }

    const voiceMapping: Record<string, string> = {
        "female-genz": "Kore",
        "female-sweet": "Aoede",
        "female-pro": "Leda",
        "male-genz": "Puck",
        "male-pro": "Fenrir"
    };
    const voiceName = voiceMapping[styleKey] || (styleKey.includes("male") ? "Puck" : "Kore");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`;
    const body = {
        contents: [
            {
                role: "user",
                parts: [{ text }]
            }
        ],
        systemInstruction: {
            parts: [{ text: "Bạn là phát thanh viên chuyên nghiệp tiếng Việt. Hãy đọc văn bản sau với ngữ điệu chuẩn xác, tự nhiên, biểu cảm và rõ từng âm tiết tiếng Việt." }]
        },
        generationConfig: {
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
        signal: AbortSignal.timeout(25000)
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini TTS API error (${res.status}): ${errText.slice(0, 150)}`);
    }

    const json = await res.json();
    const part = json.candidates?.[0]?.content?.parts?.[0];
    if (!part?.inlineData?.data) {
        throw new Error("Gemini không trả về dữ liệu âm thanh.");
    }

    return {
        buffer: Buffer.from(part.inlineData.data, "base64"),
        mimeType: part.inlineData.mimeType || "audio/wav"
    };
}

// ── MAIN API HANDLER ──
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            text,
            voice,
            style = "female-genz",
            engine = "edge",
            rateMultiplier = 1.0,
            voiceId,
            elevenApiKey
        } = body;

        if (!text || typeof text !== "string" || !text.trim()) {
            return NextResponse.json(
                { error: "Vui lòng nhập nội dung văn bản cần lồng tiếng." },
                { status: 400 }
            );
        }

        // Chuẩn hóa triệt để: Xóa emoji, chuẩn hóa thương hiệu (LYHU, BOYO, CVT...), thêm nhịp thở
        const normalizedText = prepareTextForTTS(text);

        // Xác định style key
        let styleKey = style || "female-genz";
        if (voice && (voice.includes("NamMinh") || voice.includes("male") || voice.includes("Puck") || voice.includes("Fenrir"))) {
            if (!styleKey.includes("male")) styleKey = "male-genz";
        }

        console.log(`[TTS API] Request: engine=${engine}, styleKey=${styleKey}, textLength=${normalizedText.length}`);

        let audioBuffer: Buffer | null = null;
        let mimeType = "audio/mpeg";
        let engineUsed = "edge-neural";

        const apiKey = elevenApiKey || process.env.ELEVENLABS_API_KEY;

        // 1. ELEVENLABS: Nếu người dùng chọn engine ElevenLabs hoặc gửi voiceId
        if ((engine === "elevenlabs" || voiceId) && apiKey) {
            try {
                audioBuffer = await synthesizeWithElevenLabs(normalizedText, voiceId || "21m00Tcm4TlvDq8ikWAM", apiKey);
                engineUsed = "elevenlabs";
                mimeType = "audio/mpeg";
            } catch (elevenErr: any) {
                console.warn("[TTS] ElevenLabs failed:", elevenErr.message);
                // Nếu người dùng chọn đích danh elevenlabs nhưng lỗi thì báo lỗi rõ ràng, không tráo đổi
                if (engine === "elevenlabs") {
                    throw new Error(`Lỗi ElevenLabs: ${elevenErr.message}`);
                }
            }
        }

        // 2. GEMINI TTS: Nếu người dùng chủ động chọn engine Gemini và có API key
        if (!audioBuffer && engine === "gemini" && GEMINI_API_KEY) {
            try {
                const geminiResult = await synthesizeWithGeminiTTS(normalizedText, styleKey);
                audioBuffer = geminiResult.buffer;
                mimeType = geminiResult.mimeType;
                engineUsed = "gemini-2.5-flash-tts";
            } catch (geminiErr: any) {
                console.warn("[TTS] Gemini TTS failed:", geminiErr.message);
                throw new Error(`Lỗi Gemini TTS: ${geminiErr.message}`);
            }
        }

        // 3. MICROSOFT EDGE NEURAL TTS (Mặc định chuẩn studio tiếng Việt 100%, không bao giờ sai chính tả)
        if (!audioBuffer) {
            const edgeResult = await synthesizeWithEdgeTTS(normalizedText, styleKey, Number(rateMultiplier) || 1.0);
            audioBuffer = edgeResult.buffer;
            mimeType = edgeResult.mimeType;
            engineUsed = "edge-neural";
        }

        if (!audioBuffer || audioBuffer.length === 0) {
            throw new Error("Không thể tạo dữ liệu âm thanh.");
        }

        return new NextResponse(new Uint8Array(audioBuffer), {
            status: 200,
            headers: {
                "Content-Type": mimeType,
                "Content-Length": audioBuffer.length.toString(),
                "Content-Disposition": `inline; filename="voiceover_lyhu_${styleKey}.${mimeType.includes("wav") ? "wav" : "mp3"}"`,
                "Cache-Control": "public, max-age=3600",
                "X-TTS-Engine": engineUsed,
                "X-TTS-Voice": styleKey
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
