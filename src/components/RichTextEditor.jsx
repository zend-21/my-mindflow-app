// src/components/RichTextEditor.jsx

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Youtube from '@tiptap/extension-youtube';
import styled from 'styled-components';
import { uploadImage } from '../utils/storageService';
import {
  FaBold, FaItalic, FaUnderline, FaStrikethrough,
  FaListUl, FaListOl, FaAlignLeft, FaAlignCenter, FaAlignRight,
  FaImage, FaLink, FaQuoteLeft, FaYoutube, FaUndo, FaRedo
} from 'react-icons/fa';

const EditorWrapper = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  background: transparent;
  overflow: hidden;
`;

const TopToolbar = styled.div`
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

const BottomToolbar = styled.div`
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

const ToolbarButton = styled.button`
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

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 2px;

  @media (max-width: 768px) {
    height: 20px;
  }
`;

const MacroButton = styled.button`
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

const ColorButton = styled.button`
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

const ColorPickerWrapper = styled.div`
  position: relative;
`;

const ColorPickerModal = styled.div`
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

const ColorPickerTitle = styled.div`
  color: #e0e0e0;
  font-size: 12px;
  margin-bottom: 8px;
  font-weight: 500;
`;

const ColorPresetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  margin-bottom: 8px;
`;

const ColorPresetButton = styled.button`
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

const CustomColorSection = styled.div`
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const CustomColorInput = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 6px;
`;

const ColorInput = styled.input`
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

const NativeColorPicker = styled.input`
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

const EditorContentWrapper = styled.div`
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

const HiddenFileInput = styled.input`
  display: none;
`;

const MacroModalOverlay = styled.div`
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

const MacroModalContent = styled.div`
  background: #2a2d35;
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const MacroModalTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #e0e0e0;
  font-size: 18px;
  text-align: center;
`;

const MacroGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
`;

const MacroItem = styled.button`
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

const LinkModalOverlay = styled.div`
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

const LinkModalContent = styled.div`
  background: #2a2d35;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const LinkModalTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #e0e0e0;
  font-size: 18px;
`;

const LinkInput = styled.input`
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

const YoutubeTextarea = styled.textarea`
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

const YoutubeHelperText = styled.div`
  font-size: 12px;
  color: #808080;
  margin-bottom: 16px;
  line-height: 1.5;
`;

const LinkModalButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const LinkModalButton = styled.button`
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

// 전체화면 이미지 모달
const FullscreenImageOverlay = styled.div`
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

const FullscreenImageContainer = styled.div`
  max-width: 100%;
  max-height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const FullscreenImageElement = styled.img`
  max-width: 100%;
  max-height: 100vh;
  object-fit: contain;
  border-radius: 8px;
`;

