# 🛡️ MindFlow 앱 보안 가이드

## 보안 개요

이 문서는 MindFlow 협업 시스템의 보안 조치들을 설명합니다. 악의적인 사용자로부터 시스템과 사용자 데이터를 보호하기 위해 다층 방어 전략을 구현했습니다.

---

## 1. XSS (Cross-Site Scripting) 방어

### 구현된 보호 조치:

#### ✅ DOMPurify 살균 라이브러리
- **위치**: `src/utils/securityUtils.js`
- **기능**: 모든 HTML 태그와 스크립트를 제거
- **적용 대상**:
  - 메모 내용
  - 채팅 메시지
  - 사용자 이름
  - 방 제목

```javascript
import { validateAndSanitize } from '../utils/securityUtils';

// 사용 예시
const validation = validateAndSanitize(userInput, 'memo');
if (validation.isValid) {
  // 안전한 콘텐츠 사용
  saveToDatabase(validation.sanitized);
}
```

#### ✅ 악성 패턴 감지
자동으로 차단되는 패턴들:
- `<script>` 태그
- `javascript:` 프로토콜
- `onerror=`, `onclick=` 등 이벤트 핸들러
- `eval()`, `expression()` 함수
- `<iframe>`, `<embed>`, `<object>` 태그
- `data:text/html` URI

### 방어 레벨:

1. **입력 단계**: 사용자 입력 즉시 검증
2. **저장 단계**: Firebase 저장 전 살균
3. **출력 단계**: React가 자동으로 이스케이프 처리

---

## 2. 인젝션 공격 방어

### SQL/NoSQL 인젝션 방어
- Firebase Firestore는 자동으로 파라미터화된 쿼리 사용
- 추가로 특수문자 필터링 적용

### 코드 인젝션 방어
- `eval()`, `Function()` 사용 금지
- 동적 코드 실행 차단
- 특수문자 이스케이프 처리

---

## 3. Rate Limiting (요청 제한)

### 클라이언트 측 Rate Limiting

#### 메시지 전송 제한
- **제한**: 1분에 10개 메시지
- **목적**: 채팅 도배 방지

#### 방 생성 제한
- **제한**: 5분에 5개 방
- **목적**: 서버 부하 방지

#### 초대 전송 제한
- **제한**: 1분에 20개 초대
- **목적**: 스팸 초대 방지

```javascript
import { messageLimiter } from '../utils/securityUtils';

if (!messageLimiter.allowRequest(userId)) {
  throw new Error('메시지를 너무 빠르게 보내고 있습니다.');
}
```

### 서버 측 Rate Limiting (권장)
프로덕션 환경에서는 Firebase Functions 또는 Cloud Run에서 추가적인 서버 측 제한을 구현하세요.

---

## 4. 입력 검증 및 크기 제한

### 콘텐츠 크기 제한
- **메모 내용**: 최대 100KB
- **채팅 메시지**: 최대 10KB
- **사용자 이름**: 최대 100바이트

### 배열 크기 제한
- **초대 친구 수**: 최대 50명/1회

### 문자열 검증
- **이메일**: RFC 5322 형식
- **사용자 ID**: 알파벳, 숫자, 하이픈, 언더스코어만 허용 (최대 128자)
- **URL**: HTTPS만 허용 (개발 시 localhost HTTP 허용)

---

## 5. Firebase Security Rules

### Firestore 보안 규칙 (`firestore.rules`)

```javascript
// 협업방 예시
match /collaborationRooms/{roomId} {
  // 생성: 로그인 + 크기 검증
  allow create: if isSignedIn()
    && isValidSize(request.resource.data.memoContent);

  // 읽기: 참여자만
  allow read: if isSignedIn() &&
    request.auth.uid in resource.data.participants.map(p => p.userId);

  // 수정: 방장 또는 편집 권한이 있는 사용자
  allow update: if isSignedIn() && (
    request.auth.uid == resource.data.ownerId ||
    hasEditPermission()
  );

  // 삭제: 방장만
  allow delete: if isSignedIn() &&
    request.auth.uid == resource.data.ownerId;
}
```

### 규칙 배포 방법

1. Firebase CLI 설치:
```bash
npm install -g firebase-tools
```

2. 로그인:
```bash
firebase login
```

3. 프로젝트 초기화:
```bash
firebase init firestore
```

4. 규칙 배포:
```bash
firebase deploy --only firestore:rules
```

