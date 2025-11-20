# 자동 고유 ID 생성 기능

로그인 시 자동으로 고유 ID가 생성되도록 구현되었습니다.

---

## 구현 내용

### 1. 로그인 플로우 개선

Google 로그인 성공 시 다음 작업이 자동으로 실행됩니다:

1. **Google OAuth 로그인**
   - 사용자가 Google 계정으로 로그인
   - Access Token 및 사용자 정보 획득

2. **Firebase 익명 인증**
   - Firebase Anonymous Auth로 자동 로그인
   - 고유한 Firebase UID 생성

3. **Firestore 사용자 문서 확인**
   - `users/{uid}` 문서 존재 여부 체크
   - 신규 사용자인 경우 고유 ID 자동 생성

4. **고유 ID 자동 생성**
   - 형식: `{이름}_{랜덤4자리}`
   - 예: `hong_gildong_a3f2`
   - 중복 체크 (최대 5번 재시도)

5. **Firestore 저장**
   ```javascript
   {
     uniqueId: "hong_gildong_a3f2",
     displayName: "홍길동",
     email: "hong@gmail.com",
     photoURL: "https://...",
     createdAt: "2025-01-20T...",
     updatedAt: "2025-01-20T..."
   }
   ```

---

## 코드 변경 사항

### App.jsx

**추가된 Import:**
```javascript
import { auth, db } from './firebase/config';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { generateUniqueId, checkUniqueIdAvailable } from './services/userIdService';
```

**수정된 함수: handleLoginSuccess**

기존 Google 로그인 처리에 Firebase 연동 로직 추가:

```javascript
// Firebase 익명 로그인
let firebaseUser = auth.currentUser;
if (!firebaseUser) {
    const userCredential = await signInAnonymously(auth);
    firebaseUser = userCredential.user;
}

// 신규 사용자 확인
const userRef = doc(db, 'users', firebaseUser.uid);
const userDoc = await getDoc(userRef);

if (!userDoc.exists()) {
    // 고유 ID 생성 및 중복 체크
    let uniqueId = generateUniqueId(userInfo.name || 'user');
    let attempts = 0;
    while (attempts < 5) {
        const isAvailable = await checkUniqueIdAvailable(uniqueId);
        if (isAvailable) break;
        uniqueId = generateUniqueId(userInfo.name || 'user');
        attempts++;
    }

    // Firestore 저장
    await setDoc(userRef, {
        uniqueId,
        displayName: userInfo.name,
        email: userInfo.email,
        photoURL: pictureUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
}
```

---

## 사용자 경험

### 신규 사용자

1. Google 로그인 클릭
2. Google 계정 선택
3. **자동으로 고유 ID 생성됨** (사용자 개입 불필요)
4. 프로필 페이지에서 ID 확인 가능
5. 원하면 나중에 변경 가능

### 기존 사용자

1. Google 로그인 클릭
2. Google 계정 선택
3. **기존 고유 ID 자동 로드**
4. 바로 사용 가능

---

## ID 변경

사용자는 언제든지 프로필 페이지에서 고유 ID를 변경할 수 있습니다:

1. 프로필 페이지 → "협업 고유 ID" 섹션
2. "고유 ID 변경하기" 버튼 클릭
3. 새로운 ID 입력 (실시간 유효성 검사 + 중복 체크)
4. "변경하기" 버튼 클릭
5. QR 코드 자동 재생성

---

## 고유 ID 규칙

- **길이**: 3~20자
- **허용 문자**: 영문 소문자, 숫자, 언더바(_)
- **첫 글자**: 반드시 영문
- **중복**: 불가능 (전체 사용자 중 유일)

**올바른 예시:**
- `hong_gildong`
- `john_kim`
- `user123`
- `mindflow_user`

**잘못된 예시:**
- `_hong` (첫 글자가 영문 아님)
- `Hong` (대문자 불가)
- `홍길동` (한글 불가)
- `a` (3자 미만)

---

## 에러 처리

### Firebase 연결 실패

Firebase 오류가 발생해도 Google 로그인은 정상적으로 완료됩니다.

