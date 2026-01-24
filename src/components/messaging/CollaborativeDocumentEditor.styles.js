import styled from 'styled-components';

export const EditorContainer = styled.div`
  position: relative;
  background: linear-gradient(180deg, #2a2d35, #1f2128);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  height: ${props => props.$collapsed ? '56px' : 'auto'};
  display: block;
  z-index: 1;
`;

export const EditorHeader = styled.div`
  position: relative;
  padding: 0 16px;
  height: 56px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: ${props => props.$collapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'};
  cursor: pointer;
  transition: background 0.2s, border-bottom 0.2s;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

export const HeaderLeft = styled.div`
  position: absolute;
  left: 16px;
  top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 32px;
  /* 버튼 영역을 침범하지 않도록 최대 너비 제한 */
  max-width: calc(100% - 136px);
  pointer-events: none; /* 클릭 이벤트가 자식에게만 전달되도록 */

  & > * {
    pointer-events: auto; /* 자식 요소는 클릭 가능 */
  }
`;

export const DocumentIcon = styled.div`
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  align-self: center;
`;

export const TitleInput = styled.input`
  flex: 1;
  max-width: 300px;
  background: transparent; /* 배경 제거 */
  border: none;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.08);
  }

  &:disabled {
    cursor: default;
    opacity: 1;
    background: transparent; /* disabled 상태에서도 배경 없음 */
  }
`;

export const HeaderRight = styled.div`
  position: absolute;
  right: 16px;
  top: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  z-index: 100;
`;

export const PermissionBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${props => {
    if (props.$type === 'manager') return 'rgba(46, 213, 115, 0.15)';
    if (props.$type === 'editor') return 'rgba(74, 144, 226, 0.15)';
    return 'rgba(255, 255, 255, 0.05)';
  }};
  border-radius: 6px;
  color: ${props => {
    if (props.$type === 'manager') return '#2ed573';
    if (props.$type === 'editor') return '#4a90e2';
    return '#888';
  }};
  font-size: 12px;
  font-weight: 600;
`;

export const IconButton = styled.button`
  background: transparent;
  border: none;
  color: #888;
  /* 모바일 터치에 적합한 크기 (최소 44x44px) */
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  /* z-index로 확실히 위에 표시 */
  position: relative;
  z-index: 100;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  &:active {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ToggleButton = styled(IconButton)`
  color: #4a90e2;

  &:hover {
    background: transparent;
  }

  &:active {
    background: transparent;
    transform: none;
  }
`;

export const EditorContent = styled.div`
  display: ${props => props.$collapsed ? 'none' : 'flex'};
  flex-direction: column;
  height: calc(100% - 56px);
  padding: 16px;
  gap: 12px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

export const Toolbar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const ToolbarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const ToolbarButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const SaveButton = styled(ToolbarButton)`
  background: linear-gradient(135deg, #2ed573, #26bf62);
  border: none;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(46, 213, 115, 0.3);
  }
`;

export const LoadButton = styled(ToolbarButton)`
  background: rgba(74, 144, 226, 0.15);
  border: 1px solid rgba(74, 144, 226, 0.3);
  color: #4a90e2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 36px;
  padding: 8px;
  font-size: 16px;

  &:hover:not(:disabled) {
    background: rgba(74, 144, 226, 0.25);
  }
`;

