import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CORS Headers
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
    try {
        // Fetch all contacts joined with their message counts
        const { data: contacts, error } = await supabaseAdmin
            .from("zalo_contacts")
            .select("*")
            .order("last_seen", { ascending: false });

        if (error) {
            console.error("Contacts Fetch Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
        }

        return NextResponse.json(contacts || [], { headers: corsHeaders });

    } catch (err: any) {
        console.error("Contacts GET Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        console.log("=== ZALO CONTACTS SYNC ===");
        console.log("Received contacts:", body.contacts?.length);

        if (!body.contacts || !Array.isArray(body.contacts)) {
            return NextResponse.json({ error: "Missing contacts array" }, { status: 400, headers: corsHeaders });
        }

        const accountId = body.accountId || "default_staff";

        // Upsert each contact based on name (as unique identifier)
        let insertedCount = 0;
        let updatedCount = 0;

        for (const contact of body.contacts) {
            if (!contact.name || contact.name.length < 2) continue;

            // Check if contact exists
            const { data: existing } = await supabaseAdmin
                .from("zalo_contacts")
                .select("id")
                .eq("name", contact.name)
                .eq("account_id", accountId)
                .single();

            if (existing) {
                // Update existing contact
                await supabaseAdmin
                    .from("zalo_contacts")
                    .update({
                        avatar_url: contact.avatar || null,
                        last_message_preview: contact.lastMessage || null,
                        last_seen: contact.lastSeen || new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", existing.id);
                updatedCount++;
            } else {
                // Insert new contact
                const { error: insertError } = await supabaseAdmin
                    .from("zalo_contacts")
                    .insert({
                        account_id: accountId,
                        name: contact.name,
                        avatar_url: contact.avatar || null,
                        last_message_preview: contact.lastMessage || null,
                        last_seen: contact.lastSeen || new Date().toISOString()
                    });

                if (!insertError) {
                    insertedCount++;
                } else {
                    console.log("Insert Error for:", contact.name, insertError);
                }
            }
        }

        console.log(`Contacts Sync: ${insertedCount} inserted, ${updatedCount} updated`);

        return NextResponse.json({
            success: true,
            inserted: insertedCount,
            updated: updatedCount
        }, { headers: corsHeaders });

    } catch (err: any) {
        console.error("Contacts POST Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
    }
}
