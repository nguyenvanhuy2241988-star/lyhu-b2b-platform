import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

interface BriefingData {
    userName: string;
    kpi: {
        totalDeals: number;
        wonDeals: number;
        lostDeals: number;
        openDeals: number;
        overdueDeals: number;
        totalRevenue: number;
        monthTarget: number;
        daysRemaining: number;
    };
    todayTasks: {
        followUps: number;
        overdueFollowUps: number;
        newLeads: number;
    };
    topLeads: Array<{
        name: string;
        phone: string;
        stage: string;
        value: number;
        daysSinceUpdate: number;
        note: string;
        isOverdue: boolean;
    }>;
    recentOrders: {
        count: number;
        totalValue: number;
    };
    performance: {
        bestHour: string;
        avgDealsPerDay: number;
        winRate: number;
    };
}

async function gatherData(userId: string): Promise<BriefingData> {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - now.getDate();

    // Get user name
    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

    // Get deals stats for this month
    const { data: monthDeals } = await supabaseAdmin
        .from("crm_deals")
        .select("id, status, stage, expected_value, next_action_at, updated_at, title, note, customer:customers(name, phone, type)")
        .eq("owner_id", userId)
        .gte("created_at", monthStart);

    const deals = monthDeals || [];
    const wonDeals = deals.filter(d => d.status === 'won');
    const lostDeals = deals.filter(d => d.status === 'lost');
    const openDeals = deals.filter(d => d.status === 'open');
    const overdueDeals = openDeals.filter(d => d.next_action_at && new Date(d.next_action_at) < now);

    // Get month revenue from orders
    const { data: monthOrders } = await supabaseAdmin
        .from("orders")
        .select("id, total")
        .eq("created_by", userId)
        .gte("created_at", monthStart);

    const totalRevenue = (monthOrders || []).reduce((sum, o) => sum + (o.total || 0), 0);

    // Get KPI target
    const { data: kpiConfig } = await supabaseAdmin
        .from("kpi_metrics")
        .select("target_value")
        .eq("user_id", userId)
        .eq("metric_type", "revenue")
        .gte("period_start", monthStart)
        .limit(1)
        .single();

    // Get follow-ups due today
    const todayStart = `${today}T00:00:00`;
    const todayEnd = `${today}T23:59:59`;
    const followUps = openDeals.filter(d => d.next_action_at && d.next_action_at >= todayStart && d.next_action_at <= todayEnd);

    // Top 5 leads to prioritize (overdue first, then by value)
    const topLeads = openDeals
        .map(d => ({
            name: (d.customer as any)?.name || 'N/A',
            phone: (d.customer as any)?.phone || '',
            stage: d.stage,
            value: d.expected_value || 0,
            daysSinceUpdate: Math.floor((now.getTime() - new Date(d.updated_at).getTime()) / (1000 * 60 * 60 * 24)),
            note: d.note || '',
            isOverdue: !!(d.next_action_at && new Date(d.next_action_at) < now),
        }))
        .sort((a, b) => {
            if (a.isOverdue && !b.isOverdue) return -1;
            if (!a.isOverdue && b.isOverdue) return 1;
            return b.value - a.value;
        })
        .slice(0, 5);

    // Recent orders this week
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentOrders } = await supabaseAdmin
        .from("orders")
        .select("id, total")
        .eq("created_by", userId)
        .gte("created_at", weekAgo);

    // Win rate
    const totalClosed = wonDeals.length + lostDeals.length;
    const winRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 0;
    const daysPassed = now.getDate();
    const avgDealsPerDay = daysPassed > 0 ? Math.round((wonDeals.length / daysPassed) * 10) / 10 : 0;

    return {
        userName: profile?.full_name || 'Sales',
        kpi: {
            totalDeals: deals.length,
            wonDeals: wonDeals.length,
            lostDeals: lostDeals.length,
            openDeals: openDeals.length,
            overdueDeals: overdueDeals.length,
            totalRevenue,
            monthTarget: kpiConfig?.target_value || 0,
            daysRemaining,
        },
        todayTasks: {
            followUps: followUps.length,
            overdueFollowUps: overdueDeals.length,
            newLeads: openDeals.filter(d => d.stage === 'new_data').length,
        },
        topLeads,
        recentOrders: {
            count: (recentOrders || []).length,
            totalValue: (recentOrders || []).reduce((sum, o) => sum + (o.total || 0), 0),
        },
        performance: {
            bestHour: '9h-11h', // Default, can be refined later
            avgDealsPerDay,
            winRate,
        },
    };
}

