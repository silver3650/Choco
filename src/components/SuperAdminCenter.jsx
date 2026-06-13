import React, { useState, useEffect } from 'react';
import { Building, Settings, ArrowRight, Edit, Trash2, X } from 'lucide-react';
import { supabase } from '../supabase';

export default function SuperAdminCenter({ currentUser, setCurrentUser, showToast, setCurrentTab }) {
  const [churches, setChurches] = useState([]);
  
  // 수정 모달 상태 관리
  const [editModal, setEditModal] = useState({ isOpen: false, church: null });

  useEffect(() => {
    const fetchAllChurches = async () => {
      const { data } = await supabase.from('churches').select('*').order('id', { ascending: false });
      if (data) setChurches(data);
    };
    fetchAllChurches();
  }, []);

  const enterChurchAsAdmin = async (church) => {
    // 해당 교회의 담당목사/부장 권한을 가진 계정으로 전환 (혹은 개설자 정보로 전환)
    setCurrentUser(prev => ({ 
      ...prev, 
      churchId: church.id, 
      churchName: church.name, 
      deptName: church.dept, 
      pastorName: church.pastor_name, // 최고관리자로 입장할 때 담당 사역자 정보도 유지
      address: church.address,
      originalRole: '담당목사' // 최고 관리자 권한 부여
    }));
    showToast(`${church.name} ${church.dept} 관리 모드로 입장합니다.`);
    setCurrentTab('dashboard'); // 대시보드로 이동
  };

  // 교회 삭제 로직
  const handleDeleteChurch = async (id, name) => {
    if (!window.confirm(`정말로 '${name}' 교회를 삭제하시겠습니까?\n주의: 해당 교회에 소속된 데이터가 있으면 삭제되지 않을 수 있습니다.`)) return;

    const { error } = await supabase.from('churches').delete().eq('id', id);
    
    if (error) {
      showToast("삭제 실패: 소속된 교사나 학생이 있어 삭제할 수 없거나 시스템 오류입니다.", "error");
    } else {
      setChurches(churches.filter(c => c.id !== id));
      showToast(`${name} 교회가 삭제되었습니다.`);
    }
  };

  // 수정 모달 열기/닫기
  const openEditModal = (church) => setEditModal({ isOpen: true, church: { ...church } });
  const closeEditModal = () => setEditModal({ isOpen: false, church: null });

  // 수정 폼 입력 핸들러
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditModal(prev => ({ ...prev, church: { ...prev.church, [name]: value } }));
  };

  // 교회 정보 수정 저장 로직
  const saveChurchEdit = async () => {
    const { church } = editModal;
    if (!church.name.trim() || !church.dept.trim()) {
      return showToast("교회 이름과 부서명은 필수 입력 항목입니다.", "error");
    }

    const { data, error } = await supabase.from('churches')
      .update({
        name: church.name,
        dept: church.dept,
        pastor_name: church.pastor_name,
        address: church.address
      })
      .eq('id', church.id)
      .select().single();

    if (error) {
      showToast("교회 정보 수정에 실패했습니다.", "error");
    } else if (data) {
      setChurches(churches.map(c => c.id === data.id ? data : c));
      showToast("교회 정보가 성공적으로 수정되었습니다.");
      closeEditModal();
    }
  };

  return (
    <div className="p-4 space-y-4 relative h-full">
      <h2 className="text-lg font-bold text-stone-800 flex items-center"><Settings className="mr-2 text-rose-500" /> 최고 관리자 센터</h2>
      <div className="space-y-3 pb-10">
        {churches.map(church => (
          <div key={church.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex justify-between items-center hover:border-rose-200 transition-colors">
            <div className="flex-1 pr-2">
              <p className="font-bold text-stone-800">
                {church.name} <span className="text-sm font-normal text-stone-500 ml-1">({church.dept})</span>
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                <span className="font-bold text-stone-600">담당: {church.pastor_name || '사역자 미정'}</span> • {church.address || '주소 미입력'}
              </p>
            </div>
            
            {/* 우측 액션 버튼들 */}
            <div className="flex flex-col items-end space-y-2 shrink-0">
              <div className="flex space-x-1.5">
                <button 
                  onClick={() => openEditModal(church)} 
                  className="p-1.5 bg-stone-100 text-stone-500 rounded-md hover:bg-emerald-50 hover:text-emerald-600 transition-colors shadow-sm"
                  title="정보 수정"
                >
                  <Edit size={14} />
                </button>
                <button 
                  onClick={() => handleDeleteChurch(church.id, church.name)} 
                  className="p-1.5 bg-stone-100 text-stone-500 rounded-md hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-sm"
                  title="교회 삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <button 
                onClick={() => enterChurchAsAdmin(church)} 
                className="bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center hover:bg-rose-600 transition-colors shadow-sm"
              >
                입장 <ArrowRight size={14} className="ml-1" />
              </button>
            </div>
          </div>
        ))}
        {churches.length === 0 && (
          <div className="text-center py-10 text-stone-400 text-sm bg-white rounded-xl border border-stone-100 border-dashed">
            개설된 교회가 없습니다.
          </div>
        )}
      </div>

      {/* ⭐ 교회 정보 수정 모달 */}
      {editModal.isOpen && editModal.church && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-stone-100 bg-stone-50">
              <h3 className="font-bold text-stone-800 flex items-center text-sm">
                <Building size={16} className="mr-2 text-rose-500" /> 
                교회 정보 수정
              </h3>
              <button onClick={closeEditModal} className="text-stone-400 hover:text-stone-600 bg-white rounded-full p-1 transition-colors shadow-sm">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">교회 이름</label>
                <input type="text" name="name" value={editModal.church.name} onChange={handleEditChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-rose-400 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">부서 이름 (예: 청소년부)</label>
                <input type="text" name="dept" value={editModal.church.dept} onChange={handleEditChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-rose-400 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">담당 사역자 이름</label>
                <input type="text" name="pastor_name" value={editModal.church.pastor_name || ''} onChange={handleEditChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-rose-400 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">교회 주소 (지역명)</label>
                <input type="text" name="address" value={editModal.church.address || ''} onChange={handleEditChange} placeholder="예: 서울 강남구 율현동" className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-rose-400 transition-colors" />
              </div>
            </div>
            
            <div className="p-4 border-t border-stone-100 bg-[#FFFCF9] flex space-x-2">
              <button onClick={closeEditModal} className="flex-1 py-3 bg-white border border-stone-200 text-stone-600 text-sm font-bold rounded-xl hover:bg-stone-50 transition-colors">
                취소
              </button>
              <button onClick={saveChurchEdit} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 transition-colors text-white text-sm font-bold rounded-xl shadow-sm">
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}