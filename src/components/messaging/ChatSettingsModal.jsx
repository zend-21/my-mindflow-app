// 채팅 설정 모달
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Volume2, VolumeX, Bell, ChevronDown, ChevronUp, Vibrate, Palette } from 'lucide-react';
import {
  notificationSettings,
  toggleNotification,
  toggleNotificationSound,
  toggleNotificationVibration,
  setNotificationVolume,
  playNewMessageNotification,
  playChatMessageSound
} from '../../utils/notificationSounds';
import ConfirmModal from '../ConfirmModal';
import ChatRoomCustomizer from './ChatRoomCustomizer';
import { showAlert } from '../../utils/alertModal';

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
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  font-size: 18px;
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

const ResetButton = styled.button`
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.3);
  color: #4ade80;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 27px;

  &:hover {
    background: rgba(74, 222, 128, 0.2);
    border-color: rgba(74, 222, 128, 0.5);
    color: #86efac;
  }
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

const ColorPickerGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ColorPickerItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
`;

const ColorPickerLabel = styled.div`
  font-size: 14px;
  color: #e0e0e0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ColorPickerWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ColorInput = styled.input`
  width: 50px;
  height: 35px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: 6px;
  }

  &:hover {
    border-color: rgba(74, 144, 226, 0.5);
    transform: scale(1.05);
  }
`;

const ColorPreview = styled.div`
  width: 80px;
  height: 35px;
  border-radius: 8px;
  background: ${props => props.$color};
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const PresetColors = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const PresetColorButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${props => props.$color};
  border: 2px solid ${props => props.$selected ? '#4a90e2' : 'rgba(255, 255, 255, 0.2)'};
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: ${props => props.$selected ? '0 0 0 2px rgba(74, 144, 226, 0.3)' : 'none'};

  &:hover {
    transform: scale(1.1);
    border-color: #4a90e2;
  }
`;

// 대화방 썸네일 스타일 - 작고 귀여운 휴대폰 모양
const ChatRoomThumbnail = styled.div`
  width: 200px;
  height: 320px;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.15);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.5);
    border-color: rgba(74, 144, 226, 0.6);
  }
`;

const ThumbnailHeader = styled.div`
  background: ${props => props.$bgColor};
  padding: 10px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
`;

const ThumbnailBody = styled.div`
  background: ${props => props.$bgColor};
  padding: 12px 10px;
  height: 230px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  justify-content: center;
`;

const ThumbnailBubble = styled.div`
  background: ${props => props.$bgColor};
  color: ${props => props.$textColor};
  padding: 7px 10px;
  border-radius: 12px;
  font-size: 11px;
  max-width: 70%;
  align-self: ${props => props.$isMine ? 'flex-end' : 'flex-start'};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`;

const ThumbnailFooter = styled.div`
  background: ${props => props.$bgColor};
  padding: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ThumbnailInput = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 6px 10px;
  font-size: 10px;
  color: #999;
`;

const ThumbnailSendButton = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #4a90e2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: white;
  flex-shrink: 0;
`;

const ThumbnailHint = styled.div`
  margin-top: 12px;
  padding: 12px 16px;
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  text-align: center;
  font-size: 13px;
  color: #4a90e2;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(74, 144, 226, 0.15);
    border-color: rgba(74, 144, 226, 0.5);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

// 테마 미니어처 버튼
const ThemeMiniButtons = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px 0 0 0;
  justify-content: space-between;
  width: 320px;
`;

const ThemeMiniButton = styled.button`
  flex: 1;
  height: 120px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    border-color: rgba(74, 144, 226, 0.5);
  }

  &:active {
    transform: translateY(0);
  }
`;

const MiniHeader = styled.div`
  height: 22%;
  background: ${props => props.$bgColor || '#2a2a2a'};
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 400;
  color: ${props => {
    // 배경색의 밝기 계산
    const bgColor = props.$bgColor || '#2a2a2a';

    // rgba 형식 처리
    if (bgColor.startsWith('rgba')) {
      const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
      }
    }

    // hex 형식 처리
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }};
`;

