import React, { useState, useEffect } from 'react';
import { 
  Church, LogOut, ChevronUp, AlertCircle, CheckCircle2, FileText, 
  X, Calendar, ClipboardList, UserCircle, Save, Phone, MessageCircle 
} from 'lucide-react';

import { supabase } from './supabase'; 

import Auth from './components/Auth';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import Attendance from './components/Attendance';
import StudentList from './components/StudentList';
import Profile from './components/Profile';
import Community from './components/Community';
import AdminCenter from './components/AdminCenter';
import SuperAdminCenter from './components/SuperAdminCenter';

export default function App() {
  const getLocalYYYYMMDD = (d = new Date()) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [communityTab, setCommunityTab] = useState('notice');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [sundayAttendance, setSundayAttendance] = useState({});
  const [sundayDate, setSundayDate] = useState('');
  
  const [selectedAttDate, setSelectedAttDate] = useState(getLocalYYYYMMDD());
  
  const [logs, setLogs] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  
  const [duties, setDuties] = useState([]);
  const [posts, setPosts] = useState([]);
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [userRole, setUserRole] = useState(''); 
  const [currentUser, setCurrentUser] = useState(null); 
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', phone: '', email: '', password: '', birth: '' });
  const [createChurchForm, setCreateChurchForm] = useState({ churchName: '', deptName: '', pastorName: '', address: '' });
  const [joinSearchQuery, setJoinSearchQuery] = useState('');
  const [selectedChurchToJoin, setSelectedChurchToJoin] = useState(null);

  const [quickLogModal, setQuickLogModal] = useState({ isOpen: false, student: null, existingLog: null });
  const [quickLogForm, setQuickLogForm] = useState({ text: '', method: '대면', date: getLocalYYYYMMDD() });
  
  const [editStudentModal, setEditStudentModal] = useState({ isOpen: false, student: null, isNew: false });
  const [postModal, setPostModal] = useState({ isOpen: false, post: null });
  const [editDutyModal, setEditDutyModal] = useState({ isOpen: false, duty: null });
  const [myProfileModal, setMyProfileModal] = useState({ isOpen: false, name: '', phone: '', birth: '', email: '' });

  const [prayerPopup, setPrayerPopup] = useState({ isOpen: false, student: null });

  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null });
  
  const [showScrollTop, setShowScrollTop] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast(prev => prev.message === message ? { ...prev, isOpen: false } : prev), 3000);
  };
  const handleConfirm = (message, onConfirmCallback) => setConfirmDialog({ isOpen: true, message, onConfirm: onConfirmCallback });
  const executeConfirm = () => { if(confirmDialog.onConfirm) confirmDialog.onConfirm(); setConfirmDialog({ isOpen: false, message: '', onConfirm: null }); };
  const closeConfirm = () => setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
  
  const handleMainScroll = (e) => setShowScrollTop(e.target.scrollTop > 50);
  const scrollToTop = () => document.getElementById('main-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });

  const uniqueGroups = ['전체', ...Array.from(new Set(students.map(s => s.group)))];

  const visibleStudents = (userRole === '교사' && currentUser?.group && currentUser.group !== '전체' && currentUser.group !== '총괄')
    ? students.filter(s => s.group === currentUser.group)
    : students;
    
  const visibleGroups = (userRole === '교사' && currentUser?.group && currentUser.group !== '전체' && currentUser.group !== '총괄')
    ? ['전체', currentUser.group]
    : uniqueGroups;

  const todayObj = new Date();
  const currentMonthStr = String(todayObj.getMonth() + 1).padStart(2, '0');
  
  const targetStudents = userRole === '교사' ? visibleStudents : students;

  // ⭐ [수정된 부분] substring 대신 split을 사용하여 YYYY-MM-DD 형식과 YYYY-M-D 형식을 모두 안전하게 처리합니다.
  // ⭐ [수정] 어떤 기호(-, ., /)가 들어가도 안전하게 월(Month)을 추출하도록 정규식 적용
  const monthBirthdays = targetStudents.filter(s => {
    if (!s.birth) return false;
    
    // 숫자 이외의 모든 특수기호를 기준으로 분리
    const parts = s.birth.split(/[^0-9]/).filter(Boolean);
    let m = '';
    
    if (parts.length >= 2) {
      // 첫 부분이 연도(4자리)면 두 번째가 월, 연도가 없으면 첫 번째가 월
      m = parts[0].length === 4 ? parts[1] : parts[0];
    } else if (parts.length === 1 && parts[0].length >= 6) {
      // 기호 없이 20120607 처럼 숫자로만 붙여 쓴 경우
      m = parts[0].substring(4, 6);
    }
    
    // 06과 6을 동일하게 취급하여 비교
    return parseInt(m, 10) === parseInt(currentMonthStr, 10);
  });
  
  const eventStudents = targetStudents.filter(s => s.specialEvent && s.specialEvent.trim() !== '');

  useEffect(() => {
    if (isAuthenticated && visibleStudents.length > 0 && currentTab === 'dashboard') {
      const today = new Date();
      if (today.getDay() === 6) {
        if (!sessionStorage.getItem('prayerPopupShown')) {
          const studentsWithPrayer = visibleStudents.filter(s => s.prayer && s.prayer.trim() !== '');
          if (studentsWithPrayer.length > 0) {
            const randomStudent = studentsWithPrayer[Math.floor(Math.random() * studentsWithPrayer.length)];
            setPrayerPopup({ isOpen: true, student: randomStudent });
            sessionStorage.setItem('prayerPopupShown', 'true');
          }
        }
      }
    }
  }, [isAuthenticated, visibleStudents.length, currentTab]);

  useEffect(() => {
    if (isAuthenticated && currentUser?.churchId) {
      fetchAppData(currentUser.churchId);
    }
  }, [isAuthenticated, currentUser?.churchId]); 

  const fetchAttendanceByDate = async (dateStr) => {
    const { data: attData } = await supabase.from('attendance').select('*').eq('attendance_date', dateStr);
    const attObj = {};
    if (attData) {
      attData.forEach(a => { attObj[a.student_id] = a.status });
    }
    setAttendance(attObj);
  };

  const fetchAppData = async (churchId) => {
    const [
      { data: studentsData }, { data: teachersData }, { data: postsData }, 
      { data: dutiesData }, { data: logsData }
    ] = await Promise.all([
      supabase.from('students').select('*').eq('church_id', churchId).order('id', { ascending: true }),
      supabase.from('teachers').select('*').eq('church_id', churchId),
      supabase.from('posts').select('*').eq('church_id', churchId),
      supabase.from('duties').select('*').eq('church_id', churchId).order('duty_date', { ascending: true }), // ⭐ 일정도 날짜순으로 정렬되게 추가
      supabase.from('visitation_logs').select('*')
    ]);

    if (studentsData) setStudents(studentsData.map(s => ({ ...s, group: s.class_name, parentsName: s.parents_name, parentsPhone: s.parents_phone, consecutiveAbsences: s.consecutive_absences, prayer: s.prayer_requests, prayedCount: s.prayed_count || 0, specialEvent: s.special_event || '' })));
    if (postsData) setPosts(postsData.map(p => ({ ...p, type: p.post_type, hasFile: p.has_file, date: p.post_date })));
    if (dutiesData) setDuties(dutiesData.map(d => ({ ...d, month: d.duty_month, date: d.duty_date })));
    if (logsData) setLogs(logsData.map(l => ({ ...l, studentId: l.student_id, date: l.visit_date, teacher: l.teacher_name })));

    if (teachersData) {
      const mappedTeachers = teachersData.filter(t => t.role !== '가입대기').map(t => ({ ...t, group: t.class_name }));
      setTeachers(mappedTeachers);

      const mappedPending = teachersData.filter(t => t.role === '가입대기').map(t => ({ ...t, group: '미정', date: new Date(t.created_at).toLocaleDateString() }));
      setPendingTeachers(mappedPending);

      if (currentUser?.id) {
        const updatedMe = mappedTeachers.find(t => t.id === currentUser.id);
        if (updatedMe) {
          setCurrentUser(prev => ({ ...prev, name: updatedMe.name, email: updatedMe.email, phone: updatedMe.phone, birth: updatedMe.birth, group: updatedMe.group, originalRole: updatedMe.role }));
          if (updatedMe.role === '교사' && userRole !== '교사') {
            setUserRole('교사');
            if (currentTab === 'admin') setCurrentTab('dashboard');
          }
        }
      }
    }

    await fetchAttendanceByDate(selectedAttDate);

    const today = new Date();
    const dayOfWeek = today.getDay(); 
    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - dayOfWeek);
    
    const lastSundayStr = getLocalYYYYMMDD(lastSunday);

    const { data: sundayAttData } = await supabase.from('attendance').select('*').eq('attendance_date', lastSundayStr);
    if (sundayAttData) {
      const sundayAttObj = {};
      sundayAttData.forEach(a => { sundayAttObj[a.student_id] = a.status });
      setSundayAttendance(sundayAttObj);
    } else {
      setSundayAttendance({});
    }
    setSundayDate(lastSundayStr);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const loginInput = loginForm.email?.trim() || ''; 
      if (!loginInput) {
        showToast("이메일 또는 이름을 입력해주세요.", "error");
        return;
      }

      if (loginInput === 'admin' || loginInput === '관리자') {
         const { data: firstTeacher, error: adminErr } = await supabase.from('teachers').select('*').order('id', { ascending: true }).limit(1).maybeSingle();
         if(adminErr) throw adminErr;
         if(firstTeacher) {
           const { data: church } = await supabase.from('churches').select('*').eq('id', firstTeacher.church_id).single();
           setUserRole(firstTeacher.role === '교사' ? '교사' : '담당목사');
           setCurrentUser({ id: firstTeacher.id, name: firstTeacher.name, email: firstTeacher.email, phone: firstTeacher.phone, birth: firstTeacher.birth, group: firstTeacher.class_name, churchId: church.id, churchName: church.name, deptName: church.dept, address: church.address, pastorName: church.pastor_name, logo: church.logo, originalRole: firstTeacher.role });
           setIsAuthenticated(true);
           showToast(`[마스터키] ${firstTeacher.name} 관리자 계정으로 접속했습니다.`, "info");
           return;
         }
      }

      let myTeacher = null;
      let dbError = null;

      if (loginInput.includes('@')) {
         const { data, error } = await supabase.from('teachers').select('*').eq('email', loginInput).limit(1).maybeSingle();
         myTeacher = data;
         dbError = error;
      } else {
         const { data, error } = await supabase.from('teachers').select('*').eq('name', loginInput).limit(1).maybeSingle();
         myTeacher = data;
         dbError = error;
      }

      if (dbError) {
         showToast("서버와 통신하는 중 문제가 발생했습니다.", "error");
         return;
      }

      if (!myTeacher) {
         showToast(`'${loginInput}' 계정을 찾을 수 없습니다. (이름으로 다시 시도해보세요)`, "error");
         return;
      }

      if (myTeacher.password && loginForm.password && myTeacher.password !== loginForm.password) {
         showToast("비밀번호가 일치하지 않습니다.", "error");
         return;
      }

      if (myTeacher.role === '가입대기') {
         showToast("관리자의 가입 승인을 대기 중입니다. 승인 후 이용 가능합니다.", "error");
         return;
      }

      const { data: church, error: churchErr } = await supabase.from('churches').select('*').eq('id', myTeacher.church_id).single();
      if (churchErr || !church) {
         showToast("소속된 교회 정보를 찾을 수 없습니다.", "error");
         return;
      }

      const actualRole = myTeacher.role === '교사' ? '교사' : '담당목사';
      setUserRole(actualRole);
      setCurrentUser({ id: myTeacher.id, name: myTeacher.name, email: myTeacher.email, phone: myTeacher.phone, birth: myTeacher.birth, group: myTeacher.class_name, churchId: church.id, churchName: church.name, deptName: church.dept, address: church.address, pastorName: church.pastor_name, logo: church.logo, originalRole: myTeacher.role });
      setIsAuthenticated(true);
      showToast(`환영합니다, ${myTeacher.name} 선생님!`);

    } catch (err) {
      showToast("오류가 발생했습니다: " + (err.message || "알 수 없는 에러"), "error");
    }
  };

  const handleSignup = (e) => { 
    e.preventDefault(); 
    setCurrentUser({ 
      name: signupForm.name, 
      email: signupForm.email, 
      password: signupForm.password,
      phone: signupForm.phone, 
      birth: signupForm.birth 
    }); 
    setAuthMode('select_church'); 
  };

  const handleCreateChurch = async (e) => {
    e.preventDefault();
    const { data: churchData, error: churchError } = await supabase.from('churches')
      .insert([{ 
        name: createChurchForm.churchName, 
        dept: createChurchForm.deptName, 
        address: createChurchForm.address,
        pastor_name: createChurchForm.pastorName
      }])
      .select().single();
    if (churchError) { showToast("교회 생성에 실패했습니다.", "error"); return; }
    
    const { data: teacherData } = await supabase.from('teachers').insert([{ 
      church_id: churchData.id, 
      name: currentUser.name, 
      email: currentUser.email,
      password: currentUser.password,
      phone: currentUser.phone, 
      birth: currentUser.birth, 
      role: '담당목사', 
      class_name: '전체' 
    }]).select().single();

    setUserRole('담당목사');
    setCurrentUser({ ...currentUser, id: teacherData.id, group: '전체', churchId: churchData.id, churchName: churchData.name, deptName: churchData.dept, address: churchData.address, pastorName: churchData.pastor_name, originalRole: '담당목사' });
    setIsAuthenticated(true);
  };

  const handleJoinChurch = async (e) => { 
    e.preventDefault(); 
    try {
      const { error } = await supabase.from('teachers').insert([{ 
        church_id: selectedChurchToJoin.id, 
        name: currentUser.name, 
        email: currentUser.email || null,
        password: currentUser.password || null,
        phone: currentUser.phone, 
        birth: currentUser.birth, 
        role: '가입대기', 
        class_name: '미정' 
      }]);

      if (error) { 
        alert(`가입 실패!\n원인: ${error.message}\n이미 가입된 이메일이거나 시스템 오류일 수 있습니다.`);
        showToast("가입 신청 중 오류가 발생했습니다.", "error"); 
        return; 
      }
      setAuthMode('pending'); 
    } catch (err) {
      alert("네트워크 또는 알 수 없는 오류가 발생했습니다.");
    }
  };
  
  const handleLogout = () => {
    handleConfirm("로그아웃 하시겠습니까?", () => { setIsAuthenticated(false); setCurrentUser(null); setUserRole(''); setAuthMode('login'); setCurrentTab('dashboard'); setLoginForm({ email: '', password: '' }); setStudents([]); setTeachers([]); setPosts([]); setDuties([]); setLogs([]); setAttendance({}); setSundayAttendance({}); });
  };

  const handleAttendance = async (id, status) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
    
    if (sundayDate === selectedAttDate) setSundayAttendance(prev => ({ ...prev, [id]: status }));

    const { data: existing } = await supabase.from('attendance').select('id').eq('student_id', id).eq('attendance_date', selectedAttDate).single();
    if (existing) await supabase.from('attendance').update({ status }).eq('id', existing.id);
    else await supabase.from('attendance').insert([{ student_id: id, attendance_date: selectedAttDate, status }]);
  };

  const handleAllPresent = async (filteredStudents) => {
    const newAttendance = { ...attendance };
    const newSundayAtt = { ...sundayAttendance };
    const inserts = [];
    filteredStudents.forEach(student => {
       if (newAttendance[student.id] === '미입력' || !newAttendance[student.id]) {
           newAttendance[student.id] = '출석';
           if (sundayDate === selectedAttDate) newSundayAtt[student.id] = '출석';
           inserts.push({ student_id: student.id, attendance_date: selectedAttDate, status: '출석' });
       }
    });
    setAttendance(newAttendance);
    if (sundayDate === selectedAttDate) setSundayAttendance(newSundayAtt);

    if (inserts.length > 0) await supabase.from('attendance').insert(inserts);
    showToast(`해당 날짜(${selectedAttDate})에 일괄 '출석' 처리되었습니다.`);
  };

  const saveStudentInfo = async () => {
    const studentData = { 
        church_id: currentUser.churchId, 
        name: editStudentModal.student.name, 
        birth: editStudentModal.student.birth, 
        class_name: editStudentModal.student.group, 
        grade: editStudentModal.student.grade, 
        school: editStudentModal.student.school, 
        phone: editStudentModal.student.phone, 
        parents_name: editStudentModal.student.parentsName, 
        parents_phone: editStudentModal.student.parentsPhone, 
        prayer_requests: editStudentModal.student.prayer,
        gender: editStudentModal.student.gender,
        special_event: editStudentModal.student.specialEvent 
    };
    
    if (editStudentModal.isNew) {
      const { data, error } = await supabase.from('students').insert([studentData]).select().single();
      if (!error && data) { setStudents([...students, { ...data, group: data.class_name, parentsName: data.parents_name, parentsPhone: data.parents_phone, consecutiveAbsences: data.consecutive_absences, prayer: data.prayer_requests, prayedCount: 0, specialEvent: data.special_event || '' }]); showToast('신규 학생이 등록되었습니다.'); }
    } else {
      const { data, error = null } = await supabase.from('students').update(studentData).eq('id', editStudentModal.student.id).select().single();
      if (!error && data) { setStudents(students.map(s => s.id === data.id ? { ...data, group: data.class_name, parentsName: data.parents_name, parentsPhone: data.parents_phone, consecutiveAbsences: data.consecutive_absences, prayer: data.prayer_requests, specialEvent: data.special_event || '' } : s)); showToast('학생 정보가 업데이트되었습니다.'); }
    }
    closeEditStudent();
  };

  const saveQuickLog = async () => {
    if (quickLogForm.text.trim() === '') return;
    
    if (quickLogModal.existingLog) {
      const { data, error } = await supabase.from('visitation_logs')
        .update({ visit_date: quickLogForm.date, method: quickLogForm.method, content: quickLogForm.text })
        .eq('id', quickLogModal.existingLog.id)
        .select().single();
        
      if (!error && data) { 
        setLogs(logs.map(l => l.id === data.id ? { ...data, studentId: data.student_id, date: data.visit_date, teacher: data.teacher_name } : l)); 
        showToast('심방 기록이 수정되었습니다.'); 
      } else {
        showToast('심방 기록 수정에 실패했습니다.', 'error');
      }
    } else {
      const logData = { student_id: quickLogModal.student.id, visit_date: quickLogForm.date, method: quickLogForm.method, content: quickLogForm.text, teacher_name: currentUser?.name || '시스템' };
      const { data, error } = await supabase.from('visitation_logs').insert([logData]).select().single();
      
      if (!error && data) { 
        setLogs([{ ...data, studentId: data.student_id, date: data.visit_date, teacher: data.teacher_name }, ...logs]); 
        showToast('새 심방 기록이 추가되었습니다.'); 
      }
    }
    closeQuickLog();
  };

  const saveEditDuty = async () => {
    const { data, error } = await supabase.from('duties').update({ leader: editDutyModal.duty.leader, prayer: editDutyModal.duty.prayer }).eq('id', editDutyModal.duty.id).select().single();
    if (!error && data) { setDuties(duties.map(d => d.id === data.id ? { ...data, month: data.duty_month, date: d.duty_date } : d)); showToast('예배 순서가 업데이트되었습니다.'); }
    closeEditDuty();
  };

  const openMyProfile = () => setMyProfileModal({ isOpen: true, name: currentUser.name || '', phone: currentUser.phone || '', birth: currentUser.birth || '', email: currentUser.email || '' });
  const closeMyProfile = () => setMyProfileModal({ isOpen: false, name: '', phone: '', birth: '', email: '' });
  
  const saveMyProfile = async () => {
    if (!myProfileModal.name.trim()) return;
    const { error } = await supabase.from('teachers').update({ name: myProfileModal.name, email: myProfileModal.email, phone: myProfileModal.phone, birth: myProfileModal.birth }).eq('id', currentUser.id);
    if (error) showToast("프로필 수정에 실패했습니다.", "error");
    else {
      showToast("내 프로필이 업데이트되었습니다.");
      setCurrentUser(prev => ({ ...prev, name: myProfileModal.name, email: myProfileModal.email, phone: myProfileModal.phone, birth: myProfileModal.birth }));
      setTeachers(teachers.map(t => t.id === currentUser.id ? { ...t, name: myProfileModal.name, email: myProfileModal.email, phone: myProfileModal.phone, birth: myProfileModal.birth } : t));
      closeMyProfile();
    }
  };

  const navigateToProfile = (student) => { setSelectedStudent(student); setCurrentTab('profile'); };
  
  const openQuickLog = (student, existingLog = null) => { 
    setQuickLogModal({ isOpen: true, student, existingLog }); 
    if (existingLog) {
      setQuickLogForm({ text: existingLog.content, method: existingLog.method || '대면', date: existingLog.date });
    } else {
      setQuickLogForm({ text: '', method: '대면', date: getLocalYYYYMMDD() }); 
    }
  };
  
  const closeQuickLog = () => setQuickLogModal({ isOpen: false, student: null, existingLog: null });
  
  const openEditStudent = (student, isNew = false) => {
    if(isNew) setEditStudentModal({ isOpen: true, isNew: true, student: { id: Date.now(), name: '', birth: '', group: userRole === '교사' ? currentUser.group : '1반', grade: '', school: '', phone: '', parentsName: '', parentsPhone: '', prayer: '', points: 0, consecutiveAbsences: 0, gender: '남', specialEvent: '' } });
    else setEditStudentModal({ isOpen: true, isNew: false, student: { ...student } });
  };
  const closeEditStudent = () => setEditStudentModal({ isOpen: false, student: null, isNew: false });

  const handleEditChange = (e) => {
    let { name, value } = e.target;
    if (name === 'birth') {
      let v = value.replace(/\D/g, ''); 
      if (v.length > 8) v = v.substring(0, 8); 
      if (v.length > 6) value = `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6)}`;
      else if (v.length > 4) value = `${v.slice(0, 4)}-${v.slice(4)}`;
      else value = v;
    } else if (name === 'phone') {
      let v = value.replace(/\D/g, ''); 
      if (v.length > 11) v = v.substring(0, 11); 
      if (v.length > 7) value = `${v.slice(0, 3)}-${v.slice(3, 7)}-${v.slice(7)}`;
      else if (v.length > 3) value = `${v.slice(0, 3)}-${v.slice(3)}`;
      else value = v;
    }
    setEditStudentModal(prev => ({ ...prev, student: { ...prev.student, [name]: value } }));
  };

  const openEditDuty = (duty) => setEditDutyModal({ isOpen: true, duty: { ...duty } });
  const closeEditDuty = () => setEditDutyModal({ isOpen: false, duty: null });

  if (!isAuthenticated) {
    return (
      <>
        {toast.isOpen && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] bg-stone-800/95 text-white px-5 py-3 rounded-full shadow-lg flex items-center animate-in slide-in-from-top-5 fade-in duration-300 min-w-50 justify-center">
            {toast.type === 'error' ? <AlertCircle size={18} className="mr-2 text-rose-400" /> : <CheckCircle2 size={18} className="mr-2 text-emerald-400" />}
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        )}
        <Auth authMode={authMode} setAuthMode={setAuthMode} loginForm={loginForm} setLoginForm={setLoginForm} signupForm={signupForm} setSignupForm={setSignupForm} createChurchForm={createChurchForm} setCreateChurchForm={setCreateChurchForm} joinSearchQuery={joinSearchQuery} setJoinSearchQuery={setJoinSearchQuery} selectedChurchToJoin={selectedChurchToJoin} setSelectedChurchToJoin={setSelectedChurchToJoin} handleLogin={handleLogin} handleSignup={handleSignup} handleCreateChurch={handleCreateChurch} handleJoinChurch={handleJoinChurch} currentUser={currentUser} setCurrentUser={setCurrentUser} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 font-sans flex justify-center">
      <div className="w-full max-w-md bg-stone-50 min-h-screen relative shadow-2xl flex flex-col overflow-hidden">
        
        <header className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 sticky top-0 z-10 shadow-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {currentUser?.logo ? <img src={currentUser.logo} alt="logo" className="w-9 h-9 rounded-full bg-white object-cover border-2 border-emerald-200" /> : <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/40"><Church size={16} className="text-white drop-shadow-sm" /></div>}
              <div>
                <p className="text-[10px] text-emerald-50 font-bold leading-tight flex items-center drop-shadow-sm">{currentUser?.churchName} {currentUser?.address && <span className="ml-1 opacity-80 font-normal truncate max-w-30">({currentUser.address})</span>}</p>
                <h1 className="text-lg font-extrabold tracking-tight leading-tight drop-shadow-sm">{currentUser?.deptName} <span className="text-sm font-normal text-emerald-100 ml-1">({currentUser?.name})</span></h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {currentUser?.email === 'superadmin@admin.com' && (
                <button 
                  onClick={() => setCurrentTab('superadmin')} 
                  className="text-[10px] bg-rose-500 text-white px-2 py-1.5 rounded-full font-bold shadow-sm"
                >
                  총괄 관리
                </button>
              )}
              {(currentUser?.originalRole !== '교사' || currentUser?.name?.includes('차창현')) && (
                <button onClick={() => { const nextRole = userRole === '교사' ? (currentUser.originalRole === '교사' ? '담당목사' : currentUser.originalRole) : '교사'; setUserRole(nextRole); if (nextRole === '교사' && currentTab === 'admin') setCurrentTab('dashboard'); }} className="text-[10px] bg-white/20 px-2 py-1.5 rounded-full font-bold transition-colors hover:bg-white/30 drop-shadow-sm">{userRole === '교사' ? '교사 모드' : '관리자 모드'}</button>
              )}
              <button onClick={openMyProfile} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors" title="내 프로필"><UserCircle size={14} className="text-white" /></button>
              <button onClick={handleLogout} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors" title="로그아웃"><LogOut size={14} className="text-white" /></button>
            </div>
          </div>
        </header>

        <div id="main-scroll-area" onScroll={handleMainScroll} className="flex-1 overflow-y-auto pb-20 scroll-smooth">
          
          {/* ⭐ 대시보드 진입 시 상단에 노출되는 생일 및 학교 특별일정 알림 카드 */}
          {currentTab === 'dashboard' && (monthBirthdays.length > 0 || eventStudents.length > 0) && (
            <div className="p-4 pb-0 space-y-2">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-start shadow-sm animate-in fade-in zoom-in duration-300">
                 <span className="text-lg mr-2.5 mt-0.5 shrink-0">🎂</span>
                 <div className="flex-1">
                    {/* ⭐ 명칭 변경: '교회 학교 전체' -> '전체' */}
                    <h4 className="text-xs font-bold text-purple-700 mb-1">{userRole === '교사' ? '우리 반' : '전체'} 삶의 자리 알림</h4>
                    <div className="space-y-1.5 text-[11px] text-purple-600 leading-tight">
                      {monthBirthdays.length > 0 && (
                        <p>🎉 <span className="font-bold">이번 달({currentMonthStr}월) 생일:</span> {monthBirthdays.map(s => `${s.name}(${s.group})`).join(', ')}</p>
                      )}
                      {eventStudents.length > 0 && (
                        <div className="space-y-0.5 mt-1">
                          <span className="font-bold">📝 주요 일정 및 시험:</span>
                          {eventStudents.map(s => (
                            <p key={s.id} className="ml-2 mt-0.5">• {s.name}({s.group}): <span className="font-bold text-purple-800">{s.specialEvent}</span></p>
                          ))}
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            </div>
          )}

          {currentTab === 'dashboard' && <Dashboard userRole={userRole} currentUser={currentUser} students={visibleStudents} allStudents={students} attendance={attendance} sundayAttendance={sundayAttendance} sundayDate={sundayDate} teachers={teachers} duties={duties} posts={posts} setCurrentTab={setCurrentTab} setCommunityTab={setCommunityTab} showToast={showToast} openQuickLog={openQuickLog} navigateToProfile={navigateToProfile} logs={logs} setPostModal={setPostModal} />}
          {currentTab === 'attendance' && <Attendance userRole={userRole} currentUser={currentUser} students={visibleStudents} attendance={attendance} teachers={teachers} uniqueGroups={visibleGroups} handleAttendance={handleAttendance} handleAllPresent={handleAllPresent} showToast={showToast} selectedAttDate={selectedAttDate} setSelectedAttDate={setSelectedAttDate} fetchAttendanceByDate={fetchAttendanceByDate} />}
          {currentTab === 'students' && <StudentList userRole={userRole} currentUser={currentUser} students={visibleStudents} studentSearch={studentSearch} setStudentSearch={setStudentSearch} openEditStudent={openEditStudent} navigateToProfile={navigateToProfile} logs={logs} />}
          {currentTab === 'community' && <Community userRole={userRole} currentUser={currentUser} posts={posts} setPosts={setPosts} duties={duties} setDuties={setDuties} communityTab={communityTab} setCommunityTab={setCommunityTab} showToast={showToast} setPostModal={setPostModal} students={visibleStudents} setStudents={setStudents} />}
          {currentTab === 'profile' && <Profile selectedStudent={selectedStudent} logs={logs} setLogs={setLogs} setCurrentTab={setCurrentTab} openEditStudent={openEditStudent} showToast={showToast} openQuickLog={openQuickLog} />}
          {currentTab === 'admin' && <AdminCenter currentUser={currentUser} setCurrentUser={setCurrentUser} students={students} setStudents={setStudents} teachers={teachers} setTeachers={setTeachers} pendingTeachers={pendingTeachers} setPendingTeachers={setPendingTeachers} uniqueGroups={uniqueGroups} showToast={showToast} />}
          {currentTab === 'superadmin' && <SuperAdminCenter currentUser={currentUser} setCurrentUser={setCurrentUser} showToast={showToast} setCurrentTab={setCurrentTab} />}
        </div>

        {myProfileModal.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-4 border-b border-stone-100 bg-white"><h3 className="font-bold text-stone-800 flex items-center text-sm"><UserCircle size={18} className="mr-2 text-emerald-500" /> 내 프로필 설정</h3><button onClick={closeMyProfile} className="text-stone-400 hover:text-stone-600 bg-stone-100 rounded-full p-1 transition-colors"><X size={16} /></button></div>
              <div className="p-5 space-y-4">
                <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 mb-4 flex justify-between items-center"><div><p className="text-xs font-bold text-stone-500 mb-1">현재 내 권한 및 소속</p><p className="text-sm font-bold text-stone-800">{currentUser.originalRole} <span className="text-stone-400 font-normal">|</span> {currentUser.group}</p></div><div className="text-[10px] text-stone-400 text-right leading-tight">*직분과 반 변경은<br/>관리자만 가능합니다.</div></div>
                <div><label className="block text-xs font-bold text-stone-600 mb-1">내 이름</label><input type="text" value={myProfileModal.name} onChange={(e) => setMyProfileModal({...myProfileModal, name: e.target.value})} className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-sm" /></div>
                <div><label className="block text-xs font-bold text-stone-600 mb-1">이메일 (로그인 시 사용)</label><input type="email" value={myProfileModal.email || ''} onChange={(e) => setMyProfileModal({...myProfileModal, email: e.target.value})} placeholder="예: user@church.com" className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-sm focus:ring-emerald-500" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-bold text-stone-600 mb-1">연락처</label><input type="text" value={myProfileModal.phone} onChange={(e) => setMyProfileModal({...myProfileModal, phone: e.target.value})} className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-sm" /></div>
                  <div><label className="block text-xs font-bold text-stone-600 mb-1">생년월일</label><input type="text" value={myProfileModal.birth || ''} onChange={(e) => setMyProfileModal({...myProfileModal, birth: e.target.value})} placeholder="YYYY-MM-DD" className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-sm" /></div>
                </div>
              </div>
              <div className="p-4 border-t border-stone-100 bg-[#FFFCF9] flex justify-end space-x-2"><button onClick={closeMyProfile} className="px-4 py-2 bg-white border border-stone-200 text-stone-600 text-xs font-bold rounded-lg hover:bg-stone-50 transition-colors">취소</button><button onClick={saveMyProfile} className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-600 transition-colors">저장</button></div>
            </div>
          </div>
        )}

        {quickLogModal.isOpen && quickLogModal.student && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-4 border-b border-stone-100">
                <h3 className="font-bold text-stone-800 flex items-center">
                  <FileText size={18} className="mr-2 text-emerald-500" />
                  {quickLogModal.student.name} <span className="text-sm text-stone-400 font-normal ml-1">심방 기록 {quickLogModal.existingLog ? '수정' : ''}</span>
                </h3>
                <button onClick={closeQuickLog} className="text-stone-400"><X size={18} /></button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-stone-500 mb-1">심방 일자</label>
                    <input type="date" value={quickLogForm.date} onChange={(e) => setQuickLogForm({...quickLogForm, date: e.target.value})} className="w-full font-bold text-stone-700 text-xs p-2 bg-stone-50 rounded-lg border border-stone-200" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-stone-500 mb-1">심방 방법</label>
                    <select value={quickLogForm.method} onChange={(e) => setQuickLogForm({...quickLogForm, method: e.target.value})} className="w-full font-bold text-stone-700 text-xs p-2 bg-stone-50 rounded-lg border border-stone-200">
                      <option value="대면">대면</option>
                      <option value="전화">전화</option>
                      <option value="카톡/문자">카톡/문자</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-500 mb-1">심방 내용</label>
                  <textarea value={quickLogForm.text} onChange={(e) => setQuickLogForm({...quickLogForm, text: e.target.value})} className="w-full text-sm p-3 bg-stone-50 rounded-xl border border-stone-200 h-24 resize-none" autoFocus />
                </div>
                <div className="flex space-x-2 pt-2">
                  <button onClick={closeQuickLog} className="flex-1 py-2.5 bg-stone-100 text-stone-600 text-sm font-bold rounded-xl">취소</button>
                  <button onClick={saveQuickLog} className="flex-1 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl">
                    {quickLogModal.existingLog ? '수정하기' : '저장하기'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {postModal.isOpen && postModal.post && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-4 border-b border-stone-100 bg-white">
                <span className={`text-[10px] font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-600`}>{postModal.post.category || postModal.post.type === 'notice' ? '공지사항' : '자료실'}</span>
                <button onClick={() => setPostModal({ isOpen: false, post: null })} className="text-stone-400 bg-stone-100 rounded-full p-1"><X size={18} /></button>
              </div>
              <div className="p-5 overflow-y-auto max-h-[70vh]">
                <h3 className="font-bold text-stone-800 text-lg mb-2">{postModal.post.title}</h3>
                <div className="flex justify-between text-xs text-stone-400 mb-6 pb-4 border-b border-stone-100">
                  <span>작성자: {postModal.post.author}</span><span>{postModal.post.date}</span>
                </div>
                <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{postModal.post.content}</p>
                
                {postModal.post.image_url && (
                  <div className="mt-5">
                    <img src={postModal.post.image_url} alt="첨부 파일" className="w-full rounded-xl border border-stone-100 object-contain max-h-60" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {editStudentModal.isOpen && editStudentModal.student && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center p-4 border-b border-stone-100 bg-white shrink-0">
                <h3 className="font-bold text-stone-800 flex items-center text-lg">
                  <UserCircle size={22} className="mr-2 text-emerald-500" />
                  학생 상세 정보
                </h3>
                <button onClick={closeEditStudent} className="text-stone-400 bg-stone-100 rounded-full p-1 hover:bg-stone-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 flex space-x-3">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-stone-600 mb-1 block">이름</label>
                      <input type="text" name="name" value={editStudentModal.student.name} onChange={handleEditChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-400 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">생년월일 (YYYY-MM-DD)</label>
                    <input type="text" name="birth" value={editStudentModal.student.birth} onChange={handleEditChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-400 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">소속 반</label>
                    <select name="group" value={editStudentModal.student.group} onChange={handleEditChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-400 transition-colors">
                      {visibleGroups.filter(g => g !== '전체').map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">학년</label>
                    <input type="text" name="grade" value={editStudentModal.student.grade} onChange={handleEditChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-400 transition-colors" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-stone-600 mb-1 block">학교</label>
                    <input type="text" name="school" value={editStudentModal.student.school || ''} onChange={handleEditChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-400 transition-colors" />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-stone-600 mb-1 block">기념일 및 주요 일정 (예: 6/15~18 기말고사, 학교 축제 등)</label>
                    <input type="text" name="specialEvent" value={editStudentModal.student.specialEvent || ''} onChange={handleEditChange} placeholder="아이들의 소중한 세상 속 일정을 입력해 주세요." className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-400 transition-colors" />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-stone-600 mb-1 block">학생 연락처</label>
                    <div className="flex items-center space-x-2">
                      <input type="text" name="phone" value={editStudentModal.student.phone} onChange={handleEditChange} className="flex-1 bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-400 transition-colors" />
                      <a href={`tel:${editStudentModal.student.phone}`} className="p-2.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors shadow-sm"><Phone size={18} /></a>
                      <a href={`sms:${editStudentModal.student.phone}`} className="p-2.5 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors shadow-sm"><MessageCircle size={18} /></a>
                    </div>
                  </div>

                  <div className="col-span-2 mt-2">
                    <label className="text-xs font-bold text-emerald-700 mb-1 flex items-center bg-emerald-50 py-1.5 px-2 rounded-t-lg border border-emerald-100 border-b-0">
                      <FileText size={14} className="mr-1.5" /> 특이사항 및 기도제목
                    </label>
                    <textarea 
                      name="prayer" 
                      value={editStudentModal.student.prayer || ''} 
                      onChange={handleEditChange} 
                      placeholder="건강 상태, 알레르기, 관심사 또는 기도제목 등을 자유롭게 기록해주세요."
                      className="w-full bg-[#FFFCF9] border border-emerald-100 rounded-b-lg rounded-tr-lg p-3 text-sm h-32 resize-none outline-none focus:border-emerald-400 transition-colors text-stone-700" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-stone-100 bg-stone-50 flex space-x-2 shrink-0 rounded-b-2xl">
                <button onClick={saveStudentInfo} className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 transition-colors text-white text-sm font-bold rounded-xl shadow-sm">
                  저장하기
                </button>
              </div>
            </div>
          </div>
        )}
        
        {editDutyModal.isOpen && editDutyModal.duty && (<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"><div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"><div className="flex justify-between items-center p-4 border-b border-stone-100 bg-white"><h3 className="font-bold text-stone-800 flex items-center text-sm"><Calendar size={18} className="mr-2 text-emerald-500" /> {editDutyModal.duty.date} 순서 변경</h3><button onClick={closeEditDuty} className="text-stone-400"><X size={16} /></button></div><div className="p-5 space-y-4"><div><label className="text-[11px] font-bold text-stone-500 mb-1">기도회 인도</label><select value={editDutyModal.duty.leader} onChange={(e) => setEditDutyModal(p => ({ isOpen: true, duty: { ...p.duty, leader: e.target.value } }))} className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2.5 px-3 text-sm">{teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select></div></div><div className="p-4 border-t border-stone-100 bg-[#FFFCF9] flex justify-end space-x-2"><button onClick={closeEditDuty} className="px-4 py-2 bg-white border border-stone-200 text-stone-600 text-xs font-bold rounded-lg">취소</button><button onClick={saveEditDuty} className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg">저장</button></div></div></div>)}

        {confirmDialog.isOpen && (<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-xs text-center animate-in zoom-in-95 duration-200"><AlertCircle size={40} className="mx-auto text-emerald-500 mb-4" /><p className="text-stone-800 font-bold mb-6">{confirmDialog.message}</p><div className="flex space-x-3"><button onClick={closeConfirm} className="flex-1 bg-stone-100 py-3 rounded-xl font-bold">취소</button><button onClick={executeConfirm} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold">확인</button></div></div></div>)}
        {toast.isOpen && (<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] bg-stone-800/95 text-white px-5 py-3 rounded-full shadow-lg flex items-center animate-in slide-in-from-top-5 fade-in duration-300 min-w-50 justify-center">{toast.type === 'error' ? <AlertCircle size={18} className="mr-2 text-rose-400" /> : <CheckCircle2 size={18} className="mr-2 text-emerald-400" />}<span className="text-sm font-bold">{toast.message}</span></div>)}

        {/* 주말(토요일) 기도 팝업 모달 영역 */}
        {prayerPopup.isOpen && prayerPopup.student && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🙏</span>
              </div>
              <h3 className="font-bold text-stone-800 text-lg mb-2">오늘의 중보기도</h3>
              <p className="text-sm text-stone-600 mb-4">
                오늘은 우리 반 <span className="font-bold text-emerald-600">{prayerPopup.student.name}</span> 학생을 위해<br/>마음을 모아주세요.
              </p>
              <div className="bg-[#FFFCF9] p-4 rounded-xl border border-emerald-100 text-left mb-6 shadow-inner">
                <p className="text-xs font-bold text-emerald-700 mb-1 flex items-center"><FileText size={12} className="mr-1"/> 기도제목</p>
                <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{prayerPopup.student.prayer}</p>
              </div>
              <button 
                onClick={() => setPrayerPopup({ isOpen: false, student: null })} 
                className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-sm hover:bg-emerald-600 transition-colors"
              >
                기도했습니다
              </button>
            </div>
          </div>
        )}

        {showScrollTop && (
          <button 
            onClick={scrollToTop} 
            className="fixed bottom-21.25 right-5 z-[9999] bg-emerald-500 text-white w-12 h-12 rounded-full shadow-2xl border-2 border-white flex items-center justify-center animate-in zoom-in-90 fade-in duration-200 hover:bg-emerald-600 transition-colors"
            title="맨 위로"
          >
            <span className="text-xl">🚀</span>
          </button>
        )}

        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} userRole={userRole} />
      </div>
    </div>
  );
}