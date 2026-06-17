"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Image as ImageIcon, MessageSquare, MoreHorizontal } from 'lucide-react';
import { AffiliateModal } from './components/AffiliateModal';
import { toast } from 'sonner';

interface AffiliatePartner {
  id: string;
  name: string;
  type: string;
  platform: string;
  status: string;
  notes: string;
  evidence_images: string[];
}

const BOARD_COLUMNS = [
  { id: 'LEAD', title: 'Tiềm năng mới' },
  { id: 'CONTACTED', title: 'Đã Liên hệ' },
  { id: 'NEGOTIATING', title: 'Đang Đàm phán' },
  { id: 'WON', title: 'Chốt Hợp Tác' },
  { id: 'LOST', title: 'Thất bại' }
];

export default function AffiliateBoardPage() {
  const [partners, setPartners] = useState<AffiliatePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<AffiliatePartner | null>(null);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recruitment/affiliates');
      if (res.ok) {
        const data = await res.json();
        setPartners(data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Không thể tải dữ liệu CRM');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const onDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const partnerId = draggableId;
    const newStatus = destination.droppableId;

    // Optimistic update
    setPartners(prev => prev.map(p => 
      p.id === partnerId ? { ...p, status: newStatus } : p
    ));

    try {
      const res = await fetch('/api/recruitment/affiliates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partnerId, status: newStatus })
      });

      if (!res.ok) throw new Error('Cập nhật thất bại');
      toast.success('Đã chuyển trạng thái');
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi chuyển trạng thái');
      // Revert on error
      fetchPartners();
    }
  };

  const handleEdit = (partner: AffiliatePartner) => {
    setEditingPartner(partner);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingPartner(null);
    setIsModalOpen(true);
  };

  const getPartnersByStatus = (status: string) => {
    return partners.filter(p => p.status === status);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Affiliate (CTV, KOL, KOC)</h1>
          <p className="text-slate-500">Kéo thả để cập nhật trạng thái chiêu mộ</p>
        </div>
        <button onClick={handleAddNew} className="flex items-center px-4 py-2 text-sm text-white rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Thêm Đối Tác
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex space-x-4 overflow-x-auto pb-4 h-[calc(100vh-180px)]">
          {BOARD_COLUMNS.map((col) => (
            <div key={col.id} className="bg-slate-200/50 rounded-xl p-3 min-w-[320px] w-[320px] flex flex-col">
              <div className="flex justify-between items-center mb-3 px-2">
                <h3 className="font-semibold text-slate-700">{col.title}</h3>
                <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                  {getPartnersByStatus(col.id).length}
                </span>
              </div>
              
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 overflow-y-auto ${snapshot.isDraggingOver ? 'bg-slate-200' : ''} rounded-lg p-1 transition-colors`}
                  >
                    {getPartnersByStatus(col.id).map((partner, index) => (
                      <Draggable key={partner.id} draggableId={partner.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => handleEdit(partner)}
                            className={`bg-white p-3 rounded-lg shadow-sm mb-3 border border-slate-100 cursor-pointer hover:shadow-md transition-shadow
                              ${snapshot.isDragging ? 'shadow-lg ring-2 ring-emerald-500/20' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-sm text-slate-800 line-clamp-1">{partner.name}</h4>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                partner.type === 'KOL' ? 'bg-purple-100 text-purple-700' :
                                partner.type === 'KOC' ? 'bg-blue-100 text-blue-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {partner.type}
                              </span>
                            </div>
                            
                            {partner.platform && (
                              <p className="text-xs text-slate-500 mb-2 truncate">Nguồn: {partner.platform}</p>
                            )}
                            
                            <div className="flex items-center space-x-3 text-slate-400 mt-3 pt-3 border-t border-slate-50">
                              {partner.evidence_images?.length > 0 && (
                                <div className="flex items-center text-xs">
                                  <ImageIcon className="w-3.5 h-3.5 mr-1" />
                                  {partner.evidence_images.length}
                                </div>
                              )}
                              {partner.notes && (
                                <div className="flex items-center text-xs">
                                  <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                  1
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {isModalOpen && (
        <AffiliateModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          partner={editingPartner} 
          onSaved={fetchPartners} 
        />
      )}
    </div>
  );
}
