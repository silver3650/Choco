import React, { useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight, CheckCircle2, Circle, XCircle, Users } from 'lucide-react';

export default function Attendance({
  userRole, currentUser, students, attendance, uniqueGroups,
  handleAttendance, handleAllPresent, showToast,
  selectedAttDate, setSelectedAttDate, fetchAttendanceByDate
}) {
  const [filterGroup, setFilterGroup] = useState(userRole === '교사' ? currentUser.group : '전체');

  // ⭐ 날짜가 바뀌면 해당 날짜의 데이터를 서버(Supabase)에서 새로 불러옴
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedAttDate(newDate);
    fetchAttendanceByDate(newDate);
  };

  const handlePrevWeek = () => {
    const d = new Date(selectedAttDate);
    d.setDate(d.getDate() - 7);
    const newDate = d.toISOString().split('T')[0];
    setSelectedAttDate(newDate);
    fetchAttendanceByDate(newDate);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedAttDate);
    d.setDate(d.getDate() + 7);
    const newDate = d.toISOString().split('T')[0];
    setSelectedAttDate(newDate);
    fetchAttendanceByDate(newDate);
  };

  const setToday = () => {
    const newDate = new Date().toISOString().split('T')[0];
    setSelectedAttDate(newDate);
    fetchAttendanceByDate(newDate);
  };

  const displayStudents = filterGroup === '전체' ? students : students.filter(s => s.group === filterGroup);

  const presentCount = displayStudents.filter(s => attendance[s.id] === '출석').length;
  const absentCount = displayStudents.filter(s => attendance[s.id] === '결석').length;
  const noneCount = displayStudents.length - presentCount - absentCount;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-stone-800 flex items-center">
          <CalendarCheck size={18} className="mr-1.5 text-emerald-500"/> 출석 체크
        </h2>
      </div>

      {/* ⭐ 날짜 선택 (과거 출석 입력 지원) */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-stone-100 flex flex-col space-y-3">
         <div className="flex justify-between items-center">
            <button onClick={handlePrevWeek} className="p-1.5 bg-stone-50 rounded-full hover:bg-stone-100 text-stone-600 transition-colors" title="-1 주일">
                <ChevronLeft size={16}/>
            </button>
            <div className="flex items-center space-x-2">
               <input
                 type="date"
                 value={selectedAttDate}
                 onChange={handleDateChange}
                 className="bg-stone-50 border border-stone-200 text-stone-800 font-bold text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
               />
               <button onClick={setToday} className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-1.5 rounded-md hover:bg-emerald-100 transition-colors">
                   오늘
               </button>
            </div>
            <button onClick={handleNextWeek} className="p-1.5 bg-stone-50 rounded-full hover:bg-stone-100 text-stone-600 transition-colors" title="+1 주일">
                <ChevronRight size={16}/>
            </button>
         </div>
      </div>

      {userRole !== '교사' && (
        <div className="flex space-x-2 overflow-x-auto hide-scrollbar pb-1">
          {uniqueGroups.map(g => (
            <button
              key={g}
              onClick={() => setFilterGroup(g)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm ${filterGroup === g ? 'bg-emerald-500 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-xs font-bold text-stone-500 mb-1">현재 출석 현황 ({filterGroup})</p>
            <div className="flex space-x-3 text-sm">
              <span className="font-bold text-emerald-600">출석 {presentCount}</span>
              <span className="font-bold text-rose-500">결석 {absentCount}</span>
              <span className="font-bold text-stone-400">미입력 {noneCount}</span>
            </div>
          </div>
          <button
            onClick={() => handleAllPresent(displayStudents)}
            className="text-xs bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg font-bold hover:bg-emerald-100 transition-colors"
          >
            일괄 출석
          </button>
        </div>

        <div className="space-y-2 pr-1">
          {displayStudents.map(student => (
            <div key={student.id} className="flex items-center justify-between p-3 rounded-xl border border-stone-100 bg-[#FFFCF9] hover:border-emerald-200 transition-colors">
              <div>
                <p className="text-sm font-bold text-stone-800">{student.name}</p>
                <p className="text-[10px] text-stone-500">{student.group} • {student.grade}</p>
              </div>
              <div className="flex space-x-1.5">
                <button
                  onClick={() => handleAttendance(student.id, '출석')}
                  className={`flex flex-col items-center justify-center w-12 h-10 rounded-lg border transition-all ${attendance[student.id] === '출석' ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-white border-stone-200 text-stone-400 hover:bg-stone-50'}`}
                >
                  <CheckCircle2 size={16} className="mb-0.5" />
                  <span className="text-[9px] font-bold">출석</span>
                </button>
                <button
                  onClick={() => handleAttendance(student.id, '결석')}
                  className={`flex flex-col items-center justify-center w-12 h-10 rounded-lg border transition-all ${attendance[student.id] === '결석' ? 'bg-rose-500 border-rose-500 text-white shadow-sm' : 'bg-white border-stone-200 text-stone-400 hover:bg-stone-50'}`}
                >
                  <XCircle size={16} className="mb-0.5" />
                  <span className="text-[9px] font-bold">결석</span>
                </button>
                <button
                  onClick={() => handleAttendance(student.id, '미입력')}
                  className={`flex flex-col items-center justify-center w-12 h-10 rounded-lg border transition-all ${!attendance[student.id] || attendance[student.id] === '미입력' ? 'bg-stone-200 border-stone-300 text-stone-600 shadow-sm' : 'bg-white border-stone-200 text-stone-400 hover:bg-stone-50'}`}
                >
                  <Circle size={16} className="mb-0.5" />
                  <span className="text-[9px] font-bold">미입력</span>
                </button>
              </div>
            </div>
          ))}
          {displayStudents.length === 0 && (
            <div className="text-center py-8 text-stone-400 text-sm border border-dashed border-stone-200 rounded-xl">해당 반에 학생이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}