'use client';

import { useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function ViewCounter({ postId }: { postId: string }) {
    useEffect(() => {
        if (!postId) return;
        
        // Prevent counting views in local development if desired, but here we just count always
        const countView = async () => {
            // Using the RPC function we created
            const { error } = await supabaseBrowser.rpc('increment_blog_view', { post_id: postId });
            if (error) {
                console.error('Error incrementing view count:', error);
            }
        };

        // Delay slightly to ensure it's a real view and not a bot instant-bounce
        const timer = setTimeout(() => {
            countView();
        }, 3000);

        return () => clearTimeout(timer);
    }, [postId]);

    return null; // This component doesn't render anything
}
