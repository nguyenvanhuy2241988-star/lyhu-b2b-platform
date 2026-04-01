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

        // 3. Persistent Menu (only send if non-empty)
        if (persistent_menu && Array.isArray(persistent_menu) && persistent_menu.length > 0) {
            profileBody.persistent_menu = [
                {
                    locale: 'default',
                    composer_input_disabled: false,
                    call_to_actions: persistent_menu
                }
            ];
        }

        // Only call Facebook API if there's something to update
        if (Object.keys(profileBody).length > 0) {
            const res = await fetch(`https://graph.facebook.com/v19.0/me/messenger_profile?access_token=${page_token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileBody)
            });

            const data = await res.json();

            if (data.error) {
                console.error("FB Profile Error:", data.error);
                // Don't return error - still save to database below
            }
        }

        // 4. Save to Database (chatbot_config)
        const { page_id } = body;

        if (page_id) {
            const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
                auth: { persistSession: false }
            });

            const { data: currentData } = await supabase
                .from('facebook_pages')
                .select('chatbot_config')
                .eq('page_id', page_id)
                .single();

            const existingConfig = currentData?.chatbot_config || {};

            // Merge all config fields
            const configFields = [
                'greeting_text', 'auto_hide_phone', 'auto_hide_all', 'auto_hide_keywords',
                'persistent_menu', 'get_started_payload', 'auto_reply_comment', 'auto_reply_comment_text',
                'ai_enabled', 'auto_comment_post_ids'
            ];
            const newConfig: any = { ...existingConfig, updated_at: new Date().toISOString() };
            for (const field of configFields) {
                if (body[field] !== undefined) {
                    newConfig[field] = body[field];
                }
            }

            await supabase
                .from('facebook_pages')
                .update({ chatbot_config: newConfig })
                .eq('page_id', page_id);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Profile API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
