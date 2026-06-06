import React, { useState, useEffect } from 'react';
import { Building, Settings, ArrowRight } from 'lucide-react';
import { supabase } from '../supabase';

export default function SuperAdminCenter({ currentUser, setCurrentUser, showToast, setCurrentTab }) {
  const [churches, setChurches] = useState([]);

  useEffect(() => {
    const fetchAllChurches = async () => {
      const { data } = await supabase.from('churches').select('*');
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
      address: church.address,
      originalRole: '담당목사' // 최고 관리자 권한 부여
    }));
    showToast(`${church.name} ${church.dept} 관리 모드로 입장합니다.`);
    setCurrentTab('dashboard'); // 대시보드로 이동
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold text-stone-800 flex items-center"><Settings className="mr-2 text-rose-500" /> 최고 관리자 센터</h2>
      <div className="space-y-3">
        {churches.map(church => (
          <div key={church.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex justify-between items-center">
            <div>
              <p className="font-bold text-stone-800">{church.name}</p>
              <p className="text-xs text-stone-500">{church.dept} | {church.address}</p>
            </div>
            <button onClick={() => enterChurchAsAdmin(church)} className="bg-rose-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center hover:bg-rose-600 transition-colors">
              입장 <ArrowRight size={14} className="ml-1" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}