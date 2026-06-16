import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // AI can take a while

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: NextRequest) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );
        const { industry, area, budget } = await req.json();

        if (!industry || !area || !budget) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 500 });
        }

        const prompt = `Bạn là một kỹ sư quản lý dự án (Project Manager) cực kỳ có kinh nghiệm trong việc thiết lập (setup) xưởng sản xuất tại Việt Nam.
Tôi cần bạn lập một bản Kế hoạch triển khai (Kanban tasks) và Dự toán chi phí (Budget) để thiết lập một xưởng mới.

Thông tin dự án:
- Loại biểu xưởng/Ngành nghề: ${industry} (Thực phẩm)
- Diện tích: ~${area} m2
- Ngân sách phần cứng/setup (không tính tiền nhập hàng): ~${budget} VNĐ

YÊU CẦU ĐẦU RA (BẮT BUỘC TRẢ VỀ CHUẨN JSON, KHÔNG CÓ MARKDOWN HAY TEXT BÊN NGOÀI):
Hãy sinh ra một JSON với cấu trúc sau, chia nhỏ thành khoảng 15-20 đầu việc thực tế nhất theo trình tự setup, và khoảng 5-10 khoản chi phí lớn ứng với ngân sách:
{
  "tasks": [
    {
      "title": "Tên công việc (VD: Khảo sát và ký hợp đồng thuê mặt bằng)",
      "description": "Mô tả chi tiết việc này cần làm gì",
      "status": "todo",
      "priority": "high", // low, normal, high, urgent
      "order_index": 1 // thứ tự thực hiện
    }
  ],
  "expenses": [
    {
      "item_name": "Tên khoản chi (VD: Lắp rèm nhựa PVC chống côn trùng)",
      "category": "hardware", // rent, hardware, electricity, machines, labor, other
      "amount_expected": 1500000 // Chú ý: số tiền phải hợp lý và tổng các khoản phải xấp xỉ ngân sách ${budget} VNĐ
    }
  ]
}

Lưu ý riêng cho ngành ${industry} (Thực phẩm): Cần chú ý đến các task làm sàn Epoxy, chống côn trùng, xin giấy VSATTP, khu vực vệ sinh tay, phân khu sống chín...
Chỉ trả về JSON thuần túy, không có \`\`\`json ở đầu.`;

        console.log("[Factory AI] Calling Gemini...");
        const res = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                    responseMimeType: "application/json"
                },
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("[Factory AI] Gemini Error:", errorText);
            return NextResponse.json({ error: "AI Error" }, { status: 500 });
        }

        const result = await res.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
             return NextResponse.json({ error: "AI No Output" }, { status: 500 });
        }

        const plan = JSON.parse(text);

        // Save to DB
        console.log("[Factory AI] Saving plan to DB...");
        
        let savedTasks = [];
        if (plan.tasks && plan.tasks.length > 0) {
            const { data: insertedTasks, error: taskErr } = await supabaseAdmin
                .from("factory_setup_tasks")
                .insert(plan.tasks)
                .select("id");
            if (taskErr) console.error("Task Insert Err:", taskErr);
            savedTasks = insertedTasks || [];
        }

        if (plan.expenses && plan.expenses.length > 0) {
            const { error: expErr } = await supabaseAdmin
                .from("factory_setup_expenses")
                .insert(plan.expenses);
            if (expErr) console.error("Expense Insert Err:", expErr);
        }

        return NextResponse.json({
            success: true,
            message: `Created ${savedTasks.length} tasks and ${plan.expenses?.length || 0} budget items.`
        });

    } catch (err: any) {
        console.error("[Factory AI] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
