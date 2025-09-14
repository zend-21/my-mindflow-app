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

const DocumentIcon = styled.div`
    position: relative;
    width: 35.5px;
    height: 42px;
    background: white;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    font-weight: 300;
    color: #f5576c;
    padding-top: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    
    /* 텍스트 라인 흉내 (::after 사용) */
    &::after {
        content: '';
        position: absolute;
        left: 5px;
        bottom: 5px;
        right: 5px;
        height: 14px;
        background-image: repeating-linear-gradient(to bottom, #bebebeff 0, #bebebeff 2px, transparent 2px, transparent 6px);
        background-size: 100% 6px;
        z-index: 0; /* + 기호보다 뒤에 위치 */
    }
`;

const PlusIcon = styled.div`
    position: absolute;
    top: 13.5px; // 문서 아이콘 위로 살짝 이동
    left: 9.6px; // 문서 아이콘 오른쪽으로 살짝 이동
    width: 16px;
    height: 16px;
    /* 참고: 버튼 배경색(그라데이션) 대신 가독성을 위해 단색을 사용합니다. */
    background-color: #4a90e2; 
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px; // + 기호 크기
    color: white;
    font-weight: bold;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); // 작은 그림자 추가
    
    &::before {
        content: '+';
        line-height: 1; // 텍스트 중앙 정렬
    }
`;

const FloatingButtonContainer = styled.div`
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f093fb, #f5576c);
    color: white;
    font-size: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    border: none;
    
    /* ★★★ 수정: position을 absolute로 변경하여 앱 컨테이너 내부에 고정 ★★★ */
    position: absolute;
    bottom: 90px;
    right: 24px;
    z-index: 1000;
    
    user-select: none;
    touch-action: none; 
    
    animation: ${fadeInUp} 0.6s ease forwards;
    animation-delay: 0.5s;

    ${props => props.$isDragging && `
        animation: none !important;
        transform: translateY(${props.$offsetY}px) !important;
    `}
    
    ${props => !props.$isDragging && props.$hasBeenDragged && `
        animation: none !important;
        transform: translateY(${props.$offsetY}px);
        transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.25s ease-in-out;
    `}
    
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);

    transition: box-shadow 0.25s ease-in-out;

    &:active {
        cursor: grabbing;
    }

    & > span {
        position: relative;
        z-index: 1002;
        display: inline-block;
    }

    &::after {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 3px solid rgba(255, 204, 231, 0.7); 
        opacity: 0;
        z-index: 1001;
    }
`;

const LONG_PRESS_DURATION = 500; // 0.5초
const MAX_DRAG_UP = -100;
const MIN_DRAG_DOWN = 0;

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
        if (!isLongPressSuccessful.current) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();

        // 1. 새 좌표는 항상 계산하고 Ref에 저장
        const deltaY = e.clientY - dragStartRef.current.y;
        const newY = dragStartRef.current.initialOffset + deltaY;
        latestDragY.current = newY; // ★ state 대신 Ref에 최신 좌표 저장

        // 2. ★ 이미 rAF가 예약되어 있다면, 추가 예약(state 업데이트)을 하지 않고 반환
        if (rafRef.current) {
            return;
        }

        // 3. ★ rAF를 예약하여 다음 프레임에 딱 한 번만 state를 업데이트
        rafRef.current = requestAnimationFrame(() => {
            setOffsetY(latestDragY.current); // Ref에 저장된 *가장 최신* 값으로 state 업데이트
            rafRef.current = null; // 예약 완료되었으므로 ID 초기화
        });
    };

    const handlePointerUp = (e) => {
        e.stopPropagation();
        
        // ★ (추가) 예약된 rAF가 있다면 즉시 취소 (드롭했으므로)
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        
        clearTimeout(timerRef.current);

        try {
            e.target.releasePointerCapture(e.pointerId);
        } catch (error) { /* 무시 */ }

        if (isDragging) {
            // 이 블록은 드래그가 끝났을 때만 실행됩니다. (기존과 동일)
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
            // ★★★ 추가된 부분 ★★★
            // 드래그가 아니었다면(isDragging이 false라면) '클릭'으로 간주합니다.
            // 부모로부터 onClick 함수를 받았다면 실행합니다.
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
            {/* 텍스트(아이콘)를 span으로 감싸서 z-index를 줍니다 */}
            <span>
                <DocumentIcon />
                <PlusIcon />
            </span>
        </FloatingButtonContainer>
    );
};

export default FloatingButton;