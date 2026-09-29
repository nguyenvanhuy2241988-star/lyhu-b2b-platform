import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const res = await fetch(url);
        const data = await res.json();
        
        const models = (data.models || []).map((m: any) => ({
            name: m.name,
            displayName: m.displayName,
            supportedGenerationMethods: m.supportedGenerationMethods
        }));

        return NextResponse.json({
            count: models.length,
            models: models
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
