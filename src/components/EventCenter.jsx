import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, Check, Users, ChevronLeft, Trash2, PieChart, Info, ChevronRight, ChevronDown, ChevronUp, Edit, MessageSquare } from 'lucide-react';
import { supabase } from '../supabase';

export default function EventCenter({ userRole, currentUser, students, showToast }) {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // 관리자 권한 확인
  const isAdmin = userRole !== '교사' || currentUser?.originalRole === '담당목사';
  const myStudents = students.filter(s => s.group === currentUser?.group);

  // 전체 반(Group) 목록 추출 (관리자용)
  const groups = [...new Set(students.map(s => s.group).filter(Boolean))].sort();

  // 반별 및 통계 목록 펼침/접힘 상태 관리
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedStat, setExpandedStat] = useState(null); // ⭐ 통계 명단 펼침 상태 관리

  // 모달 및 폼 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [eventForm, setEventForm] = useState({ id: null, title: '', date_range: '', options: ['전일 참석', '불참', '미정'] });
  
  // 참석 데이터 상태
  const [attendanceData, setAttendanceData] = useState([]); 
  const [teacherForm, setTeacherForm] = useState({}); 
  const [teacherNoteForm, setTeacherNoteForm] = useState({});

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
        const initialNotes = {};
        myStudents.forEach(student => {
          const record = data.find(d => d.student_id === student.id);
          initialForm[student.id] = record ? record.selected_option : '미정';
          initialNotes[student.id] = record ? (record.note || '') : '';
        });
        setTeacherForm(initialForm);
        setTeacherNoteForm(initialNotes);
      }
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setExpandedGroups({});
    setExpandedStat(null); // 새 행사 클릭 시 통계 드롭다운도 초기화
    fetchEventAttendance(event.id);
  };

  // 3. 행사 생성 및 수정 로직 (관리자)
  const openCreateModal = () => {
    setIsEditMode(false);
    setEventForm({ id: null, title: '', date_range: '', options: ['전일 참석', '불참', '미정'] });
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    setIsEditMode(true);
    setEventForm({ 
      id: selectedEvent.id, 
      title: selectedEvent.title, 
      date_range: selectedEvent.date_range, 
      options: [...selectedEvent.options] 
    });
    setIsModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title.trim()) return showToast('행사명을 입력해주세요.', 'error');
    if (eventForm.options.length < 2) return showToast('참여 옵션은 최소 2개 이상이어야 합니다.', 'error');

    if (isEditMode) {
      const { data, error } = await supabase.from('events')
        .update({
          title: eventForm.title,
          date_range: eventForm.date_range,
          options: eventForm.options
        })
        .eq('id', eventForm.id)
        .select().single();

      if (!error && data) {
        setEvents(events.map(e => e.id === data.id ? data : e));
        setSelectedEvent(data); 
        setIsModalOpen(false);
        showToast('행사 내용이 수정되었습니다.');
      } else {
        showToast('수정에 실패했습니다.', 'error');
      }
    } else {
      const { data, error } = await supabase.from('events').insert([{
        church_id: currentUser.churchId,
        title: eventForm.title,
        date_range: eventForm.date_range,
        options: eventForm.options
      }]).select().single();

      if (!error && data) {
        setEvents([data, ...events]);
        setIsModalOpen(false);
        showToast('새로운 행사가 생성되었습니다.');
      } else {
        showToast('행사 생성에 실패했습니다.', 'error');
      }
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('이 행사를 완전히 삭제하시겠습니까? 관련 통계가 모두 삭제됩니다.')) return;
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (!error) {
      setEvents(events.filter(e => e.id !== eventId));
      setSelectedEvent(null);
      showToast('행사가 삭제되었습니다.');
    }
  };

  // 옵션 추가/삭제
  const addOption = () => setEventForm({ ...eventForm, options: [...eventForm.options, '새 옵션'] });
  const updateOption = (idx, val) => {
    const newOpts = [...eventForm.options];
    newOpts[idx] = val;
    setEventForm({ ...eventForm, options: newOpts });
  };
  const removeOption = (idx) => setEventForm({ ...eventForm, options: eventForm.options.filter((_, i) => i !== idx) });

  // 4. 교사: 참여 현황 및 변동사항 일괄 저장
  const saveTeacherAttendance = async () => {
    const payload = Object.entries(teacherForm).map(([studentId, option]) => ({
      event_id: selectedEvent.id,
      student_id: studentId,
      selected_option: option,
      note: teacherNoteForm[studentId] || null,
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

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <div className="p-4 space-y-4 h-full relative">
      {!selectedEvent ? (
        // --- 1. 행사 목록 화면 ---
        <>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-stone-800 flex items-center">행사 및 인원조사</h2>
            {isAdmin && (
              <button onClick={openCreateModal} className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center shadow-sm hover:bg-emerald-600 transition-colors">
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
                <div className="flex space-x-2">
                  <button onClick={openEditModal} className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors shadow-sm">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDeleteEvent(selectedEvent.id)} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors shadow-sm">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {isAdmin ? (
            // ⭐ [관리자 뷰] 전체 통계 및 반별 확인
            <div className="space-y-6">
              
              {/* 전체 참여 통계 (클릭 시 명단 드롭다운) */}
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl shadow-sm">
                <h3 className="font-bold text-emerald-800 flex items-center mb-3 text-sm"><PieChart size={16} className="mr-1.5"/> 전체 참여 통계 (총 {students.length}명)</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(getStats()).map(([opt, count]) => (
                    <div 
                      key={opt} 
                      onClick={() => setExpandedStat(expandedStat === opt ? null : opt)}
                      className={`p-2.5 rounded-xl border flex justify-between items-center shadow-sm cursor-pointer transition-colors ${
                        expandedStat === opt 
                          ? 'bg-emerald-500 border-emerald-600' 
                          : 'bg-white border-emerald-100/50 hover:border-emerald-300'
                      }`}
                    >
                      <span className={`text-[11px] font-bold truncate mr-2 ${expandedStat === opt ? 'text-white' : 'text-stone-600'}`}>{opt}</span>
                      <div className="flex items-center">
                        <span className={`text-sm font-extrabold mr-1.5 ${expandedStat === opt ? 'text-white' : 'text-emerald-600'}`}>{count}명</span>
                        {expandedStat === opt ? <ChevronUp size={14} className="text-emerald-100" /> : <ChevronDown size={14} className="text-emerald-300" />}
                      </div>
                    </div>
                  ))}
                  
                  <div 
                    onClick={() => setExpandedStat(expandedStat === '미확인/미정' ? null : '미확인/미정')}
                    className={`p-3 rounded-xl border flex justify-between items-center shadow-sm col-span-2 mt-1 cursor-pointer transition-colors ${
                      expandedStat === '미확인/미정'
                        ? 'bg-stone-700 border-stone-800'
                        : 'bg-stone-100 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span className={`text-xs font-bold ${expandedStat === '미확인/미정' ? 'text-stone-100' : 'text-stone-500'}`}>미확인 / 미정 인원</span>
                    <div className="flex items-center">
                      <span className={`text-sm font-bold mr-1.5 ${expandedStat === '미확인/미정' ? 'text-white' : 'text-rose-500'}`}>
                        {students.length - attendanceData.filter(d => d.selected_option !== '미정').length}명
                      </span>
                      {expandedStat === '미확인/미정' ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
                    </div>
                  </div>
                </div>

                {/* ⭐ 확장된 통계 명단 뷰 */}
                {expandedStat && (
                  <div className="mt-3 pt-3 border-t border-emerald-100/80 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[11px] font-bold text-emerald-800 flex items-center">
                        <Info size={12} className="mr-1" /> '{expandedStat}' 학생 명단
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(() => {
                        let targetStudents = [];
                        if (expandedStat === '미확인/미정') {
                          targetStudents = students.filter(s => {
                            const rec = attendanceData.find(d => d.student_id === s.id);
                            return !rec || rec.selected_option === '미정';
                          });
                        } else {
                          targetStudents = students.filter(s => {
                            const rec = attendanceData.find(d => d.student_id === s.id);
                            return rec && rec.selected_option === expandedStat;
                          });
                        }

                        if (targetStudents.length === 0) {
                          return <span className="text-[11px] text-stone-500 py-1">해당 인원이 없습니다.</span>;
                        }

                        return targetStudents.map(s => (
                          <span key={s.id} className="text-[10px] font-bold bg-white border border-emerald-100 text-stone-700 px-2 py-1.5 rounded-md shadow-sm">
                            {s.name} <span className="text-emerald-600 font-normal ml-0.5">{s.group}</span>
                          </span>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* 반별 상세 현황 */}
              <div>
                <h3 className="font-bold text-stone-800 flex items-center mb-3 text-sm">
                  <Users size={16} className="mr-1.5 text-emerald-500"/> 반별 상세 현황 (변동사항)
                </h3>
                <div className="space-y-3">
                  {groups.map(group => {
                    const groupStudents = students.filter(s => s.group === group);
                    const groupRecords = groupStudents.map(student => {
                      const record = attendanceData.find(d => d.student_id === student.id);
                      return { ...student, option: record ? record.selected_option : null, note: record ? record.note : null };
                    });

                    const confirmed = groupRecords.filter(s => s.option && s.option !== '미정');
                    const unconfirmed = groupRecords.filter(s => !s.option || s.option === '미정');
                    const isExpanded = !!expandedGroups[group];

                    if (groupStudents.length === 0) return null;

                    return (
                      <div key={group} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 transition-all">
                        <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleGroup(group)}>
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

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-stone-50 animate-in fade-in slide-in-from-top-1 duration-200">
                            {confirmed.length > 0 && (
                              <div className="space-y-2 mb-3">
                                {confirmed.map(s => (
                                  <div key={s.id} className="flex flex-col bg-[#FFFCF9] p-2.5 rounded-xl border border-stone-100">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-bold text-stone-700 text-xs pl-1">{s.name}</span>
                                      <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">{s.option}</span>
                                    </div>
                                    {s.note && (
                                      <div className="mt-1 flex items-start bg-white p-2 rounded-lg border border-stone-100 text-[10px] text-stone-600 shadow-sm">
                                        <MessageSquare size={12} className="mr-1.5 mt-0.5 text-emerald-400 shrink-0" />
                                        <span className="leading-tight">{s.note}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

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
            // [교사 뷰] 우리 반 인원 체크 및 변동사항 입력
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-1 px-1">
                <h3 className="font-bold text-stone-800 text-sm flex items-center"><Users size={16} className="mr-1.5 text-emerald-500"/> 우리 반 인원 체크</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{myStudents.length}명</span>
              </div>
              
              <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl mb-2 text-[10px] text-stone-500 leading-tight">
                * 제출 후에도 언제든지 옵션이나 변동사항을 수정하고 <b>[저장하기]</b>를 다시 누르면 덮어씌워집니다.
              </div>

              {myStudents.length === 0 ? (
                <p className="text-center text-stone-400 text-sm py-8 bg-white rounded-xl border border-stone-100 border-dashed">담당 반 학생이 없습니다.</p>
              ) : myStudents.map(student => (
                <div key={student.id} className="bg-white p-3.5 rounded-xl shadow-sm border border-stone-100 flex flex-col space-y-2 hover:border-emerald-200 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-stone-800 text-sm pl-1">{student.name}</span>
                    <select 
                      value={teacherForm[student.id] || '미정'}
                      onChange={(e) => setTeacherForm({...teacherForm, [student.id]: e.target.value})}
                      className="bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-400 shadow-sm min-w-30"
                    >
                      <option value="미정">미정 (선택안함)</option>
                      {selectedEvent.options.map((opt, idx) => (
                        <option key={idx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <input 
                    type="text" 
                    placeholder="변동사항이나 비고 입력 (예: 늦게 도착, 식사 안함 등)" 
                    value={teacherNoteForm[student.id] || ''}
                    onChange={(e) => setTeacherNoteForm({...teacherNoteForm, [student.id]: e.target.value})}
                    className="w-full text-[11px] bg-stone-50 border border-stone-100 rounded-lg p-2 outline-none focus:border-emerald-400 transition-colors placeholder:text-stone-400"
                  />
                </div>
              ))}
              <div className="pt-4">
                <button onClick={saveTeacherAttendance} className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-emerald-600 flex items-center justify-center transition-colors">
                  <Check size={18} className="mr-1" /> 참여 현황 및 변동사항 저장
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 행사 생성 및 수정 모달 (관리자용) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-4 border-b border-stone-100 bg-stone-50">
              <h3 className="font-bold text-stone-800">{isEditMode ? '행사 수정하기' : '새 행사 만들기'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 bg-white p-1 rounded-full shadow-sm hover:text-stone-600"><X size={16} /></button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1.5 block">행사/설문 이름 <span className="text-rose-500">*</span></label>
                <input type="text" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} placeholder="예: 여름 수련회 참석 조사" className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-400 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1.5 block">일정 (선택)</label>
                <input type="text" value={eventForm.date_range} onChange={e => setEventForm({...eventForm, date_range: e.target.value})} placeholder="예: 8/14 ~ 8/16" className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-sm outline-none focus:border-emerald-400 transition-colors" />
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-xs font-bold text-stone-600 block">참여 옵션 구성 <span className="text-rose-500">*</span></label>
                  <button onClick={addOption} className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-lg font-bold hover:bg-emerald-100 transition-colors">+ 옵션 추가</button>
                </div>
                <div className="space-y-2 mt-2">
                  {eventForm.options.map((opt, idx) => (
                    <div key={idx} className="flex space-x-2">
                      <input type="text" value={opt} onChange={e => updateOption(idx, e.target.value)} className="flex-1 border border-stone-200 p-2.5 rounded-xl text-xs outline-none focus:border-emerald-400 shadow-sm" />
                      <button onClick={() => removeOption(idx)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 shadow-sm transition-colors"><X size={14}/></button>
                    </div>
                  ))}
                </div>
                {isEditMode && <p className="text-[10px] text-rose-500 mt-2">* 이미 선택된 옵션을 지우거나 수정하면 통계에 혼선이 생길 수 있습니다.</p>}
              </div>
            </div>
            <div className="p-4 border-t border-stone-100 bg-[#FFFCF9] flex space-x-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white border border-stone-200 text-stone-600 text-sm font-bold rounded-xl hover:bg-stone-50 transition-colors">취소</button>
              <button onClick={handleSaveEvent} className="flex-1 py-3 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-emerald-600 transition-colors">
                {isEditMode ? '수정 내용 저장' : '생성하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}