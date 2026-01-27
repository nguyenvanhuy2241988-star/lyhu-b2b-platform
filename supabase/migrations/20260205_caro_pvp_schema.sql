-- Migration: Caro PvP Schema
-- Purpose: Support Realtime Player vs Player Caro

-- 1. Caro Rooms Table
CREATE TABLE IF NOT EXISTS public.caro_rooms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    player1_id uuid REFERENCES public.profiles(id) NOT NULL,
    player2_id uuid REFERENCES public.profiles(id), -- Nullable initially
    
    status text DEFAULT 'WAITING', -- 'WAITING', 'PLAYING', 'FINISHED'
    current_turn uuid, -- ID of the player whose turn it is
    winner_id uuid REFERENCES public.profiles(id),
    
    board_state jsonb DEFAULT '[]'::jsonb, -- 2D array or move history
    last_move jsonb, -- {row, col, value}
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. RLS
ALTER TABLE public.caro_rooms ENABLE ROW LEVEL SECURITY;

-- View: Everyone can see WAITING rooms (Lobby), Players can see their own PLAYING/FINISHED rooms
CREATE POLICY "View rooms" ON public.caro_rooms
    FOR SELECT
    USING (
        status = 'WAITING' 
        OR auth.uid() = player1_id 
        OR auth.uid() = player2_id
    );

-- Create: Authenticated users can create rooms
CREATE POLICY "Create room" ON public.caro_rooms
    FOR INSERT
    WITH CHECK (auth.uid() = player1_id);

-- Update: Players can update the room (Join, Move, Finish)
-- Strict checks should be enforced by app logic, but RLS prevents randoms from messing up.
CREATE POLICY "Update room" ON public.caro_rooms
    FOR UPDATE
    USING (auth.uid() = player1_id OR auth.uid() = player2_id OR (status = 'WAITING' AND player2_id IS NULL)); 

-- 3. Functions (Optional, but handy for clean atomic joins)
-- Join Room Transaction
CREATE OR REPLACE FUNCTION public.join_caro_room(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_room public.caro_rooms%ROWTYPE;
BEGIN
    -- Lock room
    SELECT * INTO v_room FROM public.caro_rooms WHERE id = p_room_id FOR UPDATE;
    
    IF NOT FOUND THEN RAISE EXCEPTION 'Room not found'; END IF;
    IF v_room.status != 'WAITING' THEN RAISE EXCEPTION 'Room is full or playing'; END IF;
    IF v_room.player1_id = auth.uid() THEN RAISE EXCEPTION 'Cannot play against yourself'; END IF;

    -- Update room
    UPDATE public.caro_rooms 
    SET player2_id = auth.uid(),
        status = 'PLAYING',
        current_turn = v_room.player1_id, -- Player 1 moves first (X)
        updated_at = now()
    WHERE id = p_room_id;

    RETURN '{"success": true}'::jsonb;
END;
$$;
