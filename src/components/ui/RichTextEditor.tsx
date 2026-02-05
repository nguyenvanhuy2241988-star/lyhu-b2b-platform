'use client';

import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Placeholder from '@tiptap/extension-placeholder';
import { supabase } from '@/lib/supabaseClient';
import {
    Bold, Italic, Strikethrough, Link as LinkIcon, Image as ImageIcon,
    List, ListOrdered, Heading1, Heading2, Quote, Undo, Redo
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

interface RichTextEditorProps {
    content: string;
    onChange?: (content: string) => void;
    editable?: boolean;
    placeholder?: string;
}

export default function RichTextEditor({
    content,
    onChange,
    editable = true,
    placeholder = 'Nhập mô tả chi tiết...'
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image,
            Link.configure({
                openOnClick: false,
            }),
            TextStyle,
            Color,
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none focus:outline-none min-h-[150px]',
            },
        },
    });

    const addImage = useCallback(async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            if (input.files?.length) {
                const file = input.files[0];
                const fileName = `${Date.now()}-${file.name}`;

                // Upload to Supabase
                const { data, error } = await supabase.storage
                    .from('event-images')
                    .upload(fileName, file);

                if (error) {
                    alert('Lỗi upload ảnh: ' + error.message);
                    return;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('event-images')
                    .getPublicUrl(fileName);

                editor?.chain().focus().setImage({ src: publicUrl }).run();
            }
        };
        input.click();
    }, [editor]);

    if (!editor) {
        return null;
    }

    if (!editable) {
        return <EditorContent editor={editor} />;
    }

    return (
        <div className="relative border border-slate-200 rounded-xl bg-white p-4 group focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
            {/* Bubble Menu for Formatting */}
            {editor && (
                <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
                    <div className="bg-slate-900/90 backdrop-blur text-white flex items-center gap-1 p-1 rounded-lg shadow-xl border border-white/10">
                        <button
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={cn("p-1.5 rounded hover:bg-white/20 transition", editor.isActive('bold') && 'bg-white/20 text-teal-300')}
                        >
                            <Bold className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={cn("p-1.5 rounded hover:bg-white/20 transition", editor.isActive('italic') && 'bg-white/20 text-teal-300')}
                        >
                            <Italic className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            className={cn("p-1.5 rounded hover:bg-white/20 transition", editor.isActive('strike') && 'bg-white/20 text-teal-300')}
                        >
                            <Strikethrough className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-white/20 mx-1" />
                        <button
                            onClick={() => {
                                const url = window.prompt('URL:');
                                if (url) {
                                    editor.chain().focus().setLink({ href: url }).run();
                                }
                            }}
                            className={cn("p-1.5 rounded hover:bg-white/20 transition", editor.isActive('link') && 'bg-white/20 text-teal-300')}
                        >
                            <LinkIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().setColor('#0d9488').run()}
                            className={cn("p-1.5 rounded hover:bg-white/20 transition", editor.isActive('textStyle', { color: '#0d9488' }) && 'bg-white/20 text-teal-300')}
                        >
                            <div className="w-4 h-4 rounded-full bg-teal-600 border border-white" />
                        </button>
                    </div>
                </BubbleMenu>
            )}

            {/* Static Toolbar on top */}
            <div className="flex flex-wrap items-center gap-1 mb-3 border-b border-slate-100 pb-2">
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={cn("p-2 rounded hover:bg-slate-100 text-slate-600 transition", editor.isActive('heading', { level: 2 }) && 'bg-teal-50 text-teal-600')}
                >
                    <Heading1 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={cn("p-2 rounded hover:bg-slate-100 text-slate-600 transition", editor.isActive('heading', { level: 3 }) && 'bg-teal-50 text-teal-600')}
                >
                    <Heading2 className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={cn("p-2 rounded hover:bg-slate-100 text-slate-600 transition", editor.isActive('bulletList') && 'bg-teal-50 text-teal-600')}
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={cn("p-2 rounded hover:bg-slate-100 text-slate-600 transition", editor.isActive('orderedList') && 'bg-teal-50 text-teal-600')}
                >
                    <ListOrdered className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={cn("p-2 rounded hover:bg-slate-100 text-slate-600 transition", editor.isActive('blockquote') && 'bg-teal-50 text-teal-600')}
                >
                    <Quote className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <button
                    onClick={addImage}
                    className="p-2 rounded hover:bg-slate-100 text-slate-600 transition"
                    title="Thêm ảnh"
                >
                    <ImageIcon className="w-4 h-4" />
                </button>

                <div className="flex-1" />
                <div className="flex items-center gap-1 text-slate-400">
                    <button onClick={() => editor.chain().focus().undo().run()} className="p-2 hover:text-slate-700">
                        <Undo className="w-4 h-4" />
                    </button>
                    <button onClick={() => editor.chain().focus().redo().run()} className="p-2 hover:text-slate-700">
                        <Redo className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <EditorContent editor={editor} />
        </div>
    );
}
