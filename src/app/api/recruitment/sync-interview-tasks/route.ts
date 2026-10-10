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

        const interviewColIds = (kanbanCols || [])
            .filter(c => c.label.toLowerCase().includes('phỏng vấn') || c.id === 'interview')
            .map(c => c.id);

        if (interviewColIds.length === 0) {
            interviewColIds.push('interview');
        }

        // 2. Get candidates in interview stage
        const { data: candidates, error: candErr } = await supabase
            .from('recruitment_candidates')
            .select('id, full_name, phone, email, status, job:job_id(title), created_at')
            .in('status', interviewColIds);

        if (!candidates || candidates.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: "No interview candidates to sync" });
        }

        // 3. Get interviews scheduled
        const candidateIds = candidates.map(c => c.id);
        const { data: interviews } = await supabase
            .from('recruitment_interviews')
            .select('candidate_id, scheduled_at, status, interviewer_id')
            .in('candidate_id', candidateIds)
            .eq('status', 'scheduled')
            .order('scheduled_at', { ascending: true });

        const interviewMap = new Map<string, { scheduled_at: string; interviewer_id?: string }>();
        for (const iv of (interviews || [])) {
            if (!interviewMap.has(iv.candidate_id)) {
                interviewMap.set(iv.candidate_id, { scheduled_at: iv.scheduled_at, interviewer_id: iv.interviewer_id });
            }
        }

        // 4. Get Admin & Super Admin profiles to assign tasks
        const { data: adminProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .or('role.eq.admin,role.eq.super_admin');

        const adminIds = (adminProfiles || []).map(p => p.id);
        const primaryAdminId = adminIds[0] || null;

        let createdCount = 0;
        let existingCount = 0;

        // 5. For each candidate in interview stage, ensure a REAL task exists in telesales_tasks
        for (const cand of candidates) {
            // Check if a task already exists for this candidate
            const { data: existingTasks } = await supabase
                .from('telesales_tasks')
                .select('id, status, due_date, note')
                .ilike('note', `%CANDIDATE_ID:${cand.id}%`)
                .limit(1);

            const ivInfo = interviewMap.get(cand.id);
            const scheduledAt = ivInfo?.scheduled_at || null;
            const interviewerId = ivInfo?.interviewer_id || primaryAdminId;
            const assigneeIds = Array.from(new Set([interviewerId, ...adminIds].filter(Boolean)));

            if (existingTasks && existingTasks.length > 0) {
                existingCount++;
                const existingTask = existingTasks[0];
                // If schedule changed and task is not yet completed, update due date
                const existingTime = existingTask.due_date ? new Date(existingTask.due_date).getTime() : 0;
                const newTime = scheduledAt ? new Date(scheduledAt).getTime() : 0;
                const hasScheduleChanged = Math.abs(existingTime - newTime) > 60000;

                if (scheduledAt && existingTask.status !== 'done' && hasScheduleChanged) {
                    await supabase
                        .from('telesales_tasks')
                        .update({ due_date: scheduledAt })
                        .eq('id', existingTask.id);
                }
            } else {
                // Create a real task in database
                const jobTitle = (cand as any).job?.title || 'Chưa rõ vị trí';
                const cleanNote = `Ứng viên phỏng vấn - Vị trí: ${jobTitle}\nEmail: ${cand.email || 'N/A'}\nSĐT: ${cand.phone || 'N/A'}`;
                const packedNote = `${cleanNote}\n<!-- CANDIDATE_ID:${cand.id} --><!-- TASK_META:{"department":"hr","stage":"in_progress"} -->`;

                const { data: newTask, error: insertError } = await supabase
                    .from('telesales_tasks')
                    .insert({
                        title: `📋 PV: ${cand.full_name} - ${jobTitle}`,
                        customer_name: cand.full_name,
                        phone: cand.phone || null,
                        note: packedNote,
                        status: 'inbox',
                        priority: 'high',
                        type: 'task',
                        due_date: scheduledAt,
                        user_id: interviewerId,
                        owner_id: interviewerId,
                        assigned_to: interviewerId,
                        assignee_ids: assigneeIds
                    })
                    .select()
                    .single();

                if (newTask) {
                    createdCount++;
                    // Create placements for all assignees in their system_inbox column
                    for (const aId of assigneeIds) {
                        const { data: inboxCol } = await supabase
                            .from('task_user_columns')
                            .select('id')
                            .eq('user_id', aId)
                            .eq('column_type', 'system_inbox')
                            .maybeSingle();

                        if (inboxCol) {
                            await supabase
                                .from('task_column_placements')
                                .insert({
                                    task_id: newTask.id,
                                    user_id: aId,
                                    column_id: inboxCol.id,
                                    position: 0
                                });
                        }
                    }
                } else if (insertError) {
                    console.error('[sync-interview-tasks] Insert error:', insertError);
                }
            }
        }

        return NextResponse.json({
            success: true,
            createdCount,
            existingCount,
            totalCandidates: candidates.length
        });

    } catch (error: any) {
        console.error('[sync-interview-tasks] Exception:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
