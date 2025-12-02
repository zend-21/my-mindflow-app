// 📝 실시간 협업 문서 편집기 (모바일 최적화)
// 드래그 선택 → 입력 → 자동 형광표시 → 매니저 컨펌 시스템
import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { ChevronDown, ChevronUp, Save, X, Users, Lock, FolderOpen, Check, XCircle, Info } from 'lucide-react';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';

// 스타일 컴포넌트들 (기존과 유사하지만 contentEditable용으로 수정)
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
    min-height: 400px;
    max-height: 600px;
  `}
`;

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

const EditorContent = styled.div`
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

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
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

const SaveButton = styled(ToolbarButton)`
  background: linear-gradient(135deg, #2ed573, #26bf62);
  border: none;
  color: #ffffff;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(46, 213, 115, 0.3);
  }
`;

const LoadButton = styled(ToolbarButton)`
  background: rgba(74, 144, 226, 0.15);
  border: 1px solid rgba(74, 144, 226, 0.3);
  color: #4a90e2;

  &:hover:not(:disabled) {
    background: rgba(74, 144, 226, 0.25);
  }
`;

// contentEditable 영역 (형광펜 표시 포함)
const ContentEditableArea = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.8;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  cursor: text;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4a90e2;
    background: rgba(0, 0, 0, 0.3);
  }

  /* 형광펜 스타일 (pending 상태) */
  .highlight {
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

  /* 컨펌된 수정 (형광펜 제거) */
  .highlight-confirmed {
    background: none;
    border-bottom: none;
    padding: 0;
  }

  /* 스크롤바 */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
`;

const Footer = styled.div`
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

const PendingEditsCount = styled.div`
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

// 수정 이력 모달
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 200000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalContent = styled.div`
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

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const EditInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const InfoRow = styled.div`
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

const TextComparison = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ComparisonBox = styled.div`
  padding: 12px;
  border-radius: 8px;
  background: ${props => props.$type === 'old'
    ? 'rgba(255, 87, 87, 0.1)'
    : 'rgba(46, 213, 115, 0.1)'};
  border: 1px solid ${props => props.$type === 'old'
    ? 'rgba(255, 87, 87, 0.3)'
    : 'rgba(46, 213, 115, 0.3)'};
`;

const ComparisonLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.$type === 'old' ? '#ff5757' : '#2ed573'};
  margin-bottom: 8px;
`;

const ComparisonText = styled.div`
  color: #e0e0e0;
  line-height: 1.6;
  word-break: break-word;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

