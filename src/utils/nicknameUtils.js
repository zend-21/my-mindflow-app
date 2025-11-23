// 닉네임 중복 처리 유틸리티

/**
 * 대화방 내에서 사용자의 표시 이름을 가져옵니다.
 *
 * 표시 규칙:
 * 1. 닉네임만 있을 때: "개똥이"
 * 2. 닉네임 중복 시: "개똥이-Y1" (WS코드 앞 2자리)
 * 3. 닉네임+앞2자리 중복 시: "개똥이-Y1-1", "개똥이-Y1-2" (순번 추가)
 *
 * @param {Object} user - 현재 사용자 객체 { displayName, wsCode, userId }
 * @param {Array} allUsersInRoom - 대화방의 모든 사용자 배열
 * @returns {string} 표시할 이름
 */
export const getDisplayName = (user, allUsersInRoom) => {
  if (!user || !user.displayName) {
    return '익명';
  }

  // 같은 닉네임을 가진 사용자 찾기
  const sameNickUsers = allUsersInRoom.filter(u =>
    u.displayName === user.displayName && u.userId !== user.userId
  );

  // 중복이 없으면 닉네임만 반환
  if (sameNickUsers.length === 0) {
    return user.displayName;
  }

  // 중복이 있으면 WS 코드 앞 2자리 추가
  if (!user.wsCode) {
    // WS 코드가 없는 경우 (드문 경우) - 닉네임만 반환
    return user.displayName;
  }

  // WS 코드에서 앞 2자리 추출 (예: "WS-Y3T1ZM" → "Y3")
  const wsCodePrefix = extractWsCodePrefix(user.wsCode, 2);

  if (!wsCodePrefix) {
    return user.displayName;
  }

  // 기본 표시명: "개똥이-Y3"
  const baseDisplayName = `${user.displayName}-${wsCodePrefix}`;

  // 같은 닉네임 + 같은 2자리 prefix를 가진 다른 사용자들 찾기
  const samePrefixUsers = sameNickUsers.filter(u => {
    const otherPrefix = extractWsCodePrefix(u.wsCode, 2);
    return otherPrefix === wsCodePrefix;
  });

  // 같은 prefix를 가진 사용자가 없으면 기본 표시명 반환
  if (samePrefixUsers.length === 0) {
    return baseDisplayName;
  }

  // 같은 prefix를 가진 모든 사용자(자신 포함)를 userId로 정렬하여 순번 부여
  const allSamePrefixUsers = [...samePrefixUsers, user].sort((a, b) =>
    a.userId.localeCompare(b.userId)
  );

  // 현재 사용자의 순번 찾기 (1부터 시작)
  const userIndex = allSamePrefixUsers.findIndex(u => u.userId === user.userId);
  const sequenceNumber = userIndex + 1;

  // "개똥이-Y3-1", "개똥이-Y3-2" 형식으로 반환
  return `${baseDisplayName}-${sequenceNumber}`;
};

/**
 * WS 코드에서 앞 N자리 추출
 * @param {string} wsCode - WS 코드 (예: "WS-Y3T1ZM")
 * @param {number} length - 추출할 글자 수 (기본값: 2)
 * @returns {string} 앞 N자리 (예: "Y3")
 */
export const extractWsCodePrefix = (wsCode, length = 2) => {
  if (!wsCode || typeof wsCode !== 'string') {
    return '';
  }

  // "WS-" 뒤의 문자 추출
  const parts = wsCode.split('-');
  if (parts.length < 2) {
    // 형식이 맞지 않으면 처음 N글자 반환
    return wsCode.substring(0, length).toUpperCase();
  }

  const code = parts[1]; // "Y3T1ZM"
  return code.substring(0, length).toUpperCase(); // "Y3"
};

/**
 * 대화방의 모든 사용자에 대해 표시 이름을 계산합니다.
 * @param {Array} users - 사용자 배열
 * @returns {Object} userId를 키로 하고 표시 이름을 값으로 하는 객체
 */
export const getDisplayNamesForAllUsers = (users) => {
  const displayNames = {};

  users.forEach(user => {
    displayNames[user.userId] = getDisplayName(user, users);
  });

  return displayNames;
};
