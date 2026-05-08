import React from 'react';
import InlineProductBox from './InlineProductBox';
import BlogSidebarPromo from './BlogSidebarPromo';

interface DynamicBlogContentProps {
    content: string;
    videoUrl?: string | null;
    isVideoVertical?: boolean;
    products?: any[];
    promotions?: any[];
    showProductCards?: boolean;
}

export default function DynamicBlogContent({ content, videoUrl, isVideoVertical = false, products = [], promotions = [], showProductCards = true }: DynamicBlogContentProps) {
    if (!content) return null;

    // A simple parser to split HTML by block endings (paragraphs, lists).
    // We use a negative lookahead (?!\s*<\/li>) to ensure we DO NOT split inside a list item.
    // This prevents breaking the HTML structure of <ul> or <ol>.
    const parts = content.split(/(<\/p>|<\/ul>|<\/ol>)(?!\s*<\/li>)/i);
    const elements: React.ReactNode[] = [];
    let paragraphCount = 0;

    for (let i = 0; i < parts.length; i += 2) {
        // parts[i] is the content, parts[i+1] is the delimiter (</p>, </ul>, </ol>) if it exists
        const htmlChunk = parts[i] + (parts[i + 1] || '');
        
        if (htmlChunk.trim()) {
            elements.push(
                <div 
                    key={`chunk-${i}`} 
                    dangerouslySetInnerHTML={{ __html: htmlChunk }} 
                    className="mb-5"
                />
            );
            
            // If this chunk actually ended with a block delimiter, we consider it a paragraph block
            if (parts[i + 1]) {
                paragraphCount++;

                // Inject Video after the 1st paragraph
                if (paragraphCount === 1 && videoUrl) {
                    // Extract src from iframe string if user pasted embed code instead of raw URL
                    let finalUrl = videoUrl;
                    if (videoUrl.includes('<iframe')) {
                        const match = videoUrl.match(/src="([^"]+)"/);
                        if (match && match[1]) {
                            finalUrl = match[1];
                        }
                    } else if (videoUrl.includes('drive.google.com/file/d/')) {
                        // Convert Google Drive view link to preview link
                        const match = videoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                        if (match && match[1]) {
                            finalUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
                        }
                    } else if (videoUrl.includes('youtube.com/watch?v=')) {
                        // Convert standard youtube link to embed link
                        const match = videoUrl.match(/v=([^&]+)/);
                        if (match && match[1]) {
                            finalUrl = `https://www.youtube.com/embed/${match[1]}`;
                        }
                    } else if (videoUrl.includes('youtube.com/shorts/')) {
                        // Convert youtube shorts link to embed link
                        const match = videoUrl.match(/shorts\/([^?]+)/);
                        if (match && match[1]) {
                            finalUrl = `https://www.youtube.com/embed/${match[1]}`;
                        }
                    } else if (videoUrl.includes('youtu.be/')) {
                        // Convert short youtube link to embed link
                        const match = videoUrl.match(/youtu\.be\/([^?]+)/);
                        if (match && match[1]) {
                            finalUrl = `https://www.youtube.com/embed/${match[1]}`;
                        }
                    } else if (videoUrl.includes('tiktok.com/')) {
                        // Convert standard tiktok link to embed link
                        const match = videoUrl.match(/\/video\/(\d+)/);
                        if (match && match[1]) {
                            finalUrl = `https://www.tiktok.com/embed/v2/${match[1]}`;
                        }
                    }

                    const videoClasses = isVideoVertical 
                        ? "my-8 w-full max-w-sm mx-auto aspect-[9/16] rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-black"
                        : "my-8 w-full aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-black";

                    elements.push(
                        <div key="video-embed" className={videoClasses}>
                            <iframe 
                                src={finalUrl} 
                                className="w-full h-full"
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowFullScreen
                            ></iframe>
                        </div>
                    );
                }

                // Inject Promo Banner after 3rd paragraph ONLY for Mobile screens
                if (paragraphCount === 3 && promotions.length > 0) {
                    const activePromo = promotions.find(p => p.type === 'promotion' || !p.discount_type) || promotions[0];
                    if (activePromo) {
                        elements.push(
                            <div key="mobile-promo" className="my-8 block lg:hidden w-full max-w-md mx-auto relative z-10">
                                <BlogSidebarPromo promo={activePromo} />
                            </div>
                        );
                    }
                }

                // Inject 1st Product after the 8th paragraph (after criteria/intro)
                if (showProductCards && paragraphCount === 8 && products.length > 0) {
                    elements.push(
                        <InlineProductBox key="product-0" product={products[0]} />
                    );
                }

                // Inject 2nd Product after the 14th paragraph
                if (showProductCards && paragraphCount === 14 && products.length > 1) {
                    elements.push(
                        <InlineProductBox key="product-1" product={products[1]} />
                    );
                }
                
                // Inject 3rd Product after the 20th paragraph
                if (showProductCards && paragraphCount === 20 && products.length > 2) {
                    elements.push(
                        <InlineProductBox key="product-2" product={products[2]} />
                    );
                }
            }
        }
    }

    return (
        <div 
            className="prose prose-base sm:prose-lg prose-slate max-w-none 
            prose-headings:font-bold prose-headings:text-primary-800 
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-gray-800 prose-p:leading-relaxed prose-p:mb-0
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-lg prose-img:border prose-img:border-gray-200 prose-img:mx-auto
            prose-blockquote:border-l-4 prose-blockquote:border-primary-400 prose-blockquote:bg-primary-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic prose-blockquote:text-gray-700"
        >
            {elements.length > 0 ? elements : <div dangerouslySetInnerHTML={{ __html: content }} />}
        </div>
    );
}
