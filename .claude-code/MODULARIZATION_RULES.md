# 🏗️ 모듈화 규칙 (Modularization Rules)

> **중요**: 이 파일은 Claude Code가 코드 작업 시 **항상** 참조해야 하는 필수 규칙입니다.
> 새로운 기능 추가나 코드 수정 시 반드시 이 규칙을 따라 모듈화된 상태를 유지해야 합니다.

---

## 📋 현재 모듈화 상태 (2026-01-12 완료)

### ✅ 완료된 리팩토링

| 파일 | 원본 줄 수 | 현재 줄 수 | 분리된 파일 | 상태 |
|------|-----------|-----------|------------|------|
| **CollaborativeDocumentEditor.jsx** | 6184 | 5248 | styles, rangeUtils | ✅ 완료 |
| **ChatRoom.jsx** | 4212 | 2973 | styles | ✅ 완료 |
| **App.jsx** | 3311 | 3087 | styles | ✅ 완료 |
| **ProfilePage.jsx** | 2282 | 1248 | styles | ✅ 완료 |
| **AlarmModal.jsx** | 1702 | 1425 | styles | ✅ 완료 |
| **RichTextEditor.jsx** | 1618 | 938 | styles | ✅ 완료 |
| **MemoDetailModal.jsx** | 1592 | 815 | styles | ✅ 완료 |
| **FriendList.jsx** | 1557 | 1003 | styles | ✅ 완료 |
| **Timer.jsx** | 1511 | 837 | styles | ✅ 완료 |
| **AlarmEditModal.jsx** | 1033 | 809 | styles | ✅ 완료 |
| **useFirestoreSync.js** | 1355 | 482 | utils, merging, operations, events | ✅ 완료 |
| **fortuneLogic.js** | 1229 | 143 | constants, calculations, elements, helpers, storage | ✅ 완료 |
| **groupChatService.js** | 1392 | 575 | utils, memberService, messageService | ✅ 완료 |

### 📁 생성된 모듈 파일

```
src/
├── App.styles.js (185줄) - App.jsx의 Styled Components
├── components/
│   ├── MemoDetailModal.styles.js (774줄) - 50개 styled components
│   ├── ProfilePage.styles.js (1030줄) - 66개 styled components
│   ├── RichTextEditor.styles.js (681줄) - 31개 styled components
│   ├── Timer.styles.js (676줄) - 26개 styled components
│   └── messaging/
│       ├── CollaborativeDocumentEditor.styles.js (856줄) - 39개 styled components
│       ├── ChatRoom.styles.js (1241줄) - 93개 styled components
│       └── FriendList.styles.js (572줄) - 40개 styled components
├── hooks/
│   ├── useFirestoreSync.utils.js (49줄) - localStorage 헬퍼 함수
│   ├── useFirestoreSync.merging.js (263줄) - 데이터 병합 및 충돌 해결 로직
│   ├── useFirestoreSync.operations.js (451줄) - 개별/배열 동기화 작업
│   └── useFirestoreSync.events.js (332줄) - 페이지 가시성 및 네트워크 이벤트 핸들러
├── modules/calendar/
│   └── alarm/
│       └── components/
│           ├── AlarmModal.styles.js (276줄) - 29개 styled components
│           └── AlarmEditModal.styles.js (228줄) - 14개 styled components
├── services/
│   ├── groupChatUtils.js (173줄) - 유틸리티 함수 (사용자 정보, 권한 확인 등)
│   ├── groupChatMemberService.js (536줄) - 멤버 관리 (초대, 나가기, 강퇴, 초대 수락/거부)
│   └── groupChatMessageService.js (279줄) - 메시지 관리 (전송, 구독, 읽음 처리)
└── utils/
    ├── rangeUtils.js (77줄) - Range 관련 유틸리티 함수
    ├── fortuneConstants.js (96줄) - 사주팔자 상수 및 기본 데이터
    ├── fortuneCalculations.js (244줄) - 일진, 띠, 별자리 등 핵심 계산 함수
    ├── fortuneElements.js (233줄) - 오행 관련 로직 (상생상극, 월령, 행운 요소)
    ├── fortuneHelpers.js (342줄) - 타로/별자리 선택, 점수 계산 헬퍼 함수
    └── fortuneStorage.js (164줄) - 운세 저장 및 사용자 프로필 관리
```

---

## 🚨 필수 준수 사항

### 1️⃣ **파일 크기 제한**

```
⚠️ 절대 규칙: 단일 파일이 500줄을 초과하면 즉시 모듈화 검토!

✅ 권장: 300-500줄
⚠️ 주의: 500-1000줄 (리팩토링 고려)
🔴 심각: 1000줄 이상 (즉시 모듈화 필요)
```

**예외**:
- 매우 복잡한 비즈니스 로직이 강하게 결합된 경우만 1000줄까지 허용
- 그 이상은 **절대 금지**

---

### 2️⃣ **Styled Components 분리 규칙**

```javascript
// ❌ 나쁜 예: 메인 파일에 Styled Components 추가
// MyComponent.jsx
const NewStyledDiv = styled.div`
  padding: 20px;
