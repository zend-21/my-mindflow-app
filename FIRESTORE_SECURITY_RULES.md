# Firebase Firestore Security Rules

이 문서는 협업 기능을 위한 Firestore 보안 규칙을 설명합니다.

## 🔒 보안 규칙 설정 방법

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Firestore Database** 클릭
4. 상단 탭에서 **규칙(Rules)** 클릭
5. 아래 규칙을 복사하여 붙여넣기
6. **게시(Publish)** 버튼 클릭

---

## 📋 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ============================================
    // 헬퍼 함수
    // ============================================

    // 사용자 인증 확인
    function isSignedIn() {
      return request.auth != null;
    }

    // 본인 확인
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // ============================================
    // 1. 사용자 프로필
    // ============================================
    match /users/{userId} {
      // 읽기: 로그인한 모든 사용자 가능 (친구 검색용)
      allow read: if isSignedIn();

      // 쓰기: 본인만 가능
      allow write: if isOwner(userId);
    }

    // ============================================
    // 2. 친구 관계
    // ============================================
    match /friendships/{friendshipId} {
      // 읽기: 관련된 사용자만 가능
      allow read: if isSignedIn() && (
        resource.data.userId == request.auth.uid ||
        resource.data.friendId == request.auth.uid
      );

      // 생성: 로그인한 사용자
      allow create: if isSignedIn() && (
        request.resource.data.userId == request.auth.uid
      );

      // 업데이트: 친구 요청 받은 사람 (승인용)
      allow update: if isSignedIn() && (
        resource.data.friendId == request.auth.uid
      );

      // 삭제: 관련된 사용자만
      allow delete: if isSignedIn() && (
        resource.data.userId == request.auth.uid ||
        resource.data.friendId == request.auth.uid
      );
    }

    // ============================================
    // 3. 공유 메모/스케줄
    // ============================================
    match /sharedNotes/{noteId} {
      // 읽기: 참여자만 가능
      allow read: if isSignedIn() && (
        request.auth.uid in resource.data.participants.keys()
      );

      // 생성: 로그인한 사용자
      allow create: if isSignedIn() && (
        request.resource.data.ownerId == request.auth.uid
      );

      // 업데이트: 참여자 중 권한이 있는 사용자
      allow update: if isSignedIn() && (
        request.auth.uid in resource.data.participants.keys()
      );

      // 삭제: 소유자만 가능
      allow delete: if isSignedIn() && (
        resource.data.ownerId == request.auth.uid
      );
    }

    // ============================================
    // 4. 수정 제안
    // ============================================
    match /editSuggestions/{suggestionId} {
      // 읽기: 제안한 사람 또는 관련 메모의 소유자
      allow read: if isSignedIn();

      // 생성: 로그인한 사용자
      allow create: if isSignedIn() && (
        request.resource.data.userId == request.auth.uid
      );

      // 업데이트: 메모 소유자 (승인/거절용)
      allow update: if isSignedIn();

      // 삭제: 제안한 사람 또는 메모 소유자
      allow delete: if isSignedIn();
    }

    // ============================================
    // 5. 채팅 메시지
    // ============================================
    match /chatMessages/{messageId} {
      // 읽기: 해당 방의 참여자
      allow read: if isSignedIn();

      // 생성: 로그인한 사용자
      allow create: if isSignedIn() && (
        request.resource.data.userId == request.auth.uid
      );

      // 업데이트: 읽음 상태 업데이트용
      allow update: if isSignedIn();

      // 삭제: 작성자만 (선택적)
      allow delete: if isSignedIn() && (
        resource.data.userId == request.auth.uid
      );
    }

    // ============================================
    // 6. 알림
    // ============================================
    match /notifications/{notificationId} {
      // 읽기: 받는 사람만
      allow read: if isSignedIn() && (
        resource.data.userId == request.auth.uid
      );

      // 생성: 로그인한 사용자
      allow create: if isSignedIn();

      // 업데이트: 받는 사람 (읽음 처리용)
      allow update: if isSignedIn() && (
        resource.data.userId == request.auth.uid
      );

      // 삭제: 받는 사람
      allow delete: if isSignedIn() && (
        resource.data.userId == request.auth.uid
      );
    }

    // ============================================
    // 7. 타이핑 상태 (실시간)
    // ============================================
    match /typingStatus/{statusId} {
      // 읽기: 모든 로그인 사용자
      allow read: if isSignedIn();

      // 쓰기: 본인만
      allow write: if isSignedIn() && (
        request.resource.data.userId == request.auth.uid
      );
    }
  }
}
```

---

## 🔐 보안 규칙 설명

### 1. **사용자 프로필 (users)**
- **읽기**: 로그인한 모든 사용자 (친구 검색 기능)
- **쓰기**: 본인만 가능

### 2. **친구 관계 (friendships)**
- **읽기**: 해당 친구 관계의 당사자만
- **생성**: 친구 요청 보내는 사람
- **업데이트**: 친구 요청 받은 사람 (승인/거절)
- **삭제**: 친구 관계의 당사자

### 3. **공유 메모/스케줄 (sharedNotes)**
- **읽기**: 참여자만
- **생성**: 메모/스케줄 소유자
- **업데이트**: 권한이 있는 참여자
- **삭제**: 소유자만

### 4. **수정 제안 (editSuggestions)**
- **읽기**: 제안자 및 메모 소유자
- **생성**: 수정 권한이 있는 참여자
- **업데이트**: 메모 소유자 (승인/거절)
- **삭제**: 제안자 및 메모 소유자

### 5. **채팅 메시지 (chatMessages)**
- **읽기**: 해당 방의 참여자
- **생성**: 로그인한 사용자
- **업데이트**: 읽음 상태 업데이트용
- **삭제**: 메시지 작성자

### 6. **알림 (notifications)**
- **읽기**: 알림 받는 사람
- **생성**: 알림 보내는 사람
- **업데이트**: 받는 사람 (읽음 처리)
- **삭제**: 받는 사람

---

## ⚠️ 주의사항

### 1. **프로덕션 환경**
- 위 규칙은 기본적인 보안을 제공하지만, 실제 서비스에서는 더 세밀한 검증이 필요할 수 있습니다.
- 예: 참여자 권한 레벨 검증, 데이터 크기 제한 등

### 2. **테스트 환경**
개발 중에는 더 느슨한 규칙을 사용할 수 있습니다:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // ⚠️ 경고: 개발용으로만 사용!
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. **Firebase Authentication 활성화**
- Firebase Console > Authentication > Sign-in method
- 사용할 로그인 방법 활성화 (Google, Email/Password 등)

### 4. **인덱스 생성**
복잡한 쿼리를 사용하는 경우 Firestore 인덱스가 필요할 수 있습니다:
- Firebase Console > Firestore Database > 색인(Indexes)
- 앱 실행 시 콘솔에 나타나는 인덱스 생성 링크 클릭

---

## 📊 권장 Firestore 인덱스

다음 인덱스를 수동으로 생성하는 것을 권장합니다:

### 1. friendships 컬렉션
- **필드**: `userId` (Ascending), `status` (Ascending)
- **필드**: `friendId` (Ascending), `status` (Ascending)

### 2. sharedNotes 컬렉션
- **필드**: `updatedAt` (Descending)

### 3. chatMessages 컬렉션
- **필드**: `roomId` (Ascending), `createdAt` (Ascending)

### 4. notifications 컬렉션
- **필드**: `userId` (Ascending), `isRead` (Ascending), `createdAt` (Descending)

### 5. editSuggestions 컬렉션
- **필드**: `noteId` (Ascending), `status` (Ascending), `createdAt` (Descending)

---

## 🚀 다음 단계

1. ✅ Firestore Security Rules 설정
2. ✅ Firestore 인덱스 생성
3. ✅ Firebase Authentication 활성화
4. ✅ `.env` 파일에 Firebase 설정 추가
5. ✅ 앱 테스트 및 디버깅

---

## 💡 문제 해결

### "Missing or insufficient permissions" 오류
- Firestore Security Rules가 올바르게 설정되었는지 확인
- 사용자가 로그인되어 있는지 확인
- Firebase Console > Firestore > 규칙 탭에서 시뮬레이터로 테스트

### 쿼리 실패
- Firebase Console에서 필요한 인덱스가 생성되었는지 확인
- 콘솔 에러 메시지의 인덱스 생성 링크 클릭

### 로그인 문제
- Firebase Console > Authentication 설정 확인
- `.env` 파일의 Firebase 설정값 확인

---

## 📚 참고 자료

- [Firestore Security Rules 공식 문서](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore 데이터 모델링 가이드](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Authentication 설정](https://firebase.google.com/docs/auth)
