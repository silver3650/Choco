import React from 'react';
import { MessageCircle, Edit, Plus, Calendar, ClipboardList, UserCircle } from 'lucide-react';

export default function Community({
  userRole, posts, duties, communityTab, setCommunityTab,
  setPostModal, openEditDuty, showToast
}) {
  const isManager = userRole === '담당목사' || userRole === '부장';
  const notices = posts.filter(p => p.type === 'notice');
  const materials = posts.filter(p => p.type === 'material');

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 border-b border-stone-200 pb-2">
        <h2 className="text-lg font-bold text-stone-800 flex items-center"><MessageCircle size={20} className="mr-2 text-emerald-500"/>커뮤니티</h2>
      </div>

      <div className="flex bg-stone-200 p-1 rounded-xl mb-4 text-center">
        <button onClick={() => setCommunityTab('notice')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${communityTab === 'notice' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}>공지사항</button>
        <button onClick={() => setCommunityTab('material')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${communityTab === 'material' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}>자료실</button>
        <button onClick={() => setCommunityTab('duty')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${communityTab === 'duty' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}>예배순서</button>
      </div>

      {communityTab === 'notice' && (
        <div className="space-y-3">
          {isManager && <div className="flex justify-end"><button onClick={() => showToast("새로운 공지사항 작성 폼이 열립니다.", "info")} className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg font-bold flex items-center border border-emerald-100 hover:bg-emerald-100 transition-colors"><Edit size={12} className="mr-1"/> 작성하기</button></div>}
          {notices.map(post => (
            <div key={post.id} onClick={() => setPostModal({ isOpen: true, post })} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 cursor-pointer hover:bg-[#FFFCF9] transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-600">공지</span>
                <span className="text-[10px] text-stone-400">{post.date}</span>
              </div>
              <h3 className="font-bold text-sm text-stone-800 mb-1">{post.title}</h3>
              <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">{post.content}</p>
            </div>
          ))}
        </div>
      )}

      {communityTab === 'material' && (
        <div className="space-y-3">
          {isManager && <div className="flex justify-end"><button onClick={() => showToast("파일 업로드 창이 열립니다.", "info")} className="text-xs bg-sky-50 text-sky-600 px-3 py-1.5 rounded-lg font-bold flex items-center border border-sky-100 hover:bg-sky-100 transition-colors"><Plus size={12} className="mr-1"/> 자료 업로드</button></div>}
          {materials.map(post => (
            <div key={post.id} onClick={() => setPostModal({ isOpen: true, post })} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 cursor-pointer hover:bg-[#FFFCF9] transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-600">{post.category}</span>
                <span className="text-[10px] text-stone-400">{post.date}</span>
              </div>
              <h3 className="font-bold text-sm text-stone-800 mb-1">{post.title}</h3>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-stone-500 line-clamp-1 flex-1 pr-4">{post.content}</p>
                {post.hasFile && <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 px-2 py-1 rounded">첨부파일</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {communityTab === 'duty' && (
        <div className="space-y-3">
           <div className="flex justify-between items-center bg-stone-50 p-2 rounded-xl border border-stone-200">
             <span className="text-sm font-bold text-stone-700 ml-2">예배 및 기도회 순서</span>
             <select defaultValue="6월" className="text-xs bg-white border border-stone-200 rounded-lg py-1 px-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-emerald-600">
               <option value="5월">2026년 5월</option>
               <option value="6월">2026년 6월</option>
             </select>
           </div>
           
           {duties.map(duty => (
              <div key={duty.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
                  <span className="font-bold text-emerald-600 flex items-center text-sm"><Calendar size={16} className="mr-1.5" /> {duty.date}</span>
                  <button onClick={() => openEditDuty(duty)} className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold hover:bg-emerald-100 transition-colors border border-emerald-100">수정</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#FFFCF9] border border-stone-100 p-2 rounded-lg text-center">
                    <p className="text-[10px] font-bold text-stone-400 mb-1 flex items-center justify-center"><ClipboardList size={10} className="mr-1"/>기도회 인도</p>
                    <p className="text-sm font-bold text-stone-800">{duty.leader}</p>
                  </div>
                  <div className="bg-[#FFFCF9] border border-stone-100 p-2 rounded-lg text-center">
                    <p className="text-[10px] font-bold text-stone-400 mb-1 flex items-center justify-center"><UserCircle size={10} className="mr-1"/>예배 대표기도</p>
                    <p className="text-sm font-bold text-stone-800">{duty.prayer}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