`;

// ✅ 좋은 예: 별도 파일에 추가
// MyComponent.styles.js
export const NewStyledDiv = styled.div`
  padding: 20px;
`;

// MyComponent.jsx
import * as S from './MyComponent.styles';
// 사용: <S.NewStyledDiv>
```

**규칙**:
- ✅ 모든 `styled.xxx` 정의는 `.styles.js` 파일에 작성
- ✅ 10개 이상의 styled components가 있으면 **반드시** 분리
- ✅ Import는 `import * as S from './파일명.styles';` 패턴 사용
- ✅ 사용 시 `<S.ComponentName>` 형태로 사용

---

### 3️⃣ **유틸리티 함수 분리 규칙**

```javascript
// ❌ 나쁜 예: 컴포넌트 파일 내부에 유틸리티 함수
// MyComponent.jsx
function formatDate(date) { /* ... */ }
function calculateTotal(items) { /* ... */ }

// ✅ 좋은 예: 별도 유틸리티 파일
// utils/myUtils.js
export function formatDate(date) { /* ... */ }
export function calculateTotal(items) { /* ... */ }

// MyComponent.jsx
import { formatDate, calculateTotal } from '../../utils/myUtils';
```

**분리 기준**:
- ✅ 다른 곳에서도 사용 가능한 순수 함수
- ✅ 3개 이상의 관련 헬퍼 함수
- ✅ 복잡한 계산 로직 (50줄 이상)
- ✅ DOM 조작 유틸리티

---

### 4️⃣ **모달 컴포넌트 분리 규칙**

```javascript
// ❌ 나쁜 예: 메인 파일에 인라인 모달
return (
  <>
    {showModal && (
      <ModalOverlay>
        <ModalContent>
          {/* 100줄 이상의 모달 내용 */}
        </ModalContent>
      </ModalOverlay>
    )}
  </>
);

// ✅ 좋은 예: 별도 모달 컴포넌트 파일
// modals/MyModal.jsx
export const MyModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;
  return (
    <S.ModalOverlay onClick={onClose}>
      {/* 모달 내용 */}
    </S.ModalOverlay>
  );
};

// MyComponent.jsx
import { MyModal } from './modals/MyModal';
// 사용: <MyModal isOpen={showModal} onClose={handleClose} />
```

**분리 기준**:
- ✅ 모달 내용이 100줄 이상
- ✅ 3개 이상의 모달이 있는 경우
- ✅ 복잡한 폼이 포함된 모달

---

### 5️⃣ **Custom Hooks 분리 규칙**

```javascript
// ❌ 나쁜 예: 컴포넌트 내부에 복잡한 상태 로직
const MyComponent = () => {
  const [state1, setState1] = useState();
  const [state2, setState2] = useState();
  // ... 20개의 상태

  useEffect(() => { /* 복잡한 로직 */ }, []);
  useEffect(() => { /* 복잡한 로직 */ }, []);
  // ... 10개의 useEffect
};

// ✅ 좋은 예: Custom Hook으로 분리
// hooks/useMyFeature.js
export const useMyFeature = (params) => {
  const [state1, setState1] = useState();
  const [state2, setState2] = useState();

  useEffect(() => { /* ... */ }, []);

  return { state1, state2, actions };
};

// MyComponent.jsx
const MyComponent = () => {
  const { state1, state2, actions } = useMyFeature(params);
};
```

**분리 기준**:
- ✅ 10개 이상의 관련 상태
- ✅ 5개 이상의 useEffect
- ✅ 재사용 가능한 로직
- ✅ 복잡한 비즈니스 로직

---

## 📂 디렉토리 구조 규칙

### 컴포넌트 디렉토리 예시

```
src/components/messaging/
├── ChatRoom.jsx                  # 메인 컴포넌트 (최대 3000줄)
├── ChatRoom.styles.js            # Styled Components
├── hooks/                        # Custom Hooks (필요시)
│   ├── useChatRoomModals.js
│   └── useGroupMemberInvitation.js
├── modals/                       # 모달 컴포넌트 (필요시)
│   ├── MemberListModal.jsx
│   ├── InviteMembersModal.jsx
│   └── TransferOwnerModal.jsx
└── utils/                        # 유틸리티 함수 (필요시)
    └── chatHelpers.js
```

---

## 🔍 작업 전 체크리스트

### 새 기능 추가 시

- [ ] 추가할 코드가 100줄 이상인가? → 별도 컴포넌트/함수 고려
- [ ] Styled Component를 추가하는가? → `.styles.js` 파일에 추가
- [ ] 유틸리티 함수를 추가하는가? → `utils/` 폴더 확인
- [ ] 모달을 추가하는가? → `modals/` 폴더 고려
- [ ] 작업 후 파일이 500줄을 넘는가? → 즉시 모듈화 검토

### 기존 코드 수정 시

- [ ] 수정 대상 파일이 1000줄 이상인가? → 리팩토링 우선 검토
- [ ] 수정으로 파일이 500줄을 넘게 되는가? → 모듈 분리 고려
- [ ] Styled Component를 추가하는가? → `.styles.js` 파일 사용

