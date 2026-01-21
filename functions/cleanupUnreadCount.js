// cleanupUnreadCount.js
// 모든 채팅방의 레거시 unreadCount.userId 필드를 제거하는 스크립트
//
// 실행 방법:
// 1. Firebase Admin SDK 자격 증명 파일 필요
// 2. node cleanupUnreadCount.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Firebase Admin SDK 키 파일

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function cleanupLegacyUnreadCountFields() {
  console.log('🧹 레거시 unreadCount 필드 정리 시작...\n');

  let totalDMCleaned = 0;
  let totalGroupCleaned = 0;

  try {
    // 1. Direct Messages 정리
    console.log('📧 1:1 채팅방 확인 중...');
    const dmSnapshot = await db.collection('directMessages').get();

    for (const doc of dmSnapshot.docs) {
      const data = doc.data();
      const updates = {};
      let hasLegacyFields = false;

      // unreadCount.userId 형태의 필드 찾기
      for (const key in data) {
        if (key.startsWith('unreadCount.')) {
          updates[key] = admin.firestore.FieldValue.delete();
          hasLegacyFields = true;
          console.log(`  🔴 발견: ${doc.id} - ${key}: ${data[key]}`);
        }
      }

      if (hasLegacyFields) {
        await db.collection('directMessages').doc(doc.id).update(updates);
        totalDMCleaned++;
        console.log(`  ✅ 정리 완료: ${doc.id}\n`);
      }
    }

    console.log(`📊 1:1 채팅방 정리 완료: ${totalDMCleaned}개 방 정리\n`);

    // 2. Group Chats 정리
    console.log('👥 그룹 채팅방 확인 중...');
    const groupSnapshot = await db.collection('groupChats').get();

    for (const doc of groupSnapshot.docs) {
      const data = doc.data();
      const updates = {};
      let hasLegacyFields = false;

      // unreadCount.userId 형태의 필드 찾기
      for (const key in data) {
        if (key.startsWith('unreadCount.')) {
          updates[key] = admin.firestore.FieldValue.delete();
          hasLegacyFields = true;
          console.log(`  🔴 발견: ${doc.id} - ${key}: ${data[key]}`);
        }
      }

      if (hasLegacyFields) {
        await db.collection('groupChats').doc(doc.id).update(updates);
        totalGroupCleaned++;
        console.log(`  ✅ 정리 완료: ${doc.id}\n`);
      }
    }

    console.log(`📊 그룹 채팅방 정리 완료: ${totalGroupCleaned}개 방 정리\n`);

    // 3. 결과 요약
    console.log('🎉 정리 작업 완료!');
    console.log(`  - 1:1 채팅방: ${totalDMCleaned}개 방 정리`);
    console.log(`  - 그룹 채팅방: ${totalGroupCleaned}개 방 정리`);
    console.log(`  - 총 ${totalDMCleaned + totalGroupCleaned}개 방 정리됨\n`);

  } catch (error) {
    console.error('❌ 정리 작업 실패:', error);
  } finally {
    process.exit(0);
  }
}

// 실행
cleanupLegacyUnreadCountFields();
