// src/modules/calendar/CalendarEditorModal.jsx
import React, { useState, useRef, useEffect, Fragment } from "react";
import styled, { keyframes } from "styled-components";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Portal from '../../components/Portal';

/* 애니메이션 */
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;
const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

/* 취소 버튼 */
const CancelButton = styled.button`
  background: #333842;
  color: #e0e0e0;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 14px;
  cursor: pointer;
  margin-right: 8px;

  &:focus {
    outline: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(150, 160, 170, 0.6); /* 회색 그림자 효과 */
  }
`;

/* 확인 모달 오버레이 */
const ConfirmOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 11000;
  animation: ${fadeIn} 0.2s ease-out;
`;

/* 확인 모달 박스 */
const ConfirmModalBox = styled.div`
  background: #2a2d35;
  border-radius: 12px;
  padding: 24px 30px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.3);
  animation: ${slideUp} 0.2s cubic-bezier(0.2, 0, 0, 1);
  width: 90vw;
  max-width: 350px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

/* 확인 모달 메시지 */
const ConfirmMessage = styled.p`
  font-size: 16px;
  color: #e0e0e0;
  margin: 0;
  line-height: 1.5;
  text-align: center;
  word-break: keep-all;
`;

/* 확인 모달 버튼 래퍼 */
const ConfirmButtonWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  & > button {
    flex: 1;
  }
`;

/* 오버레이 (모달 화면 중앙) */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;   /* 세로 중앙 정렬 */
  z-index: 10000;
  animation: ${fadeIn} 0.18s ease-out;
`;

/* 모달 본체 */
const ModalContent = styled.div`
  background: #2a2d35;
  border-radius: 16px;
  width: 95vw;
  height: 97vh;      /* 높이도 약간 줄임 */
  display: flex;
  flex-direction: column;
  padding: 14px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  animation: ${slideUp} 0.22s ease-out;   
    
    /* 가로 모드일 때 padding-bottom을 줄여 공간 확보 */
    @media (orientation: landscape) {
        padding-bottom: 10px;
    }

    /* ✅ PC 화면일 때 (768px 이상) */
    @media (min-width: 768px) {
        max-width: 420px;   /* PC에서 폭 제한 */
        min-height: 70vh;   /* PC에서 조금 더 여유 */
        border-radius: 20px; /* PC에선 더 부드럽게 */
    }

    /* ✅ 큰 데스크탑 화면일 때 */
    @media (min-width: 1200px) {
        max-width: 480px;
    }

    /* ✅ 아주 큰 데스크탑 화면일 때 */
    @media (min-width: 1900px) {
        max-width: 530px;
    }
`;

/* 헤더 전체 */
const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
`;

/* 첫 줄 (날짜 텍스트) */
const TitleRow = styled.div`
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  color: #e0e0e0;
`;

/* 버튼 행 (30:40:30 분할) */
const ButtonRow = styled.div`
  display: grid;
  grid-template-columns: 30% 40% 30%;
  align-items: center;
  width: 100%;
`;

/* 왼쪽: 되돌리기/다시실행 */
const LeftWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 2px;     /* 버튼 간격 최소화 */
  overflow: hidden; /* 혹시 넘치면 잘리게 */
`;

/* 중앙: 취소/저장 */
const CenterWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
`;

/* 오른쪽: 자판숨김 */
const RightWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
  overflow: hidden;   /* 셀 영역을 벗어나지 않도록 */
`;

/* 저장/수정 버튼 */
const SaveButton = styled.button`
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: #3b78c4;
  }

  &:disabled {
    background: #a0aec0;   /* 회색 배경 */
    cursor: not-allowed;   /* 비활성 커서 */
    opacity: 0.6;          /* 반투명 효과 */
  }

  /* 마우스 클릭 등 일반 포커스는 테두리 제거 */
  &:focus {
    outline: none;
  }
  
  /* 키보드 접근 시에는 커스텀 스타일 적용 */
  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.6); /* 파란색 그림자 효과 */
  }
`;

const HistoryButton = styled.button`
  background: transparent;
  border: none;
  font-size: 22px;    /* 크기 유지하되 */
  cursor: pointer;
  padding: 4px 6px;   /* 내부 여백 최소화 */
  color: #e0e0e0;     /* 밝은 색상으로 변경 */

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  /* ▼▼▼ 추가된 포커스 스타일 ▼▼▼ */
  &:focus {
    outline: none;
  }
  &:focus-visible {
    box-shadow: 0 0 0 2px rgba(150, 160, 170, 0.7);
  }
`;

