export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase lazily to avoid build-time errors when env vars are missing
const getSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return null;
    }

    return createClient(supabaseUrl, supabaseKey);
};

export async function GET(request: NextRequest) {
    console.log('[API /api/chat] GET request received');

    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('[API /api/chat] Server configuration error: Missing Supabase env vars');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }
        // Get userId from query params
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');

        console.log('[API /api/chat] userId:', userId);

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing userId parameter' },
                { status: 400 }
            );
        }

        // Test query - fetch user's conversations using internal_ tables
        const { data: conversations, error } = await supabase
            .from('internal_conversations')
            .select(`
                id,
                type,
                name,
                created_at,
                internal_participants!inner (
                    user_id
                )
            `)
            .eq('internal_participants.user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('[API /api/chat] Supabase error:', error);
            return NextResponse.json(
                {
                    error: 'Database query failed',
                    details: error.message
                },
                { status: 500 }
            );
        }

        console.log('[API /api/chat] Success, found conversations:', conversations?.length);

        return NextResponse.json({
            success: true,
            conversations: conversations || [],
            count: conversations?.length || 0
        });

    } catch (error) {
        console.error('[API /api/chat] Unexpected error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
