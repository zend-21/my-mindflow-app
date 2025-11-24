# 🔥 Firestore 마이그레이션 가이드

## 개요

모든 사용자 데이터가 이제 Firestore에 저장됩니다. localStorage는 캐시/오프라인 지원용으로만 사용됩니다.

## 변경 사항

### 이전 (localStorage만 사용)
```javascript
const [memos, setMemos] = useLocalStorage('memos_shared', []);
const [folders, setFolders] = useLocalStorage('memoFolders', []);
// ...
```

### 이후 (Firestore + localStorage 캐싱)
```javascript
import { useFirestoreSync } from './hooks/useFirestoreSync';

const {
  loading,
  memos,
  folders,
  trash,
  macros,
  calendar,
  activities,
  settings,
  syncMemos,
  syncFolders,
  // ...
} = useFirestoreSync(userId, isAuthenticated);
```

## App.jsx 수정 방법

### 1. 훅 import 추가

```javascript
import { useFirestoreSync } from './hooks/useFirestoreSync';
```

### 2. 기존 useLocalStorage 제거

```javascript
// 제거할 코드
const [widgets, setWidgets] = useLocalStorage('widgets_shared', [...]);
const [memos, setMemos] = useLocalStorage('memos_shared', []);
const [recentActivities, setRecentActivities] = useLocalStorage('recentActivities_shared', []);
const [calendarSchedules, setCalendarSchedules] = useLocalStorage('calendarSchedules_shared', {});
const [displayCount, setDisplayCount] = useLocalStorage('displayCount_shared', 5);
```

### 3. useFirestoreSync 훅 사용

```javascript
const userId = localStorage.getItem('firebaseUserId');
const isAuthenticated = !!profile;

const {
  loading: dataLoading,
  memos,
  folders,
  trash,
  macros,
  calendar,
  activities,
  settings,
  syncMemos,
  syncFolders,
  syncTrash,
  syncMacros,
  syncCalendar,
  syncActivities,
  syncSettings,
  saveImmediately
} = useFirestoreSync(userId, isAuthenticated);

// settings에서 개별 값 추출
const widgets = settings.widgets;
const displayCount = settings.displayCount;
const nickname = settings.nickname;
```

### 4. 데이터 업데이트 시 sync 함수 사용

기존:
```javascript
setMemos([...memos, newMemo]);
```

변경:
```javascript
syncMemos([...memos, newMemo]);
```

### 5. 설정 업데이트

기존:
```javascript
setWidgets(newWidgets);
localStorage.setItem('userNickname', newNickname);
```

변경:
```javascript
syncSettings({
  ...settings,
  widgets: newWidgets,
  nickname: newNickname
});
```

## 자동 마이그레이션

첫 로그인 시 자동으로 localStorage → Firestore 마이그레이션이 실행됩니다:
- 기존 localStorage 데이터를 Firestore에 저장
- 이후 로그인부터는 Firestore에서 데이터 로드
- localStorage는 캐시로 계속 사용

## 주의사항

1. **userId 필수**: 로그인한 사용자만 데이터 동기화
2. **디바운스**: 1초마다 자동 저장 (너무 자주 저장 방지)
3. **즉시 저장**: 중요한 작업 후 `saveImmediately()` 호출
4. **오프라인 지원**: localStorage 캐시로 오프라인에서도 작동

## 데이터 구조

```
users/{userId}/userData/
  ├─ memos        (메모)
  ├─ folders      (폴더)
  ├─ trash        (휴지통)
  ├─ macros       (매크로)
  ├─ calendar     (캘린더)
  ├─ activities   (활동)
  └─ settings     (설정)
```

## 테스트

1. 로그인 전 localStorage에 테스트 데이터 추가
2. 로그인
3. 콘솔에서 마이그레이션 로그 확인
4. Firestore 콘솔에서 데이터 확인
5. 로그아웃 후 다시 로그인하여 데이터 유지 확인