/* 자판 숨김 버튼 */
const HideKeyboardButton = styled.button`
  background: #333842;
  color: #e0e0e0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;

  .material-icons {
    font-size: 16px;
  }

  &:hover {
    background-color: #3d424d;
  }
`;

/* 본문 입력창 */
const Textarea = styled.textarea`
  flex: 1;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px;
  font-size: 15px;
  line-height: 1.5;
  resize: none;
  outline: none;
  background: #333842;
  color: #e0e0e0;  /* 실제 입력한 글씨는 밝게 */

  /* 안내문구(placeholder)는 연하게 */
  &::placeholder {
    color: #808080;   /* 연한 회색 */
    opacity: 1;    /* 브라우저마다 흐림 방지 */
  }

  /* 🔽 브라우저 호환용 */
  &::-webkit-input-placeholder {
    color: #808080;
  }
  &:-ms-input-placeholder {
    color: #808080;
  }
  &::-ms-input-placeholder {
    color: #808080;
  }
`;

/* 토스트 */
const Toast = styled.div`
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 40px;
  background: rgba(0,0,0,0.78);
  color: #fff;
  padding: 10px 16px;
  border-radius: 8px;
  z-index: 11000;
  font-size: 14px;
`;

const SmallNote = styled.div`
    font-size: 12px;
    color: #b0b0b0;
    text-align: center;
    /* 헤더와 입력창 사이의 간격을 위해 추가 */
    margin-bottom: 12px;
    line-height: 1.5;
`;

