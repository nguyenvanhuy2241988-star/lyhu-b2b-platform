'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Trophy, Loader2, AlertCircle, X, RefreshCw } from 'lucide-react';

interface ScannedComment {
    id: string;
    name: string;
    from_id: string;
    message: string;
    created_time: string;
    number?: string;
}

interface PagePost {
    id: string;
    message: string;
    created_time: string;
}

interface Props {
    pageId: string;
    accessToken: string;
    userToken?: string;
    onClose: () => void;
}

export default function PostCommentScanner({ pageId, accessToken, userToken: propUserToken, onClose }: Props) {
    const [posts, setPosts] = useState<PagePost[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [selectedPostId, setSelectedPostId] = useState('');
    const [manualPostId, setManualPostId] = useState('');
    const [useManual, setUseManual] = useState(false);
    const [deadline, setDeadline] = useState('');
    const [targetNumber, setTargetNumber] = useState('');
    const [digitCount, setDigitCount] = useState(3);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hint, setHint] = useState('');
    const [comments, setComments] = useState<ScannedComment[]>([]);
    const [filtered, setFiltered] = useState<ScannedComment[]>([]);
    const [totalScanned, setTotalScanned] = useState(0);
    const [debugInfo, setDebugInfo] = useState<string>('');

    const debugToken = async () => {
        setError('');
        setDebugInfo('Đang kiểm tra token...');
        try {
            const userToken = propUserToken || (typeof window !== 'undefined' ? localStorage.getItem('fb_user_token') || '' : '');
            const res = await fetch('/api/facebook/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page_id: pageId, access_token: accessToken, user_token: userToken, action: 'debug_token' }),
            });
            const data = await res.json();
            if (data.debug) {
                const pt = data.debug.page_token;
                const ut = data.debug.user_token;
                const ct = data.debug.comment_test;
                let info = `=== PAGE TOKEN ===\nValid: ${pt.is_valid}\nType: ${pt.type}\nScopes: ${(pt.scopes || []).join(', ')}\npages_read_engagement: ${pt.has_pages_read_engagement ? '✅' : '❌'}\npages_read_user_content: ${pt.has_pages_read_user_content ? '✅' : '❌'}`;
                if (ut.scopes?.length) {
                    info += `\n\n=== USER TOKEN ===\nValid: ${ut.is_valid}\nType: ${ut.type}\nScopes: ${(ut.scopes || []).join(', ')}\npages_read_engagement: ${ut.has_pages_read_engagement ? '✅' : '❌'}\npages_read_user_content: ${ut.has_pages_read_user_content ? '✅' : '❌'}`;
                } else {
                    info += `\n\n=== USER TOKEN ===\nKhông có user token`;
                }
                if (ct) {
                    info += `\n\n=== COMMENT TEST ===\nĐọc feed: ${ct.has_feed ? '✅' : '❌'}\nĐọc comment: ${ct.first_post_has_comments ? '✅' : '❌'}\nLỗi: ${ct.error || 'Không'}`;
                }
                setDebugInfo(info);
            }
        } catch (e: any) {
            setDebugInfo(`Lỗi: ${e.message}`);
        }
    };

    // Load posts from the page on mount
    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        setLoadingPosts(true);
        try {
            // Fetch recent posts from the page (same as scan-comments uses)
            const res = await fetch(
                `https://graph.facebook.com/v19.0/${pageId}/posts?fields=id,message,created_time&limit=30&access_token=${accessToken}`
            );
            const data = await res.json();
            if (data.data) {
                setPosts(data.data.filter((p: any) => p.message)); // Only posts with text
                if (data.data.length > 0) {
                    setSelectedPostId(data.data[0].id);
                }
            }
        } catch (e) {
            console.error('Failed to load posts:', e);
        } finally {
            setLoadingPosts(false);
        }
    };

    const getPostId = (): string | null => {
        if (useManual) {
            const trimmed = manualPostId.trim();
            if (/^\d+_\d+$/.test(trimmed)) return trimmed;
            if (/^\d+$/.test(trimmed)) return `${pageId}_${trimmed}`;
            return null;
        }
        return selectedPostId || null;
    };

    const handleScan = async () => {
        const postId = getPostId();
        if (!postId) {
            setError('Vui lòng chọn bài viết hoặc nhập Post ID');
            return;
        }

        setLoading(true);
        setError('');
        setHint('');
        setComments([]);
        setFiltered([]);

        try {
            const userToken = propUserToken || (typeof window !== 'undefined' ? localStorage.getItem('fb_user_token') || '' : '');

            const res = await fetch('/api/facebook/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page_id: pageId,
                    access_token: accessToken,
                    user_token: userToken,
                    action: 'scan_all_comments',
                    post_id: postId,
                }),
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.error || 'Lỗi không xác định');
                if (data.hint) setHint(data.hint);
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
        const regex = new RegExp(`\\b(\\d{${digitCount}})\\b`);
        const withNumbers = rawComments.map(c => {
            const match = c.message.match(regex);
            return { ...c, number: match?.[1] || undefined };
        }).filter(c => c.number);

        setComments(withNumbers);

        if (deadline) {
            const dl = new Date(deadline);
            const valid = withNumbers.filter(c => new Date(c.created_time) <= dl);
            setFiltered(valid);
        } else {
            setFiltered(withNumbers);
        }
    };

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
                    {/* Post Selection */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="text-xs font-medium text-slate-600">Chọn bài viết *</label>
                            <button
                                onClick={() => setUseManual(!useManual)}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                {useManual ? '← Chọn từ danh sách' : 'Nhập Post ID thủ công →'}
                            </button>
                        </div>
                        {useManual ? (
                            <input
                                type="text"
                                value={manualPostId}
                                onChange={e => setManualPostId(e.target.value)}
                                placeholder="Nhập Post ID số (VD: 1199280844074453_940050756811891)"
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        ) : loadingPosts ? (
                            <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Đang tải bài viết...
                            </div>
                        ) : posts.length > 0 ? (
                            <select
                                value={selectedPostId}
                                onChange={e => setSelectedPostId(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                {posts.map(p => {
                                    const date = new Date(p.created_time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                                    const preview = (p.message || '').substring(0, 80).replace(/\n/g, ' ');
                                    return (
                                        <option key={p.id} value={p.id}>
                                            [{date}] {preview}{p.message.length > 80 ? '...' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        ) : (
                            <p className="text-sm text-red-500 py-2">Không tải được bài viết. Kiểm tra token.</p>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-3 gap-3">
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

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleScan}
                            disabled={loading || (!selectedPostId && !manualPostId.trim())}
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
                                <span>📄 Tổng: <strong className="text-slate-700">{totalScanned}</strong></span>
                                <span>🔢 Có số: <strong className="text-blue-700">{comments.length}</strong></span>
                                <span>✅ Hợp lệ: <strong className="text-emerald-700">{filtered.length}</strong></span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p>{error}</p>
                            {hint && <p className="mt-1 text-xs text-red-500">{hint}</p>}
                            <button
                                onClick={debugToken}
                                className="mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition"
                            >
                                🔍 Kiểm tra quyền Token
                            </button>
                        </div>
                    </div>
                )}

                {/* Debug Info */}
                {debugInfo && (
                    <div className="mx-6 mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-yellow-800">🔧 Token Debug Info</span>
                            <button onClick={() => setDebugInfo('')} className="text-xs text-yellow-600 hover:underline">Đóng</button>
                        </div>
                        <pre className="text-xs text-yellow-900 whitespace-pre-wrap font-mono">{debugInfo}</pre>
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
                            <p className="text-sm">Chọn bài viết và nhấn "Quét Comment" để bắt đầu</p>
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
