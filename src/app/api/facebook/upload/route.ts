import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Max 25MB (Facebook limit)
        if (file.size > 25 * 1024 * 1024) {
            return NextResponse.json({ error: 'File quá lớn (tối đa 25MB)' }, { status: 400 });
        }

        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            auth: { persistSession: false }
        });

        // Generate unique filename
        const ext = file.name.split('.').pop() || 'bin';
        const filename = `social_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `social/${filename}`;

        // Convert to Uint8Array (works in both Node.js and Edge runtime)
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Use existing 'chat-attachments' bucket (already configured in project)
        const { data, error } = await supabase.storage
            .from('chat-attachments')
            .upload(path, uint8Array, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Upload error:', error);
            return NextResponse.json({
                error: `Upload failed: ${error.message}`
            }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(path);

        // Determine type
        let type = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            type,
            name: file.name,
            size: file.size
        });

    } catch (error: any) {
        console.error('Upload API Error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
