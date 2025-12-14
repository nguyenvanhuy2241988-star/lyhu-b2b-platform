import { getCurrentUser } from "./auth";

export type TaskStatus = 'inbox' | 'today' | 'tomorrow' | 'this_week' | 'later' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskType = 'call_new_lead' | 'follow_up_lead' | 'confirm_order' | 'care_old_customer' | 'other';

export interface TelesalesTask {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    type: TaskType;
    priority: TaskPriority;
    telesalesUserId: string;
    relatedLeadId?: string;
    relatedCustomerId?: string;
    relatedOrderId?: string;
    phone?: string;
    customerName?: string;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    lastResult?: string;
    nextActionDate?: string;
    tags?: string[];
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
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
        type: "follow_up_lead",
        priority: "low",
        telesalesUserId: "2",
        customerName: "Căng tin ĐH Quốc Gia",
        phone: "0998887774",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "TASK-005",
        title: "Gọi lại Tạp hóa Bác Ba",
        status: "this_week",
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

const STORAGE_KEY = "lyhu_telesales_tasks";

export const loadTasks = (): TelesalesTask[] => {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        window.dispatchEvent(new Event("telesales-tasks-updated"));
    } catch (error) {
        console.error("Failed to save tasks:", error);
    }
};

export const addTask = (taskInput: Omit<TelesalesTask, "id" | "createdAt" | "updatedAt" | "telesalesUserId"> & { telesalesUserId?: string }): TelesalesTask => {
    const tasks = loadTasks();
    const currentUser = getCurrentUser();

    // Generate simple ID
    const id = `TASK-${Date.now()}`;
    const now = new Date().toISOString();

    const newTask: TelesalesTask = {
        ...taskInput,
        id,
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
