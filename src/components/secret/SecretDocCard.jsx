// src/components/secret/SecretDocCard.jsx
// 시크릿 문서 카드 컴포넌트

import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { ALL_ICONS } from './categoryIcons';

const Card = styled.div`
    background: ${props => props.$isSelected
        ? 'linear-gradient(135deg, rgba(240, 147, 251, 0.2) 0%, rgba(245, 87, 108, 0.2) 100%)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
    };
    border: 1px solid ${props => props.$isSelected
        ? 'rgba(240, 147, 251, 0.5)'
        : 'rgba(255, 255, 255, 0.1)'
    };
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
    touch-action: pan-y; /* 세로 스크롤 허용 */

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.02) 2px,
            rgba(0, 0, 0, 0.02) 4px
        );
        pointer-events: none;
    }
`;

const Checkbox = styled.div`
    position: absolute;
    top: 12px;
    left: 12px;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: 2px solid ${props => props.$checked ? '#f093fb' : 'rgba(255, 255, 255, 0.3)'};
    background: ${props => props.$checked ? 'linear-gradient(135deg, #f093fb, #f5576c)' : 'rgba(0, 0, 0, 0.3)'};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    z-index: 10;
    cursor: pointer;

    &::after {
        content: '✓';
        color: white;
        font-size: 14px;
        font-weight: bold;
        opacity: ${props => props.$checked ? 1 : 0};
        transform: scale(${props => props.$checked ? 1 : 0.5});
        transition: all 0.2s;
    }

    &:hover {
        border-color: #f093fb;
        transform: scale(1.1);
    }
`;

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    position: relative;
    z-index: 1;
    ${props => props.$selectionMode && 'margin-left: 32px;'}
`;

const TitleRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
`;

const LockIcon = styled.svg`
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    opacity: 0.8;
`;

const ImportantIcon = styled.svg`
    width: 16px;
    height: 16px;
    flex-shrink: 0;
`;

const Title = styled.h3`
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const CategoryBadge = styled.button`
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    min-width: 60px;
    min-height: 24px;
    justify-content: center;
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
`;

const CategoryModal = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 16px;
    z-index: 10;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    width: 85%;
    padding-top: 20px;
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
`;

const ModalTitle = styled.div`
    font-size: 13px;
    font-weight: 600;
    color: #ffffff;
    text-align: center;
    flex: 1;
    transform: translateY(-7px);
`;

const CloseButton = styled.button`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-size: 14px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    position: relative;
    top: -12px;
    right: -9px;
`;

const CategoryGrid = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
`;

const CategoryOptionBadge = styled.button`
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    flex: 1;
    min-width: 0;
    position: relative;

    ${props => {
        // 모든 카테고리에 색상 적용
        switch (props.$category) {
            case 'financial':
                return `
                    background: rgba(255, 215, 0, 0.2);
                    color: #FFD700;
                    border-color: rgba(255, 215, 0, 0.3);
                `;
            case 'personal':
                return `
                    background: rgba(147, 51, 234, 0.2);
                    color: #A78BFA;
                    border-color: rgba(147, 51, 234, 0.3);
                `;
            case 'work':
                return `
                    background: rgba(59, 130, 246, 0.2);
                    color: #60A5FA;
                    border-color: rgba(59, 130, 246, 0.3);
                `;
            case 'diary':
                return `
                    background: rgba(236, 72, 153, 0.2);
                    color: #F472B6;
                    border-color: rgba(236, 72, 153, 0.3);
                `;
            default:
                return `
                    background: rgba(255, 255, 255, 0.05);
                    color: #d0d0d0;
                    border-color: rgba(255, 255, 255, 0.1);
                `;
        }
    }}

    &:hover {
        transform: scale(1.05);
        opacity: 0.9;
    }
`;

const ActiveDot = styled.div`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    position: absolute;
    top: -11px;