const MiniBody = styled.div`
  flex: 1;
  background: ${props => props.$bgColor || '#1a1a1a'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px 4px;
`;

const MiniBubbleRow = styled.div`
  display: flex;
  gap: 2px;
  width: 100%;
  justify-content: ${props => props.$align === 'right' ? 'flex-end' : 'flex-start'};
  padding: 0 4px;
`;

const MiniBubble = styled.div`
  width: ${props => props.$isMine ? '18px' : '22px'};
  height: 6px;
  border-radius: 3px;
  background: ${props => props.$bgColor};
`;

const MiniInputArea = styled.div`
  height: 20%;
  background: ${props => props.$inputBgColor || '#2a2a2a'};
  border-top: 1px solid rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 4px;
`;

const MiniInput = styled.div`
  flex: 1;
  height: 60%;
  background: ${props => props.$bgColor || 'rgba(255, 255, 255, 0.05)'};
  border-radius: 8px;
`;

const MiniSendButton = styled.div`
  width: 16%;
  height: 60%;
  background: ${props => props.$bgColor || '#4a90e2'};
  border-radius: 50%;
`;

const OptionButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const OptionButton = styled.button`
  flex: 1;
  background: ${props => props.$active ? 'rgba(74, 144, 226, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$active ? 'rgba(74, 144, 226, 0.5)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$active ? '#4a90e2' : '#888'};
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: ${props => props.disabled ? 0.3 : 1};

  &:hover:not(:disabled) {
    background: ${props => props.$active ? 'rgba(74, 144, 226, 0.3)' : 'rgba(255, 255, 255, 0.08)'};
    border-color: ${props => props.$active ? 'rgba(74, 144, 226, 0.6)' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

// 미리보기 모달 스타일
const PreviewModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10004;
  padding: 20px;
`;

