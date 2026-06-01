import React from 'react';
import { ChevronLeft, Edit, Phone, MessageCircle, Award, Calendar, Plus, FileText } from 'lucide-react';

export default function Profile({
  selectedStudent, logs, setCurrentTab, openEditStudent, showToast, openQuickLog
}) {
  if (!selectedStudent) return null;
  const studentLogs = logs.filter(l => l.studentId === selectedStudent.id);

  return (
    <div className="bg-stone-50 min-h-full pb-20">
      <div className="bg-white px-4 pt-4 pb-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setCurrentTab('students')} className="flex items-center text-stone-500 font-medium hover:text-stone-700 transition-colors">
            <ChevronLeft size={20} className="mr-1"/> 명단으로
          </button>
          <button onClick={() => openEditStudent(selectedStudent)} className="flex items-center text-[11px] font-bold bg-stone-100 text-stone-600 px-2.5 py-1.5 rounded-lg hover:bg-stone-200 transition-colors">
            <Edit size={12} className="mr-1" /> 편집
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 text-2xl font-bold mr-4">
              {selectedStudent.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-800 mb-1">{selectedStudent.name}</h2>
              <p className="text-xs font-bold text-stone-500 flex items-center space-x-2">
                <span className="bg-stone-100 px-1.5 py-0.5 rounded">{selectedStudent.grade}</span>
                <span className="bg-stone-100 px-1.5 py-0.5 rounded">{selectedStudent.group}</span>
                <span className="bg-stone-100 px-1.5 py-0.5 rounded">{selectedStudent.gender || '남'}</span>
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => showToast(`[전화 연결] ${selectedStudent.phone} 번호로 전화를 엽니다.`, 'info')} className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-sm hover:bg-emerald-200 transition-colors">
              <Phone size={18} />
            </button>
            <button onClick={() => showToast(`[메시지] ${selectedStudent.phone} 번호로 문자를 엽니다.`, 'info')} className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-sm hover:bg-amber-200 transition-colors">
              <MessageCircle size={18} />
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
            <p className="text-stone-400 text-[10px] font-bold mb-1">생년월일</p>
            <p className="font-bold text-stone-800 text-xs">2026.{selectedStudent.birth.replace('-', '.')}</p>
          </div>
          <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
            <p className="text-stone-400 text-[10px] font-bold mb-1">학교</p>
            <p className="font-bold text-stone-800 text-xs">{selectedStudent.school || '미입력'}</p>
          </div>
          <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 col-span-2 flex justify-between items-center">
            <div>
              <p className="text-stone-400 text-[10px] font-bold mb-1">부모님 연락처 ({selectedStudent.parentsName || '미입력'})</p>
              <p className="font-bold text-stone-800 text-xs">{selectedStudent.parentsPhone || '미입력'}</p>
            </div>
            <button className="p-2 bg-emerald-100 text-emerald-600 rounded-full shadow-sm hover:bg-emerald-200 transition-colors" onClick={() => showToast(`[전화 연결] ${selectedStudent.parentsPhone} 부모님께 전화를 겁니다.`, 'info')}>
              <Phone size={14} />
            </button>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg flex items-center justify-between border border-amber-100 col-span-2">
            <div>
              <p className="text-amber-600 text-[10px] font-bold mb-1">누적 달란트</p>
              <p className="font-extrabold text-amber-700 text-base">{selectedStudent.points} P</p>
            </div>
            <Award size={24} className="text-amber-400" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
           <h3 className="font-bold text-stone-800 flex items-center"><Calendar size={16} className="mr-1 text-emerald-500" /> 심방 일지</h3>
           <button onClick={() => openQuickLog(selectedStudent)} className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2.5 py-1.5 rounded-lg flex items-center border border-emerald-100 hover:bg-emerald-100 transition-colors">
              <Plus size={12} className="mr-1"/> 기록 추가
           </button>
        </div>
        <div className="space-y-3">
          {studentLogs.length === 0 ? (
            <p className="text-center text-sm text-stone-400 py-6 bg-white rounded-xl border border-stone-100 border-dashed">기록된 심방 일지가 없습니다.</p>
          ) : (
            studentLogs.map(log => (
              <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 relative">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mr-2">{log.date}</span>
                  <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">{log.method}</span>
                </div>
                <p className="text-sm text-stone-800 leading-relaxed mt-2 mb-3">{log.content}</p>
                <p className="text-[10px] text-stone-400 text-right font-medium">기록: {log.teacher}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}