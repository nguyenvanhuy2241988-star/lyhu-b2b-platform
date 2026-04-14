const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
const { createClient } = require('@supabase/supabase-js');

// Init Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Using SERVICE_ROLE_KEY to bypass RLS because this is a server-side bot worker
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

/**
 * Saves a new lead/profile to the staging table
 * @param {object} leadData - { name, profile_url, source }
 */
async function saveLead(leadData) {
    if (!supabase) return;

    try {
        const payload = {
            source: leadData.source || 'bot_unknown',
            name: leadData.name || 'Unknown User',
            profile_url: leadData.profile_url,
            status: 'pending',
            ai_score: leadData.ai_score || 0,
            profile_vector: leadData.profile_vector || {},
            created_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('marketing_leads_staging')
            .insert(payload);

        if (error) {
            console.error("⚠️ [LOGGER] Save Lead Error:", error.message);
        }
    } catch (e) {
        console.error("⚠️ [LOGGER] Exception in saveLead:", e);
    }
}

module.exports = { logAction, saveLead, supabase };
