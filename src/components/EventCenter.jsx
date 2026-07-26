import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, Check, Users, ChevronLeft, Trash2, PieChart, Info, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../supabase';

export default function EventCenter({ userRole, currentUser, students, showToast }) {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // 관리자 권한 확인
  const isAdmin = userRole !== '교사' || currentUser?.originalRole === '담당목사';
  const myStudents = students.filter(s => s.group === currentUser?.group);

  // 전체 반(Group) 목록 추출 (관리자용)
  const groups = [...new Set(students.map(s => s.group).filter(Boolean))].sort();

  // 반별 목록 펼침/접힘 상태 관리
  const [expandedGroups, setExpandedGroups] = useState({});

  // 모달 및 폼 상태
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date_range: '', options: ['전일 참석', '불참', '미정'] });
  
  // 참석 데이터 상태
  const [attendanceData, setAttendanceData] = useState([]); 
  const [teacherForm, setTeacherForm] = useState({}); 

  // 1. 등록된 행사 목록 불러오기
  const fetchEvents = async () => {
    const { data, error } = await supabase.from('events').select('*').eq('church_id', currentUser.churchId).order('id', { ascending: false });
    if (!error && data) setEvents(data);
  };

  useEffect(() => {
    if (currentUser?.churchId) fetchEvents();
  }, [currentUser]);

  // 2. 특정 행사의 참여 현황 불러오기
  const fetchEventAttendance = async (eventId) => {
    const { data, error } = await supabase.from('event_attendance').select('*').eq('event_id', eventId);
    if (!error && data) {
      setAttendanceData(data);
      if (!isAdmin) {
        const initialForm = {};
        myStudents.forEach(student => {
          const record = data.find(d => d.student_id === student.id);
          initialForm[student.id] = record ? record.selected_option : '미정';
        });
        setTeacherForm(initialForm);
      }
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setExpandedGroups({}); // 새 행사 클릭 시 펼쳐진 반 목록 초기화
    fetchEventAttendance(event.id);
  };

  // 반별 아코디언 토글 함수
  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  // 3. 행사 생성 로직 (관리자)
  const handleCreateEvent = async () => {
    if (!newEvent.title.trim()) return showToast('행사명을 입력해주세요.', 'error');
    if (newEvent.options.length < 2) return showToast('참여 옵션은 최소 2개 이상이어야 합니다.', 'error');

    const { data, error } = await supabase.from('events').insert([{
      church_id: currentUser.churchId,
      title: newEvent.title,
      date_range: newEvent.date_range,
      options: newEvent.options
    }]).select().single();

    if (!error && data) {
      setEvents([data, ...events]);
      setIsCreateModalOpen(false);
      setNewEvent({ title: '', date_range: '', options: ['전일 참석', '불참', '미정'] });
      showToast('새로운 행사가 생성되었습니다.');
    } else {
      showToast('행사 생성에 실패했습니다.', 'error');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('이 행사를 삭제하시겠습니까? 관련 통계가 모두 삭제됩니다.')) return;
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (!error) {
      setEvents(events.filter(e => e.id !== eventId));
      setSelectedEvent(null);
      showToast('행사가 삭제되었습니다.');
    }
  };

  // 옵션 추가/삭제
  const addOption = () => setNewEvent({ ...newEvent, options: [...newEvent.options, '새 옵션'] });
  const updateOption = (idx, val) => {
    const newOpts = [...newEvent.options];
    newOpts[idx] = val;
    setNewEvent({ ...newEvent, options: newOpts });
  };
  const removeOption = (idx) => setNewEvent({ ...newEvent, options: newEvent.options.filter((_, i) => i !== idx) });

  // 4. 교사: 참여 현황 일괄 저장
  const saveTeacherAttendance = async () => {
    const payload = Object.entries(teacherForm).map(([studentId, option]) => ({
      event_id: selectedEvent.id,
      student_id: studentId,
      selected_option: option,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('event_attendance').upsert(payload, { onConflict: 'event_id, student_id' });
    
    if (!error) {
      showToast('참여 현황이 저장되었습니다.');
      fetchEventAttendance(selectedEvent.id);
    } else {
      showToast('저장에 실패했습니다.', 'error');
    }
  };

  // 통계 계산 (관리자용)
  const getStats = () => {
    if (!selectedEvent) return {};
    const stats = {};
    selectedEvent.options.forEach(opt => stats[opt] = 0);
    attendanceData.forEach(record => {
      if (stats[record.selected_option] !== undefined) {
        stats[record.selected_option]++;
      }
    });
    return stats;
  };

  return (
    <div className="p-4 space-y-4 h-full relative">
      {!selectedEvent ? (
        // --- 1. 행사 목록 화면 ---
        <>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-stone-800 flex items-center">행사 및 인원조사</h2>
            {isAdmin && (
              <button onClick={() => setIsCreateModalOpen(true)} className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center shadow-sm hover:bg-emerald-600 transition-colors">
                <Plus size={14} className="mr-1" /> 행사 만들기
              </button>
            )}
          </div>

          <div className="space-y-3 pb-20">
            {events.length === 0 ? (
              <p className="text-center text-stone-400 text-sm py-10 bg-white rounded-xl border border-stone-100 border-dashed">등록된 행사가 없습니다.</p>
            ) : events.map(event => (
              <div key={event.id} onClick={() => handleSelectEvent(event)} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 cursor-pointer hover:border-emerald-300 transition-colors flex justify-between items-center group">
                <div>
                  <h3 className="font-bold text-stone-800 text-base group-hover:text-emerald-700 transition-colors">{event.title}</h3>
                  <p className="text-xs text-stone-500 mt-1 flex items-center"><Calendar size={12} className="mr-1"/> {event.date_range || '일정 미정'}</p>
                </div>
                <ChevronRight size={18} className="text-stone-300 group-hover:text-emerald-500 transition-colors" />
              </div>
            ))}
          </div>
        </>
      ) : (
        // --- 2. 특정 행사 상세 화면 ---
        <div className="pb-20 animate-in fade-in slide-in-from-right-2">
          <button onClick={() => setSelectedEvent(null)} className="flex items-center text-stone-500 text-sm font-bold mb-4 hover:text-emerald-600 transition-colors">
            <ChevronLeft size={16} className="mr-1" /> 목록으로
          </button>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-extrabold text-stone-800 mb-1 leading-tight">{selectedEvent.title}</h2>
                <p className="text-sm text-stone-500 flex items-center"><Calendar size={14} className="mr-1"/> {selectedEvent.date_range}</p>
              </div>
              {isAdmin && (
                <button onClick={() => handleDeleteEvent(selectedEvent.id)} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors shadow-sm">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {isAdmin ? (
            // ⭐ [관리자 뷰] 전체 통계 및 반별 확인
            <div className="space-y-6">
              {/* 전체 참여 통계 */}
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl shadow-sm">
                <h3 className="font-bold text-emerald-800 flex items-center mb-3 text-sm"><PieChart size={16} className="mr-1.5"/> 전체 참여 통계 (총 {students.length}명)</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(getStats()).map(([opt, count]) => (
                    <div key={opt} className="bg-white p-2.5 rounded-xl border border-emerald-100/50 flex justify-between items-center shadow-sm">
                      <span className="text-[11px] font-bold text-stone-600 truncate mr-2">{opt}</span>
                      <span className="text-sm font-extrabold text-emerald-600">{count}명</span>
                    </div>
                  ))}
                  <div className="bg-stone-100 p-3 rounded-xl border border-stone-200 flex justify-between items-center shadow-sm col-span-2 mt-1">
                    <span className="text-xs font-bold text-stone-500">미확인 / 미정 인원</span>
                    <span className="text-sm font-bold text-rose-500">{students.length - attendanceData.filter(d => d.selected_option !== '미정').length}명</span>
                  </div>
                </div>
              </div>

              {/* ⭐ 반별 상세 현황 (드롭다운 적용) */}
              <div>
                <h3 className="font-bold text-stone-800 flex items-center mb-3 text-sm">
                  <Users size={16} className="mr-1.5 text-emerald-500"/> 반별 상세 현황
                </h3>
                <div className="space-y-3">
                  {groups.map(group => {
                    const groupStudents = students.filter(s => s.group === group);
                    const groupRecords = groupStudents.map(student => {
                      const record = attendanceData.find(d => d.student_id === student.id);
                      return { ...student, option: record ? record.selected_option : null };
                    });

                    // 확정된 학생 (옵션이 있고, 미정이 아닌 경우)
                    const confirmed = groupRecords.filter(s => s.option && s.option !== '미정');
                    // 미확인 학생 (제출하지 않았거나, 미정인 경우)
                    const unconfirmed = groupRecords.filter(s => !s.option || s.option === '미정');
                    
                    const isExpanded = !!expandedGroups[group];

                    if (groupStudents.length === 0) return null;

                    return (
                      <div key={group} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 transition-all">
                        {/* 클릭 가능한 헤더 (토글 영역) */}
                        <div 
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() => toggleGroup(group)}
                        >
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-stone-800 text-sm">{group}</h4>
                            <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded-md">
                              확인 {confirmed.length}명 / 총 {groupStudents.length}명
                            </span>
                          </div>
                          <button className="text-stone-400 hover:text-emerald-500 transition-colors">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>

                        {/* 펼쳐졌을 때 보이는 내용 */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-stone-50 animate-in fade-in slide-in-from-top-1 duration-200">
                            {/* 옵션이 확정된 인원 리스트 */}
                            {confirmed.length > 0 && (
                              <div className="space-y-1.5 mb-3">
                                {confirmed.map(s => (
                                  <div key={s.id} className="flex justify-between items-center text-xs bg-[#FFFCF9] p-2 rounded-lg border border-stone-100">
                                    <span className="font-bold text-stone-700">{s.name}</span>
                                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">{s.option}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* 미확인/미정 인원 리스트 */}
                            {unconfirmed.length > 0 ? (
                              <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100/50">
                                <span className="text-[10px] font-bold text-rose-500 flex items-center mb-1.5">
                                  <Info size={12} className="mr-1"/> 아직 확인되지 않음 ({unconfirmed.length}명)
                                </span>
                                <span className="text-xs text-stone-600 leading-relaxed font-medium">
                                  {unconfirmed.map(s => s.name).join(', ')}
                                </span>
                              </div>
                            ) : (
                              <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50 text-center">
                                <span className="text-[10px] font-bold text-emerald-600">모든 인원 확인 완료 🎉</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            // [교사 뷰] 우리 반 인원 체크
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-1 px-1">
                <h3 className="font-bold text-stone-800 text-sm flex items-center"><Users size={16} className="mr-1.5 text-emerald-500"/> 우리 반 인원 체크</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{myStudents.length}명</span>
              </div>
              {myStudents.length === 0 ? (
                <p className="text-center text-stone-400 text-sm py-8 bg-white rounded-xl border border-stone-100 border-dashed">담당 반 학생이 없습니다.</p>
              ) : myStudents.map(student => (
                <div key={student.id} className="bg-white p-3 rounded-xl shadow-sm border border-stone-100 flex justify-between items-center hover:border-emerald-200 transition-colors">
                  <span className="font-bold text-stone-700 text-sm pl-1">{student.name}</span>
                  <select 
                    value={teacherForm[student.id] || '미정'}
                    onChange={(e) => setTeacherForm({...teacherForm, [student.id]: e.target.value})}
                    className="bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-400 shadow-sm min-w-[120px]"
                  >
                    <option value="미정">미정 (선택안함)</option>
                    {selectedEvent.options.map((opt, idx) => (
                      <option key={idx} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ))}
              <div className="pt-4">
                <button onClick={saveTeacherAttendance} className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-emerald-600 flex items-center justify-center transition-colors">
                  <Check size={18} className="mr-1" /> 참여 현황 저장하기
                </button>
                <p className="text-[10px] text-center text-stone-400 mt-3">저장 버튼을 누르면 관리자에게 실시간으로 반영됩니다.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 행사 생성 모달 (관리자용) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-4 border-b border-stone-100 bg-stone-50">
              <h3 className="font-bold text-stone-800">새 행사 만들기</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-stone-400 bg-white p-1 rounded-full shadow-sm hover:text-stone-600"><X size={16} /></button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1.5 block">행사/설문 이름 <span className="text-rose-500">*</span></label>
                <input type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="예: 여름 수련회 참석 조사" className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-400 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1.5 block">일정 (선택)</label>
                <input type="text" value={newEvent.date_range} onChange={e => setNewEvent({...newEvent, date_range: e.target.value})} placeholder="예: 8/14 ~ 8/16" className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-400 transition-colors" />
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-xs font-bold text-stone-600 block">참여 옵션 구성 <span className="text-rose-500">*</span></label>
                  <button onClick={addOption} className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-lg font-bold hover:bg-emerald-100 transition-colors">+ 옵션 추가</button>
                </div>
                <div className="space-y-2 mt-2">
                  {newEvent.options.map((opt, idx) => (
                    <div key={idx} className="flex space-x-2">
                      <input type="text" value={opt} onChange={e => updateOption(idx, e.target.value)} className="flex-1 border border-stone-200 p-2.5 rounded-xl text-xs outline-none focus:border-emerald-400 shadow-sm" />
                      <button onClick={() => removeOption(idx)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 shadow-sm transition-colors"><X size={14}/></button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-stone-400 mt-2 text-right">* 옵션은 최소 2개 이상 필요합니다.</p>
              </div>
            </div>
            <div className="p-4 border-t border-stone-100 bg-[#FFFCF9] flex space-x-2">
              <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 bg-white border border-stone-200 text-stone-600 text-sm font-bold rounded-xl hover:bg-stone-50 transition-colors">취소</button>
              <button onClick={handleCreateEvent} className="flex-1 py-3 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-emerald-600 transition-colors">생성하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}