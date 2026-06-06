export const MOCK_CHURCHES = [
  { id: 'c1', name: '임마누엘교회', dept: '청소년부', admin: '김목사', address: '서울시 강남구', logo: '' },
  { id: 'c2', name: '강남교회', dept: '고등부', admin: '이부장', address: '서울시 서초구', logo: '' },
];

export const MOCK_STUDENTS = [
  { id: 1, name: '김하온', grade: '중1', group: '1반', phone: '010-1111-2222', birth: '2013-05-12', points: 150, prayer: '학교 생활 적응', school: '성남중', parentsName: '김부모', parentsPhone: '010-9999-1111', consecutiveAbsences: 0, gender: '남' },
  { id: 2, name: '박사랑', grade: '중1', group: '1반', phone: '010-3333-4444', birth: '2013-08-24', points: 120, prayer: '진로 고민', school: '분당중', parentsName: '박부모', parentsPhone: '010-9999-2222', consecutiveAbsences: 3, gender: '여' },
  { id: 3, name: '이은혜', grade: '중2', group: '1반', phone: '010-5555-6666', birth: '2012-11-05', points: 80, prayer: '건강 회복', school: '판교중', parentsName: '이부모', parentsPhone: '010-9999-3333', consecutiveAbsences: 1, gender: '여' },
  { id: 4, name: '최요한', grade: '중3', group: '2반', phone: '010-7777-8888', birth: '2011-01-15', points: 200, prayer: '고등학교 진학', school: '성남중', parentsName: '최부모', parentsPhone: '010-9999-4444', consecutiveAbsences: 0, gender: '남' },
  { id: 5, name: '정믿음', grade: '고1', group: '2반', phone: '010-9999-0000', birth: '2010-05-30', points: 50, prayer: '학업 스트레스', school: '분당고', parentsName: '정부모', parentsPhone: '010-9999-5555', consecutiveAbsences: 4, gender: '남' },
  { id: 6, name: '강소망', grade: '고2', group: '신입반', phone: '010-1234-5678', birth: '2009-06-10', points: 10, prayer: '교회 정착', school: '수내고', parentsName: '강부모', parentsPhone: '010-9999-6666', consecutiveAbsences: 0, gender: '여' },
];

export const MOCK_ATTENDANCE = {
  1: '출석', 2: '결석', 3: '미입력', 4: '출석', 5: '지각', 6: '미입력'
};

export const MOCK_LOGS = [
  { id: 1, studentId: 2, date: '2026-05-24', content: '요즘 학원 숙제 때문에 주일에 피곤해 함. 기도 격려.', teacher: '김선생', method: '대면' },
];

export const MOCK_TEACHERS = [
  { id: 1, name: '김선생', group: '1반', phone: '010-1111-2222', role: '교사', birth: '1990-06-05' },
  { id: 2, name: '이선생', group: '2반', phone: '010-2222-3333', role: '교사', birth: '1985-03-15' },
  { id: 3, name: '박신임', group: '신입반', phone: '010-4444-5555', role: '교사', birth: '1998-10-20' },
  { id: 4, name: '최부장', group: '전체', phone: '010-9999-9999', role: '부장', birth: '1975-01-01' },
];

export const MOCK_STATS_WEEKLY = [
  { label: '5월 2주', present: 45, total: 50 },
  { label: '5월 3주', present: 42, total: 50 },
  { label: '5월 4주', present: 48, total: 50 },
  { label: '5월 5주', present: 46, total: 50 },
];

export const MOCK_STATS_MONTHLY = [
  { label: '2월', present: 42, total: 50 },
  { label: '3월', present: 46, total: 50 },
  { label: '4월', present: 48, total: 50 },
  { label: '5월', present: 45, total: 50 },
];

export const MOCK_DUTIES = [
  { id: 1, month: '5월', date: '5월 1주 (05.03)', leader: '김선생', prayer: '이선생' },
  { id: 2, month: '5월', date: '5월 2주 (05.10)', leader: '이선생', prayer: '박신임' },
  { id: 3, month: '5월', date: '5월 3주 (05.17)', leader: '박신임', prayer: '김선생' },
  { id: 4, month: '6월', date: '6월 1주 (06.07)', leader: '미정', prayer: '미정' },
];

export const MOCK_POSTS = [
  { id: 1, type: 'notice', title: '여름 수련회 일정 안내', content: '올해 여름 수련회는 8월 중순에 진행됩니다. 8/14 ~ 8/16 2박 3일 일정이며, 교사 회의에서 상세 내용을 논의할 예정입니다.', date: '2026-06-01', author: '최부장' },
  { id: 2, type: 'material', category: '주보', title: '6월 1주차 주보', content: '예배 순서 및 광고 내용이 포함되어 있습니다. 다운로드 받아 확인해주세요.', date: '2026-06-05', author: '관리자', hasFile: true },
  { id: 3, type: 'material', category: '공과', title: '6월 공과 교사용 가이드', content: '이번 달 다윗과 골리앗 단원 공과 진행 가이드 파일입니다.', date: '2026-05-28', author: '최부장', hasFile: true },
];