// src/components/SearchModal.jsx

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
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
    /* ★★★ 수정: 상단에 붙도록 정렬 ★★★ */
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

    /* 가로 모드일 때 padding-bottom을 줄여 공간 확보 */
    @media (orientation: landscape) {
        padding-bottom: 10px;
    }

    /* ✅ PC 화면일 때 (768px 이상) */
    @media (min-width: 768px) {
        max-width: 420px;   /* PC에서 폭 제한 */
        border-radius: 20px; /* PC에선 더 부드럽게 */
    }

    /* ✅ 큰 데스크탑 화면일 때 */
    @media (min-width: 1200px) {
        max-width: 580px;
    }
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 12px 16px;
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

const FilterContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
    margin-bottom: 12px;
`;

const FilterButton = styled.button`
    background: ${props => props.$active
        ? 'linear-gradient(135deg, #d0d0d0, #a8a8a8)'
        : 'rgba(255, 255, 255, 0.05)'};
    color: ${props => props.$active ? '#1a1a1a' : '#b0b0b0'};
    border: 1px solid ${props => props.$active
        ? 'rgba(255, 255, 255, 0.3)'
        : 'rgba(255, 255, 255, 0.1)'};
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: ${props => props.$active ? '600' : '400'};
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background-color: ${props => props.$active
            ? 'linear-gradient(135deg, rgba(240, 147, 251, 0.4), rgba(245, 87, 108, 0.4))'
            : 'rgba(255, 255, 255, 0.08)'};
        color: #ffffff;
    }
`;

const SearchResultList = styled.div`
    margin-top: 16px;
    max-height: 400px;
    overflow-y: auto;

    /* 커스텀 스크롤바 */
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

const SearchResultItem = styled.div`
    padding: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;

    &:last-child {
        border-bottom: none;
    }

    &:hover {
        background: rgba(255, 255, 255, 0.05);
    }
`;

const SearchResultText = styled.p`
    font-size: 14px;
    color: #d0d0d0;
    margin: 0;
`;

const NoResultText = styled.p`
    font-size: 14px;
    color: #b0b0b0;
    text-align: center;
    margin-top: 20px;
`;

const SearchModal = ({ onClose, allData, onSelectResult }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState(['all']);

    const filters = [
        { id: 'all', label: '전체' },
        { id: 'memo', label: '메모' },
        { id: 'calendar', label: '일정' },
        { id: 'secret', label: '시크릿' },
        { id: 'review', label: '리뷰' },
    ];

    const handleFilterClick = (id) => {
        if (id === 'all') {
            setActiveFilters(['all']);
        } else {
            if (activeFilters.includes('all')) {
                setActiveFilters([id]);
            } else {
                setActiveFilters(prev => 
                    prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
                );
            }
        }
        setSearchTerm(''); // 필터 변경 시 검색어 초기화
    };

    const filteredResults = allData.filter(item => {
        const matchesCategory = activeFilters.includes('all') || activeFilters.includes(item.type);
        
        const isSecretFilterActive = activeFilters.includes('secret');
        if (item.isSecret && !isSecretFilterActive) {
            return false;
        }

        const matchesSearchTerm = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  item.content.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesCategory && matchesSearchTerm;
    });

    return (
      <Portal>
        <Overlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <SearchInput
                    type="text"
                    placeholder="모든 항목을 검색하세요..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
                <FilterContainer>
                    {filters.map(filter => (
                        <FilterButton
                            key={filter.id}
                            $active={activeFilters.includes(filter.id)}
                            onClick={() => handleFilterClick(filter.id)}
                        >
                            {filter.label}
                        </FilterButton>
                    ))}
                </FilterContainer>
                <SearchResultList>
                    {searchTerm.length > 0 || activeFilters.length > 0 ? (
                        filteredResults.length > 0 ? (
                            filteredResults.map(item => (
                                <SearchResultItem key={item.id} onClick={() => onSelectResult(item.id, item.type)}>
                                    <SearchResultText>{item.title}</SearchResultText>
                                </SearchResultItem>
                            ))
                        ) : (
                            <NoResultText>검색 결과가 없습니다.</NoResultText>
                        )
                    ) : (
                        <NoResultText>검색어를 입력하거나 필터를 선택해 주세요.</NoResultText>
                    )}
                </SearchResultList>
            </ModalContent>
        </Overlay>
      </Portal>
    );
};

export default SearchModal;