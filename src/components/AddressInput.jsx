// src/components/AddressInput.jsx

import React, { useState, useEffect, useRef } from 'react';
import { searchAddressWithPlace, getAddressFromCoords } from '../services/kakaoAddressService';
import './AddressInput.css';

const AddressInput = ({ onSelect, initialValue = '', showToast }) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // 검색 디바운스 (300ms 대기)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim() === '') {
      setResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      await performSearch(query);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim() === '') {
      return;
    }

    try {
      setIsLoading(true);

      const searchResults = await searchAddressWithPlace(searchQuery);

      setResults(searchResults);
      setShowResults(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('주소 검색 실패:', error);
      if (error.message.includes('카카오 REST API 키')) {
        showToast?.('카카오 API 키가 설정되지 않았습니다.');
      } else {
        showToast?.('주소 검색에 실패했습니다.');
      }
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 주소 선택
  const handleSelect = (address) => {
    const displayText = address.type === 'address'
      ? (address.roadAddress?.addressName || address.addressName)
      : `${address.placeName} (${address.addressName})`;

    setQuery(displayText);
    setShowResults(false);
    setResults([]);

    // 부모 컴포넌트에 선택된 주소 전달
    onSelect({
      addressName: address.addressName,
      roadAddress: address.roadAddress?.addressName || address.roadAddress || '',
      latitude: address.latitude,
      longitude: address.longitude,
      type: address.type,
    });
  };

  // 키보드 네비게이션
  const handleKeyDown = (e) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // 외부 클릭 시 결과 숨김
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="address-input">
      <div className="address-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder="주소를 입력하세요 (예: 강남구 테헤란로 123 또는 서초동)"
          className="address-input-field"
        />
      </div>

      {isLoading && (
        <div className="address-loading">검색 중...</div>
      )}

      {showResults && results.length > 0 && (
        <div ref={resultsRef} className="address-results">
          {results.map((address, index) => (
            <div
              key={`${address.type}-${index}`}
              className={`address-result-item ${
                index === selectedIndex ? 'selected' : ''
              }`}
              onClick={() => handleSelect(address)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {address.type === 'address' ? (
                // 주소 검색 결과
                <>
                  <div className="address-name">
                    {address.roadAddress?.addressName || address.addressName}
                  </div>
                  {address.roadAddress && address.jibunAddress && (
                    <div className="address-sub">
                      지번: {address.jibunAddress.addressName}
                    </div>
                  )}
                </>
              ) : (
                // 장소 검색 결과
                <>
                  <div className="address-name">{address.placeName}</div>
                  <div className="address-sub">{address.addressName}</div>
                  {address.category && (
                    <div className="address-category">{address.category}</div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showResults && !isLoading && results.length === 0 && query.trim() !== '' && (
        <div className="address-no-results">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
};

export default AddressInput;
