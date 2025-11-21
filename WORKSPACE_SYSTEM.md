# 워크스페이스 시스템 (Workspace System)

## 개요

워크스페이스 시스템은 사용자가 협업방을 효과적으로 관리하고 공유할 수 있도록 하는 기능입니다.

### 핵심 개념

- **1인 1워크스페이스**: 각 사용자는 단 하나의 워크스페이스를 가집니다
- **고유 워크스페이스 코드**: 각 워크스페이스는 고유한 코드(예: `WORK-A3F9`)를 가지며, 이 코드로 접근 가능합니다
- **공개방/비공개방**: 모든 협업방은 워크스페이스에 속하며, `isPublic` 플래그로 구분됩니다
  - **공개방**: 워크스페이스 코드로 접근 시 목록에 표시됨
  - **비공개방**: 워크스페이스에 속하지만 목록에 표시되지 않음 (초대 링크/코드로만 접근)

## 데이터 구조

### Workspace 컬렉션

```javascript
{
  workspaceId: "workspace_<userId>",
  ownerId: "<userId>",
  ownerName: "사용자 이름",
  ownerEmail: "user@example.com",
  workspaceCode: "WORK-A3F9", // 고유 코드 (변경 가능)
  createdAt: Timestamp,
  updatedAt: Timestamp,
  settings: {
    allowGuestView: true, // 워크스페이스 코드로 접근한 사람이 공개방 볼 수 있는지
    description: "", // 워크스페이스 설명
  },
  stats: {
    totalRooms: 5,
    publicRooms: 3,
    privateRooms: 2,
  }
}
```

### CollaborationRoom 컬렉션 (업데이트)

기존 구조에 `workspaceId` 필드가 추가되었습니다:

```javascript
{
  roomId: "...",
  workspaceId: "workspace_<userId>", // ✨ 새로 추가
  memoId: "...",
  memoTitle: "...",
  ownerId: "...",
  ownerName: "...",
  isPublic: true, // true: 공개방, false: 비공개방
  participants: [...],
  permissions: {...},
  status: "active",
  // ... 기타 필드
}
```

## 주요 기능

### 1. 워크스페이스 자동 생성

사용자가 로그인하면 워크스페이스가 자동으로 생성됩니다.

**파일**: `src/services/collaborationService.js`

```javascript
// createOrUpdateUserProfile 함수 내부
const workspaceExists = await checkWorkspaceExists(auth.currentUser.uid);
if (!workspaceExists) {
  await createWorkspace(
    auth.currentUser.uid,
    profileData.displayName,
    profileData.email
  );
}
```

### 2. 협업방 생성 시 워크스페이스 연결

협업방을 생성할 때 자동으로 사용자의 워크스페이스 ID가 연결됩니다.

**파일**: `src/services/collaborationRoomService.js`

```javascript
// createCollaborationRoom 함수 내부
let workspaceId = `workspace_${userId}`;
const workspaceResult = await getWorkspaceByUserId(userId);
if (workspaceResult.success) {
  workspaceId = workspaceResult.data.workspaceId;
}

const roomData = {
  // ...
  workspaceId, // 워크스페이스 ID 추가
  isPublic: isPublic, // 공개/비공개 설정
  // ...
};
```

### 3. 워크스페이스 코드로 공개방 탐색

다른 사용자의 워크스페이스 코드를 입력하면 해당 워크스페이스의 공개 방 목록을 볼 수 있습니다.

**컴포넌트**: `src/components/collaboration/WorkspaceBrowser.jsx`

**사용 방법**:
1. 워크스페이스 코드 입력 (예: `WORK-A3F9`)
2. 검색 버튼 클릭
3. 공개 방 목록 표시
4. 방 클릭하여 입장

### 4. 내 워크스페이스 관리

자신의 워크스페이스 정보를 확인하고 코드를 변경할 수 있습니다.

**컴포넌트**: `src/components/collaboration/WorkspaceSettings.jsx`

**기능**:
- 워크스페이스 코드 복사
- 워크스페이스 코드 변경 (새 코드 자동 생성)
- 통계 확인 (전체 방, 공개 방, 비공개 방 개수)

### 5. 방 삭제 및 폐쇄

방장은 자신의 방을 삭제하거나 폐쇄할 수 있습니다.

**파일**: `src/services/collaborationRoomService.js`

