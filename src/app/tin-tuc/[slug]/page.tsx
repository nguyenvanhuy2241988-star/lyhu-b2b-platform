import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Clock, Tag, ChevronRight, ShoppingCart } from 'lucide-react';
import { BlogPost } from '@/lib/blogStore';

// Optional: ISR Revalidation
export const revalidate = 3600;

type Props = {
    params: { slug: string }
};

async function getPost(slug: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('blog_posts')
        .select(`
            *,
            category:blog_categories(id, name, slug),
            author:profiles(full_name, avatar_url)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
        
    if (error || !data) return null;
    return data as BlogPost;
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const post = await getPost(params.slug);
    
    if (!post) {
        return {
            title: 'Không tìm thấy bài viết',
        };
    }

    const title = post.meta_title || post.title;
    const description = post.meta_description || post.ai_summary || post.content.substring(0, 160).replace(/<[^>]*>?/gm, '');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lyhu.com.vn';
    const postUrl = `${siteUrl}/tin-tuc/${post.slug}`;
    const imageUrl = post.thumbnail_url || `${siteUrl}/logo-full.png`;

    return {
        title,
        description,
        keywords: post.keywords || '',
        alternates: {
            canonical: postUrl,
        },
        openGraph: {
            title,
            description,
            url: postUrl,
            siteName: 'LYHU B2B',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            locale: 'vi_VN',
            type: 'article',
            publishedTime: post.published_at || post.created_at,
        },
    };
}

export default async function BlogPostPage({ params }: Props) {
    const post = await getPost(params.slug);
    
    if (!post) {
        notFound();
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lyhu.com.vn';
    const postUrl = `${siteUrl}/tin-tuc/${post.slug}`;

    // Prepare JSON-LD (AEO/SEO)
    // 1. Article Schema
    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.meta_description || post.ai_summary,
        image: post.thumbnail_url ? [post.thumbnail_url] : [],
        datePublished: post.published_at || post.created_at,
        dateModified: post.updated_at,
        author: [{
            '@type': 'Person',
            name: post.author?.full_name || 'LYHU Team',
            url: siteUrl
        }],
        publisher: {
            '@type': 'Organization',
            name: 'LYHU',
            logo: {
                '@type': 'ImageObject',
                url: `${siteUrl}/logo-full.png`
            }
        }
    };

    // 2. FAQ Schema (if available)
    let faqSchema = null;
    const faqs = Array.isArray(post.faq_data) ? post.faq_data : [];
    if (faqs.length > 0) {
        faqSchema = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq: any) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.answer
                }
            }))
        };
    }

    return (
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            {faqSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />
            )}

            {/* Header / Thumbnail */}
            {post.thumbnail_url && (
                <div className="w-full aspect-[21/9] md:aspect-[21/7] relative bg-gray-100">
                    <img 
                        src={post.thumbnail_url} 
                        alt={post.title} 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 text-white">
                        {post.category && (
                            <span className="inline-block bg-primary-600 text-white px-3 py-1 text-sm font-semibold rounded-full mb-4">
                                {post.category.name}
                            </span>
                        )}
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                            {post.title}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-gray-200">
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span className="ml-1">{post.author?.full_name || 'LYHU Team'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 md:p-10 lg:p-12 max-w-4xl mx-auto flex flex-col lg:flex-row gap-12">
                {/* Main Content */}
                <div className="flex-1">
                    {!post.thumbnail_url && (
                        <div className="mb-10">
                            {post.category && (
                                <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 text-sm font-semibold rounded-full mb-4">
                                    {post.category.name}
                                </span>
                            )}
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
                                {post.title}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <span className="ml-1">{post.author?.full_name || 'LYHU Team'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI TL;DR (Visible or hidden depending on design. Let's make it a nice summary box) */}
                    {post.ai_summary && (
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-bl-lg">
                                AI Tóm Tắt
                            </div>
                            <p className="text-purple-900 font-medium leading-relaxed italic">
                                "{post.ai_summary}"
                            </p>
                        </div>
                    )}

                    {/* Rich Text Content */}
                    <div 
                        className="prose prose-lg prose-primary max-w-none prose-img:rounded-xl prose-headings:font-bold prose-a:text-primary-600 hover:prose-a:text-primary-700"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* Tags / Keywords */}
                    {post.keywords && (
                        <div className="mt-10 pt-6 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                            <Tag className="w-5 h-5 text-gray-400" />
                            {post.keywords.split(',').map((kw, i) => (
                                <span key={i} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                                    {kw.trim()}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar Sticky Call-to-action */}
                <aside className="w-full lg:w-72 shrink-0">
                    <div className="sticky top-24 bg-primary-50 rounded-2xl p-6 border border-primary-100">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-primary-600">
                            <ShoppingCart className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Nhập sỉ tận xưởng?</h3>
                        <p className="text-gray-600 text-sm mb-6">
                            Đăng ký đại lý LYHU ngay hôm nay để nhận chiết khấu lên tới 45% cùng nhiều ưu đãi hấp dẫn.
                        </p>
                        <Link 
                            href="/wholesale"
                            className="block w-full text-center bg-primary-600 text-white font-semibold py-3 rounded-xl shadow-md shadow-primary-200 hover:bg-primary-700 transition-colors"
                        >
                            Xem Bảng Giá Sỉ
                        </Link>
                        <p className="text-center text-xs text-gray-500 mt-4">Hỗ trợ vận chuyển toàn quốc</p>
                    </div>
                </aside>
            </div>
        </article>
    );
}
