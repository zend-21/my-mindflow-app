# AlarmModal 리팩토링 계획서

## 현재 상황
- **원본 파일**: AlarmModal.jsx (4,579줄)
- **문제점**: 한 파일에 모든 로직, 스타일, UI가 집중되어 유지보수 어려움

## 이미 완료된 작업
1. ✅ 스타일 분리 (8개 파일)
2. ✅ 상수/유틸 분리
3. ✅ 훅 6개 생성 (useAlarmSound, useAlarmList, useAlarmForm, useAlarmEdit, useAlarmModals, useAlarmActions)
4. ✅ 기본 컴포넌트 3개 생성 (AlarmItemComponent, AlarmListSection, ConfirmationModals)

## AlarmModal 주요 기능 분석

### 1. 데이터 관리
- 등록된 알람 목록 (registeredAlarms)
- 가등록 알람 목록 (pendingAlarms)
- 반복 기념일 목록 (repeatedAnniversaries)
- 알람 옵션 (사운드, 볼륨, 알림타입, 스누즈)

### 2. 주요 UI 섹션

#### A. 과거/미래 날짜 분기
- **과거 날짜 모드**: 기념일만 등록 가능, 일반 알람은 읽기 전용
- **미래 날짜 모드**: 모든 기능 사용 가능

#### B. 알람 리스트 섹션들
1. **등록된 기념일** (과거 날짜에만 표시)
2. **등록된 알람** (일반 알람)
3. **가등록 알람** (아직 확정 안 된 알람)

#### C. 알람 등록 폼
1. **기본 정보**
   - 알람 타이틀 입력
   - 이벤트 시간 입력 (시/분)
   - 기념일 체크박스

2. **프리셋 버튼**
   - 정각, 10분전, 30분전, 1시간전, 1일전 등

3. **커스텀 시간 입력**
   - N일 N시간 N분 전

4. **직접 시간 지정**
   - 날짜/시간 직접 선택

5. **기념일 설정** (기념일 체크 시)
   - 알림주기 (매일/매주/매월/매년)
   - 알림시기 (당일/N일 전)

#### D. 알람 옵션 섹션
1. **알림 타입** (소리/진동/둘다)
2. **사운드 설정** (기본/커스텀 업로드)
3. **볼륨 조절**
4. **스누즈 설정**

#### E. 알람 수정 모달
- 기존 알람 수정 가능
- 개별 알람 옵션 설정 가능

### 3. 주요 액션
- 알람 추가 (프리셋/커스텀/직접지정)
- 알람 삭제
- 알람 활성화/비활성화 토글
- 알람 수정
- 가등록 알람 확정
- 정렬 (시간순/등록순)

## 리팩토링 전략

### Phase 1: 컴포넌트 구조 설계

```
AlarmModal (Container - 200줄)
├── Header
├── FormArea
│   ├── PastDateNotice (과거 날짜 안내)
│   ├── RegisteredAnniversarySection (과거: 기념일 목록)
│   ├── RegisteredAlarmSection (일반 알람 목록)
│   ├── AnniversaryFormSection (기념일 설정 폼)
│   ├── AlarmRegistrationForm (알람 등록 폼)
│   │   ├── BasicInfoSection (타이틀, 시간)
│   │   ├── PresetButtonGrid (프리셋 버튼들)
│   │   ├── CustomTimeInputSection (커스텀 입력)
│   │   └── DirectTimeInputSection (직접 지정)
│   └── AlarmOptionsSection (알람 옵션)
├── Footer (저장/취소 버튼)
└── Modals
    ├── AlarmEditModal (알람 수정)
    ├── ValidationModal (검증 메시지)
    ├── DeleteConfirmModal (삭제 확인)
    └── EditSaveConfirmModal (수정 저장 확인)
```

### Phase 2: Props 인터페이스 정의

#### AlarmModal Props
```javascript
{
  isOpen: boolean,
  scheduleData: {
    date: Date,
    isPastDate: boolean,
    ...
  },
  onSave: (settings, action) => void,
  onClose: () => void
}
```

#### 각 섹션 컴포넌트 Props
- **공통**: scheduleData, isPastDate
- **리스트 섹션**: alarms, onToggle, onEdit, onDelete, sortBy, onSort
- **폼 섹션**: formData, onChange, onSubmit, validation
- **옵션 섹션**: options, onChange

### Phase 3: 컴포넌트 구현 순서

1. **BasicInfoSection** (타이틀, 시간 입력) - 50줄
2. **PresetButtonGrid** (프리셋 버튼) - 80줄
3. **CustomTimeInputSection** (커스텀 시간) - 60줄
4. **DirectTimeInputSection** (직접 지정) - 60줄
5. **AnniversaryFormSection** (기념일 설정) - 100줄
6. **AlarmRegistrationForm** (위 4개 조합) - 100줄
7. **AlarmOptionsSection** (알람 옵션) - 150줄
8. **AlarmEditModal** (수정 모달) - 300줄
9. **AlarmModal** (최종 조합) - 200줄

### Phase 4: 데이터 흐름 설계

```
AlarmModal (Container)
  ↓ (훅으로 상태 관리)
  ├── useAlarmForm (폼 데이터)
  ├── useAlarmList (알람 목록)
  ├── useAlarmSound (사운드 설정)
  ├── useAlarmEdit (수정 상태)
  ├── useAlarmModals (모달 상태)
  └── useAlarmActions (액션 핸들러)
  ↓ (Props로 전달)
  ├── 각 섹션 컴포넌트
  └── (이벤트 핸들러 콜백)
  ↑
AlarmModal (이벤트 처리 & 상태 업데이트)
```

## 구현 원칙

1. **단일 책임 원칙**: 각 컴포넌트는 하나의 기능만
2. **Props 명확성**: 필요한 데이터만 전달
3. **이벤트 위임**: 핸들러는 상위에서 관리
4. **스타일 재사용**: 이미 분리된 styled-components 활용
5. **점진적 개선**: 기능별로 테스트하며 진행

## 예상 결과

- **AlarmModal.jsx**: 4,579줄 → **~200줄** (95% 감소)
- **분리된 컴포넌트들**: ~2,000줄
- **훅들**: ~1,500줄
- **스타일**: ~500줄
- **총합**: ~4,200줄 (분산되어 관리 용이)

## 다음 단계

1. BasicInfoSection부터 순차적으로 구현
2. 각 컴포넌트 구현 후 즉시 테스트
3. AlarmModal에서 점진적으로 교체
4. 전체 빌드 & 기능 테스트