---

## 6. 인증 및 권한 관리

### 사용자 인증
- Firebase Authentication 사용
- 로그인하지 않은 사용자는 모든 작업 차단

### 권한 계층
1. **방장 (Owner)**
   - 방 삭제
   - 편집 권한 부여/제거
   - 방 잠금/잠금 해제
   - 사용자 강퇴 (미구현)

2. **편집 권한자**
   - 메모 내용 수정
   - 채팅 참여

3. **일반 참여자**
   - 메모 읽기
   - 채팅 참여

### 권한 검증
```javascript
// 편집 권한 확인
const canEdit =
  room.ownerId === userId ||
  room.permissions.allCanEdit ||
  room.permissions.editableUsers.includes(userId);

if (!canEdit) {
  throw new Error('편집 권한이 없습니다');
}
```

---

## 7. 데이터 프라이버시

### 개인정보 보호
- 사용자 ID는 Firebase UID 사용 (추측 불가)
- 프로필 사진 URL은 안전한 경로만 허용
- 이메일 주소는 검증 후 저장

### 데이터 접근 제어
- 방 참여자만 채팅 메시지 조회
- 친구 관계가 있는 사용자만 초대 가능
- 본인의 데이터만 수정/삭제 가능

---

## 8. 추가 보안 권장사항

### Content Security Policy (CSP)
`index.html` 또는 서버 설정에 CSP 헤더 추가:

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline' https://apis.google.com;
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;
               connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;">
```

### HTTPS 강제
- 프로덕션 환경에서는 반드시 HTTPS 사용
- HTTP 요청은 HTTPS로 자동 리다이렉트

### 정기적인 보안 업데이트
```bash
# 보안 취약점 검사
npm audit

# 자동 수정
npm audit fix

# 강제 업데이트 (주의: 호환성 확인 필요)
npm audit fix --force
```

### 환경 변수 보호
- `.env` 파일을 `.gitignore`에 추가
- API 키는 환경 변수로 관리
- 프로덕션 키와 개발 키 분리

---

## 9. 보안 체크리스트

### 배포 전 필수 확인 사항

- [ ] Firebase Security Rules 배포 완료
- [ ] DOMPurify가 모든 사용자 입력에 적용됨
- [ ] Rate Limiting이 모든 API 호출에 적용됨
- [ ] HTTPS 강제 설정
- [ ] CSP 헤더 설정
- [ ] 환경 변수가 안전하게 관리됨
- [ ] `npm audit`로 취약점 0개 확인
- [ ] 권한 시스템이 정상 작동
- [ ] 에러 메시지에 민감한 정보 노출 없음
- [ ] 로그에 개인정보 기록 없음

---

## 10. 보안 사고 대응

### 의심스러운 활동 감지 시

1. **즉시 조치**
   - 해당 사용자 계정 일시 정지
   - 관련 세션 강제 종료
   - 로그 수집 및 분석

2. **데이터 격리**
   - 의심스러운 콘텐츠 격리
   - 영향받은 사용자에게 알림

3. **시스템 점검**
   - 보안 규칙 재검토
   - 코드 취약점 분석
   - 패치 적용

4. **사후 조치**
   - 사고 보고서 작성
   - 보안 정책 업데이트
   - 팀원 교육

---

## 11. 개발 가이드라인

### 안전한 코딩 규칙

1. **항상 입력 검증**
```javascript
// ❌ 나쁜 예
await saveMessage(userInput);

// ✅ 좋은 예
const validation = validateAndSanitize(userInput, 'message');
if (!validation.isValid) {
  throw new Error(validation.error);
}
await saveMessage(validation.sanitized);
```

2. **권한 확인 먼저**
```javascript
// ❌ 나쁜 예
await updateRoom(roomId, newData);

// ✅ 좋은 예
if (!canEdit(userId, room)) {
  throw new Error('권한이 없습니다');
}
await updateRoom(roomId, newData);
```

3. **에러 메시지 주의**
```javascript
// ❌ 나쁜 예
throw new Error(`User ${email} not found in database table users`);

// ✅ 좋은 예
throw new Error('사용자를 찾을 수 없습니다');
```

---

## 문의

보안 취약점 발견 시: [보안 담당자 이메일]
일반 문의: [일반 문의 이메일]

**⚠️ 보안 취약점은 공개 이슈에 올리지 마세요!**
