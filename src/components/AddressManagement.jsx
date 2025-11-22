// src/components/AddressManagement.jsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import AddressInput from './AddressInput';
import ConfirmModal from './ConfirmModal';
import { SAVED_ADDRESSES_KEY } from './RestaurantAutocomplete';

const Section = styled.div`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%),
    linear-gradient(180deg, #2a2d35 0%, #25282f 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
`;

const SectionTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 1;
`;

const SectionDescription = styled.p`
  margin: 0 0 16px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
  position: relative;
  z-index: 1;
`;

const SavedAddressDisplay = styled.div`
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
`;

const AddressLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
`;

const AddressText = styled.div`
  font-size: 15px;
  color: #f0f0f0;
  font-weight: 500;
  line-height: 1.4;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  position: relative;
  z-index: 1;
`;

const Button = styled.button`
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.$variant === 'primary' ? `
    background: rgba(240, 147, 251, 0.2);
    color: #f093fb;
    border: 1px solid rgba(240, 147, 251, 0.3);

    &:hover {
      background: rgba(240, 147, 251, 0.3);
      border-color: rgba(240, 147, 251, 0.5);
    }
  ` : `
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  padding: 32px 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  position: relative;
  z-index: 1;
`;

const AddressManagement = ({ showToast }) => {
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [editingSlot, setEditingSlot] = useState(null); // 0, 1, 2 또는 null
  const [deleteConfirmSlot, setDeleteConfirmSlot] = useState(null); // 삭제 확인 모달용

  // 저장된 주소들 불러오기
  useEffect(() => {
    loadSavedAddresses();
  }, []);

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

  // 주소 선택 핸들러
  const handleAddressSelect = (address) => {
    const addressData = {
      addressName: address.addressName,
      roadAddress: address.roadAddress || '',
      latitude: address.latitude,
      longitude: address.longitude,
      label: '', // 사용자 커스텀 라벨
      savedAt: new Date().toISOString(),
    };

    const newAddresses = [...savedAddresses];
    newAddresses[editingSlot] = addressData;

    // 로컬 스토리지에 저장
    localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(newAddresses));
    setSavedAddresses(newAddresses);
    setEditingSlot(null);
    showToast?.('주소가 저장되었습니다.');
  };

  // 주소 삭제 요청
  const handleDeleteAddress = (slotIndex) => {
    setDeleteConfirmSlot(slotIndex);
  };

  // 주소 삭제 실행
  const executeDeleteAddress = () => {
    if (deleteConfirmSlot === null) return;

    const newAddresses = [...savedAddresses];
    newAddresses[deleteConfirmSlot] = null;

    localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(newAddresses));
    setSavedAddresses(newAddresses);
    setDeleteConfirmSlot(null);
    showToast?.('주소가 삭제되었습니다.');
  };

  return (
    <Section>
      <SectionTitle>
        🏠 저장 주소 관리 (최대 3개)
      </SectionTitle>
      <SectionDescription>
        자주 사용하는 주소를 최대 3개까지 저장할 수 있습니다. (예: 집, 회사, 자주 가는 곳)
      </SectionDescription>

      {editingSlot !== null ? (
        <>
          <SectionDescription>
            주소 슬롯 {editingSlot + 1}에 저장할 주소를 입력하세요.
          </SectionDescription>
          <AddressInput
            onSelect={handleAddressSelect}
            initialValue=""
            showToast={showToast}
          />
          <ButtonGroup>
            <Button onClick={() => setEditingSlot(null)}>
              취소
            </Button>
          </ButtonGroup>
        </>
      ) : (
        <>
          {[0, 1, 2].map((slotIndex) => {
            const address = savedAddresses[slotIndex];
            return (
              <div key={slotIndex} style={{ marginBottom: '12px' }}>
                {address ? (
                  <>
                    <SavedAddressDisplay>
                      <AddressLabel>주소 {slotIndex + 1}</AddressLabel>
                      <AddressText>
                        {address.roadAddress || address.addressName}
                      </AddressText>
                    </SavedAddressDisplay>
                    <ButtonGroup>
                      <Button $variant="primary" onClick={() => setEditingSlot(slotIndex)}>
                        변경
                      </Button>
                      <Button onClick={() => handleDeleteAddress(slotIndex)}>
                        삭제
                      </Button>
                    </ButtonGroup>
                  </>
                ) : (
                  <>
                    <EmptyState style={{ padding: '16px', marginBottom: '8px' }}>
                      주소 {slotIndex + 1} 미등록
                    </EmptyState>
                    <ButtonGroup>
                      <Button $variant="primary" onClick={() => setEditingSlot(slotIndex)}>
                        주소 등록
                      </Button>
                    </ButtonGroup>
                  </>
                )}
              </div>
            );
          })}
        </>
      )}

      {deleteConfirmSlot !== null && (
        <ConfirmModal
          message="저장된 주소를 삭제하시겠습니까?"
          onConfirm={executeDeleteAddress}
          onCancel={() => setDeleteConfirmSlot(null)}
        />
      )}
    </Section>
  );
};

export default AddressManagement;
