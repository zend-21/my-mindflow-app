import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera } from '@capacitor/camera';
import { CameraResultType, CameraSource } from '@capacitor/camera';
import { compressImage } from '../utils/storage';
import './RichTextEditorModal.css';

const RichTextEditorModal = ({ isOpen, onClose, content, onSave, showToast }) => {
  const [editorContent, setEditorContent] = useState(content || '');
  const [videoUrl, setVideoUrl] = useState('');
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    setEditorContent(content || '');
  }, [content]);

  // 텍스트 포맷팅 함수
  const applyFormat = (formatType) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editorContent.substring(start, end);

    let newText = editorContent;
    let formatPrefix = '';
    let formatSuffix = '';

    switch (formatType) {
      case 'bold':
        formatPrefix = '**';
        formatSuffix = '**';
        break;
      case 'italic':
        formatPrefix = '*';
        formatSuffix = '*';
        break;
      case 'center':
        formatPrefix = '[center]';
        formatSuffix = '[/center]';
        break;
      case 'left':
        formatPrefix = '[left]';
        formatSuffix = '[/left]';
        break;
      case 'right':
        formatPrefix = '[right]';
        formatSuffix = '[/right]';
        break;
      default:
        return;
    }

    if (selectedText) {
      // 선택된 텍스트가 있으면 해당 텍스트에 포맷 적용
      newText =
        editorContent.substring(0, start) +
        formatPrefix + selectedText + formatSuffix +
        editorContent.substring(end);
    } else {
      // 선택된 텍스트가 없으면 커서 위치에 포맷 마커 삽입
      newText =
        editorContent.substring(0, start) +
        formatPrefix + formatSuffix +
        editorContent.substring(end);
    }

    setEditorContent(newText);

    // 커서 위치 조정
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formatPrefix.length + (selectedText ? selectedText.length : 0);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 이미지 파일 선택 및 추가
  const handleImageUpload = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt
      });

      if (image.dataUrl) {
        const compressedImage = await compressImage(image.dataUrl, 1200, 0.8);

        // 이미지 마크다운 형식으로 삽입
        const textarea = textareaRef.current;
        const cursorPos = textarea ? textarea.selectionStart : editorContent.length;
        const imageMarkdown = `\n![이미지](${compressedImage})\n`;

        const newText =
          editorContent.substring(0, cursorPos) +
          imageMarkdown +
          editorContent.substring(cursorPos);

        setEditorContent(newText);

        setTimeout(() => {
          if (textarea) {
            textarea.focus();
            const newCursorPos = cursorPos + imageMarkdown.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      }
    } catch (error) {
      console.error('이미지 추가 실패:', error);
      showToast?.('이미지 추가에 실패했습니다.');
    }
  };

  // 비디오 URL 삽입
  const handleVideoInsert = () => {
    if (!videoUrl.trim()) {
      showToast?.('비디오 URL을 입력해주세요.');
      return;
    }

    const textarea = textareaRef.current;
    const cursorPos = textarea ? textarea.selectionStart : editorContent.length;
    const videoMarkdown = `\n[video](${videoUrl.trim()})\n`;

    const newText =
      editorContent.substring(0, cursorPos) +
      videoMarkdown +
      editorContent.substring(cursorPos);

    setEditorContent(newText);
    setVideoUrl('');
    setShowVideoInput(false);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newCursorPos = cursorPos + videoMarkdown.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // 링크 삽입
  const handleLinkInsert = () => {
    if (!linkUrl.trim()) {
      showToast?.('링크 URL을 입력해주세요.');
      return;
    }

    const displayText = linkText.trim() || linkUrl.trim();
    const textarea = textareaRef.current;
    const cursorPos = textarea ? textarea.selectionStart : editorContent.length;
    const linkMarkdown = `[${displayText}](${linkUrl.trim()})`;

    const newText =
      editorContent.substring(0, cursorPos) +
      linkMarkdown +
      editorContent.substring(cursorPos);

    setEditorContent(newText);
    setLinkText('');
    setLinkUrl('');
    setShowLinkInput(false);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newCursorPos = cursorPos + linkMarkdown.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // 저장 핸들러
  const handleSave = () => {
    onSave(editorContent);
    onClose();
  };

  console.log('RichTextEditorModal 렌더링 - isOpen:', isOpen);

  if (!isOpen) return null;

  console.log('모달 표시 중');

  const modalContent = (
    <div className="rich-text-editor-overlay" onClick={onClose}>
      <div className="rich-text-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h2>리뷰 내용 작성</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="editor-toolbar">
          <button
            type="button"
            className="toolbar-button"
            onClick={() => applyFormat('bold')}
            title="굵게"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => applyFormat('italic')}
            title="기울임"
          >
            <em>I</em>
          </button>
          <div className="toolbar-divider"></div>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => applyFormat('left')}
            title="왼쪽 정렬"
          >
            ≡
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => applyFormat('center')}
            title="중앙 정렬"
          >
            ≡
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => applyFormat('right')}
            title="오른쪽 정렬"
          >
            ≡
          </button>
          <div className="toolbar-divider"></div>
          <button
            type="button"
            className="toolbar-button"
            onClick={handleImageUpload}
            title="이미지 추가"
          >
            📷
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => setShowVideoInput(!showVideoInput)}
            title="동영상 추가"
          >
            🎬
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => setShowLinkInput(!showLinkInput)}
            title="링크 추가"
          >
            🔗
          </button>
        </div>

        {/* 비디오 URL 입력 */}
        {showVideoInput && (
          <div className="inline-input-group">
            <input
              type="url"
              className="inline-input"
              placeholder="YouTube 또는 비디오 URL을 입력하세요"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleVideoInsert();
                }
              }}
            />
            <button
              type="button"
              className="inline-button"
              onClick={handleVideoInsert}
            >
              삽입
            </button>
            <button
              type="button"
              className="inline-button cancel"
              onClick={() => {
                setVideoUrl('');
                setShowVideoInput(false);
              }}
            >
              취소
            </button>
          </div>
        )}

        {/* 링크 입력 */}
        {showLinkInput && (
          <div className="inline-input-group">
            <input
              type="text"
              className="inline-input"
              placeholder="링크 텍스트 (선택사항)"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
            />
            <input
              type="url"
              className="inline-input"
              placeholder="URL을 입력하세요"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLinkInsert();
                }
              }}
            />
            <button
              type="button"
              className="inline-button"
              onClick={handleLinkInsert}
            >
              삽입
            </button>
            <button
              type="button"
              className="inline-button cancel"
              onClick={() => {
                setLinkText('');
                setLinkUrl('');
                setShowLinkInput(false);
              }}
            >
              취소
            </button>
          </div>
        )}

        <div className="editor-content-area">
          <textarea
            ref={textareaRef}
            className="editor-textarea"
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            placeholder="솔직한 후기를 작성해주세요. 이 리뷰는 나만 볼 수 있습니다."
            autoFocus
          />
        </div>

        <div className="editor-footer">
          <button
            type="button"
            className="editor-cancel-button"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="editor-save-button"
            onClick={handleSave}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default RichTextEditorModal;
