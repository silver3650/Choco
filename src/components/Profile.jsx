import React from 'react';
import { ChevronLeft, Edit, Phone, MessageCircle, FileText, Calendar, UserCircle, Trash2 } from 'lucide-react';
import { supabase } from '../supabase';

// ⭐ setLogs를 추가로 전달받습니다.
export default function Profile({ selectedStudent, logs, setLogs, setCurrentTab, openEditStudent, showToast, openQuickLog }) {
  if (!selectedStudent) return null;

  // 해당 학생의 심방 기록만 필터링하고 최신순으로 정렬
  const studentLogs = logs
    .filter(l => l.studentId === selectedStudent.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // ⭐ 완벽한 심방 기록 삭제 함수
  const handleDeleteLog = async (logId) => {
    const isConfirm = window.confirm("이 심방 기록을 정말 삭제하시겠습니까? (복구할 수 없습니다)");
    if (!isConfirm) return;

    // 1. Supabase 데이터베이스에서 삭제 처리
    const { error } = await supabase.from('visitation_logs').delete().eq('id', logId);
    
    if (error) {
      showToast("삭제 중 서버 오류가 발생했습니다.", "error");
    } else {
      showToast("심방 기록이 성공적으로 삭제되었습니다.");
      // 2. ⭐ App.jsx가 관리하는 전체 logs 상태에서도 완벽하게 제거! (다른 탭에 가도 부활하지 않음)
      if (setLogs) {
        setLogs(logs.filter(log => log.id !== logId));
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 absolute inset-0 z-20 animate-in slide-in-from-right-8 duration-300">
      
      {/* 상단 헤더 */}
      <div className="bg-white p-4 border-b border-stone-100 flex justify-between items-center shrink-0 shadow-sm">
        <button onClick={() => setCurrentTab('students')} className="p-1 -ml-1 text-stone-400 hover:text-stone-600 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-bold text-stone-800 text-lg">학생 상세정보</h2>
        <button onClick={() => openEditStudent(selectedStudent)} className="text-emerald-500 p-1 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
          <Edit size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        
        {/* 학생 기본 정보 카드 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center mb-4">
             <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl mr-4 shadow-inner ${selectedStudent.gender === '여' ? 'bg-rose-50 text-rose-500' : 'bg-sky-50 text-sky-600'}`}>
                {selectedStudent.name.charAt(0)}
             </div>
             <div>
               <h3 className="text-xl font-bold text-stone-800">{selectedStudent.name} <span className="text-sm font-normal text-stone-400 ml-1">{selectedStudent.group}</span></h3>
               <p className="text-sm text-stone-500 mt-0.5">{selectedStudent.grade || '학년 미상'} • {selectedStudent.school || '학교 미상'}</p>
             </div>
          </div>
          
          {/* 퀵 액션 (전화/문자) */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <a href={`tel:${selectedStudent.phone}`} className="flex items-center justify-center bg-emerald-50 text-emerald-600 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-colors">
              <Phone size={14} className="mr-2"/> 전화하기
            </a>
            <a href={`sms:${selectedStudent.phone}`} className="flex items-center justify-center bg-amber-50 text-amber-600 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors">
              <MessageCircle size={14} className="mr-2"/> 문자하기
            </a>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-stone-50"><span className="text-stone-400 font-bold">학생 연락처</span><span className="text-stone-700 font-bold">{selectedStudent.phone || '-'}</span></div>
            <div className="flex justify-between py-2 border-b border-stone-50"><span className="text-stone-400 font-bold">부모님 연락처</span><span className="text-stone-700 font-bold">{selectedStudent.parentsName ? `${selectedStudent.parentsName} ` : ''}{selectedStudent.parentsPhone || '-'}</span></div>
            <div className="flex justify-between py-2 border-b border-stone-50"><span className="text-stone-400 font-bold">생년월일</span><span className="text-stone-700 font-bold">{selectedStudent.birth || '-'}</span></div>
            <div className="flex justify-between py-2 border-b border-stone-50"><span className="text-stone-400 font-bold">연속 결석</span><span className="text-rose-500 font-bold">{selectedStudent.consecutiveAbsences || 0}주</span></div>
          </div>
          
          {selectedStudent.prayer && (
            <div className="mt-4 bg-[#FFFCF9] border border-emerald-100 rounded-xl p-4">
              <h4 className="text-xs font-bold text-emerald-700 flex items-center mb-2"><FileText size={14} className="mr-1.5"/> 특이사항 및 기도제목</h4>
              <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{selectedStudent.prayer}</p>
            </div>
          )}
        </div>

        {/* 심방 및 상담 기록 카드 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 mb-20">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-stone-800 flex items-center">
              <Calendar size={16} className="mr-2 text-emerald-500"/> 
              심방 및 상담 기록 
              <span className="ml-1.5 text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{studentLogs.length}</span>
            </h4>
            <button onClick={() => openQuickLog(selectedStudent)} className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm hover:bg-emerald-600 transition-colors">
              기록 추가
            </button>
          </div>
          
          <div className="space-y-3">
            {studentLogs.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-sm bg-stone-50 rounded-xl border border-stone-100 border-dashed">
                아직 작성된 심방 기록이 없습니다.
              </div>
            ) : (
              studentLogs.map(log => (
                <div key={log.id} className="p-3 border border-stone-100 rounded-xl bg-stone-50 relative group hover:border-emerald-200 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold bg-white border border-stone-200 text-stone-600 px-2 py-0.5 rounded shadow-sm">{log.method}</span>
                      <span className="text-xs font-bold text-stone-500">{log.date}</span>
                    </div>
                    {/* 수정 및 삭제 버튼 */}
                    <div className="flex space-x-1.5">
                      <button 
                        onClick={() => openQuickLog(selectedStudent, log)} 
                        className="text-emerald-600 p-1 bg-white rounded-md border border-emerald-100 shadow-sm hover:bg-emerald-50 transition-colors flex items-center text-[10px] font-bold"
                      >
                        <Edit size={10} className="mr-1"/> 수정
                      </button>
                      <button 
                        onClick={() => handleDeleteLog(log.id)} 
                        className="text-rose-500 p-1 bg-white rounded-md border border-rose-100 shadow-sm hover:bg-rose-50 transition-colors flex items-center text-[10px] font-bold"
                      >
                        <Trash2 size={10} className="mr-1"/> 삭제
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed mt-1">{log.content}</p>
                  <p className="text-[10px] text-stone-400 mt-2 text-right">작성자: <span className="font-bold text-stone-500">{log.teacher}</span></p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}