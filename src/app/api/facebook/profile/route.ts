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

        return NextResponse.json({ success: true, result: data });
    } catch (error: any) {
        console.error("Profile API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
