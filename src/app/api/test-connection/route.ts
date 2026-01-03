import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    console.log('🧪 Testing Supabase connection...');

    try {
        // Check environment variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({
                success: false,
                error: 'Missing environment variables',
                missing: {
                    url: !supabaseUrl,
                    key: !supabaseKey
                }
            }, { status: 500 });
        }

        // Initialize client
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Test 1: Check profiles table
        console.log('Testing profiles table...');
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, email')
            .limit(5);

        if (usersError) {
            console.error('Profiles test failed:', usersError);
        }

        // Test 2: Check internal_conversations table
        console.log('Testing internal_conversations table...');
        const { data: convs, error: convsError } = await supabase
            .from('internal_conversations')
            .select('id, type')
            .limit(5);

        if (convsError) {
            return NextResponse.json({
                success: false,
                error: 'internal_conversations table query failed',
                details: convsError
            }, { status: 500 });
        }

        // Test 3: Check RPC function
        console.log('Testing RPC function...');
        let rpcWorks = false;
        let rpcError = null;

        if (users && users.length >= 2) {
            const { error: rpcErr } = await supabase.rpc('get_direct_conversation', {
                user_id_1: users[0].id,
                user_id_2: users[1].id
            });
            rpcWorks = !rpcErr;
            rpcError = rpcErr;
        }

        return NextResponse.json({
            success: true,
            message: 'Connection test completed!',
            results: {
                connection: '✅ Connected',
                profilesTable: users ? `✅ Found ${users.length} profiles` : `❌ Profiles query error`,
                conversationsTable: `✅ Found ${convs?.length || 0} internal_conversations`,
                rpcFunction: rpcWorks ? '✅ RPC works' : `❌ RPC notification: ${rpcError?.message || 'Ready for test'}`
            },
            environment: {
                supabaseUrl: supabaseUrl.substring(0, 30) + '...',
                nodeEnv: process.env.NODE_ENV
            }
        });

    } catch (error) {
        console.error('❌ Test failed:', error);
        return NextResponse.json({
            success: false,
            error: 'Connection test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
