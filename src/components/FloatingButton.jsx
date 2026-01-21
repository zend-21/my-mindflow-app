// src/components/FloatingButton.jsx

import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components'; // 'css' import 추가
import { fadeInUp } from '../styles.js';

// --- (추가) 가장자리에서 퍼져나가는 'Ping' 애니메이션 ---
const pingAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.5); /* 1.8배까지 커짐 */
    opacity: 0; /* 사라짐 */
  }
`;

const verticalShake = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-4px); /* 위로 4px */
  }
  75% {
    transform: translateY(4px); /* 아래로 4px */
  }
`;

const NoteIconContainer = styled.div`
    position: relative;
    width: 70px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const NoteSvgImg = styled.img`
    width: 70px;
    height: 70px;
    filter: drop-shadow(0 2px 4px rgba(15, 35, 50, 0.3));
    pointer-events: none;
`;

const PlusCircleIcon = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, calc(-50% + 0px));
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #4a90e2, #667eea);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    font-weight: bold;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    border: 2px solid white;
    line-height: 1;

    &::before {
        content: '+';
        display: block;
        margin-top: 0px;
        margin-left: 1px;
    }
`;

const FloatingButtonContainer = styled.div`
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: transparent;
    color: white;
    font-size: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    border: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);

    /* fixed 포지션으로 변경하여 스크롤 시 떨림 방지 */
    position: fixed;
    bottom: 90px;
    right: 24px;
    z-index: 1000;

    user-select: none;
    touch-action: none;

    /* GPU 가속으로 모바일 WebView 렌더링 성능 향상 */
    will-change: transform;
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;

    animation: ${fadeInUp} 0.6s ease forwards;
    animation-delay: 0.5s;

    ${props => props.$isDragging && `
        animation: none !important;
        transform: translateZ(0) translateY(${props.$offsetY}px) !important;
    `}

    ${props => !props.$isDragging && props.$hasBeenDragged && `
        animation: none !important;
        transform: translateZ(0) translateY(${props.$offsetY}px);
        transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
    `}

    &:active {
        cursor: grabbing;
    }

    & > span {
        position: relative;
        z-index: 1002;
        display: inline-block;
    }

`;

const LONG_PRESS_DURATION = 500; // 0.5초
const MAX_DRAG_UP = -100;
const MIN_DRAG_DOWN = 0;
const DRAG_THRESHOLD = 10; 

