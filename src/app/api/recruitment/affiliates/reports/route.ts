import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import dayjs from 'dayjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
    const cookieStore = cookies();
    return createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
        },
    });
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const timeRange = searchParams.get('timeRange') || 'today';
        
        let startDate = dayjs().startOf('day').format('YYYY-MM-DD');
        let endDate = dayjs().endOf('day').format('YYYY-MM-DD');
        
        if (timeRange === 'week') {
            startDate = dayjs().startOf('week').format('YYYY-MM-DD');
        } else if (timeRange === 'month') {
            startDate = dayjs().startOf('month').format('YYYY-MM-DD');
        }

        const supabase = getSupabase();
        
        // Get current user and role
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
            
        const isAdmin = ['admin', 'manager', 'hr_manager', 'director'].includes(profile?.role || '');

        // Fetch activities within date range
        let query = supabase
            .from('affiliate_daily_activities')
            .select('*, hr:profiles!user_id(id, full_name, email)')
            .gte('date', startDate)
            .lte('date', endDate);
            
        // If not admin, only fetch their own data
        if (!isAdmin) {
            query = query.eq('user_id', user.id);
        }

        const { data: activities, error: activitiesError } = await query;

        if (activitiesError) throw activitiesError;

        // Fetch targets for all users who have activities
        const allUserIds = activities?.map(a => a.user_id) || [];
        const userIds = allUserIds.filter((v, i, a) => a.indexOf(v) === i);
        let targets: any[] = [];
        if (userIds.length > 0) {
            const { data: targetsData } = await supabase
                .from('affiliate_kpi_settings')
                .select('*')
                .in('user_id', userIds);
            targets = targetsData || [];
        }

        // Aggregate data
        const teamTotal = {
            target: { found: 0, contacted: 0, won: 0 },
            actual: { found: 0, contacted: 0, won: 0, lost: 0 }
        };

        const userStats: any = {};
        
        activities?.forEach(act => {
            if (!userStats[act.user_id]) {
                const target = targets.find(t => t.user_id === act.user_id);
                userStats[act.user_id] = {
                    user: act.hr,
                    target: {
                        found: target?.found_target || 50,
                        contacted: target?.contacted_target || 30,
                        won: target?.won_target || 5
                    },
                    actual: { found: 0, contacted: 0, won: 0, lost: 0 }
                };
            }
            userStats[act.user_id].actual.found += (act.found_actual || 0);
            userStats[act.user_id].actual.contacted += (act.contacted_actual || 0);
            userStats[act.user_id].actual.won += (act.won_actual || 0);
            userStats[act.user_id].actual.lost += (act.lost_actual || 0);
        });

        // Calculate Team Totals
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
            userStats: Object.values(userStats),
            isAdmin
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
