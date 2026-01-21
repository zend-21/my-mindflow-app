// 현재 열린 채팅방 ID 관리
// 포그라운드 알림 소리 제어에 사용

/**
 * 현재 열린 채팅방 ID 저장
 * @param {string} roomId - 채팅방 ID
 */
export const setCurrentChatRoom = (roomId) => {
  if (roomId) {
    localStorage.setItem('currentChatRoomId', roomId);
    console.log('📍 현재 채팅방 설정:', roomId);
  }
};

/**
 * 현재 열린 채팅방 ID 가져오기
 * @returns {string|null} - 채팅방 ID 또는 null
 */
export const getCurrentChatRoom = () => {
  return localStorage.getItem('currentChatRoomId');
};

/**
 * 현재 채팅방 ID 제거 (채팅방 닫을 때)
 */
export const clearCurrentChatRoom = () => {
  localStorage.removeItem('currentChatRoomId');
  console.log('📍 현재 채팅방 클리어');
};

/**
 * 메시지가 현재 열린 채팅방에서 온 것인지 확인
 * @param {string} messageRoomId - 메시지가 온 채팅방 ID
 * @returns {boolean} - 현재 채팅방 여부
 */
export const isCurrentChatRoom = (messageRoomId) => {
  const currentRoomId = getCurrentChatRoom();
  return currentRoomId === messageRoomId;
};
