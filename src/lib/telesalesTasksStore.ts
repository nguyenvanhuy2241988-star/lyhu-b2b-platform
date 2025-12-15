import { getCurrentUser } from "./auth";

export type TaskStatus = string;
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskType = 'call_new_lead' | 'follow_up_lead' | 'confirm_order' | 'care_old_customer' | 'other';

export interface TelesalesTask {
    id: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus; // Corresponds to TelesalesColumn.id
    order: number; // For sort order in column
    type: TaskType;
    telesalesUserId: string;
    relatedLeadId?: string;
    leadId?: string; // Explicit link to Lead ID
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
    tags?: string[];
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

export const TASK_STATUS_LABELS: Record<string, string> = {
    inbox: "Hộp thư đến",
    today: "Hôm nay",
    tomorrow: "Ngày mai",
    this_week: "Tuần này",
    later: "Để sau",
    done: "Hoàn tất",
    cancelled: "Đã hủy"
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
    low: "Thấp",
    normal: "Bình thường",
    high: "Cao",
    urgent: "Khẩn cấp"
};

const MOCK_TELESALES_TASKS: TelesalesTask[] = [
    {
        id: "TASK-001",
        title: "Gọi xác nhận đơn hàng ORD-TS-001",
        status: "today",
        order: 0,
        type: "confirm_order",
        priority: "high",
        telesalesUserId: "2", // Matching mock telesales user ID
        customerName: "Tạp hóa Minh Tâm",
        phone: "0998887771",
        relatedOrderId: "TS-ORD-1",
        dueDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "TASK-002",
        title: "Chăm sóc khách hàng cũ - Siêu thị Bình Minh",
        status: "tomorrow",
        order: 0,
        type: "care_old_customer",
        priority: "normal",
        telesalesUserId: "2",
        customerName: "Siêu thị Bình Minh",
        phone: "0998887772",
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "TASK-003",
        title: "Tư vấn sản phẩm mới cho Đại lý Tuấn Tú",
        status: "inbox",
        order: 0,
        type: "call_new_lead",
        priority: "normal",
        telesalesUserId: "2",
        customerName: "Đại lý Bia Nước Ngọt Tuấn Tú",
        phone: "0998887773",
        relatedLeadId: "TS-LEAD-3",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "TASK-004",
        title: "Follow up Căng tin ĐH Quốc Gia",
        status: "done",
        order: 0,
        type: "follow_up_lead",
        priority: "low",
        telesalesUserId: "2",
        customerName: "Căng tin ĐH Quốc Gia",
        phone: "0998887774",
        relatedLeadId: "TS-LEAD-X",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "TASK-005",
        title: "Gọi lại Tạp hóa Bác Ba",
        status: "this_week",
        order: 0,
        type: "call_new_lead",
        priority: "high",
        telesalesUserId: "2",
        customerName: "Tạp hóa Bác Ba",
        phone: "0998887775",
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

const STORAGE_KEY_TASKS = "lyhu_telesales_tasks";
const STORAGE_KEY_COLUMNS = "lyhu_telesales_columns_v1";

// --- TASKS ---

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

export const addTask = (taskInput: Omit<TelesalesTask, "id" | "createdAt" | "updatedAt" | "telesalesUserId" | "order"> & { telesalesUserId?: string }): TelesalesTask => {
    const tasks = loadTasks();
    const currentUser = getCurrentUser();

    // Generate simple ID
    const id = `TASK-${Date.now()}`;
    const now = new Date().toISOString();

    // Calculate generic order (append to end of list for simplicity, or specific column)
    const tasksInColumn = tasks.filter(t => t.status === taskInput.status);
    const maxOrder = tasksInColumn.length > 0 ? Math.max(...tasksInColumn.map(t => t.order || 0)) : -1;

    const newTask: TelesalesTask = {
        ...taskInput,
        id,
        order: maxOrder + 1,
        createdAt: now,
        updatedAt: now,
        telesalesUserId: taskInput.telesalesUserId || currentUser?.id || "unknown",
    };

    const updatedTasks = [newTask, ...tasks];
    saveTasks(updatedTasks);
    return newTask;
};

export const updateTask = (taskId: string, updates: Partial<TelesalesTask>) => {
    const tasks = loadTasks();
    const updatedTasks = tasks.map(t =>
        t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    );
    saveTasks(updatedTasks);
};

export const updateTasksOrder = (newTasks: TelesalesTask[]) => {
    saveTasks(newTasks);
}

export const deleteTask = (taskId: string) => {
    const tasks = loadTasks();
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    saveTasks(updatedTasks);
};

export const getMyTasks = (): TelesalesTask[] => {
    const tasks = loadTasks();
    const currentUser = getCurrentUser();
    if (!currentUser) return [];

    return tasks.filter(t => t.telesalesUserId === currentUser.id);
};

// --- COLUMNS ---

export const loadColumns = (): TelesalesColumn[] => {
    if (typeof window === "undefined") return DEFAULT_COLUMNS;
    try {
        const stored = localStorage.getItem(STORAGE_KEY_COLUMNS);
        if (!stored) {
            return DEFAULT_COLUMNS;
        }
        return JSON.parse(stored);
    } catch (error) {
        console.error("Failed to load columns:", error);
        return DEFAULT_COLUMNS;
    }
};

export const saveColumns = (columns: TelesalesColumn[]) => {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(columns));
        window.dispatchEvent(new Event("telesales-columns-updated"));
    } catch (error) {
        console.error("Failed to save columns:", error);
    }
};

export const addColumn = () => {
    const columns = loadColumns();
    const newId = `col-${Date.now()}`;
    const newColumn: TelesalesColumn = {
        id: newId,
        label: "Cột mới",
        order: columns.length,
        isDefault: false
    };
    saveColumns([...columns, newColumn]);
};

export const updateColumn = (id: string, updates: Partial<TelesalesColumn>) => {
    const columns = loadColumns();
    const newColumns = columns.map(c => c.id === id ? { ...c, ...updates } : c);
    saveColumns(newColumns);
};

export const reorderColumns = (newColumns: TelesalesColumn[]) => {
    // Re-assign order based on array index to be safe
    const ordered = newColumns.map((c, idx) => ({ ...c, order: idx }));
    saveColumns(ordered);
};

export const deleteColumn = (id: string) => {
    const columns = loadColumns();
    const columnToDelete = columns.find(c => c.id === id);
    if (!columnToDelete || columnToDelete.isDefault) return; // Can't delete default if enforced, logic might vary

    // Move tasks in this column to Inbox
    const tasks = loadTasks();
    const tasksToMove = tasks.filter(t => t.status === id);
    if (tasksToMove.length > 0) {
        const updatedTasks = tasks.map(t => t.status === id ? { ...t, status: 'inbox' } : t);
        saveTasks(updatedTasks);
    }

    const newColumns = columns.filter(c => c.id !== id);
    saveColumns(newColumns);
};