```javascript
// 방 삭제 (완전 제거)
await deleteRoom(roomId);

// 방 폐쇄 (아카이브)
await closeRoom(roomId);

// 방 재개방 (폐쇄된 방을 다시 활성화)
await reopenRoom(roomId);
```

모든 기능은 워크스페이스 통계를 자동으로 업데이트합니다.

**방 상태**:
- `active`: 활성 상태 - 참여자 입장 가능
- `archived`: 폐쇄 상태 - 방장만 접근 가능, 다른 참여자 입장 불가

### 6. 내 워크스페이스 관리

**컴포넌트**: `src/components/collaboration/MyWorkspace.jsx`

워크스페이스 소유자는 자신의 워크스페이스에서 **모든 방을 보고 관리**할 수 있습니다.

**기능**:
- ✅ 모든 방 보기 (공개방 + 비공개방)
- ✅ 탭별 필터링 (전체, 공개, 비공개, 폐쇄됨)
- ✅ 방 상태 관리 (폐쇄, 재개방, 삭제)
- ✅ 워크스페이스 코드 복사
- ✅ 실시간 통계 확인

**권한 차이**:
| 기능 | 소유자 (내 워크스페이스) | 방문자 (다른 사람 워크스페이스) |
|------|-------------------------|-------------------------------|
| 공개방 보기 | ✅ | ✅ |
| 비공개방 보기 | ✅ | ❌ (초대받아야 보임) |
| 폐쇄된 방 보기 | ✅ | ❌ |
| 방 삭제 | ✅ | ❌ |
| 방 폐쇄/재개방 | ✅ | ❌ |

## 쿼리 예제

### 공개 방 목록 조회

```javascript
import { getPublicRoomsInWorkspace } from './services/workspaceService';

const { rooms } = await getPublicRoomsInWorkspace('workspace_<userId>');
```

### 내가 참여 중인 비공개방 조회

```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';

const myPrivateRooms = await getDocs(
  query(
    collection(db, 'collaborationRooms'),
    where('isPublic', '==', false),
    where('participants', 'array-contains', {
      userId: currentUserId,
      // ... 기타 필드
    })
  )
);
```

## 보안 규칙

**파일**: `firestore.rules`

### 워크스페이스

```javascript
match /workspaces/{workspaceId} {
  // 생성: 로그인 + 소유자 확인
  allow create: if isSignedIn() &&
    request.resource.data.ownerId == request.auth.uid;

  // 읽기: 로그인한 모든 사용자 (워크스페이스 코드로 접근)
  allow read: if isSignedIn();

  // 수정: 워크스페이스 소유자만
  allow update: if isSignedIn() &&
    request.auth.uid == resource.data.ownerId;

  // 삭제: 워크스페이스 소유자만
  allow delete: if isSignedIn() &&
    request.auth.uid == resource.data.ownerId;
}
```

### 협업방

```javascript
match /collaborationRooms/{roomId} {
  // 생성: 로그인 + 소유자 확인 + 워크스페이스 ID 필수
  allow create: if isSignedIn() &&
    request.resource.data.ownerId == request.auth.uid &&
    request.resource.data.workspaceId != null;

  // 읽기: 참여자만
  allow read: if isSignedIn();

  // 수정: 방장 또는 편집 권한이 있는 사용자
  allow update: if isSignedIn() && (
    request.auth.uid == resource.data.ownerId ||
    resource.data.permissions.allCanEdit == true ||
    request.auth.uid in resource.data.permissions.editableUsers
  );

  // 삭제: 방장만
  allow delete: if isSignedIn() &&
    request.auth.uid == resource.data.ownerId;
}
```

## 통합 가이드

### UI에 워크스페이스 기능 추가하기

#### 1. WorkspaceBrowser 모달 추가

```javascript
import WorkspaceBrowser from './components/collaboration/WorkspaceBrowser';

function MyComponent() {
  const [showWorkspaceBrowser, setShowWorkspaceBrowser] = useState(false);

  const handleRoomSelect = (room) => {
    // 선택된 방으로 이동
    console.log('선택된 방:', room);
    setShowWorkspaceBrowser(false);
  };

  return (
    <>
      <button onClick={() => setShowWorkspaceBrowser(true)}>
        워크스페이스 탐색
      </button>

      <WorkspaceBrowser
        isOpen={showWorkspaceBrowser}
        onClose={() => setShowWorkspaceBrowser(false)}
        onRoomSelect={handleRoomSelect}
      />
    </>
  );
}
```

