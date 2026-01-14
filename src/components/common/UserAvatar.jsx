// src/components/common/UserAvatar.jsx
// 사용자 프로필 사진/아바타를 자동으로 표시하는 공통 컴포넌트
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { avatarList } from '../avatars/AvatarIcons';

const AvatarContainer = styled.div`
  width: ${props => props.$size || '40px'};
  height: ${props => props.$size || '40px'};
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  ${props => props.$customStyle || ''}
`;

const AvatarImage = styled.div`
  width: 100%;
  height: 100%;
  background-image: ${props => props.$url ? `url(${props.$url})` : 'none'};
  background-size: cover;
  background-position: center;
`;

const AvatarIconWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$bgColor || 'transparent'};
`;

const AvatarIconInner = styled.div`
  width: 70%;
  height: 70%;
`;

const FallbackAvatar = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$bgColor || '#1E90FF'};
  color: white;
  font-weight: 600;
  font-size: ${props => props.$fontSize || '16px'};
`;

const BACKGROUND_COLORS = {
  'none': 'transparent',
  'lavender': 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'sunset': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'ocean': 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'forest': 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
  'fire': 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
  'sky': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  'rose': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'mint': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
};

/**
 * 사용자 프로필 아바타 컴포넌트
 * @param {string} userId - 사용자 ID
 * @param {string} fallbackText - 프사/아바타 없을 때 표시할 텍스트 (기본: '?')
 * @param {string} size - 아바타 크기 (기본: '40px')
 * @param {string} fontSize - fallback 텍스트 크기 (기본: '16px')
 * @param {string} customStyle - 추가 CSS 스타일
 */
const UserAvatar = ({ userId, fallbackText = '?', size = '40px', fontSize = '16px', customStyle = '' }) => {
  const [profilePicture, setProfilePicture] = useState(null);
  const [avatarSettings, setAvatarSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../firebase/config');
        const { getProfileImageUrl } = await import('../../utils/storageService');

        const settingsRef = doc(db, 'users', userId, 'settings', 'profile');
        const docSnap = await getDoc(settingsRef);

        if (docSnap.exists()) {
          const settings = docSnap.data();
          const imageType = settings.profileImageType || 'avatar';
          const version = settings.profileImageVersion || null;
          const selectedAvatarId = settings.selectedAvatarId || null;
          const avatarBgColor = settings.avatarBgColor || 'none';

          if (imageType === 'photo' && version) {
            const imageUrl = getProfileImageUrl(userId, version);
            setProfilePicture(imageUrl);
            setAvatarSettings(null);
          } else if (selectedAvatarId) {
            setProfilePicture(null);
            setAvatarSettings({ selectedAvatarId, avatarBgColor });
          }
        }
      } catch (error) {
        console.error('프로필 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const renderAvatarIcon = () => {
    if (!avatarSettings?.selectedAvatarId) return null;

    const avatar = avatarList.find(a => a.id === avatarSettings.selectedAvatarId);
    if (!avatar) return null;

    const AvatarComponent = avatar.component;
    const bgColor = BACKGROUND_COLORS[avatarSettings.avatarBgColor] || BACKGROUND_COLORS['none'];

    return (
      <AvatarIconWrapper $bgColor={bgColor}>
        <AvatarIconInner>
          <AvatarComponent />
        </AvatarIconInner>
      </AvatarIconWrapper>
    );
  };

  if (loading) {
    return (
      <AvatarContainer $size={size} $customStyle={customStyle}>
        <FallbackAvatar $fontSize={fontSize}>
          ...
        </FallbackAvatar>
      </AvatarContainer>
    );
  }

  return (
    <AvatarContainer $size={size} $customStyle={customStyle}>
      {profilePicture ? (
        <AvatarImage $url={profilePicture} />
      ) : avatarSettings ? (
        renderAvatarIcon()
      ) : (
        <FallbackAvatar $fontSize={fontSize}>
          {fallbackText.charAt(0).toUpperCase()}
        </FallbackAvatar>
      )}
    </AvatarContainer>
  );
};

export default UserAvatar;
