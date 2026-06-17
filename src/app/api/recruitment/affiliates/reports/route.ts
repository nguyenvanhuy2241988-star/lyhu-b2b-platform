import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const startDate = url.searchParams.get('start') || new Date().toISOString().split('T')[0];
        const endDate = url.searchParams.get('end') || new Date().toISOString().split('T')[0];

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Fetch all activities in the date range
        const { data: activities, error: activitiesError } = await supabase
            .from('affiliate_daily_activities')
            .select(`
                *,
                user:profiles(id, full_name, email, avatar_url)
            `)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false });

        if (activitiesError) throw activitiesError;

        // Fetch targets for all users who have activities
        const userIds = [...new Set(activities?.map(a => a.user_id) || [])];
        let targets = [];
        if (userIds.length > 0) {
            const { data: targetsData } = await supabase
                .from('affiliate_kpi_settings')
                .select('*')
                .in('user_id', userIds);
            targets = targetsData || [];
        }

        // Group by user to calculate totals
        const userStats: any = {};
        
        activities?.forEach(act => {
            if (!userStats[act.user_id]) {
                const target = targets.find(t => t.user_id === act.user_id);
                userStats[act.user_id] = {
                    user: act.user,
                    target: {
                        found: target?.found_target || 50,
                        contacted: target?.contacted_target || 30,
                        won: target?.won_target || 5
                    },
                    actual: {
                        found: 0,
                        contacted: 0,
                        won: 0,
                        lost: 0
                    }
                };
            }
            userStats[act.user_id].actual.found += (act.found_actual || 0);
            userStats[act.user_id].actual.contacted += (act.contacted_actual || 0);
            userStats[act.user_id].actual.won += (act.won_actual || 0);
            userStats[act.user_id].actual.lost += (act.lost_actual || 0);
        });

        // Calculate Team Totals
        const teamTotal = {
            target: { found: 0, contacted: 0, won: 0 },
            actual: { found: 0, contacted: 0, won: 0, lost: 0 }
        };

        Object.values(userStats).forEach((stat: any) => {
            teamTotal.target.found += stat.target.found;
            teamTotal.target.contacted += stat.target.contacted;
            teamTotal.target.won += stat.target.won;
            
            teamTotal.actual.found += stat.actual.found;
            teamTotal.actual.contacted += stat.actual.contacted;
            teamTotal.actual.won += stat.actual.won;
            teamTotal.actual.lost += stat.actual.lost;
        });

        return NextResponse.json({
            teamTotal,
            userStats: Object.values(userStats)
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