export const ContentEditableArea = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.8;
  height: 400px;
  overflow-y: auto;
  cursor: default;
  transition: all 0.2s;
  user-select: text;

  &:empty::before {
    content: '문서가 비어 있습니다...';
    color: #666;
    pointer-events: none;
  }

  .highlight {
    display: inline;
    background: linear-gradient(180deg, rgba(255, 235, 59, 0.35), rgba(255, 193, 7, 0.35));
    border-bottom: 2px solid #ffc107;
    cursor: pointer;
    position: relative;
    padding: 2px 4px;
    border-radius: 3px;
    transition: all 0.2s;

    &:hover {
      background: linear-gradient(180deg, rgba(255, 235, 59, 0.5), rgba(255, 193, 7, 0.5));
    }
  }

  .highlight-confirmed {
    background: none;
    border-bottom: none;
    padding: 0;
  }

  .strikethrough {
    display: inline;
    text-decoration: line-through;
    text-decoration-color: #ff5757;
    text-decoration-thickness: 2px;
    background: rgba(255, 87, 87, 0.1);
    padding: 2px 4px;
    border-radius: 3px;
    cursor: pointer;
    position: relative;
    opacity: 0.7;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 87, 87, 0.2);
      opacity: 1;
    }
  }

  .comment {
    display: inline-block;
    background: rgba(139, 92, 246, 0.2);
    border: 1px solid rgba(139, 92, 246, 0.4);
    padding: 2px 6px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    transition: all 0.2s;
    vertical-align: middle;
    margin: 0 2px;

    &:hover {
      background: rgba(139, 92, 246, 0.35);
      border-color: rgba(139, 92, 246, 0.6);
      transform: scale(1.1);
    }
  }

  /* 이미지 자동 리사이징 */
  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 8px 0;
    border-radius: 8px;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.9;
    }
  }

  /* YouTube 영상 반응형 컨테이너 (편집 모드) */
  .video-container {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%; /* 16:9 비율 */
    height: 0;
    overflow: hidden;
    margin: 1em 0;
    border-radius: 8px;
  }

  .video-container iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100% !important;
    border-radius: 8px;
  }

  /* 컨테이너 없이 직접 삽입된 iframe도 대응 (편집 모드) */
  iframe {
    max-width: 100% !important;
    width: 100% !important;
    height: auto !important;
    aspect-ratio: 16 / 9 !important;
    border-radius: 8px;
    margin: 1em 0;
    box-sizing: border-box;
  }

  /* 비디오 문서 너비에 맞춤 */
  video {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 8px 0;
    border-radius: 8px;
  }

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
`;

export const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  font-size: 12px;
  color: #888;
  gap: 12px;
  flex-wrap: wrap;
`;

export const PendingEditsCount = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 193, 7, 0.15);
  border-radius: 6px;
  color: #ffc107;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 193, 7, 0.25);
  }
`;

export const EditNavigationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  background: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 6px;
  color: #ffc107;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: rgba(255, 193, 7, 0.25);
    border-color: rgba(255, 193, 7, 0.5);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const EditNavigationGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 400000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

export const ModalContent = styled.div`
  background: linear-gradient(180deg, #2a2d35, #1f2128);
  border-radius: 16px;
  padding: 24px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

export const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
`;

export const ModalSubtitle = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
`;

export const SubtitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }

  strong {
    color: #aaa;
    font-weight: 600;
  }

  span {
    color: #e0e0e0;
  }
`;

export const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const EditInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #888;

  &:last-child {
    margin-bottom: 0;
  }

  strong {
    color: #ffffff;
    font-weight: 600;
  }
`;

export const TextComparison = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ComparisonBox = styled.div`
  padding: 12px;
  border-radius: 8px;
  background: ${props => props.$type === 'old'
    ? 'rgba(255, 87, 87, 0.1)'
    : 'rgba(46, 213, 115, 0.1)'};
  border: 1px solid ${props => props.$type === 'old'
    ? 'rgba(255, 87, 87, 0.3)'
    : 'rgba(46, 213, 115, 0.3)'};
`;

export const ComparisonLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.$type === 'old' ? '#ff5757' : '#2ed573'};
  margin-bottom: 8px;
`;

export const ComparisonText = styled.div`
  color: #e0e0e0;
  line-height: 1.6;
  word-break: break-word;
`;

export const FullScreenModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  z-index: 300000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1vh;
`;

export const FullScreenEditorContainer = styled.div`
  width: 98%;
  height: 98%;
  background: linear-gradient(180deg, #2a2d35, #1f2128);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

export const FullScreenHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  padding-top: calc(env(safe-area-inset-top, 0px) + 50px); /* Safe Area + 기본 패딩 */
  padding-bottom: 4px; /* 하단 여백 조정 */
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
`;

export const FullScreenTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
`;

export const FullScreenTitleInput = styled.input`
  flex: 1;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.1);
    border-color: #4a90e2;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

export const FullScreenToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
  flex-shrink: 0;
