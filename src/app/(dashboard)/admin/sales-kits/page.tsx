'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, FileText, Download, Eye, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SalesKit {
  id: string;
  title: string;
  target_audience: string;
  file_url: string;
  version: string;
  is_active: boolean;
  created_at: string;
}

export default function SalesKitsAdminPage() {
  const [kits, setKits] = useState<SalesKit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchKits();
  }, []);

  const fetchKits = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('b2b_sales_kits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Lỗi khi tải danh sách Catalog');
    } else {
      setKits(data || []);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa tài liệu này?')) return;
    
    const { error } = await supabase.from('b2b_sales_kits').delete().eq('id', id);
    if (error) {
      toast.error('Lỗi khi xóa tài liệu');
    } else {
      toast.success('Đã xóa thành công');
      fetchKits();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản Lý Sales Kit & Catalog
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Tài liệu chào hàng dành cho chuỗi siêu thị (MT) và đại lý (GT)
          </p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-5 h-5" />
          <span>Tải Lên Tài Liệu Mới</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : kits.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Chưa có Sales Kit nào</h3>
            <p className="text-gray-500 mt-2 mb-6">Hãy tải lên file PDF Catalog đầu tiên để đội Sale bắt đầu chốt deal.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Tên Tài Liệu</th>
                  <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Đối Tượng</th>
                  <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Phiên Bản</th>
                  <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Trạng Thái</th>
                  <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {kits.map((kit) => (
                  <tr key={kit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{kit.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                        {kit.target_audience || 'Chung'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">v{kit.version}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${kit.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {kit.is_active ? 'Đang kích hoạt' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {kit.file_url && (
                          <a href={kit.file_url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-primary transition-colors bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-primary/10" title="Xem / Tải xuống">
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => handleDelete(kit.id)} className="p-2 text-gray-500 hover:text-red-600 transition-colors bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
