import React, { useState } from 'react';
import { Search, UserPlus, ChevronRight, Phone, Filter } from 'lucide-react';

export default function StudentList({ userRole, currentUser, students, studentSearch, setStudentSearch, openEditStudent, navigateToProfile }) {
  const [filterGroup, setFilterGroup] = useState('전체');
  const [filterGrade, setFilterGrade] = useState('전체');
  const [filterGender, setFilterGender] = useState('전체');

  const uniqueGroups = ['전체', ...Array.from(new Set(students.map(s => s.group))).sort((a, b) => a.localeCompare(b, 'ko-KR'))];
  
  const gradeOrder = ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3', '청년'];
  const uniqueGrades = ['전체', ...Array.from(new Set(students.map(s => s.grade).filter(Boolean))).sort((a, b) => {
      const indexA = gradeOrder.indexOf(a);
      const indexB = gradeOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
  })];

  let filtered = [...students];

  if (userRole !== '교사') {
    if (filterGroup !== '전체') filtered = filtered.filter(s => s.group === filterGroup);
    if (filterGrade !== '전체') filtered = filtered.filter(s => s.grade === filterGrade);
    if (filterGender !== '전체') filtered = filtered.filter(s => s.gender === filterGender);
  }

  if (studentSearch) {
    filtered = filtered.filter(s => s.name.includes(studentSearch));
  }

  filtered.sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-stone-800">학생 관리 <span className="text-emerald-600 text-sm ml-1">{filtered.length}명</span></h2>
        <button onClick={() => openEditStudent(null, true)} className="flex items-center text-xs bg-emerald-500 text-white px-3 py-2 rounded-lg font-bold shadow-sm hover:bg-emerald-600 transition-colors">
          <UserPlus size={14} className="mr-1.5" /> 학생 등록
        </button>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <input type="text" placeholder="이름으로 검색..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" />
          <Search size={18} className="absolute left-3 top-3.5 text-stone-400" />
        </div>

        {userRole !== '교사' && (
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-600 flex items-center"><Filter size={14} className="mr-1"/> 상세 필터</span>
              {(filterGroup !== '전체' || filterGrade !== '전체' || filterGender !== '전체') && (
                <button onClick={() => { setFilterGroup('전체'); setFilterGrade('전체'); setFilterGender('전체'); }} className="text-[10px] text-stone-400 underline hover:text-stone-600">초기화</button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} className="text-xs bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-700 font-bold">
                {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="text-xs bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-700 font-bold">
                {uniqueGrades.map(g => <option key={g} value={g}>{g === '전체' ? '전체 학년' : g}</option>)}
              </select>
              <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="text-xs bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-700 font-bold">
                <option value="전체">성별 전체</option><option value="남">남</option><option value="여">여</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-2">
        {filtered.map(student => (
          <div key={student.id} onClick={() => navigateToProfile(student)} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex justify-between items-center cursor-pointer hover:border-emerald-300 transition-all">
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mr-4 ${student.gender === '여' ? 'bg-rose-50 text-rose-500' : 'bg-sky-50 text-sky-600'}`}>
                {student.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-stone-800 text-base mb-0.5">{student.name} <span className="text-xs font-normal text-stone-400 ml-1">{student.group}</span></h3>
                <p className="text-xs text-stone-500">{student.grade || '학년 미상'}</p>
                {student.phone && <p className="text-[10px] text-stone-400 flex items-center mt-1"><Phone size={10} className="mr-1"/> {student.phone}</p>}
              </div>
            </div>
            <ChevronRight size={20} className="text-stone-300" />
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-10 text-stone-400 text-sm bg-white rounded-xl border border-stone-100 border-dashed">조건에 맞는 학생이 없습니다.</div>}
      </div>
    </div>
  );
}