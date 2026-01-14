// src/components/MemoDetailModal.jsx

import React, { useState, useEffect, Fragment, useRef } from 'react';
import Portal from './Portal';
import RichTextEditor from './RichTextEditor';
// 🗑️ COLLABORATION REMOVED - 협업방 기능 제거됨
// import RoomSettingsModal from './collaboration/RoomSettingsModal';
// import CollaborationRoom from './collaboration/CollaborationRoom';
// import { createCollaborationRoom, checkMemoSharedStatus } from '../services/collaborationRoomService';
import { useMemoFolders } from '../hooks/useMemoFolders';
import * as S from './MemoDetailModal.styles';
import { sanitizeHtml } from '../utils/sanitizeHtml';

// ========================================
// ✨ 읽기/편집 모드 분리 구현 (메모 상세보기)
// ========================================
//
// 📌 주요 기능:
// 1. 읽기 모드 (기본): 다크 테마의 책/노트 스타일 UI
//    - 더블클릭으로 편집 모드 전환
//    - 텍스트 선택 및 복사 가능 (user-select: text)
//    - 스와이프로 메모 간 이동 가능
//    - 상단 버튼: 닫기, 중요도 뱃지, 공유 뱃지, 편집 버튼
//
// 2. 편집 모드: 기존 편집 UI 유지
//    - 중요도 토글은 상태만 변경 (저장 버튼 눌러야 실제 저장)
//    - 취소 시 내용과 중요도 모두 원본으로 복원
//    - 저장 시 읽기 모드로 전환 (모달은 열린 채로 유지)
//    - 스와이프 비활성화
//
// 3. 상태 관리:
//    - isEditMode: 읽기/편집 모드 전환
//    - originalIsImportant: 취소 시 복원용 원본 중요도
//    - isPristine: 내용 또는 중요도 변경 여부 체크
//
// 4. 이벤트 처리:
//    - onDoubleClick: 본문 더블클릭으로 편집 모드 전환
//    - 텍스트 선택 시 더블클릭 무시 (복사 기능 유지)
//    - 편집 모드에서 스와이프 비활성화
//
// 📝 TODO: 스케줄 문서, 시크릿 문서에도 동일하게 적용 예정
// ========================================


