import { useState, useEffect } from 'react';
import { getUserNickname } from '../../../../services/nicknameService';

/**
 * 편집 이력의 사용자 닉네임 관리 커스텀 훅
 */
export function useNicknames(pendingEdits) {
  const [editNicknames, setEditNicknames] = useState({});

  useEffect(() => {
    const fetchNicknames = async () => {
      const userIds = [...new Set(pendingEdits.map(edit => edit.editedBy))];
      const nicknameMap = {};

      for (const userId of userIds) {
        if (userId) {
          const nickname = await getUserNickname(userId);
          nicknameMap[userId] = nickname || '익명';
        }
      }

      setEditNicknames(nicknameMap);
    };

    if (pendingEdits.length > 0) {
      fetchNicknames();
    }
  }, [pendingEdits]);

  return editNicknames;
}
