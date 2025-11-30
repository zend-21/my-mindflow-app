// src/components/secret/SecretDocViewer.jsx
// 시크릿 문서 읽기 모드 컴포넌트

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { ALL_ICONS } from './categoryIcons';

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const slideUp = keyframes`
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
`;

const slideOutToLeft = keyframes`
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(-100%); opacity: 0.5; }
`;

const slideOutToRight = keyframes`
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0.5; }
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    animation: ${fadeIn} 0.3s ease-out;
    overflow: hidden;
`;

const ModalContent = styled.div`
    background: linear-gradient(135deg, #2a2d35, #333842);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    position: relative;
    width: 95vw;
    height: 97vh;
    max-width: 800px;

    /* 스와이프 오프셋 적용 */
    transform: translateX(${props => props.$swipeOffset || 0}px);
    transition: ${props => props.$isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)'};

    /* 슬라이드 애니메이션 */
    animation: ${props => {
        if (props.$slideDirection === 'left') return slideOutToLeft;
        if (props.$slideDirection === 'right') return slideOutToRight;
        return slideUp;
    }} ${props => props.$slideDirection ? '0.25s' : '0.3s'} cubic-bezier(0.2, 0, 0, 1);

    @media (min-width: 768px) {
        max-width: 420px;
        min-height: 70vh;
        border-radius: 20px;
    }

    @media (min-width: 1200px) {
        max-width: 480px;
    }

    @media (min-width: 1900px) {
        max-width: 530px;
    }
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 0;
    gap: 8px;
`;

const LeftButtons = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const RightButtons = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const Button = styled.button`
    padding: 6px;
    border-radius: 6px;
    background: rgba(74, 144, 226, 0.15);
    border: 1px solid rgba(74, 144, 226, 0.3);
    color: #4a90e2;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 32px;
    min-height: 32px;

    &:hover {
        background: rgba(74, 144, 226, 0.25);
        border-color: rgba(74, 144, 226, 0.5);
    }

    &:active {
        transform: scale(0.95);
    }

    .material-icons {
        font-size: 18px;
    }
`;

const CloseButton = styled(Button)`
    background: rgba(158, 158, 158, 0.15);
    border-color: rgba(158, 158, 158, 0.3);
    color: #9e9e9e;

    &:hover {
        background: rgba(158, 158, 158, 0.25);
        border-color: rgba(158, 158, 158, 0.5);
    }
`;

const ImportantBadge = styled.div`
    padding: 6px;
    border-radius: 6px;
    background: rgba(255, 107, 107, 0.2);
    border: 1px solid rgba(255, 107, 107, 0.4);
    color: #ff6b6b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
    min-width: 32px;
    min-height: 32px;

    .material-icons {
        font-size: 18px;
    }
`;

const PasswordBadge = styled.div`
    padding: 6px 10px;
    border-radius: 6px;
    background: rgba(255, 193, 7, 0.15);
    border: 1px solid rgba(255, 193, 7, 0.3);
    color: #ffc107;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    white-space: nowrap;
    cursor: default;

    .material-icons {
        font-size: 16px;
    }
`;

const TitleSection = styled.div`
    margin-bottom: 12px;
`;

const Title = styled.h2`
    font-size: 22px;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 8px 0;
    word-wrap: break-word;
`;

const MetaInfo = styled.div`
    font-size: 12px;
    color: #b0b0b0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    position: relative;
`;

const MaskIcon = styled.img`
    position: absolute;
    top: 0;
    right: 0;
    width: 40px;
    height: auto;
    opacity: 0.15;
    pointer-events: none;
`;

const CategoryBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    width: fit-content;
    background: ${props => {
        switch (props.$category) {
            case 'financial': return 'rgba(255, 215, 0, 0.2)';
            case 'personal': return 'rgba(147, 51, 234, 0.2)';
            case 'work': return 'rgba(59, 130, 246, 0.2)';
            case 'diary': return 'rgba(236, 72, 153, 0.2)';
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    }};
    color: ${props => {
        switch (props.$category) {
            case 'financial': return '#FFD700';
            case 'personal': return '#A78BFA';
            case 'work': return '#60A5FA';
            case 'diary': return '#F472B6';
            default: return '#d0d0d0';
        }
    }};
    border: 1px solid ${props => {
        switch (props.$category) {
            case 'financial': return 'rgba(255, 215, 0, 0.3)';
            case 'personal': return 'rgba(147, 51, 234, 0.3)';
            case 'work': return 'rgba(59, 130, 246, 0.3)';
            case 'diary': return 'rgba(236, 72, 153, 0.3)';
            default: return 'rgba(255, 255, 255, 0.2)';
        }
    }};

    svg {
        width: 12px;
        height: 12px;
    }
`;

const ContentContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 35px 32px 40px 32px;
    background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 50%, #1e1e1e 100%);
    border-radius: 12px;
    margin: 0;
    color: #d0d0d0;

    /* 이미지 드래그 방지 - 스와이프 동작 우선 */
    img {
        pointer-events: none;
        user-select: none;
        -webkit-user-drag: none;
    }

    video {
        pointer-events: none;
        user-select: none;
    }
    line-height: 1.9;
    font-size: 17px;
    font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
    white-space: pre-wrap;
    word-wrap: break-word;
    position: relative;
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    box-sizing: border-box;

    /* 다크 노트북 질감 효과 */
    box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.5), inset 0 2px 8px rgba(0, 0, 0, 0.4);

    /* 다크 노트 라인 효과 */
    background-image: repeating-linear-gradient(
        transparent,
        transparent calc(17px * 1.9 - 1px),
        rgba(255, 255, 255, 0.05) calc(17px * 1.9 - 1px),
        rgba(255, 255, 255, 0.05) calc(17px * 1.9)
    );

    /* 스크롤바 스타일링 */
    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(74, 144, 226, 0.4);
        border-radius: 4px;

        &:hover {
            background: rgba(74, 144, 226, 0.6);
        }
    }

    /* HTML 서식 지원 - 이미지 */
    img {
        max-width: 100% !important;
        height: auto !important;
        border-radius: 8px;
        margin: 0.5em 0;
        cursor: pointer;
        box-sizing: border-box;
        display: block;
        width: auto !important;
        object-fit: contain;
    }

    /* HTML 서식 지원 - YouTube 영상 */
    iframe {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        aspect-ratio: 16 / 9 !important;
        border-radius: 8px;
        margin: 1em 0;
        box-sizing: border-box;
    }

    /* HTML 서식 지원 - 기본 스타일 */
    h1, h2, h3, h4, h5, h6 {
        margin: 0.8em 0 0.4em 0;
        color: #ffffff;
    }

    p {
        margin: 0.5em 0;
    }

    ul, ol {
        margin: 0.5em 0;
        padding-left: 1.5em;
    }

    li {
        margin: 0.3em 0;
    }

    a {
        color: #4a90e2;
        text-decoration: underline;
    }

    blockquote {
        border-left: 3px solid rgba(74, 144, 226, 0.5);
        padding-left: 1em;
        margin: 1em 0;
        color: #b0b0b0;
    }

    code {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 0.9em;
    }

    pre {
        background: rgba(0, 0, 0, 0.3);
        padding: 1em;
        border-radius: 8px;
        overflow-x: auto;
        margin: 1em 0;
    }

    pre code {
        background: none;
        padding: 0;
    }

    table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
    }

    th, td {
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 8px;
        text-align: left;
    }

    th {
        background: rgba(255, 255, 255, 0.1);
        font-weight: 600;
    }

    strong, b {
        font-weight: 600;
        color: #ffffff;
    }

    em, i {
        font-style: italic;
    }
`;

const TagsContainer = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 12px;
`;

const Tag = styled.span`
    padding: 4px 8px;
    border-radius: 4px;
    background: rgba(240, 147, 251, 0.1);
    border: 1px solid rgba(240, 147, 251, 0.2);
    color: rgba(240, 147, 251, 0.8);
    font-size: 12px;
`;

const SecretDocViewer = ({ doc, docs = [], selectedCategory, onClose, onEdit, onNavigate, settings }) => {
    // 스와이프 관련 state
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [slideDirection, setSlideDirection] = useState(null);

    // 더블 탭 관련 state
    const [lastTap, setLastTap] = useState(0);
    const DOUBLE_TAP_DELAY = 300; // 300ms 이내에 두 번 탭하면 더블 탭

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCategoryIcon = (category) => {
        const categoryIconId = settings?.categoryIcons?.[category];
        const iconData = ALL_ICONS.find(icon => icon.id === categoryIconId);
        return iconData?.svg || '';
    };

    const getCategoryName = (category) => {
        return settings?.categoryNames?.[category] || category;
    };

    // 현재 카테고리에 맞는 문서 목록 가져오기
    const getFilteredDocs = useCallback(() => {
        if (selectedCategory === 'all') {
            return docs;
        }
        return docs.filter(d => d.category === selectedCategory);
    }, [docs, selectedCategory]);

    // 현재 문서의 인덱스 찾기
    const getCurrentIndex = useCallback(() => {
        const filteredDocs = getFilteredDocs();
        return filteredDocs.findIndex(d => d.id === doc.id);
    }, [doc, getFilteredDocs]);

    // 이전/다음 문서 가져오기
    const getAdjacentDoc = useCallback((direction) => {
        const filteredDocs = getFilteredDocs();
        const currentIndex = getCurrentIndex();

        if (direction === 'prev') {
            return currentIndex > 0 ? filteredDocs[currentIndex - 1] : null;
        } else {
            return currentIndex < filteredDocs.length - 1 ? filteredDocs[currentIndex + 1] : null;
        }
    }, [getFilteredDocs, getCurrentIndex]);

    // 네비게이션 가능 여부 체크
    const canNavigatePrev = useCallback(() => {
        const currentIndex = getCurrentIndex();
        return currentIndex > 0;
    }, [getCurrentIndex]);

    const canNavigateNext = useCallback(() => {
        const filteredDocs = getFilteredDocs();
        const currentIndex = getCurrentIndex();
        return currentIndex < filteredDocs.length - 1 && currentIndex !== -1;
    }, [getFilteredDocs, getCurrentIndex]);

    // 이전/다음 문서로 이동 (애니메이션 포함)
    const navigateToPrevDoc = useCallback(() => {
        if (canNavigatePrev()) {
            const prevDoc = getAdjacentDoc('prev');
            setSlideDirection('right'); // 오른쪽으로 슬라이드
            setTimeout(() => {
                onNavigate && onNavigate(prevDoc);
                setSlideDirection(null);
            }, 250);
        }
    }, [canNavigatePrev, getAdjacentDoc, onNavigate]);

    const navigateToNextDoc = useCallback(() => {
        if (canNavigateNext()) {
            const nextDoc = getAdjacentDoc('next');
            setSlideDirection('left'); // 왼쪽으로 슬라이드
            setTimeout(() => {
                onNavigate && onNavigate(nextDoc);
                setSlideDirection(null);
            }, 250);
        }
    }, [canNavigateNext, getAdjacentDoc, onNavigate]);

    // 스와이프 핸들러
    const handleTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
        setIsSwiping(false);
    };

    const handleTouchMove = (e) => {
        if (!touchStart) return;

        const currentTouch = e.targetTouches[0].clientX;
        const diff = currentTouch - touchStart;

        // 좌우로 10px 이상 움직였을 때만 스와이프로 간주
        if (Math.abs(diff) > 10) {
            // 스와이프 시작
            if (!isSwiping) {
                setIsSwiping(true);
            }

            // 이전 문서가 없으면 오른쪽 스와이프 제한
            if (diff > 0 && !canNavigatePrev()) {
                setSwipeOffset(Math.min(diff * 0.2, 50)); // 최대 50px까지만
            }
            // 다음 문서가 없으면 왼쪽 스와이프 제한
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
        if (!touchStart) {
            setIsSwiping(false);
            setSwipeOffset(0);
            return;
        }

        // 스와이프가 아니라 단순 탭이었다면 (10px 미만 이동)
        if (!isSwiping || !touchEnd || Math.abs(touchStart - touchEnd) < 10) {
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
            navigateToNextDoc();
        } else if (isRightSwipe && canNavigatePrev()) {
            navigateToPrevDoc();
        }

        // 리셋
        setIsSwiping(false);
        setSwipeOffset(0);
        setTouchStart(null);
        setTouchEnd(null);
    };

    // 더블 탭 핸들러
    const handleContentTap = (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;

        if (tapLength < DOUBLE_TAP_DELAY && tapLength > 0) {
            // 더블 탭 감지 - 편집 모드 열기
            if (onEdit) {
                onEdit();
            }
        }

        setLastTap(currentTime);
    };

    // 키보드 네비게이션
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                navigateToPrevDoc();
            } else if (e.key === 'ArrowRight') {
                navigateToNextDoc();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigateToPrevDoc, navigateToNextDoc]);

    return createPortal(
        <Overlay onClick={onClose}>
            <ModalContent
                onClick={(e) => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                $swipeOffset={swipeOffset}
                $isSwiping={isSwiping}
                $slideDirection={slideDirection}
            >
                <Header>
                    <LeftButtons>
                        <CloseButton onClick={onClose}>
                            <span className="material-icons">close</span>
                        </CloseButton>
                        {doc.category && (
                            <CategoryBadge $category={doc.category}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d={getCategoryIcon(doc.category)} />
                                </svg>
                                {getCategoryName(doc.category)}
                            </CategoryBadge>
                        )}
                        {doc.isImportant && (
                            <ImportantBadge>
                                <span className="material-icons">star</span>
                            </ImportantBadge>
                        )}
                        {doc.hasPassword && (
                            <PasswordBadge>
                                <span className="material-icons">lock</span>
                            </PasswordBadge>
                        )}
                    </LeftButtons>
                    <RightButtons>
                        <Button onClick={onEdit}>
                            <span className="material-icons">edit</span>
                        </Button>
                    </RightButtons>
                </Header>

                <TitleSection>
                    <Title>{doc.title || '제목 없음'}</Title>
                    <MetaInfo>
                        <div>작성일: {formatDate(doc.createdAt)}</div>
                        {doc.updatedAt && doc.updatedAt !== doc.createdAt && (
                            <div>수정일: {formatDate(doc.updatedAt)}</div>
                        )}
                        <MaskIcon src="/images/secret/mask-gray.svg" alt="secret document" />
                    </MetaInfo>
                </TitleSection>

                {doc.tags && doc.tags.length > 0 && (
                    <TagsContainer onClick={handleContentTap}>
                        {doc.tags.map((tag, index) => (
                            <Tag key={index}>{tag}</Tag>
                        ))}
                    </TagsContainer>
                )}

                <ContentContainer
                    onClick={handleContentTap}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    dangerouslySetInnerHTML={{ __html: doc.content || '내용 없음' }}
                />
            </ModalContent>
        </Overlay>,
        document.body
    );
};

export default SecretDocViewer;
