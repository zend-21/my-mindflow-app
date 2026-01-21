// 광고 배너 컴포넌트 (구글 애드센스/애드몹 320x50 배너)
// adSlot prop으로 친구목록/채팅목록 등 각각 다른 광고 슬롯 ID 사용 가능
import styled from 'styled-components';

const BannerContainer = styled.div`
  position: fixed;
  bottom: 60px; /* 푸터 위에 위치 (푸터 높이 60px) */
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 450px;
  height: 50px;
  background: rgba(26, 26, 26, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000; /* 푸터(9999)보다 높게 설정 */
  backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    bottom: 60px; /* 모바일 푸터 높이 60px에 맞춤 */
  }
`;

const AdPlaceholder = styled.div`
  width: 320px;
  height: 50px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 12px;
  font-weight: 500;
`;

/**
 * AdBanner 컴포넌트
 * @param {string} adSlot - 광고 슬롯 ID (예: 'friend-list', 'chat-list')
 *                          구글 애드센스/애드몹 연동 시 각각 다른 광고 단위 ID 사용
 *
 * 사용 예시:
 * - 친구 목록: <AdBanner adSlot="friend-list" />
 * - 채팅 목록: <AdBanner adSlot="chat-list" />
 */
const AdBanner = ({ adSlot = 'default' }) => {
  // TODO: 실제 광고 연동 시 adSlot에 따라 다른 광고 단위 ID 사용
  // 예시:
  // const adUnitIds = {
  //   'friend-list': 'ca-pub-xxxxx/1111111111',
  //   'chat-list': 'ca-pub-xxxxx/2222222222',
  //   'default': 'ca-pub-xxxxx/0000000000'
  // };

  return (
    <BannerContainer>
      <AdPlaceholder>
        광고 영역 (320x50) - {adSlot}
      </AdPlaceholder>
    </BannerContainer>
  );
};

export default AdBanner;
