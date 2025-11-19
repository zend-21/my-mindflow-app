import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './AddressManageModal.css';
import AddressInput from './AddressInput';

// 아이콘 옵션 (시크릿 페이지에서 사용하는 아이콘 재사용)
const ICON_OPTIONS = [
  { id: 'home', name: '집', svg: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { id: 'briefcase', name: '회사', svg: 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16M2 7h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z' },
  { id: 'users', name: '가족', svg: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  { id: 'heart', name: '즐겨찾기', svg: 'M20.8 4.6a5.5 5.5 0 0 0-7.7 0l-1.1 1-1.1-1a5.5 5.5 0 0 0-7.7 7.8l1 1 7.8 7.8 7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z' },
  { id: 'map', name: '위치', svg: 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z' },
];

const AddressManageModal = ({
  isOpen,
  onClose,
  slotIndex,
  currentAddress,
  onSave,
  onDelete,
  showToast
}) => {
  const [selectedIcon, setSelectedIcon] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [baseAddress, setBaseAddress] = useState(null); // 지번/도로명 주소
  const [detailAddress, setDetailAddress] = useState(''); // 동/호수
  const [showAddressInput, setShowAddressInput] = useState(false);

  useEffect(() => {
    if (isOpen && currentAddress) {
      setSelectedIcon(currentAddress.icon || '');
      setCustomLabel(currentAddress.label || '');
      setBaseAddress({
        addressName: currentAddress.addressName,
        roadAddress: currentAddress.roadAddress,
        latitude: currentAddress.latitude,
        longitude: currentAddress.longitude,
      });
      setDetailAddress(currentAddress.detailAddress || '');
    } else if (isOpen && !currentAddress) {
      setSelectedIcon('');
      setCustomLabel('');
      setBaseAddress(null);
      setDetailAddress('');
    }
  }, [isOpen, currentAddress]);

  // body 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleIconSelect = (iconId) => {
    setSelectedIcon(iconId);
    setCustomLabel(''); // 아이콘 선택시 커스텀 라벨 초기화
  };

  const handleLabelChange = (e) => {
    const value = e.target.value;
    // 한글 기준 3글자까지만 허용
    if (value.length <= 3) {
      setCustomLabel(value);
      if (value) {
        setSelectedIcon(''); // 커스텀 라벨 입력시 아이콘 선택 초기화
      }
    }
  };

  const handleAddressSelect = (selectedAddress) => {
    setBaseAddress({
      addressName: selectedAddress.addressName,
      roadAddress: selectedAddress.roadAddress || '',
      latitude: selectedAddress.latitude,
      longitude: selectedAddress.longitude,
    });
    setShowAddressInput(false);
    showToast?.('주소가 선택되었습니다.');
  };

  const handleSave = () => {
    if (!baseAddress) {
      showToast?.('주소를 선택해주세요.');
      return;
    }

    if (!selectedIcon && !customLabel) {
      showToast?.('아이콘을 선택하거나 라벨을 입력해주세요.');
      return;
    }

    const savedData = {
      ...baseAddress,
      detailAddress: detailAddress.trim(),
      icon: selectedIcon,
      label: customLabel,
    };

    onSave(slotIndex, savedData);
    onClose();
    showToast?.('주소가 저장되었습니다.');
  };

  const handleDelete = () => {
    if (window.confirm('이 주소를 삭제하시겠습니까?')) {
      onDelete(slotIndex);
      onClose();
      showToast?.('주소가 삭제되었습니다.');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="address-manage-overlay">
        <div className="address-manage-modal">
          <div className="address-manage-header">
            <h3>주소 관리</h3>
            <button className="address-manage-close" onClick={onClose}>×</button>
          </div>

          <div className="address-manage-content">
            {/* 아이콘 선택 또는 라벨 입력 */}
            <div className="address-manage-section">
              <label className="section-label">아이콘 선택</label>
              <div className="icon-options-compact">
                {ICON_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`icon-option-compact ${selectedIcon === option.id ? 'selected' : ''}`}
                    onClick={() => handleIconSelect(option.id)}
                    title={option.name}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={option.svg} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* 커스텀 라벨 입력 */}
            <div className="address-manage-section">
              <label className="section-label">또는 라벨 입력 (최대 3글자)</label>
              <input
                type="text"
                className="custom-label-input"
                value={customLabel}
                onChange={handleLabelChange}
                placeholder="예: 집, 회사"
                maxLength={3}
              />
            </div>

            {/* 주소 선택 */}
            <div className="address-manage-section">
              <label className="section-label">주소</label>
              {baseAddress ? (
                <div className="selected-address-compact">
                  <div className="address-text">
                    <div className="address-name">{baseAddress.addressName}</div>
                    {baseAddress.roadAddress && (
                      <div className="road-address">{baseAddress.roadAddress}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="change-address-btn-compact"
                    onClick={() => setShowAddressInput(true)}
                  >
                    변경
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="select-address-btn"
                  onClick={() => setShowAddressInput(true)}
                >
                  주소 검색
                </button>
              )}
            </div>

            {/* 상세주소 (동/호수) 입력 */}
            {baseAddress && (
              <div className="address-manage-section">
                <label className="section-label">상세주소 (동/호수)</label>
                <input
                  type="text"
                  className="detail-address-input"
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  placeholder="예: 101동 202호"
                />
              </div>
            )}
          </div>

          <div className="address-manage-actions">
            {currentAddress && (
              <button
                type="button"
                className="delete-btn-compact"
                onClick={handleDelete}
              >
                삭제
              </button>
            )}
            <button
              type="button"
              className="save-btn-compact"
              onClick={handleSave}
            >
              저장
            </button>
          </div>
        </div>
      </div>

      {showAddressInput && (
        <div className="address-input-overlay">
          <div className="address-input-container">
            <div className="address-input-header">
              <h3>주소 검색</h3>
              <button className="address-input-close" onClick={() => setShowAddressInput(false)}>×</button>
            </div>
            <div className="address-input-content">
              <AddressInput
                onSelect={handleAddressSelect}
                initialValue=""
                showToast={showToast}
              />
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default AddressManageModal;
