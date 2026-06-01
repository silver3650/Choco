import React from 'react';
import { Calendar, QrCode, CheckCircle2 } from 'lucide-react';

export default function Attendance({
  userRole, currentUser, students, teachers, attendance,
  selectedGroupFilter, setSelectedGroupFilter, uniqueGroups,
  handleAttendance, handleAllPresent, showToast
}) {
  const isTeacher = userRole === '교사';
  let displayStudents = students;
  
  if (isTeacher) {
     displayStudents = students.filter(s => s.group === currentUser.group);
  } else {
     if (selectedGroupFilter !== '전체') {
       displayStudents = students.filter(s => s.group === selectedGroupFilter);
     }
  }

  const currentTeacher = isTeacher ? currentUser.name : (teachers.find(t => t.group === selectedGroupFilter)?.name || '담당자 없음');

  const renderSummaryAndList = (groupName, groupStudents) => {
    const presentCount = groupStudents.filter(s => attendance[s.id] === '출석' || attendance[s.id] === '온라인').length;
    const absentCount = groupStudents.filter(s => attendance[s.id] === '결석').length;
    const presentNames = groupStudents.filter(s => attendance[s.id] === '출석' || attendance[s.id] === '온라인').map(s => s.name).join(', ');
    const absentNames = groupStudents.filter(s => attendance[s.id] === '결석').map(s => s.name).join(', ');

    return (
      <div key={groupName} className="mb-6">
        <div className="bg-[#FFFCF9] p-3 rounded-xl border border-stone-200 mb-3">
           <p className="text-xs font-bold text-stone-800 mb-1">{groupName} 출결 요약</p>
           <p className="text-[11px] text-stone-600 leading-relaxed"><span className="font-bold text-emerald-600">출석자({presentCount}명):</span> {presentNames || '-'}</p>
           <p className="text-[11px] text-stone-600 leading-relaxed"><span className="font-bold text-rose-500">결석자({absentCount}명):</span> {absentNames || '-'}</p>
        </div>
        <div className="space-y-3">
          {groupStudents.map(student => {
            const status = attendance[student.id] || '미입력';
            const isNotEntered = status === '미입력';
            return (
              <div key={student.id} className={`bg-white p-4 rounded-xl shadow-sm border flex flex-col ${isNotEntered ? 'border-amber-300 border-l-4 bg-amber-50/20' : 'border-stone-100'}`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 font-bold mr-3">{student.name.charAt(0)}</div>
                    <div>
                      <h3 className="font-bold text-stone-800">{student.name} {isNotEntered && <span className="text-[10px] text-amber-500 bg-amber-100 px-1 py-0.5 rounded ml-1 font-bold">미입력</span>}</h3>
                      <p className="text-xs text-stone-500">{student.grade} • {student.group}</p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {['출석', '온라인', '지각', '결석'].map(target => {
                    const isActive = status === target;
                    let activeColor = 'bg-stone-100 text-stone-500 border border-stone-200';
                    if(isActive) {
                      if(target==='출석') activeColor = 'bg-emerald-500 text-white shadow-inner border-emerald-500';
                      if(target==='온라인') activeColor = 'bg-sky-400 text-white shadow-inner border-sky-400';
                      if(target==='지각') activeColor = 'bg-amber-400 text-white shadow-inner border-amber-400';
                      if(target==='결석') activeColor = 'bg-rose-500 text-white shadow-inner border-rose-500';
                    }
                    return (
                      <button key={target} onClick={() => handleAttendance(student.id, target)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex-1 ${activeColor}`}>{target}</button>
                    );
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex justify-between items-end mb-4 border-b border-stone-200 pb-2">
        <div>
          <h2 className="text-lg font-bold text-stone-800">출석 체크</h2>
          <p className="text-xs text-emerald-500 font-bold mt-1 flex items-center"><Calendar size={12} className="mr-1"/> 2026년 6월 7일 (6월 1주차)</p>
        </div>
        <button className="flex items-center text-sm bg-emerald-500 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-600 transition-colors" onClick={() => showToast("QR 카메라 스캐너를 실행합니다.", 'info')}><QrCode size={16} className="mr-1" /> QR 스캔</button>
      </div>

      {!isTeacher && (
        <div className="flex overflow-x-auto hide-scrollbar space-x-2 mb-4 pb-1">
          {uniqueGroups.map(group => (
            <button key={group} onClick={() => setSelectedGroupFilter(group)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-all ${selectedGroupFilter === group ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'}`}>
              {group}
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mb-4 px-1">
        <div className="flex items-center">
          <span className="text-sm font-bold text-stone-800 mr-2">총 {displayStudents.length}명</span>
          {selectedGroupFilter !== '전체' && <span className="text-[10px] bg-sky-50 text-sky-600 px-2 py-1 rounded font-bold border border-sky-100">담당: {currentTeacher}</span>}
        </div>
        <button onClick={() => handleAllPresent(displayStudents)} className="text-xs text-emerald-600 font-bold flex items-center bg-emerald-50 px-2 py-1.5 rounded-lg shadow-sm hover:bg-emerald-100 transition-colors">
          <CheckCircle2 size={14} className="mr-1" /> 미입력 일괄 출석
        </button>
      </div>

      {displayStudents.length === 0 ? (
        <p className="p-6 text-center text-stone-400 text-sm bg-white rounded-xl">해당 반에 학생이 없습니다.</p>
      ) : (
        selectedGroupFilter === '전체' && !isTeacher ? (
          <div className="grid grid-cols-2 gap-3 pb-4 animate-in fade-in">
            {/* 전체 보기용 그리드 카드 (생략) */}
            <p className="text-sm text-stone-500 p-2">전체 반 요약 그리드 뷰 영역입니다.</p>
          </div>
        ) : (
          renderSummaryAndList(isTeacher ? currentUser.group : selectedGroupFilter, displayStudents)
        )
      )}
    </div>
  );
}