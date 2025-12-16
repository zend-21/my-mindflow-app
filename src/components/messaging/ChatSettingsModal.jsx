// 채팅 설정 모달
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Volume2, VolumeX, Bell, BellOff, ChevronDown, ChevronUp } from 'lucide-react';
import {
  notificationSettings,
  toggleNotificationSound,
  setNotificationVolume,
  playNewMessageNotification,
  playChatMessageSound
} from '../../utils/notificationSounds';

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
  max-width: 500px;
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
  max-height: 60vh;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
`;

const Section = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;

  &:hover {
    color: #4a90e2;
  }
`;

const SectionTitleLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionContent = styled.div`
  max-height: ${props => props.$isOpen ? '1000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
`;

const SettingItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.$hasContent ? '12px' : '0'};
`;

const SettingLabel = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: #e0e0e0;
`;

const SettingDescription = styled.div`
  font-size: 13px;
  color: #888;
  line-height: 1.5;
  margin-top: 4px;
`;

const ToggleSwitch = styled.button`
  width: 48px;
  height: 28px;
  border-radius: 14px;
  border: none;
  background: ${props => props.$active ? 'linear-gradient(135deg, #4a90e2, #357abd)' : 'rgba(255, 255, 255, 0.1)'};
  position: relative;
  cursor: pointer;
  transition: all 0.3s;

  &::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #ffffff;
    top: 4px;
    left: ${props => props.$active ? '24px' : '4px'};
    transition: all 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &:hover {
    opacity: 0.9;
  }
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const VolumeIcon = styled.div`
  color: #4a90e2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const VolumeSlider = styled.input`
  flex: 1;
  height: 6px;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.1);

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4a90e2, #357abd);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.4);
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4a90e2, #357abd);
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.4);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const VolumeValue = styled.div`
  font-size: 13px;
  color: #888;
  min-width: 40px;
  text-align: right;
  font-weight: 600;
`;

const TestButton = styled.button`
  width: 100%;
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  color: #4a90e2;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover:not(:disabled) {
    background: rgba(74, 144, 226, 0.2);
    border-color: rgba(74, 144, 226, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PlaceholderSection = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  color: #666;
  font-size: 14px;
`;

const ChatSettingsModal = ({ onClose }) => {
  const [soundEnabled, setSoundEnabled] = useState(notificationSettings.enabled);
  const [volume, setVolume] = useState(notificationSettings.volume * 100);
  const [isSoundSectionOpen, setIsSoundSectionOpen] = useState(() => {
    const saved = localStorage.getItem('chatSettings_soundSectionOpen');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    // 현재 설정 로드
    setSoundEnabled(notificationSettings.enabled);
    setVolume(notificationSettings.volume * 100);
  }, []);

  const toggleSoundSection = () => {
    const newState = !isSoundSectionOpen;
    setIsSoundSectionOpen(newState);
    localStorage.setItem('chatSettings_soundSectionOpen', newState.toString());
  };

  const handleToggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    toggleNotificationSound(newValue);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    setNotificationVolume(newVolume / 100);
  };

  const handleTestNotification = () => {
    playNewMessageNotification();
  };

  const handleTestChatSound = () => {
    playChatMessageSound();
  };

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Modal>
        <Header>
          <Title>채팅 설정</Title>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <Content>
          {/* 알림음 설정 */}
          <Section>
            <SectionTitle onClick={toggleSoundSection}>
              <SectionTitleLeft>
                <Bell size={18} />
                알림음 설정
              </SectionTitleLeft>
              {isSoundSectionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </SectionTitle>

            <SectionContent $isOpen={isSoundSectionOpen}>
              <SettingItem>
                <SettingHeader>
                  <SettingLabel>알림음 사용</SettingLabel>
                  <ToggleSwitch
                    $active={soundEnabled}
                    onClick={handleToggleSound}
                  />
                </SettingHeader>
              </SettingItem>

              <SettingItem>
                <SettingHeader $hasContent>
                  <SettingLabel>음량 조절</SettingLabel>
                </SettingHeader>

                <VolumeControl>
                  <VolumeIcon>
                    {soundEnabled && volume > 0 ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  </VolumeIcon>
                  <VolumeSlider
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    disabled={!soundEnabled}
                  />
                  <VolumeValue>{Math.round(volume)}%</VolumeValue>
                </VolumeControl>
              </SettingItem>

              <SettingItem>
                <SettingHeader $hasContent>
                  <SettingLabel>효과음 테스트</SettingLabel>
                </SettingHeader>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <TestButton
                    onClick={handleTestNotification}
                    disabled={!soundEnabled}
                  >
                    <Bell size={20} />
                    메시지 알림음
                  </TestButton>
                  <TestButton
                    onClick={handleTestChatSound}
                    disabled={!soundEnabled}
                  >
                    <Volume2 size={20} />
                    채팅중 수신음
                  </TestButton>
                </div>
              </SettingItem>
            </SectionContent>
          </Section>

          {/* 향후 추가될 설정들 */}
          <Section>
            <SectionTitle>기타 설정</SectionTitle>
            <PlaceholderSection>
              추가 설정 기능이 곧 제공될 예정입니다
            </PlaceholderSection>
          </Section>
        </Content>
      </Modal>
    </Overlay>
  );
};

export default ChatSettingsModal;
