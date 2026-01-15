import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { page_token, greeting_text, persistent_menu, get_started_payload } = body;

        if (!page_token) {
            return NextResponse.json({ error: 'Page Token is required' }, { status: 400 });
        }

        // Construct FB Profile Body
        const profileBody: any = {};

        // 1. Get Started Button
        if (get_started_payload) {
            profileBody.get_started = { payload: get_started_payload };
        }

        // 2. Greeting Text
        if (greeting_text) {
            profileBody.greeting = [
                { locale: 'default', text: greeting_text }
            ];
        }

        // 3. Persistent Menu
        if (persistent_menu && Array.isArray(persistent_menu)) {
            profileBody.persistent_menu = [
                {
                    locale: 'default',
                    composer_input_disabled: false,
                    call_to_actions: persistent_menu
                }
            ];
        }

        // Call Facebook API
        const res = await fetch(`https://graph.facebook.com/v19.0/me/messenger_profile?access_token=${page_token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileBody)
        });

        const data = await res.json();

        if (data.error) {
            console.error("FB Profile Error:", data.error);
            return NextResponse.json({ error: data.error.message }, { status: 400 });
        }

        // 4. Save to Database (chatbot_config)
        // Need page_id from body
        const { page_id, auto_hide_phone } = body;

        if (page_id) {
            const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
                auth: { persistSession: false }
            });

            // 1. Fetch current config
            const { data: currentData } = await supabase
                .from('facebook_pages')
                .select('chatbot_config')
                .eq('page_id', page_id)
                .single();

            const existingConfig = currentData?.chatbot_config || {};

            // 2. Merge
            const newConfig = {
                ...existingConfig,
                greeting_text: greeting_text !== undefined ? greeting_text : existingConfig.greeting_text,
                auto_hide_phone: auto_hide_phone !== undefined ? auto_hide_phone : existingConfig.auto_hide_phone,
                persistent_menu: persistent_menu !== undefined ? persistent_menu : existingConfig.persistent_menu,
                get_started_payload: get_started_payload !== undefined ? get_started_payload : existingConfig.get_started_payload,
                updated_at: new Date().toISOString()
            };

            await supabase
                .from('facebook_pages')
                .update({ chatbot_config: newConfig })
                .eq('page_id', page_id);
        }

        return NextResponse.json({ success: true, result: data });
    } catch (error: any) {
        console.error("Profile API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
