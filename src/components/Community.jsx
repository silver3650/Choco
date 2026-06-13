import React, { useState, useRef } from 'react';
import { Edit, Image as ImageIcon, Calendar, Plus, X, Check, FileText, EyeOff, Eye, Pin, Trash2, Heart } from 'lucide-react';
import { supabase } from '../supabase';

// ⭐ students, setStudents 속성이 포함되어 있습니다.
export default function Community({ userRole, currentUser, posts, setPosts, duties, setDuties, communityTab, setCommunityTab, showToast, setPostModal, students, setStudents }) {
  const [writeModal, setWriteModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', imageBase64: '' });
  const [editingPostId, setEditingPostId] = useState(null);
  const fileInputRef = useRef(null);

  const [editDutyMode, setEditDutyMode] = useState(false);
  const [dutyForm, setDutyForm] = useState([]);

  const isAdmin = userRole !== '교사' || currentUser?.originalRole === '담당목사';

  // ⭐ 한국 시간 기준 YYYY-MM-DD 변환 함수 추가
  const getLocalYYYYMMDD = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getNext4Sundays = () => {
    const sundays = [];
    let d = new Date(); 
    if (d.getDay() !== 0) d.setDate(d.getDate() + (7 - d.getDay()));
    
    for (let i = 0; i < 4; i++) {
      sundays.push(new Date(d));
      d.setDate(d.getDate() + 7); 
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
      reader.readAsDataURL(file); 
    }
  };

  const openWriteModal = () => {
    setForm({ title: '', content: '', imageBase64: '' });
    setEditingPostId(null);
    setWriteModal(true);
  };

  const openEditModal = (e, post) => {
    e.stopPropagation();
    setForm({ title: post.title, content: post.content, imageBase64: post.image_url || '' });
    setEditingPostId(post.id);
    setWriteModal(true);
  };

  const handleToggleHide = async (e, post) => {
    e.stopPropagation();
    const newHiddenStatus = !post.is_hidden;
    const confirmMsg = newHiddenStatus 
      ? "이 게시글을 숨기시겠습니까? (관리자에게만 보입니다)" 
      : "게시글 숨김을 해제하시겠습니까? (모두에게 보입니다)";
    
    if (!window.confirm(confirmMsg)) return;

    const { error } = await supabase.from('posts').update({ is_hidden: newHiddenStatus }).eq('id', post.id);
    if (error) return showToast("상태 변경에 실패했습니다.", "error");

    setPosts(posts.map(p => p.id === post.id ? { ...p, is_hidden: newHiddenStatus } : p));
    showToast(newHiddenStatus ? "게시글이 숨김 처리되었습니다." : "게시글이 다시 공개되었습니다.");
  };

  const handleTogglePin = async (e, post) => {
    e.stopPropagation();
    const newPinStatus = !post.is_pinned;
    
    const { error } = await supabase.from('posts').update({ is_pinned: newPinStatus }).eq('id', post.id);
    if (error) return showToast("상단 고정 설정에 실패했습니다.", "error");

    setPosts(posts.map(p => p.id === post.id ? { ...p, is_pinned: newPinStatus } : p));
    showToast(newPinStatus ? "게시글이 상단에 고정되었습니다." : "상단 고정이 해제되었습니다.");
  };

  const handleDeletePost = async (e, post) => {
    e.stopPropagation();
    if (!window.confirm("이 게시글을 완전히 삭제하시겠습니까? (복구 불가)")) return;

    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (error) return showToast("게시글 삭제에 실패했습니다.", "error");

    setPosts(posts.filter(p => p.id !== post.id));
    showToast("게시글이 삭제되었습니다.");
  };

  const savePost = async () => {
    if (!form.title.trim() || !form.content.trim()) return showToast("제목과 내용을 입력해주세요.", "error");
    
    const postData = {
      title: form.title,
      content: form.content,
      has_file: !!form.imageBase64,
      image_url: form.imageBase64 || null
    };

    if (editingPostId) {
      const { error } = await supabase.from('posts').update(postData).eq('id', editingPostId).select().single();
      if (error) return showToast("수정에 실패했습니다.", "error");
      
      setPosts(posts.map(p => p.id === editingPostId ? { ...p, ...postData, image_url: postData.image_url, hasFile: postData.has_file } : p));
      showToast("게시글이 수정되었습니다.");
    } else {
      postData.church_id = currentUser.churchId;
      postData.post_type = communityTab;
      postData.author = currentUser.name;
      postData.post_date = getLocalYYYYMMDD(new Date()); // 작성일도 한국시간 기준
      postData.is_hidden = false;
      postData.is_pinned = false;

      const { data, error } = await supabase.from('posts').insert([postData]).select().single();
      if (error) return showToast("게시글 작성에 실패했습니다.", "error");
      
      setPosts([{ ...data, type: data.post_type, hasFile: data.has_file, date: data.post_date }, ...posts]);
      showToast("게시글이 성공적으로 등록되었습니다.");
    }
    
    setWriteModal(false);
    setEditingPostId(null);
    setForm({ title: '', content: '', imageBase64: '' });
  };

  const startEditDuties = () => {
    const initForm = sundays.map(sun => {
      // ⭐ 시차 문제 해결: toISOString 대신 getLocalYYYYMMDD 사용
      const dateStr = getLocalYYYYMMDD(sun);
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
    setTimeout(() => window.location.reload(), 1000); 
  };

  const handlePrayed = async (student) => {
    const newCount = (student.prayedCount || 0) + 1;
    const { error } = await supabase.from('students').update({ prayed_count: newCount }).eq('id', student.id);
    if (!error) {
      setStudents(students.map(s => s.id === student.id ? { ...s, prayedCount: newCount } : s));
      showToast(`${student.name} 학생을 위해 마음 모아 기도했습니다!`);
    } else {
      showToast("오류가 발생했습니다.", "error");
    }
  };

  const filteredPosts = posts
    .filter(p => p.type === communityTab && (isAdmin || !p.is_hidden))
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return b.id - a.id;
    });

  return (
    <div className="p-4 space-y-4 h-full relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-stone-800 flex items-center">커뮤니티</h2>
        
        {isAdmin && communityTab !== 'duties' && communityTab !== 'prayer' && (
          <button onClick={openWriteModal} className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center shadow-sm hover:bg-emerald-600">
            <Plus size={14} className="mr-1" /> 글쓰기
          </button>
        )}
        {communityTab === 'duties' && !editDutyMode && (
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
        <button onClick={() => setCommunityTab('prayer')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${communityTab === 'prayer' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}>기도나눔</button>
      </div>

      {communityTab !== 'duties' && communityTab !== 'prayer' && (
        <div className="space-y-3 pb-20">
          {filteredPosts.length === 0 ? <p className="text-center text-stone-400 text-sm py-10">등록된 게시글이 없습니다.</p> : filteredPosts.map(post => (
            <div 
              key={post.id} 
              onClick={() => setPostModal({ isOpen: true, post })} 
              className={`bg-white p-4 rounded-2xl shadow-sm border cursor-pointer transition-colors relative ${post.is_hidden ? 'border-stone-200 bg-stone-50 opacity-70' : 'border-stone-100 hover:border-emerald-200'} ${post.is_pinned ? 'border-emerald-200 bg-emerald-50/30' : ''}`}
            >
              <div className="absolute top-3 right-3 flex space-x-1">
                {post.is_pinned && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold flex items-center"><Pin size={10} className="mr-1"/>상단 고정됨</span>}
                {post.is_hidden && <span className="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded font-bold flex items-center"><EyeOff size={10} className="mr-1"/>숨김 처리됨</span>}
              </div>
              
              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-bold text-sm pr-24 ${post.is_hidden ? 'text-stone-500' : 'text-stone-800'}`}>{post.title}</h3>
                {post.hasFile && <ImageIcon size={14} className="text-emerald-500 shrink-0 ml-2 mt-0.5" />}
              </div>
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>{post.author}</span><span>{post.date}</span>
              </div>
              
              {isAdmin && (
                <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap justify-end gap-2">
                  <button onClick={(e) => handleTogglePin(e, post)} className="text-xs text-amber-600 hover:text-amber-700 px-2 py-1 rounded bg-amber-50 font-bold flex items-center transition-colors">
                    <Pin size={12} className="mr-1"/> {post.is_pinned ? '고정 해제' : '상단 고정'}
                  </button>
                  <button onClick={(e) => handleToggleHide(e, post)} className="text-xs text-stone-500 hover:text-stone-700 px-2 py-1 rounded bg-stone-100 font-bold flex items-center transition-colors">
                    {post.is_hidden ? <><Eye size={12} className="mr-1"/> 숨김 해제</> : <><EyeOff size={12} className="mr-1"/> 숨기기</>}
                  </button>
                  <button onClick={(e) => openEditModal(e, post)} className="text-xs text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded bg-emerald-50 font-bold flex items-center transition-colors">
                    <Edit size={12} className="mr-1"/> 수정
                  </button>
                  <button onClick={(e) => handleDeletePost(e, post)} className="text-xs text-rose-600 hover:text-rose-700 px-2 py-1 rounded bg-rose-50 font-bold flex items-center transition-colors">
                    <Trash2 size={12} className="mr-1"/> 삭제
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {communityTab === 'prayer' && (
        <div className="space-y-4 pb-20 animate-in fade-in duration-300">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
            <h3 className="font-bold text-emerald-700 text-sm flex items-center justify-center mb-1"><Heart size={16} className="mr-1.5" /> 중보 기도 릴레이</h3>
            <p className="text-[11px] text-emerald-600">학생 정보에 등록된 기도제목들이 모이는 곳입니다.<br/>함께 기도하며 사랑을 전해보세요.</p>
          </div>

          {students.filter(s => s.prayer && s.prayer.trim().length > 0).length === 0 ? (
            <p className="text-center text-stone-400 text-sm py-10">등록된 기도제목이 없습니다.</p>
          ) : (
            students.filter(s => s.prayer && s.prayer.trim().length > 0).map(student => (
              <div key={student.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 hover:border-emerald-200 transition-colors">
                <div className="flex items-center mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base mr-3 ${student.gender === '여' ? 'bg-rose-50 text-rose-500' : 'bg-sky-50 text-sky-600'}`}>
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-800 text-sm">{student.name} <span className="text-xs font-normal text-stone-400 ml-1">{student.group}</span></h3>
                  </div>
                </div>
                <p className="text-sm text-stone-700 whitespace-pre-wrap bg-[#FFFCF9] p-3 rounded-xl border border-stone-100 leading-relaxed">
                  {student.prayer}
                </p>
                <div className="mt-3 flex justify-end">
                  <button 
                    onClick={() => handlePrayed(student)} 
                    className="flex items-center text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-100 transition-colors"
                  >
                    🙏 기도했어요 
                    <span className="ml-1.5 bg-white text-emerald-500 px-2 py-0.5 rounded-full text-[10px] shadow-sm">
                      {student.prayedCount || 0}
                    </span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 예배 순서 */}
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
                    // ⭐ 시차 문제 해결: toISOString 대신 getLocalYYYYMMDD 사용
                    const dateStr = getLocalYYYYMMDD(sun);
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

      {/* 글쓰기 & 글수정 모달 */}
      {writeModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm h-[85vh] sm:h-auto sm:max-h-[80vh] sm:rounded-2xl rounded-t-3xl shadow-xl flex flex-col animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center p-4 border-b border-stone-100">
              <h3 className="font-bold text-stone-800">
                {editingPostId ? '게시글 수정' : `새 ${communityTab === 'notice' ? '공지사항' : '자료실'} 글쓰기`}
              </h3>
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
              <button onClick={savePost} className="bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm hover:bg-emerald-600">
                {editingPostId ? '수정완료' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}