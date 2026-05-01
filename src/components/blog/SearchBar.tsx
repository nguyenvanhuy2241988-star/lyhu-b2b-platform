'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useDebounce } from 'use-debounce';

export default function SearchBar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const initialQuery = searchParams.get('q') || '';
    const [text, setText] = useState(initialQuery);
    const [debouncedValue] = useDebounce(text, 500);

    // Sync state with URL if URL changes externally
    useEffect(() => {
        setText(searchParams.get('q') || '');
    }, [searchParams]);

    // Update URL when debounced value changes
    useEffect(() => {
        const currentQ = searchParams.get('q') || '';
        // Only trigger push if the search value actually changed
        if (debouncedValue === currentQ) return;

        const params = new URLSearchParams(searchParams.toString());
        
        if (debouncedValue) {
            params.set('q', debouncedValue);
        } else {
            params.delete('q');
        }
        
        // Reset to page 1 on new search
        if (params.get('page')) {
            params.delete('page');
        }

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [debouncedValue, pathname, router, searchParams]);

    return (
        <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tìm kiếm bài viết..."
                className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all"
            />
            {text && (
                <button
                    onClick={() => setText('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
