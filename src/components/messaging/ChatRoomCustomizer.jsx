// 대화방 색상 커스터마이저 컴포넌트
import { useState } from 'react';
import styled from 'styled-components';
import { X, Save, Palette, RotateCcw } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';
import { showAlert } from '../../utils/alertModal';

// 스타일 컴포넌트들
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10005;
  padding: 20px;
`;

const Container = styled.div`
  background: #1a1a1a;
  border-radius: 16px;
  width: 95vw;
  height: 95vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  position: relative;
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

const HeaderButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ResetButton = styled.button`
  background: rgba(255, 100, 100, 0.1);
  border: 1px solid rgba(255, 100, 100, 0.3);
  color: #ff6464;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  margin-right: 20px;

  &:hover {
    background: rgba(255, 100, 100, 0.2);
    border-color: rgba(255, 100, 100, 0.5);
    color: #ff8888;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const CloseButton = styled.button`
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

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 0;

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

const InstructionText = styled.div`
  padding: 16px 20px;
  text-align: center;
  color: #888;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const PreviewSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  align-items: center;
  justify-content: center;
`;

const MockChatRoom = styled.div`
  background: ${props => props.$bgColor};
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 600px;
  height: 100%;
  max-height: 85vh;
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
`;

const MockHeader = styled.div`
  background: ${props => props.$bgColor};
  color: ${props => props.$textColor};
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border-radius: 24px 24px 0 0;

  &:hover {
    background: ${props => props.$bgColor}dd;
  }

  ${props => props.$selected && `
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border: 2px solid #4a90e2;
      border-radius: 24px 24px 0 0;
      pointer-events: none;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `}
`;

const MockAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
`;

const MockHeaderText = styled.div`
  font-size: 16px;
  font-weight: 600;
`;

const MockMessagesArea = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  ${props => props.$selected && `
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border: 2px solid #4a90e2;
      pointer-events: none;
      animation: pulse 2s ease-in-out infinite;
    }
  `}

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
`;

const MockMessageRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  flex-direction: ${props => props.$isMine ? 'row-reverse' : 'row'};
`;

const MockMessageBubble = styled.div`
  background: ${props => props.$bgColor};
  color: ${props => props.$textColor};
  padding: 10px 14px;
  border-radius: ${props => props.$isMine ? '16px 4px 16px 16px' : '4px 16px 16px 16px'};
  font-size: 14px;
  max-width: 70%;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  box-shadow: ${props => props.$isMine ? '0 2px 8px rgba(74, 144, 226, 0.2)' : 'none'};

  &:hover {
    transform: scale(1.02);
  }

  ${props => props.$selected && `
    &::after {
      content: '';
      position: absolute;
      inset: -2px;
      border: 2px solid #4a90e2;
      border-radius: inherit;
      pointer-events: none;
      animation: pulse 2s ease-in-out infinite;
    }
  `}
`;

const MockInputArea = styled.div`
  background: ${props => props.$bgColor};
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 12px;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border-radius: 0 0 24px 24px;

  &:hover {
    background: ${props => props.$bgColor}dd;
  }

  ${props => props.$selected && `
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border: 2px solid #4a90e2;
      border-radius: 0 0 24px 24px;
      pointer-events: none;
      animation: pulse 2s ease-in-out infinite;
    }
  `}
`;

const MockInput = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  color: ${props => props.$textColor};
  padding: 10px 14px;
  border-radius: 20px;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const MockSendButton = styled.div`
  background: ${props => props.$bgColor};
  color: ${props => props.$iconColor};
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);

  &:hover {
    transform: scale(1.05);
  }

  ${props => props.$selected && `
    &::after {
      content: '';
      position: absolute;
      inset: -2px;
      border: 2px solid #4a90e2;
      border-radius: 50%;
      pointer-events: none;
      animation: pulse 2s ease-in-out infinite;
    }
  `}
`;

// 작은 색상 파레트 (화면을 가리지 않음)
const ColorPalette = styled.div`
  position: fixed;
  ${props => props.$isInputArea ? 'top: 200px;' : 'bottom: 130px;'}
  right: 20px;
  background: #2a2a2a;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10007;
  min-width: 280px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
`;

const PaletteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const PaletteTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
`;

const PaletteCloseButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #888;
  padding: 4px;
  border-radius: 6px;
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

const PaletteSection = styled.div`
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ColorPickerSection = styled.div`
  width: 320px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const PickerTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 16px;
