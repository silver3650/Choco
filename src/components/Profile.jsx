import React from 'react';
import { ChevronLeft, Edit, Phone, MessageCircle, FileText, UserCircle } from 'lucide-react';

export default function Profile({ selectedStudent, logs, setCurrentTab, openEditStudent, showToast, openQuickLog }) {
  if (!selectedStudent) return null;
  const studentLogs = logs.filter(l => l.studentId === selectedStudent.id);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setCurrentTab('students')} className="flex items-center text-stone-600 text-sm font-bold hover:text-stone-800 transition-colors">
          <ChevronLeft size={18} className="mr-1" /> 목록으로
        </button>
        <button onClick={() => openEditStudent(selectedStudent)} className="flex items-center text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors">
          <Edit size={14} className="mr-1" /> 정보 수정
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-16 bg-linear-to-r from-emerald-50 to-teal-50"></div>
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center font-bold text-3xl mb-3 relative z-10 border-4 border-white shadow-sm ${selectedStudent.gender === '여' ? 'bg-rose-100 text-rose-500' : 'bg-sky-100 text-sky-600'}`}>
          {selectedStudent.name.charAt(0)}
        </div>
        <h2 className="text-xl font-bold text-stone-800">{selectedStudent.name}</h2>
        <p className="text-sm font-medium text-stone-500 mt-1">{selectedStudent.group} • {selectedStudent.grade}</p>
        
        <div className="flex justify-center items-center mt-2 space-x-2">
            {selectedStudent.phone && <span className="text-xs text-stone-600 flex items-center bg-stone-50 px-2 py-1 rounded-md border border-stone-100"><Phone size={12} className="mr-1 text-stone-400"/> {selectedStudent.phone}</span>}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
           <button onClick={() => showToast('전화 연결 기능은 모바일 기기에서 지원됩니다.')} className="flex items-center justify-center py-2.5 bg-stone-50 text-stone-700 rounded-xl text-sm font-bold border border-stone-200 hover:bg-stone-100 transition-colors">
             <Phone size={16} className="mr-2 text-stone-500"/> 전화하기
           </button>
           <button onClick={() => showToast('문자 메시지 앱으로 연결됩니다.')} className="flex items-center justify-center py-2.5 bg-stone-50 text-stone-700 rounded-xl text-sm font-bold border border-stone-200 hover:bg-stone-100 transition-colors">
             <MessageCircle size={16} className="mr-2 text-stone-500"/> 문자보내기
           </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <h3 className="font-bold text-stone-800 mb-3 flex items-center text-sm">
          <UserCircle size={16} className="mr-2 text-emerald-500" /> 특이사항 및 기도제목
        </h3>
        <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed bg-[#FFFCF9] p-3 rounded-xl border border-stone-100">
          {selectedStudent.prayer || "등록된 특이사항이나 기도제목이 없습니다."}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-stone-800 flex items-center text-sm">
            <FileText size={16} className="mr-2 text-emerald-500" /> 심방 기록
          </h3>
          <button onClick={() => openQuickLog(selectedStudent)} className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-1 rounded-md hover:bg-stone-200 transition-colors">
            + 기록 추가
          </button>
        </div>
        
        <div className="space-y-3">
          {studentLogs.length > 0 ? (
            studentLogs.map((log) => (
              <div key={log.id} className="border-l-2 border-emerald-400 pl-3 py-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-stone-700">{log.date} ({log.method})</span>
                  <span className="text-[10px] text-stone-400">{log.teacher} 선생님</span>
                </div>
                <p className="text-sm text-stone-600 leading-snug">{log.content}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-stone-400 text-center py-4">심방 기록이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}