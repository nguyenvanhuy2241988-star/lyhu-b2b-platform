require('dotenv').config({ path: '../../.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Init Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Note: In a real backend script we should use SERVICE_ROLE_KEY to bypass RLS, 
// but for this local tool usage, ANON key with the public RLS policy we created is fine/safer.
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ [LOGGER] Missing Supabase Env Vars. Logging disabled.");
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Logs a bot action to Supabase for Realtime UI updates
 * @param {string} actionType - 'defense', 'search', 'invite'
 * @param {string} status - 'success', 'info', 'error'
 * @param {string} message - Human readable message
 * @param {object} details - Extra JSON data
 */
async function logAction(actionType, status, message, details = {}) {
    if (!supabase) return;

    // Console log locally as well
    // console.log(`[CLOUD-LOG] ${actionType}: ${message}`);

    try {
        const payload = {
            action_type: actionType,
            status: status,
            details: {
                message: message,
                ...details
            },
            created_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('marketing_action_logs')
            .insert(payload);

        if (error) {
            console.error("⚠️ [LOGGER] Insert Error:", error.message);
        }
    } catch (e) {
        console.error("⚠️ [LOGGER] Exception:", e);
    }
}

module.exports = { logAction };
