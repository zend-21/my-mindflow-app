// src/components/SearchModal.jsx

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { X, Search, Clock, TrendingUp } from 'lucide-react';
import Portal from './Portal';

const slideIn = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    z-index: 10000;
`;

const ModalContent = styled.div`
    background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
    border-radius: 0 0 20px 20px;
    width: 100%;
    max-width: 760px;
    padding: 16px;
    padding-bottom: 24px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
    animation: ${slideIn} 0.3s ease-out forwards;
    border: 1px solid rgba(255, 255, 255, 0.1);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    position: relative;

    @media (orientation: landscape) {
        padding-bottom: 10px;
    }

    @media (min-width: 768px) {
        max-width: 420px;
        border-radius: 20px;
    }

    @media (min-width: 1200px) {
        max-width: 580px;
    }
`;

const SearchInputWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 12px 42px 12px 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: #333842;
    border-radius: 12px;
    font-size: 16px;
    color: #e0e0e0;
    outline: none;

    &::placeholder {
        color: #808080;
    }

    &:focus {
        border-color: rgba(240, 147, 251, 0.5);
        background-color: #3a3f4a;
    }
`;

const ClearButton = styled.button`
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: #808080;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
    }
`;

const FilterContainer = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 12px;
    margin-bottom: 12px;
    justify-content: center;
    align-items: center;
