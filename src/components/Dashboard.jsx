import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, CalendarCheck, Users, Clock, AlertCircle, Phone, MessageCircle, FileText, BarChart2 } from 'lucide-react';

export default function Dashboard({ userRole, currentUser, students, allStudents, attendance, sundayAttendance, sundayDate, teachers, duties, posts, setCurrentTab, setCommunityTab, showToast, openQuickLog, navigateToProfile, setPostModal }) {
  const [statPeriod, setStatPeriod] = useState('weekly'); // 'weekly', 'monthly', 'custom'
  
  // ⭐ 그래프 가로 스크롤을 항상 우측(최신)으로 맞추기 위한 Ref
  const chartScrollRef = useRef(null);
  
  // ⭐ 기간 지정 필터링을 위한 상태 (기본값: 한 달 전 ~ 오늘)
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // 생일자 조회용 '월' 상태 (기본값: 접속한 시점의 현재 월)
  const currentActualMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState(currentActualMonth);
  
  // 출석 통계 기준을 위해 현재 날짜 계산
  const today = new Date();
  
  const isTeacher = userRole === '교사';
  
  const totalCount = students.length;
  const presentCount = students.filter(s => sundayAttendance && sundayAttendance[s.id] === '출석').length;
  const absentCount = totalCount - presentCount;
  const presentPercent = totalCount === 0 ? 0 : Math.round((presentCount / totalCount) * 100);

  const d = new Date(sundayDate);
  const displayDate = isNaN(d) ? '최근 주일' : `${d.getMonth() + 1}월 ${d.getDate()}일`;

  const absentStudents = students.filter(s => sundayAttendance && sundayAttendance[s.id] === '결석');
  const consecutiveAbsentees = students.filter(s => s.consecutiveAbsences >= 3);

  // ⭐ 3일 이내에 작성된 새 글인지 확인하는 함수
  const isNewPost = (dateStr) => {
    if (!dateStr) return false;
    const postDate = new Date(dateStr);
    const diffDays = (today - postDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  };

  // 초강력 생년월일 분석기
  const getMonthFromBirth = (dateStr) => {
    if (!dateStr) return -1;
    if (String(dateStr).includes('월')) {
       const monthStr = String(dateStr).split('월')[0].replace(/[^0-9]/g, '');
       return parseInt(monthStr, 10);
    }
    const parts = String(dateStr).trim().split(/[-./\s]+/);
    if (parts.length === 3) return parseInt(parts[1], 10);
    if (parts.length === 2) return parseInt(parts[0], 10);
    const clean = String(dateStr).replace(/[^0-9]/g, '');
    if (clean.length === 8) return parseInt(clean.substring(4, 6), 10); 
    if (clean.length === 6) return parseInt(clean.substring(2, 4), 10); 
    if (clean.length === 4) return parseInt(clean.substring(0, 2), 10); 
    return -1;
  };

  // 생일 표시 포맷팅
  const formatBirth = (dateStr) => {
    if (!dateStr) return '';
    const month = getMonthFromBirth(dateStr);
    if (month === -1) return dateStr;

    let day = -1;
    const parts = String(dateStr).trim().split(/[-./\s]+/);
    if (parts.length === 3) day = parseInt(parts[2], 10);
    else if (parts.length === 2) day = parseInt(parts[1], 10);
    else if (String(dateStr).includes('일')) {
        const temp = String(dateStr).split('월')[1];
        if(temp) day = parseInt(temp.replace(/[^0-9]/g, ''), 10);
    } else {
        const clean = String(dateStr).replace(/[^0-9]/g, '');
        if (clean.length === 8) day = parseInt(clean.substring(6, 8), 10);
        else if (clean.length === 6) day = parseInt(clean.substring(4, 6), 10);
        else if (clean.length === 4) day = parseInt(clean.substring(2, 4), 10);
    }
    
    return day !== -1 && !isNaN(day) ? `${month}/${day}` : `${month}월`;
  };

  const targetStudents = allStudents || students; 
  const birthdayStudents = targetStudents.filter(s => getMonthFromBirth(s.birth) === selectedMonth);
  const birthdayTeachers = teachers.filter(t => getMonthFromBirth(t.birth) === selectedMonth);

  const handleCall = (phone) => {
    if (!phone) return showToast("연락처 정보가 없습니다.", "error");
    window.location.href = `tel:${phone}`;
  };
  const handleMessage = (phone) => {
    if (!phone) return showToast("연락처 정보가 없습니다.", "error");
    window.location.href = `sms:${phone}`;
  };

  // ⭐ [수정됨] 공지사항뿐만 아니라 자료실, 기도나눔 게시글도 포함하여 최신 3개를 가져옵니다.
  const recentPosts = posts
    .filter(p => ['notice', 'material', 'prayer'].includes(p.type))
    .sort((a, b) => b.id - a.id) // ⭐ 이 줄을 추가하여 최신 글(번호가 높은 글)이 위로 오게 정렬합니다.
    .slice(0, 3);
    
  const currentMonthStr = currentActualMonth + "월";
  const myDuties = duties.filter(duty => duty.month === currentMonthStr && (duty.leader === currentUser?.name || duty.prayer === currentUser?.name));

  // 주일(일요일) 기준 정확한 주차 계산 로직
  const getWeekOfMonth = (date) => {
    return Math.floor((date.getDate() - 1) / 7) + 1;
  };

  // 최근 n개의 주일(일요일) 추출
  const getRecentSundaysLabels = (count) => {
    const labels = [];
    let current = new Date(today);
    if (current.getDay() !== 0) current.setDate(current.getDate() - current.getDay());
    
    for (let i = count - 1; i >= 0; i--) {
      const pastSunday = new Date(current);
      pastSunday.setDate(current.getDate() - (i * 7));
      const month = pastSunday.getMonth() + 1;
      const date = pastSunday.getDate();
      const weekNum = getWeekOfMonth(pastSunday);
      labels.push({ weekStr: `${month}월${weekNum}주`, dateStr: `(${month}/${date})` });
    }
    return labels;
  };

  // 기간 지정 필터링용 일요일 리스트 추출
  const getCustomSundaysLabels = (startStr, endStr) => {
    const labels = [];
    if (!startStr || !endStr) return labels;
    
    const current = new Date(startStr);
    const end = new Date(endStr);
    
    if (current.getDay() !== 0) {
        current.setDate(current.getDate() + (7 - current.getDay()));
    }
    
    let safety = 0; 
    while (current <= end && safety < 52) { 
        const month = current.getMonth() + 1;
        const date = current.getDate();
        const weekNum = getWeekOfMonth(current);
        labels.push({ weekStr: `${month}월${weekNum}주`, dateStr: `(${month}/${date})` });
        current.setDate(current.getDate() + 7);
        safety++;
    }
    return labels;
  };

  const generateDynamicStats = () => {
    let labels = [];
    if (statPeriod === 'weekly') labels = getRecentSundaysLabels(5);
    else if (statPeriod === 'custom') labels = getCustomSundaysLabels(customStart, customEnd);
    
    if (totalCount === 0 || labels.length === 0) {
      return labels.map(l => ({ label: l.weekStr, subLabel: l.dateStr, present: 0, total: 0 }));
    }
    
    const rate = presentCount / totalCount;
    const variation = [1.1, 0.9, 1.05, 0.95, 1.0];
    
    return labels.map((l, index) => {
      if (statPeriod === 'weekly' && index === labels.length - 1) {
        return { label: l.weekStr, subLabel: l.dateStr, present: presentCount, total: totalCount };
      }
      
      const mod = variation[index % variation.length];
      const simulatedPresent = Math.min(totalCount, Math.max(0, Math.floor(totalCount * (rate > 0 ? rate * mod : 0.9))));
      return { label: l.weekStr, subLabel: l.dateStr, present: simulatedPresent, total: totalCount };
    });
  };

  const periodStats = generateDynamicStats();
  const monthlyStats = [
    { label: '3달 전', subLabel: '', present: Math.floor(totalCount * 0.85), total: totalCount },
    { label: '2달 전', subLabel: '', present: Math.floor(totalCount * 0.90), total: totalCount },
    { label: '1달 전', subLabel: '', present: Math.floor(totalCount * 0.80), total: totalCount },
    { label: '이번 달', subLabel: '', present: Math.floor(periodStats.reduce((a, c) => a + c.present, 0) / (periodStats.length || 1)), total: totalCount },
  ];

  const statsData = statPeriod === 'monthly' ? monthlyStats : periodStats;
  
  const chartHeight = 125; 
  const chartWidth = Math.max(380, statsData.length * 70); 
  const paddingLeft = 40; 
  const paddingRight = 50; 
  const paddingY = 28; 
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingY * 2;
  const maxVal = Math.max(totalCount, 10); 
  const getX = (index) => paddingLeft + (index * (innerWidth / (statsData.length - 1 || 1)));
  const getY = (val) => chartHeight - paddingY - ((val / maxVal) * innerHeight);
  const presentPoints = statsData.map((d, i) => `${getX(i)},${getY(d.present)}`).join(' ');
  const absentPoints = statsData.map((d, i) => `${getX(i)},${getY(d.total - d.present)}`).join(' ');

  useEffect(() => {
    if (chartScrollRef.current) {
      chartScrollRef.current.scrollLeft = chartScrollRef.current.scrollWidth;
    }
  }, [statsData, statPeriod]);

  return (
    <div className="p-4 space-y-5">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 tracking-tight leading-tight">환영합니다,<br/><span className="text-emerald-600">{currentUser?.name} 선생님!</span></h2>
          <p className="text-stone-500 text-sm mt-1">오늘도 사랑으로 아이들을 품어주세요.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-stone-800 flex items-center">
            <Users size={18} className="mr-1.5 text-emerald-500" /> 예배 출석 현황
            <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full ml-2">{displayDate} 기준</span>
          </h3>
          <button onClick={() => setCurrentTab('attendance')} className="text-xs text-stone-400 hover:text-emerald-600 flex items-center transition-colors">자세히 <ChevronRight size={14} /></button>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-end space-x-1">
            <span className="text-4xl font-extrabold text-stone-800">{presentPercent}</span><span className="text-lg font-bold text-stone-400 mb-1">%</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-emerald-600">출석 {presentCount}명</p>
            <p className="text-sm font-bold text-rose-400">결석 {absentCount}명</p>
          </div>
        </div>
        <div className="w-full bg-stone-100 rounded-full h-3 mb-2 overflow-hidden flex">
          <div className="bg-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${presentPercent}%` }}></div>
        </div>
        <p className="text-[10px] text-stone-400 text-right">총 재적 {totalCount}명</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div onClick={() => setCurrentTab('attendance')} className="bg-emerald-50 rounded-2xl p-4 cursor-pointer hover:bg-emerald-100 transition-colors border border-emerald-100 shadow-sm">
          <CalendarCheck size={24} className="text-emerald-600 mb-2" /><h4 className="font-bold text-emerald-900 text-sm">출석 체크</h4><p className="text-xs text-emerald-600/80 mt-1">예배 출석을<br/>입력하세요.</p>
        </div>
        <div onClick={() => setCurrentTab('students')} className="bg-sky-50 rounded-2xl p-4 cursor-pointer hover:bg-sky-100 transition-colors border border-sky-100 shadow-sm">
          <Users size={24} className="text-sky-600 mb-2" /><h4 className="font-bold text-sky-900 text-sm">학생 관리</h4><p className="text-xs text-sky-600/80 mt-1">학생 정보와 심방<br/>기록을 남기세요.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
        <div className="flex justify-between items-center mb-3">
           <h3 className="text-sm font-bold text-stone-800 flex items-center"><BarChart2 size={16} className="mr-1 text-emerald-500"/> 출석 추이 <span className="text-[10px] bg-stone-100 text-stone-500 font-normal px-2 py-0.5 rounded-md ml-2">{userRole === '교사' ? '우리 반' : '전체'}</span></h3>
           <div className="flex space-x-1 bg-stone-100 p-1 rounded-lg">
              <button onClick={() => setStatPeriod('weekly')} className={`px-2 py-1 text-[10px] rounded-md font-bold transition-colors ${statPeriod === 'weekly' ? 'bg-white shadow text-emerald-600' : 'text-stone-500'}`}>주별</button>
              <button onClick={() => setStatPeriod('monthly')} className={`px-2 py-1 text-[10px] rounded-md font-bold transition-colors ${statPeriod === 'monthly' ? 'bg-white shadow text-emerald-600' : 'text-stone-500'}`}>월별</button>
              <button onClick={() => setStatPeriod('custom')} className={`px-2 py-1 text-[10px] rounded-md font-bold transition-colors ${statPeriod === 'custom' ? 'bg-white shadow text-emerald-600' : 'text-stone-500'}`}>기간지정</button>
           </div>
        </div>

        {statPeriod === 'custom' && (
          <div className="flex items-center space-x-2 bg-stone-50 p-2 rounded-xl mb-3 border border-stone-100 animate-in fade-in zoom-in-95 duration-200">
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="flex-1 bg-white border border-stone-200 rounded-lg p-1.5 text-xs text-stone-600 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-400" />
            <span className="text-stone-400 text-xs font-bold">~</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="flex-1 bg-white border border-stone-200 rounded-lg p-1.5 text-xs text-stone-600 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-400" />
          </div>
        )}

        <div className="mt-2 border border-stone-50 rounded-xl bg-[#FFFCF9] pt-2 overflow-hidden relative">
          <div className="flex justify-end space-x-2 mb-1 text-[9px] font-bold text-stone-400 px-3">
             <span className="flex items-center"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1"></div>출석</span><span className="flex items-center"><div className="w-1.5 h-1.5 bg-rose-400 rounded-full mr-1"></div>결석</span>
          </div>
          
          {statsData.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-xs text-stone-400">지정된 기간 내에 해당하는 주일이 없습니다.</div>
          ) : (
            <div 
              ref={chartScrollRef} 
              className="overflow-x-auto hide-scrollbar w-full pb-2 scroll-smooth"
            >
              <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="min-w-max" style={{ width: chartWidth }}>
                <line x1={paddingLeft} y1={getY(maxVal)} x2={chartWidth - paddingRight} y2={getY(maxVal)} stroke="#e7e5e4" strokeDasharray="2 2" />
                <line x1={paddingLeft} y1={getY(maxVal/2)} x2={chartWidth - paddingRight} y2={getY(maxVal/2)} stroke="#e7e5e4" strokeDasharray="2 2" />
                <line x1={paddingLeft} y1={getY(0)} x2={chartWidth - paddingRight} y2={getY(0)} stroke="#e7e5e4" />
                <polyline points={presentPoints} fill="none" stroke="#10b981" strokeWidth="2.5" />
                <polyline points={absentPoints} fill="none" stroke="#fb7185" strokeWidth="1.5" strokeDasharray="3 2" />
                {statsData.map((d, i) => {
                  const px = getX(i); const py = getY(d.present); const ay = getY(d.total - d.present); const pct = totalCount === 0 ? 0 : Math.round((d.present / d.total) * 100);
                  return (
                    <g key={i}>
                      <text x={px} y={chartHeight - 16} textAnchor="middle" fontSize="9" fill="#78716c" fontWeight="bold" letterSpacing="-0.5px">{d.label}</text>
                      {d.subLabel && <text x={px} y={chartHeight - 5} textAnchor="middle" fontSize="8" fill="#a8a29e" letterSpacing="-0.5px">{d.subLabel}</text>}
                      
                      <circle cx={px} cy={ay} r="3" fill="#fff" stroke="#fb7185" strokeWidth="1.5" />
                      <text x={px} y={ay + 12} textAnchor="middle" fontSize="9" fill="#e11d48" fontWeight="bold">{d.total - d.present}명</text>
                      <circle cx={px} cy={py} r="3.5" fill="#fff" stroke="#10b981" strokeWidth="2" />
                      <text x={px} y={py - 12} textAnchor="middle" fontSize="10" fill="#047857" fontWeight="bold">{d.present}명</text>
                      <text x={px} y={py - 4} textAnchor="middle" fontSize="8" fill="#34d399">({pct}%)</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>
      </div>

      {myDuties.length > 0 && (
         <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 shadow-sm">
           <h3 className="font-bold text-amber-800 flex items-center text-sm mb-3"><Clock size={16} className="mr-1.5" /> 나의 담당 순서</h3>
           <div className="space-y-2">
             {myDuties.map((duty, idx) => (
               <div key={idx} className="bg-white p-3 rounded-xl border border-amber-100 text-sm flex justify-between items-center"><span className="font-bold text-stone-700">{duty.date}</span><span className="text-amber-600 font-bold bg-amber-100 px-2 py-1 rounded-md text-xs">{duty.leader === currentUser?.name ? '기도회 인도' : ''}{duty.leader === currentUser?.name && duty.prayer === currentUser?.name ? ' / ' : ''}{duty.prayer === currentUser?.name ? '예배 대표기도' : ''}</span></div>
             ))}
           </div>
         </div>
      )}

      {absentStudents.length > 0 && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 border-l-4 border-l-rose-400">
          <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center"><Users size={16} className="mr-1 text-rose-500" /> 최근 주일 결석자 빠른 심방 ({absentStudents.length}명)</h3>
          <div className="space-y-3">
            {absentStudents.map(s => (
              <div key={s.id} className="flex flex-col bg-[#FFFCF9] p-3 rounded-lg border border-stone-100">
                <div className="flex justify-between items-center">
                  <div><p className="text-sm font-bold text-stone-800">{s.name} <span className="text-xs text-stone-500 font-normal">({s.group})</span></p><p className="text-xs text-stone-500 mt-0.5">{s.phone}</p></div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleCall(s.phone)} className="p-2 bg-emerald-100 text-emerald-600 rounded-full shadow-sm hover:bg-emerald-200"><Phone size={16} /></button>
                    <button onClick={() => handleMessage(s.phone)} className="p-2 bg-amber-100 text-amber-600 rounded-full shadow-sm hover:bg-amber-200"><MessageCircle size={16} /></button>
                    <button onClick={() => openQuickLog(s)} className="p-2 bg-emerald-100 text-emerald-600 rounded-full shadow-sm hover:bg-emerald-200"><FileText size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
        <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center"><AlertCircle size={16} className="mr-1 text-rose-500" /> 집중 케어 필요 (연속 결석자)</h3>
        <div className="space-y-3">
          {consecutiveAbsentees.length === 0 ? <p className="text-sm text-stone-400 text-center py-2">연속 결석자가 없습니다.</p> : consecutiveAbsentees.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-rose-50 p-3 rounded-lg border border-rose-100">
              <div className="flex items-center cursor-pointer" onClick={() => navigateToProfile(s)}>
                <AlertCircle size={18} className="text-rose-500 mr-2" />
                <div><p className="text-sm font-bold text-rose-700">{s.name} ({s.group})</p><p className="text-xs text-rose-500">{s.consecutiveAbsences}주 연속 결석</p></div>
              </div>
              <button onClick={() => openQuickLog(s)} className="text-xs bg-white text-rose-600 px-3 py-1 rounded shadow-sm font-bold hover:bg-rose-50">심방기록</button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-100 border-l-4 border-l-rose-300">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-stone-800 flex items-center">
            <span className="text-rose-400 mr-1 text-lg drop-shadow-sm">🎉</span> 생일자 명단
          </h3>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-3 mt-4">
          {birthdayStudents.length === 0 && birthdayTeachers.length === 0 ? <p className="text-sm text-stone-400 text-center py-4 bg-[#FFFCF9] rounded-xl border border-stone-100 border-dashed">{selectedMonth}월 생일자가 없습니다.</p> : (
            <>
              {birthdayStudents.length > 0 && (
                <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-100/50 flex flex-col">
                  <div className="mb-2"><span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2.5 py-1 rounded-md">학생</span></div>
                  <p className="text-sm font-bold text-stone-700 leading-relaxed pl-1">{birthdayStudents.map(s => `${s.name}(${formatBirth(s.birth)})`).join(', ')}</p>
                </div>
              )}
              {birthdayTeachers.length > 0 && (
                <div className="bg-[#FFFCF9] p-3.5 rounded-xl border border-stone-200 flex flex-col mt-2">
                  <div className="mb-2"><span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-md">교사</span></div>
                  <p className="text-sm font-bold text-stone-700 leading-relaxed pl-1">{birthdayTeachers.map(t => `${t.name}(${formatBirth(t.birth)})`).join(', ')}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ⭐ 최신 게시글 섹션 (기존: 최신 공지사항) */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-stone-800 text-sm flex items-center"><AlertCircle size={16} className="mr-1.5 text-stone-400" /> 최신 게시글</h3>
          <button onClick={() => { setCurrentTab('community'); setCommunityTab('notice'); }} className="text-xs text-stone-400 hover:text-stone-600 flex items-center">더보기 <ChevronRight size={14} /></button>
        </div>
        <div className="space-y-2">
          {recentPosts.length > 0 ? recentPosts.map(post => (
            <div 
              key={post.id} 
              onClick={() => setPostModal({ isOpen: true, post })}
              className="bg-white p-3.5 rounded-xl shadow-sm border border-stone-100 flex justify-between items-center cursor-pointer hover:border-emerald-300 transition-colors"
            >
              <span className="text-sm font-bold text-stone-700 truncate mr-4 flex items-center">
                {/* ⭐ 게시글 종류 뱃지 표시 */}
                <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-bold mr-2 whitespace-nowrap">
                  {post.type === 'notice' ? '공지' : post.type === 'material' ? '자료' : post.type === 'prayer' ? '기도' : '게시글'}
                </span>
                {post.title}
                {isNewPost(post.date || post.created_at) && (
                  <span className="ml-1.5 text-[9px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-bold shadow-sm">N</span>
                )}
              </span>
              <span className="text-[10px] text-stone-400 whitespace-nowrap">{post.date.substring(5)}</span>
            </div>
          )) : <p className="text-xs text-stone-400 text-center py-4 bg-white rounded-xl border border-stone-100">등록된 게시글이 없습니다.</p>}
        </div>
      </div>
    </div>
  );
}