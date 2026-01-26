-- Migration: Reward Store
-- Purpose: Store rewards and user redemptions

-- 1. Rewards Table
CREATE TABLE IF NOT EXISTS public.entertainment_rewards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL, -- "Voucher 50k", "Đi muộn 15p"
    description text,
    cost int NOT NULL, -- Point cost
    image_url text, -- Icon/Image
    stock int DEFAULT -1, -- -1 for infinite
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 2. User Redemptions
CREATE TABLE IF NOT EXISTS public.user_redemptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_id uuid REFERENCES public.entertainment_rewards(id),
    cost int NOT NULL, -- Snapshot of cost at time of purchase
    status text DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, USED
    redeemed_at timestamptz DEFAULT now()
);

-- 3. RLS
ALTER TABLE public.entertainment_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_redemptions ENABLE ROW LEVEL SECURITY;

-- Rewards: Everyone view
CREATE POLICY "Everyone view active rewards" ON public.entertainment_rewards FOR SELECT USING (is_active = true);

-- Redemptions: Users view own
CREATE POLICY "Users view own redemptions" ON public.user_redemptions FOR SELECT USING (auth.uid() = user_id);
-- Redemptions: Users insert
CREATE POLICY "Users redeem reward" ON public.user_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Seed Rewards
INSERT INTO public.entertainment_rewards (name, description, cost, image_url) VALUES
('Thẻ nạp 50k', 'Thẻ điện thoại 50.000đ (Viettel/Vina/Mobi)', 5000, 'Smartphone'),
('Đi muộn 15p', 'Phiếu miễn phạt đi muộn 15 phút (Dùng 1 lần)', 2000, 'Clock'),
('Về sớm 30p', 'Phiếu về sớm 30 phút (Cần báo trước Manager)', 5000, 'Sunset'),
('Cafe Phúc Long', 'Voucher Phúc Long 50k', 6000, 'Coffee'),
('Trà sữa Gongcha', 'Voucher Gongcha 50k', 6000, 'CupSoda'),
('Sai vặt Admin', 'Quyền được nhờ Admin làm giúp 1 việc vặt', 10000, 'Crown')
ON CONFLICT DO NOTHING;
