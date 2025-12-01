// Firestore에서 base64 이미지를 포함한 캘린더 데이터 정리 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAkgh7RiRkgc_9A2ovgnCcgtCckVnxv95I",
  authDomain: "mindflow-app-379c7.firebaseapp.com",
  projectId: "mindflow-app-379c7",
  storageBucket: "mindflow-app-379c7.firebasestorage.app",
  messagingSenderId: "652517048202",
  appId: "1:652517048202:web:1c9a21cf98e57e28325273"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanBase64ImagesFromCalendar() {
  console.log('🧹 Firestore 캘린더에서 base64 이미지 정리 시작...\n');

  try {
    // 모든 사용자 문서 가져오기
    const usersSnapshot = await getDocs(collection(db, 'users'));

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`\n👤 사용자: ${userId}`);

      // 캘린더 컬렉션 가져오기
      const calendarRef = collection(db, 'users', userId, 'calendar');
      const calendarSnapshot = await getDocs(calendarRef);

      let deletedCount = 0;
      let cleanedCount = 0;

      for (const calendarDoc of calendarSnapshot.docs) {
        const dateKey = calendarDoc.id;
        const data = calendarDoc.data();

        if (data.text && data.text.includes('data:image')) {
          console.log(`  📅 ${dateKey}: base64 이미지 발견!`);

          // base64 이미지 제거
          const cleanedText = data.text.replace(/<img[^>]*src="data:image[^"]*"[^>]*>/gi, '[이미지 제거됨]');

          // 텍스트가 비어있거나 의미없는 내용만 남았으면 삭제
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = cleanedText;
          const textContent = tempDiv.textContent || tempDiv.innerText || '';

          if (!textContent.trim() || textContent.trim() === '[이미지 제거됨]') {
            // 문서 삭제
            await deleteDoc(doc(db, 'users', userId, 'calendar', dateKey));
            console.log(`    ❌ 삭제됨 (의미있는 내용 없음)`);
            deletedCount++;
          } else {
            // 텍스트만 업데이트
            await updateDoc(doc(db, 'users', userId, 'calendar', dateKey), {
              text: cleanedText,
              updatedAt: new Date()
            });
            console.log(`    ✅ 정리됨 (텍스트 유지)`);
            cleanedCount++;
          }
        }
      }

      if (deletedCount + cleanedCount > 0) {
        console.log(`  📊 ${userId} 결과: ${cleanedCount}개 정리, ${deletedCount}개 삭제`);
      } else {
        console.log(`  ✓ base64 이미지 없음`);
      }
    }

    console.log('\n✅ 정리 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

cleanBase64ImagesFromCalendar();
