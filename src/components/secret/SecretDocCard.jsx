// src/components/secret/SecretDocCard.jsx
// 시크릿 문서 카드 컴포넌트

import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
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

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    position: relative;
    z-index: 1;
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

const CategoryBadge = styled.span`
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
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

const Date = styled.span`
    white-space: nowrap;
`;

const SecretDocCard = ({ doc, onClick }) => {
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

    return (
        <Card onClick={() => onClick(doc)}>
            <CardHeader>
                <TitleRow>
                    {doc.hasPassword && <LockIcon>🔒</LockIcon>}
                    <Title>{doc.title || '제목 없음'}</Title>
                </TitleRow>
                {doc.category && (
                    <CategoryBadge $category={doc.category}>
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
                <Date>{formatDate(doc.updatedAt || doc.createdAt)}</Date>
            </CardFooter>
        </Card>
    );
};

export default SecretDocCard;
