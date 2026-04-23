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

    // Fetch related posts
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
    if (!data) return { title: 'Không tìm thấy bài viết' };

    const { post } = data;
    const title = post.meta_title || post.title;
    const description = post.meta_description || post.ai_summary || post.content.substring(0, 160).replace(/<[^>]*>?/gm, '');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lyhu.com.vn';
    const postUrl = `${siteUrl}/tin-tuc/${post.slug}`;
    const imageUrl = post.thumbnail_url || `${siteUrl}/logo-full.png`;

    return {
        title, description, keywords: post.keywords || '',
        alternates: { canonical: postUrl },
        openGraph: {
            title, description, url: postUrl, siteName: 'LYHU B2B',
            images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
            locale: 'vi_VN', type: 'article',
            publishedTime: post.published_at || post.created_at,
        },
    };
}

export default async function BlogPostPage({ params }: Props) {
    const data = await getPost(params.slug);
    if (!data) notFound();
    const { post, relatedPosts } = data;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lyhu.com.vn';

    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.meta_description || post.ai_summary,
        image: post.thumbnail_url ? [post.thumbnail_url] : [],
        datePublished: post.published_at || post.created_at,
        dateModified: post.updated_at,
        author: [{ '@type': 'Person', name: post.author?.full_name || 'LYHU Team', url: siteUrl }],
        publisher: { '@type': 'Organization', name: 'LYHU', logo: { '@type': 'ImageObject', url: `${siteUrl}/logo-full.png` } }
    };

    let faqSchema = null;
    const faqs = Array.isArray(post.faq_data) ? post.faq_data : [];
    if (faqs.length > 0) {
        faqSchema = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq: any) => ({
                '@type': 'Question', name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer }
            }))
        };
    }

    return (
        <article className="min-h-screen bg-white pb-20">
            <ReadingProgressBar />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
            {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}

            {/* Breadcrumb / Back Navigation */}
            <div className="max-w-4xl mx-auto px-6 lg:px-8 pt-8 pb-6 border-b border-gray-100 flex items-center justify-between">
                <Link href="/tin-tuc" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 font-medium transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Về Góc Kiến Thức
                </Link>
                {post.category && (
                    <span className="text-sm font-bold text-primary-600 uppercase tracking-widest">
                        {post.category.name}
                    </span>
                )}
            </div>

            {/* Clean Header Area */}
            <header className="max-w-4xl mx-auto px-6 lg:px-8 py-10">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-8">
                    {post.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-medium">
                    <div className="flex items-center gap-2">
                        {post.author?.avatar_url ? (
                            <img src={post.author.avatar_url} className="w-8 h-8 rounded-full border border-gray-200" alt="Avatar" />
                        ) : (
                            <UserCircle2 className="w-8 h-8 text-gray-400" />
                        )}
                        <span className="text-gray-800 font-bold">{post.author?.full_name || 'LYHU Team'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <time dateTime={post.published_at || post.created_at}>
                            {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </time>
                    </div>
                </div>
            </header>

            {/* Featured Image */}
            {post.thumbnail_url && (
                <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 mb-12">
                    <div className="aspect-[21/9] w-full rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
                        <img 
                            src={post.thumbnail_url} 
                            alt={post.title} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-16">
                
                {/* Left Content */}
                <div className="flex-1 w-full max-w-3xl mx-auto lg:mx-0">
                    
                    {/* AEO Summary Block (Clean style) */}
                    {post.ai_summary && (
                        <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 mb-10">
                            <p className="text-primary-900 font-medium leading-relaxed">
                                <strong className="text-primary-700 mr-2">Tóm tắt:</strong>
                                {post.ai_summary}
                            </p>
                        </div>
                    )}

                    {/* Prose Content */}
                    <div 
                        className="prose prose-lg prose-slate max-w-none 
                        prose-headings:font-bold prose-headings:text-gray-900 
                        prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                        prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                        prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-6
                        prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-xl prose-img:border prose-img:border-gray-100
                        prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-500"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* Tags */}
                    {post.keywords && (
                        <div className="mt-12 pt-6 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                            <Tag className="w-4 h-4 text-gray-400" />
                            {post.keywords.split(',').map((kw, i) => (
                                <span key={i} className="bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1 rounded text-sm font-medium">
                                    {kw.trim()}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Minimalist Call to Action */}
                <aside className="w-full lg:w-[320px] shrink-0">
                    <div className="sticky top-24 space-y-8">
                        {/* B2B Promo Widget */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center">
                            <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
                                <ShoppingCart className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Đăng ký Đại lý</h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                Trở thành đối tác phân phối của LYHU để nhận bảng giá sỉ và các chính sách chiết khấu tốt nhất.
                            </p>
                            <Link 
                                href="/wholesale"
                                className="block w-full bg-primary-600 text-white font-bold text-sm py-3 rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Liên hệ Báo Giá
                            </Link>
                        </div>
                        
                        {/* Related Posts Widget */}
                        {relatedPosts.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
                                    Bài viết cùng chuyên mục
                                </h3>
                                <div className="space-y-5">
                                    {relatedPosts.map(rp => (
                                        <Link key={rp.id} href={`/tin-tuc/${rp.slug}`} className="group flex gap-3">
                                            <div className="w-20 h-20 rounded bg-gray-100 shrink-0 border border-gray-100 overflow-hidden">
                                                {rp.thumbnail_url && (
                                                    <img src={rp.thumbnail_url} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" alt={rp.title} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-800 text-sm group-hover:text-primary-600 transition-colors line-clamp-2 leading-tight mb-1">
                                                    {rp.title}
                                                </h4>
                                                <div className="text-xs text-gray-400">
                                                    {new Date(rp.published_at || rp.created_at).toLocaleDateString('vi-VN')}
                                                </div>
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
