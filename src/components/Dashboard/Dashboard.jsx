import React from 'react';
import { Users, Phone, MessageCircle, FileText, AlertCircle, Calendar, Bell, BarChart2 } from 'lucide-react';
import { MOCK_STATS_WEEKLY, MOCK_STATS_MONTHLY } from '../../data/mockData';

export default function Dashboard({ 
  userRole, currentUser, students, attendance, teachers, duties, posts, 
  statPeriod, setStatPeriod, setCurrentTab, setCommunityTab, openQuickLog, navigateToProfile, showToast 
}) {
  const isTeacher = userRole === '교사';
  const myStudents = isTeacher ? students.filter(s => s.group === currentUser.group) : students;
  const totalCount = myStudents.length;
  const presentCount = myStudents.filter(s => attendance[s.id] === '출석' || attendance[s.id] === '온라인').length;
  const absentCount = myStudents.filter(s => attendance[s.id] === '결석').length;
  const attendanceRate = totalCount === 0 ? 0 : Math.round((presentCount / totalCount) * 100);
  
  const absentStudents = myStudents.filter(s => attendance[s.id] === '결석');
  const consecutiveAbsentees = students.filter(s => s.consecutiveAbsences >= 3 && (!isTeacher || s.group === currentUser.group));
  
  const currentMonthStr = '06';
  const birthdayStudents = students.filter(s => s.birth && s.birth.startsWith(currentMonthStr));
  const birthdayTeachers = teachers.filter(t => t.birth && t.birth.startsWith(currentMonthStr));

  const handleCall = (phone) => showToast(`[전화 연결] ${phone} 번호로 전화를 엽니다.`, "info");
  const handleMessage = (phone) => showToast(`[메시지 발송] ${phone} 번호로 카톡/문자 앱을 엽니다.`, "info");

  const currentDuty = duties.length > 0 ? duties[0] : null;
  const todayStr = "2026-06-07 (주일)";

  // 선그래프 로직
  const statsData = statPeriod === 'monthly' ? MOCK_STATS_MONTHLY : MOCK_STATS_WEEKLY;
  const chartHeight = 120;
  const chartWidth = 320;
  const paddingX = 20;
  const paddingY = 25;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;
  const maxVal = Math.max(...statsData.map(d => d.total), 50); 
  const getX = (index) => paddingX + (index * (innerWidth / (statsData.length - 1 || 1)));
  const getY = (val) => chartHeight - paddingY - ((val / maxVal) * innerHeight);
  const presentPoints = statsData.map((d, i) => `${getX(i)},${getY(d.present)}`).join(' ');
  const absentPoints = statsData.map((d, i) => `${getX(i)},${getY(d.total - d.present)}`).join(' ');

  return (
    <div className="p-4 space-y-4">
      {/* 1. 상단 요약 카드 */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-stone-800">{isTeacher ? `${currentUser.group} 예배 현황` : '전체 예배 현황'}</h2>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{todayStr}</span>
        </div>
        
        <div className="mb-5 bg-[#FFFCF9] p-4 rounded-xl border border-stone-100">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-stone-700">총 {totalCount}명 중 <span className="text-emerald-500 text-xl font-extrabold">{presentCount}</span>명 출석</span>
            <span className="text-sm font-bold text-emerald-500">{attendanceRate}%</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2.5">
            <div className="bg-emerald-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${attendanceRate}%` }}></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-xs text-emerald-600 font-bold mb-1">출석</p>
            <p className="text-2xl font-bold text-emerald-700">{presentCount}</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-3">
            <p className="text-xs text-rose-600 font-bold mb-1">결석</p>
            <p className="text-2xl font-bold text-rose-700">{absentCount}</p>
          </div>
          <div className="bg-stone-50 rounded-xl p-3">
            <p className="text-xs text-stone-600 font-bold mb-1">재적</p>
            <p className="text-2xl font-bold text-stone-800">{totalCount}</p>
          </div>
        </div>
      </div>

      {/* 2. 교사용 미니 선그래프 (생략 방지) */}
      {isTeacher && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
          <div className="flex justify-between items-center mb-3">
             <h3 className="text-sm font-bold text-stone-800 flex items-center"><BarChart2 size={16} className="mr-1 text-emerald-500"/> 출석 추이</h3>
             <div className="flex space-x-1 bg-stone-100 p-1 rounded-lg">
                <button onClick={() => setStatPeriod('weekly')} className={`px-2 py-1 text-[10px] rounded-md font-bold transition-colors ${statPeriod === 'weekly' ? 'bg-white shadow text-emerald-600' : 'text-stone-500'}`}>주별</button>
                <button onClick={() => setStatPeriod('monthly')} className={`px-2 py-1 text-[10px] rounded-md font-bold transition-colors ${statPeriod === 'monthly' ? 'bg-white shadow text-emerald-600' : 'text-stone-500'}`}>월별</button>
             </div>
          </div>
          <div className="mt-2 border border-stone-50 rounded-xl bg-[#FFFCF9] pt-2 overflow-visible relative">
            {/* SVG 그래프 영역 */}
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
              <line x1={paddingX} y1={getY(maxVal)} x2={chartWidth - paddingX} y2={getY(maxVal)} stroke="#e7e5e4" strokeDasharray="2 2" />
              <line x1={paddingX} y1={getY(0)} x2={chartWidth - paddingX} y2={getY(0)} stroke="#e7e5e4" />
              <polyline points={presentPoints} fill="none" stroke="#10b981" strokeWidth="2.5" />
              <polyline points={absentPoints} fill="none" stroke="#fb7185" strokeWidth="1.5" strokeDasharray="3 2" />
              {statsData.map((d, i) => (
                <g key={i}>
                  <text x={getX(i)} y={chartHeight - 8} textAnchor="middle" fontSize="9" fill="#78716c" fontWeight="bold">{d.label}</text>
                  <circle cx={getX(i)} cy={getY(d.present)} r="3.5" fill="#fff" stroke="#10b981" strokeWidth="2" />
                  <text x={getX(i)} y={getY(d.present) - 12} textAnchor="middle" fontSize="10" fill="#047857" fontWeight="bold">{d.present}명</text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* 3. 예배 순서 요약 등 (나머지 내용 동일하게 유지) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between">
         <div>
            <p className="text-xs font-bold text-stone-500 flex items-center mb-1"><Calendar size={12} className="mr-1"/> 이번 주 예배 순서</p>
            {currentDuty ? (
              <div className="flex space-x-3 text-sm font-bold text-stone-800">
                 <p><span className="text-sky-600 text-xs mr-0.5">인도:</span>{currentDuty.leader}</p>
                 <p><span className="text-sky-600 text-xs mr-0.5">기도:</span>{currentDuty.prayer}</p>
              </div>
            ) : (<p className="text-sm font-bold text-stone-800">미정</p>)}
         </div>
      </div>

      {/* 4. 결석자 관리 */}
      {absentStudents.length > 0 && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 border-l-4 border-l-rose-400">
          <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center">
            <Users size={16} className="mr-1 text-rose-500" /> 오늘 결석자 빠른 심방
          </h3>
          <div className="space-y-3">
            {absentStudents.map(s => (
              <div key={s.id} className="flex flex-col bg-[#FFFCF9] p-3 rounded-lg border border-stone-100">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-sm font-bold text-stone-800">{s.name} <span className="text-xs text-stone-500 font-normal">({s.group})</span></p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleCall(s.phone)} className="p-2 bg-emerald-100 text-emerald-600 rounded-full shadow-sm"><Phone size={16} /></button>
                    <button onClick={() => openQuickLog(s)} className="p-2 bg-emerald-100 text-emerald-600 rounded-full shadow-sm"><FileText size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}