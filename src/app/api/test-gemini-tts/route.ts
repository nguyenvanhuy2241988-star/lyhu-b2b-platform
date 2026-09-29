import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const ttsModels = [
        "gemini-3.8-flash-tts",
        "gemini-3.8-flash-lite-tts",
        "gemini-omni-flash-preview",
        "gemini-2.5-flash-preview-tts"
    ];

    const results: Record<string, any> = {};

    for (const model of ttsModels) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
            const body = {
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: "Nói với giọng nữ trẻ trung vui tươi: Xin chào cả nhà, hôm nay kho LYHU vừa về lô bánh tráng siêu ngon!" }
                        ]
                    }
                ],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: "Kore"
                            }
                        }
                    }
                }
            };

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(15000)
            });

            const text = await res.text();
            try {
                const json = JSON.parse(text);
                const firstPart = json.candidates?.[0]?.content?.parts?.[0];
                results[model] = {
                    status: res.status,
                    hasInlineAudio: !!firstPart?.inlineData?.data,
                    mimeType: firstPart?.inlineData?.mimeType,
                    audioLengthBytes: firstPart?.inlineData?.data ? Buffer.from(firstPart.inlineData.data, 'base64').length : 0,
                    text: firstPart?.text,
                    error: json.error || null
                };
            } catch {
                results[model] = { status: res.status, raw: text.slice(0, 300) };
            }
        } catch (e: any) {
            results[model] = { error: e.message };
        }
    }

    return NextResponse.json(results);
}