const CalendarEditorModal = ({ isOpen, data, onSave, onClose }) => {
  const [text, setText] = useState(data?.text ?? "");
  const [originalText, setOriginalText] = useState(data?.text ?? "");
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [toast, setToast] = useState(null);
  const textareaRef = useRef(null);
  const lastTapRef = useRef(0);
  const isPristine = text === originalText;
  const isEditingExisting = !!(originalText && originalText.trim().length > 0);
  const [history, setHistory] = useState([data?.text ?? ""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const [isClosing, setIsClosing] = useState(false);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setText(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setText(history[newIndex]);
    }
  };

  // 안전한 date 객체
  const modalDate = data?.date ? new Date(data.date) : null;

  useEffect(() => {
    if (isOpen) {
      setText(data?.text ?? "");
      setOriginalText(data?.text ?? "");
      setToast(null);
      setIsKeyboardActive(false);
      setTimeout(() => textareaRef.current?.blur(), 0);
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const doSaveOrClose = () => {
    if ((text ?? "") === (originalText ?? "")) {
      onClose?.();
      return;
    }

    if (!text || text.trim() === "") {
      // 입력 비운 채 저장 → 취소 처리
      setToast("스케줄을 취소하셨습니다.");
    } else {
      setToast(isEditingExisting ? "스케줄이 수정되었습니다." : "스케줄이 저장되었습니다.");
    }

    onSave?.(modalDate, text);

    setTimeout(() => {
      setToast(null);
      onClose?.();
    }, 900);
  };

  const handleSaveClick = () => {
    if (isClosing || isPristine) return;

    // 확인 모달 띄우기
    const confirmMessage = isEditingExisting
        ? "변경된 대로 수정할까요?"
        : "입력한 내용으로 등록하시겠습니까?";

    setConfirmModalState({
      isOpen: true,
      message: confirmMessage,
      onConfirm: () => {
        // '예'를 선택한 경우
        setIsClosing(true);
        setTimeout(() => {
          doSaveOrClose();
          setIsClosing(false);
        }, 300);
      },
      onCancel: () => {
        // '아니요'를 선택한 경우
        setConfirmModalState({ isOpen: false });
      },
    });
  };

  const handleDoubleClick = () => {
    // 1. 변경사항이 없는 경우: 즉시 모달 닫기
    if (isPristine) {
      handleCancelClick();
      return;
    }

    // 2. 변경사항이 있는 경우: 컨펌 모달 띄우기
    const confirmMessage = isEditingExisting
        ? "변경된 내용으로 수정시겠습니까?"
        : "입력한 내용으로 등록하시겠습니까?";

    setConfirmModalState({
      isOpen: true,
      message: confirmMessage,
      onConfirm: () => {
        // '예'를 선택한 경우
        setIsClosing(true);
        setTimeout(() => {
          doSaveOrClose(); // 수정 또는 등록 로직 실행
          setIsClosing(false);
        }, 300);
      },
      onCancel: () => {
        // '아니요'를 선택한 경우
        setConfirmModalState({ isOpen: false });
      },
    });
  };

  const handleHideKeyboard = () => {
    textareaRef.current?.blur();
  };

  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  const handleCancelClick = () => {
      // 중복 실행 방지
      if (isClosing) return;

      if (!isPristine) {
        setConfirmModalState({
          isOpen: true,
          message: "변경사항을 저장하지 않고 닫으시겠습니까?",
          onConfirm: () => {
            setIsClosing(true);
            setTimeout(() => {
              onClose();
              setIsClosing(false); // 상태 초기화
            }, 300); // 확인 모달에서 '예'를 눌러도 0.3초 지연
          },
        });
      } else {
        // 내용 변경이 없을 때 (닫기 버튼, 빈 화면 더블탭)
        setIsClosing(true);
        setTimeout(() => {
          onClose();
          setIsClosing(false); // 상태 초기화
        }, 300); // 0.3초 지연
      }
    };

  return (
    <Portal>
    <Fragment>
      <Overlay>
        <ModalContent>
          <Header>
            {/* 날짜 */}
            <TitleRow>
              {modalDate
                ? `${format(modalDate, "yyyy년 M월 d일", { locale: ko })} 스케줄 등록창`
                : "스케줄 등록창"}
            </TitleRow>

            {/* 등록 버튼 + 자판 숨김 */}
            <ButtonRow>
              {/* 왼쪽: 되돌리기/다시실행 */}
              <LeftWrapper>
                <HistoryButton onClick={handleUndo} disabled={!canUndo}>
                  <span className="material-icons">undo</span>
                </HistoryButton>
                <HistoryButton onClick={handleRedo} disabled={!canRedo}>
                  <span className="material-icons">redo</span>
                </HistoryButton>
              </LeftWrapper>

              {/* 중앙: 취소/등록 */}
              <CenterWrapper>
                <CancelButton onClick={handleCancelClick}>
                  {isPristine ? '닫기' : '취소'}
                </CancelButton>
                <SaveButton onClick={handleSaveClick} disabled={isPristine}>
                  {isEditingExisting ? '수정' : '등록'}
                </SaveButton>
              </CenterWrapper>

              {/* 오른쪽: 자판숨김 */}
              <RightWrapper>
                {isKeyboardActive && (
                  <HideKeyboardButton onClick={handleHideKeyboard}>
                    <span className="material-icons">keyboard_hide</span>
                    숨김
                  </HideKeyboardButton>
                )}
              </RightWrapper>
            </ButtonRow>
          </Header>

          {data?.createdAt && (
              <SmallNote>
                  · 최초 등록일: {format(new Date(data.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                  {data?.updatedAt && data.updatedAt !== data.createdAt && (
                      <>
                          <br />
                          · 최종 수정일: {format(new Date(data.updatedAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                      </>
                  )}
              </SmallNote>
          )}

          {/* 본문 입력 */}
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              const newText = e.target.value;
              setText(newText);

              // 현재까지의 히스토리만 유지 (Redo 스택은 버림)
              let newHistory = history.slice(0, historyIndex + 1);

              // 항상 새 값을 push (같은 값이라도 기록 유지)
              newHistory.push(newText);

              // 최대 10개까지만 유지
              if (newHistory.length > 500) {
                newHistory.shift();
              }

              setHistory(newHistory);
              setHistoryIndex(newHistory.length - 1);
            }}
            onFocus={() => setIsKeyboardActive(true)}
            onBlur={() => setIsKeyboardActive(false)}
            onDoubleClick={handleDoubleClick}
            placeholder={`스케줄을 입력하세요...\n\n입력창을 두 번 탭하여 등록(수정)하거나 창을 닫을 수 있습니다.`}
          />
        </ModalContent>
      </Overlay>

      {confirmModalState.isOpen && (
        <ConfirmOverlay>
          <ConfirmModalBox onClick={e => e.stopPropagation()}>
            <ConfirmMessage>{confirmModalState.message}</ConfirmMessage>
            <ConfirmButtonWrapper>
              <CancelButton onClick={() => setConfirmModalState({ isOpen: false })}>
                아니요
              </CancelButton>
              <SaveButton onClick={() => {
                confirmModalState.onConfirm();
                setConfirmModalState({ isOpen: false });
              }}>
                예
              </SaveButton>
            </ConfirmButtonWrapper>
          </ConfirmModalBox>
        </ConfirmOverlay>
      )}

      {toast && <Toast>{toast}</Toast>}
    </Fragment>
    </Portal>
  );
};

export default CalendarEditorModal;
