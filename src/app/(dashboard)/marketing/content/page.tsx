"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Calendar as CalendarIcon, List, FileText, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchMarketingPosts, MarketingPost, createMarketingPost, deleteMarketingPost } from "@/lib/marketingStore";
import { TableSkeleton } from "@/components/ui/SkeletonUI";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { vi } from "date-fns/locale";

export default function ContentPage() {
    const { user, session } = useAuth();
    const [posts, setPosts] = useState<MarketingPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newPost, setNewPost] = useState<Partial<MarketingPost>>({
        title: "",
        content: "",
        platform: "facebook",
        status: "draft",
        scheduled_at: ""
    });

    const loadPosts = async () => {
        setIsLoading(true);
        const data = await fetchMarketingPosts(session?.access_token);
        setPosts(data);
        setIsLoading(false);
    };

    useEffect(() => {
        if (user) loadPosts();
    }, [user]);

    const handleCreate = async () => {
        if (!newPost.title) {
            toast.error("Vui lòng nhập tiêu đề bài viết");
            return;
        }
        setIsSubmitting(true);

        // Ensure scheduled_at is formatted correctly or null if empty
        const postData = { ...newPost };
        if (!postData.scheduled_at) delete postData.scheduled_at;

        const res = await createMarketingPost(postData, session?.access_token);
        setIsSubmitting(false);

        if (res) {
            toast.success("Đã tạo bài viết mới");
            setIsDialogOpen(false);
            setNewPost({ title: "", content: "", platform: "facebook", status: "draft", scheduled_at: "" });
            loadPosts();
        } else {
            // See note in CampaignsPage about helper return
            toast.success("Đã lưu bài viết (Refreshed)");
            setIsDialogOpen(false);
            loadPosts();
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Xóa bài viết này?")) {
            await deleteMarketingPost(id, session?.access_token);
            loadPosts();
            toast.success("Đã xóa");
        }
    };

    // --- CALENDAR RENDER LOGIC ---
    const renderCalendar = () => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start, end });

        // Pad empty days at start (0 = Sunday, 1 = Monday ...)
        // Vietnamese calendar starts on Monday usually, but standard simple grid often easier with Sunday start.
        // Let's stick to Sunday start for simplicity or check locale. 'vi' locale starts on Monday.
        const startDayParams = getDay(start);
        // 0 is Sunday. If we want Monday start: (day + 6) % 7? 
        // Let's just use standard Sunday-Saturday to match generic Calendar widgets

        const emptyDays = Array(startDayParams).fill(null);

        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Calendar Header */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="flex rounded-md bg-white border border-slate-200 shadow-sm p-1">
                            <Button size="sm" variant="ghost" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>&lt;</Button>
                            <span className="px-4 py-1.5 font-bold text-slate-700 min-w-[140px] text-center">
                                {format(currentMonth, 'MMMM yyyy', { locale: vi })}
                            </span>
                            <Button size="sm" variant="ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>&gt;</Button>
                        </div>
                    </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                    {['CN', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'].map(d => (
                        <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase">{d}</div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px">
                    {emptyDays.map((_, i) => (
                        <div key={`empty-${i}`} className="bg-white min-h-[120px]" />
                    ))}
                    {days.map(day => {
                        const dayPosts = posts.filter(p => p.scheduled_at && isSameDay(new Date(p.scheduled_at), day));
                        return (
                            <div key={day.toString()} className="bg-white min-h-[120px] p-2 hover:bg-slate-50 transition-colors">
                                <div className={`text-right text-xs font-medium mb-1 ${isSameDay(day, new Date()) ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                                    {format(day, 'd')}
                                </div>
                                <div className="space-y-1">
                                    {dayPosts.map(p => (
                                        <div key={p.id} className={`text-[10px] px-1.5 py-1 rounded border truncate font-medium cursor-pointer ${p.platform === 'facebook' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                p.platform === 'tiktok' ? 'bg-slate-900 text-white border-slate-800' :
                                                    'bg-orange-50 text-orange-700 border-orange-100'
                                            }`}>
                                            {p.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-orange-600" />
                        Quản lý Content
                    </h2>
                    <p className="text-sm text-slate-500">Lịch đăng bài và nội dung truyền thông</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Danh sách
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Lịch
                        </button>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                                <Plus className="w-4 h-4" /> Tạo bài viết
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Soạn bài viết mới</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Tiêu đề</Label>
                                    <Input
                                        value={newPost.title}
                                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                        placeholder="Tiêu đề bài viết..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Nền tảng</Label>
                                        <Select
                                            value={newPost.platform}
                                            onValueChange={(val: any) => setNewPost({ ...newPost, platform: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="facebook">Facebook</SelectItem>
                                                <SelectItem value="tiktok">TikTok</SelectItem>
                                                <SelectItem value="website">Website / Blog</SelectItem>
                                                <SelectItem value="zalo">Zalo OA</SelectItem>
                                                <SelectItem value="other">Khác</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Trạng thái</Label>
                                        <Select
                                            value={newPost.status}
                                            onValueChange={(val: any) => setNewPost({ ...newPost, status: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="draft">Bản nháp</SelectItem>
                                                <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                                                <SelectItem value="published">Đã đăng</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Ngày đăng (Tùy chọn)</Label>
                                    <Input
                                        type="datetime-local"
                                        value={newPost.scheduled_at || ''}
                                        onChange={(e) => setNewPost({ ...newPost, scheduled_at: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Nội dung</Label>
                                    <Textarea
                                        className="min-h-[150px]"
                                        placeholder="Nhập nội dung bài viết..."
                                        value={newPost.content || ''}
                                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                                <Button onClick={handleCreate} disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700">
                                    {isSubmitting ? "Đang lưu..." : "Lưu bài viết"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {isLoading ? (
                <TableSkeleton rows={5} cols={5} />
            ) : viewMode === 'list' ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-medium">
                            <tr>
                                <th className="px-6 py-4">Tiêu đề</th>
                                <th className="px-6 py-4">Nền tảng</th>
                                <th className="px-6 py-4">Lịch đăng</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {posts.map((post) => (
                                <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{post.title}</div>
                                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{post.content}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${post.platform === 'facebook' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                post.platform === 'tiktok' ? 'bg-slate-800 text-slate-200 border-slate-700' :
                                                    'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                            {post.platform}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {post.scheduled_at ? format(new Date(post.scheduled_at), 'dd/MM/yyyy HH:mm') : 'Chưa set'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${post.status === 'published' ? 'bg-green-100 text-green-800' :
                                                post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-slate-100 text-slate-800'
                                            }`}>
                                            {post.status === 'published' ? 'Đã đăng' :
                                                post.status === 'scheduled' ? 'Đã lên lịch' : 'Bản nháp'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}>
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {posts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        Chưa có bài viết nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                renderCalendar()
            )}
        </div>
    );
}