```javascript
catch (firebaseError) {
    console.error('❌ Firebase 처리 중 오류:', firebaseError);
    // Google 로그인은 계속 진행
}
```

사용자는 나중에 프로필 페이지에서 수동으로 고유 ID를 설정할 수 있습니다.

### 중복 ID 생성 실패

5번 재시도 후에도 고유한 ID를 생성하지 못하면:
- Firestore에 기본 ID 없이 저장
- 사용자가 프로필 페이지에서 직접 설정

---

## 테스트 시나리오

### 시나리오 1: 신규 사용자 첫 로그인

```
1. 앱 실행 → 로그인 버튼 클릭
2. Google 계정 선택: hong@gmail.com
3. 로그인 성공 토스트: "✓ 로그인되었습니다"
4. 콘솔 확인:
   🔥 Firebase 익명 로그인 성공: abc123...
   ✅ 고유 ID 생성 완료: hong_a3f2
5. 프로필 페이지 확인 → "협업 고유 ID" 섹션
6. 고유 ID 표시: @hong_a3f2
7. QR 코드 자동 생성됨
```

### 시나리오 2: 기존 사용자 재로그인

```
1. 앱 실행 → 로그인 버튼 클릭
2. Google 계정 선택: hong@gmail.com
3. 로그인 성공 토스트: "✓ 로그인되었습니다"
4. 콘솔 확인:
   ✅ 기존 사용자 로그인: hong_gildong
5. 프로필 페이지 확인
6. 기존 고유 ID 표시: @hong_gildong
7. 기존 QR 코드 로드됨
```

### 시나리오 3: ID 변경

```
1. 프로필 페이지 → "협업 고유 ID" 섹션
2. "고유 ID 변경하기" 클릭
3. 새 ID 입력: hong_gildong
4. 실시간 유효성 검사:
   - ✅ 3~20자
   - ✅ 영문 소문자/숫자/언더바
   - ✅ 첫 글자 영문
   - ⏳ 중복 확인 중...
   - ✅ 사용 가능한 ID입니다!
5. "변경하기" 버튼 클릭
6. 성공 토스트: "고유 ID가 변경되었습니다!"
7. QR 코드 자동 재생성
```

---

## 주의사항

### 1. Firebase Authentication 설정

Firebase Console에서 **익명 인증**이 활성화되어 있어야 합니다:

```
Firebase Console → Authentication → Sign-in method → Anonymous → 사용 설정
```

### 2. Firestore Security Rules

다음 규칙이 설정되어 있어야 합니다:

```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

### 3. 고유 ID 인덱스

Firestore에 `uniqueId` 필드 인덱스를 생성하세요 (중복 체크 성능 향상):

```
Firebase Console → Firestore Database → 색인 → 복합 색인 추가
컬렉션: users
필드: uniqueId (오름차순)
```

---

## 디버깅

### 콘솔 로그 확인

```javascript
// 성공 시
🔥 Firebase 익명 로그인 성공: abc123xyz
✅ 고유 ID 생성 완료: hong_gildong_a3f2

// 기존 사용자
✅ 기존 사용자 로그인: hong_gildong

// 에러 시
❌ Firebase 처리 중 오류: [error details]
```

### Firestore 확인

```
Firebase Console → Firestore Database → users 컬렉션

문서 구조:
users/
  ├─ {uid}/
  │   ├─ uniqueId: "hong_gildong_a3f2"
  │   ├─ displayName: "홍길동"
  │   ├─ email: "hong@gmail.com"
  │   ├─ photoURL: "https://..."
  │   ├─ createdAt: "2025-01-20T..."
  │   └─ updatedAt: "2025-01-20T..."
```

---

## 관련 파일

- [App.jsx](src/App.jsx) - 로그인 처리 및 자동 ID 생성
- [userIdService.js](src/services/userIdService.js) - ID 생성/검증 로직
- [ProfilePage.jsx](src/components/ProfilePage.jsx) - ID 표시 및 변경 UI
- [ChangeUniqueIdModal.jsx](src/components/collaboration/ChangeUniqueIdModal.jsx) - ID 변경 모달

---

**완료! 이제 로그인만 하면 자동으로 고유 ID가 생성됩니다! 🎉**