const ConfirmButton = styled.button`
  flex: 1;
  background: linear-gradient(135deg, #2ed573, #26bf62);
  border: none;
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(46, 213, 115, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RejectButton = styled.button`
  flex: 1;
  background: rgba(255, 87, 87, 0.15);
  border: 1px solid rgba(255, 87, 87, 0.3);
  color: #ff5757;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    background: rgba(255, 87, 87, 0.25);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CollaborativeDocumentEditor = ({
  chatRoomId,
  currentUserId,
  currentUserName,
  isManager, // 방 매니저 여부
  canEdit, // 편집 권한 여부
  showToast,
  onClose,
  onLoadFromShared
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingEdits, setPendingEdits] = useState([]);
  const [selectedEdit, setSelectedEdit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const contentRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Firestore 실시간 구독 - 문서 및 편집 이력
  useEffect(() => {
    if (!chatRoomId) return;

    const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');

    // 문서 구독
    const unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title || '');
        setContent(data.content || '');

        // contentEditable 영역 업데이트
        if (contentRef.current && data.content) {
          contentRef.current.innerHTML = data.content;
        }
      }
    });

    // 편집 이력 구독 (pending 상태만)
    const editsRef = collection(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc', 'editHistory');
    const unsubscribeEdits = onSnapshot(editsRef, (snapshot) => {
      const edits = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'pending') {
          edits.push({ id: doc.id, ...data });
        }
      });
      setPendingEdits(edits);
    });

    return () => {
      unsubscribeDoc();
      unsubscribeEdits();
    };
  }, [chatRoomId]);

  // 디바운스 저장 (500ms)
  const debouncedSave = useCallback((newContent) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
        await setDoc(docRef, {
          title,
          content: newContent,
          lastEditedBy: currentUserId,
          lastEditedByName: currentUserName,
          lastEditedAt: serverTimestamp(),
          version: (await getDoc(docRef)).data()?.version || 0 + 1
        }, { merge: true });
      } catch (error) {
        console.error('문서 저장 실패:', error);
      }
    }, 500);
  }, [chatRoomId, title, currentUserId, currentUserName]);

  // 텍스트 선택 추적
  const [lastSelection, setLastSelection] = useState(null);

  // 선택 영역 추적 (드래그할 때)
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      if (selectedText.trim() && contentRef.current?.contains(range.commonAncestorContainer)) {
        setLastSelection({
          range: range.cloneRange(),
          text: selectedText
        });
      }
    }
  }, []);

  // 선택 이벤트 리스너 등록
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // contentEditable 변경 핸들러 (형광펜 표시 로직 포함)
  const handleContentChange = useCallback(async () => {
    if (!contentRef.current || !canEdit) return;

    const selection = window.getSelection();

    // 선택된 텍스트가 있고, 변경이 발생한 경우
    if (lastSelection && lastSelection.text) {
      const oldText = lastSelection.text;
      const range = lastSelection.range;

      try {
        // 선택 영역의 새로운 텍스트 가져오기
        const newText = selection.toString() || contentRef.current.textContent;

        // 변경 사항이 있으면 형광펜 표시
        if (oldText !== newText) {
          // Firestore에 편집 이력 저장
          const editHistoryRef = collection(
            db,
            'chatRooms',
            chatRoomId,
            'sharedDocument',
            'currentDoc',
            'editHistory'
          );

          const editDoc = await addDoc(editHistoryRef, {
            editedBy: currentUserId,
            editedByName: currentUserName,
            editedAt: serverTimestamp(),
            oldText: oldText,
            newText: newText,
            status: 'pending'
          });

          // 선택 영역을 형광펜으로 표시
          if (range) {
            const span = document.createElement('span');
            span.className = 'highlight';
            span.dataset.editId = editDoc.id;

            try {
              range.surroundContents(span);
            } catch (e) {
              // surroundContents가 실패하면 수동으로 처리
              console.warn('형광펜 표시 실패:', e);
            }
          }

          // 선택 해제
          selection.removeAllRanges();
          setLastSelection(null);
        }
      } catch (error) {
        console.error('편집 이력 저장 실패:', error);
      }
    }

    // 전체 콘텐츠 저장 (디바운싱)
    const newContent = contentRef.current.innerHTML;
    setContent(newContent);
    debouncedSave(newContent);
  }, [canEdit, debouncedSave, lastSelection, chatRoomId, currentUserId, currentUserName]);

  // 형광펜 클릭 핸들러
  const handleHighlightClick = useCallback((editId) => {
    const edit = pendingEdits.find(e => e.id === editId);
    if (edit) {
      setSelectedEdit(edit);
      setShowEditModal(true);
    }
  }, [pendingEdits]);

  // 컨펌 핸들러 (매니저만)
  const handleConfirmEdit = useCallback(async () => {
    if (!isManager || !selectedEdit) return;

    try {
      const editRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc', 'editHistory', selectedEdit.id);
      await updateDoc(editRef, {
        status: 'confirmed',
        confirmedBy: currentUserId,
        confirmedAt: serverTimestamp()
      });

      // 형광펜 제거
      if (contentRef.current) {
        const highlights = contentRef.current.querySelectorAll(`[data-edit-id="${selectedEdit.id}"]`);
        highlights.forEach(el => {
          el.classList.remove('highlight');
          el.classList.add('highlight-confirmed');
          el.removeAttribute('data-edit-id');
        });
      }

      showToast?.('수정이 승인되었습니다');
      setShowEditModal(false);
      setSelectedEdit(null);
    } catch (error) {
      console.error('승인 실패:', error);
      showToast?.('승인에 실패했습니다');
    }
  }, [isManager, selectedEdit, chatRoomId, currentUserId, showToast]);

  // 거부 핸들러 (매니저만)
  const handleRejectEdit = useCallback(async () => {
    if (!isManager || !selectedEdit) return;

    try {
      const editRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc', 'editHistory', selectedEdit.id);
      await deleteDoc(editRef);

      // 형광펜 제거하고 원문 복원
      if (contentRef.current) {
        const highlights = contentRef.current.querySelectorAll(`[data-edit-id="${selectedEdit.id}"]`);
        highlights.forEach(el => {
          el.textContent = selectedEdit.oldText;
          el.classList.remove('highlight');
          el.removeAttribute('data-edit-id');
        });
      }

      showToast?.('수정이 거부되었습니다');
      setShowEditModal(false);
      setSelectedEdit(null);
    } catch (error) {
      console.error('거부 실패:', error);
      showToast?.('거부에 실패했습니다');
    }
  }, [isManager, selectedEdit, chatRoomId, showToast]);

  // 권한 타입 결정
  const permissionType = isManager ? 'manager' : canEdit ? 'editor' : 'viewer';
  const permissionLabel = isManager ? '매니저' : canEdit ? '편집자' : '읽기 전용';
  const PermissionIcon = isManager ? Lock : canEdit ? Users : Info;

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
              disabled={!canEdit}
            />
          )}
        </HeaderLeft>

        <HeaderRight onClick={(e) => e.stopPropagation()}>
          <PermissionBadge $type={permissionType}>
            <PermissionIcon size={14} />
            {permissionLabel}
          </PermissionBadge>

          {onClose && (
            <IconButton onClick={onClose} title="닫기">
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
          {onLoadFromShared && canEdit && (
            <LoadButton onClick={onLoadFromShared} title="공유 폴더에서 불러오기">
              <FolderOpen size={14} />
              불러오기
            </LoadButton>
          )}

          {pendingEdits.length > 0 && (
            <PendingEditsCount title="대기 중인 수정 사항">
              <Info size={14} />
              {pendingEdits.length}개 수정 대기중
            </PendingEditsCount>
          )}

          {!canEdit && (
            <span style={{ color: '#888', fontSize: '12px' }}>
              • 읽기 전용 모드
            </span>
          )}
        </Toolbar>

        {/* contentEditable 영역 */}
        <ContentEditableArea
          ref={contentRef}
          contentEditable={canEdit}
          suppressContentEditableWarning
          onInput={handleContentChange}
          onClick={(e) => {
            const editId = e.target.dataset.editId;
            if (editId) {
              handleHighlightClick(editId);
            }
          }}
        >
          {!content && <span style={{ color: '#666' }}>문서 내용을 입력하세요...</span>}
        </ContentEditableArea>

        {/* 하단 정보 */}
        <Footer>
          <span>{content.replace(/<[^>]*>/g, '').length} 글자</span>
          <span>실시간 협업 활성화</span>
        </Footer>
      </EditorContent>

      {/* 수정 이력 모달 */}
      {showEditModal && selectedEdit && (
        <Modal onClick={() => setShowEditModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>수정 내용 확인</ModalTitle>
              <IconButton onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </IconButton>
            </ModalHeader>

            <ModalBody>
              <EditInfo>
                <InfoRow>
                  <strong>수정자:</strong> {selectedEdit.editedByName}
                </InfoRow>
                <InfoRow>
                  <strong>수정 시각:</strong> {selectedEdit.editedAt?.toDate?.().toLocaleString('ko-KR')}
                </InfoRow>
              </EditInfo>

              <TextComparison>
                <ComparisonBox $type="old">
                  <ComparisonLabel $type="old">수정 전</ComparisonLabel>
                  <ComparisonText>{selectedEdit.oldText || '(없음)'}</ComparisonText>
                </ComparisonBox>

                <ComparisonBox $type="new">
                  <ComparisonLabel $type="new">수정 후</ComparisonLabel>
                  <ComparisonText>{selectedEdit.newText}</ComparisonText>
                </ComparisonBox>
              </TextComparison>

              {isManager && (
                <ModalActions>
                  <ConfirmButton onClick={handleConfirmEdit}>
                    <Check size={18} />
                    승인
                  </ConfirmButton>
                  <RejectButton onClick={handleRejectEdit}>
                    <XCircle size={18} />
                    거부
                  </RejectButton>
                </ModalActions>
              )}

              {!isManager && (
                <div style={{ padding: '12px', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px', marginTop: '12px' }}>
                  <span style={{ color: '#ffc107', fontSize: '13px' }}>
                    매니저만 승인/거부할 수 있습니다
                  </span>
                </div>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </EditorContainer>
  );
};

export default CollaborativeDocumentEditor;
