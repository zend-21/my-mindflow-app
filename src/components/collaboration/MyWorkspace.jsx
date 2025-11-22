// 내 워크스페이스 관리 페이지 - 내가 만든 모든 방 보기 및 관리
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { getWorkspaceByUserId, changeWorkspaceCode } from '../../services/workspaceService';
import { collection, query, where, orderBy, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { deleteRoom, closeRoom, reopenRoom, regenerateRoomInviteCode, getRoomByInviteCode } from '../../services/collaborationRoomService';
import RoomBrowser from './RoomBrowser';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// 모달 오버레이 (전체 화면 반투명 배경)
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 0.3s ease-out;
  overflow-y: auto;
  padding: 20px;
`;

// 모달 컨테이너 (실제 내용)
const ModalContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
  border-radius: 20px;
  position: relative;
  animation: ${slideIn} 0.3s ease-out;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
`;

// 닫기 버튼
const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e0e0e0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }
`;

// 스크롤 가능한 콘텐츠 영역
const ScrollableContent = styled.div`
  overflow-y: auto;
  padding: 40px 30px 30px 30px;
  flex: 1;

  /* 커스텀 스크롤바 */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(74, 144, 226, 0.5);
    border-radius: 4px;

    &:hover {
      background: rgba(74, 144, 226, 0.7);
    }
  }
`;

const Container = styled.div`
  width: 100%;
`;

const Header = styled.div`
  max-width: 1200px;
  margin: 0 auto 30px auto;
`;

const Title = styled.h1`
  color: #e0e0e0;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: #888;
  font-size: 16px;
  margin-bottom: 20px;