`;

const PickerHint = styled.div`
  font-size: 13px;
  color: #888;
  margin-bottom: 16px;
  line-height: 1.5;
`;

const ColorOption = styled.div`
  margin-bottom: 16px;
`;

const ColorLabel = styled.div`
  font-size: 14px;
  color: #e0e0e0;
  margin-bottom: 8px;
`;

const ColorPickerWrapper = styled.div`
  position: relative;
  width: 50px;
  height: 40px;
`;

const ColorInput = styled.input`
  width: 100%;
  height: 100%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;

  &:hover + div {
    border-color: #4a90e2;
    transform: scale(1.05);
  }
`;

const ColorInputDisplay = styled.div`
  width: 100%;
  height: 100%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: ${props => props.$color};
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  pointer-events: none;
  position: relative;
`;

const ColorPreview = styled.div`
  flex: 1;
  height: 40px;
  border-radius: 8px;
  background: ${props => props.$color};
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: ${props => {
    // 밝기 계산해서 텍스트 색상 결정
    const hex = props.$color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000' : '#fff';
  }};
  font-weight: 600;
`;

const PresetColors = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const PresetColorButton = styled.button`
  width: 50px;
  height: 40px;
  border-radius: 8px;
  background: ${props => props.$color};
  border: 2px solid ${props => props.$selected ? '#4a90e2' : 'rgba(255, 255, 255, 0.2)'};
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    transform: scale(1.05);
    border-color: #4a90e2;
  }
