import React, { useState, useRef } from 'react';
import { Edit, Image as ImageIcon, Calendar, Plus, X, Check, FileText } from 'lucide-react';
import { supabase } from '../supabase';

export default function Community({ userRole, currentUser, posts, setPosts, duties, setDuties, communityTab, setCommunityTab, showToast, setPostModal }) {
  const [writeModal, setWriteModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', imageBase64: '' });
  const fileInputRef = useRef(null);

  const [editDutyMode, setEditDutyMode] = useState(false);
  const [dutyForm, setDutyForm] = useState([]);

  // ⭐ 오늘을 기준으로 앞으로 다가올 4번의 주일(일요일) 날짜를 계산하는 함수
  const getNext4Sundays = () => {
    const sundays = [];
    let d = new Date(); // 오늘 날짜
    // 오늘이 일요일이 아니면 다가오는 일요일로 날짜를 맞춤
    if (d.getDay() !== 0) d.setDate(d.getDate() + (7 - d.getDay()));
    
    for (let i = 0; i < 4; i++) {
      sundays.push(new Date(d));
      d.setDate(d.getDate() + 7); // 7일씩 더해서 4주치 생성
    }
    return sundays;
  };

  const sundays = getNext4Sundays();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) return showToast("이미지는 3MB 이하만 첨부 가능합니다.", "error");
      const reader = new FileReader();
      reader.onloadend = () => setForm({ ...form, imageBase64: reader.result });
      reader.readAsDataURL(file); // 이미지를 텍스트 데이터(Base64)로 변환
    }
  };

  const savePost = async () => {
    if (!form.title.trim() || !form.content.trim()) return showToast("제목과 내용을 입력해주세요.", "error");
    const newPost = {
      church_id: currentUser.churchId,
      post_type: communityTab,
      title: form.title,
      content: form.content,
      author: currentUser.name,
      post_date: new Date().toISOString().split('T')[0],
      has_file: !!form.imageBase64,
      image_url: form.imageBase64 || null
    };
    const { data, error } = await supabase.from('posts').insert([newPost]).select().single();
    if (error) return showToast("게시글 작성에 실패했습니다.", "error");
    
    setPosts([{ ...data, type: data.post_type, hasFile: data.has_file, date: data.post_date }, ...posts]);
    setWriteModal(false);
    setForm({ title: '', content: '', imageBase64: '' });
    showToast("게시글이 성공적으로 등록되었습니다.");
  };

  const startEditDuties = () => {
    const initForm = sundays.map(sun => {
      const dateStr = sun.toISOString().split('T')[0];
      const existing = duties.find(d => d.duty_date === dateStr);
      return existing ? { ...existing } : { duty_date: dateStr, leader: '', prayer: '', church_id: currentUser.churchId, duty_month: `${sun.getMonth()+1}월` };
    });
    setDutyForm(initForm);
    setEditDutyMode(true);
  };

  const handleDutyChange = (index, field, val) => {
    const newForm = [...dutyForm];
    newForm[index][field] = val;
    setDutyForm(newForm);
  };

  const saveDuties = async () => {
    for (const duty of dutyForm) {
      if (duty.id) {
        await supabase.from('duties').update({ leader: duty.leader, prayer: duty.prayer }).eq('id', duty.id);
      } else if (duty.leader || duty.prayer) {
        await supabase.from('duties').insert([duty]);
      }
    }
    showToast("예배 순서가 저장되었습니다.");
    setEditDutyMode(false);
    setTimeout(() => window.location.reload(), 1000); // 새로운 ID 갱신을 위해 새로고침
  };

  const filteredPosts = posts.filter(p => p.type === communityTab);

  return (
    <div className="p-4 space-y-4 h-full relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-stone-800 flex items-center">커뮤니티</h2>
        
        {/* 관리자(담당목사/총괄)에게만 글쓰기 및 순서 수정 버튼 표시 */}
        {(userRole !== '교사' || currentUser?.originalRole === '담당목사') && communityTab !== 'duties' && (
          <button onClick={() => setWriteModal(true)} className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center shadow-sm hover:bg-emerald-600">
            <Plus size={14} className="mr-1" /> 글쓰기
          </button>
        )}
        {(userRole !== '교사' || currentUser?.originalRole === '담당목사') && communityTab === 'duties' && !editDutyMode && (
          <button onClick={startEditDuties} className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center shadow-sm hover:bg-emerald-600">
            <Edit size={14} className="mr-1" /> 순서 수정
          </button>
        )}
        {editDutyMode && communityTab === 'duties' && (
          <button onClick={saveDuties} className="bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center shadow-sm hover:bg-rose-600">
            <Check size={14} className="mr-1" /> 저장 완료
          </button>
        )}
      </div>

      <div className="flex bg-stone-200 p-1 rounded-xl mb-4 text-center">
        <button onClick={() => setCommunityTab('notice')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${communityTab === 'notice' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}>공지사항</button>
        <button onClick={() => setCommunityTab('material')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${communityTab === 'material' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}>자료실</button>
        <button onClick={() => setCommunityTab('duties')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${communityTab === 'duties' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}>예배순서</button>
      </div>

      {communityTab !== 'duties' && (
        <div className="space-y-3 pb-20">
          {filteredPosts.length === 0 ? <p className="text-center text-stone-400 text-sm py-10">등록된 게시글이 없습니다.</p> : filteredPosts.map(post => (
            <div key={post.id} onClick={() => setPostModal({ isOpen: true, post })} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 cursor-pointer hover:border-emerald-200 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-stone-800 text-sm">{post.title}</h3>
                {post.hasFile && <ImageIcon size={14} className="text-emerald-500 shrink-0 ml-2" />}
              </div>
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>{post.author}</span><span>{post.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ⭐ 예배 순서 (4주치 표 출력) */}
      {communityTab === 'duties' && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <h3 className="font-bold text-stone-800 mb-4 text-sm flex items-center"><Calendar size={16} className="mr-2 text-emerald-500" /> 향후 4주 예배 순서</h3>
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-center border-collapse min-w-70">
              <thead>
                <tr>
                  {sundays.map((sun, i) => (
                    <th key={i} className="bg-stone-50 p-2 border border-stone-200 text-xs font-bold text-stone-700 w-1/4">
                      {sun.getMonth() + 1}/{sun.getDate()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {sundays.map((sun, i) => {
                    const dateStr = sun.toISOString().split('T')[0];
                    const duty = duties.find(d => d.duty_date === dateStr);
                    return (
                      <td key={i} className="p-2 border border-stone-200 text-xs text-stone-600 align-top h-24">
                        {editDutyMode ? (
                          <div className="space-y-2">
                            <div>
                              <span className="block text-[9px] text-stone-400 mb-0.5">인도</span>
                              <input type="text" value={dutyForm[i]?.leader || ''} onChange={e => handleDutyChange(i, 'leader', e.target.value)} className="w-full border border-stone-200 p-1 rounded text-center text-[10px] focus:ring-1 focus:ring-emerald-400 outline-none" />
                            </div>
                            <div>
                              <span className="block text-[9px] text-stone-400 mb-0.5">기도</span>
                              <input type="text" value={dutyForm[i]?.prayer || ''} onChange={e => handleDutyChange(i, 'prayer', e.target.value)} className="w-full border border-stone-200 p-1 rounded text-center text-[10px] focus:ring-1 focus:ring-emerald-400 outline-none" />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 h-full flex flex-col justify-center">
                            {duty?.leader ? <div className="bg-emerald-50/50 text-emerald-700 py-1.5 rounded-md text-[10px]">인도<br/><b className="text-xs">{duty.leader}</b></div> : <div className="text-stone-300 text-[10px]">-</div>}
                            {duty?.prayer ? <div className="bg-sky-50/50 text-sky-700 py-1.5 rounded-md text-[10px]">기도<br/><b className="text-xs">{duty.prayer}</b></div> : <div className="text-stone-300 text-[10px]">-</div>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-stone-400 mt-3 text-right">* 이번 주 기준 앞으로 4주간의 일정입니다.</p>
        </div>
      )}

      {/* 글쓰기 모달 */}
      {writeModal && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm h-[85vh] sm:h-auto sm:max-h-[80vh] sm:rounded-2xl rounded-t-3xl shadow-xl flex flex-col animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center p-4 border-b border-stone-100">
              <h3 className="font-bold text-stone-800">새 {communityTab === 'notice' ? '공지사항' : '자료실'} 글쓰기</h3>
              <button onClick={() => setWriteModal(false)} className="p-1 bg-stone-100 rounded-full text-stone-500"><X size={18} /></button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <input type="text" placeholder="제목을 입력하세요" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full font-bold text-lg border-b border-stone-200 pb-2 focus:outline-none focus:border-emerald-500 placeholder-stone-300" />
              <textarea placeholder="내용을 작성해주세요..." value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full h-40 resize-none focus:outline-none text-sm text-stone-700 placeholder-stone-300"></textarea>
              
              {form.imageBase64 && (
                <div className="relative inline-block mt-2">
                  <img src={form.imageBase64} alt="preview" className="h-32 rounded-lg object-cover border border-stone-200" />
                  <button onClick={() => setForm({...form, imageBase64: ''})} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md"><X size={12} /></button>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-between items-center rounded-b-2xl">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              <button onClick={() => fileInputRef.current.click()} className="flex items-center text-stone-500 hover:text-emerald-600 text-sm font-bold bg-white px-3 py-2 border border-stone-200 rounded-lg shadow-sm">
                <ImageIcon size={16} className="mr-2" /> 이미지 첨부
              </button>
              <button onClick={savePost} className="bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm hover:bg-emerald-600">등록하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}