const MemoDetailModal = ({
    isOpen,
    memo,
    memos = [], // 전체 메모 목록 (스와이프 네비게이션용)
    onSave,
    onDelete,
    onClose,
    onCancel,
    onUpdateMemoFolder,
    showToast,
    onNavigate, // 다른 메모로 이동 시 호출되는 콜백
    folderSyncContext, // 폴더 동기화 컨텍스트
    isFrozen = false // 프리즈된 문서 여부
}) => {
    const [editedContent, setEditedContent] = useState('');
    const [isImportant, setIsImportant] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [selectedFolderId, setSelectedFolderId] = useState(null); // 폴더 선택

    // ✨ 읽기/편집 모드 상태
    const [isEditMode, setIsEditMode] = useState(false);

    // ✨ 더블탭 감지 상태
    const [lastTap, setLastTap] = useState(0);

    // ✨ 원본 중요도 상태 (취소 시 복원용)
    const [originalIsImportant, setOriginalIsImportant] = useState(false);

    // 스와이프 상태
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [slideDirection, setSlideDirection] = useState(null); // 'left' | 'right' | null

    // 폴더 목록 가져오기
    const { folders } = useMemoFolders(folderSyncContext);
    // 🗑️ COLLABORATION REMOVED - 협업방 관련 state 제거됨
    // const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);
    // const [isCollaborationRoomOpen, setIsCollaborationRoomOpen] = useState(false);
    // const [currentRoomId, setCurrentRoomId] = useState(null);
    const [isShared, setIsShared] = useState(false); // 공유 상태 (폴더 이동용)
    // const [sharedRoom, setSharedRoom] = useState(null); // 공유된 방 정보
    // ★★★ 추가: 키보드 활성화 상태를 관리하는 state ★★★
    const [isKeyboardActive, setIsKeyboardActive] = useState(false);

    const [confirmModalState, setConfirmModalState] = useState({
        isOpen: false,
        message: '',
        onConfirm: () => {},
    });

    const [toastMessage, setToastMessage] = useState(null);
    const textareaRef = useRef(null);
    const modalContentRef = useRef(null);
    const readModeContainerRef = useRef(null);

    // 이미지 뷰어 상태
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [viewerImageSrc, setViewerImageSrc] = useState('');

    useEffect(() => {
        if (isOpen && memo) {
            // 모달이 처음 열리거나 다른 메모로 변경될 때만 초기화
            setEditedContent(memo.content);
            setIsImportant(memo.isImportant);
            setOriginalIsImportant(memo.isImportant); // 원본 중요도 저장
            setSelectedFolderId(memo.folderId || null); // 폴더 ID 초기화
            const initialHistory = [memo.content];
            setHistory(initialHistory);
            setHistoryIndex(0);

            closeConfirmModal();
            setToastMessage(null);

            // ✨ 읽기 모드로 초기화 (편집 모드가 아닐 때만)
            if (!isEditMode) {
                setIsEditMode(false);
            }
            setLastTap(0);

            if (textareaRef.current) {
                textareaRef.current.blur();
            }
            // ★★★ 추가: 모달이 닫힐 때 키보드 상태를 초기화 ★★★
            setIsKeyboardActive(false);

            // 공유 상태 확인 (folderId 기반)
            setIsShared(memo.folderId === 'shared');

            // 🗑️ COLLABORATION REMOVED - 협업방 상태 확인 제거됨
            // 협업방 상태 확인 (참고용 기능 - 현재 비활성화)
            // const checkSharedStatus = async () => {
            //     try {
            //         const result = await checkMemoSharedStatus(memo.id);
            //         setSharedRoom(result.room);
            //     } catch (error) {
            //         console.error('공유 상태 확인 오류:', error);
            //         setSharedRoom(null);
            //     }
            // };
            // checkSharedStatus();
        }
    }, [isOpen, memo]);

    // ESC 키로 이미지 뷰어 닫기
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && showImageViewer) {
                handleCloseImageViewer();
            }
        };

        if (showImageViewer) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [showImageViewer]);

    if (!isOpen || !memo) {
        return null;
    }

    const handleContentChange = (html) => {
        // RichTextEditor에서 HTML 문자열을 직접 받음
        const newContent = html;
        setEditedContent(newContent);

        // 히스토리 중간에서 수정한 경우, 이후 히스토리 삭제
        const newHistory = history.slice(0, historyIndex + 1);

        // 마지막 항목과 동일하지 않을 때만 추가
        if (newHistory[newHistory.length - 1] !== newContent) {
            newHistory.push(newContent);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
    };

    const handleDoubleClick = () => {
    if (isPristine) {
        handleCancelClick(); // 변경 없으면 닫기
    } else {
        handleSaveClick();   // 변경 있으면 저장
    }
    };   

    const executeSaveAndShowToast = () => {
        onSave(memo.id, editedContent, isImportant, selectedFolderId);
        setOriginalIsImportant(isImportant); // 저장 후 원본 중요도 업데이트
        setToastMessage("메모를 수정했습니다.");
        setTimeout(() => {
            setToastMessage(null);
            setIsEditMode(false); // 읽기 모드로 전환
        }, 1000);
    };

    const handleSaveClick = () => {
        setConfirmModalState({
            isOpen: true,
            message: "변경된 내용으로 수정하시겠습니까?",
            onConfirm: executeSaveAndShowToast,
        });
    };

    // 내용 또는 중요도가 변경되었는지 확인
    const isPristine = editedContent === memo.content && isImportant === originalIsImportant;

    const handleCancelClick = () => {
        // 읽기 모드에서는 바로 닫기
        if (!isEditMode) {
            onCancel();
            return;
        }

        // 편집 모드에서는 읽기 모드로 전환
        if (!isPristine) {
            setConfirmModalState({
                isOpen: true,
                message: "변경사항을 저장하지 않고 읽기 모드로 돌아가시겠습니까?",
                onConfirm: () => {
                    setEditedContent(memo.content); // 원래 내용으로 복원
                    setIsImportant(originalIsImportant); // 원래 중요도로 복원
                    setIsEditMode(false);
                },
            });
        } else {
            setIsEditMode(false);
        }
    };
    
    const closeConfirmModal = () => {
        setConfirmModalState({
            isOpen: false,
            message: '',
            onConfirm: () => {},
        });
    };
    const handleConfirmAction = () => {
        confirmModalState.onConfirm();
        closeConfirmModal();
    };

    // 이미지 뷰어 핸들러
    const handleImageClick = (imgSrc) => {
        setViewerImageSrc(imgSrc);
        setShowImageViewer(true);
    };

    const handleCloseImageViewer = () => {
        setShowImageViewer(false);
        setViewerImageSrc('');
    };

    // 스와이프 네비게이션 로직
    const getCurrentMemoIndex = () => {
        if (!memo || memos.length === 0) return -1;
        return memos.findIndex(m => m.id === memo.id);
    };

    const canNavigatePrev = () => {
        const currentIndex = getCurrentMemoIndex();
        return currentIndex > 0;
    };

    const canNavigateNext = () => {
        const currentIndex = getCurrentMemoIndex();
        return currentIndex < memos.length - 1 && currentIndex !== -1;
    };

    const navigateToPrevMemo = () => {
        const currentIndex = getCurrentMemoIndex();
        if (canNavigatePrev()) {
            const prevMemo = memos[currentIndex - 1];
            setSlideDirection('right'); // 오른쪽으로 슬라이드
            // 애니메이션이 완전히 끝난 후(250ms) 내용 변경
            setTimeout(() => {
                onNavigate && onNavigate(prevMemo);
                setSlideDirection(null);
            }, 250);
        }
    };

    const navigateToNextMemo = () => {
        const currentIndex = getCurrentMemoIndex();
        if (canNavigateNext()) {
            const nextMemo = memos[currentIndex + 1];
            setSlideDirection('left'); // 왼쪽으로 슬라이드
            // 애니메이션이 완전히 끝난 후(250ms) 내용 변경
            setTimeout(() => {
                onNavigate && onNavigate(nextMemo);
                setSlideDirection(null);
            }, 250);
        }
    };

    // ✨ 더블클릭/더블탭으로 편집 모드 전환
    const handleDoubleTap = () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        // 텍스트 선택이 발생한 경우 무시 (복사를 위한 텍스트 선택 허용)
        if (window.getSelection && window.getSelection().toString().length > 0) {
            setLastTap(0);
            return;
        }

        if (lastTap && (now - lastTap < DOUBLE_TAP_DELAY)) {
            // 더블탭 감지됨
            if (isFrozen) {
                showToast?.('❄️ 대화방에서 편집 중인 문서는 읽기 전용입니다');
                setLastTap(0);
                return;
            }
            setIsEditMode(true);
            setLastTap(0); // 다음 더블탭을 위해 리셋
        } else {
            // 첫 번째 탭 또는 시간 초과
            setLastTap(now);
        }
    };

    // 스와이프 이벤트 핸들러 (읽기 모드에서만 작동)
    const handleTouchStart = (e) => {
        // ✨ 편집 모드에서는 스와이프 비활성화
        if (isEditMode) return;

        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
        // 초기에는 스와이프로 간주하지 않음 (탭일 수도 있으므로)
        setIsSwiping(false);
    };

    const handleTouchMove = (e) => {
        // ✨ 편집 모드에서는 스와이프 비활성화
        if (isEditMode) return;
        if (!touchStart) return;

        const currentTouch = e.targetTouches[0].clientX;
        const diff = currentTouch - touchStart;

        // 좌우로 10px 이상 움직였을 때만 스와이프로 간주
        if (Math.abs(diff) > 10) {
            // 스와이프 시작
            if (!isSwiping) {
                setIsSwiping(true);
            }

            // 이전 메모가 없으면 오른쪽 스와이프 제한
            if (diff > 0 && !canNavigatePrev()) {
                setSwipeOffset(Math.min(diff * 0.2, 50)); // 최대 50px까지만
            }
            // 다음 메모가 없으면 왼쪽 스와이프 제한
            else if (diff < 0 && !canNavigateNext()) {
                setSwipeOffset(Math.max(diff * 0.2, -50)); // 최대 -50px까지만
            }
            // 정상적인 스와이프
            else {
                setSwipeOffset(diff);
            }
        }

        setTouchEnd(currentTouch);
    };

    const handleTouchEnd = () => {
        // ✨ 편집 모드에서는 스와이프 비활성화
        if (isEditMode) return;

        if (!touchStart) {
            setIsSwiping(false);
            setSwipeOffset(0);
            return;
        }

        // 스와이프가 아니라 단순 탭이었다면 (10px 미만 이동)
        if (!isSwiping || !touchEnd || Math.abs(touchStart - touchEnd) < 10) {
            // ✨ 읽기 모드에서 탭 감지 → 더블탭 체크
            handleDoubleTap();

            setIsSwiping(false);
            setSwipeOffset(0);
            setTouchStart(null);
            setTouchEnd(null);
            return;
        }

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && canNavigateNext()) {
            navigateToNextMemo();
        } else if (isRightSwipe && canNavigatePrev()) {
            navigateToPrevMemo();
        }

        setIsSwiping(false);
        setSwipeOffset(0);
        setTouchStart(null);
        setTouchEnd(null);
    };

    const handleImportantToggle = () => {
        const newImportance = !isImportant;
        setIsImportant(newImportance);
        // 중요도 변경은 저장 버튼을 눌러야 저장됨 (편집창은 유지)
    };

    // HTML 형식으로 클립보드에 복사
    const handleCopyContent = async () => {
        try {
            // Clipboard API를 사용하여 HTML과 텍스트 모두 복사
            const htmlContent = editedContent;
            const textContent = editedContent.replace(/<[^>]*>/g, ''); // HTML 태그 제거한 순수 텍스트

            const clipboardItem = new ClipboardItem({
                'text/html': new Blob([htmlContent], { type: 'text/html' }),
                'text/plain': new Blob([textContent], { type: 'text/plain' })
            });

            await navigator.clipboard.write([clipboardItem]);
            setToastMessage('📋 복사되었습니다');
            setTimeout(() => setToastMessage(null), 2000);
        } catch (error) {
            console.error('복사 실패:', error);
            // 폴백: 텍스트만 복사
            try {
                const textContent = editedContent.replace(/<[^>]*>/g, '');
                await navigator.clipboard.writeText(textContent);
                setToastMessage('📋 텍스트가 복사되었습니다');
                setTimeout(() => setToastMessage(null), 2000);
            } catch (fallbackError) {
                setToastMessage('❌ 복사 실패');
                setTimeout(() => setToastMessage(null), 2000);
            }
        }
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setEditedContent(history[newIndex]);
            setHistoryIndex(newIndex);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setEditedContent(history[newIndex]);
            setHistoryIndex(newIndex);
        }
    };

    // ★★★ onFocus와 onBlur 이벤트 핸들러 추가 ★★★
    const handleTextareaFocus = () => {
        setIsKeyboardActive(true);
        if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = textareaRef.current.value.length;
        }
    };

    const handleTextareaBlur = () => {
        setIsKeyboardActive(false);
    };

    // ★★★ 추가: 키보드 숨김 버튼 클릭 핸들러 ★★★
    const handleHideKeyboardClick = () => {
        if (textareaRef.current) {
            textareaRef.current.blur();
        }
    };

    // 공유 버튼 클릭: 확인 모달 표시
    const handleShareClick = () => {
        setConfirmModalState({
            isOpen: true,
            message: '이 문서를 공유 폴더로 이동할까요?',
            onConfirm: () => {
                // 메모를 공유 폴더로 이동
                if (onUpdateMemoFolder) {
                    onUpdateMemoFolder(memo.id, 'shared', true); // savePrevious = true (원래 폴더 정보 저장)
                    setSelectedFolderId('shared'); // UI 업데이트
                    showToast?.('메모가 공유 폴더로 이동되었습니다');
                }
                closeConfirmModal();
            }
        });
    };

    // 공유 해제: 미분류로 이동
    const handleUnshareClick = () => {
        setConfirmModalState({
            isOpen: true,
            message: '이 문서를 미분류 문서로 이동할까요?',
            onConfirm: () => {
                // 메모를 미분류(null)로 이동
                if (onUpdateMemoFolder) {
                    onUpdateMemoFolder(memo.id, null, false); // folderId를 null로 설정
                    setSelectedFolderId(null); // UI 업데이트
                    showToast?.('메모가 미분류 문서로 이동되었습니다');
                }
                closeConfirmModal();
            }
        });
    };

    // 🗑️ COLLABORATION REMOVED - 협업방 함수 제거됨
    // const handleRoomSettingsConfirm = async (settings) => {
    //     try {
    //         const roomId = await createCollaborationRoom(...);
    //         ...
    //     } catch (error) {
    //         console.error('협업방 생성 실패:', error);
    //     }
    // };

    // const handleCloseCollaborationRoom = () => {
    //     setIsCollaborationRoomOpen(false);
    //     setCurrentRoomId(null);
    // };

    // 다음/이전 메모 가져오기
    const getPrevMemo = () => {
        const currentIndex = getCurrentMemoIndex();
        return currentIndex > 0 ? memos[currentIndex - 1] : null;
    };

    const getNextMemo = () => {
        const currentIndex = getCurrentMemoIndex();
        return currentIndex < memos.length - 1 && currentIndex !== -1 ? memos[currentIndex + 1] : null;
    };

    const prevMemo = getPrevMemo();
    const nextMemo = getNextMemo();

    return (
      <Portal>
        <Fragment>
            <S.Overlay>
                {/* 이전 메모 미리보기 (오른쪽에서 대기, 스와이프 시 함께 이동) */}
                {prevMemo && swipeOffset > 0 && (
                    <S.PreviewMemoCard
                        $offset={swipeOffset - window.innerWidth}
                        $isImportant={prevMemo.isImportant}
                    >
                        <S.PreviewContent>
                            {prevMemo.text}
                        </S.PreviewContent>
                    </S.PreviewMemoCard>
                )}

                {/* 다음 메모 미리보기 (왼쪽에서 대기, 스와이프 시 함께 이동) */}
                {nextMemo && swipeOffset < 0 && (
                    <S.PreviewMemoCard
                        $offset={swipeOffset + window.innerWidth}
                        $isImportant={nextMemo.isImportant}
                    >
                        <S.PreviewContent>
                            {nextMemo.text}
                        </S.PreviewContent>
                    </S.PreviewMemoCard>
                )}

                <S.ModalContent
                    ref={modalContentRef}
                    $isImportant={isImportant}
                    $swipeOffset={swipeOffset}
                    $isSwiping={isSwiping}
                    $slideDirection={slideDirection}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* ✨ 읽기 모드 */}
                    {!isEditMode ? (
                        <>
                            {/* 읽기 모드 헤더 - 모든 버튼을 한 줄로 */}
                            <S.ReadModeHeader>
                                <S.ReadModeLeftButtons>
                                    <S.CloseButton onClick={handleCancelClick}>
                                        <span className="material-icons">close</span>
                                    </S.CloseButton>
                                    {isFrozen && (
                                        <S.FrozenBadge>
                                            ❄️ 작업중
                                        </S.FrozenBadge>
                                    )}
                                    {isImportant && (
                                        <S.ImportantBadge $isImportant={isImportant}>
                                            <span className="material-icons">star</span>
                                        </S.ImportantBadge>
                                    )}
                                    {isShared && (
                                        <S.ShareBadge>
                                            <span className="material-icons">share</span>
                                        </S.ShareBadge>
                                    )}
                                </S.ReadModeLeftButtons>
                                <S.ReadModeRightButtons>
                                    <S.ReadModeButton onClick={handleCopyContent}>
                                        <span className="material-icons">content_copy</span>
                                    </S.ReadModeButton>
                                    <S.ReadModeButton onClick={() => {
                                        if (isFrozen) {
                                            showToast?.('❄️ 대화방에서 편집 중인 문서는 읽기 전용입니다');
                                            return;
                                        }
                                        setIsEditMode(true);
                                    }}>
                                        <span className="material-icons">edit</span>
                                    </S.ReadModeButton>
                                </S.ReadModeRightButtons>
                            </S.ReadModeHeader>

                            {/* 날짜 정보 */}
                            <S.DateText>
                                {memo.createdAt && (
                                    <>
                                        최초 등록일: {new Date(memo.createdAt).toLocaleString('ko-KR', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: false
                                        }).replace(/\. /g, '. ').replace(/\.$/, '')}
                                        {memo.updatedAt && memo.updatedAt !== memo.createdAt && ' / '}
                                    </>
                                )}
                                {memo.updatedAt && memo.createdAt && memo.updatedAt !== memo.createdAt && (
                                    <>
                                        최종 수정일: {new Date(memo.updatedAt).toLocaleString('ko-KR', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: false
                                        }).replace(/\. /g, '. ').replace(/\.$/, '')}
                                    </>
                                )}
                            </S.DateText>

                            {/* 읽기 모드 컨텐츠 - HTML 렌더링 */}
                            <S.ReadModeContainer
                                ref={readModeContainerRef}
                                $isImportant={isImportant}
                                onClick={(e) => {
                                    // 이미지 클릭인 경우 이미지 뷰어 열기
                                    if (e.target.tagName === 'IMG') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleImageClick(e.target.src);
                                    }
                                }}
                                onDoubleClick={(e) => {
                                    // 이미지 클릭인 경우 무시
                                    if (e.target.tagName === 'IMG') {
                                        return;
                                    }
                                    // 텍스트 선택이 발생한 경우 무시
                                    if (window.getSelection && window.getSelection().toString().length > 0) {
                                        return;
                                    }
                                    if (isFrozen) {
                                        showToast?.('❄️ 대화방에서 편집 중인 문서는 읽기 전용입니다');
                                        return;
                                    }
                                    setIsEditMode(true);
                                }}
                                onTouchEnd={(e) => {
                                    // 이미지 탭인 경우 무시
                                    if (e.target.tagName === 'IMG') {
                                        return;
                                    }
                                    // 텍스트 선택이 발생한 경우 무시
                                    if (window.getSelection && window.getSelection().toString().length > 0) {
                                        return;
                                    }

                                    const now = Date.now();
                                    const DOUBLE_TAP_DELAY = 300; // 300ms 이내에 두 번 탭하면 더블탭으로 인식

                                    if (now - lastTap < DOUBLE_TAP_DELAY) {
                                        // 더블탭 감지됨 - 편집 모드로 전환
                                        e.preventDefault();
                                        if (isFrozen) {
                                            showToast?.('❄️ 대화방에서 편집 중인 문서는 읽기 전용입니다');
                                            setLastTap(0);
                                            return;
                                        }
                                        setIsEditMode(true);
                                        setLastTap(0); // 리셋
                                    } else {
                                        setLastTap(now);
                                    }
                                }}
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(editedContent) }}
                            />
                        </>
                    ) : (
                        <>
                            {/* ✨ 편집 모드 - 기존 UI */}
                            {/* 1. 새로운 상단 그리드 */}
                            <S.TopGridContainer>
                        {/* 좌측: 빈 공간 */}
                        <S.GridAreaLeft>
                        </S.GridAreaLeft>

                        {/* 중앙: 취소/수정 버튼 */}
                        <S.GridAreaCenter>
                            <S.CancelButton onClick={handleCancelClick}>
                                {isPristine ? '닫기' : '취소'}
                            </S.CancelButton>
                            <S.SaveButton onClick={handleSaveClick} disabled={isPristine}>
                                수정
                            </S.SaveButton>
                        </S.GridAreaCenter>

                        {/* 우측: 자판 숨김 버튼 */}
                        <S.GridAreaRight>
                            {isKeyboardActive && (
                                <S.HideKeyboardButton onClick={handleHideKeyboardClick}>
                                    <span className="material-icons">keyboard_hide</span>
                                    숨김
                                </S.HideKeyboardButton>
                            )}
                        </S.GridAreaRight>
                    </S.TopGridContainer>

                    {/* 2. 새로운 두 번째 줄 - 중요와 공유 */}
                    <S.SecondRowContainer>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '50px', flex: 1 }}>
                            {/* 중요 체크박스 */}
                            <S.ImportantCheckWrapper onClick={handleImportantToggle}>
                                <S.ImportantRadioButton $isImportant={isImportant}>
                                    <S.RadioInnerCircle $isImportant={isImportant} />
                                </S.ImportantRadioButton>
                                중요
                            </S.ImportantCheckWrapper>

                            {/* 폴더명 뱃지 - 폴더가 있을 때만 표시 */}
                            {selectedFolderId && (() => {
                                const currentFolder = folders.find(f => f.id === selectedFolderId);
                                return currentFolder ? (
                                    <S.FolderBadge>
                                        {currentFolder.icon} {currentFolder.name}
                                    </S.FolderBadge>
                                ) : null;
                            })()}
                        </div>

                        {/* 공유 버튼 또는 공유 해제 버튼 */}
                        {isShared ? (
                            <S.ShareButton onClick={handleUnshareClick}>
                                <span className="material-icons">close</span>
                                공유 해제
                            </S.ShareButton>
                        ) : (
                            <S.ShareButton onClick={handleShareClick}>
                                <span className="material-icons">share</span>
                                공유
                            </S.ShareButton>
                        )}
                    </S.SecondRowContainer>

                    {/* 날짜 정보 */}
                    <S.DateText>
                        {memo.createdAt && (
                            <>
                                최초 등록일: {new Date(memo.createdAt).toLocaleString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false
                                }).replace(/\. /g, '. ').replace(/\.$/, '')}
                                {memo.updatedAt && memo.updatedAt !== memo.createdAt && ' / '}
                            </>
                        )}
                        {memo.updatedAt && memo.createdAt && memo.updatedAt !== memo.createdAt && (
                            <>
                                최종 수정일: {new Date(memo.updatedAt).toLocaleString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false
                                }).replace(/\. /g, '. ').replace(/\.$/, '')}
                            </>
                        )}
                    </S.DateText>

                    <RichTextEditor
                        content={editedContent}
                        onChange={handleContentChange}
                        placeholder="메모 내용을 입력하세요..."
                        onFocus={handleTextareaFocus}
                        onBlur={handleTextareaBlur}
                    />
                        </>
                    )}
                </S.ModalContent>
            </S.Overlay>

            {confirmModalState.isOpen && (
                <S.ConfirmOverlay>
                    <S.ConfirmModalBox onClick={e => e.stopPropagation()}>
                        <S.ConfirmMessage>
                            {confirmModalState.message}
                        </S.ConfirmMessage>
                        <S.ConfirmButtonWrapper>
                            <S.CancelButton onClick={closeConfirmModal}>아니요</S.CancelButton>
                            <S.SaveButton onClick={handleConfirmAction}>예</S.SaveButton>
                        </S.ConfirmButtonWrapper>
                    </S.ConfirmModalBox>
                </S.ConfirmOverlay>
            )}

            {toastMessage && (
                <S.ToastOverlay>
                    <S.ToastBox>
                        {toastMessage}
                    </S.ToastBox>
                </S.ToastOverlay>
            )}

            {/* 🗑️ COLLABORATION REMOVED - 협업방 UI 제거됨 */}
            {/* <RoomSettingsModal
                isOpen={isRoomSettingsOpen}
                onClose={() => setIsRoomSettingsOpen(false)}
                onConfirm={handleRoomSettingsConfirm}
                defaultTitle={memo?.content?.substring(0, 50) || '제목 없음'}
            /> */}

            {/* {isCollaborationRoomOpen && currentRoomId && (
                <CollaborationRoom
                    roomId={currentRoomId}
                    onClose={handleCloseCollaborationRoom}
                    showToast={(message) => {
                        setToastMessage(message);
                        setTimeout(() => setToastMessage(null), 2000);
                    }}
                />
            )} */}

            {/* 이미지 뷰어 모달 */}
            {showImageViewer && (
                <S.ImageViewerOverlay onClick={handleCloseImageViewer}>
                    <S.ImageViewerContent onClick={(e) => e.stopPropagation()}>
                        <S.ImageViewerImage src={viewerImageSrc} alt="Full size" />
                        <S.ImageViewerCloseButton onClick={handleCloseImageViewer}>
                            <span className="material-icons">close</span>
                        </S.ImageViewerCloseButton>
                    </S.ImageViewerContent>
                </S.ImageViewerOverlay>
            )}
        </Fragment>
      </Portal>
    );
};

export default MemoDetailModal;