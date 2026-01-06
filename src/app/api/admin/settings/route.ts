
export const dynamic = 'force-dynamic';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const cookieStore = cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch settings (limit 1)
        const { data, error } = await supabase
            .from('app_settings')
            .select('*')
            .limit(1)
            .single();

        if (error) {
            console.error("Error fetching settings:", error);
            // If strictly no rows, might return empty or logic to seed
            if (error.code === 'PGRST116') { // The result contains 0 rows
                return NextResponse.json({ company_info: {}, bank_info: [] });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Settings GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        // 1. Verify Authentication & Admin Role
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Check profile role
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const body = await request.json();
        const { company_info, bank_info } = body;

        // 2. Update Settings
        // We assume there's one row. We try to update it. If not exists, insert.
        // First check existence
        const { data: existing } = await supabase.from('app_settings').select('id').limit(1).single();

        if (existing) {
            const { data, error } = await supabase
                .from('app_settings')
                .update({
                    company_info,
                    bank_info,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json(data);
        } else {
            const { data, error } = await supabase
                .from('app_settings')
                .insert({
                    company_info,
                    bank_info
                })
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json(data);
        }

    } catch (error: any) {
        console.error("Settings POST Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
