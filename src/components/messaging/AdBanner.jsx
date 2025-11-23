// 광고 배너 컴포넌트 (구글 애드센스/애드몹 320x50 배너)
import styled from 'styled-components';

const BannerContainer = styled.div`
  position: fixed;
  bottom: 80px; /* 푸터 위에 위치 (푸터 높이 80px) */
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
    bottom: 80px; /* 모바일 푸터 높이 80px에 맞춤 */
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

const AdBanner = () => {
  return (
    <BannerContainer>
      <AdPlaceholder>
        광고 영역 (320x50)
      </AdPlaceholder>
    </BannerContainer>
  );
};

export default AdBanner;
