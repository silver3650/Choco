import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Settings, ShieldAlert, MessageSquare, Bell, CheckCircle2, Send, Plus, Church, MapPin, Edit, Trash2, ArrowRight, X } from 'lucide-react';

export default function SuperAdminCenter({ currentUser, setCurrentUser, showToast, setCurrentTab }) {
  const [activeTab, setActiveTab] = useState('churches'); 
  
  const [churches, setChurches] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [updates, setUpdates] = useState([]);
  
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  const [updateForm, setUpdateForm] = useState({ version: '', title: '', content: '' });
  
  // 교회 수정 상태 관리
  const [editingChurch, setEditingChurch] = useState(null);

  useEffect(() => {
    fetchChurches();
    fetchFeedbacks();
    fetchUpdates();
  }, []);

  const fetchChurches = async () => {
    const { data, error } = await supabase.from('churches').select('*').order('id', { ascending: true });
    if (!error && data) setChurches(data);
  };

  const fetchFeedbacks = async () => {
    const { data, error } = await supabase.from('dev_feedbacks').select('*').order('created_at', { ascending: false });
    if (!error && data) setFeedbacks(data);
  };

  const fetchUpdates = async () => {
    const { data, error } = await supabase.from('app_updates').select('*').order('created_at', { ascending: false });
    if (!error && data) setUpdates(data);
  };

  // 교회 데이터 삭제
  const handleDeleteChurch = async (id, name) => {
    const isConfirm = window.confirm(`[경고] 정말 '${name}'를 삭제하시겠습니까?\n관련된 교사, 학생, 출석 데이터가 모두 삭제될 수 있습니다.`);
    if (!isConfirm) return;

    const { error } = await supabase.from('churches').delete().eq('id', id);
    if (error) {
      showToast('교회 삭제 중 오류가 발생했습니다.', 'error');
    } else {
      showToast(`'${name}' 삭제가 완료되었습니다.`);
      fetchChurches();
    }
  };

  // 교회 데이터 수정
  const handleSaveEditChurch = async () => {
    const { error } = await supabase.from('churches').update({
      name: editingChurch.name,
      dept: editingChurch.dept,
      pastor_name: editingChurch.pastor_name,
      address: editingChurch.address
    }).eq('id', editingChurch.id);

    if (error) {
      showToast('교회 정보 수정에 실패했습니다.', 'error');
    } else {
      showToast('교회 정보가 성공적으로 수정되었습니다.');
      setEditingChurch(null);
      fetchChurches();
    }
  };

  // 해당 교회로 최고 관리자 권한 강제 입장
  const handleEnterChurch = async (church) => {
    try {
      const { data: firstTeacher } = await supabase.from('teachers').select('*').eq('church_id', church.id).order('id', { ascending: true }).limit(1).maybeSingle();

      const adminUserObj = {
        id: firstTeacher ? firstTeacher.id : 999999, 
        name: '총괄관리자',
        email: 'superadmin@admin.com',
        phone: '',
        birth: '',
        group: '전체',
        churchId: church.id,
        churchName: church.name,
        deptName: church.dept,
        address: church.address,
        pastorName: church.pastor_name,
        logo: church.logo,
        originalRole: '담당목사'
      };

      setCurrentUser(adminUserObj);
      localStorage.setItem('app_currentUser', JSON.stringify(adminUserObj));
      localStorage.setItem('app_userRole', '담당목사');
      showToast(`[마스터 권한] ${church.name} 관리 모드로 입장했습니다.`);
      setCurrentTab('dashboard');
    } catch (error) {
      showToast('해당 교회로 입장하는 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleSubmitReply = async (feedbackId) => {
    if (!replyText.trim()) return;
    
    const { error } = await supabase.from('dev_feedbacks')
      .update({ 
        reply: replyText, 
        status: '답변완료', 
        replied_at: new Date().toISOString() 
      })
      .eq('id', feedbackId);

    if (error) {
      showToast('답변 등록에 실패했습니다.', 'error');
    } else {
      showToast('답변이 등록되었습니다.');
      setReplyText('');
      setReplyingTo(null);
      fetchFeedbacks(); 
    }
  };

  const handlePostUpdate = async () => {
    if (!updateForm.version || !updateForm.title || !updateForm.content) {
      return showToast('모든 항목을 입력해주세요.', 'error');
    }

    const { error } = await supabase.from('app_updates').insert([updateForm]);
    
    if (error) {
      showToast('업데이트 공지 등록 실패', 'error');
    } else {
      showToast('새로운 업데이트 소식이 등록되었습니다!');
      setUpdateForm({ version: '', title: '', content: '' });
      fetchUpdates(); 
    }
  };

  if (currentUser?.email !== 'superadmin@admin.com') {
    return (
      <div className="p-10 text-center">
        <ShieldAlert size={40} className="mx-auto text-rose-500 mb-4" />
        <h2 className="text-lg font-bold text-stone-800">접근 권한이 없습니다.</h2>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-stone-800 flex items-center">
          <Settings size={18} className="mr-1.5 text-rose-500"/> 최고 관리자 센터
        </h2>
        <button onClick={() => setCurrentTab('dashboard')} className="text-xs bg-stone-200 px-3 py-1.5 rounded-lg font-bold text-stone-600">돌아가기</button>
      </div>

      <div className="flex bg-stone-200 p-1 rounded-xl mb-4 text-center">
        <button onClick={() => setActiveTab('churches')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors flex justify-center items-center ${activeTab === 'churches' ? 'bg-white text-rose-600 shadow-sm' : 'text-stone-500'}`}>
          <Church size={14} className="mr-1" /> 교회 관리
        </button>
        <button onClick={() => setActiveTab('feedbacks')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors flex justify-center items-center ${activeTab === 'feedbacks' ? 'bg-white text-rose-600 shadow-sm' : 'text-stone-500'}`}>
          <MessageSquare size={14} className="mr-1" /> 사용자 의견
        </button>
        <button onClick={() => setActiveTab('updates')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors flex justify-center items-center ${activeTab === 'updates' ? 'bg-white text-rose-600 shadow-sm' : 'text-stone-500'}`}>
          <Bell size={14} className="mr-1" /> 공지 작성
        </button>
      </div>

      {activeTab === 'churches' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-stone-800">등록된 교회 ({churches.length}개)</span>
          </div>
          {churches.map(church => (
            <div key={church.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-stone-800 text-base">{church.name} <span className="text-sm text-stone-500 font-normal">({church.dept})</span></h3>
                <p className="text-xs text-stone-500 mt-1">담당: {church.pastor_name} • {church.address}</p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <div className="flex space-x-1">
                  <button onClick={() => setEditingChurch(church)} className="p-1.5 bg-stone-50 text-stone-500 rounded-md hover:bg-stone-100 transition-colors shadow-sm"><Edit size={14} /></button>
                  <button onClick={() => handleDeleteChurch(church.id, church.name)} className="p-1.5 bg-stone-50 text-stone-500 rounded-md hover:bg-stone-100 transition-colors shadow-sm"><Trash2 size={14} /></button>
                </div>
                <button onClick={() => handleEnterChurch(church)} className="bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center shadow-sm hover:bg-rose-600 transition-colors">
                  입장 <ArrowRight size={14} className="ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 교회 정보 수정 모달 */}
      {editingChurch && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-stone-100">
              <h3 className="font-bold text-stone-800 flex items-center text-sm">
                <Church size={18} className="mr-2 text-rose-500" />
                교회 정보 수정
              </h3>
              <button onClick={() => setEditingChurch(null)} className="text-stone-400 hover:text-stone-600 bg-stone-100 rounded-full p-1 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">교회명</label>
                <input type="text" value={editingChurch.name} onChange={(e) => setEditingChurch({...editingChurch, name: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-rose-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">부서명</label>
                <input type="text" value={editingChurch.dept} onChange={(e) => setEditingChurch({...editingChurch, dept: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-rose-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">담당 사역자</label>
                <input type="text" value={editingChurch.pastor_name} onChange={(e) => setEditingChurch({...editingChurch, pastor_name: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-rose-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">주소</label>
                <input type="text" value={editingChurch.address || ''} onChange={(e) => setEditingChurch({...editingChurch, address: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-rose-400" />
              </div>
            </div>
            <div className="p-4 border-t border-stone-100 bg-[#FFFCF9] flex justify-end space-x-2">
              <button onClick={() => setEditingChurch(null)} className="px-4 py-2 bg-white border border-stone-200 text-stone-600 text-xs font-bold rounded-lg hover:bg-stone-50">취소</button>
              <button onClick={handleSaveEditChurch} className="px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-rose-600">저장하기</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'feedbacks' && (
        <div className="space-y-4">
          {feedbacks.map(fb => (
            <div key={fb.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${fb.status === '답변완료' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {fb.status}
                  </span>
                  <span className="text-xs font-bold text-stone-700">{fb.church_name} - {fb.teacher_name}</span>
                </div>
                <span className="text-[10px] text-stone-400">{new Date(fb.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-stone-800 bg-stone-50 p-3 rounded-lg border border-stone-100 mb-3 whitespace-pre-wrap">{fb.content}</p>
              
              {fb.status === '대기중' && replyingTo !== fb.id && (
                <button onClick={() => setReplyingTo(fb.id)} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-full">답변 작성하기</button>
              )}

              {replyingTo === fb.id && (
                <div className="mt-3 bg-stone-100 p-3 rounded-xl border border-stone-200">
                  <textarea 
                    value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="답변 내용을 작성해주세요..."
                    className="w-full text-xs p-2 rounded-lg border border-stone-200 h-20 mb-2" autoFocus
                  />
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setReplyingTo(null)} className="text-xs text-stone-500 font-bold px-3 py-1.5 bg-white border border-stone-200 rounded-lg">취소</button>
                    <button onClick={() => handleSubmitReply(fb.id)} className="text-xs text-white font-bold px-3 py-1.5 bg-stone-800 rounded-lg flex items-center"><Send size={12} className="mr-1" /> 전송</button>
                  </div>
                </div>
              )}

              {fb.status === '답변완료' && fb.reply && (
                <div className="mt-2 bg-emerald-50 p-3 rounded-lg flex items-start border border-emerald-100">
                  <CheckCircle2 size={14} className="text-emerald-500 mr-2 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-emerald-800 mb-1">개발자 답변 <span className="font-normal text-emerald-600/70 ml-1">{new Date(fb.replied_at).toLocaleString()}</span></p>
                    <p className="text-xs text-emerald-900 whitespace-pre-wrap">{fb.reply}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          {feedbacks.length === 0 && <p className="text-center text-xs text-stone-400 py-10">등록된 피드백이 없습니다.</p>}
        </div>
      )}

      {activeTab === 'updates' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
            <h3 className="font-bold text-stone-800 text-sm mb-3 flex items-center"><Plus size={16} className="mr-1 text-rose-500"/> 새 릴리즈 노트 작성</h3>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input type="text" placeholder="버전 (예: v1.0.2)" value={updateForm.version} onChange={e => setUpdateForm({...updateForm, version: e.target.value})} className="w-1/3 bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs" />
                <input type="text" placeholder="업데이트 제목" value={updateForm.title} onChange={e => setUpdateForm({...updateForm, title: e.target.value})} className="flex-1 bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs" />
              </div>
              <textarea placeholder="새롭게 추가되거나 개선된 기능을 상세히 적어주세요." value={updateForm.content} onChange={e => setUpdateForm({...updateForm, content: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm h-32 resize-none" />
              <button onClick={handlePostUpdate} className="w-full bg-stone-800 text-white font-bold py-2.5 rounded-lg text-sm">업데이트 소식 등록하기</button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-stone-600 text-xs ml-1">이전 업데이트 기록</h3>
            {updates.map(update => (
              <div key={update.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{update.version}</span>
                  <span className="text-[10px] text-stone-400">{new Date(update.created_at).toLocaleDateString()}</span>
                </div>
                <h4 className="font-bold text-stone-800 text-sm mb-1">{update.title}</h4>
                <p className="text-xs text-stone-600 whitespace-pre-wrap">{update.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}