---

## 🎯 모듈화 우선순위

### 즉시 분리 (필수)
1. **Styled Components** - 10개 이상 시 무조건 분리
2. **독립 유틸리티 함수** - 재사용 가능하면 즉시 분리
3. **대형 모달** - 200줄 이상 시 즉시 분리

### 검토 후 분리 (권장)
4. **Custom Hooks** - 복잡도가 높으면 분리
5. **비즈니스 로직** - 테스트 필요 시 분리
6. **서브 컴포넌트** - 재사용 가능하면 분리

### 분리하지 않음
- 강하게 결합된 상태 관리
- 한 곳에서만 사용되는 간단한 로직
- Props drilling이 심한 경우

---

## 💡 실전 예제

### Case 1: 새 모달 추가 요청

```
사용자: "ChatRoom에 '방 설정 변경' 모달을 추가해줘"

❌ 잘못된 접근:
→ ChatRoom.jsx에 200줄짜리 모달 코드를 인라인으로 추가

✅ 올바른 접근:
1. modals/RoomSettingsModal.jsx 생성 (독립 컴포넌트)
2. 필요한 styled components는 ChatRoom.styles.js에 추가
3. ChatRoom.jsx에서 import하여 사용
```

### Case 2: 새 기능 추가

```
사용자: "CollaborativeDocumentEditor에 '문서 버전 관리' 기능 추가해줘"

체크:
1. 추가 코드 줄 수 예상: ~300줄
2. Styled components 필요: 5개
3. 유틸리티 함수: 3개

✅ 올바른 접근:
1. Styled components → CollaborativeDocumentEditor.styles.js에 추가
2. 버전 비교 함수 → utils/versionUtils.js 생성
3. 메인 로직 → CollaborativeDocumentEditor.jsx에 추가 (결합도 높음)
4. 버전 목록 모달 → 별도 컴포넌트로 분리
```

### Case 3: 파일 크기 초과

```
상황: App.jsx가 3500줄로 증가함

🚨 즉시 조치:
1. Styled components 점검 → App.styles.js로 이동
2. 유틸리티 함수 점검 → utils/로 이동
3. 큰 useEffect 로직 → Custom Hook으로 분리
4. 목표: 3000줄 이하로 감소
```

---

## 📝 작업 후 검증

### 모듈화 검증 체크리스트

```bash
# 1. 파일 크기 확인
wc -l src/**/*.jsx src/**/*.js

# 2. 1000줄 이상 파일 찾기
find src -name "*.jsx" -o -name "*.js" | xargs wc -l | awk '$1 > 1000'

# 3. Styled components 누락 확인
grep -r "const.*= styled\." src --include="*.jsx" --exclude="*.styles.js"

# 4. 빌드 테스트
npm run build
```

### 기대 결과
- ✅ 모든 파일 500줄 이하 (메인 로직 제외)
- ✅ 메인 컴포넌트 3000줄 이하
- ✅ Styled components는 `.styles.js`에만 존재
- ✅ 빌드 에러 없음

---

## 🔄 지속적 관리

### 주기적 점검 (매 주요 기능 추가 후)

1. **파일 크기 모니터링**
   ```bash
   npm run check-file-sizes  # 향후 스크립트 추가 예정
   ```

2. **모듈화 상태 검토**
   - 500줄 초과 파일 확인
   - Styled components 누락 확인
   - 중복 코드 제거

3. **리팩토링 계획**
   - 1000줄 이상 파일은 우선순위 1
   - 500-1000줄 파일은 우선순위 2

---

## ⚙️ 자동화 도구 (향후 추가 예정)

### ESLint 규칙
```json
{
  "rules": {
    "max-lines": ["error", { "max": 500, "skipBlankLines": true }],
    "max-lines-per-function": ["warn", { "max": 100 }]
  }
}
```

### Pre-commit Hook
```bash
#!/bin/bash
# 500줄 초과 파일 경고
find src -name "*.jsx" | while read file; do
  lines=$(wc -l < "$file")
  if [ $lines -gt 500 ]; then
    echo "⚠️  $file: $lines lines (limit: 500)"
  fi
done
```

---

## 📞 도움말

### 모듈화 관련 질문

**Q: 언제 분리해야 하나요?**
A: 파일이 500줄을 넘거나, styled components가 10개 이상이면 즉시 분리하세요.

**Q: 분리하면 안 되는 경우는?**
A: 상태가 강하게 결합되어 있거나, props drilling이 심해지는 경우는 분리하지 마세요.

**Q: 기존 코드를 리팩토링해야 하나요?**
A: 새 기능 추가 시 해당 파일이 1000줄 이상이면 먼저 리팩토링하고 기능을 추가하세요.

---

## 🎯 최종 목표

```
✨ 지속 가능한 코드베이스 유지
- 모든 파일 500줄 이하 (메인 로직 제외)
- 명확한 책임 분리
- 쉬운 유지보수
- 빠른 개발 속도
```

---

**마지막 업데이트**: 2026-01-12
**다음 점검 예정**: 다음 주요 기능 추가 후
