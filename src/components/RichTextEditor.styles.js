// src/components/RichTextEditor.styles.js

import styled from 'styled-components';

export const EditorWrapper = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  background: transparent;
  overflow: hidden;
`;

export const TopToolbar = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;

  /* 작은 화면 (iPhone SE 등 375px 이하) */
  @media (max-width: 400px) {
    gap: 1px;
    padding: 6px 2px;
  }

  @media (min-width: 401px) and (max-width: 768px) {
    gap: 2px;
    padding: 6px 4px;
  }
`;

export const BottomToolbar = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0 0 8px 8px;
  flex-shrink: 0;

  /* 작은 화면 (iPhone SE 등 375px 이하) */
  @media (max-width: 400px) {
    gap: 1px;
    padding: 6px 2px;
  }

  @media (min-width: 401px) and (max-width: 768px) {
    gap: 2px;
    padding: 6px 4px;
  }
`;

export const ToolbarButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 6px;
  border: none;
  border-radius: 6px;
  background: ${props => props.$isActive ? 'rgba(102, 126, 234, 0.7)' : 'transparent'};
  color: ${props => props.$isActive ? '#ffffff' : '#e0e0e0'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  border: 1px solid ${props => props.$isActive ? 'rgba(102, 126, 234, 0.9)' : 'transparent'};
  box-shadow: ${props => props.$isActive ? '0 0 8px rgba(102, 126, 234, 0.4)' : 'none'};

  &:hover {
    background: ${props => props.$isActive ? 'rgba(102, 126, 234, 0.8)' : 'rgba(255, 255, 255, 0.05)'};
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    min-width: 28px;
    height: 28px;
    font-size: 12px;
  }
`;

export const Divider = styled.div`
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 2px;

  @media (max-width: 768px) {
    height: 20px;
  }
`;

export const MacroButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: rgba(139, 92, 246, 0.3);
  color: #a78bfa;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid rgba(139, 92, 246, 0.4);
  white-space: nowrap;

  &:hover {
    background: rgba(139, 92, 246, 0.4);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    padding: 4px 8px;
    font-size: 10px;
  }
`;

export const ColorButton = styled.button`
  width: 26px;
  height: 26px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  background: ${props => props.$color || 'transparent'};
  position: relative;

  ${props => props.$transparent && `
    background:
      linear-gradient(45deg, #555555 25%, transparent 25%),
      linear-gradient(-45deg, #555555 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #555555 75%),
      linear-gradient(-45deg, transparent 75%, #555555 75%);
    background-size: 8px 8px;
    background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
  `}

  &:hover {
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    width: 24px;
    height: 24px;
  }
`;

export const ColorPickerWrapper = styled.div`
  position: relative;
`;

export const ColorPickerModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #2a2f3a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 220px;
`;

export const ColorPickerTitle = styled.div`
  color: #e0e0e0;
  font-size: 12px;
  margin-bottom: 8px;
  font-weight: 500;
`;

