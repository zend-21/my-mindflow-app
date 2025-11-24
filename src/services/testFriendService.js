// 테스트용 가상 친구 생성 서비스
import { db } from '../firebase/config';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

/**
 * 테스트용 가상 친구 추가
 */
export const addTestFriend = async (myUserId) => {
  try {
    const testFriends = [
      {
        id: 'test-friend-1',
        name: '김테스트',
        email: 'test1@mindflow.app',
        workspaceCode: 'TEST-1234',
        avatar: '👨',
        status: '테스트 계정입니다',
        verified: true
      },
      {
        id: 'test-friend-2',
        name: '이개발',
        email: 'test2@mindflow.app',
        workspaceCode: 'TEST-5678',
        avatar: '👩',
        status: '개발 테스트용',
        verified: false
      },
      {
        id: 'test-friend-3',
        name: '박친구',
        email: 'test3@mindflow.app',
        workspaceCode: 'TEST-9012',
        avatar: '🧑',
        status: '안녕하세요!',
        verified: true
      }
    ];

    const timestamp = Timestamp.now();

    // 모든 테스트 친구 추가
    for (const friend of testFriends) {
      await setDoc(doc(db, 'users', myUserId, 'friends', friend.id), {
        friendId: friend.id,
        friendName: friend.name,
        friendEmail: friend.email,
        friendWorkspaceCode: friend.workspaceCode,
        friendAvatar: friend.avatar,
        friendStatus: friend.status,
        isTestFriend: true, // 테스트 친구 표시
        addedAt: timestamp,
      });

      // 테스트 친구의 users 문서도 생성 (verification 조회용)
      await setDoc(doc(db, 'users', friend.id), {
        email: friend.email,
        displayName: friend.name,
        photoURL: friend.avatar,
        statusMessage: friend.status,
        createdAt: timestamp,
        isTestUser: true
      }, { merge: true });

      // 본인인증 정보 추가 (verified인 경우)
      if (friend.verified) {
        await setDoc(doc(db, 'verifications', friend.id), {
          userId: friend.id,
          verified: true,
          method: 'phone',
          name: friend.name,
          verifiedAt: timestamp,
          isTestData: true
        });
      }
    }

    return {
      success: true,
      message: `${testFriends.length}명의 테스트 친구가 추가되었습니다`
    };
  } catch (error) {
    console.error('테스트 친구 추가 오류:', error);
    return {
      success: false,
      message: '테스트 친구 추가에 실패했습니다'
    };
  }
};

/**
 * 테스트 친구 모두 삭제
 */
export const removeAllTestFriends = async (myUserId) => {
  try {
    const testFriendIds = ['test-friend-1', 'test-friend-2', 'test-friend-3'];

    const { deleteDoc, doc } = await import('firebase/firestore');

    for (const friendId of testFriendIds) {
      await deleteDoc(doc(db, 'users', myUserId, 'friends', friendId));
    }

    return {
      success: true,
      message: '테스트 친구가 모두 삭제되었습니다'
    };
  } catch (error) {
    console.error('테스트 친구 삭제 오류:', error);
    return {
      success: false,
      message: '테스트 친구 삭제에 실패했습니다'
    };
  }
};

/**
 * 테스트 메시지 추가
 */
export const addTestMessages = async (roomId) => {
  try {
    const testMessages = [
      { text: '안녕하세요!', fromMe: false },
      { text: '반가워요 😊', fromMe: false },
      { text: '안녕하세요! 만나서 반갑습니다', fromMe: true },
      { text: '날씨가 좋네요', fromMe: false },
      { text: '네, 정말 좋은 날씨입니다!', fromMe: true },
      { text: '오늘 뭐 하세요?', fromMe: false },
      { text: '앱 개발 테스트 중이에요', fromMe: true },
      { text: '오~ 재미있겠네요!', fromMe: false },
    ];

    const timestamp = Date.now();
    const myUserId = localStorage.getItem('firebaseUserId');

    for (let i = 0; i < testMessages.length; i++) {
      const msg = testMessages[i];
      const messageId = `test-msg-${timestamp}-${i}`;

      await setDoc(doc(db, 'directMessages', roomId, 'messages', messageId), {
        id: messageId,
        text: msg.text,
        senderId: msg.fromMe ? myUserId : 'test-friend-1',
        timestamp: Timestamp.fromMillis(timestamp + i * 60000), // 1분씩 간격
        read: msg.fromMe ? true : false,
        isTestMessage: true
      });
    }

    return {
      success: true,
      message: '테스트 메시지가 추가되었습니다'
    };
  } catch (error) {
    console.error('테스트 메시지 추가 오류:', error);
    return {
      success: false,
      message: '테스트 메시지 추가에 실패했습니다'
    };
  }
};
