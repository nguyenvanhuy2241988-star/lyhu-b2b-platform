'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <h2 className="text-2xl font-bold mb-2 text-slate-900">Đã xảy ra lỗi!</h2>
            <p className="text-slate-600 mb-6 max-w-md">
                {error.message || "Hệ thống gặp sự cố không mong muốn."}
            </p>
            <button
                onClick={() => reset()}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
            >
                Thử lại
            </button>
        </div>
    )
}
