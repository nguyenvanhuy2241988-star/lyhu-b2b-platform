export const dynamic = 'force-dynamic';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const cookieStore = cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        // Using service role key if available to bypass RLS for public settings,
        // otherwise anon key (assuming RLS allows anon select).
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createServerClient(
            supabaseUrl,
            key,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        const { data, error } = await supabase
            .from('app_settings')
            .select('company_info')
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ company_info: {} });
            }
            throw error;
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
