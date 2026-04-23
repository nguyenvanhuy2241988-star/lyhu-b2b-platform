import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Clock, Tag, ChevronRight, ShoppingCart, UserCircle2, ArrowLeft } from 'lucide-react';
import { BlogPost } from '@/lib/blogStore';
import ReadingProgressBar from '@/components/blog/ReadingProgressBar';

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

    // Fetch related posts (same category)
    let relatedPosts: any[] = [];
    if (data.category_id) {
        const { data: related } = await supabase
            .from('blog_posts')
            .select('id, title, slug, thumbnail_url, published_at, created_at')
            .eq('category_id', data.category_id)
            .eq('status', 'published')
            .neq('id', data.id)
            .order('published_at', { ascending: false })
            .limit(3);
        relatedPosts = related || [];
    }

    return { post: data as BlogPost, relatedPosts };
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const data = await getPost(params.slug);
    
    if (!data) {
        return { title: 'Không tìm thấy bài viết' };
    }

    const { post } = data;
    const title = post.meta_title || post.title;
    const description = post.meta_description || post.ai_summary || post.content.substring(0, 160).replace(/<[^>]*>?/gm, '');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lyhu.com.vn';
    const postUrl = `${siteUrl}/tin-tuc/${post.slug}`;
    const imageUrl = post.thumbnail_url || `${siteUrl}/logo-full.png`;

    return {
        title,
        description,
        keywords: post.keywords || '',
        alternates: { canonical: postUrl },
        openGraph: {
            title,
            description,
            url: postUrl,
            siteName: 'LYHU B2B',
            images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
            locale: 'vi_VN',
            type: 'article',
            publishedTime: post.published_at || post.created_at,
        },
    };
}

export default async function BlogPostPage({ params }: Props) {
    const data = await getPost(params.slug);
    
    if (!data) notFound();
    const { post, relatedPosts } = data;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lyhu.com.vn';
    const postUrl = `${siteUrl}/tin-tuc/${post.slug}`;

    // Schema Logic
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
            logo: { '@type': 'ImageObject', url: `${siteUrl}/logo-full.png` }
        }
    };

    let faqSchema = null;
    const faqs = Array.isArray(post.faq_data) ? post.faq_data : [];
    if (faqs.length > 0) {
        faqSchema = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq: any) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer }
            }))
        };
    }

    return (
        <article className="min-h-screen bg-white">
            <ReadingProgressBar />

            {/* SEO Scripts */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
            {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}

            {/* Immersive Hero Header */}
            <div className="relative w-full h-[60vh] min-h-[500px] flex items-end">
                {post.thumbnail_url ? (
                    <div className="absolute inset-0 z-0">
                        <img 
                            src={post.thumbnail_url} 
                            alt={post.title} 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>
                    </div>
                ) : (
                    <div className="absolute inset-0 z-0 bg-primary-900">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    </div>
                )}
                
                {/* Back Button */}
                <Link href="/tin-tuc" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" /> Trở về Trang chủ
                </Link>

                <div className="relative z-10 w-full max-w-4xl mx-auto px-6 lg:px-8 pb-16">
                    {post.category && (
                        <span className="inline-block bg-primary-600/90 backdrop-blur-md text-white px-4 py-1.5 text-sm font-bold uppercase tracking-widest rounded-full mb-6">
                            {post.category.name}
                        </span>
                    )}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.15] mb-6 drop-shadow-lg">
                        {post.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-6 text-gray-300 font-medium">
                        <div className="flex items-center gap-2">
                            {post.author?.avatar_url ? (
                                <img src={post.author.avatar_url} className="w-8 h-8 rounded-full border-2 border-white/20" alt="Avatar" />
                            ) : (
                                <UserCircle2 className="w-8 h-8 opacity-80" />
                            )}
                            <span className="text-white">{post.author?.full_name || 'LYHU Team'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <time dateTime={post.published_at || post.created_at}>
                                {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </time>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col lg:flex-row gap-16">
                
                {/* Left Content */}
                <div className="flex-1 w-full max-w-3xl mx-auto lg:mx-0">
                    
                    {/* AEO Summary Block */}
                    {post.ai_summary && (
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100/50 mb-10 relative">
                            <div className="absolute -top-3 left-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                Nội dung chính
                            </div>
                            <p className="text-indigo-900/80 text-lg leading-relaxed font-medium mt-2">
                                {post.ai_summary}
                            </p>
                        </div>
                    )}

                    {/* Prose Content */}
                    <div 
                        className="prose prose-lg lg:prose-xl prose-slate max-w-none 
                        prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-900 
                        prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-100
                        prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                        prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-6
                        prose-a:text-primary-600 prose-a:no-underline hover:prose-a:text-primary-700 hover:prose-a:underline
                        prose-img:rounded-2xl prose-img:shadow-lg prose-img:my-10
                        prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl prose-blockquote:text-gray-700 prose-blockquote:not-italic"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* Tags */}
                    {post.keywords && (
                        <div className="mt-16 pt-8 border-t border-gray-100 flex items-center gap-3 flex-wrap">
                            <Tag className="w-5 h-5 text-gray-400" />
                            {post.keywords.split(',').map((kw, i) => (
                                <span key={i} className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-gray-200 cursor-default transition-colors">
                                    {kw.trim()}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Sticky Call to Action */}
                <aside className="w-full lg:w-[340px] shrink-0">
                    <div className="sticky top-24 space-y-8">
                        {/* B2B Promo Widget */}
                        <div className="bg-gradient-to-b from-primary-50 to-white rounded-3xl p-8 border border-primary-100/50 shadow-xl shadow-primary-900/5 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-200/50 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            
                            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-primary-50 flex items-center justify-center mx-auto mb-6 text-primary-600 relative z-10">
                                <ShoppingCart className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-3 relative z-10">Bạn là Chủ Tạp Hóa?</h3>
                            <p className="text-gray-600 text-base mb-8 relative z-10 leading-relaxed">
                                Đăng ký trở thành Đại lý phân phối của LYHU ngay hôm nay để nhận mức chiết khấu tận xưởng lên tới <strong className="text-primary-600">45%</strong>.
                            </p>
                            <Link 
                                href="/wholesale"
                                className="block w-full bg-primary-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary-600/30 hover:bg-primary-700 hover:-translate-y-1 transition-all duration-300 relative z-10"
                            >
                                Đăng Ký Lấy Sỉ
                            </Link>
                        </div>
                        
                        {/* Related Posts Widget */}
                        {relatedPosts.length > 0 && (
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    Bài viết cùng chuyên mục
                                </h3>
                                <div className="space-y-6">
                                    {relatedPosts.map(rp => (
                                        <Link key={rp.id} href={`/tin-tuc/${rp.slug}`} className="group flex gap-4">
                                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                                                {rp.thumbnail_url ? (
                                                    <img src={rp.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={rp.title} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-200 text-xs font-bold">LYHU</div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 text-sm group-hover:text-primary-600 transition-colors line-clamp-3 leading-tight mb-2">
                                                    {rp.title}
                                                </h4>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </article>
    );
}