const FullscreenCloseButton = styled.button`
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

// 색상 프리셋
const TEXT_COLOR_PRESETS = [
  { color: '#e0e0e0', label: '기본 (흰색)' },
  { color: '#9e9e9e', label: '회색' },
  { color: '#ff6b6b', label: '빨강' },
  { color: '#4ecdc4', label: '청록' },
  { color: '#45b7d1', label: '파랑' },
  { color: '#96ceb4', label: '초록' },
  { color: '#ffeaa7', label: '노랑' },
  { color: '#fd79a8', label: '분홍' },
  { color: '#a29bfe', label: '보라' },
  { color: '#fab1a0', label: '주황' },
  { color: '#74b9ff', label: '하늘' },
  { color: '#00b894', label: '민트' },
];

const HIGHLIGHT_COLOR_PRESETS = [
  { color: null, label: '없음 (투명)', transparent: true },
  { color: '#96ceb480', label: '초록' },
  { color: '#ffff00', label: '노랑' },
  { color: '#fab1a080', label: '주황' },
  { color: '#ff6b6b80', label: '빨강' },
  { color: '#fd79a880', label: '분홍' },
  { color: '#a29bfe80', label: '보라' },
  { color: '#45b7d180', label: '파랑' },
  { color: '#74b9ff80', label: '하늘' },
  { color: '#4ecdc480', label: '청록' },
  { color: '#00b89480', label: '민트' },
  { color: '#dfe6e980', label: '회색' },
];

const RichTextEditor = ({ content, onChange, placeholder = '내용을 입력하세요...', editorRef, onFocus, onBlur }) => {
  const fileInputRef = useRef(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [macros, setMacros] = useState([]);

  // 이미지 전체화면 모달
  const [fullscreenImage, setFullscreenImage] = useState(null);

  // 색상 선택 모달
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightColorPicker, setShowHighlightColorPicker] = useState(false);
  const [customTextColor, setCustomTextColor] = useState('#e0e0e0');
  const [customHighlightColor, setCustomHighlightColor] = useState('#ffff00');

  // content 초기 로드 플래그 (IME 중복 입력 방지)
  const isInitialMount = useRef(true);

  // localStorage에서 매크로 불러오기
  useEffect(() => {
    const loadMacros = () => {
      try {
        const savedMacros = JSON.parse(localStorage.getItem('macroTexts') || '[]');
        setMacros(savedMacros.slice(0, 7)); // 최대 7개만
      } catch (error) {
        console.error('매크로 로드 실패:', error);
        setMacros([]);
      }
    };

    loadMacros();

    // localStorage 변경 감지
    const handleStorageChange = (e) => {
      if (e.key === 'macroTexts') {
        loadMacros();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Link와 Underline을 별도로 커스터마이즈하므로 StarterKit에서 비활성화
        link: false,
        underline: false,
      }),
      TextStyle, // Color 사용을 위해 필수
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'youtube-embed',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        'data-placeholder': placeholder,
        'spellcheck': 'false',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    onFocus: () => {
      onFocus?.();
    },
    onBlur: () => {
      onBlur?.();
    },
    onSelectionUpdate: () => {
      // 선택 영역 변경 시 버튼 상태 업데이트를 위한 리렌더링 트리거
      // 아무것도 하지 않아도 리렌더링됨
    },
  });

  // editorRef prop으로 editor 인스턴스 전달
  useEffect(() => {
    if (editorRef && editor) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  // content prop이 변경되면 초기 마운트 플래그 리셋 (모달 재오픈 대응)
  const prevContentRef = useRef(content);
  useEffect(() => {
    // content가 외부에서 완전히 새로운 값으로 변경된 경우 (모달 재오픈 등)
    if (content !== prevContentRef.current) {
      isInitialMount.current = true;
      prevContentRef.current = content;
    }
  }, [content]);

  // content prop 변경 시 에디터 업데이트
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const currentContent = editor.getHTML();
    const newContent = content || '';

    // 초기 로드 시에만 content를 설정
    if (isInitialMount.current && currentContent !== newContent) {
      console.log('🔵 RichTextEditor 초기 로드:', { isInitialMount: isInitialMount.current });
      editor.commands.setContent(newContent, false);
      isInitialMount.current = false;
      return;
    }

    // 초기 로드 이후에는 포커스가 없고 IME 조합 중이 아닐 때만 업데이트
    const shouldUpdate = currentContent !== newContent && !editor.isFocused && !editor.view.composing;
    if (shouldUpdate) {
      console.log('🔵 RichTextEditor 업데이트:', {
        isFocused: editor.isFocused,
        isComposing: editor.view.composing,
        contentChanged: currentContent !== newContent
      });
      editor.commands.setContent(newContent, false);
    } else if (currentContent !== newContent) {
      console.log('⚠️ RichTextEditor 업데이트 건너뜀:', {
        isFocused: editor.isFocused,
        isComposing: editor.view.composing,
        contentChanged: currentContent !== newContent
      });
    }
  }, [content, editor]);

  // 이미지 클릭 시 전체화면 표시
  useEffect(() => {
    if (!editor) return;

    const handleImageClick = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
        setFullscreenImage(e.target.src);
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('click', handleImageClick);

    return () => {
      editorElement.removeEventListener('click', handleImageClick);
    };
  }, [editor]);

  // 색상 피커 모달 참조
  const textColorModalRef = useRef(null);
  const highlightColorModalRef = useRef(null);

  // 색상 피커 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      // 텍스트 색상 피커 외부 클릭 확인
      if (showTextColorPicker && textColorModalRef.current) {
        if (!textColorModalRef.current.contains(e.target)) {
          setShowTextColorPicker(false);
        }
      }

      // 형광펜 색상 피커 외부 클릭 확인
      if (showHighlightColorPicker && highlightColorModalRef.current) {
        if (!highlightColorModalRef.current.contains(e.target)) {
          setShowHighlightColorPicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTextColorPicker, showHighlightColorPicker]);

  const handleImageUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    try {
      setIsUploading(true);
      console.log('✅ R2 이미지 업로드 시작:', file.name);

      // 이미지를 로드하여 크기 확인 및 리사이즈
      const img = document.createElement('img');
      const reader = new FileReader();

      reader.onload = async (e) => {
        img.src = e.target?.result;
      };

      img.onload = async () => {
        const maxWidth = 1200; // 최대 너비
        const maxHeight = 1200; // 최대 높이
        let width = img.width;
        let height = img.height;

        // 이미지가 너무 크면 리사이즈
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = maxWidth / aspectRatio;
          } else {
            height = maxHeight;
            width = maxHeight * aspectRatio;
          }
        }

        // Canvas를 사용하여 이미지 리사이즈
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Canvas를 Blob으로 변환 (품질 조정으로 파일 크기 감소)
        canvas.toBlob(async (blob) => {
          if (!blob) {
            console.error('이미지 Blob 생성 실패');
            alert('이미지 처리 실패');
            setIsUploading(false);
            return;
          }

          // Blob 크기 확인
          const blobSize = blob.size / (1024 * 1024);
          console.log(`리사이즈 후 크기: ${blobSize.toFixed(2)}MB`);

          if (blobSize > 5) {
            alert('이미지를 리사이즈했지만 여전히 5MB를 초과합니다. 더 작은 이미지를 사용해주세요.');
            setIsUploading(false);
            return;
          }

          try {
            // R2에 업로드
            const imageUrl = await uploadImage(blob, 'calendar-images');
            console.log('✅ R2 업로드 성공:', imageUrl);

            // 에디터에 URL 삽입
            editor.chain().focus().setImage({ src: imageUrl }).run();
            console.log('✅ 이미지 삽입 완료');

            setIsUploading(false);

            // input 초기화
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          } catch (uploadError) {
            console.error('❌ R2 업로드 실패:', uploadError);
            alert(`이미지 업로드 실패: ${uploadError.message}`);
            setIsUploading(false);
          }
        }, 'image/jpeg', 0.85);
      };

      img.onerror = () => {
        console.error('이미지 로드 실패');
        alert('이미지 로드 실패');
        setIsUploading(false);
      };

      reader.onerror = () => {
        console.error('이미지 읽기 실패');
        alert('이미지 읽기 실패');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('이미지 처리 실패:', error);
      alert(`이미지 처리 실패: ${error.message}`);
      setIsUploading(false);
    }
  }, [editor]);

  const handleLinkAdd = useCallback(() => {
    if (!editor) return;
    console.log('링크 모달 열기');
    setShowLinkModal(true);
  }, [editor]);

  const handleLinkSave = useCallback(() => {
    if (!editor || !linkUrl.trim()) {
      console.log('링크 URL이 비어있음');
      return;
    }

    console.log('링크 추가:', linkUrl);
    editor.chain().focus().setLink({ href: linkUrl }).run();
    console.log('링크 삽입 완료');
    setShowLinkModal(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const handleLinkCancel = useCallback(() => {
    setShowLinkModal(false);
    setLinkUrl('');
  }, []);

  const handleYoutubeAdd = useCallback(() => {
    if (!editor) return;
    console.log('YouTube 모달 열기');
    setShowYoutubeModal(true);
  }, [editor]);

  const handleYoutubeSave = useCallback(() => {
    if (!editor || !youtubeUrl.trim()) {
      console.log('YouTube URL이 비어있음');
      return;
    }

    console.log('YouTube 추가:', youtubeUrl);

    // iframe 임베드 코드에서 URL 추출
    let videoUrl = youtubeUrl.trim();
    const iframeMatch = videoUrl.match(/src=["']([^"']+)["']/);
    if (iframeMatch) {
      videoUrl = iframeMatch[1];
      console.log('iframe에서 URL 추출:', videoUrl);
    }

    // URL에서 video ID와 파라미터 추출
    let finalUrl = videoUrl;
    const urlParams = new URLSearchParams();

    // YouTube URL 파싱
    try {
      const url = new URL(videoUrl.startsWith('http') ? videoUrl : `https://${videoUrl}`);
      let videoId = '';

      // youtube.com/watch?v=... 형식
      if (url.hostname.includes('youtube.com')) {
        videoId = url.searchParams.get('v') || '';
        // 기존 파라미터 복사 (t, start, autoplay, mute 등)
        url.searchParams.forEach((value, key) => {
          if (key !== 'v') {
            urlParams.set(key, value);
          }
        });
      }
      // youtu.be/... 형식
      else if (url.hostname.includes('youtu.be')) {
        videoId = url.pathname.slice(1);
        url.searchParams.forEach((value, key) => {
          urlParams.set(key, value);
        });
      }
      // embed/... 형식
      else if (url.pathname.includes('/embed/')) {
        videoId = url.pathname.split('/embed/')[1].split('?')[0];
        url.searchParams.forEach((value, key) => {
          urlParams.set(key, value);
        });
      }

      if (videoId) {
        finalUrl = `https://www.youtube.com/watch?v=${videoId}`;
        if (urlParams.toString()) {
          finalUrl += `&${urlParams.toString()}`;
        }
      }
    } catch (error) {
      console.warn('URL 파싱 실패, 원본 사용:', error);
    }

    console.log('최종 URL:', finalUrl);
    editor.chain().focus().setYoutubeVideo({
      src: finalUrl,
      width: 640,
      height: 360,
    }).run();

    setShowYoutubeModal(false);
    setYoutubeUrl('');
  }, [editor, youtubeUrl]);

  const handleYoutubeCancel = useCallback(() => {
    setShowYoutubeModal(false);
    setYoutubeUrl('');
  }, []);

  // 텍스트 색상 선택
  const handleTextColorSelect = useCallback((color) => {
    if (!editor) return;
    editor.chain().focus().setColor(color).run();
    setShowTextColorPicker(false);
  }, [editor]);

  // 형광펜 색상 선택
  const handleHighlightColorSelect = useCallback((color) => {
    if (!editor) return;
    if (color === null) {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().setHighlight({ color }).run();
    }
    setShowHighlightColorPicker(false);
  }, [editor]);

  // 텍스트 색상 입력 핸들러 (# 자동 유지)
  const handleTextColorInputChange = useCallback((e) => {
    let value = e.target.value;
    // #을 제거한 값만 추출
    value = value.replace(/[^0-9A-Fa-f]/g, '');
    // 최대 6자리로 제한
    value = value.substring(0, 6);
    setCustomTextColor('#' + value);
  }, []);

  // 형광펜 색상 입력 핸들러 (# 자동 유지)
  const handleHighlightColorInputChange = useCallback((e) => {
    let value = e.target.value;
    // #을 제거한 값만 추출
    value = value.replace(/[^0-9A-Fa-f]/g, '');
    // 최대 8자리로 제한 (RGBA)
    value = value.substring(0, 8);
    setCustomHighlightColor('#' + value);
  }, []);

  const handleMacroOpen = useCallback(() => {
    setShowMacroModal(true);
  }, []);

  const handleMacroClose = useCallback(() => {
    setShowMacroModal(false);
  }, []);

  const handleMacroSelect = useCallback((macroText) => {
    if (!editor) return;
    editor.chain().focus().insertContent(macroText).run();
    setShowMacroModal(false);
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <EditorWrapper>
      {/* 상단 툴바: Undo/Redo, 글자체 4종, 색상, 매크로 */}
      <TopToolbar>
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="실행 취소 (Ctrl+Z)"
        >
          <FaUndo />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="다시 실행 (Ctrl+Y)"
        >
          <FaRedo />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          $isActive={editor.isActive('bold')}
          title="굵게 (Ctrl+B)"
        >
          <FaBold />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          $isActive={editor.isActive('italic')}
          title="기울임 (Ctrl+I)"
        >
          <FaItalic />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          $isActive={editor.isActive('underline')}
          title="밑줄 (Ctrl+U)"
        >
          <FaUnderline />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          $isActive={editor.isActive('strike')}
          title="취소선"
        >
          <FaStrikethrough />
        </ToolbarButton>

        <Divider />

        {/* 텍스트 색상 선택 */}
        <ColorPickerWrapper>
          <ColorButton
            $color={editor.getAttributes('textStyle').color || '#e0e0e0'}
            onClick={() => setShowTextColorPicker(!showTextColorPicker)}
            title="글자 색상"
          />
          {showTextColorPicker && (
            <ColorPickerModal ref={textColorModalRef} onClick={(e) => e.stopPropagation()}>
              <ColorPickerTitle>글자 색상</ColorPickerTitle>
              <ColorPresetGrid>
                {TEXT_COLOR_PRESETS.map((preset) => (
                  <ColorPresetButton
                    key={preset.color}
                    $color={preset.color}
                    $selected={editor.getAttributes('textStyle').color === preset.color}
                    onClick={() => handleTextColorSelect(preset.color)}
                    title={preset.label}
                  />
                ))}
              </ColorPresetGrid>
              <CustomColorSection>
                <ColorPickerTitle>커스텀 색상</ColorPickerTitle>
                <CustomColorInput>
                  <ColorInput
                    type="text"
                    value={customTextColor}
                    onChange={handleTextColorInputChange}
                    placeholder="#000000"
                    maxLength={7}
                  />
                  <NativeColorPicker
                    type="color"
                    value={customTextColor.length === 7 ? customTextColor : '#000000'}
                    onChange={(e) => {
                      setCustomTextColor(e.target.value);
                      handleTextColorSelect(e.target.value);
                    }}
                  />
                </CustomColorInput>
              </CustomColorSection>
            </ColorPickerModal>
          )}
        </ColorPickerWrapper>

        {/* 색상 버튼 사이 간격 */}
        <div style={{ width: '8px' }} />

        {/* 형광펜 색상 선택 */}
        <ColorPickerWrapper>
          <ColorButton
            $color={editor.getAttributes('highlight')?.color}
            $transparent={!editor.isActive('highlight')}
            onClick={() => setShowHighlightColorPicker(!showHighlightColorPicker)}
            title="형광펜 (배경색)"
          />
          {showHighlightColorPicker && (
            <ColorPickerModal ref={highlightColorModalRef} onClick={(e) => e.stopPropagation()}>
              <ColorPickerTitle>형광펜 색상</ColorPickerTitle>
              <ColorPresetGrid>
                {HIGHLIGHT_COLOR_PRESETS.map((preset, idx) => (
                  <ColorPresetButton
                    key={idx}
                    $color={preset.color}
                    $transparent={preset.transparent}
                    $selected={
                      preset.transparent
                        ? !editor.isActive('highlight')
                        : editor.getAttributes('highlight')?.color === preset.color
                    }
                    onClick={() => handleHighlightColorSelect(preset.color)}
                    title={preset.label}
                  />
                ))}
              </ColorPresetGrid>
              <CustomColorSection>
                <ColorPickerTitle>커스텀 색상</ColorPickerTitle>
                <CustomColorInput>
                  <ColorInput
                    type="text"
                    value={customHighlightColor}
                    onChange={handleHighlightColorInputChange}
                    placeholder="#ffff0080"
                    maxLength={9}
                  />
                  <NativeColorPicker
                    type="color"
                    value={customHighlightColor.length >= 7 ? customHighlightColor.substring(0, 7) : '#000000'}
                    onChange={(e) => {
                      setCustomHighlightColor(e.target.value + '80');
                      handleHighlightColorSelect(e.target.value + '80'); // 투명도 추가
                    }}
                  />
                </CustomColorInput>
              </CustomColorSection>
            </ColorPickerModal>
          )}
        </ColorPickerWrapper>

        <Divider />

        <MacroButton onClick={handleMacroOpen} title="매크로 목록 열기">
          매크로
        </MacroButton>
      </TopToolbar>

      <EditorContentWrapper
        onClick={(e) => {
          // 클릭한 요소가 ProseMirror 에디터가 아닌 경우 (빈 공간 클릭)
          if (editor && e.target === e.currentTarget) {
            editor.chain().focus().run();
            // 커서를 마지막으로 이동
            const { doc } = editor.state;
            const endPos = doc.content.size;
            editor.commands.setTextSelection(endPos);
          }
        }}
      >
        <EditorContent editor={editor} />
      </EditorContentWrapper>

      {/* 하단 툴바: 정렬 3종, 목록 2종, 인용구, 이미지/YouTube/링크 */}
      <BottomToolbar>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          $isActive={editor.isActive({ textAlign: 'left' })}
          title="왼쪽 정렬"
        >
          <FaAlignLeft />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          $isActive={editor.isActive({ textAlign: 'center' })}
          title="가운데 정렬"
        >
          <FaAlignCenter />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          $isActive={editor.isActive({ textAlign: 'right' })}
          title="오른쪽 정렬"
        >
          <FaAlignRight />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          $isActive={editor.isActive('bulletList')}
          title="글머리 기호"
        >
          <FaListUl />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          $isActive={editor.isActive('orderedList')}
          title="번호 매기기"
        >
          <FaListOl />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          $isActive={editor.isActive('blockquote')}
          title="인용구"
        >
          <FaQuoteLeft />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title={isUploading ? "업로드 중..." : "이미지 삽입"}
        >
          {isUploading ? '...' : <FaImage />}
        </ToolbarButton>
        <ToolbarButton
          onClick={handleYoutubeAdd}
          title="YouTube 영상 삽입"
        >
          <FaYoutube />
        </ToolbarButton>
        <ToolbarButton
          onClick={handleLinkAdd}
          $isActive={editor.isActive('link')}
          title="링크 삽입"
        >
          <FaLink />
        </ToolbarButton>
      </BottomToolbar>

      <HiddenFileInput
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
      />

      {showMacroModal && (
        <MacroModalOverlay onClick={handleMacroClose}>
          <MacroModalContent onClick={(e) => e.stopPropagation()}>
            <MacroModalTitle>매크로 선택</MacroModalTitle>
            <MacroGrid>
              {macros.length > 0 ? (
                macros.map((macroText, index) => (
                  <MacroItem
                    key={index}
                    onClick={() => handleMacroSelect(macroText)}
                  >
                    {index + 1}. {macroText}
                  </MacroItem>
                ))
              ) : (
                <MacroItem disabled style={{ cursor: 'default', opacity: 0.5 }}>
                  등록된 매크로가 없습니다.
                </MacroItem>
              )}
            </MacroGrid>
          </MacroModalContent>
        </MacroModalOverlay>
      )}

      {showLinkModal && (
        <LinkModalOverlay onClick={handleLinkCancel}>
          <LinkModalContent onClick={(e) => e.stopPropagation()}>
            <LinkModalTitle>링크 추가</LinkModalTitle>
            <LinkInput
              type="url"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLinkSave();
                }
              }}
              autoFocus
            />
            <LinkModalButtons>
              <LinkModalButton onClick={handleLinkCancel}>취소</LinkModalButton>
              <LinkModalButton $primary onClick={handleLinkSave}>
                추가
              </LinkModalButton>
            </LinkModalButtons>
          </LinkModalContent>
        </LinkModalOverlay>
      )}

      {/* YouTube 모달 */}
      {showYoutubeModal && (
        <LinkModalOverlay onClick={handleYoutubeCancel}>
          <LinkModalContent onClick={(e) => e.stopPropagation()}>
            <LinkModalTitle>YouTube 영상 추가</LinkModalTitle>
            <YoutubeTextarea
              placeholder="YouTube URL 또는 iframe 임베드 코드를 붙여넣으세요&#10;&#10;예시:&#10;• https://www.youtube.com/watch?v=VIDEO_ID&#10;• https://www.youtube.com/watch?v=VIDEO_ID&t=30s (30초부터 재생)&#10;• https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1&#10;• <iframe src=&quot;https://youtube.com/embed/...&quot;>...</iframe>"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              autoFocus
            />
            <YoutubeHelperText>
              💡 URL 파라미터로 옵션 제어 가능:
              <br />
              • <strong>t=30s</strong> 또는 <strong>start=30</strong>: 특정 시점부터 재생
              <br />
              • <strong>autoplay=1</strong>: 자동 재생
              <br />
              • <strong>mute=1</strong>: 음소거
            </YoutubeHelperText>
            <LinkModalButtons>
              <LinkModalButton onClick={handleYoutubeCancel}>취소</LinkModalButton>
              <LinkModalButton $primary onClick={handleYoutubeSave}>
                추가
              </LinkModalButton>
            </LinkModalButtons>
          </LinkModalContent>
        </LinkModalOverlay>
      )}

      {/* 전체화면 이미지 모달 */}
      {fullscreenImage && (
        <FullscreenImageOverlay onClick={() => setFullscreenImage(null)}>
          <FullscreenCloseButton onClick={() => setFullscreenImage(null)}>
            &times;
          </FullscreenCloseButton>
          <FullscreenImageContainer>
            <FullscreenImageElement src={fullscreenImage} alt="Full screen" />
          </FullscreenImageContainer>
        </FullscreenImageOverlay>
      )}
    </EditorWrapper>
  );
};

export default RichTextEditor;
