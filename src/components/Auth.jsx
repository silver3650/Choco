import React, { useState, useEffect } from 'react';
import { ChevronLeft, Church, ArrowRight, UserPlus, UserCircle, Search, X, Check } from 'lucide-react';
import { supabase } from '../supabase';

export default function Auth({
  authMode, setAuthMode, loginForm, setLoginForm, signupForm, setSignupForm,
  createChurchForm, setCreateChurchForm, joinSearchQuery, setJoinSearchQuery,
  selectedChurchToJoin, setSelectedChurchToJoin, handleLogin, handleSignup,
  handleCreateChurch, handleJoinChurch, currentUser
}) {
  const [realChurches, setRealChurches] = useState([]);

  useEffect(() => {
    const fetchChurches = async () => {
      const { data } = await supabase.from('churches').select('*');
      if (data) setRealChurches(data);
    };
    fetchChurches();
  }, []);

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-[#FFFCF9] w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        
        <div className="bg-linear-to-r from-emerald-500 to-teal-500 p-8 text-center text-white relative shrink-0">
          {authMode !== 'login' && authMode !== 'pending' && (
            <button onClick={() => {
              if (authMode === 'signup') setAuthMode('login');
              else if (authMode === 'create_church' || authMode === 'join_church') setAuthMode('select_church');
            }} className="absolute left-4 top-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
              <ChevronLeft size={20} />
            </button>
          )}
          <Church size={48} className="mx-auto mb-3 text-white/90 drop-shadow-sm" />
          <h1 className="text-2xl font-extrabold mb-2 tracking-tight drop-shadow-sm">초코(Choco)</h1>
          <p className="text-white/90 text-sm font-medium">교회 다음세대 통합 관리 플랫폼</p>
        </div>

        <div className="p-6 overflow-y-auto">
          {authMode === 'login' && (
            <div className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  {/* ⭐ 이름 대신 이메일을 입력하도록 변경됨 */}
                  <label className="block text-xs font-bold text-stone-700 mb-1.5 ml-1">이메일 계정</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="가입하신 이메일을 입력하세요" 
                    value={loginForm.email} 
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})} 
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-stone-800" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5 ml-1">비밀번호</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="비밀번호 입력" 
                    value={loginForm.password} 
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} 
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-stone-800" 
                  />
                </div>
                <button type="submit" className="w-full bg-emerald-500 text-white font-bold rounded-xl py-3.5 shadow-md hover:bg-emerald-600 mt-2 text-sm flex justify-center items-center transition-colors">
                  로그인 <ArrowRight size={16} className="ml-2" />
                </button>
              </form>

              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-[#FFFCF9] text-stone-500 font-medium text-xs">처음 오셨나요?</span></div>
              </div>

              <button onClick={() => setAuthMode('signup')} className="w-full bg-stone-50 text-stone-700 font-bold rounded-xl py-3.5 border border-stone-200 hover:bg-stone-100 text-sm flex items-center justify-center transition-colors">
                <UserPlus size={16} className="mr-2" /> 1분 만에 회원가입 하기
              </button>
            </div>
          )}

          {authMode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="mb-4 text-center">
                <h2 className="text-lg font-bold text-stone-800">기본 정보 입력</h2>
                <p className="text-xs text-stone-500 mt-1">앱 사용을 위해 먼저 계정을 생성합니다.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-stone-700 mb-1">이름</label>
                  <input type="text" required placeholder="홍길동" value={signupForm.name} onChange={e => setSignupForm({...signupForm, name: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-stone-800" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-stone-700 mb-1">생년월일(YYYY-MM-DD)</label>
                  <input type="text" required placeholder="1990-06-12" value={signupForm.birth} onChange={e => setSignupForm({...signupForm, birth: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-stone-800" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">연락처</label>
                  <input type="text" required placeholder="010-0000-0000" value={signupForm.phone} onChange={e => setSignupForm({...signupForm, phone: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-stone-800" />
                </div>
                <div className="col-span-2">
                  {/* ⭐ 이메일 입력을 필수로 변경 */}
                  <label className="block text-xs font-bold text-stone-700 mb-1">이메일 (로그인 시 사용)</label>
                  <input type="email" required placeholder="user@church.com" value={signupForm.email} onChange={e => setSignupForm({...signupForm, email: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-stone-800" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">비밀번호</label>
                  <input type="password" required placeholder="비밀번호" value={signupForm.password} onChange={e => setSignupForm({...signupForm, password: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-stone-800" />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-500 text-white font-bold rounded-xl py-3.5 shadow-md hover:bg-emerald-600 mt-4 text-sm transition-colors">가입 완료 및 계속하기</button>
            </form>
          )}

          {authMode === 'select_church' && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3"><UserCircle size={32} className="text-emerald-500" /></div>
                <h2 className="text-xl font-bold text-stone-800">환영합니다, {currentUser?.name}님!</h2>
                <p className="text-sm text-stone-600 mt-1">소속된 교회를 찾아 가입하거나<br/>새로운 교회 공간을 만들어보세요.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => setAuthMode('join_church')} className="w-full bg-white text-stone-800 font-bold rounded-2xl p-5 border-2 border-stone-100 hover:border-emerald-400 hover:shadow-md transition-all text-left flex items-center group">
                  <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mr-4 group-hover:bg-emerald-50 transition-colors"><Search size={24} className="text-stone-400 group-hover:text-emerald-500" /></div>
                  <div>
                    <p className="text-base text-stone-800">교회 찾아 가입하기</p>
                    <p className="text-xs text-stone-500 font-normal mt-0.5">선생님, 부장님으로 초대를 받으셨나요?</p>
                  </div>
                </button>
                
                <button onClick={() => setAuthMode('create_church')} className="w-full bg-white text-stone-800 font-bold rounded-2xl p-5 border-2 border-stone-100 hover:border-sky-500 hover:shadow-md transition-all text-left flex items-center group">
                  <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mr-4 group-hover:bg-sky-50 transition-colors"><Church size={24} className="text-stone-400 group-hover:text-sky-600" /></div>
                  <div>
                    <p className="text-base text-stone-800">새로운 공간 만들기</p>
                    <p className="text-xs text-stone-500 font-normal mt-0.5">우리 교회만의 전용 시스템을 개설합니다.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {authMode === 'create_church' && (
            <form onSubmit={handleCreateChurch} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="mb-6 text-center">
                <h2 className="text-lg font-bold text-stone-800">새로운 공간 개설</h2>
                <p className="text-xs text-stone-500 mt-1">개설 시 귀하에게 최고 관리자 권한이 부여됩니다.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">교회 이름</label>
                  <input type="text" required placeholder="예: 한사랑교회" value={createChurchForm.churchName} onChange={e => setCreateChurchForm({...createChurchForm, churchName: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-stone-800" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">부서 이름</label>
                  <input type="text" required placeholder="예: 청소년부, 고등부" value={createChurchForm.deptName} onChange={e => setCreateChurchForm({...createChurchForm, deptName: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-stone-800" />
                </div>
                {/* ⭐ 담당 사역자 입력란 추가 */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">담당 사역자</label>
                  <input type="text" placeholder="예: 김철수 목사" value={createChurchForm.pastorName || ''} onChange={e => setCreateChurchForm({...createChurchForm, pastorName: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-stone-800" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">교회 주소 (선택)</label>
                  <input type="text" placeholder="간략한 주소 입력 (예: 서울시 서초구)" value={createChurchForm.address} onChange={e => setCreateChurchForm({...createChurchForm, address: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-stone-800" />
                </div>
              </div>
              <button type="submit" className="w-full bg-sky-500 text-white font-bold rounded-xl py-3.5 shadow-md hover:bg-sky-600 mt-6 text-sm transition-colors">공간 개설 완료 및 입장</button>
            </form>
          )}

          {authMode === 'join_church' && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <div className="mb-5 text-center">
                <h2 className="text-lg font-bold text-stone-800">교회 찾아 가입하기</h2>
              </div>
              {!selectedChurchToJoin ? (
                <div className="space-y-4">
                  <div className="relative">
                    <input type="text" placeholder="교회 이름 검색..." value={joinSearchQuery} onChange={e => setJoinSearchQuery(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-stone-800" />
                    <Search size={18} className="absolute left-3 top-3.5 text-stone-400" />
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-stone-100 rounded-xl bg-white p-2">
                    {realChurches.filter(c => c.name.includes(joinSearchQuery)).map(church => (
                      <div key={church.id} onClick={() => setSelectedChurchToJoin(church)} className="p-3 border border-stone-100 rounded-lg flex justify-between items-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-colors">
                        <div>
                          <p className="font-bold text-sm text-stone-800">{church.name}</p>
                          <p className="text-[11px] text-stone-500 mt-0.5">{church.dept} • {church.address}</p>
                        </div>
                        <ChevronLeft size={16} className="rotate-180 text-stone-400" />
                      </div>
                    ))}
                    {realChurches.length === 0 && <p className="text-xs text-stone-400 text-center py-4">등록된 교회가 없습니다.</p>}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleJoinChurch} className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-4 text-center relative">
                    <button type="button" onClick={() => setSelectedChurchToJoin(null)} className="absolute left-3 top-4 text-emerald-500"><X size={18}/></button>
                    <p className="text-xs font-bold text-emerald-600 mb-1">가입할 소속</p>
                    <p className="text-base font-extrabold text-emerald-800">{selectedChurchToJoin.name} {selectedChurchToJoin.dept}</p>
                  </div>
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 mb-4">
                    <p className="text-xs font-bold text-stone-500 mb-2">가입자 정보</p>
                    <p className="text-sm font-bold text-stone-800">{currentUser?.name} <span className="font-normal text-stone-500">({currentUser?.phone})</span></p>
                  </div>
                  <button type="submit" className="w-full bg-emerald-500 text-white font-bold rounded-xl py-3.5 shadow-md hover:bg-emerald-600 text-sm transition-colors">가입 신청 완료하기</button>
                </form>
              )}
            </div>
          )}

          {authMode === 'pending' && (
            <div className="text-center py-6 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><Check size={32} className="text-emerald-500" /></div>
              <h2 className="text-xl font-bold text-stone-800 mb-2">가입 신청 완료</h2>
              <p className="text-sm text-stone-600 mb-6 leading-relaxed">해당 교회의 관리자 승인 후<br/>앱을 정상적으로 이용하실 수 있습니다.</p>
              <button onClick={() => { setAuthMode('login'); setLoginForm({email:'', password:''}); }} className="bg-stone-100 text-stone-700 font-bold px-6 py-2.5 rounded-xl hover:bg-stone-200 text-sm transition-colors">첫 화면으로 돌아가기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}