import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    const debug: string[] = [];
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        // 1. Get all kanban columns
        const { data: kanbanCols, error: colErr } = await supabase
            .from('recruitment_board_columns')
            .select('id, label')
            .order('order_index', { ascending: true });

        debug.push(`Columns found: ${kanbanCols?.length || 0}`);
        debug.push(`Column error: ${colErr?.message || 'none'}`);
        debug.push(`All columns: ${JSON.stringify(kanbanCols?.map(c => ({ id: c.id, label: c.label })))}`);

        const interviewColIds = (kanbanCols || [])
            .filter(c => c.label.toLowerCase().includes('phỏng vấn') || c.id === 'interview')
            .map(c => c.id);

        if (interviewColIds.length === 0) {
            interviewColIds.push('interview');
        }
        debug.push(`Interview column IDs: ${JSON.stringify(interviewColIds)}`);

        // 2. Get candidates in interview stage
        const { data: candidates, error: candErr } = await supabase
            .from('recruitment_candidates')
            .select('id, full_name, phone, email, status, job:job_id(title), created_at')
            .in('status', interviewColIds);

        debug.push(`Candidates found: ${candidates?.length || 0}`);
        debug.push(`Candidate error: ${candErr?.message || 'none'}`);
        debug.push(`Candidate statuses: ${JSON.stringify(candidates?.map(c => ({ name: c.full_name, status: c.status })))}`);

        // Also check: get ALL candidates statuses to see what statuses exist
        const { data: allCandidates } = await supabase
            .from('recruitment_candidates')
            .select('id, full_name, status')
            .limit(20);
        debug.push(`ALL candidate statuses: ${JSON.stringify(allCandidates?.map(c => ({ name: c.full_name, status: c.status })))}`);

        if (!candidates || candidates.length === 0) {
            return NextResponse.json({ success: true, tasks: [], debug });
        }

        // 3. Get interviews
        const candidateIds = candidates.map(c => c.id);
        const { data: interviews } = await supabase
            .from('recruitment_interviews')
            .select('candidate_id, scheduled_at, status')
            .in('candidate_id', candidateIds)
            .eq('status', 'scheduled')
            .order('scheduled_at', { ascending: true });

        const interviewMap = new Map<string, string>();
        for (const iv of (interviews || [])) {
            if (!interviewMap.has(iv.candidate_id)) {
                interviewMap.set(iv.candidate_id, iv.scheduled_at);
            }
        }

        // 4. Build task-like objects
        const tasks = candidates.map(cand => {
            const jobTitle = (cand as any).job?.title || 'Chưa rõ vị trí';
            const scheduledAt = interviewMap.get(cand.id) || null;
            return {
                id: `interview_${cand.id}`,
                user_id: '',
                title: `📋 PV: ${cand.full_name} - ${jobTitle}`,
                customer_name: cand.full_name,
                phone: cand.phone || null,
                note: `Ứng viên phỏng vấn\nEmail: ${cand.email || 'N/A'}`,
                status: 'inbox',
                priority: 'high',
                type: 'task',
                due_date: scheduledAt,
                created_at: cand.created_at,
                order: 0,
            };
        });

        return NextResponse.json({ success: true, tasks, debug });

    } catch (error: any) {
        debug.push(`Exception: ${error.message}`);
        return NextResponse.json({ success: false, error: error.message, tasks: [], debug }, { status: 500 });
    }
}
