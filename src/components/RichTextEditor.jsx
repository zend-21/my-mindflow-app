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
import { uploadImage } from '../utils/storageService';
import {
  FaBold, FaItalic, FaUnderline, FaStrikethrough,
  FaListUl, FaListOl, FaAlignLeft, FaAlignCenter, FaAlignRight,
  FaImage, FaLink, FaQuoteLeft, FaYoutube, FaUndo, FaRedo
} from 'react-icons/fa';
import * as S from './RichTextEditor.styles';

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
  const isComposingRef = useRef(false); // IME 조합 중 여부 추적
  const pendingChangeRef = useRef(false); // 조합 완료 후 변경 전파 필요 여부
  const lastSafeContentRef = useRef(content || ''); // IME 조합 중 사용할 안전한 content

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
      // IME 입력 처리 (한글 입력 버그 방지)
      handleDOMEvents: {
        compositionstart: (view) => {
          // 빈 노드나 빈 마크가 있으면 제거
          const { state, dispatch } = view;
          const { selection, tr } = state;
          const { $from } = selection;

          if ($from.parent.textContent.trim() === '') {
            // 모든 마크 제거
            const marks = $from.marks();
            if (marks.length > 0) {
              marks.forEach(mark => {
                tr.removeMark($from.pos - $from.parentOffset, $from.pos - $from.parentOffset + $from.parent.content.size, mark.type);
              });
              dispatch(tr);
            }
          }
          return false;
        },
      },
    },
    onUpdate: ({ editor }) => {
      // IME 조합 중에도 onChange를 호출하여 버튼 상태 실시간 업데이트
      // (한글 입력 시 중복 문자 방지는 compositionend 이벤트에서 처리)
      const html = editor.getHTML();
      onChange?.(html);

      if (editor.view.composing || isComposingRef.current) {
        pendingChangeRef.current = true;
      } else {
        pendingChangeRef.current = false;
      }
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

  // IME 조합 이벤트 처리 (한글 입력 버그 방지)
  useEffect(() => {
    if (!editor) return;

    const editorElement = editor.view.dom;

    const handleCompositionStart = () => {
      isComposingRef.current = true;
    };

    const handleCompositionEnd = () => {
      isComposingRef.current = false;

      // 조합 완료 후 현재 에디터 내용을 안전한 content로 저장
      requestAnimationFrame(() => {
        if (editor && !editor.isDestroyed) {
          const html = editor.getHTML();
          lastSafeContentRef.current = html;

          // 대기 중인 변경사항이 있으면 즉시 전파
          if (pendingChangeRef.current) {
            onChange?.(html);
            pendingChangeRef.current = false;
          }
        }
      });
    };

    editorElement.addEventListener('compositionstart', handleCompositionStart);
    editorElement.addEventListener('compositionend', handleCompositionEnd);

    return () => {
      editorElement.removeEventListener('compositionstart', handleCompositionStart);
      editorElement.removeEventListener('compositionend', handleCompositionEnd);
    };
  }, [editor, onChange]);

  // content prop 변경 시 에디터 업데이트
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    // IME 조합 중이면 content 업데이트를 완전히 무시
    if (editor.view.composing || isComposingRef.current) {
      return;
    }

    const currentContent = editor.getHTML();
    const newContent = content || '';

    // 초기 로드 시에만 content를 설정
    if (isInitialMount.current && currentContent !== newContent) {
      editor.commands.setContent(newContent, false);
      lastSafeContentRef.current = newContent;
      isInitialMount.current = false;
      return;
    }

    // 초기 로드 이후에는 포커스가 없을 때만 업데이트
    const shouldUpdate = currentContent !== newContent && !editor.isFocused;

    if (shouldUpdate) {
      editor.commands.setContent(newContent, false);
      lastSafeContentRef.current = newContent;
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

    // 원본 파일명 저장
    const originalFileName = file.name;

    try {
      setIsUploading(true);

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

          if (blobSize > 5) {
            alert('이미지를 리사이즈했지만 여전히 5MB를 초과합니다. 더 작은 이미지를 사용해주세요.');
            setIsUploading(false);
            return;
          }

          try {
            // R2에 업로드 (원본 파일명 전달)
            const imageUrl = await uploadImage(
              blob,
              'images',
              originalFileName,
              'image/jpeg' // 리사이즈된 이미지 타입 명시
            );

            console.log('✅ [RichTextEditor] R2 업로드 완료, URL 삽입:', imageUrl);

            // 에디터에 URL 삽입
            editor.chain().focus().setImage({ src: imageUrl }).run();

            console.log('✅ [RichTextEditor] 에디터 이미지 URL 교체 완료');

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
    <S.EditorWrapper>
      {/* 상단 툴바: Undo/Redo, 글자체 4종, 색상, 매크로 */}
      <S.TopToolbar>
        <S.ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="실행 취소 (Ctrl+Z)"
        >
          <FaUndo />
        </S.ToolbarButton>
        <S.ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="다시 실행 (Ctrl+Y)"
        >
          <FaRedo />
        </S.ToolbarButton>

        <S.Divider />

        <S.ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          $isActive={editor.isActive('bold')}
          title="굵게 (Ctrl+B)"
        >
          <FaBold />
        </S.ToolbarButton>
        <S.ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          $isActive={editor.isActive('italic')}
          title="기울임 (Ctrl+I)"
        >
          <FaItalic />
        </S.ToolbarButton>
        <S.ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          $isActive={editor.isActive('underline')}
          title="밑줄 (Ctrl+U)"
        >
          <FaUnderline />
        </S.ToolbarButton>
        <S.ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          $isActive={editor.isActive('strike')}
          title="취소선"
        >
          <FaStrikethrough />
        </S.ToolbarButton>

        <S.Divider />

        {/* 텍스트 색상 선택 */}
        <S.ColorPickerWrapper>
          <S.ColorButton
            $color={editor.getAttributes('textStyle').color || '#e0e0e0'}
            onClick={() => setShowTextColorPicker(!showTextColorPicker)}
            title="글자 색상"
          />
          {showTextColorPicker && (
            <S.ColorPickerModal ref={textColorModalRef} onClick={(e) => e.stopPropagation()}>
              <S.ColorPickerTitle>글자 색상</S.ColorPickerTitle>
              <S.ColorPresetGrid>
                {TEXT_COLOR_PRESETS.map((preset) => (
                  <S.ColorPresetButton
                    key={preset.color}
                    $color={preset.color}
                    $selected={editor.getAttributes('textStyle').color === preset.color}
                    onClick={() => handleTextColorSelect(preset.color)}
                    title={preset.label}
                  />
                ))}
              </S.ColorPresetGrid>
              <S.CustomColorSection>
                <S.ColorPickerTitle>커스텀 색상</S.ColorPickerTitle>
                <S.CustomColorInput>
                  <S.ColorInput
                    type="text"
                    value={customTextColor}
                    onChange={handleTextColorInputChange}
                    placeholder="#000000"
                    maxLength={7}
                  />
                  <S.NativeColorPicker
                    type="color"
                    value={customTextColor.length === 7 ? customTextColor : '#000000'}
                    onChange={(e) => {
                      setCustomTextColor(e.target.value);
                      handleTextColorSelect(e.target.value);
                    }}
                  />
                </S.CustomColorInput>
              </S.CustomColorSection>
            </S.ColorPickerModal>
          )}
        </S.ColorPickerWrapper>

        {/* 색상 버튼 사이 간격 */}
        <div style={{ width: '8px' }} />

        {/* 형광펜 색상 선택 */}
        <S.ColorPickerWrapper>
          <S.ColorButton
            $color={editor.getAttributes('highlight')?.color}
            $transparent={!editor.isActive('highlight')}
            onClick={() => setShowHighlightColorPicker(!showHighlightColorPicker)}
            title="형광펜 (배경색)"
          />
          {showHighlightColorPicker && (
            <S.ColorPickerModal ref={highlightColorModalRef} onClick={(e) => e.stopPropagation()}>
              <S.ColorPickerTitle>형광펜 색상</S.ColorPickerTitle>
              <S.ColorPresetGrid>
                {HIGHLIGHT_COLOR_PRESETS.map((preset, idx) => (
                  <S.ColorPresetButton
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
              </S.ColorPresetGrid>
              <S.CustomColorSection>
                <S.ColorPickerTitle>커스텀 색상</S.ColorPickerTitle>
                <S.CustomColorInput>
                  <S.ColorInput
                    type="text"
                    value={customHighlightColor}
                    onChange={handleHighlightColorInputChange}
                    placeholder="#ffff0080"
                    maxLength={9}
                  />
                  <S.NativeColorPicker
                    type="color"
                    value={customHighlightColor.length >= 7 ? customHighlightColor.substring(0, 7) : '#000000'}
                    onChange={(e) => {
                      setCustomHighlightColor(e.target.value + '80');
                      handleHighlightColorSelect(e.target.value + '80'); // 투명도 추가
                    }}
                  />
                </S.CustomColorInput>
              </S.CustomColorSection>
            </S.ColorPickerModal>
          )}
        </S.ColorPickerWrapper>

        <S.Divider />

        <S.MacroButton onClick={handleMacroOpen} title="매크로 목록 열기">
          매크로
        </S.MacroButton>
      </S.TopToolbar>

      <S.EditorContentWrapper
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
      </S.EditorContentWrapper>

      {/* 하단 툴바: 정렬 3종, 목록 2종, 인용구, 이미지/YouTube/링크 */}
      <S.BottomToolbar>
        <S.ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          $isActive={editor.isActive({ textAlign: 'left' })}
          title="왼쪽 정렬"
        >
          <FaAlignLeft />
        </S.ToolbarButton>
        <S.ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          $isActive={editor.isActive({ textAlign: 'center' })}
          title="가운데 정렬"
        >
          <FaAlignCenter />
        </S.ToolbarButton>
        <S.ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          $isActive={editor.isActive({ textAlign: 'right' })}
          title="오른쪽 정렬"
        >
          <FaAlignRight />
        </S.ToolbarButton>

        <S.Divider />

        <S.ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          $isActive={editor.isActive('bulletList')}
          title="글머리 기호"
        >
          <FaListUl />
        </S.ToolbarButton>
        <S.ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          $isActive={editor.isActive('orderedList')}
          title="번호 매기기"
        >
          <FaListOl />
        </S.ToolbarButton>

        <S.Divider />

        <S.ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          $isActive={editor.isActive('blockquote')}
          title="인용구"
        >
          <FaQuoteLeft />
        </S.ToolbarButton>

        <S.Divider />

        <S.ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title={isUploading ? "업로드 중..." : "이미지 삽입"}
        >
          {isUploading ? '...' : <FaImage />}
        </S.ToolbarButton>
        <S.ToolbarButton
          onClick={handleYoutubeAdd}
          title="YouTube 영상 삽입"
        >
          <FaYoutube />
        </S.ToolbarButton>
        <S.ToolbarButton
          onClick={handleLinkAdd}
          $isActive={editor.isActive('link')}
          title="링크 삽입"
        >
          <FaLink />
        </S.ToolbarButton>
      </S.BottomToolbar>

      <S.HiddenFileInput
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
      />

      {showMacroModal && (
        <S.MacroModalOverlay onClick={handleMacroClose}>
          <S.MacroModalContent onClick={(e) => e.stopPropagation()}>
            <S.MacroModalTitle>매크로 선택</S.MacroModalTitle>
            <S.MacroGrid>
              {macros.length > 0 ? (
                macros.map((macroText, index) => (
                  <S.MacroItem
                    key={index}
                    onClick={() => handleMacroSelect(macroText)}
                  >
                    {index + 1}. {macroText}
                  </S.MacroItem>
                ))
              ) : (
                <S.MacroItem disabled style={{ cursor: 'default', opacity: 0.5 }}>
                  등록된 매크로가 없습니다.
                </S.MacroItem>
              )}
            </S.MacroGrid>
          </S.MacroModalContent>
        </S.MacroModalOverlay>
      )}

      {showLinkModal && (
        <S.LinkModalOverlay onClick={handleLinkCancel}>
          <S.LinkModalContent onClick={(e) => e.stopPropagation()}>
            <S.LinkModalTitle>링크 추가</S.LinkModalTitle>
            <S.LinkInput
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
            <S.LinkModalButtons>
              <S.LinkModalButton onClick={handleLinkCancel}>취소</S.LinkModalButton>
              <S.LinkModalButton $primary onClick={handleLinkSave}>
                추가
              </S.LinkModalButton>
            </S.LinkModalButtons>
          </S.LinkModalContent>
        </S.LinkModalOverlay>
      )}

      {/* YouTube 모달 */}
      {showYoutubeModal && (
        <S.LinkModalOverlay onClick={handleYoutubeCancel}>
          <S.LinkModalContent onClick={(e) => e.stopPropagation()}>
            <S.LinkModalTitle>YouTube 영상 추가</S.LinkModalTitle>
            <S.YoutubeTextarea
              placeholder="YouTube URL 또는 iframe 임베드 코드를 붙여넣으세요&#10;&#10;예시:&#10;• https://www.youtube.com/watch?v=VIDEO_ID&#10;• https://www.youtube.com/watch?v=VIDEO_ID&t=30s (30초부터 재생)&#10;• https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1&#10;• <iframe src=&quot;https://youtube.com/embed/...&quot;>...</iframe>"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              autoFocus
            />
            <S.YoutubeHelperText>
              💡 URL 파라미터로 옵션 제어 가능:
              <br />
              • <strong>t=30s</strong> 또는 <strong>start=30</strong>: 특정 시점부터 재생
              <br />
              • <strong>autoplay=1</strong>: 자동 재생
              <br />
              • <strong>mute=1</strong>: 음소거
            </S.YoutubeHelperText>
            <S.LinkModalButtons>
              <S.LinkModalButton onClick={handleYoutubeCancel}>취소</S.LinkModalButton>
              <S.LinkModalButton $primary onClick={handleYoutubeSave}>
                추가
              </S.LinkModalButton>
            </S.LinkModalButtons>
          </S.LinkModalContent>
        </S.LinkModalOverlay>
      )}

      {/* 전체화면 이미지 모달 */}
      {fullscreenImage && (
        <S.FullscreenImageOverlay onClick={() => setFullscreenImage(null)}>
          <S.FullscreenCloseButton onClick={() => setFullscreenImage(null)}>
            &times;
          </S.FullscreenCloseButton>
          <S.FullscreenImageContainer>
            <S.FullscreenImageElement src={fullscreenImage} alt="Full screen" />
          </S.FullscreenImageContainer>
        </S.FullscreenImageOverlay>
      )}
    </S.EditorWrapper>
  );
};

export default RichTextEditor;
