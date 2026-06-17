"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Search, Users, PhoneCall, CheckCircle, XCircle, Settings } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { AffiliateKpiModal } from './components/AffiliateKpiModal';
import HrDailyView from './HrDailyView';
import { useAuth } from '@/components/auth/AuthProvider';

export default function AffiliateReportsPage() {
  const { role } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);

  const isAdminRole = ['admin', 'manager', 'hr_manager', 'director'].includes(role || '');

  const fetchReports = async () => {
    if (!isAdminRole) return; // Don't fetch if not admin
    setLoading(true);
    let start = dayjs().format('YYYY-MM-DD');
    let end = dayjs().format('YYYY-MM-DD');

    if (dateRange === 'week') {
      start = dayjs().startOf('week').format('YYYY-MM-DD');
    } else if (dateRange === 'month') {
      start = dayjs().startOf('month').format('YYYY-MM-DD');
    }

    try {
      const res = await fetch(`/api/recruitment/affiliates/reports?start=${start}&end=${end}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
      toast.error('Không thể tải báo cáo KPI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange, isAdminRole]);

  if (role && !isAdminRole) {
    return <HrDailyView />;
  }

  const renderProgress = (actual: number, target: number) => {
    const percent = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
    return (
      <div className="w-full">
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="font-medium text-slate-700">{actual} / {target}</span>
          <span className="text-slate-500">{percent}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${percent >= 100 ? 'bg-emerald-500' : percent >= 50 ? 'bg-amber-400' : 'bg-blue-500'}`} 
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  };

  const team = data?.teamTotal;
  const users = data?.userStats || [];

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Báo cáo KPI Affiliate</h1>
          <p className="text-slate-500">Đo lường hiệu quả tìm kiếm CTV, KOL, KOC</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2 bg-white rounded-lg p-1 border shadow-sm">
            <button onClick={() => setDateRange('today')} className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${dateRange === 'today' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>Hôm nay</button>
            <button onClick={() => setDateRange('week')} className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${dateRange === 'week' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>Tuần này</button>
            <button onClick={() => setDateRange('month')} className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${dateRange === 'month' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>Tháng này</button>
          </div>
          {data?.isAdmin && (
            <button onClick={() => setIsKpiModalOpen(true)} className="flex items-center px-4 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
              <Settings className="w-4 h-4 mr-2" />
              Cài đặt KPI
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <>
          {data?.isAdmin && (
            <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 pb-3">
                <h3 className="text-lg font-semibold flex items-center text-slate-800">
                  <BarChart className="w-5 h-5 mr-2 text-emerald-600" />
                  Tiến độ Target Toàn Bộ Team
                </h3>
              </div>
              <div className="p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Search className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-slate-700">Tìm thấy mới</span>
                    </div>
                    {renderProgress(team?.actual?.found || 0, team?.target?.found || 0)}
                  </div>

                  <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <PhoneCall className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-slate-700">Đã liên hệ</span>
                    </div>
                    {renderProgress(team?.actual?.contacted || 0, team?.target?.contacted || 0)}
                  </div>

                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-slate-700">Chốt hợp tác</span>
                    </div>
                    {renderProgress(team?.actual?.won || 0, team?.target?.won || 0)}
                  </div>

                  <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                        <XCircle className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-slate-700">Thất bại / Hủy</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                      {team?.actual?.lost || 0}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Lượt từ chối</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-semibold flex items-center text-slate-800">
                <Users className="w-5 h-5 mr-2 text-indigo-600" />
                Tiến độ KPI Cá nhân
              </h3>
            </div>
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-medium border-b">
                    <tr>
                      <th className="px-6 py-4">Nhân sự HR</th>
                      <th className="px-6 py-4 w-64">Tìm kiếm</th>
                      <th className="px-6 py-4 w-64">Liên hệ</th>
                      <th className="px-6 py-4 w-64">Chốt hợp tác</th>
                      <th className="px-6 py-4 text-center">Tỷ lệ chuyển đổi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((stat: any, idx: number) => {
                      const conversionRate = stat.actual.contacted > 0 
                        ? Math.round((stat.actual.won / stat.actual.contacted) * 100) 
                        : 0;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                                {stat.user?.full_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <div className="font-medium text-slate-800">{stat.user?.full_name || 'Chưa rõ'}</div>
                                <div className="text-xs text-slate-500">Tuyển dụng</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {renderProgress(stat.actual.found, stat.target.found)}
                          </td>
                          <td className="px-6 py-4">
                            {renderProgress(stat.actual.contacted, stat.target.contacted)}
                          </td>
                          <td className="px-6 py-4">
                            {renderProgress(stat.actual.won, stat.target.won)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                              {conversionRate}%
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          Chưa có dữ liệu báo cáo trong khoảng thời gian này
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {isKpiModalOpen && (
        <AffiliateKpiModal 
          isOpen={isKpiModalOpen} 
          onClose={() => setIsKpiModalOpen(false)} 
          onSaved={fetchReports} 
        />
      )}
    </div>
  );
}