export const ColorPresetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  margin-bottom: 8px;
`;

export const ColorPresetButton = styled.button`
  width: 28px;
  height: 28px;
  border: 2px solid ${props => props.$selected ? '#667eea' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 4px;
  cursor: pointer;
  background: ${props => props.$color};
  position: relative;

  ${props => props.$transparent && `
    background:
      linear-gradient(45deg, #555555 25%, transparent 25%),
      linear-gradient(-45deg, #555555 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #555555 75%),
      linear-gradient(-45deg, transparent 75%, #555555 75%);
    background-size: 6px 6px;
    background-position: 0 0, 0 3px, 3px -3px, -3px 0px;
  `}

  &:hover {
    transform: scale(1.1);
  }
`;

export const CustomColorSection = styled.div`
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

export const CustomColorInput = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 6px;
`;

export const ColorInput = styled.input`
  flex: 1;
  background: #1a1f2a;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 6px 8px;
  color: #e0e0e0;
  font-size: 12px;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

export const NativeColorPicker = styled.input`
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
`;

export const EditorContentWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  background: transparent;
  min-height: 0;
  box-sizing: border-box;
  cursor: text; /* 전체 영역에서 텍스트 커서 표시 */

  /* 반투명 스크롤바 */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;

  /* TipTap 에디터 스타일 */
  .ProseMirror {
    outline: none;
    min-height: 100px;
    color: #e0e0e0;
    font-size: 15px;
    line-height: 1.6;
    box-sizing: border-box;

    * {
      box-sizing: border-box;
    }

    /* 제목 스타일 */
    h1 {
      font-size: 2em;
      font-weight: bold;
      margin: 0.5em 0;
    }

    h2 {
      font-size: 1.5em;
      font-weight: bold;
      margin: 0.5em 0;
    }

    h3 {
      font-size: 1.25em;
      font-weight: bold;
      margin: 0.5em 0;
    }

    /* 텍스트 스타일 */
    strong {
      font-weight: bold;
    }

    em {
      font-style: italic;
    }

    u {
      text-decoration: underline;
    }

    s {
      text-decoration: line-through;
    }

    /* 형광펜 */
    mark {
      padding: 0.1em 0.2em;
      border-radius: 2px;
    }

    /* 링크 */
    a {
      color: #667eea;
      text-decoration: underline;
      cursor: pointer;

      &:hover {
        color: #7c8eef;
      }
    }

    /* 리스트 */
    ul, ol {
      padding-left: 1.5em;
      margin: 0.5em 0;
    }

    ul {
      list-style: disc;
    }

    ol {
      list-style: decimal;
    }

    li {
      margin: 0.25em 0;
    }

    /* 인용구 */
    blockquote {
      padding-left: 1em;
      border-left: 3px solid rgba(102, 126, 234, 0.5);
      margin: 1em 0;
      color: #b0b0b0;
    }

    /* 코드 */
    code {
      background: rgba(255, 255, 255, 0.05);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }

    pre {
      background: rgba(255, 255, 255, 0.05);
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1em 0;

      code {
        background: none;
        padding: 0;
      }
    }

    /* 이미지 - 작은 이미지는 원본 크기 유지 */
    img {
      max-width: 100% !important;
      width: auto !important;
      height: auto !important;
      border-radius: 8px;
      margin: 0.5em 0;
      cursor: pointer;
      transition: opacity 0.2s;
      display: block;
      object-fit: contain;

      &:hover {
        opacity: 0.9;
      }
    }

    /* YouTube 영상 */
    .youtube-embed {
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      aspect-ratio: 16 / 9 !important;
      border-radius: 8px;
      margin: 1em 0;
    }

    iframe {
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      aspect-ratio: 16 / 9 !important;
      border-radius: 8px;
      margin: 1em 0;
    }

    /* 플레이스홀더 */
    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: #6b7280;
      pointer-events: none;
      height: 0;
    }

    /* 한글 입력 IME 언더라인 제거 */
    .ProseMirror-ime {
      text-decoration: none !important;
    }
  }
`;

export const HiddenFileInput = styled.input`
  display: none;
`;

export const MacroModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
`;

export const MacroModalContent = styled.div`
  background: #2a2d35;
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

export const MacroModalTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #e0e0e0;
  font-size: 18px;
  text-align: center;
`;

export const MacroGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
`;

export const MacroItem = styled.button`
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  color: #e0e0e0;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  font-size: 14px;

  &:hover {
    background: rgba(139, 92, 246, 0.25);
    border-color: rgba(139, 92, 246, 0.5);
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const LinkModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
`;

export const LinkModalContent = styled.div`
  background: #2a2d35;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

export const LinkModalTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #e0e0e0;
  font-size: 18px;
`;

export const LinkInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: #333842;
  color: #e0e0e0;
  font-size: 14px;
  margin-bottom: 16px;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &::placeholder {
    color: #808080;
  }
`;

export const YoutubeTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: #333842;
  color: #e0e0e0;
  font-size: 14px;
  margin-bottom: 8px;
  resize: vertical;
  font-family: monospace;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &::placeholder {
    color: #808080;
  }
`;

export const YoutubeHelperText = styled.div`
  font-size: 12px;
  color: #808080;
  margin-bottom: 16px;
  line-height: 1.5;
`;

export const LinkModalButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

export const LinkModalButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.$primary ? `
    background: #667eea;
    color: white;
    &:hover {
      background: #5568d3;
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: #e0e0e0;
    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  `}
`;

export const FullscreenImageOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10002;
  cursor: zoom-out;
  padding: 20px;
`;

export const FullscreenImageContainer = styled.div`
  max-width: 100%;
  max-height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const FullscreenImageElement = styled.img`
  max-width: 100%;
  max-height: 100vh;
  object-fit: contain;
  border-radius: 8px;
`;

export const FullscreenCloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;
