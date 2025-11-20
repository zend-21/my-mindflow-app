# QR 코드 친구 추가 기능

프로필 페이지에 고유 ID 기반 QR 코드 시스템이 추가되었습니다.

---

## 기능 개요

사용자가 자신의 고유 ID를 QR 코드로 공유하고, 다른 사용자의 QR 코드를 스캔하여 바로 친구 추가할 수 있는 기능입니다.

---

## 사용 방법

### 1. 프로필 페이지 접속

1. 상단 프로필 아이콘 클릭
2. "👥 협업 고유 ID" 섹션 확장
3. 내 고유 ID 및 QR 코드 확인

### 2. QR 코드 공유하기

**방법 1: QR 코드 다운로드**
- "QR 다운로드" 버튼 클릭
- QR 코드 이미지 파일 저장
- 카카오톡이나 다른 메신저로 전송

**방법 2: ID 직접 복사**
- ID 옆의 복사 아이콘 클릭
- 클립보드에 복사된 ID를 공유

### 3. QR 코드 스캔하기

1. "QR 스캔" 버튼 클릭
2. 카메라 권한 허용
3. 상대방의 QR 코드를 카메라에 비추기
4. 자동으로 사용자 정보 표시
5. "친구 요청 보내기" 버튼 클릭

### 4. 고유 ID 변경하기

1. "고유 ID 변경하기" 버튼 클릭
2. 새로운 ID 입력 (3-20자, 영문 소문자/숫자/언더바)
3. 실시간 중복 체크 확인
4. "변경하기" 버튼 클릭
5. QR 코드 자동 재생성

---

## 기술 구현

### 사용된 라이브러리

```bash
npm install qrcode
```

- **qrcode**: QR 코드 이미지 생성
- **lucide-react**: 아이콘 (Copy, QrCode, Share2, Scan)

### 주요 컴포넌트

#### 1. ProfilePage.jsx
- 고유 ID 표시
- QR 코드 생성 및 표시
- ID 변경 및 QR 스캔 모달 열기

#### 2. ChangeUniqueIdModal.jsx
- 고유 ID 변경 UI
- 실시간 유효성 검사
- 중복 체크 with 스피너/체크 아이콘

#### 3. QRScanner.jsx (신규)
- 카메라 접근
- QR 코드 스캔 (현재 기본 구현)
- 친구 요청 전송

### 데이터 흐름

```
1. Firebase에서 사용자 uniqueId 로드
   ↓
2. QR 코드 이미지 생성 (qrcode 라이브러리)
   ↓
3. QR 코드 다운로드 시: Data URL → 이미지 파일
   ↓
4. QR 스캔 시: 이미지 → uniqueId 추출 → Firebase 검색
   ↓
5. 친구 요청 전송 (collaborationService)
```

### Firebase 연동

**필요한 Firestore 구조:**

```javascript
// users 컬렉션
{
  uid: "user123",
  uniqueId: "hong_gildong",
  displayName: "홍길동",
  email: "hong@example.com",
  ...
}

// friendships 컬렉션 (친구 요청)
{
  fromUserId: "user123",
  toUserId: "user456",
  status: "pending",
  createdAt: timestamp
}
```

---

## 코드 예시

### QR 코드 생성

```javascript
import QRCode from 'qrcode';

const generateQRCode = async (uniqueId) => {
  const qrUrl = await QRCode.toDataURL(uniqueId, {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  return qrUrl;
};
```

### QR 코드 스캔 (기본 구현)

```javascript
// 현재는 수동 입력 방식
// 실제 QR 스캔을 위해서는 jsQR 또는 @zxing/library 권장

import jsQR from 'jsqr';

const scanQRCode = (imageData) => {
  const code = jsQR(
    imageData.data,
    imageData.width,
    imageData.height
  );

  if (code) {
    return code.data; // uniqueId
  }
  return null;
};
```

---

## 향후 개선 사항

### 단기 (필수)

