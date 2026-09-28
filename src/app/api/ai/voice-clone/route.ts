import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const name = (formData.get("name") as string) || "Giọng Nhân Bản Chính Chủ";
        const customApiKey = (formData.get("apiKey") as string) || process.env.ELEVENLABS_API_KEY;

        if (!file) {
            return NextResponse.json(
                { error: "Vui lòng chọn hoặc tải lên file âm thanh mẫu." },
                { status: 400 }
            );
        }

        // Nếu có API Key của ElevenLabs (do người dùng nhập hoặc cấu hình trên hệ thống)
        if (customApiKey) {
            const elevenFormData = new FormData();
            elevenFormData.append("name", name);
            elevenFormData.append("files", file);
            elevenFormData.append("description", "Giọng nhân bản chính chủ LYHU");

            const elevenRes = await fetch("https://api.elevenlabs.io/v1/voices/add", {
                method: "POST",
                headers: {
                    "xi-api-key": customApiKey
                },
                body: elevenFormData
            });

            if (!elevenRes.ok) {
                const errJson = await elevenRes.json().catch(() => ({}));
                return NextResponse.json(
                    { error: errJson.detail?.message || "Lỗi từ ElevenLabs API. Vui lòng kiểm tra API Key." },
                    { status: elevenRes.status }
                );
            }

            const data = await elevenRes.json();
            return NextResponse.json({
                success: true,
                provider: "elevenlabs",
                voiceId: data.voice_id,
                name: name,
                message: "Nhân bản giọng nói thành công!"
            });
        }

        // Trường hợp chưa có API Key: Trả về hướng dẫn và xác nhận file hợp lệ
        return NextResponse.json({
            success: false,
            needsApiKey: true,
            message: "File âm thanh mẫu hợp lệ! Vui lòng nhập mã ElevenLabs API Key để hệ thống kết nối và nhân bản giọng nói thật.",
            fileName: file.name,
            fileSize: file.size
        });

    } catch (err: any) {
        console.error("[Voice Clone API Error]:", err);
        return NextResponse.json(
            { error: err.message || "Lỗi xử lý file âm thanh trên hệ thống." },
            { status: 500 }
        );
    }
}