const PreviewModalContainer = styled.div`
  background: ${props => props.$bgColor || '#1a1a1a'};
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const PreviewHeader = styled.div`
  padding: 16px 20px;
  background: rgba(26, 26, 26, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PreviewTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
`;

const PreviewMessagesArea = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;

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

const PreviewMessageRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  flex-direction: ${props => props.$isMine ? 'row-reverse' : 'row'};
`;

const PreviewAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${props => props.$color || '#667eea'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #ffffff;
  font-weight: 600;
  flex-shrink: 0;
`;

const PreviewBubble = styled.div`
  background: ${props => props.$color};
  color: ${props => props.$textColor || '#ffffff'};
  padding: 10px 14px;
  border-radius: ${props => props.$isMine ? '16px 4px 16px 16px' : '4px 16px 16px 16px'};
  font-size: 14px;
  line-height: 1.5;
  max-width: 70%;
  box-shadow: ${props => props.$isMine ? '0 2px 8px rgba(74, 144, 226, 0.3)' : 'none'};
`;

const PreviewSenderName = styled.div`
  font-size: 11px;
  color: #888;
  margin-bottom: 4px;
  padding: 0 8px;
`;

const PreviewCloseButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #888;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }
`;

const ChatSettingsModal = ({ onClose }) => {
  const [notificationEnabled, setNotificationEnabled] = useState(notificationSettings.enabled);
  const [soundEnabled, setSoundEnabled] = useState(notificationSettings.soundEnabled);
  const [vibrationEnabled, setVibrationEnabled] = useState(notificationSettings.vibrationEnabled);
  const [volume, setVolume] = useState(notificationSettings.volume * 100);
  const [isSoundSectionOpen, setIsSoundSectionOpen] = useState(() => {
    const saved = localStorage.getItem('chatSettings_soundSectionOpen');
    return saved !== null ? saved === 'true' : false;
  });

  // 대화방 설정 상태
  const [isRoomSectionOpen, setIsRoomSectionOpen] = useState(() => {
    const saved = localStorage.getItem('chatSettings_roomSectionOpen');
    return saved !== null ? saved === 'true' : false;
  });

  // 대화방 색상 설정
  const [roomBgColor, setRoomBgColor] = useState(() => {
    return localStorage.getItem('chatRoom_bgColor') || '#1a1a1a';
  });

  const [myBubbleColor, setMyBubbleColor] = useState(() => {
    return localStorage.getItem('chatRoom_myBubbleColor') || '#4a90e2';
  });

  const [otherBubbleColor, setOtherBubbleColor] = useState(() => {
    return localStorage.getItem('chatRoom_otherBubbleColor') || 'rgba(255, 255, 255, 0.08)';
  });

  const [myTextColor, setMyTextColor] = useState(() => {
    return localStorage.getItem('chatRoom_myTextColor') || '#ffffff';
  });

  const [otherTextColor, setOtherTextColor] = useState(() => {
    return localStorage.getItem('chatRoom_otherTextColor') || '#ffffff';
  });

  const [headerBgColor, setHeaderBgColor] = useState(() => {
    return localStorage.getItem('chatRoom_headerBg') || '#2a2a2a';
  });

  const [headerTextColor, setHeaderTextColor] = useState(() => {
    return localStorage.getItem('chatRoom_headerText') || '#ffffff';
  });

  const [inputBgColor, setInputBgColor] = useState(() => {
    return localStorage.getItem('chatRoom_inputBg') || '#2a2a2a';
  });

  const [inputTextColor, setInputTextColor] = useState(() => {
    return localStorage.getItem('chatRoom_inputText') || '#999999';
  });

  const [sendButtonColor, setSendButtonColor] = useState(() => {
    return localStorage.getItem('chatRoom_sendButtonBg') || '#4a90e2';
  });

  const [inputFieldBgColor, setInputFieldBgColor] = useState(() => {
    return localStorage.getItem('chatRoom_inputFieldBg') || 'rgba(255, 255, 255, 0.05)';
  });

  // 확인 모달 상태
  const [showResetSoundConfirm, setShowResetSoundConfirm] = useState(false);
  const [showResetRoomConfirm, setShowResetRoomConfirm] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // 새로운 대화방 커스터마이저 모달 상태
  const [showCustomizerModal, setShowCustomizerModal] = useState(false);

  useEffect(() => {
    // 현재 설정 로드
    setNotificationEnabled(notificationSettings.enabled);
    setSoundEnabled(notificationSettings.soundEnabled);
    setVibrationEnabled(notificationSettings.vibrationEnabled);
    setVolume(notificationSettings.volume * 100);
  }, []);

  // 대화방 색상 변경 시 썸네일 업데이트
  useEffect(() => {
    const handleColorChange = () => {
      setRoomBgColor(localStorage.getItem('chatRoom_bgColor') || '#1a1a1a');
      setMyBubbleColor(localStorage.getItem('chatRoom_myBubbleColor') || '#4a90e2');
      setOtherBubbleColor(localStorage.getItem('chatRoom_otherBubbleColor') || 'rgba(255, 255, 255, 0.08)');
      setMyTextColor(localStorage.getItem('chatRoom_myTextColor') || '#ffffff');
      setOtherTextColor(localStorage.getItem('chatRoom_otherTextColor') || '#ffffff');
      setHeaderBgColor(localStorage.getItem('chatRoom_headerBg') || '#2a2a2a');
      setHeaderTextColor(localStorage.getItem('chatRoom_headerText') || '#ffffff');
      setInputBgColor(localStorage.getItem('chatRoom_inputBg') || '#2a2a2a');
      setInputTextColor(localStorage.getItem('chatRoom_inputText') || '#999999');
      setSendButtonColor(localStorage.getItem('chatRoom_sendButtonBg') || '#4a90e2');
      setInputFieldBgColor(localStorage.getItem('chatRoom_inputFieldBg') || 'rgba(255, 255, 255, 0.05)');
    };

    window.addEventListener('chatRoomColorChange', handleColorChange);
    return () => {
      window.removeEventListener('chatRoomColorChange', handleColorChange);
    };
  }, []);

  const toggleSoundSection = () => {
    const newState = !isSoundSectionOpen;
    setIsSoundSectionOpen(newState);
    localStorage.setItem('chatSettings_soundSectionOpen', newState.toString());
  };

  const toggleRoomSection = () => {
    const newState = !isRoomSectionOpen;
    setIsRoomSectionOpen(newState);
    localStorage.setItem('chatSettings_roomSectionOpen', newState.toString());
  };

  const handleRoomBgColorChange = (color) => {
    setRoomBgColor(color);
    localStorage.setItem('chatRoom_bgColor', color);
    // 같은 탭에서 즉시 반영되도록 커스텀 이벤트 발생
    window.dispatchEvent(new Event('chatRoomColorChange'));
  };

  const handleMyBubbleColorChange = (color) => {
    setMyBubbleColor(color);
    localStorage.setItem('chatRoom_myBubbleColor', color);
    // 같은 탭에서 즉시 반영되도록 커스텀 이벤트 발생
    window.dispatchEvent(new Event('chatRoomColorChange'));
  };

  const handleOtherBubbleColorChange = (color) => {
    setOtherBubbleColor(color);
    localStorage.setItem('chatRoom_otherBubbleColor', color);
    // 같은 탭에서 즉시 반영되도록 커스텀 이벤트 발생
    window.dispatchEvent(new Event('chatRoomColorChange'));
  };

  const handleMyTextColorChange = (color) => {
    setMyTextColor(color);
    localStorage.setItem('chatRoom_myTextColor', color);
    // 같은 탭에서 즉시 반영되도록 커스텀 이벤트 발생
    window.dispatchEvent(new Event('chatRoomColorChange'));
  };

  const handleOtherTextColorChange = (color) => {
    setOtherTextColor(color);
    localStorage.setItem('chatRoom_otherTextColor', color);
    // 같은 탭에서 즉시 반영되도록 커스텀 이벤트 발생
    window.dispatchEvent(new Event('chatRoomColorChange'));
  };

  const handleResetRoomColors = () => {
    const defaultBgColor = '#1a1a1a';
    const defaultMyBubble = '#4a90e2';
    const defaultOtherBubble = 'rgba(255, 255, 255, 0.08)';
    const defaultMyText = '#ffffff';
    const defaultOtherText = '#ffffff';
    const defaultHeaderBg = '#2a2a2a';
    const defaultHeaderText = '#ffffff';
    const defaultInputBg = '#2a2a2a';
    const defaultInputText = '#999999';
    const defaultSendButton = '#4a90e2';
    const defaultInputFieldBg = 'rgba(255, 255, 255, 0.05)';

    setRoomBgColor(defaultBgColor);
    setMyBubbleColor(defaultMyBubble);
    setOtherBubbleColor(defaultOtherBubble);
    setMyTextColor(defaultMyText);
    setOtherTextColor(defaultOtherText);
    setHeaderBgColor(defaultHeaderBg);
    setHeaderTextColor(defaultHeaderText);
    setInputBgColor(defaultInputBg);
    setInputTextColor(defaultInputText);
    setSendButtonColor(defaultSendButton);
    setInputFieldBgColor(defaultInputFieldBg);

    localStorage.setItem('chatRoom_bgColor', defaultBgColor);
    localStorage.setItem('chatRoom_myBubbleColor', defaultMyBubble);
    localStorage.setItem('chatRoom_otherBubbleColor', defaultOtherBubble);
    localStorage.setItem('chatRoom_myTextColor', defaultMyText);
    localStorage.setItem('chatRoom_otherTextColor', defaultOtherText);
    localStorage.setItem('chatRoom_headerBg', defaultHeaderBg);
    localStorage.setItem('chatRoom_headerText', defaultHeaderText);
    localStorage.setItem('chatRoom_inputBg', defaultInputBg);
    localStorage.setItem('chatRoom_inputText', defaultInputText);
    localStorage.setItem('chatRoom_sendButtonBg', defaultSendButton);
    localStorage.setItem('chatRoom_inputFieldBg', defaultInputFieldBg);

    // 같은 탭에서 즉시 반영되도록 커스텀 이벤트 발생
    window.dispatchEvent(new Event('chatRoomColorChange'));
  };

  // 테마 불러오기 핸들러
  const handleLoadTheme = (slotNumber) => {
    const saved = localStorage.getItem(`chatTheme_${slotNumber}`);
    if (saved) {
      const theme = JSON.parse(saved);
      // 즉시 대화방에 적용
      Object.entries(theme).forEach(([key, value]) => {
        localStorage.setItem(`chatRoom_${key === 'headerBg' ? 'headerBgColor' :
                                          key === 'headerText' ? 'headerTextColor' :
                                          key === 'roomBg' ? 'bgColor' :
                                          key === 'myBubbleBg' ? 'myBubbleColor' :
                                          key === 'myBubbleText' ? 'myTextColor' :
                                          key === 'otherBubbleBg' ? 'otherBubbleColor' :
                                          key === 'otherBubbleText' ? 'otherTextColor' :
                                          key === 'inputBg' ? 'inputBgColor' :
                                          key === 'inputText' ? 'inputTextColor' :
                                          key === 'sendButtonBg' ? 'sendButtonBgColor' :
                                          'sendButtonIconColor'}`, value);
      });
      window.dispatchEvent(new Event('chatRoomColorChange'));
      alert(`테마 ${slotNumber}을 적용했습니다!`);
    } else {
      alert('저장된 테마가 없습니다.');
    }
  };

  // 저장된 테마 가져오기
  const getTheme = (slotNumber) => {
    const saved = localStorage.getItem(`chatTheme_${slotNumber}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  };

  const handleToggleNotification = async () => {
    const newValue = !notificationEnabled;
    setNotificationEnabled(newValue);
    await toggleNotification(newValue);

    // 전체 OFF 시 소리/진동도 비활성화
    if (!newValue) {
      setSoundEnabled(false);
      setVibrationEnabled(false);
    } else {
      // 전체 ON 시 소리/진동 모두 활성화
      setSoundEnabled(true);
      setVibrationEnabled(true);
      await toggleNotificationSound(true);
      await toggleNotificationVibration(true);
    }
  };

  const handleToggleSound = async () => {
    if (!notificationEnabled) return;
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    await toggleNotificationSound(newValue);

    // 소리와 진동이 모두 꺼지면 마스터 토글도 OFF
    if (!newValue && !vibrationEnabled) {
      setNotificationEnabled(false);
      await toggleNotification(false);
    }
  };

  const handleToggleVibration = async () => {
    if (!notificationEnabled) return;
    const newValue = !vibrationEnabled;
    setVibrationEnabled(newValue);
    await toggleNotificationVibration(newValue);

    // 소리와 진동이 모두 꺼지면 마스터 토글도 OFF
    if (!soundEnabled && !newValue) {
      setNotificationEnabled(false);
      await toggleNotification(false);
    }
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

  const handleResetSound = async () => {
    // 초기화: 알림음 & 진동 ON, 음량 30%
    setNotificationEnabled(true);
    setSoundEnabled(true);
    setVibrationEnabled(true);
    setVolume(30);

    await toggleNotification(true);
    await toggleNotificationSound(true);
    await toggleNotificationVibration(true);
    await setNotificationVolume(0.3);

    console.log('✅ 알림 설정 초기화 완료 (알림음&진동 ON, 음량 30%)');
    setShowResetSoundConfirm(false);
  };

  const confirmResetSound = () => {
    handleResetSound();
  };

  const confirmResetRoom = () => {
    handleResetRoomColors();
    setShowResetRoomConfirm(false);
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
                <ResetButton onClick={(e) => { e.stopPropagation(); setShowResetSoundConfirm(true); }}>
                  초기화
                </ResetButton>
              </SectionTitleLeft>
              {isSoundSectionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </SectionTitle>

            <SectionContent $isOpen={isSoundSectionOpen}>
              <SettingItem>
                <SettingHeader>
                  <SettingLabel>알림음 & 진동</SettingLabel>
                  <ToggleSwitch
                    $active={notificationEnabled}
                    onClick={handleToggleNotification}
                  />
                </SettingHeader>
              </SettingItem>

              <SettingItem>
                <SettingHeader $hasContent>
                  <SettingLabel>알림 옵션</SettingLabel>
                </SettingHeader>

                <OptionButtonGroup>
                  <OptionButton
                    $active={soundEnabled}
                    disabled={!notificationEnabled}
                    onClick={handleToggleSound}
                  >
                    {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    소리
                  </OptionButton>
                  <OptionButton
                    $active={vibrationEnabled}
                    disabled={!notificationEnabled}
                    onClick={handleToggleVibration}
                  >
                    <Vibrate size={20} />
                    진동
                  </OptionButton>
                </OptionButtonGroup>
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
                    disabled={!notificationEnabled || !soundEnabled}
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
                    disabled={!notificationEnabled || !soundEnabled}
                  >
                    <Bell size={20} />
                    메시지 알림음
                  </TestButton>
                  <TestButton
                    onClick={handleTestChatSound}
                  >
                    <Volume2 size={20} />
                    채팅중 수신음
                  </TestButton>
                </div>
              </SettingItem>
            </SectionContent>
          </Section>

          {/* 대화방 설정 */}
          <Section>
            <SectionTitle onClick={toggleRoomSection}>
              <SectionTitleLeft>
                <Palette size={18} />
                대화방 설정
                <ResetButton onClick={(e) => { e.stopPropagation(); setShowResetRoomConfirm(true); }}>
                  초기화
                </ResetButton>
              </SectionTitleLeft>
              {isRoomSectionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </SectionTitle>

            <SectionContent $isOpen={isRoomSectionOpen}>
              <SettingItem>
                <SettingHeader>
                  <SettingLabel>대화방 테마 편집</SettingLabel>
                </SettingHeader>
                <div style={{
                  padding: '16px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  {/* 대화방 미리보기 썸네일 - 휴대폰 비율 */}
                  <ChatRoomThumbnail onClick={() => setShowCustomizerModal(true)}>
                    <ThumbnailHeader $bgColor={headerBgColor}>
                      <span style={{ color: headerTextColor }}>
                        대화방 타이틀
                      </span>
                    </ThumbnailHeader>
                    <ThumbnailBody $bgColor={roomBgColor}>
                      <ThumbnailBubble
                        $bgColor={otherBubbleColor}
                        $textColor={otherTextColor}
                        $isMine={false}
                      >
                        안녕하세요!
                      </ThumbnailBubble>
                      <ThumbnailBubble
                        $bgColor={myBubbleColor}
                        $textColor={myTextColor}
                        $isMine={true}
                      >
                        반가워요 😊
                      </ThumbnailBubble>
                      <ThumbnailBubble
                        $bgColor={otherBubbleColor}
                        $textColor={otherTextColor}
                        $isMine={false}
                      >
                        👆 여길 터치해보세요
                      </ThumbnailBubble>
                    </ThumbnailBody>
                    <ThumbnailFooter $bgColor={inputBgColor}>
                      <ThumbnailInput style={{ color: inputTextColor, background: inputFieldBgColor }}>메시지 입력...</ThumbnailInput>
                      <ThumbnailSendButton style={{ background: sendButtonColor }}>▶</ThumbnailSendButton>
                    </ThumbnailFooter>
                  </ChatRoomThumbnail>
                </div>
              </SettingItem>
            </SectionContent>
          </Section>
        </Content>
      </Modal>

      {/* 알림음 설정 초기화 확인 모달 */}
      {showResetSoundConfirm && (
        <ConfirmModal
          icon="🔔"
          title="알림음 설정 초기화"
          message={`알림음 설정을 기본값으로 초기화하시겠습니까?

• 알림음 & 진동: ON
• 음량: 30%`}
          confirmText="초기화"
          cancelText="취소"
          onConfirm={confirmResetSound}
          onCancel={() => setShowResetSoundConfirm(false)}
        />
      )}

      {/* 대화방 설정 초기화 확인 모달 */}
      {showResetRoomConfirm && (
        <ConfirmModal
          icon="🎨"
          title="대화방 설정 초기화"
          message={`대화방 테마를 초기화하시겠습니까?`}
          confirmText="초기화"
          cancelText="취소"
          onConfirm={confirmResetRoom}
          onCancel={() => setShowResetRoomConfirm(false)}
        />
      )}

      {/* 색상 미리보기 모달 */}
      {showPreviewModal && (
        <PreviewModalOverlay onClick={(e) => e.target === e.currentTarget && setShowPreviewModal(false)}>
          <PreviewModalContainer $bgColor={roomBgColor}>
            <PreviewHeader>
              <PreviewTitle>대화방 색상 미리보기</PreviewTitle>
              <PreviewCloseButton onClick={() => setShowPreviewModal(false)}>
                <X size={20} />
              </PreviewCloseButton>
            </PreviewHeader>

            <PreviewMessagesArea>
              {/* 상대방 메시지 */}
              <PreviewMessageRow $isMine={false}>
                <PreviewAvatar $color="#667eea">친</PreviewAvatar>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <PreviewSenderName>친구</PreviewSenderName>
                  <PreviewBubble $color={otherBubbleColor} $textColor={otherTextColor} $isMine={false}>
                    안녕하세요! 오늘 날씨 정말 좋네요 😊
                  </PreviewBubble>
                </div>
              </PreviewMessageRow>

              {/* 내 메시지 */}
              <PreviewMessageRow $isMine={true}>
                <PreviewAvatar $color="#4a90e2">나</PreviewAvatar>
                <PreviewBubble $color={myBubbleColor} $textColor={myTextColor} $isMine={true}>
                  네, 맞아요! 산책하기 딱 좋은 날씨예요 ☀️
                </PreviewBubble>
              </PreviewMessageRow>

              {/* 상대방 메시지 */}
              <PreviewMessageRow $isMine={false}>
                <PreviewAvatar $color="#667eea">친</PreviewAvatar>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <PreviewSenderName>친구</PreviewSenderName>
                  <PreviewBubble $color={otherBubbleColor} $textColor={otherTextColor} $isMine={false}>
                    나중에 같이 산책할래요?
                  </PreviewBubble>
                </div>
              </PreviewMessageRow>

              {/* 내 메시지 */}
              <PreviewMessageRow $isMine={true}>
                <PreviewAvatar $color="#4a90e2">나</PreviewAvatar>
                <PreviewBubble $color={myBubbleColor} $textColor={myTextColor} $isMine={true}>
                  좋아요! 몇 시에 만날까요?
                </PreviewBubble>
              </PreviewMessageRow>

              {/* 상대방 메시지 */}
              <PreviewMessageRow $isMine={false}>
                <PreviewAvatar $color="#667eea">친</PreviewAvatar>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <PreviewSenderName>친구</PreviewSenderName>
                  <PreviewBubble $color={otherBubbleColor} $textColor={otherTextColor} $isMine={false}>
                    3시에 공원 앞에서 만나요! 👍
                  </PreviewBubble>
                </div>
              </PreviewMessageRow>
            </PreviewMessagesArea>
          </PreviewModalContainer>
        </PreviewModalOverlay>
      )}

      {/* 대화방 테마 커스터마이저 모달 */}
      {showCustomizerModal && (
        <ChatRoomCustomizer onClose={() => setShowCustomizerModal(false)} />
      )}
    </Overlay>
  );
};

export default ChatSettingsModal;