`;

const Preview = styled.div`
    font-size: 14px;
    color: #b0b0b0;
    margin: 0 0 12px 0;
    line-height: 1.5;
    overflow: hidden;
    position: relative;
    z-index: 1;
    word-wrap: break-word;
    min-height: 21px; /* 최소 1줄 높이 보장 (14px * 1.5 line-height = 21px) */
    max-height: 60px; /* 약 2줄 높이로 제한 */

    /* HTML 콘텐츠 스타일링 */
    h1, h2, h3, h4, h5, h6 {
        margin: 0;
        color: #d0d0d0;
        font-size: 14px;
        font-weight: 600;
    }

    p {
        margin: 0;
        color: #b0b0b0;
    }

    img, video {
        max-width: 100%;
        max-height: 60px;
        height: auto;
        display: block;
        border-radius: 4px;
        margin: 4px 0;
        object-fit: cover;
    }

    ul, ol {
        margin: 0;
        padding-left: 20px;
        color: #b0b0b0;
    }

    table {
        border-collapse: collapse;
        font-size: 13px;
        color: #b0b0b0;
    }

    th, td {
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 4px 8px;
    }

    a {
        color: #4a90e2;
        text-decoration: none;
    }

    code {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 13px;
        color: #b0b0b0;
    }

    blockquote {
        margin: 0;
        padding-left: 12px;
        border-left: 3px solid rgba(255, 255, 255, 0.2);
        color: #999;
    }
`;

const CardFooter = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #808080;
    position: relative;
    z-index: 1;
`;

const TagsContainer = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
`;

const Tag = styled.span`
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(240, 147, 251, 0.1);
    border: 1px solid rgba(240, 147, 251, 0.2);
    color: rgba(240, 147, 251, 0.8);
    font-size: 11px;
`;

const DateText = styled.span`
    white-space: nowrap;
`;

const RightSection = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
`;

const DeleteButton = styled.button`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #808080;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    font-size: 12px;
    line-height: 1;
    flex-shrink: 0;
    padding: 0;
    z-index: 10;
    position: relative;
    top: -29px;
    right: -35px;

    &:hover {
        background: rgba(255, 107, 107, 0.2);
        border-color: rgba(255, 107, 107, 0.4);
        color: #ff6b6b;
        transform: scale(1.1);
    }

    &:active {
        transform: scale(0.95);
    }
`;

const DeleteModal = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 24px;
    z-index: 20;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    width: 85%;
    max-width: 320px;
`;

const DeleteModalText = styled.p`
    color: #ffffff;
    font-size: 15px;
    margin: 0 0 20px 0;
    text-align: center;
    line-height: 1.5;
`;

const DeleteModalButtons = styled.div`
    display: flex;
    gap: 8px;
`;

const DeleteModalButton = styled.button`
    flex: 1;
    padding: 12px;
    border-radius: 8px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    ${props => props.$primary ? `
        background: linear-gradient(135deg, #ff6b6b, #ff4444);
        color: white;

        &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
        }
    ` : `
        background: rgba(255, 255, 255, 0.1);
        color: #d0d0d0;
        border: 1px solid rgba(255, 255, 255, 0.2);

        &:hover {
            background: rgba(255, 255, 255, 0.15);
        }
    `}

    &:active {
        transform: scale(0.98);
    }
