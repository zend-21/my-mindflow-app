# 관리자 시스템 사용 가이드

## 📋 목차
1. [시스템 개요](#시스템-개요)
2. [초기 설정](#초기-설정)
3. [관리자 권한](#관리자-권한)
4. [사용 방법](#사용-방법)
5. [주요 기능](#주요-기능)

---

## 시스템 개요

ShareNote의 관리자 시스템은 2단계 권한 구조를 가지고 있습니다:

- **최고 관리자 (Super Admin)**: 1명, 모든 권한 보유
- **부관리자 (Sub Admin)**: 최대 3명, 선택적 권한 부여

---

## 초기 설정

### 1. 최고 관리자 ShareNote 아이디 설정

`src/services/adminManagementService.js` 파일을 열어 최고 관리자의 ShareNote 아이디를 설정합니다:

```javascript
// 18번째 줄
export const SUPER_ADMIN_SHARENOTE_ID = 'YOUR_ADMIN_ID_HERE';
```

**예시:**
```javascript
export const SUPER_ADMIN_SHARENOTE_ID = 'WSHGZ3';  // 본인의 ShareNote 아이디 (ws- 접두사 없이)
```

> ✅ **간단함**: Firebase UID 대신 ShareNote 아이디 사용
>
> ✅ **안전함**: ShareNote 아이디는 중복 불가 & 변경 불가
>
> ✅ **편리함**: `ws-` 접두사 자동 추가 - 'WSHGZ3' 입력 시 자동으로 'ws-WSHGZ3'로 검색

### 2. Firestore Rules 배포

터미널에서 다음 명령어 실행:

```bash
firebase deploy --only firestore:rules
```

---

## 관리자 권한

### 최고 관리자 권한
- ✅ 전체 문의 보기
- ✅ 문의 답변하기
- ✅ 문정 (문의 답변 수정)
- ✅ 문의 삭제
- ✅ 새 문의 알림 받기
- ✅ **부관리자 지정 및 관리**

### 부관리자 권한 (선택 가능)

| 권한 | 설명 | 코드 |
|------|------|------|
| 전체 문의 보기 | 모든 사용자의 문의 내역 조회 | `VIEW_ALL` |
| 문의 답변하기 | 문의에 답변 작성 (알림 권한 자동 포함) | `REPLY` |
| 문정 | 작성된 문의 답변 수정 | `EDIT` |
| 문의 삭제 | 문의 삭제 | `DELETE` |
| 새 문의 알림 받기 | 새 문의 등록 시 알림 | `NOTIFICATIONS` |

> **참고**: `답변하기` 권한을 부여하면 `알림 받기` 권한이 자동으로 추가됩니다.

---

## 사용 방법

### A. 최고 관리자로 로그인 후

#### 1. 관리자 페이지 접근

**자동으로 사이드 메뉴에 표시됩니다!**

- ShareNote 아이디 `WSHGZ3`로 로그인
- 좌측 햄버거 메뉴 클릭
- **"최고 관리자"** 메뉴가 자동으로 표시됨
- 새 문의가 있으면 빨간 배지로 개수 표시
- **"부관리자 관리"** 메뉴도 함께 표시됨

**기능:**
- **최고 관리자 메뉴**: 모든 사용자 문의 조회 및 답변
- **부관리자 관리 메뉴**: 부관리자 추가/제거/권한 수정

### B. 부관리자로 로그인 시

**부관리자도 사이드 메뉴에 자동 표시됩니다!**

- 부관리자로 지정된 계정으로 로그인
- 좌측 햄버거 메뉴 클릭
- **"부관리자"** 메뉴가 표시됨 (파란색 배경)
- 새 문의가 있으면 빨간 배지로 개수 표시
- **"부관리자 관리"** 메뉴는 표시되지 않음 (최고 관리자 전용)

**제한:**
- 부관리자는 부관리자 관리 불가
- 부여받은 권한만 사용 가능

---

#### 2. 부관리자 추가하기

1. 사이드 메뉴에서 **부관리자 관리** 클릭
2. **사용자 UID** 입력
   - Firebase Console > Authentication에서 추가할 사용자의 UID 복사
   - 또는 앱의 사용자 목록에서 UID 확인
3. **권한 선택**
   - 체크박스로 원하는 권한 선택
   - `답변하기` 선택 시 `알림 받기` 자동 선택됨
4. **부관리자 추가** 버튼 클릭

#### 3. 부관리자 권한 수정

1. 부관리자 목록에서 **설정(⚙️)** 아이콘 클릭
2. 권한 체크박스 수정
3. **체크(✓)** 아이콘 클릭하여 저장

#### 4. 부관리자 제거

1. 부관리자 목록에서 **휴지통(🗑️)** 아이콘 클릭
2. 확인 모달에서 **제거** 버튼 클릭

---

## 주요 기능

### 1. 문의 관리 패널 (AdminInquiryPanel)

**기능:**
- 📊 전체 문의 통계 (전체, 답변 대기, 답변 완료, 해결 완료)
- 🔍 문의 검색 (제목, 내용, 사용자명, 이메일)
- 🎯 상태별 필터링
- 👁️ 문의 상세 보기
- 💬 실시간 문의 업데이트
- 🔔 읽지 않은 알림 개수 표시

**접근 조건:**
- 최고 관리자: 항상 접근 가능
- 부관리자: `VIEW_ALL` 권한 필요

### 2. 부관리자 관리 (AdminManagement)

**기능:**
- ➕ 부관리자 추가 (최대 3명)
- ⚙️ 권한 수정
- 🗑️ 부관리자 제거
- 📋 부관리자 목록 조회

**접근 조건:**
- 최고 관리자만 접근 가능

### 3. 알림 시스템

**동작:**
1. 사용자가 새 문의 등록
2. `NOTIFICATIONS` 권한이 있는 모든 관리자에게 알림 전송
3. 알림은 `users/{userId}/notifications` 컬렉션에 저장
4. 실시간으로 읽지 않은 알림 개수 표시

**알림 데이터 구조:**
```javascript
{
  type: 'new_inquiry',
  title: '새로운 문의가 등록되었습니다',
  message: '{사용자명}님이 "{문의제목}" 문의를 등록했습니다.',
  inquiryId: 'inquiry_id',
  userId: 'user_id',
  read: false,
  createdAt: Timestamp
}
```

---

## 코드 예시

### 관리자 확인

```javascript
import { checkAdminStatus, hasPermission, PERMISSIONS } from './services/adminManagementService';

// 관리자 상태 확인
const status = await checkAdminStatus(userId);
console.log(status);
// {
//   isAdmin: true,
//   isSuperAdmin: false,
//   permissions: ['view_all', 'reply', 'notifications']
// }

// 특정 권한 확인
const canReply = await hasPermission(userId, PERMISSIONS.REPLY);
if (canReply) {
  // 답변 작성 UI 표시
}
```

### 문의 목록 조회

```javascript
import { getAllInquiries } from './services/adminInquiryService';

// 모든 문의 조회 (관리자 전용)
const inquiries = await getAllInquiries();
console.log(inquiries);
// [
//   {
//     id: 'inquiry_id',
//     userId: 'user_id',
//     userDisplayName: '사용자명',
//     userEmail: 'user@example.com',
//     title: '문의 제목',
//     content: '문의 내용',
//     category: '기능 문의',
//     status: 'pending',
//     createdAt: Date,
//     updatedAt: Date
//   },
//   ...
// ]
```

---

## 주의사항

⚠️ **보안 주의사항:**

1. **최고 관리자 UID 노출 방지**
   - `.env` 파일에 보관 권장
   - Git에 커밋하지 않도록 주의

2. **Firestore Rules 강화**
   - `systemConfig` 컬렉션의 쓰기 권한을 최고 관리자 UID로 제한
   - 현재는 모든 로그인 사용자가 쓰기 가능 (임시)

3. **부관리자 UID 확인**
   - 신뢰할 수 있는 사용자만 부관리자로 지정
   - UID가 정확한지 반드시 확인

4. **권한 최소화 원칙**
   - 필요한 권한만 부여
   - 정기적으로 권한 검토

---

## 트러블슈팅

### Q1: "부관리자 추가에 실패했습니다" 오류

**원인:**
- 최대 3명 초과
- 이미 부관리자로 등록됨
- 최고 관리자를 부관리자로 지정

**해결:**
1. 현재 부관리자 수 확인
2. 중복 여부 확인
3. 최고 관리자가 아닌 다른 사용자 UID 사용

### Q2: 알림이 오지 않음

**원인:**
- `NOTIFICATIONS` 권한이 없음
- Firestore Rules 미배포

**해결:**
1. 부관리자 권한에 `알림 받기` 포함 확인
2. `firebase deploy --only firestore:rules` 실행
3. `users/{userId}/notifications` 컬렉션 권한 확인

### Q3: 문의 목록이 보이지 않음

**원인:**
- `VIEW_ALL` 권한이 없음
- 관리자가 아님

**해결:**
1. 관리자 상태 확인: `checkAdminStatus(userId)`
2. 권한 확인 후 필요시 최고 관리자에게 요청

---

## 다음 단계

1. ✅ 최고 관리자 UID 설정
2. ✅ Firestore Rules 배포
3. ✅ UI에 관리자 버튼 추가
4. ✅ 부관리자 추가 및 권한 설정
5. ✅ 문의 시스템 테스트

---

## 문의

시스템 관련 문의나 버그 제보는 개발팀에게 연락주세요.
