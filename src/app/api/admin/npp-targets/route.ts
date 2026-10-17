export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function verifyAuth(request: Request) {
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
        return { error: 'Server configuration error', status: 500 };
    }

    const cookieStore = cookies();
    const supabaseUser = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
        },
    });

    let user = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const { data } = await supabaseUser.auth.getUser(token);
        user = data?.user;
    }

    if (!user) {
        const { data } = await supabaseUser.auth.getUser();
        user = data?.user;
    }

    if (!user) {
        return { error: 'Unauthorized: Session missing or invalid', status: 401 };
    }

    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        return { error: 'Forbidden: Profile not found', status: 403 };
    }

    const allowedRoles = ['admin', 'sale_admin'];
    if (!allowedRoles.includes(profile.role)) {
        return { error: 'Forbidden: Admin or Sale Admin access required', status: 403 };
    }

    return { user, profile };
}

export async function GET(request: Request) {
    try {
        const auth = await verifyAuth(request);
        if ('error' in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const { data, error } = await supabaseAdmin
            .from('npp_targets')
            .select('province_name, data');

        if (error) {
            console.error('Error fetching NPP targets:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform array to Record<string, any>
        const result: Record<string, any> = {};
        if (data) {
            data.forEach((row) => {
                result[row.province_name] = row.data;
            });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const auth = await verifyAuth(request);
        if ('error' in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const body = await request.json();
        
        // Ensure body is an object representing Record<string, ProvinceData>
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        const upsertPromises = Object.entries(body).map(([province_name, province_data]) => {
            return supabaseAdmin
                .from('npp_targets')
                .upsert(
                    { 
                        province_name, 
                        data: province_data,
                        updated_at: new Date().toISOString()
                    },
                    { onConflict: 'province_name' }
                );
        });

        const results = await Promise.all(upsertPromises);
        
        // Check if any upsert failed
        const errors = results.filter(r => r.error).map(r => r.error);
        if (errors.length > 0) {
            console.error('Errors saving NPP targets:', errors);
            return NextResponse.json({ error: 'Some records failed to save', details: errors }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Lưu dữ liệu thành công!" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
