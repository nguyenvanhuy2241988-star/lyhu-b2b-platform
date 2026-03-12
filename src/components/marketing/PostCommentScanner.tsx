'use client';

import { useState } from 'react';
import { Search, Download, Trophy, Loader2, AlertCircle, X } from 'lucide-react';

interface ScannedComment {
    id: string;
    name: string;
    from_id: string;
    message: string;
    created_time: string;
    number?: string;
}

interface Props {
    pageId: string;
    accessToken: string;
    onClose: () => void;
}

export default function PostCommentScanner({ pageId, accessToken, onClose }: Props) {
    const [postUrl, setPostUrl] = useState('');
    const [deadline, setDeadline] = useState('');
    const [targetNumber, setTargetNumber] = useState('');
    const [digitCount, setDigitCount] = useState(3);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hint, setHint] = useState('');
    const [comments, setComments] = useState<ScannedComment[]>([]);
    const [filtered, setFiltered] = useState<ScannedComment[]>([]);
    const [totalScanned, setTotalScanned] = useState(0);

    // Extract post ID from various Facebook URL formats
    const extractPostId = (url: string): string | null => {
        // https://www.facebook.com/PAGE/posts/POST_ID
        // https://www.facebook.com/permalink.php?story_fbid=POST_ID&id=PAGE_ID
        // https://www.facebook.com/PAGE/posts/pfbid...
        // Direct numeric ID: PAGE_ID_POST_ID

        const trimmed = url.trim();

        // If already a numeric post ID like "112376494782495_900316922762763"
        if (/^\d+_\d+$/.test(trimmed)) return trimmed;

        // Extract from /posts/NUMERIC_ID
        const postMatch = trimmed.match(/\/posts\/(\d+)/);
        if (postMatch) return `${pageId}_${postMatch[1]}`;

        // Extract from story_fbid=NUMERIC_ID
        const storyMatch = trimmed.match(/story_fbid=(\d+)/);
        if (storyMatch) return `${pageId}_${storyMatch[1]}`;

        // pfbid URLs — need to resolve via Graph API
        if (trimmed.includes('pfbid')) {
            // Extract the pfbid and try with page_id prefix
            const pfbidMatch = trimmed.match(/posts\/(pfbid\w+)/);
            if (pfbidMatch) return `${pageId}_${pfbidMatch[1]}`;
        }

        // If just a number, assume it's the post ID
        if (/^\d+$/.test(trimmed)) return `${pageId}_${trimmed}`;

        return null;
    };

    const handleScan = async () => {
        if (!postUrl.trim()) {
            setError('Vui lòng nhập URL hoặc ID bài viết');
            return;
        }

        const postId = extractPostId(postUrl);
        if (!postId) {
            setError('Không nhận diện được ID bài viết. Hãy dùng URL dạng facebook.com/page/posts/ID hoặc nhập trực tiếp Post ID (ví dụ: 112376494782495_900316922762763)');
            return;
        }

        setLoading(true);
        setError('');
        setHint('');
        setComments([]);
        setFiltered([]);

        try {
            const res = await fetch('/api/facebook/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page_id: pageId,
                    access_token: accessToken,
                    action: 'scan_all_comments',
                    post_id: postId,
                }),
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.error || 'Lỗi không xác định');
                if (data.hint) setHint(data.hint);
                // Use partial comments if available
                if (data.partial_comments?.length) {
                    processComments(data.partial_comments);
                }
                return;
            }

            setTotalScanned(data.total || 0);
            processComments(data.comments || []);
        } catch (err: any) {
            setError(`Lỗi kết nối: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const processComments = (rawComments: ScannedComment[]) => {
        // Extract N-digit numbers from each comment
        const regex = new RegExp(`\\b(\\d{${digitCount}})\\b`);
        const withNumbers = rawComments.map(c => {
            const match = c.message.match(regex);
            return { ...c, number: match?.[1] || undefined };
        }).filter(c => c.number);

        setComments(withNumbers);

        // Filter by deadline if set
        if (deadline) {
            const dl = new Date(deadline);
            const valid = withNumbers.filter(c => new Date(c.created_time) <= dl);
            setFiltered(valid);
        } else {
            setFiltered(withNumbers);
        }
    };

    // Re-filter when deadline changes
    const applyDeadline = (dl: string) => {
        setDeadline(dl);
        if (!dl) {
            setFiltered(comments);
            return;
        }
        const dlDate = new Date(dl);
        setFiltered(comments.filter(c => new Date(c.created_time) <= dlDate));
    };

    const getRanking = () => {
        if (!targetNumber || !filtered.length) return [];
        const target = parseInt(targetNumber);
        return [...filtered].sort((a, b) => {
            const diffA = Math.abs(parseInt(a.number!) - target);
            const diffB = Math.abs(parseInt(b.number!) - target);
            if (diffA !== diffB) return diffA - diffB;
            // Same difference → who commented first wins
            return new Date(a.created_time).getTime() - new Date(b.created_time).getTime();
        });
    };

    const downloadCSV = () => {
        const data = targetNumber ? getRanking() : filtered;
        const rows = ['STT,Tên,Số chọn,Thời gian,Lệch'];
        const target = targetNumber ? parseInt(targetNumber) : 0;
        data.forEach((c, i) => {
            const diff = target ? Math.abs(parseInt(c.number!) - target) : '';
            const time = new Date(c.created_time).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
            rows.push(`${i + 1},"${c.name}",${c.number},"${time}",${diff}`);
        });
        const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `minigame_comments_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const ranking = getRanking();
    const displayData = targetNumber ? ranking : filtered;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            🎯 Quét Comment Bài Viết
                        </h2>
                        <p className="text-blue-100 text-xs mt-0.5">Lọc số tham gia MiniGame, sự kiện, chương trình</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Inputs */}
                <div className="px-6 py-4 border-b border-slate-100 space-y-3 bg-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">URL hoặc Post ID bài viết *</label>
                            <input
                                type="text"
                                value={postUrl}
                                onChange={e => setPostUrl(e.target.value)}
                                placeholder="https://facebook.com/lyhu.vn/posts/... hoặc PageID_PostID"
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs font-medium text-slate-600 mb-1 block">Hạn chót</label>
                                <input
                                    type="datetime-local"
                                    value={deadline}
                                    onChange={e => applyDeadline(e.target.value)}
                                    className="w-full px-2 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600 mb-1 block">Số trúng</label>
                                <input
                                    type="text"
                                    value={targetNumber}
                                    onChange={e => setTargetNumber(e.target.value.replace(/\D/g, ''))}
                                    placeholder="VD: 368"
                                    className="w-full px-2 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600 mb-1 block">Số chữ số</label>
                                <select
                                    value={digitCount}
                                    onChange={e => setDigitCount(Number(e.target.value))}
                                    className="w-full px-2 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={2}>2 chữ số</option>
                                    <option value={3}>3 chữ số</option>
                                    <option value={4}>4 chữ số</option>
                                    <option value={5}>5 chữ số</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleScan}
                            disabled={loading || !postUrl.trim()}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            {loading ? 'Đang quét...' : 'Quét Comment'}
                        </button>

                        {filtered.length > 0 && (
                            <button
                                onClick={downloadCSV}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                            >
                                <Download className="w-4 h-4" />
                                Tải CSV ({displayData.length})
                            </button>
                        )}

                        {totalScanned > 0 && (
                            <div className="flex items-center gap-4 text-xs text-slate-500 ml-auto">
                                <span>📄 Tổng comment: <strong className="text-slate-700">{totalScanned}</strong></span>
                                <span>🔢 Có số {digitCount} chữ số: <strong className="text-blue-700">{comments.length}</strong></span>
                                <span>✅ Hợp lệ: <strong className="text-emerald-700">{filtered.length}</strong></span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <p>{error}</p>
                            {hint && <p className="mt-1 text-xs text-red-500">{hint}</p>}
                        </div>
                    </div>
                )}

                {/* Results Table */}
                <div className="flex-1 overflow-auto">
                    {displayData.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-left w-12">STT</th>
                                    {targetNumber && <th className="px-4 py-3 font-medium text-center w-16">🏆</th>}
                                    <th className="px-4 py-3 font-medium text-left">Tên người chơi</th>
                                    <th className="px-4 py-3 font-medium text-center w-20">Số chọn</th>
                                    {targetNumber && <th className="px-4 py-3 font-medium text-center w-16">Lệch</th>}
                                    <th className="px-4 py-3 font-medium text-left">Nội dung</th>
                                    <th className="px-4 py-3 font-medium text-left w-40">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {displayData.map((c, i) => {
                                    const diff = targetNumber ? Math.abs(parseInt(c.number!) - parseInt(targetNumber)) : null;
                                    const isWinner = diff === 0;
                                    return (
                                        <tr key={c.id} className={`hover:bg-slate-50 transition ${isWinner ? 'bg-yellow-50 font-bold' : ''}`}>
                                            <td className="px-4 py-2.5 text-slate-500">{i + 1}</td>
                                            {targetNumber && (
                                                <td className="px-4 py-2.5 text-center">
                                                    {i === 0 && <span className="text-lg">🥇</span>}
                                                    {i === 1 && <span className="text-lg">🥈</span>}
                                                    {i === 2 && <span className="text-lg">🥉</span>}
                                                </td>
                                            )}
                                            <td className="px-4 py-2.5 font-medium text-slate-800">{c.name}</td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    isWinner ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {c.number}
                                                </span>
                                            </td>
                                            {targetNumber && (
                                                <td className="px-4 py-2.5 text-center text-xs text-slate-500">
                                                    {diff === 0 ? '🎯 Trùng!' : `±${diff}`}
                                                </td>
                                            )}
                                            <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[200px] truncate" title={c.message}>
                                                {c.message.substring(0, 80)}
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-slate-500">
                                                {new Date(c.created_time).toLocaleString('vi-VN', {
                                                    timeZone: 'Asia/Ho_Chi_Minh',
                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit',
                                                })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : !loading && totalScanned === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <Search className="w-12 h-12 mb-3 opacity-30" />
                            <p className="text-sm">Nhập URL bài viết và nhấn "Quét Comment" để bắt đầu</p>
                        </div>
                    ) : null}
                </div>

                {/* Top Winners Summary */}
                {targetNumber && ranking.length > 0 && (
                    <div className="px-6 py-3 border-t border-slate-200 bg-gradient-to-r from-yellow-50 to-amber-50">
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-bold text-slate-800">Top 3 gần số {targetNumber} nhất:</span>
                        </div>
                        <div className="flex gap-4">
                            {ranking.slice(0, 3).map((c, i) => {
                                const diff = Math.abs(parseInt(c.number!) - parseInt(targetNumber));
                                const medals = ['🥇', '🥈', '🥉'];
                                return (
                                    <div key={c.id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-sm">
                                        <span>{medals[i]}</span>
                                        <span className="font-medium">{c.name}</span>
                                        <span className="text-blue-600 font-bold">{c.number}</span>
                                        <span className="text-xs text-slate-400">(lệch {diff})</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
