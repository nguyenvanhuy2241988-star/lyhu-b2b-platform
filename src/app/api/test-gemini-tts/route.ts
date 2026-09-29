import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const testModels = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-exp",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite"
    ];

    const results: Record<string, any> = {};

    for (const model of testModels) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
            const body = {
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: "Xin chào, đọc thử nghiệm một câu ngắn." }
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
                signal: AbortSignal.timeout(10000)
            });

            const text = await res.text();
            try {
                const json = JSON.parse(text);
                const hasAudio = !!json.candidates?.[0]?.content?.parts?.some((p: any) => p.inlineData?.data);
                results[model] = {
                    status: res.status,
                    hasAudio,
                    keys: Object.keys(json),
                    candidateCount: json.candidates?.length,
                    error: json.error || null
                };
            } catch {
                results[model] = { status: res.status, rawText: text.slice(0, 200) };
            }
        } catch (e: any) {
            results[model] = { error: e.message };
        }
    }

    return NextResponse.json(results);
}