async function generateBriefing(data: BriefingData): Promise<string> {
    if (!GEMINI_API_KEY) {
        return fallbackBriefing(data);
    }

    const prompt = `Bạn là AI assistant cho sales team LYHU (công ty bán snack/khoai môn sấy).
Hãy tạo briefing ngắn gọn đầu ngày cho nhân viên sales dựa trên dữ liệu sau.

THÔNG TIN:
- Tên: ${data.userName}
- Tháng này: ${data.kpi.wonDeals} deal won / ${data.kpi.totalDeals} tổng, ${data.kpi.lostDeals} lost
- Doanh thu tháng: ${(data.kpi.totalRevenue / 1000000).toFixed(1)}tr / Target: ${(data.kpi.monthTarget / 1000000).toFixed(1)}tr
- Còn ${data.kpi.daysRemaining} ngày trong tháng
- Win rate: ${data.performance.winRate}%
- Follow-up hôm nay: ${data.todayTasks.followUps}, quá hạn: ${data.todayTasks.overdueFollowUps}
- Lead mới chưa xử lý: ${data.todayTasks.newLeads}
- Đơn tuần này: ${data.recentOrders.count} đơn (${(data.recentOrders.totalValue / 1000000).toFixed(1)}tr)

TOP 5 LEAD CẦN GỌI:
${data.topLeads.map((l, i) => `${i + 1}. ${l.name} (${l.phone}) - stage: ${l.stage}, value: ${(l.value / 1000000).toFixed(1)}tr, ${l.isOverdue ? '⚠️ QUÁ HẠN' : `${l.daysSinceUpdate} ngày chưa update`}${l.note ? ` - Note: ${l.note.substring(0, 50)}` : ''}`).join('\n')}

YÊU CẦU:
1. Viết bằng tiếng Việt, thân thiện & chuyên nghiệp
2. Dùng emoji phù hợp
3. Gồm: lời chào + tóm tắt KPI + danh sách ưu tiên gọi + gợi ý chiến thuật
4. Tối đa 200 từ, ngắn gọn súc tích
5. Nếu có lead quá hạn, NHẤN MẠNH cần gọi ngay
6. Gợi ý dựa trên data thực (vd: cần bao nhiêu đơn/ngày để đạt target)
7. Format markdown (bold, bullet points)`;

    try {
        const res = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!res.ok) {
            console.error("[AI Briefing] Gemini API error:", res.status);
            return fallbackBriefing(data);
        }

        const result = await res.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        return text || fallbackBriefing(data);
    } catch (err) {
        console.error("[AI Briefing] Gemini call failed:", err);
        return fallbackBriefing(data);
    }
}

function fallbackBriefing(data: BriefingData): string {
    const revenuePercent = data.kpi.monthTarget > 0
        ? Math.round((data.kpi.totalRevenue / data.kpi.monthTarget) * 100)
        : 0;
    const neededPerDay = data.kpi.daysRemaining > 0 && data.kpi.monthTarget > 0
        ? Math.ceil((data.kpi.monthTarget - data.kpi.totalRevenue) / data.kpi.daysRemaining / 1000000 * 10) / 10
        : 0;

    let text = `🌅 **Chào ${data.userName}!**\n\n`;
    text += `📊 **KPI tháng:** Đạt ${revenuePercent}% target (${(data.kpi.totalRevenue / 1000000).toFixed(1)}tr/${(data.kpi.monthTarget / 1000000).toFixed(1)}tr)`;
    if (neededPerDay > 0) text += ` → Cần ~${neededPerDay}tr/ngày`;
    text += `\n`;
    text += `- Won: ${data.kpi.wonDeals} | Lost: ${data.kpi.lostDeals} | Open: ${data.kpi.openDeals} | Win rate: ${data.performance.winRate}%\n\n`;

    if (data.todayTasks.overdueFollowUps > 0) {
        text += `⚠️ **${data.todayTasks.overdueFollowUps} follow-up QUÁ HẠN** - cần gọi ngay!\n`;
    }
    if (data.todayTasks.followUps > 0) {
        text += `📞 ${data.todayTasks.followUps} follow-up hôm nay\n`;
    }
    if (data.todayTasks.newLeads > 0) {
        text += `🆕 ${data.todayTasks.newLeads} lead mới chờ xử lý\n`;
    }

    if (data.topLeads.length > 0) {
        text += `\n🔥 **Top lead cần gọi:**\n`;
        data.topLeads.forEach((l, i) => {
            text += `${i + 1}. **${l.name}** ${l.isOverdue ? '⚠️' : ''} - ${(l.value / 1000000).toFixed(1)}tr\n`;
        });
    }

    return text;
}

export async function POST(req: NextRequest) {
    try {
        const { userId, forceRefresh } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: "userId required" }, { status: 400 });
        }

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const { data: cached } = await supabaseAdmin
                .from("ai_daily_briefings")
                .select("content, data_snapshot, created_at")
                .eq("user_id", userId)
                .eq("briefing_date", todayStr)
                .single();

            if (cached) {
                return NextResponse.json({
                    success: true,
                    content: cached.content,
                    cached: true,
                    generatedAt: cached.created_at,
                });
            }
        }

        // Gather data & generate
        console.log(`[AI Briefing] Generating for user ${userId}...`);
        const data = await gatherData(userId);
        const content = await generateBriefing(data);

        // Cache the result
        await supabaseAdmin
            .from("ai_daily_briefings")
            .upsert({
                user_id: userId,
                briefing_date: todayStr,
                content,
                data_snapshot: data as any,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: "user_id,briefing_date",
            });

        return NextResponse.json({
            success: true,
            content,
            cached: false,
            generatedAt: new Date().toISOString(),
        });

    } catch (err: any) {
        console.error("[AI Briefing] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