`;

const SecretDocCard = ({ doc, onClick, onCategoryChange, onDelete, onLongPress, selectionMode, isSelected, openCategoryDropdownId, setOpenCategoryDropdownId, settings }) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const longPressTimerRef = useRef(null);
    const badgeLongPressTimerRef = useRef(null);
    const isLongPressRef = useRef(false);
    const startPosRef = useRef({ x: 0, y: 0 });

    // 로컬 state 대신 전역 state 사용
    const showDropdown = openCategoryDropdownId === doc.id;
    const setShowDropdown = (show) => {
        setOpenCategoryDropdownId(show ? doc.id : null);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return '오늘';
        if (days === 1) return '어제';
        if (days < 7) return `${days}일 전`;

        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    };

    const handleBadgeClick = (e) => {
        e.stopPropagation();
        e.preventDefault();

        // 뱃지 짧게 탭했을 때는 아무 반응 없음
        // 길게 눌렀을 때만 onPointerDown에서 모달이 열림
    };

    const handleCategoryChange = async (e, newCategory) => {
        e.stopPropagation();

        // 카테고리 변경 실행
        if (onCategoryChange) {
            await onCategoryChange(doc.id, newCategory);
        }

        // 변경 후 모달 닫기
        setShowDropdown(false);
    };

    const handlePointerDown = (e) => {
        if (selectionMode) return; // 다중 선택 모드에서는 길게 누르기 비활성화

        // 카테고리 뱃지를 클릭한 경우 카드의 long press 타이머를 시작하지 않음
        const target = e.target;
        const isBadgeClick = target.closest('button[data-category-badge]');
        if (isBadgeClick) return;

        // 터치와 마우스 이벤트 모두 지원
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // 시작 위치 저장
        startPosRef.current = {
            x: clientX,
            y: clientY,
            time: Date.now()
        };

        isLongPressRef.current = false;

        // 길게 누르기 타이머 시작
        longPressTimerRef.current = setTimeout(() => {
            console.log('🔥 롱프레스 발생! selectionMode:', selectionMode);
            isLongPressRef.current = true;
            if (onLongPress) {
                console.log('✅ onLongPress 호출');
                onLongPress();
            } else {
                console.warn('⚠️ onLongPress 함수가 없음');
            }
        }, 500); // 0.5초
    };

    const handlePointerMove = (e) => {
        // 터치와 마우스 이벤트 모두 지원
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // 움직임이 5px 이상이면 즉시 타이머 취소 (스와이프 감지)
        const deltaX = Math.abs(clientX - startPosRef.current.x);
        const deltaY = Math.abs(clientY - startPosRef.current.y);

        if (deltaX > 5 || deltaY > 5) {
            clearTimeout(longPressTimerRef.current);
            isLongPressRef.current = false;
        }
    };

    const handlePointerUp = (e) => {
        clearTimeout(longPressTimerRef.current);

        // 카테고리 모달이 열려있으면 카드 클릭 이벤트 무시
        if (showDropdown) {
            isLongPressRef.current = false;
            return;
        }

        // 터치와 마우스 이벤트 모두 지원 (터치는 changedTouches 사용)
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        // 실제로 움직임이 있었는지 확인 (스와이프 방지)
        const deltaX = Math.abs(clientX - startPosRef.current.x);
        const deltaY = Math.abs(clientY - startPosRef.current.y);
        const hasMoved = deltaX > 5 || deltaY > 5;

        // selectionMode가 아니고, 롱프레스가 아니며, 움직임이 없었을 때만 클릭으로 문서 열기
        if (!isLongPressRef.current && !selectionMode && !hasMoved && onClick) {
            onClick(doc);
        }

        isLongPressRef.current = false;
    };

    const handlePointerCancel = () => {
        clearTimeout(longPressTimerRef.current);
        isLongPressRef.current = false;
    };

    const handleCardClick = (e) => {
        // 카테고리 모달이 열려있으면 카드 클릭 이벤트 무시
        if (showDropdown) return;

        // selectionMode일 때만 클릭으로 선택/해제
        if (selectionMode && onClick) {
            onClick(doc);
        }
    };

    const handleCheckboxClick = (e) => {
        e.stopPropagation();
        if (onClick) {
            onClick(doc);
        }
    };

    const categories = [
        { value: 'financial', label: settings?.categoryNames?.financial || '금융' },
        { value: 'personal', label: settings?.categoryNames?.personal || '개인' },
        { value: 'work', label: settings?.categoryNames?.work || '업무' },
        { value: 'diary', label: settings?.categoryNames?.diary || '일기' }
    ];

    return (
        <Card
            onClick={handleCardClick}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            onTouchCancel={handlePointerCancel}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            $isSelected={isSelected}
        >
            {selectionMode && (
                <Checkbox
                    $checked={isSelected}
                    onClick={handleCheckboxClick}
                />
            )}
            <CardHeader $selectionMode={selectionMode}>
                <TitleRow>
                    {doc.isImportant && (
                        <ImportantIcon viewBox="0 0 24 24" fill="#ff6b6b" stroke="#ff4444" strokeWidth="1.5">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </ImportantIcon>
                    )}
                    {doc.hasPassword && (
                        <LockIcon viewBox="0 0 24 24" fill="none" stroke="#ffc107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </LockIcon>
                    )}
                    <Title>{doc.title || '제목 없음'}</Title>
                </TitleRow>
                {doc.category && (
                    <CategoryBadge
                        $category={doc.category}
                        data-category-badge="true"
                        onClick={handleBadgeClick}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            clearTimeout(longPressTimerRef.current);

                            // 뱃지 길게 누르기 시작
                            if (selectionMode) return;
                            badgeLongPressTimerRef.current = setTimeout(() => {
                                setShowDropdown(true);
                            }, 500); // 0.5초
                        }}
                        onPointerUp={(e) => {
                            e.stopPropagation();
                            clearTimeout(badgeLongPressTimerRef.current);
                        }}
                        onPointerLeave={(e) => {
                            clearTimeout(badgeLongPressTimerRef.current);
                        }}
                        onPointerCancel={(e) => {
                            clearTimeout(badgeLongPressTimerRef.current);
                        }}
                    >
                        {doc.category && (() => {
                            const categoryIconId = settings?.categoryIcons?.[doc.category];
                            const iconData = ALL_ICONS.find(icon => icon.id === categoryIconId);
                            const categoryName = settings?.categoryNames?.[doc.category] || doc.category;

                            return (
                                <>
                                    {iconData && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                                            <path d={iconData.svg} />
                                        </svg>
                                    )}
                                    {categoryName}
                                </>
                            );
                        })()}
                    </CategoryBadge>
                )}
            </CardHeader>

            <Preview dangerouslySetInnerHTML={{ __html: doc.preview || doc.content || '내용 없음' }} />

            <CardFooter>
                {doc.tags && doc.tags.length > 0 ? (
                    <TagsContainer>
                        {doc.tags.slice(0, 3).map((tag, index) => (
                            <Tag key={index}>{tag}</Tag>
                        ))}
                        {doc.tags.length > 3 && <Tag>+{doc.tags.length - 3}</Tag>}
                    </TagsContainer>
                ) : (
                    <div></div>
                )}
                <RightSection>
                    {!selectionMode && (
                        <DeleteButton
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setShowDeleteModal(true);
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                            }}
                            onMouseUp={(e) => {
                                e.stopPropagation();
                            }}
                            onTouchStart={(e) => {
                                e.stopPropagation();
                            }}
                            onTouchEnd={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            ✕
                        </DeleteButton>
                    )}
                    <DateText>{formatDate(doc.updatedAt || doc.createdAt)}</DateText>
                </RightSection>
            </CardFooter>

            {showDropdown && (
                <CategoryModal
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        clearTimeout(longPressTimerRef.current);
                    }}
                    onPointerUp={(e) => e.stopPropagation()}
                >
                    <ModalHeader>
                        <ModalTitle>카테고리 변경</ModalTitle>
                        <CloseButton
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDropdown(false);
                            }}
                        >
                            ✕
                        </CloseButton>
                    </ModalHeader>
                    <CategoryGrid>
                        {categories.map(category => (
                            <CategoryOptionBadge
                                key={category.value}
                                $category={category.value}
                                $active={doc.category === category.value}
                                onClick={(e) => handleCategoryChange(e, category.value)}
                            >
                                {doc.category === category.value && <ActiveDot />}
                                {category.label}
                            </CategoryOptionBadge>
                        ))}
                    </CategoryGrid>
                </CategoryModal>
            )}

            {showDeleteModal && (
                <DeleteModal
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        clearTimeout(longPressTimerRef.current);
                    }}
                    onPointerUp={(e) => e.stopPropagation()}
                >
                    <DeleteModalText>이 문서를 정말 삭제할까요?</DeleteModalText>
                    <DeleteModalButtons>
                        <DeleteModalButton
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setShowDeleteModal(false);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchEnd={(e) => e.stopPropagation()}
                        >
                            취소
                        </DeleteModalButton>
                        <DeleteModalButton
                            $primary
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setShowDeleteModal(false);
                                if (onDelete) {
                                    onDelete(doc.id);
                                }
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchEnd={(e) => e.stopPropagation()}
                        >
                            삭제
                        </DeleteModalButton>
                    </DeleteModalButtons>
                </DeleteModal>
            )}
        </Card>
    );
};

export default SecretDocCard;