const FloatingButton = ({ activeTab, onClick }) => {
    const [offsetY, setOffsetY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [hasBeenDragged, setHasBeenDragged] = useState(false); // ★ 드래그 로직을 위해 이 상태를 다시 사용합니다.

    const timerRef = useRef(null);
    const dragStartRef = useRef({ y: 0, initialOffset: 0 });
    const isLongPressSuccessful = useRef(false);
    const containerRef = useRef(null);

    // ★ (추가) rAF 조절을 위한 Ref 2개
    const rafRef = useRef(null); // requestAnimationFrame ID 저장용
    const latestDragY = useRef(0); // rAF 내부에서 사용할 최신 Y좌표 저장용

    const handlePointerDown = (e) => {
        e.stopPropagation();

        clearTimeout(timerRef.current);
        isLongPressSuccessful.current = false;
        
        try {
            e.target.setPointerCapture(e.pointerId);
        } catch (error) { /* 무시 */ }
        
        dragStartRef.current = { 
            y: e.clientY, 
            initialOffset: offsetY 
        };
        
        // ★ (추가) 드래그 시작 시, 최신 Y좌표 Ref를 현재 state와 동기화
        latestDragY.current = offsetY;

        timerRef.current = setTimeout(() => {
            isLongPressSuccessful.current = true;
            setIsDragging(true); 
            setHasBeenDragged(true); // ★ CSS가 작동하려면 이 플래그가 반드시 필요합니다.
        }, LONG_PRESS_DURATION);
    };

    const handlePointerMove = (e) => {
        // 1. 새 좌표 계산
        const deltaY = e.clientY - dragStartRef.current.y;
        let newY = dragStartRef.current.initialOffset + deltaY; // 'let'으로 변경하여 값 수정이 가능하도록 함

        // ★★★ 1-A. 드래그 모드 즉시 진입 로직 (클릭/드래그 구분) ★★★
        if (!isLongPressSuccessful.current && Math.abs(deltaY) > DRAG_THRESHOLD) {
            clearTimeout(timerRef.current);
            isLongPressSuccessful.current = true;
            setIsDragging(true); 
            setHasBeenDragged(true); 
        }

        if (!isLongPressSuccessful.current) {
            return;
        }

        // ★★★ 1-B. [핵심 수정]: 실시간으로 이동 범위를 제한(Clamping)합니다. ★★★
        // 상한 제한: newY가 MAX_DRAG_UP(-100)보다 작아지면(-101, -102 등) MAX_DRAG_UP으로 고정
        if (newY < MAX_DRAG_UP) {
            newY = MAX_DRAG_UP;
        } 
        // 하한 제한: newY가 MIN_DRAG_DOWN(0)보다 커지면(1, 2 등) MIN_DRAG_DOWN으로 고정
        else if (newY > MIN_DRAG_DOWN) { 
            newY = MIN_DRAG_DOWN;
        }

        latestDragY.current = newY; // 실시간 제한된 newY 값을 Ref에 저장

        // 2. ★ 이미 rAF가 예약되어 있다면, 추가 예약(state 업데이트)을 하지 않고 반환
        if (rafRef.current) {
            return;
        }
        
        // 3. ★ rAF를 예약하여 다음 프레임에 딱 한 번만 state를 업데이트
        rafRef.current = requestAnimationFrame(() => {
            setOffsetY(latestDragY.current);
            rafRef.current = null;
        });
    };

    const handlePointerUp = (e) => {
        e.stopPropagation();
        
        // ... (생략: rAF 취소 및 타이머 정리)
        
        clearTimeout(timerRef.current);

        try {
            e.target.releasePointerCapture(e.pointerId);
        } catch (error) { /* 무시 */ }

        // isLongPressSuccessful.current가 true였으면 (길게 눌렀거나, 10px 이상 움직였으면)
        if (isLongPressSuccessful.current) { 
            // 이 블록은 드래그가 끝났을 때만 실행됩니다.
            setIsDragging(false); 

            const finalY = latestDragY.current;
            
            setOffsetY(() => {
                 if (finalY < MAX_DRAG_UP) {
                    return MAX_DRAG_UP;
                } else if (finalY > MIN_DRAG_DOWN) {
                    return MIN_DRAG_DOWN;
                }
                return finalY; 
            });
        } else {
            // isLongPressSuccessful.current가 false였으면 '클릭'으로 간주합니다.
            // (짧게 터치했거나, 500ms 안에 10px 미만 움직임)
            if (onClick) {
                onClick();
            }
        }
        
        isLongPressSuccessful.current = false;
    };

    // 탭 변경 시 위치 리셋
    useEffect(() => {
        setOffsetY(0); // ★ 위치만 리셋합니다.
        // setHasBeenDragged(false); // ★★★ 이 줄을 반드시 삭제(또는 주석 처리)해야 리셋이 작동합니다.
    }, [activeTab]);

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
            clearTimeout(timerRef.current);
            // ★ (추가) 언마운트 시 예약된 rAF도 취소
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    // secret, chat 탭에서는 FloatingButton 숨김
    if (activeTab === 'secret' || activeTab === 'chat') {
        return null;
    }

    return (
        <FloatingButtonContainer
            ref={containerRef}
            role="button"
            tabIndex="0"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onContextMenu={(e) => e.preventDefault()}
            draggable="false"
            $offsetY={offsetY}
            $isDragging={isDragging}
            $hasBeenDragged={hasBeenDragged} // ★ CSS를 위해 이 prop이 반드시 필요합니다.
        >
            <NoteIconContainer>
                <NoteSvgImg
                    src="/images/memo/symbol-2444431.svg"
                    alt="메모 아이콘"
                />
                <PlusCircleIcon />
            </NoteIconContainer>
        </FloatingButtonContainer>
    );
};

export default FloatingButton;