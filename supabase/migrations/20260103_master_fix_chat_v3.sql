-- MASTER FIX CHAT V3 (NUCLEAR)

-- 1. Đảm bảo các cột thuộc tính phòng chat tồn tại (Sửa lỗi 400 'created_by')
DO $$ 
BEGIN
    -- Thêm cột created_by nếu thiếu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internal_conversations' AND column_name='created_by') THEN
        ALTER TABLE public.internal_conversations ADD COLUMN created_by uuid REFERENCES auth.users(id);
    END IF;

    -- Thêm cột is_public nếu thiếu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internal_conversations' AND column_name='is_public') THEN
        ALTER TABLE public.internal_conversations ADD COLUMN is_public boolean DEFAULT false;
    END IF;

    -- Thêm cột direct_key nếu thiếu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internal_conversations' AND column_name='direct_key') THEN
        ALTER TABLE public.internal_conversations ADD COLUMN direct_key text;
    END IF;

    -- Đảm bảo cột name tồn tại
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internal_conversations' AND column_name='name') THEN
        ALTER TABLE public.internal_conversations ADD COLUMN name text;
    END IF;
END $$;

-- 2. Cấp quyền truy cập cho Profiles (Fix lỗi không hiện nhân viên)
DROP POLICY IF EXISTS "profiles_read_all_v3" ON public.profiles;
CREATE POLICY "profiles_read_all_v3"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- 3. Cấp quyền thực thi các hàm RPC quan trọng
GRANT EXECUTE ON FUNCTION public.get_conversations_with_unread(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO authenticated;

-- 4. Re-create RPC function get_or_create_direct_conversation để đảm bảo nó dùng đúng các cột mới
CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  me uuid := auth.uid();
  low uuid;
  high uuid;
  k text;
  conv_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if target_user_id is null then
    raise exception 'target_user_id is required';
  end if;
  if target_user_id = me then
    raise exception 'Cannot create direct conversation with yourself';
  end if;

  low := least(me, target_user_id);
  high := greatest(me, target_user_id);
  k := low::text || '_' || high::text;

  -- Sử dụng cột direct_key để tránh tạo trùng lặp
  INSERT INTO public.internal_conversations(type, created_by, is_public, name, direct_key, last_message_at)
  VALUES ('direct', me, false, null, k, now())
  ON CONFLICT (direct_key) DO UPDATE
    SET last_message_at = greatest(public.internal_conversations.last_message_at, EXCLUDED.last_message_at)
  RETURNING id INTO conv_id;

  INSERT INTO public.internal_participants(conversation_id, user_id)
  VALUES (conv_id, me), (conv_id, target_user_id)
  ON CONFLICT DO NOTHING;

  RETURN conv_id;
END $$;

-- 5. Kích hoạt Realtime (RE-VERIFY)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_conversations;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_participants;
EXCEPTION WHEN others THEN
    NULL;
END $$;