`;

const FilterButton = styled.button`
    padding: 8px 12px;
    border-radius: 20px;
    border: 1px solid ${props => {
        if (!props.$active) return 'rgba(255, 255, 255, 0.15)';
        switch(props.$category) {
            case 'all': return 'rgba(127, 163, 255, 0.5)';
            case 'memo': return 'rgba(99, 102, 241, 0.5)';
            case 'calendar': return 'rgba(34, 197, 94, 0.5)';
            case 'trash': return 'rgba(236, 72, 153, 0.5)';
            default: return 'rgba(255, 255, 255, 0.15)';
        }
    }};
    background: ${props => {
        if (!props.$active) return 'rgba(255, 255, 255, 0.05)';
        switch(props.$category) {
            case 'all': return 'rgba(127, 163, 255, 0.2)';
            case 'memo': return 'rgba(99, 102, 241, 0.2)';
            case 'calendar': return 'rgba(34, 197, 94, 0.2)';
            case 'trash': return 'rgba(236, 72, 153, 0.2)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    }};
    color: ${props => {
        if (!props.$active) return '#b0b0b0';
        switch(props.$category) {
            case 'all': return '#7fa3ff';
            case 'memo': return '#6366f1';
            case 'calendar': return '#22c55e';
            case 'trash': return '#ec4899';
            default: return '#ffffff';
        }
    }};
    font-size: 13px;
    font-weight: ${props => props.$active ? '700' : '500'};
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;

    &:hover {
        background: ${props => {
            if (props.$active) {
                switch(props.$category) {
                    case 'all': return 'rgba(127, 163, 255, 0.3)';
                    case 'memo': return 'rgba(99, 102, 241, 0.3)';
                    case 'calendar': return 'rgba(34, 197, 94, 0.3)';
                    case 'trash': return 'rgba(236, 72, 153, 0.3)';
                    default: return 'rgba(255, 255, 255, 0.05)';
                }
            }
            return 'rgba(255, 255, 255, 0.08)';
        }};
        border-color: ${props => {
            if (props.$active) {
                switch(props.$category) {
                    case 'all': return 'rgba(127, 163, 255, 0.6)';
                    case 'memo': return 'rgba(99, 102, 241, 0.6)';
                    case 'calendar': return 'rgba(34, 197, 94, 0.6)';
                    case 'trash': return 'rgba(236, 72, 153, 0.6)';
                    default: return 'rgba(255, 255, 255, 0.15)';
                }
            }
            return 'rgba(255, 255, 255, 0.25)';
        }};
    }
`;

const FilterCount = styled.span`
    display: inline-block;
    min-width: 16px;
    text-align: center;
    font-weight: 600;
    font-size: 11px;
`;

const ContentSection = styled.div`
    flex: 1;
    overflow-y: auto;
    margin-top: 12px;

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(240, 147, 251, 0.3);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: rgba(240, 147, 251, 0.5);
    }
`;

const CloseButtonBottom = styled.button`
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #b0b0b0;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10001;

    &:hover {
        background: linear-gradient(180deg, #3a3d45 0%, #2f3239 100%);
        border-color: rgba(255, 255, 255, 0.3);
        color: #ffffff;
        transform: translateX(-50%) scale(1.05);
    }

    &:active {
        transform: translateX(-50%) scale(0.95);
    }
`;

const SectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
`;

const SectionTitle = styled.h3`
    font-size: 13px;
    color: #808080;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
`;

const ClearHistoryButton = styled.button`
    background: none;
    border: none;
    color: #808080;
    font-size: 12px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #ffffff;
    }
`;

const SuggestionList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const SuggestionItem = styled.div`
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #d0d0d0;
    font-size: 14px;

    &:hover {
        background: rgba(255, 255, 255, 0.08);
    }

    svg {
        flex-shrink: 0;
        opacity: 0.6;
    }
`;

const SearchResultList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const SearchResultItem = styled.div`
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.08);
    }
`;

const ResultTitle = styled.div`
    font-size: 15px;
    color: #ffffff;
    font-weight: 500;
    margin-bottom: 4px;

    mark {
        background: rgba(255, 235, 59, 0.3);
        color: #ffeb3b;
        padding: 2px 0;
    }
`;

const ResultPreview = styled.div`
    font-size: 13px;
    color: #b0b0b0;
    line-height: 1.5;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;

    mark {
        background: rgba(255, 235, 59, 0.3);
        color: #ffeb3b;
        padding: 2px 0;
    }
`;

const ResultMeta = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #808080;
`;

const ResultLocation = styled.span`
    color: #4a90e2;
`;

const ResultDate = styled.span`
    color: #808080;
`;

const NoResultText = styled.p`
    font-size: 14px;
    color: #b0b0b0;
    text-align: center;
    margin-top: 40px;
`;

const STORAGE_KEY = 'mindflow_search_history';
const MAX_HISTORY = 5;

// 추천 검색어
const RECOMMENDED_SEARCHES = [
    '오늘 할 일',
    '중요한 메모',
    '회의록',
    '아이디어',
    '프로젝트'
];

const SearchModal = ({ onClose, allData, onSelectResult }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchHistory, setSearchHistory] = useState([]);

    // 검색 기록 로드
    useEffect(() => {
        const history = localStorage.getItem(STORAGE_KEY);
        if (history) {
            setSearchHistory(JSON.parse(history));
        }
    }, []);

    const filters = [
        { id: 'all', label: '전체' },
        { id: 'memo', label: '메모' },
        { id: 'calendar', label: '일정' },
        { id: 'trash', label: '휴지통' },
    ];

    // 검색 기록 저장
    const saveToHistory = (term) => {
        if (term.trim().length < 2) return;

        const newHistory = [
            term,
            ...searchHistory.filter(h => h !== term)
        ].slice(0, MAX_HISTORY);

        setSearchHistory(newHistory);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    };

    // 검색 기록 삭제
    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    // 검색어 하이라이팅
    const highlightText = (text, query) => {
        if (!query || query.length < 2) return text;

        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part) =>
            part.toLowerCase() === query.toLowerCase()
                ? `<mark>${part}</mark>`
                : part
        ).join('');
    };

    // 검색어가 포함된 부분 추출 (전후 맥락 포함)
    const getMatchedPreview = (content, query) => {
        if (!content || !query || query.length < 2) return content?.substring(0, 100) || '';

        const lowerContent = content.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const matchIndex = lowerContent.indexOf(lowerQuery);

        if (matchIndex === -1) {
            // 검색어가 없으면 앞부분만 반환
            return content.substring(0, 100);
        }

        // 검색어 전후 50자씩 추출
        const start = Math.max(0, matchIndex - 50);
        const end = Math.min(content.length, matchIndex + query.length + 50);

        let preview = content.substring(start, end);

        // 앞부분이 잘렸으면 ... 추가
        if (start > 0) preview = '...' + preview;
        // 뒷부분이 잘렸으면 ... 추가
        if (end < content.length) preview = preview + '...';

        return preview;
    };

    // 검색 실행
    const handleSearch = (term) => {
        setSearchTerm(term);
        if (term.trim().length >= 2) {
            saveToHistory(term);
        }
    };

    // 문서 위치 표시
    const getLocation = (item) => {
        if (item.type === 'memo') {
            if (item.folderId) {
                return `메모 > ${item.folderName || '폴더'}`;
            }
            return '메모 > 미분류';
        }
        if (item.type === 'calendar') return '일정';
        if (item.type === 'trash') return '휴지통';
        return '';
    };

    // 날짜 포맷
    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
    };

    // 검색 결과 필터링
    const filteredResults = allData.filter(item => {
        // 시크릿 제외
        if (item.isSecret) return false;

        // 검색어 매칭 (2글자 이상)
        if (searchTerm.length < 2) return false;

        const query = searchTerm.toLowerCase();
        const matchesSearchTerm =
            (item.title && item.title.toLowerCase().includes(query)) ||
            (item.content && item.content.toLowerCase().includes(query));

        if (!matchesSearchTerm) return false;

        // 카테고리 필터
        return activeFilter === 'all' || activeFilter === item.type;
    });

    // 카테고리별 검색 결과 개수 계산
    const getCategoryCount = (categoryId) => {
        if (searchTerm.length < 2) return 0;

        const query = searchTerm.toLowerCase();
        return allData.filter(item => {
            if (item.isSecret) return false;

            const matchesSearchTerm =
                (item.title && item.title.toLowerCase().includes(query)) ||
                (item.content && item.content.toLowerCase().includes(query));

            if (!matchesSearchTerm) return false;

            return categoryId === 'all' || item.type === categoryId;
        }).length;
    };

    return (
      <Portal>
        <Overlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <SearchInputWrapper>
                    <SearchInput
                        type="text"
                        placeholder="검색어를 입력하세요 (최소 2글자)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                    {searchTerm && (
                        <ClearButton onClick={() => setSearchTerm('')}>
                            <X size={18} />
                        </ClearButton>
                    )}
                </SearchInputWrapper>

                <FilterContainer>
                    {filters.map(filter => {
                        const count = getCategoryCount(filter.id);
                        return (
                            <FilterButton
                                key={filter.id}
                                $active={activeFilter === filter.id}
                                $category={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                            >
                                <span>{filter.label}</span>
                                <FilterCount>
                                    {searchTerm.length >= 2 ? count : ''}
                                </FilterCount>
                            </FilterButton>
                        );
                    })}
                </FilterContainer>

                <ContentSection>
                    {searchTerm.length < 2 ? (
                        // 검색어 입력 전: 추천 검색어 또는 검색 기록
                        searchHistory.length > 0 ? (
                            <>
                                <SectionHeader>
                                    <SectionTitle>
                                        <Clock size={14} />
                                        최근 검색
                                    </SectionTitle>
                                    <ClearHistoryButton onClick={clearHistory}>
                                        전체 삭제
                                    </ClearHistoryButton>
                                </SectionHeader>
                                <SuggestionList>
                                    {searchHistory.map((term, index) => (
                                        <SuggestionItem
                                            key={index}
                                            onClick={() => handleSearch(term)}
                                        >
                                            <Search size={16} />
                                            {term}
                                        </SuggestionItem>
                                    ))}
                                </SuggestionList>
                            </>
                        ) : (
                            <>
                                <SectionHeader>
                                    <SectionTitle>
                                        <TrendingUp size={14} />
                                        추천 검색어
                                    </SectionTitle>
                                </SectionHeader>
                                <SuggestionList>
                                    {RECOMMENDED_SEARCHES.map((term, index) => (
                                        <SuggestionItem
                                            key={index}
                                            onClick={() => handleSearch(term)}
                                        >
                                            <Search size={16} />
                                            {term}
                                        </SuggestionItem>
                                    ))}
                                </SuggestionList>
                            </>
                        )
                    ) : (
                        // 검색 결과
                        <SearchResultList>
                            {filteredResults.length > 0 ? (
                                filteredResults.map(item => (
                                    <SearchResultItem
                                        key={item.id}
                                        onClick={() => {
                                            saveToHistory(searchTerm);
                                            onSelectResult(item.id, item.type);
                                        }}
                                    >
                                        <ResultTitle
                                            dangerouslySetInnerHTML={{
                                                __html: highlightText(item.title || '제목 없음', searchTerm)
                                            }}
                                        />
                                        <ResultPreview
                                            dangerouslySetInnerHTML={{
                                                __html: highlightText(getMatchedPreview(item.content, searchTerm), searchTerm)
                                            }}
                                        />
                                        <ResultMeta>
                                            <ResultLocation>{getLocation(item)}</ResultLocation>
                                            {(item.updatedAt || item.createdAt) && (
                                                <>
                                                    <span>•</span>
                                                    <ResultDate>
                                                        {formatDate(item.updatedAt || item.createdAt)}
                                                    </ResultDate>
                                                </>
                                            )}
                                        </ResultMeta>
                                    </SearchResultItem>
                                ))
                            ) : (
                                <NoResultText>검색 결과가 없습니다.</NoResultText>
                            )}
                        </SearchResultList>
                    )}
                </ContentSection>

                <CloseButtonBottom onClick={onClose}>
                    <X size={20} />
                </CloseButtonBottom>
            </ModalContent>
        </Overlay>
      </Portal>
    );
};

export default SearchModal;
