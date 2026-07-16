'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
    currentPage: number;
    totalPages: number;
};

export default function Pagination({ currentPage, totalPages }: Props) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    if (totalPages <= 1) return null;

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    const getVisiblePages = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        if (currentPage <= 4) {
            return [1, 2, 3, 4, 5, '...', totalPages];
        }

        if (currentPage >= totalPages - 3) {
            return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }

        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    const visiblePages = getVisiblePages();

    return (
        <div className="flex items-center justify-center gap-1 sm:gap-2 mt-12">
            {/* Prev Button */}
            {currentPage > 1 ? (
                <Link 
                    href={createPageURL(currentPage - 1)}
                    className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Link>
            ) : (
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed">
                    <ChevronLeft className="w-5 h-5" />
                </div>
            )}

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
                {visiblePages.map((page, index) => {
                    if (page === '...') {
                        return (
                            <span key={`ellipsis-${index}`} className="flex items-center justify-center w-6 sm:w-8 h-8 sm:h-10 text-gray-500">
                                ...
                            </span>
                        );
                    }

                    return (
                        <Link
                            key={page}
                            href={createPageURL(page as number)}
                            className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                                currentPage === page
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {page}
                        </Link>
                    );
                })}
            </div>

            {/* Next Button */}
            {currentPage < totalPages ? (
                <Link 
                    href={createPageURL(currentPage + 1)}
                    className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </Link>
            ) : (
                <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed">
                    <ChevronRight className="w-5 h-5" />
                </div>
            )}
        </div>
    );
}
