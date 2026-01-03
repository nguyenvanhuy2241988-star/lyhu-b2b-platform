import React from "react";

export const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

export const StatsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
        ))}
    </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-24" />
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        {Array.from({ length: cols }).map((_, i) => (
                            <th key={i} className="px-6 py-3">
                                <Skeleton className="h-4 w-20" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {Array.from({ length: rows }).map((_, i) => (
                        <tr key={i}>
                            {Array.from({ length: cols }).map((_, j) => (
                                <td key={j} className="px-6 py-4">
                                    <Skeleton className="h-4 w-full" />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export const KanbanSkeleton = () => (
    <div className="flex gap-6 overflow-x-auto pb-6">
        {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-80">
                <div className="flex items-center justify-between mb-4 px-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-8" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
                            <div className="flex justify-between">
                                <Skeleton className="w-8 h-8 rounded-full" />
                                <Skeleton className="w-12 h-4" />
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <div className="flex justify-between pt-2">
                                <Skeleton className="w-16 h-4" />
                                <Skeleton className="w-20 h-4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
);
