import React, { useState } from 'react';
import { Settings, Church, MapPin, Save, Plus, UserCog, Check } from 'lucide-react';
import { MOCK_STATS_WEEKLY, MOCK_STATS_MONTHLY } from '../../data/mockData';

export default function AdminCenter({
  currentUser, setCurrentUser, students, setStudents, teachers, uniqueGroups,
  statPeriod, setStatPeriod, showToast
}) {
  // 관리자 뷰 전용 상태들 (App.jsx에서 옮겨옴)
  const [adminView, setAdminView] = useState('stats');
  const [batchGroup, setBatchGroup] = useState('1반');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [batchFilterGroup, setBatchFilterGroup] = useState('전체');

  // 차트 로직
  const statsData = statPeriod === 'monthly' ? MOCK_STATS_MONTHLY : MOCK_STATS_WEEKLY;
  const chartHeight = 180;
  const chartWidth = 340;
  const paddingX = 30;
  const paddingY = 40;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;
  const maxVal = Math.max(...statsData.map(d => d.total), 50); 
  const getX = (index) => paddingX + (index * (innerWidth / (statsData.length - 1 || 1)));
  const getY = (val) => chartHeight - paddingY - ((val / maxVal) * innerHeight);

  const presentPoints = statsData.map((d, i) => `${getX(i)},${getY(d.present)}`).join(' ');
  const absentPoints = statsData.map((d, i) => `${getX(i)},${getY(d.total - d.present)}`).join(' ');

  const toggleStudentSelection = (id) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(studentId => studentId !== id) : [...prev, id]);
  };

  const handleBatchGroupChange = () => {
    if(selectedStudentIds.length === 0) {
      showToast("학생을 먼저 선택해주세요.", "error");
      return;
    }
    setStudents(students.map(s => selectedStudentIds.includes(s.id) ? { ...s, group: batchGroup } : s));
    setSelectedStudentIds([]);
    showToast(`선택된 ${selectedStudentIds.length}명의 학생이 ${batchGroup}(으)로 이동되었습니다.`);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-stone-800 flex items-center"><Settings size={18} className="mr-1.5 text-emerald-500"/>관리자 센터</h2>
      </div>

      <div className="flex bg-stone-200 p-1 rounded-xl mb-4 text-center overflow-x-auto hide-scrollbar">
        <button onClick={() => setAdminView('stats')} className={`whitespace-nowrap px-3 py-2 text-xs font-bold rounded-lg transition-colors flex-1 ${adminView === 'stats' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}>출석 통계</button>
        <button onClick={() => setAdminView('teachers')} className={`whitespace-nowrap px-3 py-2 text-xs font-bold rounded-lg transition-colors flex-1 ${adminView === 'teachers' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}>교사/반 관리</button>
        <button onClick={() => setAdminView('settings')} className={`whitespace-nowrap px-3 py-2 text-xs font-bold rounded-lg transition-colors flex-1 ${adminView === 'settings' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}>교회 설정</button>
      </div>

      {adminView === 'settings' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 animate-in fade-in">
          {/* 교회 설정 화면 렌더링 영역 */}
          <p className="text-sm text-stone-500">교회 정보 편집 영역...</p>
        </div>
      )}

      {adminView === 'stats' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
          {/* 출석 통계 화면 및 SVG 차트 영역 */}
          <p className="text-sm text-stone-500">차트 렌더링 영역...</p>
        </div>
      )}

      {adminView === 'teachers' && (
        <div className="space-y-4">
           {/* 교사 및 반 일괄 관리 영역 */}
           <p className="text-sm text-stone-500">교사 관리 렌더링 영역...</p>
        </div>
      )}
    </div>
  );
}