`;

const ThemeSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const ThemeButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const ThemeButton = styled.button`
  flex: 1;
  padding: 12px;
  background: ${props => props.$active ? 'rgba(74, 144, 226, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$active ? '#4a90e2' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$active ? '#4a90e2' : '#e0e0e0'};
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  &:hover {
    background: rgba(74, 144, 226, 0.15);
    border-color: #4a90e2;
  }
`;

// 하단 버튼 영역
const BottomBar = styled.div`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1a1a1a;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  z-index: 10;
`;

const BottomButton = styled.button`
  flex: 1;
  padding: 14px 20px;
  background: ${props => props.$variant === 'apply'
    ? 'linear-gradient(135deg, #667eea, #764ba2)'
    : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$variant === 'apply'
    ? 'transparent'
    : 'rgba(255, 255, 255, 0.1)'};
  color: #ffffff;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    background: ${props => props.$variant === 'apply'
      ? 'linear-gradient(135deg, #667eea, #764ba2)'
      : 'rgba(255, 255, 255, 0.08)'};
  }

  &:active {
    transform: translateY(0);
  }
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  color: #ffffff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }
`;

const ChatRoomCustomizer = ({ onClose }) => {
  // 색상 상태들
  const [colors, setColors] = useState({
    headerBg: localStorage.getItem('chatRoom_headerBg') || '#2a2a2a',
    headerText: localStorage.getItem('chatRoom_headerText') || '#ffffff',
    roomBg: localStorage.getItem('chatRoom_bgColor') || '#1a1a1a',
    myBubbleBg: localStorage.getItem('chatRoom_myBubbleColor') || '#4a90e2',
    myBubbleText: localStorage.getItem('chatRoom_myTextColor') || '#ffffff',
    otherBubbleBg: localStorage.getItem('chatRoom_otherBubbleColor') || 'rgba(255, 255, 255, 0.08)',
    otherBubbleText: localStorage.getItem('chatRoom_otherTextColor') || '#ffffff',
    inputAreaBg: localStorage.getItem('chatRoom_inputBg') || '#2a2a2a',
    inputFieldBg: localStorage.getItem('chatRoom_inputFieldBg') || 'rgba(255, 255, 255, 0.05)',
    inputText: localStorage.getItem('chatRoom_inputText') || '#999999',
    sendButtonBg: localStorage.getItem('chatRoom_sendButtonBg') || '#4a90e2',
    sendButtonIcon: localStorage.getItem('chatRoom_sendButtonIcon') || '#ffffff',
  });

  const [selectedArea, setSelectedArea] = useState(null);

  // 직전 색상 저장
  const [previousColors, setPreviousColors] = useState({});

  // 모달 상태
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 기본 색상 (초기화용)
  const defaultColors = {
    headerBg: '#2a2a2a',
    headerText: '#ffffff',
    roomBg: '#1a1a1a',
    myBubbleBg: '#4a90e2',
    myBubbleText: '#ffffff',
    otherBubbleBg: 'rgba(255, 255, 255, 0.08)',
    otherBubbleText: '#ffffff',
    inputAreaBg: '#2a2a2a',
    inputFieldBg: 'rgba(255, 255, 255, 0.05)',
    inputText: '#999999',
    sendButtonBg: '#4a90e2',
    sendButtonIcon: '#ffffff',
  };

  // 영역 정보
  const areaInfo = {
    header: { label: '대화방 상단', colors: ['headerBg', 'headerText'] },
    background: { label: '대화방 배경', colors: ['roomBg'] },
    myBubble: { label: '내 말풍선', colors: ['myBubbleBg', 'myBubbleText'] },
    otherBubble: { label: '상대 말풍선', colors: ['otherBubbleBg', 'otherBubbleText'] },
    inputArea: { label: '하단 입력창', colors: ['inputAreaBg', 'inputFieldBg', 'inputText', 'sendButtonBg'] },
  };

  // 색상 변경 핸들러 - 미리보기만 변경 (적용 버튼 눌러야 실제 적용)
  const handleColorChange = (key, value) => {
    // 직전 색상 저장
    setPreviousColors(prev => ({ ...prev, [key]: colors[key] }));

    // 상태만 변경 (미리보기용)
    setColors(prev => ({ ...prev, [key]: value }));
  };

  // 프리셋 색상
  const presets = {
    headerBg: ['rgba(26, 26, 26, 0.95)', '#1a1a1a', '#0f0f0f', '#2a2a2a'],
    headerText: ['#ffffff', '#e0e0e0', '#cccccc', '#4a90e2'],
    roomBg: ['#1a1a1a', '#0f0f0f', '#2a2a2a', '#1f1f1f'],
    myBubbleBg: ['#4a90e2', '#667eea', '#764ba2', '#5568d3'],
    myBubbleText: ['#ffffff', '#f0f0f0', '#e0e0e0', '#cccccc'],
    otherBubbleBg: ['rgba(255, 255, 255, 0.08)', '#333333', '#2a2a2a', '#404040'],
    otherBubbleText: ['#ffffff', '#f0f0f0', '#e0e0e0', '#cccccc'],
    inputBg: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.08)', '#2a2a2a', '#333333'],
    inputText: ['#e0e0e0', '#ffffff', '#cccccc', '#999999'],
    sendButtonBg: ['#4a90e2', '#667eea', '#764ba2', '#5568d3'],
    sendButtonIcon: ['#ffffff', '#f0f0f0', '#e0e0e0', '#cccccc'],
  };

  // 현재 색상을 실제 대화방에 적용
  const applyColors = () => {
    Object.entries(colors).forEach(([key, value]) => {
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
  };

  // 테마 저장/불러오기
  const saveTheme = (slotNumber) => {
    localStorage.setItem(`chatTheme_${slotNumber}`, JSON.stringify(colors));
    showAlert(`테마 ${slotNumber}에 저장되었습니다!`, '성공');
  };

  const loadTheme = (slotNumber) => {
    const saved = localStorage.getItem(`chatTheme_${slotNumber}`);
    if (saved) {
      const theme = JSON.parse(saved);
      setColors(theme);
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
      showAlert(`테마 ${slotNumber}을 불러와서 적용했습니다!`, '성공');
    } else {
      showAlert('저장된 테마가 없습니다.', '알림');
    }
  };

  const getColorLabel = (key) => {
    const labels = {
      headerBg: '배경색',
      headerText: '텍스트 색',
      roomBg: '배경색',
      myBubbleBg: '말풍선 색',
      myBubbleText: '텍스트 색',
      otherBubbleBg: '말풍선 색',
      otherBubbleText: '텍스트 색',
      inputAreaBg: '입력창 영역 배경색',
      inputFieldBg: '입력 필드 배경색',
      inputText: '입력 텍스트 색',
      sendButtonBg: '보내기 버튼 색',
      sendButtonIcon: '아이콘 색',
    };
    return labels[key] || key;
  };

  // 테마 저장 핸들러
  const handleSaveTheme = (slotNumber) => {
    localStorage.setItem(`chatTheme_${slotNumber}`, JSON.stringify(colors));
    setSuccessMessage(`테마 ${slotNumber}로 저장되었습니다`);
    setShowSuccessModal(true);
  };

  // 초기화 확인
  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  // 초기화 핸들러 - 편집 중인 색상만 기본값으로 되돌림 (localStorage에는 저장 안 함)
  const confirmReset = () => {
    setColors(defaultColors);
    setPreviousColors({});
    setShowResetConfirm(false);
  };

  // 적용 확인
  const handleApplyClick = () => {
    setShowApplyConfirm(true);
  };

  // 적용 핸들러
  const confirmApply = () => {
    Object.entries(colors).forEach(([key, value]) => {
      const storageKey = key === 'roomBg' ? 'chatRoom_bgColor' :
                         key === 'myBubbleBg' ? 'chatRoom_myBubbleColor' :
                         key === 'myBubbleText' ? 'chatRoom_myTextColor' :
                         key === 'otherBubbleBg' ? 'chatRoom_otherBubbleColor' :
                         key === 'otherBubbleText' ? 'chatRoom_otherTextColor' :
                         key === 'inputAreaBg' ? 'chatRoom_inputBg' :
                         `chatRoom_${key}`;
      localStorage.setItem(storageKey, value);
    });
    window.dispatchEvent(new Event('chatRoomColorChange'));
    setShowApplyConfirm(false);
    onClose();
  };

  return (
    <>
      <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
        <Container>
          <Header>
            <Title>대화방 테마 편집</Title>
            <HeaderButtons>
              <ResetButton onClick={handleResetClick}>
                <RotateCcw size={16} />
                초기화
              </ResetButton>
              <CloseButton onClick={onClose}>
                <X size={20} />
              </CloseButton>
            </HeaderButtons>
          </Header>

          <Content>
            <InstructionText>
              색상을 변경할 영역을 탭하세요
            </InstructionText>

            <PreviewSection>
              <MockChatRoom $bgColor={colors.roomBg}>
              {/* 헤더 */}
              <MockHeader
                $bgColor={colors.headerBg}
                $textColor={colors.headerText}
                $selected={selectedArea === 'header'}
                onClick={() => setSelectedArea('header')}
              >
                <MockAvatar>친</MockAvatar>
                <MockHeaderText>타이틀 배경색은 여기서..</MockHeaderText>
              </MockHeader>

              {/* 메시지 영역 */}
              <MockMessagesArea
                $selected={selectedArea === 'background'}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setSelectedArea('background');
                  }
                }}
              >
                {/* 상대방 메시지 */}
                <MockMessageRow $isMine={false}>
                  <MockAvatar style={{ background: '#667eea', width: '32px', height: '32px', fontSize: '13px' }}>친</MockAvatar>
                  <MockMessageBubble
                    $bgColor={colors.otherBubbleBg}
                    $textColor={colors.otherBubbleText}
                    $isMine={false}
                    $selected={selectedArea === 'otherBubble'}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedArea('otherBubble');
                    }}
                  >
                    배경색을 밝게 바꿔봐요! ✨
                  </MockMessageBubble>
                </MockMessageRow>

                {/* 내 메시지 */}
                <MockMessageRow $isMine={true}>
                  <MockMessageBubble
                    $bgColor={colors.myBubbleBg}
                    $textColor={colors.myBubbleText}
                    $isMine={true}
                    $selected={selectedArea === 'myBubble'}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedArea('myBubble');
                    }}
                  >
                    문자 색상도 변경할 수 있어요 🎨
                  </MockMessageBubble>
                </MockMessageRow>

                {/* 상대방 메시지 */}
                <MockMessageRow $isMine={false}>
                  <MockAvatar style={{ background: '#667eea', width: '32px', height: '32px', fontSize: '13px' }}>친</MockAvatar>
                  <MockMessageBubble
                    $bgColor={colors.otherBubbleBg}
                    $textColor={colors.otherBubbleText}
                    $isMine={false}
                    $selected={selectedArea === 'otherBubble'}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedArea('otherBubble');
                    }}
                  >
                    각 영역을 클릭해서 색상을 선택하세요! 👆
                  </MockMessageBubble>
                </MockMessageRow>
              </MockMessagesArea>

              {/* 입력 영역 */}
              <MockInputArea
                $bgColor={colors.inputAreaBg}
                $selected={selectedArea === 'inputArea'}
                onClick={() => setSelectedArea('inputArea')}
              >
                <MockInput
                  $textColor={colors.inputText}
                  style={{ background: colors.inputFieldBg }}
                >
                  상단과 하단 영역도 원하는 색상으로 변경해요
                </MockInput>
                <MockSendButton
                  $bgColor={colors.sendButtonBg}
                  $iconColor={colors.sendButtonIcon}
                  $selected={selectedArea === 'inputArea'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedArea('inputArea');
                  }}
                >
                  ➤
                </MockSendButton>
              </MockInputArea>
            </MockChatRoom>
          </PreviewSection>
        </Content>

        {/* 하단 버튼 */}
        <BottomBar>
          <BottomButton $variant="apply" onClick={handleApplyClick}>
            <Palette size={18} />
            적용
          </BottomButton>
        </BottomBar>
      </Container>

      {/* 작은 색상 파레트 */}
      {selectedArea && (
        <ColorPalette $isInputArea={selectedArea === 'inputArea'}>
          <PaletteHeader>
            <PaletteTitle>{areaInfo[selectedArea]?.label}</PaletteTitle>
            <PaletteCloseButton onClick={() => setSelectedArea(null)}>
              <X size={16} />
            </PaletteCloseButton>
          </PaletteHeader>
          {areaInfo[selectedArea]?.colors.map(colorKey => (
            <PaletteSection key={colorKey}>
              <ColorLabel style={{ fontSize: '12px', marginBottom: '8px' }}>
                {getColorLabel(colorKey)}
              </ColorLabel>
              <PresetColors>
                {/* 현재 적용된 색상 */}
                <PresetColorButton
                  $color={colors[colorKey].startsWith('rgba') ? '#333333' : colors[colorKey]}
                  $selected={true}
                  title={`현재: ${colors[colorKey]}`}
                  style={{ position: 'relative' }}
                >
                  <div style={{
                    position: 'absolute',
                    bottom: '-16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '9px',
                    color: '#888',
                    whiteSpace: 'nowrap'
                  }}>
                    현재
                  </div>
                </PresetColorButton>

                {/* 직전 색상 (있을 경우만) */}
                {previousColors[colorKey] && previousColors[colorKey] !== colors[colorKey] && (
                  <PresetColorButton
                    $color={previousColors[colorKey].startsWith('rgba') ? '#444444' : previousColors[colorKey]}
                    $selected={false}
                    onClick={() => handleColorChange(colorKey, previousColors[colorKey])}
                    title={`직전: ${previousColors[colorKey]}`}
                    style={{ position: 'relative' }}
                  >
                    <div style={{
                      position: 'absolute',
                      bottom: '-16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '9px',
                      color: '#888',
                      whiteSpace: 'nowrap'
                    }}>
                      직전
                    </div>
                  </PresetColorButton>
                )}

                {/* 사용자 정의 색상 입력 - 스포이드 아이콘 */}
                <ColorPickerWrapper>
                  <ColorInput
                    type="color"
                    value={colors[colorKey].startsWith('rgba') ? '#333333' : colors[colorKey]}
                    onChange={(e) => handleColorChange(colorKey, e.target.value)}
                    title="색상 피커"
                  />
                  <ColorInputDisplay $color={colors[colorKey].startsWith('rgba') ? '#333333' : colors[colorKey]}>
                    🎨
                  </ColorInputDisplay>
                </ColorPickerWrapper>
              </PresetColors>
            </PaletteSection>
          ))}
        </ColorPalette>
      )}

      {/* 초기화 확인 모달 */}
      {showResetConfirm && (
        <ConfirmModal
          icon="🔄"
          title="색상 초기화"
          message="편집중인 색상을 되돌리고 초기화 할까요?"
          confirmText="초기화"
          cancelText="취소"
          onConfirm={confirmReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {/* 적용 확인 모달 */}
      {showApplyConfirm && (
        <ConfirmModal
          icon="🎨"
          title="테마 적용"
          message="현재 편집한 색상을 대화방에 적용하시겠습니까?"
          confirmText="적용"
          cancelText="취소"
          onConfirm={confirmApply}
          onCancel={() => setShowApplyConfirm(false)}
        />
      )}

      {/* 성공 메시지 모달 */}
      {showSuccessModal && (
        <ConfirmModal
          icon="✅"
          title="완료"
          message={successMessage}
          confirmText="확인"
          cancelText=""
          onConfirm={() => setShowSuccessModal(false)}
          onCancel={() => setShowSuccessModal(false)}
        />
      )}
    </Overlay>
  </>
  );
};

export default ChatRoomCustomizer;
