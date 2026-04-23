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
            <header className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-800 leading-snug mb-6">
                    {post.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        {post.author?.avatar_url ? (
                            <img src={post.author.avatar_url} className="w-6 h-6 rounded-full border border-gray-200" alt="Avatar" />
                        ) : (
                            <UserCircle2 className="w-6 h-6 text-gray-400" />
                        )}
                        <span className="text-gray-700 font-medium">{post.author?.full_name || 'LYHU Team'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <time dateTime={post.published_at || post.created_at}>
                            {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}
                        </time>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-10">
                
                {/* Left Content */}
                <div className="flex-1 w-full max-w-3xl mx-auto lg:mx-0">
                    
                    {/* AEO Summary Block */}
                    {post.ai_summary && (
                        <div className="bg-gray-50 p-5 rounded border-l-4 border-primary-500 mb-8">
                            <p className="text-gray-800 font-medium text-sm leading-relaxed">
                                <strong>Tóm tắt: </strong>
                                {post.ai_summary}
                            </p>
                        </div>
                    )}

                    {/* Featured Image (Mobile Friendly 16:9) */}
                    {post.thumbnail_url && (
                        <div className="w-full mb-10">
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100">
                                <img 
                                    src={post.thumbnail_url} 
                                    alt={post.title} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <p className="text-center text-xs text-gray-400 mt-2 italic">{post.title}</p>
                        </div>
                    )}

                    {/* Prose Content */}
                    <div 
                        className="prose prose-base sm:prose-lg prose-slate max-w-none 
                        prose-headings:font-bold prose-headings:text-primary-800 
                        prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                        prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                        prose-p:text-gray-800 prose-p:leading-relaxed prose-p:mb-5
                        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-lg prose-img:border prose-img:border-gray-200 prose-img:mx-auto
                        prose-blockquote:border-l-4 prose-blockquote:border-primary-400 prose-blockquote:bg-primary-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic prose-blockquote:text-gray-700"
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

                    {/* Related text links (Có thể bạn quan tâm) */}
                    {relatedPosts.length > 0 && (
                        <div className="mt-10 bg-primary-50/50 p-6 rounded-lg border border-primary-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Có thể bạn quan tâm:</h3>
                            <ul className="space-y-3">
                                {relatedPosts.map(rp => (
                                    <li key={rp.id} className="flex items-start gap-2">
                                        <span className="text-primary-500 mt-1">•</span>
                                        <Link href={`/tin-tuc/${rp.slug}`} className="text-blue-700 hover:text-blue-800 hover:underline font-medium">
                                            {rp.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Comments Placeholder */}
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Bình luận</h3>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <textarea 
                                className="w-full bg-white border border-gray-300 rounded p-3 text-sm focus:outline-none focus:border-primary-500 resize-none h-24"
                                placeholder="Mời bạn bình luận hoặc đặt câu hỏi..."
                            ></textarea>
                            <div className="mt-3 flex justify-end">
                                <button className="bg-primary-600 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-primary-700">
                                    Gửi bình luận
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - eCommerce Practical Style */}
                <aside className="w-full lg:w-[320px] shrink-0">
                    <div className="sticky top-24 space-y-6">
                        {/* B2B Promo Widget (Replacing generic banner) */}
                        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg p-5 text-white shadow-md relative overflow-hidden">
                            <div className="relative z-10">
                                <span className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded mb-3">KHUYẾN MÃI SỈ</span>
                                <h3 className="text-xl font-bold mb-2">Đại Hội Nhập Sỉ Lớn Nhất Năm</h3>
                                <ul className="text-sm space-y-2 mb-5 text-primary-100">
                                    <li>• Đơn từ 500K: Tặng 1 lốc bia</li>
                                    <li>• Đơn từ 1 Triệu: Chiết khấu 5%</li>
                                    <li>• Giảm 15.000đ phí vận chuyển</li>
                                </ul>
                                <Link 
                                    href="/wholesale"
                                    className="block w-full bg-white text-primary-700 text-center font-bold text-sm py-2.5 rounded hover:bg-gray-50 transition-colors"
                                >
                                    ĐẶT HÀNG NGAY
                                </Link>
                            </div>
                        </div>
                        
                        {/* Related Products / Categories Widget */}
                        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                            <h3 className="text-base font-bold text-gray-900 p-4 border-b border-gray-100 bg-gray-50 uppercase">
                                Danh mục bán chạy
                            </h3>
                            <div className="divide-y divide-gray-100">
                                <Link href="/wholesale?category=banh-keo" className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
                                    <div className="w-12 h-12 bg-gray-100 rounded object-cover overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?q=80&w=200&auto=format&fit=crop" alt="Kẹo" />
                                    </div>
                                    <span className="font-semibold text-sm text-gray-700">Bánh kẹo các loại</span>
                                </Link>
                                <Link href="/wholesale?category=nuoc-giai-khat" className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
                                    <div className="w-12 h-12 bg-gray-100 rounded object-cover overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=200&auto=format&fit=crop" alt="Nước ngọt" />
                                    </div>
                                    <span className="font-semibold text-sm text-gray-700">Nước giải khát</span>
                                </Link>
                                <Link href="/wholesale?category=do-kho" className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
                                    <div className="w-12 h-12 bg-gray-100 rounded object-cover overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1596647414995-17e929b9514e?q=80&w=200&auto=format&fit=crop" alt="Đồ khô" />
                                    </div>
                                    <span className="font-semibold text-sm text-gray-700">Gạo, mì, đồ khô</span>
                                </Link>
                            </div>
                            <Link href="/wholesale" className="block text-center text-sm font-medium text-primary-600 p-3 bg-gray-50 hover:bg-gray-100">
                                Xem tất cả sản phẩm
                            </Link>
                        </div>
                    </div>
                </aside>
            </div>
        </article>
    );
}
