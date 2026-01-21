import React, { useState, useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import Portal from './Portal';

const ViewerOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 500000;
    touch-action: none;
    overflow: hidden;
`;

const ImageContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    touch-action: none;
`;

const ZoomableImage = styled.img`
    max-width: 95%;
    max-height: 90%;
    object-fit: contain;
    transform-origin: center center;
    transform: ${props => `translate(${props.$translateX || 0}px, ${props.$translateY || 0}px) scale(${props.$scale || 1})`};
    transition: ${props => props.$isAnimating ? 'transform 0.2s ease-out' : 'none'};
    user-select: none;
    -webkit-user-drag: none;
    touch-action: none;
    pointer-events: auto;
`;

const CloseButton = styled.button`
    position: fixed;
    top: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 500001;
    font-size: 28px;

    &:active {
        background: rgba(255, 255, 255, 0.3);
    }
`;

const ZoomControls = styled.div`
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 16px;
    z-index: 500001;
`;

const ZoomButton = styled.button`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;

    &:active {
        background: rgba(255, 255, 255, 0.3);
    }

    &:disabled {
        opacity: 0.3;
    }
`;

const ZoomIndicator = styled.div`
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    z-index: 500001;
    opacity: ${props => props.$visible ? 1 : 0};
    transition: opacity 0.3s;
    pointer-events: none;
`;

function PinchZoomImageViewer({ src, alt, onClose }) {
    const [scale, setScale] = useState(1);
    const [translateX, setTranslateX] = useState(0);
    const [translateY, setTranslateY] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showZoomIndicator, setShowZoomIndicator] = useState(false);

    const containerRef = useRef(null);
    const initialPinchRef = useRef(null);
    const lastTouchRef = useRef({ x: 0, y: 0 });
    const zoomIndicatorTimeoutRef = useRef(null);

    const MIN_SCALE = 1;
    const MAX_SCALE = 4;

    // 두 손가락 사이 거리 계산
    const getDistance = useCallback((t1, t2) => {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }, []);

    // 줌 레벨 표시
    const showZoomLevel = useCallback(() => {
        setShowZoomIndicator(true);
        if (zoomIndicatorTimeoutRef.current) {
            clearTimeout(zoomIndicatorTimeoutRef.current);
        }
        zoomIndicatorTimeoutRef.current = setTimeout(() => {
            setShowZoomIndicator(false);
        }, 800);
    }, []);

    // 터치 시작
    const handleTouchStart = useCallback((e) => {
        if (e.touches.length === 2) {
            // 핀치 시작
            e.preventDefault();
            const distance = getDistance(e.touches[0], e.touches[1]);
            initialPinchRef.current = {
                distance,
                scale,
                translateX,
                translateY,
                centerX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                centerY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
            };
        } else if (e.touches.length === 1) {
            // 드래그 준비
            lastTouchRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
        }
    }, [scale, translateX, translateY, getDistance]);

    // 터치 이동
    const handleTouchMove = useCallback((e) => {
        if (e.touches.length === 2 && initialPinchRef.current) {
            // 핀치 줌
            e.preventDefault();
            const currentDistance = getDistance(e.touches[0], e.touches[1]);
            const ratio = currentDistance / initialPinchRef.current.distance;
            let newScale = initialPinchRef.current.scale * ratio;
            newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

            setScale(newScale);
            showZoomLevel();
        } else if (e.touches.length === 1 && scale > 1) {
            // 드래그 (확대 상태에서만)
            e.preventDefault();
            const dx = e.touches[0].clientX - lastTouchRef.current.x;
            const dy = e.touches[0].clientY - lastTouchRef.current.y;

            setTranslateX(prev => prev + dx);
            setTranslateY(prev => prev + dy);

            lastTouchRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
        }
    }, [scale, getDistance, showZoomLevel]);

    // 터치 종료
    const handleTouchEnd = useCallback((e) => {
        initialPinchRef.current = null;

        // 스케일이 1이면 위치 초기화
        if (scale <= 1) {
            setIsAnimating(true);
            setScale(1);
            setTranslateX(0);
            setTranslateY(0);
            setTimeout(() => setIsAnimating(false), 200);
        }
    }, [scale]);

    // 더블탭 줌
    const lastTapTimeRef = useRef(0);
    const handleImageClick = useCallback((e) => {
        const now = Date.now();
        if (now - lastTapTimeRef.current < 300) {
            // 더블탭
            e.preventDefault();
            e.stopPropagation();
            setIsAnimating(true);

            if (scale > 1) {
                setScale(1);
                setTranslateX(0);
                setTranslateY(0);
            } else {
                setScale(2);
            }
            showZoomLevel();
            setTimeout(() => setIsAnimating(false), 200);
        }
        lastTapTimeRef.current = now;
    }, [scale, showZoomLevel]);

    // 줌 버튼
    const handleZoomIn = useCallback(() => {
        setIsAnimating(true);
        setScale(prev => Math.min(MAX_SCALE, prev + 0.5));
        showZoomLevel();
        setTimeout(() => setIsAnimating(false), 200);
    }, [showZoomLevel]);

    const handleZoomOut = useCallback(() => {
        setIsAnimating(true);
        const newScale = Math.max(MIN_SCALE, scale - 0.5);
        setScale(newScale);
        if (newScale <= 1) {
            setTranslateX(0);
            setTranslateY(0);
        }
        showZoomLevel();
        setTimeout(() => setIsAnimating(false), 200);
    }, [scale, showZoomLevel]);

    const handleReset = useCallback(() => {
        setIsAnimating(true);
        setScale(1);
        setTranslateX(0);
        setTranslateY(0);
        showZoomLevel();
        setTimeout(() => setIsAnimating(false), 200);
    }, [showZoomLevel]);

    // 배경 클릭 시 닫기
    const handleOverlayClick = useCallback((e) => {
        if (e.target === containerRef.current) {
            onClose();
        }
    }, [onClose]);

    // ESC 키로 닫기
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // 클린업
    useEffect(() => {
        return () => {
            if (zoomIndicatorTimeoutRef.current) {
                clearTimeout(zoomIndicatorTimeoutRef.current);
            }
        };
    }, []);

    return (
        <Portal>
            <ViewerOverlay>
                <ImageContainer
                    ref={containerRef}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={handleOverlayClick}
                >
                    <ZoomableImage
                        src={src}
                        alt={alt || 'Image'}
                        $scale={scale}
                        $translateX={translateX}
                        $translateY={translateY}
                        $isAnimating={isAnimating}
                        onClick={handleImageClick}
                        draggable={false}
                    />
                </ImageContainer>

                <CloseButton onClick={onClose}>
                    <span className="material-icons">close</span>
                </CloseButton>

                <ZoomIndicator $visible={showZoomIndicator}>
                    {Math.round(scale * 100)}%
                </ZoomIndicator>

                <ZoomControls>
                    <ZoomButton onClick={handleZoomOut} disabled={scale <= MIN_SCALE}>
                        <span className="material-icons">remove</span>
                    </ZoomButton>
                    <ZoomButton onClick={handleReset}>
                        <span className="material-icons">fit_screen</span>
                    </ZoomButton>
                    <ZoomButton onClick={handleZoomIn} disabled={scale >= MAX_SCALE}>
                        <span className="material-icons">add</span>
                    </ZoomButton>
                </ZoomControls>
            </ViewerOverlay>
        </Portal>
    );
}

export default PinchZoomImageViewer;
