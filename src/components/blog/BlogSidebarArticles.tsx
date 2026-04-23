import Link from 'next/link';

export default function BlogSidebarArticles({ articles }: { articles: any[] }) {
    if (!articles || articles.length === 0) return null;

    return (
        <div className="border border-gray-100 rounded-xl bg-white overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
            <h3 className="text-base font-bold text-gray-900 p-5 border-b border-gray-100 flex items-center justify-between">
                Khám phá thêm
                <span className="text-xs font-normal text-primary-600 hover:underline cursor-pointer">Xem thêm</span>
            </h3>
            <div className="divide-y divide-gray-50">
                {articles.map(article => (
                    <Link key={article.id} href={`/tin-tuc/${article.slug}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
                        <div className="w-16 h-16 bg-gray-50 rounded-lg object-cover overflow-hidden border border-gray-100 shrink-0">
                            {article.thumbnail_url ? (
                                <img 
                                    src={article.thumbnail_url} 
                                    alt={article.title} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">LYHU</div>
                            )}
                        </div>
                        <div>
                            <span className="font-semibold text-sm text-gray-800 line-clamp-2 group-hover:text-primary-600 transition-colors">
                                {article.title}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
