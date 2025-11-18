# Firebase 설정 가이드

리뷰 기능을 사용하기 위해서는 Firebase 프로젝트를 설정해야 합니다.

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: my-mindflow-app)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

## 2. 웹 앱 등록

1. Firebase 콘솔에서 프로젝트 선택
2. 프로젝트 설정 > 일반 > "앱 추가" > 웹(</>)  선택
3. 앱 닉네임 입력 (예: My MindFlow Web)
4. Firebase SDK 설정 정보 복사

## 3. Firestore Database 설정

1. Firebase 콘솔에서 "Firestore Database" 선택
2. "데이터베이스 만들기" 클릭
3. 보안 규칙 선택:
   - **테스트 모드**: 개발 중 (30일간 모든 읽기/쓰기 허용)
   - **프로덕션 모드**: 실제 배포 시 (인증된 사용자만 허용)
4. 위치 선택: asia-northeast3 (서울) 권장
5. 데이터베이스 생성 완료

### 보안 규칙 설정 (중요!)

테스트 완료 후 아래 보안 규칙으로 변경하세요:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 리뷰 컬렉션
    match /reviews/{reviewId} {
      // 인증된 사용자만 자신의 리뷰 읽기 가능
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;

      // 인증된 사용자만 리뷰 작성 가능
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;

      // 본인의 리뷰만 수정/삭제 가능
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
\`\`\`

## 4. Storage 설정

1. Firebase 콘솔에서 "Storage" 선택
2. "시작하기" 클릭
3. 보안 규칙 선택:
   - **테스트 모드**: 개발 중
   - **프로덕션 모드**: 실제 배포 시
4. 위치 선택: asia-northeast3 (서울) 권장
5. Storage 활성화 완료

### Storage 보안 규칙 (중요!)

\`\`\`javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /reviews/{userId}/{allPaths=**} {
      // 본인의 폴더에만 업로드 가능
      allow write: if request.auth != null && request.auth.uid == userId;

      // 본인의 파일만 읽기 가능
      allow read: if request.auth != null && request.auth.uid == userId;
    }
  }
}
\`\`\`

## 5. Authentication 설정 (추후 구현)

현재는 임시 사용자 ID를 사용하지만, 추후 인증 기능 추가 시:

1. Firebase 콘솔에서 "Authentication" 선택
2. "시작하기" 클릭
3. 로그인 방법 선택 (이메일/비밀번호, Google 등)
4. 활성화

## 6. 환경 변수 설정

1. 프로젝트 루트에 `.env` 파일 생성
2. `.env.example` 파일 참고하여 Firebase 설정값 입력:

\`\`\`env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
\`\`\`

3. Firebase 콘솔의 "프로젝트 설정" > "일반" > "내 앱"에서 설정값 복사

## 7. 테스트

1. 개발 서버 재시작: `npm run dev`
2. 리뷰 탭으로 이동
3. 리뷰 작성 테스트
4. Firebase 콘솔에서 데이터 확인

## Firebase 무료 요금제 (Spark Plan)

- Firestore: 1GB 저장 / 50K 읽기, 20K 쓰기 per day
- Storage: 5GB 저장 / 1GB 다운로드 per day
- Authentication: 무제한

**참고**: 초기 수백~수천 명 사용자까지 무료로 사용 가능합니다.

## 문제 해결

### Firebase 초기화 오류
- `.env` 파일이 올바른 위치에 있는지 확인
- 환경 변수 이름이 `VITE_` 접두사로 시작하는지 확인
- 개발 서버 재시작

### 권한 오류
- Firestore 보안 규칙 확인
- Storage 보안 규칙 확인
- Authentication이 활성화되어 있는지 확인

### 이미지 업로드 실패
- Storage가 활성화되어 있는지 확인
- Storage 보안 규칙에서 쓰기 권한 확인
- 네트워크 연결 상태 확인
