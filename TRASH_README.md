# 휴지통 기능 구현 완료 ✅

## 📁 생성된 파일들

1. **src/hooks/useTrash.js** - 휴지통 로직 관리 훅
2. **src/contexts/TrashContext.jsx** - 휴지통 컨텍스트 제공자
3. **src/components/TrashPage.jsx** - 휴지통 UI 컴포넌트
4. **TRASH_INTEGRATION_GUIDE.txt** - App.jsx 연동 가이드

## ✨ 구현된 기능

### 1. 기본 기능
- ✅ 삭제 시 휴지통으로 이동 (메모, 스케줄)
- ✅ 휴지통에서 복원
- ✅ 휴지통에서 영구 삭제
- ✅ 휴지통 비우기
- ✅ 다중 선택 및 일괄 작업

### 2. 자동 삭제
- ✅ 설정 가능한 자동 삭제 기간 (기본 30일)
- ✅ 앱 시작 시 자동 삭제 체크
- ✅ 1시간마다 자동 삭제 체크
- ✅ 남은 일수 표시

### 3. UI/UX
- ✅ 항목별 타입 표시 (메모, 스케줄, 시크릿, 리뷰)
- ✅ 삭제 날짜/시간 표시
- ✅ 남은 일수 시각적 표시 (7일 이하 빨간색)
- ✅ 다중 선택 모드
- ✅ 전체 선택/해제
- ✅ 토스트 메시지

### 4. 데이터 관리
- ✅ localStorage에 자동 저장
- ✅ 공유 키 사용 (_shared)
- ✅ 타입별 개수 확인 가능

## 🔧 App.jsx 통합 방법

### 필수 단계 (순서대로 진행)

#### 1. Import 추가
```javascript
import { TrashProvider } from './contexts/TrashContext';
import TrashPage from './components/TrashPage.jsx';
```

#### 2. TrashProvider로 감싸기
```javascript
function App() {
    return (
        <TrashProvider autoDeleteDays={30}>
            <GlobalStyle />
            <Screen>
                {/* 기존 내용 */}
            </Screen>
        </TrashProvider>
    );
}
```

#### 3. ContentArea에 휴지통 탭 추가
```javascript
<ContentArea>
    {/* 기존 탭들 */}
    {activeTab === 'trash' && (
        <TrashPage showToast={showToast} />
    )}
</ContentArea>
```

#### 4. SideMenu 연결
```javascript
<SideMenu
    onOpenTrash={() => {
        setIsMenuOpen(false);
        setActiveTab('trash');
    }}
/>
```

#### 5. 삭제 로직 수정

**AppContent 컴포넌트 생성 필요** (TrashProvider 내부에서만 useTrashContext 사용 가능)

```javascript
// App 함수 내부
const AppContent = () => {
    const { moveToTrash } = useTrashContext();
    
    // 메모 삭제 수정
    const handleDeleteMemo = (id) => {
        const deletedMemo = memos.find(memo => memo.id === id);
        if (deletedMemo) {
            moveToTrash(
                id,
                'memo',
                deletedMemo.content.substring(0, 50),
                deletedMemo
            );
            setMemos(prev => prev.filter(memo => memo.id !== id));
            addActivity('메모 삭제', deletedMemo.content, id);
        }
    };
    
    // 스케줄 삭제 수정
    const executeCalendarDelete = () => {
        const key = format(dateToDelete, 'yyyy-MM-dd');
        const deletedEntry = calendarSchedules[key];
        
        if (deletedEntry) {
            moveToTrash(
                key,
                'schedule',
                `${key} - ${deletedEntry.text}`,
                { date: dateToDelete, ...deletedEntry }
            );
            setCalendarSchedules(prev => {
                const updated = { ...prev };
                delete updated[key];
                return updated;
            });
        }
    };
    
    // 복원 이벤트 리스너
    useEffect(() => {
        const handleRestore = (event) => {
            const restoredItems = event.detail;
            
            restoredItems.forEach(item => {
                if (item.type === 'memo') {
                    setMemos(prev => [item.originalData, ...prev]);
                } else if (item.type === 'schedule') {
                    const { date, ...scheduleData } = item.originalData;
                    const key = format(new Date(date), 'yyyy-MM-dd');
                    setCalendarSchedules(prev => ({
                        ...prev,
                        [key]: scheduleData
                    }));
                }
            });
        };

        window.addEventListener('itemsRestored', handleRestore);
        return () => window.removeEventListener('itemsRestored', handleRestore);
    }, []);
    
    return (/* 기존 UI 코드 */);
};
```

