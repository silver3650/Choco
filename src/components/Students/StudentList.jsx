import React from 'react';
import { Plus, Search, UserCircle, Award } from 'lucide-react';

export default function StudentList({
  userRole, currentUser, students, studentSearch, setStudentSearch,
  openEditStudent, navigateToProfile
}) {
  const isTeacher = userRole === '교사';
  const displayStudents = isTeacher ? students.filter(s => s.group === currentUser.group) : students;
  const filteredList = displayStudents.filter(s => s.name.includes(studentSearch));

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-bold text-stone-800">학생 명단</h2>
          {isTeacher && <span className="text-[10px] bg-sky-50 text-sky-600 px-2 py-1 rounded font-bold border border-sky-100">담당: {currentUser.group}</span>}
        </div>
        <button onClick={() => openEditStudent(null, true)} className="flex items-center text-xs bg-emerald-500 text-white px-3 py-2 rounded-xl shadow-sm font-bold hover:bg-emerald-600 transition-colors">
          <Plus size={14} className="mr-1" /> 추가
        </button>
      </div>
      
      <div className="relative mb-4">
        <input type="text" placeholder="이름으로 검색..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="w-full bg-white border border-stone-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <Search size={18} className="absolute left-3 top-3 text-stone-400" />
      </div>
      
      <div className="space-y-3">
        {filteredList.map(student => (
          <div key={student.id} onClick={() => navigateToProfile(student)} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex justify-between items-center cursor-pointer hover:bg-emerald-50/30 transition-colors">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 font-bold mr-3">{student.name.charAt(0)}</div>
              <div>
                <h3 className="font-bold text-stone-800">{student.name} <span className="text-xs font-normal text-stone-400 ml-1">{student.group}</span></h3>
                <p className="text-xs text-stone-500">{student.school} • {student.grade}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex flex-col items-end">
                <div className="flex items-center text-[10px] text-amber-500 font-bold mb-1"><Award size={12} className="mr-0.5" /> {student.points} P</div>
                {student.consecutiveAbsences >= 3 && <span className="text-[9px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-bold">장기결석</span>}
              </div>
            </div>
          </div>
        ))}
        {filteredList.length === 0 && <p className="text-center text-sm text-stone-400 py-6">검색된 학생이 없습니다.</p>}
      </div>
    </div>
  );
}