- [ ] jsQR 라이브러리 통합하여 실제 QR 스캔 기능 완성
- [ ] 카메라 전환 (전면/후면) 지원
- [ ] QR 스캔 실패 시 수동 입력 옵션 제공

### 중기 (권장)

- [ ] 카카오톡 SDK 통합하여 직접 공유 기능
- [ ] QR 코드 디자인 커스터마이징 (색상, 로고)
- [ ] QR 코드 만료 시간 설정 (보안)

### 장기 (선택)

- [ ] 다이나믹 링크 (딥링크) 지원
  - QR 코드 스캔 시 앱이 없으면 스토어로 이동
  - 앱 설치 후 자동으로 친구 추가 화면 열림
- [ ] NFC 태그 지원 (모바일 전용)
- [ ] 그룹 초대 QR 코드

---

## 보안 고려사항

### 현재 구현

✅ 고유 ID는 중복 불가
✅ Firebase Security Rules로 접근 제어
✅ 친구 요청은 양방향 승인 필요

### 추가 권장 사항

⚠️ **QR 코드 만료**: 일정 시간 후 QR 코드 무효화
⚠️ **스캔 로그**: 누가 언제 내 QR을 스캔했는지 기록
⚠️ **차단 기능**: 특정 사용자의 친구 요청 차단

---

## 테스트 시나리오

### 테스트 1: QR 코드 생성
1. 로그인 후 프로필 페이지 열기
2. "협업 고유 ID" 섹션 확장
3. QR 코드가 표시되는지 확인
4. ID 변경 후 QR 코드 재생성 확인

### 테스트 2: QR 코드 다운로드
1. "QR 다운로드" 버튼 클릭
2. 이미지 파일이 다운로드되는지 확인
3. 다운로드된 이미지가 올바른 QR 코드인지 확인

### 테스트 3: QR 스캔 (추후)
1. 두 개의 계정으로 로그인
2. A 계정의 QR 코드를 B 계정으로 스캔
3. 친구 요청이 전송되는지 확인
4. A 계정에서 요청 수락
5. 친구 목록에 추가되는지 확인

---

## 문제 해결

### Q: QR 코드가 생성되지 않아요
A:
- Firebase에 uniqueId가 설정되어 있는지 확인
- "고유 ID 변경하기"로 ID를 먼저 설정하세요

### Q: QR 스캔이 작동하지 않아요
A:
- 카메라 권한이 허용되어 있는지 확인
- HTTPS 환경에서만 카메라 접근 가능
- 현재는 기본 구현이므로 jsQR 라이브러리 추가 필요

### Q: 친구 요청이 전송되지 않아요
A:
- 인터넷 연결 확인
- Firebase Authentication 로그인 상태 확인
- Firestore Security Rules 설정 확인

---

## 파일 구조

```
src/
├── components/
│   ├── ProfilePage.jsx (수정됨) - QR 코드 UI 추가
│   └── collaboration/
│       ├── ChangeUniqueIdModal.jsx (기존)
│       ├── QRScanner.jsx (신규)
│       ├── ImprovedFriendsModal.jsx (기존)
│       └── ...
├── services/
│   ├── userIdService.js (기존) - ID 검증 및 관리
│   └── collaborationService.js (기존) - 친구 요청
└── firebase/
    └── config.js (기존)
```

---

## 참고 자료

- [qrcode 라이브러리 문서](https://github.com/soldair/node-qrcode)
- [jsQR 라이브러리](https://github.com/cozmo/jsQR)
- [Kakao SDK - 메시지 API](https://developers.kakao.com/docs/latest/ko/message/js)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

## 변경 이력

### 2025-01-XX
- ✅ ProfilePage에 "협업 고유 ID" 섹션 추가
- ✅ QR 코드 생성 기능 구현
- ✅ QR 코드 다운로드 기능 구현
- ✅ QRScanner 컴포넌트 생성 (기본 UI)
- ✅ ChangeUniqueIdModal 연동
- ⏳ jsQR 라이브러리 통합 (대기 중)

---

**Happy Collaborating! 🎉**
