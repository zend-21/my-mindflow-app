// src/components/secret/SecretDocCard.jsx
// 시크릿 문서 카드 컴포넌트

import React, { useState, useRef } from 'react';
import styled from 'styled-components';

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

    &:hover {
        background: linear-gradient(135deg, rgba(240, 147, 251, 0.15), rgba(245, 87, 108, 0.15));
        border-color: rgba(240, 147, 251, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(240, 147, 251, 0.2);
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

const LockIcon = styled.span`
    font-size: 14px;
    opacity: 0.7;
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

    &:hover {
        transform: scale(1.05);
        opacity: 0.8;
    }
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

const Preview = styled.p`
    font-size: 14px;
    color: #b0b0b0;
    margin: 0 0 12px 0;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    position: relative;
    z-index: 1;
    white-space: pre-wrap;
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

const SecretDocCard = ({ doc, onClick, onCategoryChange, onLongPress, selectionMode, isSelected, openCategoryDropdownId, setOpenCategoryDropdownId }) => {
    const longPressTimerRef = useRef(null);
    const isLongPressRef = useRef(false);

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

        // 다중 선택 모드에서는 카테고리 변경 불가
        if (selectionMode) return;

        // 길게 누르기 타이머 취소
        clearTimeout(longPressTimerRef.current);
        isLongPressRef.current = false;
        setShowDropdown(!showDropdown);
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

        isLongPressRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            if (onLongPress) {
                onLongPress();
            }
        }, 500); // 0.5초
    };

    const handlePointerUp = (e) => {
        clearTimeout(longPressTimerRef.current);

        if (!isLongPressRef.current && onClick) {
            // 길게 누르지 않았으면 일반 클릭
            // (모달 닫기는 전역 핸들러가 처리)
            onClick(doc);
        }

        isLongPressRef.current = false;
    };

    const handlePointerCancel = () => {
        clearTimeout(longPressTimerRef.current);
        isLongPressRef.current = false;
    };

    const handleCheckboxClick = (e) => {
        e.stopPropagation();
        if (onClick) {
            onClick(doc);
        }
    };

    const categories = [
        { value: 'financial', label: '금융' },
        { value: 'personal', label: '개인' },
        { value: 'work', label: '업무' },
        { value: 'diary', label: '일기' }
    ];

    return (
        <Card
            onClick={selectionMode ? handleCheckboxClick : undefined}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
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
                        <ImportantIcon viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="7" fill="#ff6b6b" stroke="#ff4444" strokeWidth="1"/>
                            <text x="8" y="12" fontSize="11" fontWeight="bold" fill="white" textAnchor="middle">!</text>
                        </ImportantIcon>
                    )}
                    {doc.hasPassword && <LockIcon>🔒</LockIcon>}
                    <Title>{doc.title || '제목 없음'}</Title>
                </TitleRow>
                {doc.category && (
                    <CategoryBadge
                        $category={doc.category}
                        onClick={handleBadgeClick}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            clearTimeout(longPressTimerRef.current);
                        }}
                        onPointerUp={(e) => e.stopPropagation()}
                    >
                        {doc.category === 'financial' && '💰 금융'}
                        {doc.category === 'personal' && '👤 개인'}
                        {doc.category === 'work' && '💼 업무'}
                        {doc.category === 'diary' && '📔 일기'}
                        {!['financial', 'personal', 'work', 'diary'].includes(doc.category) && doc.category}
                    </CategoryBadge>
                )}
            </CardHeader>

            <Preview>{doc.preview || doc.content || '내용 없음'}</Preview>

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
                <DateText>{formatDate(doc.updatedAt || doc.createdAt)}</DateText>
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
        </Card>
    );
};

export default SecretDocCard;
