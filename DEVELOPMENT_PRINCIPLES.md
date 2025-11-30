# 📋 MindFlow 앱 개발 핵심 원칙

> **모든 코드 작성 및 수정 전 반드시 확인할 것**

---

## 1. 💰 비용 절감 최우선

### Firestore 무료 할당량
- **읽기**: 50,000 / day
- **쓰기**: 20,000 / day
- **삭제**: 20,000 / day

### 필수 준수 사항
- ❌ **실시간 리스너(onSnapshot) 사용 금지**
  - 이유: 개발 중 Hot Reload마다 전체 컬렉션 재읽기 → quota 폭발
  - 대안: 수동 동기화 방식 (`syncFromFirestore()` 함수)

- ✅ **Debounce 적극 활용**
  - 사용자 입력 → 300ms 디바운스 후 Firestore 저장
  - 연속 수정 → 1번의 쓰기로 통합

- ✅ **조건부 로드**
  - 변경사항 없으면 Firestore 접근 안함
  - localStorage 우선 로드 → Firestore는 최소한만

- ✅ **캐싱 전략**
  - localStorage에 전체 데이터 캐싱
  - 앱 시작 시 localStorage 먼저 표시 (즉시 로딩)

### 비용 모니터링
```javascript
// 개발 중 예상 비용
앱 시작: 5 reads
하루 개발 (100번 리로드): 500 reads (무료 할당량의 1%)

// 운영 중 예상 비용 (사용자 1명)
앱 시작: 5 reads
하루 사용: 5-15 reads (무료 할당량의 0.03%)

// 확장성
무료 티어로 약 3,000명까지 지원 가능
```

---

## 2. 🛡️ 데이터 유실 방지 절대 우선

### 다층 백업 전략

#### Layer 1: React State (즉시 UI 반영)
```javascript
사용자 입력 → setState() → 화면 즉시 업데이트
```

#### Layer 2: localStorage (로컬 백업)
```javascript
state 변경 → 즉시 localStorage 저장 (동기)
브라우저 종료 → beforeunload 이벤트로 긴급 백업
```

#### Layer 3: Firestore (클라우드 백업)
```javascript
state 변경 → 300ms 디바운스 → Firestore 저장
```

### 데이터 손실 시나리오 대응

| 시나리오 | 대응 방안 | 데이터 손실 |
|----------|----------|------------|
| 브라우저 크래시 | localStorage 자동 저장 | 0% |
| 네트워크 끊김 | localStorage 작업 계속 | 0% |
| 여러 기기 동시 수정 | 타임스탬프 기반 충돌 해결 | 0% |
| 실수 삭제 | 휴지통 90일 보관 | 복구 가능 |

### 필수 구현 사항
```javascript
// ✅ state 변경 시 즉시 localStorage 저장
useEffect(() => {
  localStorage.setItem('memos_shared', JSON.stringify(memos));
}, [memos]);

// ✅ 브라우저 종료 시 긴급 백업
useEffect(() => {
  const handleBeforeUnload = () => {
    localStorage.setItem('memos_shared', JSON.stringify(memos));
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [memos]);

// ✅ Firestore 저장 (Debounce)
const debouncedSave = debounce(() => {
  saveToFirestore(memos);
}, 300);
```

---

## 3. 👤 사용자 편의성 중시

### 성능 최적화
- **낙관적 UI 업데이트**
  - 사용자 액션 → 즉시 화면 반영 (서버 응답 기다리지 않음)
  - 백그라운드에서 Firestore 저장

- **빠른 초기 로딩**
  - localStorage 우선 표시 → Firestore는 백그라운드 동기화
  - 스켈레톤 UI 대신 캐시된 데이터 즉시 표시

### 오프라인 지원
```javascript
// localStorage 우선 로드
const memos = JSON.parse(localStorage.getItem('memos_shared') || '[]');
setMemos(memos); // 즉시 화면 표시

// 백그라운드에서 Firestore 동기화
fetchFromFirestore().then(freshData => {
  if (hasChanges(freshData)) {
    setMemos(freshData);
  }
});
```

### 명확한 피드백
```javascript
// ✅ 로딩 상태
if (loading) return <LoadingSpinner />;

// ✅ 에러 상태
if (error) return <ErrorMessage error={error} />;

// ✅ 동기화 상태
<SyncIndicator lastSync={lastSyncTime} />
```

---

## 4. 📝 코드 작성 체크리스트

### 새로운 기능 추가 시
- [ ] Firestore 읽기/쓰기 최소화했는가?
- [ ] 실시간 리스너 사용하지 않았는가?
- [ ] localStorage 즉시 저장 구현했는가?
- [ ] Debounce 적용했는가? (연속 동작 시)
- [ ] 낙관적 UI 업데이트 구현했는가?
- [ ] 오프라인에서도 작동하는가?
- [ ] 에러 처리 및 사용자 피드백 있는가?

### 코드 리뷰 시
- [ ] 불필요한 Firestore 호출 없는가?
- [ ] 데이터 손실 위험 없는가?
- [ ] 사용자 경험 저해 요소 없는가?

---

## 5. 🚫 절대 금지 사항

### ❌ 실시간 리스너 (onSnapshot)
```javascript
// ❌ 절대 사용 금지
const unsubscribe = onSnapshot(collection(db, 'memos'), (snapshot) => {
  // 매번 전체 컬렉션 읽기 → quota 폭발
});
```

### ❌ 무제한 Firestore 접근
```javascript
// ❌ 탭 전환마다 로드
useEffect(() => {
  if (!document.hidden) {
    fetchAllData(); // quota 낭비
  }
}, [document.hidden]);

// ✅ 앱 시작 시 1회만
useEffect(() => {
  fetchAllData();
}, []); // 의존성 배열 비어있음
```

### ❌ localStorage 없이 state만 사용
```javascript
// ❌ 브라우저 종료 시 데이터 손실
const [memos, setMemos] = useState([]);

// ✅ localStorage 백업
useEffect(() => {
  localStorage.setItem('memos_shared', JSON.stringify(memos));
}, [memos]);
```

---

## 6. 📞 긴급 상황 대응

### Quota 초과 시
1. Firebase Console → Usage 탭 확인
2. 실시간 리스너 비활성화 확인
3. 로그에서 과도한 Firestore 호출 검색
4. 복구: 매일 자정(PST) 리셋 대기

### 데이터 손실 보고 시
1. localStorage 확인
2. Firestore 백업 확인
3. 휴지통에서 복구 시도
4. 타임스탬프 기반 충돌 해결

---

## 7. 📚 참고 자료

### Firestore 공식 문서
- [Firestore 할당량](https://firebase.google.com/docs/firestore/quotas)
- [비용 최적화 가이드](https://firebase.google.com/docs/firestore/best-practices)

### 프로젝트 핵심 파일
- `src/hooks/useFirestoreSync.js` - 동기화 로직
- `src/services/userDataService.js` - Firestore 연동
- `DEVELOPMENT_PRINCIPLES.md` - 본 문서

---

**마지막 업데이트**: 2025-11-30
**작성자**: MindFlow Development Team
