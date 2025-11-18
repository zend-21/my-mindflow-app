// src/components/RestaurantAutocomplete.jsx

import React, { useState, useEffect, useRef } from 'react';
import { searchRestaurants, getCurrentLocation, searchNearbyRestaurants } from '../services/kakaoMapService';
import AddressInput from './AddressInput';
import './RestaurantAutocomplete.css';

// 로컬 스토리지 키
const SAVED_ADDRESSES_KEY = 'mindflow_saved_addresses'; // 최대 3개 저장
const LOCATION_MODE_KEY = 'mindflow_location_mode';

const RestaurantAutocomplete = ({ onSelect, initialValue = '', showToast }) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // 위치 모드: 'current' (현재위치), 'address1', 'address2', 'address3' (저장주소 슬롯)
  const [locationMode, setLocationMode] = useState(() => {
    return localStorage.getItem(LOCATION_MODE_KEY) || 'address1';
  });

  const [savedAddresses, setSavedAddresses] = useState([]); // 최대 3개 저장 가능
  const [currentLocation, setCurrentLocation] = useState(null); // 현재 GPS 위치

  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // 저장된 주소들 불러오기 (최대 3개)
  useEffect(() => {
    const loadSavedAddresses = () => {
      const saved = localStorage.getItem(SAVED_ADDRESSES_KEY);
      if (saved) {
        try {
          const addresses = JSON.parse(saved);
          setSavedAddresses(Array.isArray(addresses) ? addresses : []);
        } catch (error) {
          console.error('저장된 주소 불러오기 실패:', error);
          setSavedAddresses([]);
        }
      } else {
        setSavedAddresses([]);
      }
    };

    loadSavedAddresses();
  }, []);

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
  }, [query, locationMode]); // locationMode 변경 시에도 재검색

  const performSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim() === '') {
      return;
    }

    try {
      setIsLoading(true);

      // 현재 선택된 위치 모드에 따라 기준 위치 결정
      let baseLocation = null;

      if (locationMode === 'current' && currentLocation) {
        // 현재위치 모드
        baseLocation = currentLocation;
      } else if (locationMode.startsWith('address')) {
        // 저장주소 슬롯 (address1, address2, address3)
        const slotIndex = parseInt(locationMode.replace('address', '')) - 1;
        const address = savedAddresses[slotIndex];
        if (address) {
          baseLocation = {
            latitude: address.latitude,
            longitude: address.longitude,
          };
        }
      }

      // 위치 기반 검색 (카카오 API는 페이지당 최대 15개, 최대 3페이지까지 가져옴)
      let searchResults = [];
      const maxPages = 3; // 15 x 3 = 45개

      for (let page = 1; page <= maxPages; page++) {
        let pageResults;
        if (baseLocation) {
          pageResults = await searchRestaurants(searchQuery, {
            x: baseLocation.longitude,
            y: baseLocation.latitude,
            radius: 5000, // 5km 반경
            size: 15,
            page: page
          });
        } else {
          pageResults = await searchRestaurants(searchQuery, {
            size: 15,
            page: page
          });
        }

        searchResults = [...searchResults, ...pageResults];

        // 결과가 15개 미만이면 더 이상 페이지가 없음
        if (pageResults.length < 15) {
          break;
        }
      }

      // 부분 일치 검색: 검색어가 2자 이상이면 항상 시도
      if (searchQuery.length >= 2) {
        // 검색어를 분석하여 부분 검색어 생성
        const partialQueries = new Set();

        // 1. 띄어쓰기로 분리된 단어들
        const words = searchQuery.split(/\s+/).filter(word => word.length > 1);
        words.forEach(word => partialQueries.add(word));

        // 2. 한글 자음/모음 분리 없이 앞에서부터 2-4글자씩 잘라서 검색
        // 예: "고은결김밥" → "고은", "고은결", "고은결김"
        if (searchQuery.length >= 2 && !searchQuery.includes(' ')) {
          for (let len = 2; len <= Math.min(4, searchQuery.length - 1); len++) {
            partialQueries.add(searchQuery.substring(0, len));
          }
        }

        // 부분 검색어로 추가 검색 (중복 제거)
        for (const partialQuery of partialQueries) {
          // 원본 검색어와 같으면 스킵 (이미 검색했음)
          if (partialQuery === searchQuery.trim()) continue;

          try {
            let partialResults = [];
            // 부분 검색은 1페이지만
            if (baseLocation) {
              partialResults = await searchRestaurants(partialQuery, {
                x: baseLocation.longitude,
                y: baseLocation.latitude,
                radius: 5000,
                size: 15,
                page: 1
              });
            } else {
              partialResults = await searchRestaurants(partialQuery, {
                size: 15,
                page: 1
              });
            }

            // 중복 제거하면서 결과 추가
            partialResults.forEach(result => {
              if (!searchResults.find(r => r.id === result.id)) {
                searchResults.push(result);
              }
            });
          } catch (error) {
            // 부분 검색 실패는 무시
            console.warn(`부분 검색 실패 (${partialQuery}):`, error);
          }
        }
      }

      // 검색어와의 관련도로 결과 정렬
      const normalizedQuery = searchQuery.toLowerCase().replace(/\s+/g, '');
      searchResults.sort((a, b) => {
        const aName = a.name.toLowerCase().replace(/\s+/g, '');
        const bName = b.name.toLowerCase().replace(/\s+/g, '');

        // 정확히 일치하는 것 우선
        const aExact = aName === normalizedQuery;
        const bExact = bName === normalizedQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // 시작 부분 일치 우선
        const aStarts = aName.startsWith(normalizedQuery);
        const bStarts = bName.startsWith(normalizedQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // 포함 여부
        const aIncludes = aName.includes(normalizedQuery);
        const bIncludes = bName.includes(normalizedQuery);
        if (aIncludes && !bIncludes) return -1;
        if (!aIncludes && bIncludes) return 1;

        // 거리순 정렬 (거리 정보가 있는 경우)
        if (a.distance && b.distance) {
          return a.distance - b.distance;
        }

        return 0;
      });

      setResults(searchResults);
      setShowResults(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('검색 실패:', error);
      if (error.message.includes('카카오 REST API 키')) {
        showToast?.('카카오 API 키가 설정되지 않았습니다. KAKAO_API_KEY_SETUP.md를 참고하세요.');
      } else {
        showToast?.('가게 검색에 실패했습니다.');
      }
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 위치 모드 변경 핸들러
  const handleLocationModeChange = async (mode) => {
    // 저장주소 슬롯이 비어있으면 주소 등록 모달 표시
    if (mode.startsWith('address')) {
      const slotIndex = parseInt(mode.replace('address', '')) - 1;
      if (!savedAddresses[slotIndex]) {
        setShowAddressModal(true);
        setLocationMode(mode); // 모드는 미리 설정
        localStorage.setItem(LOCATION_MODE_KEY, mode);
        return;
      }
    }

    setLocationMode(mode);
    localStorage.setItem(LOCATION_MODE_KEY, mode);

    // 현재위치 모드로 변경 시 GPS 위치 가져오기
    if (mode === 'current' && !currentLocation) {
      await fetchCurrentLocation();
    }

    // 모드 변경 후 검색어가 있으면 재검색
    if (query.trim() !== '') {
      await performSearch(query);
    }
  };

  // 주소 설정
  const handleAddressSelect = (address) => {
    const locationData = {
      addressName: address.addressName,
      roadAddress: address.roadAddress || '',
      latitude: address.latitude,
      longitude: address.longitude,
      label: '', // 사용자가 설정할 수 있는 라벨 (예: 집, 회사 등)
    };

    // 현재 선택된 슬롯에 저장
    const slotIndex = parseInt(locationMode.replace('address', '')) - 1;
    const newAddresses = [...savedAddresses];
    newAddresses[slotIndex] = locationData;

    localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(newAddresses));
    setSavedAddresses(newAddresses);
    setShowAddressModal(false);
    showToast?.('주소가 저장되었습니다.');

    // 검색어가 있으면 재검색
    if (query.trim() !== '') {
      performSearch(query);
    }
  };

  // 현재 GPS 위치 가져오기
  const fetchCurrentLocation = async () => {
    try {
      setIsLoading(true);
      showToast?.('현재 위치를 가져오는 중...');

      const location = await getCurrentLocation();
      setCurrentLocation(location);

      showToast?.('현재 위치를 가져왔습니다.');
    } catch (error) {
      console.error('위치 가져오기 실패:', error);
      showToast?.('위치 정보를 가져올 수 없습니다. 위치 권한을 확인하세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 가게 선택
  const handleSelect = (restaurant) => {
    setQuery(restaurant.name);
    setShowResults(false);
    setResults([]);
    onSelect(restaurant);
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

  // 주소 라벨 가져오기
  const getAddressLabel = (slotIndex) => {
    const address = savedAddresses[slotIndex];
    if (!address) return `주소${slotIndex + 1}`;
    if (address.label) return address.label;

    // 주소에서 동/구 이름 추출 (예: "서울 강남구" -> "강남")
    const addressParts = address.addressName.split(' ');
    if (addressParts.length >= 2) {
      const district = addressParts[1]; // "강남구"
      return district.replace('구', '').replace('동', ''); // "강남"
    }
    return `주소${slotIndex + 1}`;
  };

  return (
    <div className="restaurant-autocomplete">
      {/* 위치 모드 선택 탭 */}
      <div className="location-mode-tabs">
        <button
          type="button"
          className={`mode-tab ${locationMode === 'current' ? 'active' : ''}`}
          onClick={() => handleLocationModeChange('current')}
          disabled={isLoading}
        >
          현재위치
        </button>
        <button
          type="button"
          className={`mode-tab ${locationMode === 'address1' ? 'active' : ''}`}
          onClick={() => handleLocationModeChange('address1')}
          disabled={isLoading}
        >
          {getAddressLabel(0)}
          {!savedAddresses[0] && <span className="mode-badge">미설정</span>}
        </button>
        <button
          type="button"
          className={`mode-tab ${locationMode === 'address2' ? 'active' : ''}`}
          onClick={() => handleLocationModeChange('address2')}
          disabled={isLoading}
        >
          {getAddressLabel(1)}
          {!savedAddresses[1] && <span className="mode-badge">미설정</span>}
        </button>
        <button
          type="button"
          className={`mode-tab ${locationMode === 'address3' ? 'active' : ''}`}
          onClick={() => handleLocationModeChange('address3')}
          disabled={isLoading}
        >
          {getAddressLabel(2)}
          {!savedAddresses[2] && <span className="mode-badge">미설정</span>}
        </button>
      </div>

      <div className="autocomplete-input-wrapper">
        <input
          ref={inputRef}
          id="restaurantName"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder="가게 이름을 입력하세요 (예: 피자헛 강남)"
          className="autocomplete-input"
        />
      </div>

      {isLoading && (
        <div className="autocomplete-loading">검색 중...</div>
      )}

      {showResults && results.length > 0 && (
        <div ref={resultsRef} className="autocomplete-results">
          {results.map((restaurant, index) => (
            <div
              key={restaurant.id}
              className={`autocomplete-result-item ${
                index === selectedIndex ? 'selected' : ''
              }`}
              onClick={() => handleSelect(restaurant)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="result-name">{restaurant.name}</div>
              <div className="result-address">{restaurant.address}</div>
              <div className="result-info">
                <span className="result-category">{restaurant.category}</span>
                {restaurant.distance && (
                  <span className="result-distance">
                    {restaurant.distance >= 1000
                      ? `${(restaurant.distance / 1000).toFixed(1)}km`
                      : `${restaurant.distance}m`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && !isLoading && results.length === 0 && query.trim() !== '' && (
        <div className="autocomplete-no-results">
          검색 결과가 없습니다.
        </div>
      )}

      {/* 주소 설정 모달 */}
      {showAddressModal && (
        <div className="location-modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="location-modal" onClick={(e) => e.stopPropagation()}>
            <h3>주소 등록</h3>
            <p>검색 기준으로 사용할 위치를 입력하세요.</p>
            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              <AddressInput
                onSelect={handleAddressSelect}
                initialValue=""
                showToast={showToast}
              />
            </div>
            <div className="location-modal-actions">
              <button
                className="modal-cancel-btn"
                onClick={() => setShowAddressModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantAutocomplete;
export { SAVED_ADDRESSES_KEY }; // Profile 페이지에서 사용할 수 있도록 export
