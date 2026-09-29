import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
        return new NextResponse("Missing url parameter", { status: 400 });
    }

    try {
        const decodedUrl = decodeURIComponent(url);
        const headers: Record<string, string> = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Referer": "https://www.tiktok.com/",
            "Accept": "*/*"
        };

        const range = req.headers.get("range");
        if (range) {
            headers["Range"] = range;
        }

        const res = await fetch(decodedUrl, { headers });
        if (!res.ok && res.status !== 206) {
            return new NextResponse(`Failed to fetch audio: ${res.statusText}`, { status: res.status });
        }

        const responseHeaders = new Headers();
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        responseHeaders.set("Access-Control-Allow-Headers", "*");
        responseHeaders.set("Content-Type", res.headers.get("content-type") || "audio/mpeg");
        
        const contentLength = res.headers.get("content-length");
        if (contentLength) responseHeaders.set("Content-Length", contentLength);
        
        const contentRange = res.headers.get("content-range");
        if (contentRange) responseHeaders.set("Content-Range", contentRange);

        const acceptRanges = res.headers.get("accept-ranges");
        if (acceptRanges) responseHeaders.set("Accept-Ranges", acceptRanges);

        return new NextResponse(res.body, {
            status: res.status,
            headers: responseHeaders
        });
    } catch (err: any) {
        console.error("Audio proxy error:", err);
        return new NextResponse(`Proxy error: ${err.message}`, { status: 500 });
    }
}
