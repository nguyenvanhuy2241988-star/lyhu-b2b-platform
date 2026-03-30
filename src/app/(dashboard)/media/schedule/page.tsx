import CalendarView from "@/components/telesales/calendar/CalendarView";

export default function MediaSchedulePage() {
    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-slate-900">Lịch làm việc</h1>
                <p className="text-slate-500 text-sm">Quản lý lịch hẹn, lịch chụp/quay và các đầu việc trong tháng</p>
            </div>
            <div className="flex-1 min-h-0">
                <CalendarView />
            </div>
        </div>
    );
}
