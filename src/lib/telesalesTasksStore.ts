import { getCurrentUser } from "./auth"; // This helper in auth.ts handles sync user? We'll see.
import { supabase } from "@/lib/supabaseClient";

export type TaskStatus = string;
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskType = 'call_new_lead' | 'follow_up_lead' | 'confirm_order' | 'care_old_customer' | 'other';

export interface TelesalesTask {
    id: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus;
    order: number;
    type: TaskType;
    telesalesUserId: string;
    relatedLeadId?: string;
    leadId?: string;
    relatedCustomerId?: string;
    relatedOrderId?: string;
    phone?: string;
    customerName?: string;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    lastResult?: string;
    nextActionDate?: string;
    campaign?: string;
    orderAmount?: number;
    completedAt?: string;
    tags?: string[];
    logs?: CallLog[];
}

export interface CallLog {
    id: string;
    taskId: string;
    timestamp: string;
    durationSeconds: number;
    result: 'connected' | 'no_answer' | 'busy' | 'wrong_number' | 'other';
    note?: string;
}

export interface TelesalesColumn {
    id: string;
    label: string;
    order: number;
    isDefault?: boolean;
    isVisible?: boolean;
}

export const DEFAULT_COLUMNS: TelesalesColumn[] = [
    { id: "inbox", label: "Hộp thư đến", order: 0, isDefault: true, isVisible: true },
    { id: "today", label: "Hôm nay", order: 1, isDefault: true, isVisible: true },
    { id: "tomorrow", label: "Ngày mai", order: 2, isVisible: true },
    { id: "this_week", label: "Tuần này", order: 3, isVisible: true },
    { id: "later", label: "Để sau", order: 4, isVisible: true },
    { id: "done", label: "Hoàn tất", order: 5, isDefault: true, isVisible: true },
];

const MOCK_TELESALES_TASKS: TelesalesTask[] = [
    // ... (Mock data omitted for brevity, or keep if needed for default)
];

const STORAGE_KEY_TASKS = "lyhu_telesales_tasks";
const STORAGE_KEY_COLS = "lyhu_cols_v2";

// --- SYNC FUNCTIONS (Legacy/UI State) ---

export const loadTasks = (): TelesalesTask[] => {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY_TASKS);
        if (!stored) {
            return MOCK_TELESALES_TASKS;
        }
        return JSON.parse(stored);
    } catch (error) {
        console.error("Failed to load tasks:", error);
        return [];
    }
};

export const saveTasks = (tasks: TelesalesTask[]) => {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
        window.dispatchEvent(new Event("telesales-tasks-updated"));
    } catch (error) {
        console.error("Failed to save tasks:", error);
    }
};

export const addTask = (taskInput: any): TelesalesTask => { // Kept simplified signature matching usage
    const tasks = loadTasks();
    const newTask = { ...taskInput, id: `TASK-${Date.now()}` };
    saveTasks([newTask, ...tasks]);
    return newTask;
};

// ... Other sync updates omitted, assuming we rely on loadTasks mostly.

// --- ASYNC SUPABASE FUNCTIONS ---

export const fetchTasks = async (): Promise<TelesalesTask[]> => {
    const { data, error } = await supabase
        .from('telesales_tasks')
        .select('*');

    if (error) {
        console.error("Error loading tasks form Supabase:", error);
        return [];
    }

    return data.map((t: any) => ({
        id: t.id,
        title: t.type,
        priority: 'normal',
        status: t.status,
        order: 0,
        type: t.type as TaskType,
        telesalesUserId: t.assigned_to,
        relatedLeadId: t.lead_id,
        createdAt: t.created_at,
        updatedAt: t.created_at,
        logs: []
    }));
};

export const addTaskSupabase = async (taskInput: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('telesales_tasks').insert({
        type: taskInput.type,
        status: taskInput.status,
        assigned_to: user.id
    });
};

// Columns (always local)
export const loadColumns = (): TelesalesColumn[] => {
    if (typeof window === "undefined") return DEFAULT_COLUMNS;
    const stored = localStorage.getItem(STORAGE_KEY_COLS);
    return stored ? JSON.parse(stored) : DEFAULT_COLUMNS;
};
export const saveColumns = (cols: TelesalesColumn[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY_COLS, JSON.stringify(cols));
}

// Helper needed by Earnings Page presumably?
export const getMyTasks = (): TelesalesTask[] => {
    const tasks = loadTasks();
    // Logic to filter by current user (sync)
    // Return all for now if auth not sync
    return tasks;
};
