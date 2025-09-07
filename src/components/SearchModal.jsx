// src/components/SearchModal.jsx

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

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
    z-index: 2000;
`;

const ModalContent = styled.div`
    background: #f0f2f5;
    border-radius: 0 0 20px 20px;
    width: 100%;
    max-width: 450px;
    padding: 16px;
    padding-bottom: 24px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    animation: ${slideIn} 0.3s ease-out forwards;
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 12px 16px;
    border: none;
    background-color: #e2e8f0;
    border-radius: 12px;
    font-size: 16px;
    color: #4a5568;
    outline: none;
    
    &::placeholder {
        color: #a0aec0;
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
    background-color: ${props => props.$active ? '#4a90e2' : '#e2e8f0'};
    color: ${props => props.$active ? '#fff' : '#4a5568'};
    border: none;
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
        background-color: ${props => props.$active ? '#3b78c4' : '#d2d6db'};
    }
`;

const SearchResultList = styled.div`
    margin-top: 16px;
    max-height: 400px;
    overflow-y: auto;
`;

const SearchResultItem = styled.div`
    padding: 12px 0;
    border-bottom: 1px solid #e2e8f0;
    cursor: pointer;
    &:last-child {
        border-bottom: none;
    }
`;

const SearchResultText = styled.p`
    font-size: 14px;
    color: #4a5568;
    margin: 0;
`;

const NoResultText = styled.p`
    font-size: 14px;
    color: #718096;
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
        
        // 시크릿 모드 필터가 선택되지 않았거나 검색어가 없으면 시크릿 데이터를 숨김
        const isSecretFilterActive = activeFilters.includes('secret');
        if (item.isSecret && !isSecretFilterActive) {
            return false;
        }

        const matchesSearchTerm = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  item.content.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesCategory && matchesSearchTerm;
    });

    return (
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
    );
};

export default SearchModal;