`;

export const FullScreenContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const FullScreenEditArea = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  color: #e0e0e0;
  padding: 24px;
  padding-bottom: max(24px, env(safe-area-inset-bottom, 24px)); /* 하단 Safe Area 대응 */
  font-size: 16px;
  line-height: 1.8;
  overflow-y: auto;
  cursor: text;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;

  &:focus {
    outline: none;
  }

  &:empty::before {
    content: '문서 내용을 입력하세요...';
    color: #666;
    pointer-events: none;
  }

  /* 이미지 자동 리사이징 */
  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 8px 0;
    border-radius: 8px;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.9;
    }
  }

  /* YouTube 영상 반응형 컨테이너 */
  .video-container {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%; /* 16:9 비율 */
    height: 0;
    overflow: hidden;
    margin: 1em 0;
    border-radius: 8px;
  }

  .video-container iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100% !important;
    border-radius: 8px;
  }

  /* 컨테이너 없이 직접 삽입된 iframe도 대응 */
  iframe {
    max-width: 100% !important;
    width: 100% !important;
    height: auto !important;
    aspect-ratio: 16 / 9 !important;
    border-radius: 8px;
    margin: 1em 0;
    box-sizing: border-box;
  }

  /* 비디오 자동 리사이징 */
  video {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 8px 0;
    border-radius: 8px;
  }

  .strikethrough {
    display: inline;
    text-decoration: line-through;
    text-decoration-color: #ff5757;
    text-decoration-thickness: 2px;
    background: rgba(255, 87, 87, 0.1);
    padding: 2px 4px;
    border-radius: 3px;
    cursor: pointer;
    position: relative;
    opacity: 0.7;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 87, 87, 0.2);
      opacity: 1;
    }
  }

  .highlight {
    display: inline;
    background: linear-gradient(180deg, rgba(255, 235, 59, 0.35), rgba(255, 193, 7, 0.35));
    border-bottom: 2px solid #ffc107;
    cursor: pointer;
    position: relative;
    padding: 2px 4px;
    border-radius: 3px;
    transition: all 0.2s;

    &:hover {
      background: linear-gradient(180deg, rgba(255, 235, 59, 0.5), rgba(255, 193, 7, 0.5));
    }
  }

  .highlight-confirmed {
    background: none;
    border-bottom: none;
    padding: 0;
  }

  .comment {
    background: rgba(139, 92, 246, 0.15);
    border-bottom: 2px dotted #8b5cf6;
    padding: 2px 4px;
    border-radius: 3px;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;

    &:hover {
      background: rgba(139, 92, 246, 0.25);
    }

    &::after {
      content: '💬';
      font-size: 12px;
      margin-left: 4px;
      vertical-align: super;
    }
  }

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 5px;
  }
`;

export const FullScreenFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 13px;
  color: #888;
  flex-shrink: 0;
`;

export const EditButton = styled(ToolbarButton)`
  background: rgba(74, 144, 226, 0.15);
  border: 1px solid rgba(74, 144, 226, 0.3);
  color: #4a90e2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 36px;
  padding: 8px;
  font-size: 16px;

  &:hover:not(:disabled) {
    background: rgba(74, 144, 226, 0.25);
  }
`;

export const ClearButton = styled(ToolbarButton)`
  background: rgba(156, 39, 176, 0.15);
  border: 1px solid rgba(156, 39, 176, 0.3);
  color: #9c27b0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 36px;
  padding: 8px;
  font-size: 16px;

  &:hover:not(:disabled) {
    background: rgba(156, 39, 176, 0.25);
  }
`;

export const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

export const ConfirmButton = styled.button`
  flex: 1;
  background: linear-gradient(135deg, #2ed573, #26bf62);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(46, 213, 115, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const RejectButton = styled.button`
  flex: 1;
  background: rgba(255, 87, 87, 0.15);
  border: 1px solid rgba(255, 87, 87, 0.3);
  border-radius: 8px;
  color: #ff5757;
  font-size: 14px;
  font-weight: 600;
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 87, 87, 0.25);
  }
`;

export const PartialApplyButton = styled(ToolbarButton)`
  background: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #ffc107;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) {
    background: rgba(255, 193, 7, 0.25);
  }
`;

export const FinalApplyButton = styled(ToolbarButton)`
  background: linear-gradient(135deg, #2ed573, #26bf62);
  border: none;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(46, 213, 115, 0.3);
  }
`;

export const ResetButton = styled(ToolbarButton)`
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  border: none;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  }
`;

// 이미지 뷰어 모달
export const ImageViewerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400000;
  cursor: zoom-out;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

export const ImageViewerContent = styled.div`
  max-width: 95vw;
  max-height: 95vh;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
`;

export const ImageViewerImage = styled.img`
  max-width: 100%;
  max-height: 95vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  cursor: zoom-in;
  touch-action: pinch-zoom;
  user-select: none;
`;

export const ImageViewerCloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }
`;