## 📊 데이터 구조

### trashedItems (localStorage: 'trashedItems_shared')
```javascript
[
    {
        id: 'm1234567890',              // 원본 ID
        type: 'memo',                    // 'memo' | 'schedule' | 'secret' | 'review'
        content: '메모 내용 미리보기...',  // 표시용 텍스트
        originalData: { /* 원본 객체 */ }, // 복원을 위한 완전한 데이터
        deletedAt: 1699000000000         // 삭제 타임스탬프
    }
]
```

### autoDeletePeriod (localStorage: 'autoDeletePeriod_shared')
```javascript
30  // 자동 삭제까지의 일수
```

## 🎨 UI 특징

- **타입별 색상 구분**
  - 메모: 파란색
  - 스케줄: 보라색
  - 시크릿: 주황색
  - 리뷰: 초록색

- **남은 일수 표시**
  - 7일 이하: 빨간색 강조
  - 8일 이상: 회색

- **선택 모드**
  - 항목 클릭으로 선택/해제
  - 전체 선택/해제 버튼

## 🔐 설정 페이지 추가 (선택사항)

설정 페이지에서 자동 삭제 기간을 변경할 수 있도록 하려면:

```javascript
import { useTrashContext } from '../contexts/TrashContext';

const SettingsPage = () => {
    const { autoDeletePeriod, setAutoDeletePeriod } = useTrashContext();
    
    return (
        <div>
            <label>
                자동 삭제 기간 (일)
                <input
                    type="number"
                    min="1"
                    max="365"
                    value={autoDeletePeriod}
                    onChange={(e) => setAutoDeletePeriod(Number(e.target.value))}
                />
            </label>
        </div>
    );
};
```

## ⚠️ 주의사항

1. **TrashProvider 내부에서만 useTrashContext 사용 가능**
   - App 컴포넌트를 TrashProvider로 감싼 후
   - 내부에 AppContent 컴포넌트를 만들어 로직 분리 필요

2. **복원 시 자동 동기화**
   - 복원 이벤트 리스너에서 quietSync() 호출 필요

3. **Google Drive 동기화**
   - trashedItems도 동기화 대상에 포함해야 함
   - dataToSync 객체에 trashedItems 추가

## 🚀 테스트 방법

1. 메모 작성 후 삭제 → 휴지통 확인
2. 스케줄 작성 후 삭제 → 휴지통 확인
3. 휴지통에서 복원 → 원래 위치로 복원 확인
4. 휴지통에서 영구 삭제 → 완전히 삭제 확인
5. 다중 선택 후 일괄 작업 테스트
6. 30일 경과 후 자동 삭제 테스트 (테스트용으로 1일로 변경 가능)

## 📝 향후 확장 가능 사항

- [ ] 시크릿 글 삭제 지원
- [ ] 리뷰 글 삭제 지원
- [ ] 휴지통 검색 기능
- [ ] 휴지통 필터 (타입별)
- [ ] 휴지통 정렬 (날짜순, 타입별)
- [ ] 대용량 삭제 시 배치 처리
- [ ] 휴지통 용량 제한 설정

## 🎉 완료!

모든 파일이 준비되었으며, 위 가이드대로 App.jsx에 통합하면 휴지통 기능이 완벽하게 작동합니다.
