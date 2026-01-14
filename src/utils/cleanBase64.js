// 브라우저 콘솔에서 실행할 base64 이미지 정리 스크립트
// Firestore 인증된 상태에서 실행하면 됩니다

import { db, auth } from '../firebase/config';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { showAlert } from './alertModal';

export async function cleanBase64FromCalendar() {
  const user = auth.currentUser;
  if (!user) {
    console.error('❌ 로그인이 필요합니다!');
    return;
  }

  const userId = user.uid;
  console.log('🧹 캘린더에서 base64 이미지 정리 시작...\n');

  try {
    const calendarRef = collection(db, 'users', userId, 'calendar');
    const snapshot = await getDocs(calendarRef);

    let deletedCount = 0;

    for (const docSnap of snapshot.docs) {
      const dateKey = docSnap.id;
      const data = docSnap.data();

      if (data.text && data.text.includes('data:image')) {
        console.log(`📅 ${dateKey}: base64 이미지 발견 - 삭제 중...`);

        // 문서 전체 삭제
        await deleteDoc(doc(db, 'users', userId, 'calendar', dateKey));
        deletedCount++;
      }
    }

    console.log(`\n✅ 완료! ${deletedCount}개 날짜 데이터 삭제됨`);

    // localStorage도 정리
    localStorage.removeItem('firestore_saved_calendar_all');
    localStorage.removeItem('calendarSchedules_shared');
    console.log('✅ localStorage 캘린더 데이터도 정리됨');

    showAlert(`정리 완료! ${deletedCount}개 날짜의 base64 이미지 데이터를 삭제했습니다. 페이지를 새로고침하세요.`, '정리 완료', () => {
      window.location.reload();
    });

  } catch (error) {
    console.error('❌ 오류:', error);
    showAlert('오류가 발생했습니다: ' + error.message, '오류');
  }
}

/**
 * localStorage에서 손상된 메모(id가 없거나 undefined인 메모) 정리
 */
export function cleanInvalidMemos() {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) {
    console.error('❌ userId를 찾을 수 없습니다');
    return;
  }

  const memosKey = `user_${userId}_memos`;
  const memosRaw = localStorage.getItem(memosKey);

  if (!memosRaw) {
    console.log('📭 저장된 메모가 없습니다');
    return;
  }

  try {
    const memos = JSON.parse(memosRaw);
    const beforeCount = memos.length;

    const validMemos = memos.filter((memo, index) => {
      if (!memo) {
        console.log(`🗑️ 인덱스 ${index}: null/undefined 메모 제거`);
        return false;
      }
      if (!memo.id) {
        console.log(`🗑️ 인덱스 ${index}: id 없는 메모 제거`, memo);
        return false;
      }
      if (typeof memo.id !== 'string') {
        console.log(`🗑️ 인덱스 ${index}: id가 문자열이 아닌 메모 제거`, memo);
        return false;
      }
      return true;
    });

    const removedCount = beforeCount - validMemos.length;
    localStorage.setItem(memosKey, JSON.stringify(validMemos));

    console.log(`✅ 정리 완료: ${removedCount}개 손상된 메모 제거됨 (${beforeCount} → ${validMemos.length})`);

    if (removedCount > 0) {
      showAlert(`${removedCount}개의 손상된 메모 데이터를 정리했습니다. 페이지를 새로고침하세요.`, '정리 완료', () => {
        window.location.reload();
      });
    } else {
      showAlert('손상된 메모가 없습니다.', '확인');
    }
  } catch (error) {
    console.error('❌ 메모 정리 실패:', error);
  }
}

// 브라우저 콘솔에서 사용할 수 있도록 window에 추가
if (typeof window !== 'undefined') {
  window.cleanBase64FromCalendar = cleanBase64FromCalendar;
  window.cleanInvalidMemos = cleanInvalidMemos;
}