`;

const WorkspaceInfo = styled.div`
  background: linear-gradient(135deg, #2a2d35, #333842);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
`;

const WorkspaceCodeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const CodeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
`;

const CodeLabel = styled.span`
  color: #b0b0b0;
  font-size: 14px;
  white-space: nowrap;
`;

const CodeValue = styled.span`
  color: #4a90e2;
  font-size: 18px;
  font-weight: 700;
  font-family: 'Roboto Mono', monospace;
  letter-spacing: 1px;
  white-space: nowrap;
`;

const CodeButton = styled.button`
  background: rgba(74, 144, 226, 0.2);
  border: 1px solid rgba(74, 144, 226, 0.4);
  color: #4a90e2;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: rgba(74, 144, 226, 0.3);
  }
`;

const ChangeCodeButton = styled.button`
  background: rgba(230, 126, 34, 0.2);
  border: 1px solid rgba(230, 126, 34, 0.4);
  color: #e67e22;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: rgba(230, 126, 34, 0.3);
  }
`;

// 확인 모달 오버레이
const ConfirmModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 0.2s ease-out;
`;

// 확인 모달 박스
const ConfirmModalBox = styled.div`
  background: linear-gradient(135deg, #2a2d35, #1f2228);
  border-radius: 16px;
  padding: 30px;
  max-width: 450px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: ${slideIn} 0.2s ease-out;
`;

const ConfirmModalTitle = styled.h3`
  color: #e0e0e0;
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 16px 0;
`;

const ConfirmModalMessage = styled.p`
  color: #b0b0b0;
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 24px 0;
  white-space: pre-line;
`;

const ConfirmModalButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const ConfirmButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  ${props => props.$variant === 'cancel' && `
    background: rgba(255, 255, 255, 0.1);
    color: #b0b0b0;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  `}

  ${props => props.$variant === 'confirm' && `
    background: #e67e22;
    color: white;

    &:hover {
      background: #d35400;
    }
  `}

  ${props => props.$variant === 'danger' && `
    background: #e74c3c;
    color: white;

    &:hover {
      background: #c0392b;
    }
  `}

  ${props => props.$variant === 'success' && `
    background: #2ecc71;
    color: white;

    &:hover {
      background: #27ae60;
    }
  `}
`;

// 알림 모달 박스 (결과 표시용)
const AlertModalBox = styled(ConfirmModalBox)`
  max-width: 400px;
`;

const AlertModalButtons = styled.div`
  display: flex;
  justify-content: center;
`;

const TabContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto 20px auto;
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 2px;

  /* 스크롤바 숨기기 */
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Tab = styled.button`
  background: ${props => props.$active ? 'rgba(74, 144, 226, 0.15)' : 'transparent'};
  border: 1px solid ${props => props.$active ? 'rgba(74, 144, 226, 0.5)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$active ? '#4a90e2' : '#888'};
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    color: #4a90e2;
    border-color: rgba(74, 144, 226, 0.5);
    background: rgba(74, 144, 226, 0.1);
  }

  span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    padding: 2px 6px;
    background: ${props => props.$active ? 'rgba(74, 144, 226, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
  }
`;

const RoomsList = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const RoomCard = styled.div`
  background: linear-gradient(135deg, #2a2d35, #333842);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border-color: #4a90e2;
  }
`;

const RoomHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
`;

const RoomTitle = styled.h3`
  color: #e0e0e0;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  flex: 1;
`;

const RoomBadge = styled.span`
  background: ${props => {
    if (props.$status === 'archived') return 'rgba(231, 76, 60, 0.2)';
    if (props.$roomType === 'open') return 'rgba(46, 204, 113, 0.2)';
    return 'rgba(155, 89, 182, 0.2)';
  }};
  color: ${props => {
    if (props.$status === 'archived') return '#e74c3c';
    if (props.$roomType === 'open') return '#2ecc71';
    return '#9b59b6';
  }};
  border: 1px solid ${props => {
    if (props.$status === 'archived') return 'rgba(231, 76, 60, 0.4)';
    if (props.$roomType === 'open') return 'rgba(46, 204, 113, 0.4)';
    return 'rgba(155, 89, 182, 0.4)';
  }};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
`;

const RoomMeta = styled.div`
  color: #888;
  font-size: 13px;
  margin-bottom: 16px;
`;

const InviteCodeSection = styled.div`
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InviteCodeInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InviteCodeLabel = styled.span`
  color: #888;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InviteCodeValue = styled.span`
  color: #4a90e2;
  font-size: 15px;
  font-weight: 700;
  font-family: 'Roboto Mono', monospace;
  letter-spacing: 0.5px;
  word-break: break-all;
`;

const InviteCodeButtons = styled.div`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
`;

const SmallButton = styled.button`
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  ${props => props.$variant === 'copy' && `
    background: rgba(74, 144, 226, 0.2);
    border: 1px solid rgba(74, 144, 226, 0.4);
    color: #4a90e2;
    &:hover { background: rgba(74, 144, 226, 0.3); }
  `}

  ${props => props.$variant === 'regenerate' && `
    background: rgba(230, 126, 34, 0.2);
    border: 1px solid rgba(230, 126, 34, 0.4);
    color: #e67e22;
    &:hover { background: rgba(230, 126, 34, 0.3); }
  `}
`;

const RoomActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.$variant === 'enter' && `
    background: #4a90e2;
    color: white;
    &:hover { background: #3b78c4; }
  `}

  ${props => props.$variant === 'close' && `
    background: rgba(230, 126, 34, 0.2);
    color: #e67e22;
    border: 1px solid rgba(230, 126, 34, 0.4);
    &:hover { background: rgba(230, 126, 34, 0.3); }
  `}

  ${props => props.$variant === 'reopen' && `
    background: rgba(46, 204, 113, 0.2);
    color: #2ecc71;
    border: 1px solid rgba(46, 204, 113, 0.4);
    &:hover { background: rgba(46, 204, 113, 0.3); }
  `}

  ${props => props.$variant === 'delete' && `
    background: rgba(231, 76, 60, 0.2);
    color: #e74c3c;
    border: 1px solid rgba(231, 76, 60, 0.4);
    &:hover { background: rgba(231, 76, 60, 0.3); }
  `}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #888;
  font-size: 16px;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #888;
  font-size: 16px;
`;

const MyWorkspace = ({ onRoomSelect, onClose, onRestoreMemoFolder, showToast }) => {
  const [workspace, setWorkspace] = useState(null);
  const [rooms, setRooms] = useState([]); // 내가 운영중인 방
  const [joinedRooms, setJoinedRooms] = useState([]); // 참가 이력 방
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState('owned'); // owned, joined, browse

  // 내가 운영중인 방 - 서브탭
  const [ownedRoomTab, setOwnedRoomTab] = useState('all'); // all, open, restricted, archived

  // 모달 상태
  const [confirmModal, setConfirmModal] = useState(null); // { title, message, onConfirm, variant }
  const [alertModal, setAlertModal] = useState(null); // { title, message, variant }
  const [unshareModal, setUnshareModal] = useState(null); // { roomId, roomTitle }
  const [isRoomBrowserOpen, setIsRoomBrowserOpen] = useState(false);

  // 길게 누르기 상태
  const [longPressTimer, setLongPressTimer] = useState(null);

  useEffect(() => {
    loadWorkspaceAndRooms();

    // 실시간 방 목록 구독 (참여자 수 실시간 업데이트)
    const userId = localStorage.getItem('firebaseUserId');
    if (!userId) return;

    const q = query(
      collection(db, 'collaborationRooms'),
      where('ownerId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRooms(roomsList);
    });

    return () => unsubscribe();
  }, []);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const loadWorkspaceAndRooms = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('firebaseUserId');
      if (!userId) {
        console.error('로그인이 필요합니다');
        return;
      }

      // 워크스페이스 정보 가져오기
      try {
        const workspaceResult = await getWorkspaceByUserId(userId);
        setWorkspace(workspaceResult.data);
      } catch (error) {
        console.warn('워크스페이스 조회 실패:', error);
      }

      // 내가 만든 모든 방 가져오기
      const workspaceId = `workspace_${userId}`;
      const q = query(
        collection(db, 'collaborationRooms'),
        where('ownerId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const roomsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('🏠 워크스페이스 방 목록:', roomsList.length, '개');
      console.log('방 상세:', roomsList.map(r => ({ id: r.id, memoId: r.memoId, title: r.memoTitle, status: r.status })));

      setRooms(roomsList);

      // 참가 이력 방 가져오기
      await loadJoinedRooms(userId);
    } catch (error) {
      console.error('방 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJoinedRooms = async (userId) => {
    try {
      // localStorage에서 참가 이력 가져오기 (roomId 배열)
      const joinedRoomIds = JSON.parse(localStorage.getItem(`joinedRooms_${userId}`) || '[]');

      if (joinedRoomIds.length === 0) {
        setJoinedRooms([]);
        return;
      }

      // 각 방 정보 가져오기
      const joinedRoomsList = [];
      for (const roomId of joinedRoomIds) {
        try {
          const roomDoc = await getDoc(doc(db, 'collaborationRooms', roomId));
          if (roomDoc.exists()) {
            const roomData = roomDoc.data();
            // 내가 만든 방은 제외 (운영중인 방에 이미 표시됨)
            if (roomData.ownerId !== userId) {
              joinedRoomsList.push({
                id: roomDoc.id,
                ...roomData,
                isActive: roomData.status === 'active', // 방이 활성 상태인지
              });
            }
          } else {
            // 방이 삭제된 경우 - 비활성으로 표시
            joinedRoomsList.push({
              id: roomId,
              memoTitle: '(삭제된 방)',
              isActive: false,
              isDeleted: true,
            });
          }
        } catch (error) {
          console.error(`방 ${roomId} 조회 실패:`, error);
        }
      }

      setJoinedRooms(joinedRoomsList);
      console.log('📜 참가 이력 방:', joinedRoomsList.length, '개');
    } catch (error) {
      console.error('참가 이력 조회 오류:', error);
      setJoinedRooms([]);
    }
  };

  const handleCopyCode = () => {
    if (workspace?.workspaceCode) {
      navigator.clipboard.writeText(workspace.workspaceCode);
      showToast?.('WS 코드가 복사되었습니다');
    }
  };

  const handleChangeCode = () => {
    setConfirmModal({
      title: '워크스페이스 코드 변경 (이사)',
      message: '워크스페이스 코드를 변경하시겠습니까?\n\n🚚 이사 효과:\n⚠️ 이전 워크스페이스 코드로는 더 이상 접근할 수 없습니다\n⚠️ 모든 방의 초대 코드도 자동으로 재생성됩니다\n⚠️ 기존 초대 코드를 가진 사람들은 접근할 수 없게 됩니다\n✅ 원하는 사람에게만 새 코드를 공유하세요',
      variant: 'confirm',
      onConfirm: async () => {
        try {
          const userId = localStorage.getItem('firebaseUserId');
          if (!userId) {
            setAlertModal({
              title: '오류',
              message: '로그인이 필요합니다.',
              variant: 'danger'
            });
            return;
          }

          const workspaceId = `workspace_${userId}`;
          const result = await changeWorkspaceCode(workspaceId, userId);

          if (result.success) {
            const regeneratedCount = result.regeneratedRoomCount || 0;
            const warningMsg = result.warning ? `\n\n⚠️ ${result.warning}` : '';

            setAlertModal({
              title: '이사 완료',
              message: `🚚 새 워크스페이스 코드: ${result.newCode}\n\n✅ ${regeneratedCount}개 방의 초대 코드가 재생성되었습니다\n💡 새 코드를 원하는 사람에게만 공유하세요${warningMsg}`,
              variant: 'success'
            });
            // 워크스페이스 정보 다시 불러오기
            await loadWorkspaceAndRooms();
          }
        } catch (error) {
          console.error('코드 변경 오류:', error);
          setAlertModal({
            title: '오류',
            message: '코드 변경에 실패했습니다.',
            variant: 'danger'
          });
        }
      }
    });
  };

  const handleCopyInviteCode = (inviteCode) => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setAlertModal({
        title: '복사 완료',
        message: '방 초대 코드가 클립보드에 복사되었습니다.',
        variant: 'success'
      });
    }
  };

  const handleRegenerateInviteCode = (roomId, roomTitle, roomType) => {
    const roomTypeLabel = roomType === 'open' ? '개방형' : '제한형';
    setConfirmModal({
      title: '방 코드 재생성',
      message: `"${roomTitle}" ${roomTypeLabel}의 코드를 재생성하시겠습니까?\n\n⚠️ 이전 코드는 더 이상 사용할 수 없습니다.\n✅ 기존 참여자는 유지되며, 새로운 코드로만 새 멤버가 입장할 수 있습니다.`,
      variant: 'confirm',
      onConfirm: async () => {
        try {
          const newCode = await regenerateRoomInviteCode(roomId);
          setAlertModal({
            title: '코드 재생성 완료',
            message: `새 초대 코드:\n${newCode}`,
            variant: 'success'
          });
          await loadWorkspaceAndRooms();
        } catch (error) {
          console.error('초대 코드 재생성 오류:', error);
          setAlertModal({
            title: '오류',
            message: error.message || '초대 코드 재생성에 실패했습니다.',
            variant: 'danger'
          });
        }
      }
    });
  };

  const handleCloseRoom = (roomId) => {
    setConfirmModal({
      title: '방 폐쇄',
      message: '이 방을 폐쇄하시겠습니까?\n\n폐쇄하면 다른 사람이 입장할 수 없습니다.\n방장은 언제든 재개방할 수 있습니다.',
      variant: 'confirm',
      onConfirm: async () => {
        try {
          await closeRoom(roomId);
          setAlertModal({
            title: '폐쇄 완료',
            message: '방이 폐쇄되었습니다.',
            variant: 'success'
          });
          await loadWorkspaceAndRooms();
        } catch (error) {
          console.error('방 폐쇄 오류:', error);
          setAlertModal({
            title: '오류',
            message: '방 폐쇄에 실패했습니다.',
            variant: 'danger'
          });
        }
      }
    });
  };

  const handleReopenRoom = async (roomId) => {
    try {
      await reopenRoom(roomId);
      setAlertModal({
        title: '재개방 완료',
        message: '방이 재개방되었습니다.',
        variant: 'success'
      });
      await loadWorkspaceAndRooms();
    } catch (error) {
      console.error('방 재개방 오류:', error);
      setAlertModal({
        title: '오류',
        message: '방 재개방에 실패했습니다.',
        variant: 'danger'
      });
    }
  };

  // 길게 누르기 시작
  const handleLongPressStart = (roomId, roomTitle) => {
    const timer = setTimeout(() => {
      setUnshareModal({ roomId, roomTitle });
    }, 500); // 500ms 길게 누르기
    setLongPressTimer(timer);
  };

  // 길게 누르기 취소
  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // 공유 해제 확인
  const handleUnshareConfirm = async () => {
    if (!unshareModal) return;

    try {
      const room = rooms.find(r => r.id === unshareModal.roomId);
      const originalMemoId = room?.originalMemoId || room?.memoId;

      // 방 삭제 (공유 해제)
      await deleteRoom(unshareModal.roomId);

      // 메모 폴더 복원
      if (originalMemoId && onRestoreMemoFolder) {
        onRestoreMemoFolder(originalMemoId);
      }

      setAlertModal({
        title: '공유 해제 완료',
        message: '메모가 원래 폴더로 복원되었습니다.',
        variant: 'success'
      });
      setUnshareModal(null);
      await loadWorkspaceAndRooms();
    } catch (error) {
      console.error('공유 해제 오류:', error);
      setAlertModal({
        title: '오류',
        message: '공유 해제에 실패했습니다.',
        variant: 'danger'
      });
    }
  };

  const handleDeleteRoom = (roomId) => {
    setConfirmModal({
      title: '방 삭제',
      message: '이 방을 완전히 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.\n모든 메시지와 데이터가 영구적으로 삭제됩니다.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          // 방 정보에서 원본 메모 ID 가져오기
          const room = rooms.find(r => r.id === roomId);
          const originalMemoId = room?.originalMemoId || room?.memoId;

          // 방 삭제
          await deleteRoom(roomId);

          // 메모 폴더 복원 (공유 해제)
          if (originalMemoId && onRestoreMemoFolder) {
            onRestoreMemoFolder(originalMemoId);
          }

          setAlertModal({
            title: '삭제 완료',
            message: '방이 삭제되었습니다.',
            variant: 'success'
          });
          await loadWorkspaceAndRooms();
        } catch (error) {
          console.error('방 삭제 오류:', error);
          setAlertModal({
            title: '오류',
            message: '방 삭제에 실패했습니다.',
            variant: 'danger'
          });
        }
      }
    });
  };

  // 내가 운영중인 방 필터링
  const filteredOwnedRooms = rooms.filter(room => {
    if (ownedRoomTab === 'all') return true;
    if (ownedRoomTab === 'open') return room.roomType === 'open' && room.status === 'active';
    if (ownedRoomTab === 'restricted') return room.roomType === 'restricted' && room.status === 'active';
    if (ownedRoomTab === 'archived') return room.status === 'archived';
    return true;
  });

  // 방 탐색에서 방 선택 핸들러
  const handleRoomBrowserSelect = async (room) => {
    setIsRoomBrowserOpen(false);

    // 참가 이력에 추가
    const userId = localStorage.getItem('firebaseUserId');
    if (userId && room.id) {
      const joinedRoomIds = JSON.parse(localStorage.getItem(`joinedRooms_${userId}`) || '[]');
      if (!joinedRoomIds.includes(room.id)) {
        joinedRoomIds.push(room.id);
        localStorage.setItem(`joinedRooms_${userId}`, JSON.stringify(joinedRoomIds));
      }
    }

    // 방 입장
    if (onRoomSelect) {
      onRoomSelect(room);
    }
  };

  return (
    <>
      <ModalOverlay>
        <ModalContainer>
          <CloseButton onClick={onClose}>×</CloseButton>

          <ScrollableContent>
          {loading ? (
            <LoadingState>워크스페이스를 불러오는 중...</LoadingState>
          ) : (
            <Container>
              <Header>
                <Title>협업 라운지</Title>
                <Subtitle>모든 협업방을 한 곳에서 관리하세요</Subtitle>

                {workspace && mainTab === 'owned' && (
                  <WorkspaceInfo>
                    <WorkspaceCodeSection>
                      <CodeRow>
                        <CodeLabel>WS 코드:</CodeLabel>
                        <CodeValue>{workspace.workspaceCode}</CodeValue>
                      </CodeRow>
                      <ButtonRow>
                        <CodeButton onClick={handleCopyCode}>복사</CodeButton>
                        <ChangeCodeButton onClick={handleChangeCode}>변경</ChangeCodeButton>
                      </ButtonRow>
                    </WorkspaceCodeSection>
                  </WorkspaceInfo>
                )}
              </Header>

              {/* 메인 탭 */}
              <TabContainer>
                <Tab $active={mainTab === 'owned'} onClick={() => setMainTab('owned')}>
                  내가 운영중인 방 <span>{rooms.length}</span>
                </Tab>
                <Tab $active={mainTab === 'joined'} onClick={() => setMainTab('joined')}>
                  참가 이력 <span>{joinedRooms.length}</span>
                </Tab>
                <Tab $active={mainTab === 'browse'} onClick={() => setMainTab('browse')}>
                  방 탐색
                </Tab>
              </TabContainer>

              {/* 내가 운영중인 방 - 서브탭 */}
              {mainTab === 'owned' && (
                <TabContainer style={{ marginTop: '10px' }}>
                  <Tab $active={ownedRoomTab === 'all'} onClick={() => setOwnedRoomTab('all')}>
                    전체 <span>{rooms.length}</span>
                  </Tab>
                  <Tab $active={ownedRoomTab === 'open'} onClick={() => setOwnedRoomTab('open')}>
                    개방형 <span>{rooms.filter(r => r.roomType === 'open' && r.status === 'active').length}</span>
                  </Tab>
                  <Tab $active={ownedRoomTab === 'restricted'} onClick={() => setOwnedRoomTab('restricted')}>
                    제한형 <span>{rooms.filter(r => r.roomType === 'restricted' && r.status === 'active').length}</span>
                  </Tab>
                  <Tab $active={ownedRoomTab === 'archived'} onClick={() => setOwnedRoomTab('archived')}>
                    폐쇄방 <span>{rooms.filter(r => r.status === 'archived').length}</span>
                  </Tab>
                </TabContainer>
              )}

              {/* 내가 운영중인 방 목록 */}
              {mainTab === 'owned' && (
                <>
                  {filteredOwnedRooms.length > 0 ? (
                    <RoomsList>
                      {filteredOwnedRooms.map(room => (
                    <RoomCard key={room.id}>
                      {/* 제목과 메타정보 영역: 길게 누르기로 공유 해제 */}
                      <div
                        onTouchStart={() => handleLongPressStart(room.id, room.memoTitle)}
                        onTouchEnd={handleLongPressEnd}
                        onMouseDown={() => handleLongPressStart(room.id, room.memoTitle)}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        style={{ cursor: 'default' }}
                      >
                        <RoomHeader>
                          <RoomTitle>{room.memoTitle}</RoomTitle>
                          <RoomBadge
                            $roomType={room.roomType}
                            $status={room.status}
                            onTouchStart={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            {room.status === 'archived' ? '폐쇄' : room.roomType === 'open' ? '개방형' : '제한형'}
                          </RoomBadge>
                        </RoomHeader>

                        <RoomMeta>
                          {(room.participants?.length || 0)}명 참여 중 ·{' '}
                          {new Date(room.createdAt).toLocaleDateString('ko-KR')}
                        </RoomMeta>
                      </div>

                      {/* 모든 활성 방에 초대 코드 표시 */}
                      {room.inviteCode && room.status === 'active' && (
                        <InviteCodeSection>
                          <InviteCodeInfo>
                            <InviteCodeLabel>
                              {room.roomType === 'open' ? '방 코드 (개방형)' : '방 코드 (제한형)'}
                            </InviteCodeLabel>
                            <InviteCodeValue>{room.inviteCode}</InviteCodeValue>
                          </InviteCodeInfo>
                          <InviteCodeButtons>
                            <SmallButton
                              $variant="copy"
                              onClick={() => handleCopyInviteCode(room.inviteCode)}
                            >
                              복사
                            </SmallButton>
                            <SmallButton
                              $variant="regenerate"
                              onClick={() => handleRegenerateInviteCode(room.id, room.memoTitle, room.roomType)}
                            >
                              재생성
                            </SmallButton>
                          </InviteCodeButtons>
                        </InviteCodeSection>
                      )}

                      <RoomActions onClick={(e) => e.stopPropagation()}>
                        <ActionButton
                          $variant="enter"
                          onClick={() => onRoomSelect && onRoomSelect(room)}
                        >
                          입장
                        </ActionButton>

                        {room.status === 'active' && (
                          <ActionButton
                            $variant="close"
                            onClick={() => handleCloseRoom(room.id)}
                          >
                            폐쇄
                          </ActionButton>
                        )}

                        {room.status === 'archived' && (
                          <ActionButton
                            $variant="reopen"
                            onClick={() => handleReopenRoom(room.id)}
                          >
                            재개방
                          </ActionButton>
                        )}

                        <ActionButton
                          $variant="delete"
                          onClick={() => handleDeleteRoom(room.id)}
                        >
                          삭제
                        </ActionButton>
                      </RoomActions>
                    </RoomCard>
                  ))}
                      </RoomsList>
                    ) : (
                      <EmptyState>
                        {ownedRoomTab === 'all' && '아직 만든 방이 없습니다.'}
                        {ownedRoomTab === 'open' && '개방형 방이 없습니다.'}
                        {ownedRoomTab === 'restricted' && '제한형 방이 없습니다.'}
                        {ownedRoomTab === 'archived' && '폐쇄된 방이 없습니다.'}
                      </EmptyState>
                    )}
                </>
              )}

              {/* 참가 이력 방 목록 */}
              {mainTab === 'joined' && (
                <>
                  {joinedRooms.length > 0 ? (
                    <RoomsList>
                      {joinedRooms.map(room => (
                        <RoomCard
                          key={room.id}
                          style={{
                            opacity: room.isDeleted || room.status === 'archived' ? 0.6 : 1,
                            pointerEvents: room.isDeleted ? 'none' : 'auto'
                          }}
                        >
                          <RoomHeader>
                            <RoomTitle>
                              {room.memoTitle}
                              {room.isDeleted && ' (삭제됨)'}
                              {!room.isDeleted && room.status === 'archived' && ' (폐쇄됨)'}
                            </RoomTitle>
                            {!room.isDeleted && (
                              <RoomBadge
                                $roomType={room.roomType}
                                $status={room.status}
                              >
                                {room.status === 'archived' ? '폐쇄' : room.roomType === 'open' ? '개방형' : '제한형'}
                              </RoomBadge>
                            )}
                          </RoomHeader>

                          {!room.isDeleted && (
                            <>
                              <RoomMeta>
                                방장: {room.ownerName || '알 수 없음'} · {(room.participants?.length || 0)}명 참여 중
                              </RoomMeta>

                              <RoomActions>
                                <ActionButton
                                  $variant="enter"
                                  onClick={() => onRoomSelect && onRoomSelect(room)}
                                  disabled={room.status === 'archived'}
                                >
                                  {room.status === 'archived' ? '입장 불가' : '입장'}
                                </ActionButton>
                              </RoomActions>
                            </>
                          )}
                        </RoomCard>
                      ))}
                    </RoomsList>
                  ) : (
                    <EmptyState>
                      참가한 방이 없습니다.<br />
                      방 탐색에서 방 코드로 참가해보세요.
                    </EmptyState>
                  )}
                </>
              )}

              {/* 방 탐색 */}
              {mainTab === 'browse' && (
                <EmptyState style={{ paddingTop: '40px' }}>
                  <div style={{ marginBottom: '20px', fontSize: '18px', color: '#b0b0b0' }}>
                    방 코드를 입력하여 협업방에 참가하세요
                  </div>
                  <ActionButton
                    $variant="enter"
                    onClick={() => setIsRoomBrowserOpen(true)}
                    style={{ margin: '0 auto', maxWidth: '200px' }}
                  >
                    방 코드 입력하기
                  </ActionButton>
                </EmptyState>
              )}
            </Container>
          )}
          </ScrollableContent>
        </ModalContainer>
      </ModalOverlay>

      {/* 확인 모달 */}
      {confirmModal && (
        <ConfirmModalOverlay onClick={(e) => e.target === e.currentTarget && setConfirmModal(null)}>
          <ConfirmModalBox>
            <ConfirmModalTitle>{confirmModal.title}</ConfirmModalTitle>
            <ConfirmModalMessage>{confirmModal.message}</ConfirmModalMessage>
            <ConfirmModalButtons>
              <ConfirmButton
                $variant="cancel"
                onClick={() => setConfirmModal(null)}
              >
                취소
              </ConfirmButton>
              <ConfirmButton
                $variant={confirmModal.variant}
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
              >
                확인
              </ConfirmButton>
            </ConfirmModalButtons>
          </ConfirmModalBox>
        </ConfirmModalOverlay>
      )}

      {/* 알림 모달 */}
      {alertModal && (
        <ConfirmModalOverlay onClick={(e) => e.target === e.currentTarget && setAlertModal(null)}>
          <AlertModalBox>
            <ConfirmModalTitle>{alertModal.title}</ConfirmModalTitle>
            <ConfirmModalMessage>{alertModal.message}</ConfirmModalMessage>
            <AlertModalButtons>
              <ConfirmButton
                $variant={alertModal.variant}
                onClick={() => setAlertModal(null)}
              >
                확인
              </ConfirmButton>
            </AlertModalButtons>
          </AlertModalBox>
        </ConfirmModalOverlay>
      )}

      {/* 공유 해제 모달 */}
      {unshareModal && (
        <ConfirmModalOverlay onClick={(e) => e.target === e.currentTarget && setUnshareModal(null)}>
          <ConfirmModalBox>
            <ConfirmModalTitle>공유 해제</ConfirmModalTitle>
            <ConfirmModalMessage>
              '{unshareModal.roomTitle}'의 공유를 해제하시겠습니까?{'\n\n'}
              협업방이 삭제되고 메모는 원래 폴더로 복원됩니다.
            </ConfirmModalMessage>
            <ConfirmModalButtons>
              <ConfirmButton
                $variant="cancel"
                onClick={() => setUnshareModal(null)}
              >
                취소
              </ConfirmButton>
              <ConfirmButton
                $variant="confirm"
                onClick={handleUnshareConfirm}
              >
                공유 해제
              </ConfirmButton>
            </ConfirmModalButtons>
          </ConfirmModalBox>
        </ConfirmModalOverlay>
      )}

      {/* 방 탐색 모달 */}
      <RoomBrowser
        isOpen={isRoomBrowserOpen}
        onClose={() => setIsRoomBrowserOpen(false)}
        onRoomSelect={handleRoomBrowserSelect}
      />
    </>
  );
};

export default MyWorkspace;
