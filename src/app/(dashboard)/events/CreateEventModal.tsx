'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface CreateEventModalProps {
    onSuccess?: () => void;
}

export default function CreateEventModal({ onSuccess }: CreateEventModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        event_type: "other",
        start_date: "",
        start_time: "09:00",
        end_date: "",
        end_time: "17:00",
        location: "",
        banner_url: "",
        budget_total: 0
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Combine date and time
            const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
            const endDateTime = new Date(`${formData.end_date || formData.start_date}T${formData.end_time}`);

            const { data, error } = await supabase
                .from('hr_events')
                .insert({
                    title: formData.title,
                    description: formData.description,
                    event_type: formData.event_type,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    location: formData.location,
                    banner_url: formData.banner_url || null,
                    budget_total: formData.budget_total,
                    status: 'draft' // Default to draft
                })
                .select()
                .single();

            if (error) throw error;

            setOpen(false);
            // Reset form
            setFormData({
                title: "",
                description: "",
                event_type: "other",
                start_date: "",
                start_time: "09:00",
                end_date: "",
                end_time: "17:00",
                location: "",
                banner_url: "",
                budget_total: 0
            });

            if (onSuccess) onSuccess();
            router.refresh();

            // Redirect to the new event detail page to continue editing
            if (data?.id) {
                router.push(`/events/${data.id}`);
            }

        } catch (error: any) {
            console.error(error);
            alert("Lỗi khi tạo sự kiện: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo sự kiện mới
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Lên kế hoạch sự kiện mới</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label>Tên sự kiện <span className="text-red-500">*</span></Label>
                            <Input
                                required
                                placeholder="Ví dụ: Tiệc Tất Niên 2026"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Loại sự kiện <span className="text-red-500">*</span></Label>
                            <Select
                                value={formData.event_type}
                                onValueChange={(val) => setFormData({ ...formData, event_type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="party">Tiệc / Liên hoan</SelectItem>
                                    <SelectItem value="birthday">Sinh nhật</SelectItem>
                                    <SelectItem value="teambuilding">Team Building / Du lịch</SelectItem>
                                    <SelectItem value="meeting">Họp mặt / Đào tạo</SelectItem>
                                    <SelectItem value="holiday">Ngày lễ</SelectItem>
                                    <SelectItem value="other">Khác</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Địa điểm <span className="text-red-500">*</span></Label>
                            <Input
                                required
                                placeholder="Tại văn phòng, Nhà hàng ABC..."
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Ngày bắt đầu <span className="text-red-500">*</span></Label>
                            <Input
                                type="date"
                                required
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Giờ bắt đầu</Label>
                            <Input
                                type="time"
                                required
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Ngày kết thúc</Label>
                            <Input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                placeholder="Bỏ trống nếu trong ngày"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Giờ kết thúc</Label>
                            <Input
                                type="time"
                                required
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label>Ảnh bìa (URL)</Label>
                            <Input
                                placeholder="https://..."
                                value={formData.banner_url}
                                onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                            />
                            <p className="text-xs text-slate-500">Gợi ý: Dùng link ảnh từ Unsplash hoặc upload lên kho ảnh.</p>
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label>Ngân sách dự kiến (VNĐ)</Label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.budget_total}
                                onChange={(e) => setFormData({ ...formData, budget_total: Number(e.target.value) })}
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label>Mô tả chi tiết</Label>
                            <Textarea
                                placeholder="Nội dung chương trình, lưu ý..."
                                className="min-h-[100px]"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Tạo kế hoạch
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
