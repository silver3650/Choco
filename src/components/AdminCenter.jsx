import React, { useState, useEffect } from 'react';
import { Settings, Church, MapPin, Save, Plus, UserCog, Check, X, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../supabase';

export default function AdminCenter({ 
  currentUser, setCurrentUser, students, setStudents, teachers, setTeachers, 
  pendingTeachers, setPendingTeachers, uniqueGroups, showToast 
}) {
  const [adminView, setAdminView] = useState('stats');
  const [statPeriod, setStatPeriod] = useState('weekly');
  const [batchGroup, setBatchGroup] = useState('1반');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [batchFilterGroup, setBatchFilterGroup] = useState('전체');
  
  const [newGroupName, setNewGroupName] = useState('');
  const [addedGroups, setAddedGroups] = useState([]); 
  const [editingTeacher, setEditingTeacher] = useState(null);

  // ⭐ 실제 출석 데이터를 담을 상태
  const [attHistory, setAttHistory] = useState([]);

  // 기간 지정용 상태
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0]);

  // ⭐ [정렬] 반 이름: '전체'를 맨 앞에 두고, 나머지는 가나다순으로 정렬
  const sortedGroups = ['전체', ...Array.from(new Set([...uniqueGroups, ...addedGroups]))
    .filter(g => g !== '전체')
    .sort((a, b) => a.localeCompare(b, 'ko-KR'))];

  // ⭐ [정렬] 교사 목록: 가나다순 정렬
  const sortedTeachers = [...teachers].sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));

  // ⭐ [정렬] 학생 목록: 학년순 정렬 (학년이 없으면 이름 가나다순)
  const gradeOrder = ['유아', '유치', '초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3', '청년'];
  const sortedStudents = [...students].sort((a, b) => {
    const idxA = gradeOrder.indexOf(a.grade);
    const idxB = gradeOrder.indexOf(b.grade);
    if (idxA === -1 && idxB === -1) return (a.name || '').localeCompare(b.name || '', 'ko-KR');
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  // ⭐ 통계 탭이 열리면 데이터베이스에서 전체 학생의 실제 출석 기록을 불러옴
  useEffect(() => {
    if (adminView === 'stats' && students.length > 0) {
      const fetchHistory = async () => {
        const studentIds = students.map(s => s.id);
        const { data, error } = await supabase.from('attendance')
          .select('attendance_date, status, student_id')
          .in('student_id', studentIds);
        if (!error && data) {
          setAttHistory(data);
        }
      };
      fetchHistory();
    }
  }, [adminView, students]);

  // 날짜 변환 헬퍼 함수
  const getLocalYYYYMMDD = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getWeekOfMonth = (date) => Math.floor((date.getDate() - 1) / 7) + 1;

  // ⭐ 실제 데이터를 바탕으로 그래프 통계 생성
  const statsData = (() => {
    const today = new Date();
    
    // 월별 통계
    if (statPeriod === 'monthly') {
      let monthStats = [];
      for (let i = 3; i >= 0; i--) {
        const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const targetMonth = targetDate.getMonth() + 1;
        const targetYear = targetDate.getFullYear();
        
        const recordsInMonth = attHistory.filter(r => {
          if (!r.attendance_date) return false;
          const parts = r.attendance_date.split('-');
          return parseInt(parts[0], 10) === targetYear && parseInt(parts[1], 10) === targetMonth;
        });
        
        const distinctDates = [...new Set(recordsInMonth.map(r => r.attendance_date))];
        let totalPresent = 0;
        distinctDates.forEach(date => {
           totalPresent += recordsInMonth.filter(r => r.attendance_date === date && r.status === '출석').length;
        });
        
        const avgPresent = distinctDates.length > 0 ? Math.round(totalPresent / distinctDates.length) : 0;
        monthStats.push({ label: i === 0 ? '이번 달' : `${i}달 전`, subLabel: '', present: avgPresent, total: students.length });
      }
      return monthStats;
    } 
    
    // 주별 & 기간별 통계
    let dates = [];
    if (statPeriod === 'weekly') {
      let current = new Date(today);
      if (current.getDay() !== 0) current.setDate(current.getDate() - current.getDay());
      for (let i = 4; i >= 0; i--) {
        const d = new Date(current); d.setDate(current.getDate() - (i * 7)); dates.push(d);
      }
    } else if (statPeriod === 'custom') {
      const start = new Date(customStart); const end = new Date(customEnd);
      if (start.getDay() !== 0) start.setDate(start.getDate() + (7 - start.getDay()));
      let current = new Date(start); let safety = 0;
      while(current <= end && safety < 52) {
          dates.push(new Date(current)); current.setDate(current.getDate() + 7); safety++;
      }
    }

    return dates.map(dateObj => {
      const dateStr = getLocalYYYYMMDD(dateObj);
      const month = dateObj.getMonth() + 1;
      const dateNum = dateObj.getDate();
      const weekNum = getWeekOfMonth(dateObj);
      const records = attHistory.filter(r => r.attendance_date === dateStr);
      const present = records.filter(r => r.status === '출석').length;
      return {
          label: `${month}월${weekNum}주`,
          subLabel: `(${month}/${dateNum})`,
          present: present,
          total: students.length
      };
    });
  })();
  
  const chartHeight = 190; 
  const chartWidth = Math.max(340, statsData.length * 60); 
  const paddingX = 30;
  const paddingY = 45; 
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;
  const maxVal = Math.max(...statsData.map(d => d.total), students.length, 10); 
  const getX = (index) => paddingX + (index * (innerWidth / (statsData.length - 1 || 1)));
  const getY = (val) => chartHeight - paddingY - ((val / maxVal) * innerHeight);

  const presentPoints = statsData.map((d, i) => `${getX(i)},${getY(d.present)}`).join(' ');
  const absentPoints = statsData.map((d, i) => `${getX(i)},${getY(d.total - d.present)}`).join(' ');

  const toggleStudentSelection = (id) => setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(studentId => studentId !== id) : [...prev, id]);

  const handleBatchGroupChange = async () => {
    if(selectedStudentIds.length === 0) { showToast("학생을 먼저 선택해주세요.", "error"); return; }
    const { error } = await supabase.from('students').update({ class_name: batchGroup }).in('id', selectedStudentIds);
    if (error) { showToast("반 배정 업데이트에 실패했습니다.", "error"); return; }
    setStudents(students.map(s => selectedStudentIds.includes(s.id) ? { ...s, group: batchGroup } : s));
    setSelectedStudentIds([]);
    showToast(`선택된 ${selectedStudentIds.length}명의 학생이 ${batchGroup}(으)로 이동되었습니다.`);
  };

  const handleAddGroup = async () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) return;
    if (sortedGroups.includes(trimmedName)) { showToast("이미 존재하는 반입니다.", "error"); return; }
    const { error } = await supabase.from('teachers').insert([{ church_id: currentUser.churchId, name: '신규담당교사', class_name: trimmedName, role: '교사', phone: '000-0000-0000' }]);
    if (error) { showToast("반 추가에 실패했습니다.", "error"); } 
    else {
      showToast(`'${trimmedName}' 반이 추가되었습니다!`);
      setAddedGroups(prev => [...prev, trimmedName]);
      setNewGroupName('');
      if (batchGroup === '1반' && sortedGroups.length === 1) setBatchGroup(trimmedName);
    }
  };

  const handleSaveTeacherInfo = async () => {
    if (!editingTeacher || !editingTeacher.name.trim()) return;
    const { error } = await supabase.from('teachers').update({ 
      name: editingTeacher.name, email: editingTeacher.email, phone: editingTeacher.phone, 
      birth: editingTeacher.birth, role: editingTeacher.role, class_name: editingTeacher.group 
    }).eq('id', editingTeacher.id);

    if (error) { showToast("교사 정보 수정에 실패했습니다.", "error"); } 
    else {
      showToast(`${editingTeacher.name} 선생님의 프로필이 완벽하게 업데이트되었습니다!`);
      if (setTeachers) { setTeachers(teachers.map(t => t.id === editingTeacher.id ? { ...t, name: editingTeacher.name, email: editingTeacher.email, phone: editingTeacher.phone, birth: editingTeacher.birth, role: editingTeacher.role, group: editingTeacher.group, class_name: editingTeacher.group } : t)); } 
      else { setTimeout(() => window.location.reload(), 1500); }
      setEditingTeacher(null);
    }
  };

  const handleDeleteTeacher = async (e, teacherId, teacherName) => {
    e.stopPropagation(); 
    const confirmDelete = window.confirm(`[경고] ${teacherName} 선생님을 정식 교사 명단에서 완전히 삭제하시겠습니까?`);
    if (!confirmDelete) return;

    const { error } = await supabase.from('teachers').delete().eq('id', teacherId);
    if (error) { showToast("교사 삭제 중 서버 오류가 발생했습니다.", "error"); } 
    else { showToast(`${teacherName} 선생님이 명단에서 삭제되었습니다.`); setTeachers(teachers.filter(t => t.id !== teacherId)); }
  };

  const handlePendingChange = (id, field, value) => setPendingTeachers(prev => prev.map(pt => pt.id === id ? { ...pt, [field]: value } : pt));
  
  const handleApproveTeacher = async (teacher) => {
    // 승인 시 그룹을 선택하지 않아 '미정'이거나 비어있으면 '전체'로 기본 설정
    const finalGroup = (teacher.group === '미정' || !teacher.group) ? '전체' : teacher.group;
    const { data, error } = await supabase.from('teachers').update({ role: teacher.role, class_name: finalGroup }).eq('id', teacher.id).select().single();

    if (error) { showToast("승인 처리에 실패했습니다.", "error"); } 
    else {
      showToast(`${teacher.name} 선생님이 정식 교사로 승인되었습니다!`);
      if (setTeachers) setTeachers([...teachers, { ...data, group: data.class_name }]);
      if (setPendingTeachers) setPendingTeachers(prev => prev.filter(pt => pt.id !== teacher.id));
    }
  };

  const handleRejectPendingTeacher = async (teacherId, teacherName) => {
    const confirmReject = window.confirm(`${teacherName} 선생님의 가입 신청을 거절하고 명단에서 삭제하시겠습니까?`);
    if (!confirmReject) return;

    const { error } = await supabase.from('teachers').delete().eq('id', teacherId);
    if (error) { showToast("거절 처리 중 오류가 발생했습니다.", "error"); } 
    else { showToast(`${teacherName} 선생님의 가입이 거절되었습니다.`); setPendingTeachers(pendingTeachers.filter(pt => pt.id !== teacherId)); }
  };

  const handleSaveChurchSettings = async () => {
    const { error } = await supabase.from('churches').update({ name: currentUser.churchName, dept: currentUser.deptName, pastor_name: currentUser.pastorName, address: currentUser.address, logo: currentUser.logo }).eq('id', currentUser.churchId);
    if (error) { showToast("교회 설정 저장에 실패했습니다. (서버 오류)", "error"); } 
    else { showToast("교회 설정이 성공적으로 저장 및 반영되었습니다!"); }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2"><h2 className="text-lg font-bold text-stone-800 flex items-center"><Settings size={18} className="mr-1.5 text-emerald-500"/>관리자 센터</h2></div>
      <div className="flex bg-stone-200 p-1 rounded-xl mb-4 text-center overflow-x-auto hide-scrollbar">
        <button onClick={() => setAdminView('stats')} className={`whitespace-nowrap px-3 py-2 text-xs font-bold rounded-lg transition-colors flex-1 ${adminView === 'stats' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}>출석 통계</button>
        <button onClick={() => setAdminView('teachers')} className={`whitespace-nowrap px-3 py-2 text-xs font-bold rounded-lg transition-colors flex-1 ${adminView === 'teachers' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}>교사/반 관리</button>
        <button onClick={() => setAdminView('settings')} className={`whitespace-nowrap px-3 py-2 text-xs font-bold rounded-lg transition-colors flex-1 ${adminView === 'settings' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}>교회 설정</button>
      </div>

      {adminView === 'settings' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 animate-in fade-in">
          <h3 className="font-bold text-stone-800 mb-4 flex items-center"><Church size={16} className="mr-2 text-emerald-400"/> 교회 정보 편집</h3>
          <div className="space-y-4">
            <div><label className="block text-xs font-bold text-stone-700 mb-1">교회 로고 (이미지 주소 URL)</label><input type="text" value={currentUser.logo || ''} onChange={e => setCurrentUser({...currentUser, logo: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-sm" /></div>
            <div><label className="block text-xs font-bold text-stone-700 mb-1">교회 이름</label><input type="text" value={currentUser.churchName} onChange={e => setCurrentUser({...currentUser, churchName: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-sm" /></div>
            <div><label className="block text-xs font-bold text-stone-700 mb-1">부서 이름</label><input type="text" value={currentUser.deptName} onChange={e => setCurrentUser({...currentUser, deptName: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-sm" /></div>
            <div><label className="block text-xs font-bold text-stone-700 mb-1">담당 사역자</label><input type="text" value={currentUser.pastorName || ''} onChange={e => setCurrentUser({...currentUser, pastorName: e.target.value})} placeholder="이름을 입력하세요" className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-sm" /></div>
            <div><label className="block text-xs font-bold text-stone-700 mb-1">교회 주소</label><div className="flex"><div className="bg-stone-100 border border-stone-200 border-r-0 rounded-l-lg px-3 flex items-center justify-center"><MapPin size={16} className="text-stone-400"/></div><input type="text" value={currentUser.address || ''} onChange={e => setCurrentUser({...currentUser, address: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-r-lg px-3 py-2.5 text-sm" /></div></div>
            <div className="pt-2"><button onClick={handleSaveChurchSettings} className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm hover:bg-emerald-600 transition-colors"><Save size={16} className="mr-2 inline" /> 변경사항 저장</button></div>
          </div>
        </div>
      )}

      {adminView === 'stats' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
          <div className="mb-4">
            <h3 className="font-bold text-stone-800 mb-3">출석 현황 추이</h3>
            <div className="flex bg-stone-100 p-1 rounded-lg w-full">
              <button onClick={() => setStatPeriod('weekly')} className={`flex-1 py-1 text-xs rounded-md font-bold ${statPeriod === 'weekly' ? 'bg-white shadow text-emerald-600' : 'text-stone-500'}`}>주별</button>
              <button onClick={() => setStatPeriod('monthly')} className={`flex-1 py-1 text-xs rounded-md font-bold ${statPeriod === 'monthly' ? 'bg-white shadow text-emerald-600' : 'text-stone-500'}`}>월별(평균)</button>
              <button onClick={() => setStatPeriod('custom')} className={`flex-1 py-1 text-xs rounded-md font-bold ${statPeriod === 'custom' ? 'bg-white shadow text-emerald-600' : 'text-stone-500'}`}>기간별</button>
            </div>
          </div>
          {statPeriod === 'custom' && (
            <div className="mb-4 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between"><div className="flex items-center space-x-2 text-xs"><input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-white border rounded p-1" /><span>~</span><input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-white border rounded p-1" /></div><button className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">조회</button></div>
          )}
          <div className="mt-4 border border-stone-100 rounded-xl bg-[#FFFCF9] pt-4 overflow-hidden relative">
            <div className="flex justify-end space-x-3 mb-2 text-[10px] font-bold text-stone-400 px-4"><span className="flex items-center"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>출석</span><span className="flex items-center"><div className="w-2 h-2 bg-rose-400 rounded-full mr-1"></div>결석</span></div>
            
            {statsData.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-xs text-stone-400">데이터가 없습니다.</div>
            ) : (
              <div className="overflow-x-auto hide-scrollbar w-full pb-2">
                <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="min-w-max" style={{ width: chartWidth }}>
                  <line x1={paddingX} y1={getY(maxVal)} x2={chartWidth - paddingX} y2={getY(maxVal)} stroke="#e7e5e4" strokeDasharray="3 3" />
                  <line x1={paddingX} y1={getY(maxVal/2)} x2={chartWidth - paddingX} y2={getY(maxVal/2)} stroke="#e7e5e4" strokeDasharray="3 3" />
                  <line x1={paddingX} y1={getY(0)} x2={chartWidth - paddingX} y2={getY(0)} stroke="#e7e5e4" />
                  <polyline points={presentPoints} fill="none" stroke="#10b981" strokeWidth="3" />
                  <polyline points={absentPoints} fill="none" stroke="#fb7185" strokeWidth="2" strokeDasharray="4 2" />
                  {statsData.map((d, i) => {
                    const px = getX(i); const py = getY(d.present); const ay = getY(d.total - d.present); const pct = Math.round((d.present / d.total) * 100) || 0;
                    return (
                      <g key={i}>
                        <text x={px} y={chartHeight - 22} textAnchor="middle" fontSize="10" fill="#78716c" fontWeight="bold">{d.label}</text>
                        {d.subLabel && <text x={px} y={chartHeight - 10} textAnchor="middle" fontSize="9" fill="#a8a29e">{d.subLabel}</text>}
                        <circle cx={px} cy={ay} r="4" fill="#fff" stroke="#fb7185" strokeWidth="2" />
                        <text x={px} y={ay + 16} textAnchor="middle" fontSize="10" fill="#e11d48" fontWeight="bold">{d.total - d.present}명</text>
                        <circle cx={px} cy={py} r="5" fill="#fff" stroke="#10b981" strokeWidth="2.5" />
                        <text x={px} y={py - 16} textAnchor="middle" fontSize="12" fill="#047857" fontWeight="bold">{d.present}명</text>
                        <text x={px} y={py - 6} textAnchor="middle" fontSize="9" fill="#34d399">({pct}%)</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>
        </div>
      )}

      {adminView === 'teachers' && (
        <div className="space-y-4">
           <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 mb-4">
             <h3 className="font-bold text-stone-800 text-sm mb-3">새로운 반 추가</h3>
             <div className="flex space-x-2"><input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="예: 고3부, 부장" className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm" /><button onClick={handleAddGroup} className="bg-emerald-500 text-white px-4 rounded-lg text-xs font-bold">추가</button></div>
             <div className="flex flex-wrap gap-2 mt-3">{sortedGroups.filter(g => g !== '전체').map(g => <span key={g} className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-md font-bold">{g}</span>)}</div>
           </div>

           <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-stone-800 text-sm">학생 반 일괄 배정 관리</h3>
               {/* ⭐ 드롭다운 기본값 '전체 보기'가 맨 위에 정렬됨 */}
               <select value={batchFilterGroup} onChange={(e) => setBatchFilterGroup(e.target.value)} className="text-xs font-bold bg-stone-50 border border-stone-200 rounded-lg p-1.5 text-stone-700">
                 {sortedGroups.map(g => <option key={g} value={g}>{g === '전체' ? '전체 보기' : `${g} 보기`}</option>)}
               </select>
             </div>
             
             {selectedStudentIds.length > 0 && (
               <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 mb-3 flex items-center justify-between"><span className="text-xs font-bold text-emerald-700">{selectedStudentIds.length}명 선택됨</span><div className="flex space-x-2"><select value={batchGroup} onChange={(e) => setBatchGroup(e.target.value)} className="text-xs font-bold border rounded-md py-1 px-2">{sortedGroups.filter(g => g !== '전체').map(g => <option key={g} value={g}>{g}</option>)}</select><button onClick={handleBatchGroupChange} className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-md">이동</button></div></div>
             )}
             <div className="border border-stone-100 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
               {/* ⭐ 학생 목록 학년순 정렬 반영 (sortedStudents) */}
               {sortedStudents.filter(s => batchFilterGroup === '전체' || s.group === batchFilterGroup).map(student => (
                 <div key={`batch-${student.id}`} onClick={() => toggleStudentSelection(student.id)} className={`flex items-center p-3 border-b border-stone-100 cursor-pointer ${selectedStudentIds.includes(student.id) ? 'bg-emerald-50/50' : 'hover:bg-[#FFFCF9]'}`}>
                   <div className={`w-4 h-4 rounded-sm border mr-3 flex items-center justify-center ${selectedStudentIds.includes(student.id) ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-stone-300'}`}>{selectedStudentIds.includes(student.id) && <Check size={12} className="text-white" />}</div>
                   <div className="flex-1"><p className="text-sm font-bold text-stone-800">{student.name}</p><p className="text-[10px] text-stone-500">{student.grade || '학년 미상'} • 현재: <span className="font-bold text-sky-600">{student.group}</span></p></div>
                 </div>
               ))}
             </div>
           </div>

          {pendingTeachers && pendingTeachers.length > 0 && (
            <div className="bg-amber-50 p-4 rounded-xl shadow-sm border border-amber-100 mb-4 animate-in fade-in">
              <h3 className="font-bold text-amber-800 text-sm mb-3">승인 대기중인 교사 ({pendingTeachers.length})</h3>
              {pendingTeachers.map(pt => (
                <div key={pt.id} className="bg-white p-3 rounded-lg border border-amber-200 flex flex-col space-y-3 mb-3">
                  <div className="flex justify-between items-center"><div><p className="text-sm font-bold text-stone-800">{pt.name}</p><p className="text-[10px] text-stone-500">{pt.email} • {pt.date}</p></div><span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">가입대기</span></div>
                  <div className="flex space-x-2">
                    <select value={pt.role} onChange={(e) => handlePendingChange(pt.id, 'role', e.target.value)} className="flex-1 text-xs font-bold border rounded p-1.5"><option value="교사">교사</option><option value="부장">부장</option><option value="담당목사">담당목사</option></select>
                    {/* ⭐ 승인 대기중 교사 그룹: 기본값 '전체', 가나다순 정렬된 sortedGroups 사용 */}
                    <select value={pt.group === '미정' || !pt.group ? '전체' : pt.group} onChange={(e) => handlePendingChange(pt.id, 'group', e.target.value)} className="flex-1 text-xs font-bold border rounded p-1.5">
                      {sortedGroups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <button onClick={() => handleApproveTeacher(pt)} className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded">승인</button>
                    <button onClick={() => handleRejectPendingTeacher(pt.id, pt.name)} className="bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded">거절</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center mb-2 mt-6"><span className="text-sm font-bold text-stone-800">정식 등록 교사 ({teachers.length}명)</span></div>
          {/* ⭐ 정식 등록 교사 리스트: 이름 가나다순 정렬 반영 (sortedTeachers) */}
          {sortedTeachers.map(teacher => (
            <div key={teacher.id} onClick={() => setEditingTeacher({...teacher})} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex justify-between items-center cursor-pointer hover:border-emerald-200">
              <div className="flex items-center"><div className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center text-sky-600 mr-3"><UserCog size={20} /></div><div><h3 className="font-bold text-stone-800">{teacher.name} <span className="text-xs font-normal text-stone-400 ml-1">{teacher.group}</span></h3><p className="text-[10px] text-stone-500">{teacher.email || teacher.phone || '연락처 미입력'}</p></div></div>
              <div className="flex items-center">
                <div className="text-xs font-bold px-2 py-1 bg-stone-100 text-stone-600 rounded-md mr-2">{teacher.role}</div>
                <Edit size={14} className="text-stone-400 mr-2" />
                <button onClick={(e) => handleDeleteTeacher(e, teacher.id, teacher.name)} className="text-rose-400 p-1.5 hover:bg-rose-50 rounded transition-colors" title="교사 삭제">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingTeacher && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-stone-100"><h3 className="font-bold text-stone-800 flex items-center text-sm"><UserCog size={18} className="mr-2 text-emerald-500" /> 교사 상세 프로필 설정</h3><button onClick={() => setEditingTeacher(null)} className="text-stone-400"><X size={16} /></button></div>
            <div className="p-5 space-y-4">
              <div><label className="block text-xs font-bold text-stone-600 mb-1">교사 이름</label><input type="text" value={editingTeacher.name} onChange={(e) => setEditingTeacher({...editingTeacher, name: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm" /></div>
              <div><label className="block text-xs font-bold text-stone-600 mb-1">이메일 계정 (로그인 시 사용)</label><input type="email" value={editingTeacher.email || ''} onChange={(e) => setEditingTeacher({...editingTeacher, email: e.target.value})} placeholder="user@church.com" className="w-full border rounded-lg p-2.5 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-stone-600 mb-1">연락처</label><input type="text" value={editingTeacher.phone || ''} onChange={(e) => setEditingTeacher({...editingTeacher, phone: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm" /></div>
                <div><label className="block text-xs font-bold text-stone-600 mb-1">생년월일</label><input type="text" value={editingTeacher.birth || ''} onChange={(e) => setEditingTeacher({...editingTeacher, birth: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm" /></div>
              </div>
              <div><label className="block text-xs font-bold text-stone-600 mb-1">직분 (역할 변경)</label><select value={editingTeacher.role} onChange={(e) => setEditingTeacher({...editingTeacher, role: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm"><option value="교사">교사</option><option value="부장">부장</option><option value="담당목사">담당목사</option></select></div>
              {/* ⭐ 프로필 설정의 담당 반 드롭다운도 가나다순 반영 */}
              <div><label className="block text-xs font-bold text-stone-600 mb-1">담당 반 지정 (매칭)</label><select value={editingTeacher.group} onChange={(e) => setEditingTeacher({...editingTeacher, group: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm">{sortedGroups.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
            </div>
            <div className="p-4 border-t border-stone-100 flex justify-end space-x-2"><button onClick={() => setEditingTeacher(null)} className="px-4 py-2 border rounded-lg text-xs font-bold">취소</button><button onClick={handleSaveTeacherInfo} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold">저장 및 반영</button></div>
          </div>
        </div>
      )}
    </div>
  );
}