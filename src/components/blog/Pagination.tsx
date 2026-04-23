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

    return (
        <div className="flex items-center justify-center gap-2 mt-12">
            {/* Prev Button */}
            {currentPage > 1 ? (
                <Link 
                    href={createPageURL(currentPage - 1)}
                    className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Link>
            ) : (
                <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed">
                    <ChevronLeft className="w-5 h-5" />
                </div>
            )}

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Link
                        key={page}
                        href={createPageURL(page)}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                            currentPage === page
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {page}
                    </Link>
                ))}
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
