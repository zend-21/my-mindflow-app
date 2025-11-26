// 특정 닉네임 삭제 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

// .env.local 파일 로드
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteNicknameByName(nickname) {
  try {
    console.log(`닉네임 '${nickname}' 검색 중...`);

    const nicknamesRef = collection(db, 'nicknames');
    const q = query(nicknamesRef, where('nickname', '==', nickname));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`❌ 닉네임 '${nickname}'을 찾을 수 없습니다.`);
      return;
    }

    console.log(`✅ 닉네임 '${nickname}' 발견! 삭제 중...`);

    for (const docSnapshot of querySnapshot.docs) {
      console.log(`  - 문서 ID: ${docSnapshot.id}`);
      console.log(`  - 데이터:`, docSnapshot.data());
      await deleteDoc(docSnapshot.ref);
      console.log(`  ✅ 삭제 완료`);
    }

    console.log(`\n🎉 닉네임 '${nickname}' 삭제 성공!`);
  } catch (error) {
    console.error('❌ 삭제 중 오류 발생:', error);
  }
}

// 닉네임 'M' 삭제
deleteNicknameByName('M')
  .then(() => {
    console.log('\n스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('스크립트 실행 실패:', error);
    process.exit(1);
  });
