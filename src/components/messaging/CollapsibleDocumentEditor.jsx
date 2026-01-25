// 📄 접었다 폈다 할 수 있는 문서 편집기
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ChevronDown, ChevronUp, Save, X, Users, Lock, Eye, FolderOpen } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

// 문서 편집기 컨테이너 (접었을 때는 작게, 펼쳤을 때는 크게)
const EditorContainer = styled.div`
  position: relative;
  background: linear-gradient(180deg, #2a2d35, #1f2128);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  ${props => props.$collapsed ? `
    height: 56px;
  ` : `
    height: 400px;
  `}
`;

// 헤더 (항상 보임)
const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const DocumentIcon = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
`;

const TitleInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.08);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PermissionBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${props => {
    if (props.$type === 'owner') return 'rgba(46, 213, 115, 0.15)';
    if (props.$type === 'editor') return 'rgba(74, 144, 226, 0.15)';
    return 'rgba(255, 255, 255, 0.05)';
  }};
  border-radius: 6px;
  color: ${props => {
    if (props.$type === 'owner') return '#2ed573';
    if (props.$type === 'editor') return '#4a90e2';
    return '#888';
  }};
  font-size: 12px;
  font-weight: 600;
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  color: #888;
  padding: 6px;
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ToggleButton = styled(IconButton)`
  color: #4a90e2;

  &:hover {
    background: rgba(74, 144, 226, 0.15);
  }
`;

// 콘텐츠 영역 (펼쳤을 때만 보임)
const EditorContent = styled.div`
  display: ${props => props.$collapsed ? 'none' : 'flex'};
  flex-direction: column;
  height: calc(100% - 56px);
  padding: 16px;
  gap: 12px;
`;

// 도구 모음
const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToolbarButton = styled.button`
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

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SaveButton = styled(ToolbarButton)`
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

const LoadButton = styled(ToolbarButton)`
  background: rgba(74, 144, 226, 0.15);
  border: 1px solid rgba(74, 144, 226, 0.3);
  color: #4a90e2;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 6px 10px;

  &:hover:not(:disabled) {
    background: rgba(74, 144, 226, 0.25);
    border-color: rgba(74, 144, 226, 0.4);
  }