#### 2. WorkspaceSettings 모달 추가

```javascript
import WorkspaceSettings from './components/collaboration/WorkspaceSettings';

function MyComponent() {
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);

  return (
    <>
      <button onClick={() => setShowWorkspaceSettings(true)}>
        내 워크스페이스
      </button>

      <WorkspaceSettings
        isOpen={showWorkspaceSettings}
        onClose={() => setShowWorkspaceSettings(false)}
      />
    </>
  );
}
```

## 사용 시나리오

### 시나리오 1: 공개 방으로 친구 초대

1. 철수가 메모를 작성하고 "공개 방" 옵션으로 협업방 생성
2. 철수가 자신의 워크스페이스 코드를 영희에게 공유 (예: "WORK-A3F9")
3. 영희가 워크스페이스 탐색 기능으로 "WORK-A3F9" 입력
4. 철수의 공개 방 목록이 표시됨
5. 영희가 원하는 방을 클릭하여 입장

### 시나리오 2: 비공개 방으로 친구 초대

1. 철수가 메모를 작성하고 "비공개 방" 옵션으로 협업방 생성
2. 철수가 방 내에서 영희에게 초대장 전송
3. 영희가 초대장 링크/코드로 방에 직접 입장
4. 이 방은 철수의 워크스페이스 공개 목록에 표시되지 않음

### 시나리오 3: 방 삭제

1. 철수가 자신이 만든 방의 방장임
2. 방 설정에서 "방 삭제" 버튼 클릭
3. 확인 후 방이 완전히 삭제됨
4. 워크스페이스 통계가 자동으로 업데이트됨

## API 레퍼런스

### workspaceService.js

| 함수 | 설명 | 파라미터 | 반환값 |
|------|------|----------|--------|
| `createWorkspace` | 워크스페이스 생성 | `userId, userName, userEmail` | `{ success, workspaceId, data }` |
| `getWorkspaceById` | ID로 조회 | `workspaceId` | `{ success, data }` |
| `getWorkspaceByCode` | 코드로 조회 | `workspaceCode` | `{ success, data }` |
| `getWorkspaceByUserId` | 사용자 ID로 조회 | `userId` | `{ success, data }` |
| `changeWorkspaceCode` | 코드 변경 | `workspaceId, userId` | `{ success, newCode }` |
| `updateWorkspaceSettings` | 설정 업데이트 | `workspaceId, userId, settings` | `{ success }` |
| `getPublicRoomsInWorkspace` | 공개 방 목록 | `workspaceId` | `{ success, rooms }` |
| `updateWorkspaceStats` | 통계 업데이트 | `workspaceId` | `{ success }` |
| `checkWorkspaceExists` | 존재 확인 | `userId` | `boolean` |

### collaborationRoomService.js (업데이트된 함수)

| 함수 | 설명 | 파라미터 | 반환값 |
|------|------|----------|--------|
| `deleteRoom` | 방 삭제 (방장만) | `roomId` | `boolean` |
| `closeRoom` | 방 폐쇄/아카이브 (방장만) | `roomId` | `boolean` |

## 주의사항

1. **워크스페이스 코드 변경 시**: 기존 코드로는 더 이상 접근할 수 없습니다. 새 코드를 사용자들에게 다시 공유해야 합니다.

2. **보안**: 비공개 방은 워크스페이스 목록에 표시되지 않지만, 초대 링크를 아는 사람은 접근할 수 있습니다.

3. **통계 업데이트**: 방을 생성, 삭제, 폐쇄할 때 자동으로 워크스페이스 통계가 업데이트됩니다.

4. **방 삭제 vs 폐쇄**:
   - **삭제**: 방이 완전히 제거됨 (복구 불가)
   - **폐쇄**: 방 상태가 'archived'로 변경됨 (복구 가능)

## 향후 개선 방향

- [ ] 워크스페이스 설명 추가/수정 기능
- [ ] 폐쇄된 방 복구 기능
- [ ] 워크스페이스 템플릿 기능
- [ ] 워크스페이스 방 정렬/필터링 옵션
- [ ] 워크스페이스 초대 제한 설정
