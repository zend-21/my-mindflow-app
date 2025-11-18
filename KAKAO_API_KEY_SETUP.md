# 카카오맵 API 키 발급 가이드

리뷰 작성 시 가게 자동완성 기능을 사용하려면 카카오 REST API 키가 필요합니다.

## 1. 카카오 개발자 계정 생성

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 우측 상단 "로그인" 클릭
3. 카카오 계정으로 로그인 (없으면 회원가입)

## 2. 애플리케이션 등록

1. 로그인 후 "내 애플리케이션" 클릭
2. "애플리케이션 추가하기" 클릭
3. 앱 정보 입력:
   - **앱 이름**: My MindFlow (원하는 이름)
   - **사업자명**: 개인 (개인 프로젝트)
4. "저장" 클릭

## 3. REST API 키 복사

1. 생성된 앱 클릭
2. "앱 키" 탭에서 **REST API 키** 복사
   ```
   예: 1234567890abcdef1234567890abcdef
   ```

## 4. 플랫폼 설정 (중요!)

1. 좌측 메뉴에서 "플랫폼" 클릭
2. "Web 플랫폼 등록" 클릭
3. 사이트 도메인 입력:
   - 개발: `http://localhost:5173`
   - 배포: 실제 도메인 (예: `https://yourdomain.com`)
4. "저장" 클릭

## 5. 환경 변수 설정

1. 프로젝트 루트의 `.env` 파일 열기 (없으면 생성)
2. 아래 내용 추가:

```env
# 카카오맵 API
VITE_KAKAO_REST_API_KEY=여기에_복사한_REST_API_키_붙여넣기
```

예시:
```env
VITE_KAKAO_REST_API_KEY=1234567890abcdef1234567890abcdef
```

3. 저장 후 개발 서버 재시작:
```bash
npm run dev
```

## 6. 사용량 및 요금

### 무료 할당량
- **검색 API**: 일 300,000건
- **비용**: 완전 무료

### 예상 사용량
- 리뷰 1개 작성 시: 검색 5-10회
- 일 100명 사용 시: 약 500-1000건 (충분함)

## 7. 보안 주의사항

⚠️ **중요:**
- `.env` 파일은 절대 GitHub에 커밋하지 마세요!
- `.gitignore`에 `.env`가 포함되어 있는지 확인하세요
- REST API 키는 클라이언트에서 사용 가능합니다 (보안 문제 없음)

## 문제 해결

### "Invalid API key" 오류
- API 키를 올바르게 복사했는지 확인
- 환경 변수 이름이 `VITE_KAKAO_REST_API_KEY`인지 확인
- 개발 서버를 재시작했는지 확인

### "도메인이 등록되지 않음" 오류
- 카카오 개발자 콘솔 > 플랫폼 > Web에 `http://localhost:5173` 등록 확인

### 검색 결과가 안 나옴
- 네트워크 탭에서 API 요청 확인
- 콘솔 로그 확인

## 참고 자료

- [카카오 로컬 API 문서](https://developers.kakao.com/docs/latest/ko/local/dev-guide)
- [카카오 REST API 인증](https://developers.kakao.com/docs/latest/ko/getting-started/rest-api)
