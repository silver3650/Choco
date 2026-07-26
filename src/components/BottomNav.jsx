import React from 'react';
import { Home, CheckSquare, Users, MessageCircle, Calendar, Settings } from 'lucide-react';

export default function BottomNav({ currentTab, setCurrentTab, userRole, hasNewCommunity, hasNewEvent }) {
  return (
    <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-stone-200 flex justify-around items-center h-15 pb-safe z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
      <button onClick={() => setCurrentTab('dashboard')} className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${currentTab === 'dashboard' ? 'text-emerald-500' : 'text-stone-400 hover:text-stone-600'}`}>
        <Home size={22} className={currentTab === 'dashboard' ? 'fill-current' : ''} />
        <span className="text-[10px] mt-1 font-bold">홈</span>
      </button>
      <button onClick={() => setCurrentTab('attendance')} className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${currentTab === 'attendance' ? 'text-emerald-500' : 'text-stone-400 hover:text-stone-600'}`}>
        <CheckSquare size={22} className={currentTab === 'attendance' ? 'fill-current' : ''} />
        <span className="text-[10px] mt-1 font-bold">출석체크</span>
      </button>
      <button onClick={() => setCurrentTab('students')} className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${currentTab === 'students' || currentTab === 'profile' ? 'text-emerald-500' : 'text-stone-400 hover:text-stone-600'}`}>
        <Users size={22} className={currentTab === 'students' || currentTab === 'profile' ? 'fill-current' : ''} />
        <span className="text-[10px] mt-1 font-bold">학생관리</span>
      </button>
      
      {/* ⭐ 커뮤니티 탭 (NEW 뱃지 포함) */}
      <button onClick={() => setCurrentTab('community')} className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 relative ${currentTab === 'community' ? 'text-emerald-500' : 'text-stone-400 hover:text-stone-600'}`}>
        <div className="relative">
          <MessageCircle size={22} className={currentTab === 'community' ? 'fill-current' : ''} />
          {hasNewCommunity && currentTab !== 'community' && (
            <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[8px] font-extrabold px-1 rounded-full animate-pulse shadow-sm">
              NEW
            </span>
          )}
        </div>
        <span className="text-[10px] mt-1 font-bold">커뮤니티</span>
      </button>

      {/* ⭐ 행사/설문 탭 (NEW 뱃지 포함) */}
      <button onClick={() => setCurrentTab('events')} className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 relative ${currentTab === 'events' ? 'text-emerald-500' : 'text-stone-400 hover:text-stone-600'}`}>
        <div className="relative">
          <Calendar size={22} className={currentTab === 'events' ? 'fill-current' : ''} />
          {hasNewEvent && currentTab !== 'events' && (
            <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[8px] font-extrabold px-1 rounded-full animate-pulse shadow-sm">
              NEW
            </span>
          )}
        </div>
        <span className="text-[10px] mt-1 font-bold">행사/설문</span>
      </button>

      {userRole !== '교사' && (
        <button onClick={() => setCurrentTab('admin')} className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${currentTab === 'admin' ? 'text-emerald-500' : 'text-stone-400 hover:text-stone-600'}`}>
          <Settings size={22} className={currentTab === 'admin' ? 'fill-current' : ''} />
          <span className="text-[10px] mt-1 font-bold">관리자</span>
        </button>
      )}
    </nav>
  );
}