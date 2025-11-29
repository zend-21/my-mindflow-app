// 일회성 스크립트: 수정된 적 없는 메모의 updatedAt 필드 제거
// 실행 방법: node fix-updated-at.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteField } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDSwnSKd9dfQtJHAuNJTqa31HqYNLtxKC0",
  authDomain: "mindflow-72008.firebaseapp.com",
  projectId: "mindflow-72008",
  storageBucket: "mindflow-72008.firebasestorage.app",
  messagingSenderId: "529813935972",
  appId: "1:529813935972:web:29ef2df31a81d07c9f1a5c",
  measurementId: "G-VCJC0PNYMQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixUpdatedAt() {
  try {
    console.log('🔍 사용자 검색 중...');

    // mindflowUsers 컬렉션의 모든 사용자 가져오기
    const usersSnapshot = await getDocs(collection(db, 'mindflowUsers'));

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`\n👤 사용자: ${userId}`);

      // 해당 사용자의 모든 메모 가져오기
      const memosRef = collection(db, 'mindflowUsers', userId, 'memos');
      const memosSnapshot = await getDocs(memosRef);

      let fixed = 0;
      let skipped = 0;

      for (const memoDoc of memosSnapshot.docs) {
        const data = memoDoc.data();

        // createdAt과 updatedAt이 모두 존재하는지 확인
        if (data.createdAt && data.updatedAt) {
          const createdAt = data.createdAt.toMillis ? data.createdAt.toMillis() : data.createdAt;
          const updatedAt = data.updatedAt.toMillis ? data.updatedAt.toMillis() : data.updatedAt;

          // updatedAt이 createdAt과 거의 동일하면 (5초 이내) 제거
          const diff = Math.abs(updatedAt - createdAt);

          if (diff < 5000) { // 5초 이내
            console.log(`  ✅ 메모 ${memoDoc.id}: updatedAt 제거 (차이: ${diff}ms)`);
            const memoRef = doc(db, 'mindflowUsers', userId, 'memos', memoDoc.id);
            await updateDoc(memoRef, {
              updatedAt: deleteField()
            });
            fixed++;
          } else {
            skipped++;
          }
        } else if (data.updatedAt && !data.createdAt) {
          // createdAt 없이 updatedAt만 있는 경우도 제거
          console.log(`  ✅ 메모 ${memoDoc.id}: updatedAt 제거 (createdAt 없음)`);
          const memoRef = doc(db, 'mindflowUsers', userId, 'memos', memoDoc.id);
          await updateDoc(memoRef, {
            updatedAt: deleteField()
          });
          fixed++;
        } else {
          skipped++;
        }
      }

      console.log(`  📊 수정: ${fixed}개, 건너뜀: ${skipped}개`);
    }

    console.log('\n✅ 마이그레이션 완료!');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

fixUpdatedAt();
