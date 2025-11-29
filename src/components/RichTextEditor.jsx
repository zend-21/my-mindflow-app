// src/components/RichTextEditor.jsx

import React, { useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import styled from 'styled-components';
import { uploadImage } from '../utils/storageService';
import {
  FaBold, FaItalic, FaUnderline, FaStrikethrough,
  FaListUl, FaListOl, FaAlignLeft, FaAlignCenter, FaAlignRight,
  FaImage, FaLink, FaQuoteLeft, FaCode
} from 'react-icons/fa';

const EditorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;

  @media (max-width: 768px) {
    gap: 2px;
    padding: 6px 4px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none; /* Firefox */
    &::-webkit-scrollbar {
      display: none; /* Chrome, Safari */
    }
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
  background: ${props => props.$isActive ? 'rgba(102, 126, 234, 0.3)' : 'transparent'};
  color: ${props => props.$isActive ? '#667eea' : '#e0e0e0'};
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 14px;

  &:hover {
    background: ${props => props.$isActive ? 'rgba(102, 126, 234, 0.4)' : 'rgba(255, 255, 255, 0.05)'};
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

const ColorPicker = styled.input`
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;

  &::-webkit-color-swatch-wrapper {
    padding: 2px;
  }

  &::-webkit-color-swatch {
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
  }
`;

const EditorContentWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: transparent;

  /* TipTap 에디터 스타일 */
  .ProseMirror {
    outline: none;
    min-height: 100px;
    color: #e0e0e0;
    font-size: 15px;
    line-height: 1.6;

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

    /* 이미지 */
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 0.5em 0;
    }

    /* 플레이스홀더 */
    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: #6b7280;
      pointer-events: none;
      height: 0;
    }
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const RichTextEditor = ({ content, onChange, placeholder = '내용을 입력하세요...' }) => {
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
  });

  const handleImageUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    try {
      // Firebase Storage (또는 R2)에 업로드
      const url = await uploadImage(file);

      // 에디터에 이미지 삽입
      editor.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
    }

    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [editor]);

  const handleLinkAdd = useCallback(() => {
    if (!editor) return;

    const url = prompt('링크 URL을 입력하세요:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <EditorWrapper>
      <Toolbar>
        {/* 텍스트 스타일 */}
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

        {/* 색상 */}
        <ColorPicker
          type="color"
          onInput={(e) => editor.chain().focus().setColor(e.target.value).run()}
          title="글자 색상"
        />

        <Divider />

        {/* 정렬 */}
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

        {/* 리스트 */}
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

        {/* 인용구, 코드 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          $isActive={editor.isActive('blockquote')}
          title="인용구"
        >
          <FaQuoteLeft />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          $isActive={editor.isActive('code')}
          title="인라인 코드"
        >
          <FaCode />
        </ToolbarButton>

        <Divider />

        {/* 이미지, 링크 */}
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          title="이미지 삽입"
        >
          <FaImage />
        </ToolbarButton>
        <ToolbarButton
          onClick={handleLinkAdd}
          $isActive={editor.isActive('link')}
          title="링크 삽입"
        >
          <FaLink />
        </ToolbarButton>
      </Toolbar>

      <EditorContentWrapper>
        <EditorContent editor={editor} />
      </EditorContentWrapper>

      <HiddenFileInput
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
      />
    </EditorWrapper>
  );
};

export default RichTextEditor;
