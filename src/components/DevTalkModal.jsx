import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Bell, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabase';

export default function DevTalkModal({ isOpen, onClose, currentUser, showToast }) {
  const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' or 'updates'
  const [feedbackText, setFeedbackText] = useState('');
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [appUpdates, setAppUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchFeedbacks();
      fetchUpdates();
    }
  }, [isOpen, currentUser]);

  const fetchFeedbacks = async () => {
    const { data, error } = await supabase
      .from('dev_feedbacks')
      .select('*')
      .eq('teacher_id', currentUser.id)
      .order('created_at', { ascending: false });
    if (!error && data) setMyFeedbacks(data);
  };

  const fetchUpdates = async () => {
    const { data, error } = await supabase
      .from('app_updates')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setAppUpdates(data);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return;
    setIsLoading(true);
    
    const payload = {
      teacher_id: currentUser.id,
      teacher_name: currentUser.name,
      church_name: currentUser.churchName,
      content: feedbackText
    };

    const { data, error } = await supabase.from('dev_feedbacks').insert([payload]).select().single();
    
    setIsLoading(false);
    if (error) {
      showToast('의견 전송에 실패했습니다.', 'error');
    } else {
      showToast('개발자에게 의견이 전달되었습니다! 감사합니다.');
      setFeedbackText('');
      setMyFeedbacks([data, ...myFeedbacks]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-stone-50 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* 헤더 */}
        <div className="bg-stone-800 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold flex items-center text-sm">
            <MessageSquare size={18} className="mr-2 text-emerald-400" />
            개발자톡 <span className="text-[10px] ml-2 text-stone-400 font-normal">건의사항 및 업데이트</span>
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors p-1"><X size={18} /></button>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex bg-white border-b border-stone-200 shrink-0">
          <button 
            onClick={() => setActiveTab('feedback')} 
            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${activeTab === 'feedback' ? 'border-stone-800 text-stone-800' : 'border-transparent text-stone-400'}`}
          >
            나의 제안 및 문의
          </button>
          <button 
            onClick={() => setActiveTab('updates')} 
            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 flex items-center justify-center ${activeTab === 'updates' ? 'border-stone-800 text-stone-800' : 'border-transparent text-stone-400'}`}
          >
            업데이트 소식 <Bell size={12} className="ml-1" />
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="p-4 overflow-y-auto flex-1 bg-stone-50">
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                <textarea 
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="앱 사용 중 불편한 점이나 추가되었으면 하는 좋은 기능을 자유롭게 적어주세요!"
                  className="w-full text-sm p-2 bg-stone-50 rounded-lg border border-stone-100 h-24 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={handleSubmitFeedback}
                    disabled={isLoading}
                    className="bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center hover:bg-stone-700 disabled:opacity-50"
                  >
                    {isLoading ? '전송중...' : <><Send size={12} className="mr-1.5" /> 보내기</>}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-500 ml-1 mt-4">내가 보낸 의견</h4>
                {myFeedbacks.length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-6 bg-white rounded-xl border border-stone-100 border-dashed">아직 보낸 의견이 없습니다.</p>
                ) : (
                  myFeedbacks.map(fb => (
                    <div key={fb.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${fb.status === '답변완료' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                          {fb.status}
                        </span>
                        <span className="text-[10px] text-stone-400">{new Date(fb.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{fb.content}</p>
                      
                      {fb.reply && (
                        <div className="mt-3 pt-3 border-t border-stone-100 bg-stone-50/50 p-3 rounded-lg flex items-start">
                          <CheckCircle2 size={14} className="text-emerald-500 mr-2 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] font-bold text-stone-500 mb-1">개발자 답변 <span className="font-normal text-stone-400 ml-1">{new Date(fb.replied_at).toLocaleDateString()}</span></p>
                            <p className="text-xs text-emerald-800 whitespace-pre-wrap">{fb.reply}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'updates' && (
            <div className="space-y-3">
              {appUpdates.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-6 bg-white rounded-xl border border-stone-100 border-dashed">등록된 업데이트 소식이 없습니다.</p>
              ) : (
                appUpdates.map(update => (
                  <div key={update.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{update.version}</span>
                      <span className="text-[10px] text-stone-400">{new Date(update.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-stone-800 text-sm mb-2">{update.title}</h4>
                    <p className="text-xs text-stone-600 whitespace-pre-wrap leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-100">{update.content}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}