`;

// 편집기 텍스트 영역
const TextArea = styled.textarea`
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.6;
  resize: none;
  transition: all 0.2s;

  &::placeholder {
    color: #666;
  }

  &:focus {
    outline: none;
    border-color: #4a90e2;
    background: rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* 스크롤바 스타일 */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

// 하단 정보
const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  font-size: 12px;
  color: #888;
`;

const CollapsibleDocumentEditor = ({
  document,
  currentUserId,
  isRoomOwner, // 방장 여부
  showToast,
  onClose,
  onDocumentUpdated, // 문서 업데이트 시 콜백
  onLoadFromShared // 공유 폴더에서 불러오기 콜백
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [title, setTitle] = useState(document?.title || '');
  const [content, setContent] = useState(document?.content || '');
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalMemoId, setOriginalMemoId] = useState(document?.originalMemoId || null);

  // 문서 변경 시 상태 업데이트
  useEffect(() => {
    if (document) {
      setTitle(document.title || '');
      setContent(document.content || '');
      setOriginalMemoId(document.originalMemoId || null);
      setHasUnsavedChanges(false);
    }
  }, [document]);

  // 문서 변경 감지
  useEffect(() => {
    const hasChanges =
      title !== (document?.title || '') ||
      content !== (document?.content || '');
    setHasUnsavedChanges(hasChanges);
  }, [title, content, document]);

  // 저장 핸들러 - 방장만 가능하며, 공유 폴더에 수정본 생성
  const handleSave = async () => {
    if (!isRoomOwner) {
      showToast?.('방장만 저장할 수 있습니다');
      return;
    }

    if (!title.trim()) {
      showToast?.('제목을 입력하세요');
      return;
    }

    if (!hasUnsavedChanges) {
      showToast?.('변경사항이 없습니다');
      return;
    }

    setSaving(true);

    try {
      // 공유 폴더에 수정본 저장
      const memosRef = collection(db, 'memos');

      // 수정본 제목 생성
      let modifiedTitle = title;
      if (originalMemoId && !title.endsWith('-수정본')) {
        modifiedTitle = `${title}-수정본`;
      }

      const newMemo = {
        title: modifiedTitle,
        content: content,
        folderId: 'shared',
        userId: currentUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tags: ['대화방수정본'],
        originalMemoId: originalMemoId || null, // 원본 메모 ID 저장
        modifiedInChatRoom: true
      };

      await addDoc(memosRef, newMemo);

      // 로컬 상태 업데이트
      if (onDocumentUpdated) {
        onDocumentUpdated({
          ...document,
          title: modifiedTitle,
          content: content
        });
      }

      setTitle(modifiedTitle);
      setHasUnsavedChanges(false);
      showToast?.('수정본이 공유 폴더에 저장되었습니다');
    } catch (error) {
      console.error('문서 저장 실패:', error);
      showToast?.('문서 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  // 권한 타입 결정
  const permissionType = isRoomOwner ? 'owner' : 'editor';
  const permissionLabel = isRoomOwner ? '방장' : '멤버';
  const PermissionIcon = isRoomOwner ? Lock : Users;

  // 포맷팅 시간
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <EditorContainer $collapsed={collapsed}>
      {/* 헤더 */}
      <EditorHeader onClick={() => !collapsed && setCollapsed(false)}>
        <HeaderLeft>
          <DocumentIcon>📄</DocumentIcon>
          {collapsed ? (
            <TitleInput
              value={title}
              disabled
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <TitleInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문서 제목을 입력하세요"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </HeaderLeft>

        <HeaderRight onClick={(e) => e.stopPropagation()}>
          <PermissionBadge $type={permissionType}>
            <PermissionIcon size={14} />
            {permissionLabel}
          </PermissionBadge>

          {onClose && (
            <IconButton onClick={onClose} title="닫기" style={{ marginLeft: '20px' }}>
              <X size={18} />
            </IconButton>
          )}

          <ToggleButton
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            title={collapsed ? '펼치기' : '접기'}
          >
            {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </ToggleButton>
        </HeaderRight>
      </EditorHeader>

      {/* 콘텐츠 */}
      <EditorContent $collapsed={collapsed}>
        {/* 도구 모음 */}
        <Toolbar>
          <ToolbarLeft>
            {onLoadFromShared && (
              <LoadButton onClick={onLoadFromShared} title="공유 폴더에서 불러오기">
                <FolderOpen size={14} />
                불러오기
              </LoadButton>
            )}
            <SaveButton
              onClick={handleSave}
              disabled={!isRoomOwner || !hasUnsavedChanges || saving}
              title={!isRoomOwner ? '방장만 저장할 수 있습니다' : ''}
            >
              <Save size={16} />
              {saving ? '저장 중...' : '공유 폴더에 저장'}
            </SaveButton>
            {hasUnsavedChanges && (
              <span style={{ color: '#ff9800', fontSize: '12px' }}>
                • 저장되지 않은 변경사항
              </span>
            )}
            {!isRoomOwner && (
              <span style={{ color: '#888', fontSize: '12px' }}>
                • 방장만 저장 가능
              </span>
            )}
          </ToolbarLeft>
        </Toolbar>

        {/* 텍스트 편집 영역 */}
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="문서 내용을 입력하세요..."
        />

        {/* 하단 정보 */}
        <Footer>
          <span>
            {document?.updatedAt ? `마지막 수정: ${formatTime(document.updatedAt)}` : '새 문서'}
          </span>
          <span>
            {content.length} 글자
            {originalMemoId && ' • 공유 폴더에서 불러온 문서'}
          </span>
        </Footer>
      </EditorContent>
    </EditorContainer>
  );
};

export default CollapsibleDocumentEditor;
