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
        const filename = `chat_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `chat-attachments/${filename}`;

        // Convert to Uint8Array (works in both Node.js and Edge runtime)
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Try uploading to 'public-assets' bucket first, then 'public' as fallback
        let uploadResult = await supabase.storage
            .from('public-assets')
            .upload(path, uint8Array, {
                contentType: file.type,
                upsert: false
            });

        // If bucket doesn't exist, try 'public' bucket
        if (uploadResult.error && uploadResult.error.message?.includes('not found')) {
            console.log('public-assets bucket not found, trying public bucket...');
            uploadResult = await supabase.storage
                .from('public')
                .upload(path, uint8Array, {
                    contentType: file.type,
                    upsert: false
                });
        }

        if (uploadResult.error) {
            console.error('Upload error:', uploadResult.error);
            return NextResponse.json({
                error: `Upload failed: ${uploadResult.error.message}. Hãy tạo bucket 'public-assets' trong Supabase Storage.`
            }, { status: 500 });
        }

        // Get public URL from whichever bucket succeeded
        const bucketName = uploadResult.data?.path?.startsWith('public/') ? 'public' : 'public-assets';
        const { data: urlData } = supabase.storage
            .from(bucketName)
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
