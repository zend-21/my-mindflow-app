// 브라우저 콘솔에서 실행: localStorage 매크로를 Firestore로 즉시 업로드

(async function restoreMacrosToFirestore() {
  try {
    // 1. localStorage에서 매크로 가져오기
    const macros = JSON.parse(localStorage.getItem('macroTexts') || '[]');
    console.log('📦 localStorage 매크로:', macros);

    if (!macros || macros.length === 0) {
      console.warn('⚠️ localStorage에 매크로가 없습니다.');
      return;
    }

    // 2. 현재 로그인된 사용자 ID 가져오기
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('❌ 로그인된 사용자를 찾을 수 없습니다.');
      return;
    }

    console.log('👤 사용자 ID:', userId);

    // 3. Firestore import (이미 로드되어 있어야 함)
    const { getFirestore, doc, setDoc, serverTimestamp } = window.firebaseImports || {};
    if (!doc || !setDoc) {
      console.error('❌ Firebase가 로드되지 않았습니다. 페이지를 새로고침하고 다시 시도하세요.');
      return;
    }

    // 4. Firestore에 저장
    const db = getFirestore();
    const userDocRef = doc(db, 'mindflowUsers', userId);
    
    await setDoc(userDocRef, {
      macros: {
        items: macros,
        updatedAt: serverTimestamp()
      }
    }, { merge: true });

    console.log('✅ Firestore에 매크로 복원 완료!');
    console.log('📊 저장된 매크로:', macros);
  } catch (error) {
    console.error('❌ 매크로 복원 실패:', error);
  }
})();
