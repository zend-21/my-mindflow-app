// 친구 추가 모달 (ID 입력 + QR 스캔)
import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { X, Search, QrCode, UserPlus, AlertCircle, CheckCircle, Image } from 'lucide-react';
import { getUserByWorkspaceCode, addFriendInstantly, isFriend } from '../../services/friendService';
import { unblockUser, isUserBlocked } from '../../services/userManagementService';
import QRScannerModal from '../collaboration/QRScannerModal';
import { avatarList } from '../avatars/AvatarIcons';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10003;
  padding: 20px;
  backdrop-filter: blur(5px);
`;

const Modal = styled.div`
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
  }
`;

const Content = styled.div`
  padding: 24px;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.03);
  padding: 4px;
  border-radius: 12px;
`;

const Tab = styled.button`
  flex: 1;
  padding: 12px;
  background: ${props => props.$active ? 'rgba(74, 144, 226, 0.2)' : 'transparent'};
  border: 1px solid ${props => props.$active ? 'rgba(74, 144, 226, 0.4)' : 'transparent'};
  color: ${props => props.$active ? '#4a90e2' : '#888'};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: ${props => props.$active ? 'rgba(74, 144, 226, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  }
`;

const SearchSection = styled.div`
  margin-bottom: 24px;
`;

const SearchInputWrapper = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const SearchInput = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.2s;
  text-transform: uppercase;

  &::placeholder {
    color: #666;
    text-transform: none;
  }

  &:focus {
    outline: none;
    border-color: #4a90e2;
    background: rgba(255, 255, 255, 0.08);
  }
`;

const SearchButton = styled.button`
  background: rgba(74, 144, 226, 0.2);
  border: 1px solid rgba(74, 144, 226, 0.4);
  color: #4a90e2;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: rgba(74, 144, 226, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResultSection = styled.div`
  margin-top: 20px;
`;

const UserCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UserAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
`;

const UserId = styled.div`
  font-size: 13px;
  color: #888;
`;

const AddButton = styled.button`
  background: rgba(74, 144, 226, 0.2);
  border: 1px solid rgba(74, 144, 226, 0.4);
  color: #4a90e2;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: rgba(74, 144, 226, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QRScanButton = styled.button`
  width: 100%;
  background: rgba(74, 144, 226, 0.15);
  border: 2px dashed rgba(74, 144, 226, 0.3);
  color: #4a90e2;
  padding: 32px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  &:hover {
    background: rgba(74, 144, 226, 0.25);
    border-color: rgba(74, 144, 226, 0.5);
  }
`;

const GalleryButton = styled.button`
  width: 100%;
  background: rgba(156, 39, 176, 0.15);
  border: 2px dashed rgba(156, 39, 176, 0.3);
  color: #ba68c8;
  padding: 20px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;

  &:hover:not(:disabled) {
    background: rgba(156, 39, 176, 0.25);
    border-color: rgba(156, 39, 176, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InfoBox = styled.div`
  background: ${props =>
    props.$type === 'error' ? 'rgba(244, 67, 54, 0.1)' :
    props.$type === 'success' ? 'rgba(76, 175, 80, 0.1)' :
    'rgba(74, 144, 226, 0.1)'
  };
  border: 1px solid ${props =>
    props.$type === 'error' ? 'rgba(244, 67, 54, 0.3)' :
    props.$type === 'success' ? 'rgba(76, 175, 80, 0.3)' :
    'rgba(74, 144, 226, 0.3)'
  };
  color: ${props =>
    props.$type === 'error' ? '#e57373' :
    props.$type === 'success' ? '#81c784' :
    '#64b5f6'
  };
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 16px;
`;

const AddFriendModal = ({ onClose, userId, showToast, onFriendAdded }) => {
  const [activeTab, setActiveTab] = useState('id'); // 'id' or 'qr'
  const [searchId, setSearchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [message, setMessage] = useState(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [userProfilePicture, setUserProfilePicture] = useState(null);
  const [userAvatarSettings, setUserAvatarSettings] = useState(null);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false); // 차단 해제 확인 모달
  const [blockedUserToAdd, setBlockedUserToAdd] = useState(null); // 차단 해제 후 추가할 사용자
  const [processingImage, setProcessingImage] = useState(false); // 갤러리 이미지 처리 중
  const galleryInputRef = useRef(null);

  const handleSearch = async () => {
    if (!searchId.trim()) {
      setMessage({ type: 'error', text: 'ID를 입력해주세요' });
      return;
    }

    setSearching(true);
    setMessage(null);
    setSearchResult(null);

    try {
      // WS 코드 형식으로 변환
      const wsCode = searchId.toUpperCase().startsWith('WS-')
        ? searchId.toUpperCase()
        : `WS-${searchId.toUpperCase()}`;

      console.log('친구 검색:', wsCode);

      const user = await getUserByWorkspaceCode(wsCode);

      if (!user) {
        setMessage({ type: 'error', text: '사용자를 찾을 수 없습니다' });
        return;
      }

      // 자기 자신 체크
      if (user.id === userId) {
        setMessage({ type: 'error', text: '자기 자신은 추가할 수 없습니다' });
        return;
      }

      // 이미 친구인지 체크
      const alreadyFriend = await isFriend(userId, user.id);
      if (alreadyFriend) {
        setMessage({ type: 'error', text: '이미 친구입니다' });
        return;
      }

      setSearchResult(user);
    } catch (error) {
      console.error('친구 검색 오류:', error);
      setMessage({ type: 'error', text: '검색 중 오류가 발생했습니다' });
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async () => {
    if (!searchResult) return;

    try {
      const result = await addFriendInstantly(userId, searchResult.workspaceCode);

      if (result.success) {
        setMessage({
          type: 'success',
          text: `${searchResult.displayName || '친구'}님이 친구로 추가되었습니다!`
        });
        showToast?.(`✅ ${searchResult.displayName || '친구'}님이 친구로 추가되었습니다`);

        // 1초 후 모달 닫기 및 친구 목록 갱신
        setTimeout(() => {
          onFriendAdded?.();
          onClose();
        }, 1500);
      } else {
        // 차단한 사용자인 경우 차단 해제 확인 모달 표시
        if (result.error && result.error.includes('차단한 사용자')) {
          setBlockedUserToAdd(searchResult);
          setShowUnblockConfirm(true);
        } else {
          setMessage({ type: 'error', text: result.error || '친구 추가에 실패했습니다' });
        }
      }
    } catch (error) {
      console.error('친구 추가 오류:', error);
      setMessage({ type: 'error', text: '친구 추가 중 오류가 발생했습니다' });
    }
  };

  // 차단 해제 후 친구 추가
  const handleUnblockAndAdd = async () => {
    if (!blockedUserToAdd) return;

    try {
      // 1. 차단 해제
      const unblockResult = await unblockUser(userId, blockedUserToAdd.id);
      if (!unblockResult.success) {
        setMessage({ type: 'error', text: '차단 해제에 실패했습니다' });
        setShowUnblockConfirm(false);
        return;
      }

      // 2. 친구 추가
      const addResult = await addFriendInstantly(userId, blockedUserToAdd.workspaceCode);

      if (addResult.success) {
        setMessage({
          type: 'success',
          text: `차단 해제 후 ${blockedUserToAdd.displayName || '친구'}님이 친구로 추가되었습니다!`
        });
        showToast?.(`✅ ${blockedUserToAdd.displayName || '친구'}님이 친구로 추가되었습니다`);

        setTimeout(() => {
          onFriendAdded?.();
          onClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: addResult.error || '친구 추가에 실패했습니다' });
      }
    } catch (error) {
      console.error('차단 해제 및 친구 추가 오류:', error);
      setMessage({ type: 'error', text: '처리 중 오류가 발생했습니다' });
    } finally {
      setShowUnblockConfirm(false);
      setBlockedUserToAdd(null);
    }
  };

  const handleQRScan = () => {
    setIsQRScannerOpen(true);
  };

  const handleQRCodeScanned = (wsCode) => {
    console.log('QR 스캔 완료:', wsCode);
    setIsQRScannerOpen(false);

    // ID 탭으로 전환하고 검색창에 코드 자동 입력
    setActiveTab('id');
    setSearchId(wsCode);
    setMessage({ type: 'info', text: 'QR 코드에서 ID를 추출했습니다. 검색 버튼을 눌러 친구를 찾아보세요.' });
  };

  // 갤러리에서 QR 이미지 선택
  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  // 갤러리 이미지에서 QR 코드 스캔
  const handleGalleryImageSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessingImage(true);
    setMessage(null);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('gallery-qr-reader-hidden');

      const result = await html5QrCode.scanFile(file, true);
      console.log('갤러리 QR 스캔 결과:', result);

      // WS- 코드 추출
      let wsCode = null;
      if (result.includes('WS-')) {
        const match = result.match(/WS-[A-Z0-9]{6}/i);
        if (match) {
          wsCode = match[0].toUpperCase();
        }
      } else if (/^[A-Z0-9]{6}$/i.test(result.trim())) {
        wsCode = result.trim().toUpperCase();
      }

      if (wsCode) {
        // ID 탭으로 전환하고 코드 입력
        setActiveTab('id');
        setSearchId(wsCode.replace('WS-', ''));
        setMessage({ type: 'info', text: 'QR 코드에서 ID를 추출했습니다. 검색 버튼을 눌러 친구를 찾아보세요.' });
      } else {
        setMessage({ type: 'error', text: '유효한 친구 코드를 찾을 수 없습니다' });
      }

      await html5QrCode.clear();
    } catch (error) {
      console.error('갤러리 QR 스캔 오류:', error);
      setMessage({ type: 'error', text: 'QR 코드를 인식할 수 없습니다. 다른 이미지를 시도해주세요.' });
    } finally {
      setProcessingImage(false);
      // 입력 초기화
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // 아바타 배경색 매핑
  const BACKGROUND_COLORS = {
    'none': 'transparent',
    'lavender': 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'peach': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'mint': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'sunset': 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    'ocean': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    'pink': '#FF69B4',
    'blue': '#4169E1',
    'yellow': '#FFD700',
    'green': '#32CD32',
    'purple': '#9370DB',
  };

  // 아바타 아이콘 렌더링
  const renderAvatarIcon = () => {
    if (!userAvatarSettings?.selectedAvatarId) return null;

    const avatar = avatarList.find(a => a.id === userAvatarSettings.selectedAvatarId);
    if (!avatar) return null;

    const AvatarComponent = avatar.component;
    const bgColor = BACKGROUND_COLORS[userAvatarSettings.avatarBgColor] || BACKGROUND_COLORS['none'];

    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgColor,
        borderRadius: '50%'
      }}>
        <div style={{ width: '70%', height: '70%' }}>
          <AvatarComponent />
        </div>
      </div>
    );
  };

  // 검색 결과가 있을 때 프로필 로드
  useEffect(() => {
    if (!searchResult?.id) {
      setUserProfilePicture(null);
      setUserAvatarSettings(null);
      return;
    }

    const loadProfile = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../firebase/config');
        const { getProfileImageUrl } = await import('../../utils/storageService');

        const settingsRef = doc(db, 'users', searchResult.id, 'settings', 'profile');
        const docSnap = await getDoc(settingsRef);

        if (docSnap.exists()) {
          const settings = docSnap.data();
          const imageType = settings.profileImageType || 'avatar';
          const version = settings.profileImageVersion || null;
          const selectedAvatarId = settings.selectedAvatarId || null;
          const avatarBgColor = settings.avatarBgColor || 'none';

          if (imageType === 'photo') {
            const imageUrl = getProfileImageUrl(searchResult.id, version);
            setUserProfilePicture(imageUrl);
            setUserAvatarSettings(null);
          } else {
            setUserProfilePicture(null);
            if (selectedAvatarId) {
              setUserAvatarSettings({ selectedAvatarId, avatarBgColor });
            }
          }
        }
      } catch (error) {
        console.error('프로필 로드 실패:', error);
      }
    };

    loadProfile();
  }, [searchResult]);

  return (
    <>
      <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
        <Modal>
          <Header>
            <Title>친구 추가</Title>
            <CloseButton onClick={onClose}>
              <X size={24} />
            </CloseButton>
          </Header>

          <Content>
            <TabContainer>
              <Tab $active={activeTab === 'id'} onClick={() => setActiveTab('id')}>
                <Search size={16} />
                ID 검색
              </Tab>
              <Tab $active={activeTab === 'qr'} onClick={() => setActiveTab('qr')}>
                <QrCode size={16} />
                QR 스캔
              </Tab>
            </TabContainer>

            {activeTab === 'id' && (
              <SearchSection>
                <SearchInputWrapper>
                  <SearchInput
                    type="text"
                    placeholder="ID 입력 (예: WSD5D2)"
                    value={searchId}
                    onChange={(e) => {
                      // 영문과 숫자, 하이픈만 허용 (한글 입력 차단)
                      const value = e.target.value.replace(/[^a-zA-Z0-9-]/g, '');
                      setSearchId(value);
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && !searching && handleSearch()}
                  />
                  <SearchButton onClick={handleSearch} disabled={searching}>
                    {searching ? '검색중...' : '검색'}
                  </SearchButton>
                </SearchInputWrapper>

                {searchResult && (
                  <ResultSection>
                    <UserCard>
                      <UserAvatar
                        style={userProfilePicture ? {
                          backgroundImage: `url(${userProfilePicture})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        } : {}}
                      >
                        {!userProfilePicture && userAvatarSettings && renderAvatarIcon()}
                        {!userProfilePicture && !userAvatarSettings && (searchResult.displayName || searchResult.email || '?').charAt(0).toUpperCase()}
                      </UserAvatar>
                      <UserInfo>
                        <UserName>{searchResult.displayName || searchResult.email || '익명'}</UserName>
                        <UserId>ID: {searchResult.workspaceCode.replace('WS-', '')}</UserId>
                      </UserInfo>
                      <AddButton onClick={handleAddFriend}>
                        <UserPlus size={16} />
                        추가
                      </AddButton>
                    </UserCard>
                  </ResultSection>
                )}

                {message && (
                  <InfoBox $type={message.type}>
                    {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                    <span>{message.text}</span>
                  </InfoBox>
                )}

                {!searchResult && !message && (
                  <InfoBox $type="info">
                    <AlertCircle size={18} />
                    <span>
                      친구의 ID(프로필 페이지에서 확인)를 입력하세요.
                      <br />
                      대소문자 구분 없이 입력 가능합니다.
                    </span>
                  </InfoBox>
                )}
              </SearchSection>
            )}

            {activeTab === 'qr' && (
              <SearchSection>
                <QRScanButton onClick={handleQRScan} disabled={searching}>
                  <QrCode size={48} />
                  <div>QR 코드 스캔하기</div>
                  <div style={{ fontSize: '13px', color: '#888', fontWeight: '400' }}>
                    친구의 QR 코드를 카메라로 스캔하세요
                  </div>
                </QRScanButton>

                <GalleryButton onClick={handleGalleryClick} disabled={processingImage}>
                  <Image size={20} />
                  {processingImage ? '처리 중...' : '갤러리에서 QR 이미지 선택'}
                </GalleryButton>

                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryImageSelect}
                  style={{ display: 'none' }}
                />

                {/* html5-qrcode 라이브러리용 숨겨진 div */}
                <div id="gallery-qr-reader-hidden" style={{ display: 'none' }} />

                {message && (
                  <InfoBox $type={message.type}>
                    {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                    <span>{message.text}</span>
                  </InfoBox>
                )}
              </SearchSection>
            )}
          </Content>
        </Modal>
      </Overlay>

      {isQRScannerOpen && (
        <QRScannerModal
          onClose={() => setIsQRScannerOpen(false)}
          onCodeScanned={handleQRCodeScanned}
        />
      )}

      {/* 차단 해제 확인 모달 */}
      {showUnblockConfirm && blockedUserToAdd && (
        <Overlay onClick={(e) => e.target === e.currentTarget && setShowUnblockConfirm(false)} style={{ zIndex: 10004 }}>
          <Modal style={{ maxWidth: '360px' }}>
            <Header>
              <Title style={{ fontSize: '18px' }}>차단된 사용자</Title>
              <CloseButton onClick={() => {
                setShowUnblockConfirm(false);
                setBlockedUserToAdd(null);
              }}>
                <X size={20} />
              </CloseButton>
            </Header>
            <Content style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '16px', color: '#e0e0e0', lineHeight: '1.6' }}>
                <strong style={{ color: '#ff6b6b' }}>
                  {blockedUserToAdd.displayName || '이 사용자'}
                </strong>님은<br />
                차단한 사용자입니다.
              </div>
              <div style={{
                fontSize: '14px',
                color: '#888',
                marginBottom: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '12px',
                borderRadius: '8px'
              }}>
                차단을 해제하고 친구로 추가할까요?
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowUnblockConfirm(false);
                    setBlockedUserToAdd(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#888',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleUnblockAndAdd}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(74, 144, 226, 0.2)',
                    border: '1px solid rgba(74, 144, 226, 0.4)',
                    borderRadius: '8px',
                    color: '#4a90e2',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  해제 후 추가
                </button>
              </div>
            </Content>
          </Modal>
        </Overlay>
      )}
    </>
  );
};

export default AddFriendModal;
