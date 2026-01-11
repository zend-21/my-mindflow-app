// src/components/TrashPage.jsx

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTrashContext } from '../contexts/TrashContext';
import ConfirmationModal from './ConfirmationModal';
import Portal from './Portal';
import { verifyPassword } from '../utils/encryption';
import * as S from './TrashPage.styles';

const TrashPage = ({ showToast }) => {
    const {
        trashedItems,
        autoDeletePeriod,
        restoreFromTrash,
        permanentDelete
    } = useTrashContext();

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);

    // 검색/필터/정렬 상태
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'memo', 'schedule', 'secret', 'review'
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest'

    // 상세보기 모달 상태
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // PIN 입력 모달 상태
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');
    const [pendingSecretItem, setPendingSecretItem] = useState(null);
    const [decryptedSecretContent, setDecryptedSecretContent] = useState({});

    const handleToggleSelect = (id) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleItemClick = (item, event) => {
        event.stopPropagation();

        // 시크릿 문서인 경우
        if (item.type === 'secret') {
            // 이미 복호화된 경우 바로 표시
            if (decryptedSecretContent[item.id]) {
                setSelectedItem(item);
                setIsDetailModalOpen(true);
            } else {
                // PIN 입력 모달 열기
                setPendingSecretItem(item);
                setIsPinModalOpen(true);
                setPinInput('');
                setPinError('');
            }
        } else {
            // 일반 문서는 바로 표시
            setSelectedItem(item);
            setIsDetailModalOpen(true);
        }
    };

    const handlePinKeyPress = (key) => {
        if (key === 'backspace') {
            setPinInput(prev => prev.slice(0, -1));
            setPinError('');
        } else if (pinInput.length < 6) {
            const newPin = pinInput + key;
            setPinInput(newPin);
            setPinError('');

            // 6자리가 되면 자동으로 검증
            if (newPin.length === 6) {
                handlePinSubmit(newPin);
            }
        }
    };

    const handlePinSubmit = async (pin) => {
        try {
            // PIN 검증
            const storedHash = localStorage.getItem('secretPagePin');
            if (!storedHash) {
                setPinError('PIN이 설정되지 않았습니다');
                setPinInput('');
                return;
            }

            const isValid = await verifyPassword(pin, storedHash);
            if (!isValid) {
                setPinError('PIN이 올바르지 않습니다');
                setPinInput('');
                return;
            }

            // PIN 검증 성공 - 시크릿 문서 표시
            // (originalData는 이미 복호화된 상태로 저장되어 있음)
            if (pendingSecretItem && pendingSecretItem.originalData) {
                // 검증 완료 표시 (필요시 나중에 재검증 방지용)
                setDecryptedSecretContent(prev => ({
                    ...prev,
                    [pendingSecretItem.id]: true
                }));

                // 상세보기 모달 열기
                setSelectedItem(pendingSecretItem);
                setIsDetailModalOpen(true);
                setIsPinModalOpen(false);
                setPendingSecretItem(null);
                setPinInput('');
                setPinError('');
            }
        } catch (error) {
            console.error('PIN 검증 오류:', error);
            setPinError('PIN 검증 중 오류가 발생했습니다');
            setPinInput('');
        }
    };

    const handleCloseDetailModal = () => {
        // 시크릿 문서 검증 상태 초기화 (모달을 닫을 때마다 다시 PIN 입력하도록)
        if (selectedItem && selectedItem.type === 'secret') {
            setDecryptedSecretContent(prev => {
                const newContent = { ...prev };
                delete newContent[selectedItem.id];
                return newContent;
            });
        }

        setIsDetailModalOpen(false);
        setSelectedItem(null);
    };

    const handleRestoreFromDetail = () => {
        if (!selectedItem) return;

        restoreFromTrash([selectedItem.id]);
        showToast('항목이 복원되었습니다 ✅');

        // 시크릿 문서 검증 상태 초기화
        if (selectedItem.type === 'secret') {
            setDecryptedSecretContent(prev => {
                const newContent = { ...prev };
                delete newContent[selectedItem.id];
                return newContent;
            });
        }

        setIsDetailModalOpen(false);
        setSelectedItem(null);
    };

    const handleDeleteFromDetail = async () => {
        if (!selectedItem) return;

        try {
            await permanentDelete([selectedItem.id]);
            showToast('항목이 영구 삭제되었습니다 🔥');

            // 시크릿 문서 검증 상태 초기화
            if (selectedItem.type === 'secret') {
                setDecryptedSecretContent(prev => {
                    const newContent = { ...prev };
                    delete newContent[selectedItem.id];
                    return newContent;
                });
            }

            setIsDetailModalOpen(false);
            setSelectedItem(null);
        } catch (error) {
            console.error('영구 삭제 실패:', error);
            showToast('❌ 영구 삭제 중 오류가 발생했습니다');
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredAndSortedItems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredAndSortedItems.map(item => item.id)));
        }
    };

    const calculateDaysLeft = (deletedAt) => {
        // 오늘 자정
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);

        // 삭제일 자정
        const deletedDate = new Date(deletedAt);
        deletedDate.setHours(0, 0, 0, 0);

        // 날짜 차이 계산 (자정 기준)
        const diffTime = todayMidnight - deletedDate;
        const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return autoDeletePeriod - daysElapsed;
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'memo': return '메모';
            case 'schedule': return '스케줄';
            case 'secret': return '시크릿';
            case 'review': return '리뷰';
            default: return '항목';
        }
    };

    // 검색/필터/정렬 적용
    const filteredAndSortedItems = React.useMemo(() => {
        let items = [...trashedItems];

        // 1. 타입 필터링
        if (filterType !== 'all') {
            items = items.filter(item => item.type === filterType);
        }

        // 2. 검색어 필터링 (시크릿 문서 제외)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item => {
                // 시크릿 문서는 검색에서 제외
                if (item.type === 'secret') {
                    return false;
                }
                return item.content.toLowerCase().includes(query);
            });
        }

        // 3. 정렬
        items.sort((a, b) => {
            if (sortOrder === 'newest') {
                return b.deletedAt - a.deletedAt; // 최신순
            } else {
                return a.deletedAt - b.deletedAt; // 오래된 순
            }
        });

        return items;
    }, [trashedItems, filterType, searchQuery, sortOrder]);

    if (trashedItems.length === 0) {
        return (
            <S.PageContainer>
                <S.Header>
                    <S.TitleSection>
                        <S.Title>🗑️ 휴지통</S.Title>
                        <S.SubTitle>{autoDeletePeriod}일 후 자동으로 삭제됩니다</S.SubTitle>
                    </S.TitleSection>
                </S.Header>
                <S.EmptyState>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    <div className="empty-text">휴지통이 비어있습니다</div>
                </S.EmptyState>
            </S.PageContainer>
        );
    }

    return (
        <S.PageContainer>
            <S.Header>
                <S.TitleSection>
                    <S.Title>🗑️ 휴지통 ({trashedItems.length})</S.Title>
                    <S.SubTitle>{autoDeletePeriod}일 후 자동으로 삭제됩니다</S.SubTitle>
                </S.TitleSection>

                <S.ActionButtonRow>
                    <S.TopActionButton
                        $variant="select"
                        $isAllSelected={selectedIds.size === filteredAndSortedItems.length && filteredAndSortedItems.length > 0}
                        onClick={handleSelectAll}
                    >
                        {selectedIds.size === filteredAndSortedItems.length && filteredAndSortedItems.length > 0 ? '전체해제' : '전체선택'}
                    </S.TopActionButton>
                    <S.TopActionButton
                        $variant="restore"
                        $hasSelection={selectedIds.size > 0}
                        onClick={() => {
                            if (selectedIds.size === 0) return;
                            setIsRestoreConfirmOpen(true);
                        }}
                        disabled={selectedIds.size === 0}
                    >
                        복원{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                    </S.TopActionButton>
                    <S.TopActionButton
                        $variant="delete"
                        $hasSelection={selectedIds.size > 0}
                        onClick={() => {
                            if (selectedIds.size === 0) return;
                            setIsDeleteConfirmOpen(true);
                        }}
                        disabled={selectedIds.size === 0}
                    >
                        영구삭제{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                    </S.TopActionButton>
                </S.ActionButtonRow>
            </S.Header>

            {/* 검색 및 필터 섹션 */}
            <S.SearchAndFilterSection>
                <S.SearchBox>
                    <S.SearchIcon>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                        </svg>
                    </S.SearchIcon>
                    <S.SearchInput
                        type="text"
                        placeholder="휴지통 검색...&#10;시크릿 문서는 검색에서 제외됩니다"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <S.ClearButton onClick={() => setSearchQuery('')}>
                            ×
                        </S.ClearButton>
                    )}
                </S.SearchBox>

                <S.FilterRow>
                    <S.FilterButton
                        $active={filterType === 'all'}
                        $type="all"
                        onClick={() => setFilterType('all')}
                    >
                        전체
                    </S.FilterButton>
                    <S.FilterButton
                        $active={filterType === 'memo'}
                        $type="memo"
                        onClick={() => setFilterType('memo')}
                    >
                        메모
                    </S.FilterButton>
                    <S.FilterButton
                        $active={filterType === 'schedule'}
                        $type="schedule"
                        onClick={() => setFilterType('schedule')}
                    >
                        스케줄
                    </S.FilterButton>
                    <S.FilterButton
                        $active={filterType === 'secret'}
                        $type="secret"
                        onClick={() => setFilterType('secret')}
                    >
                        시크릿
                    </S.FilterButton>
                    <S.FilterButton
                        $active={filterType === 'review'}
                        $type="review"
                        onClick={() => setFilterType('review')}
                    >
                        리뷰
                    </S.FilterButton>
                </S.FilterRow>

                <S.FilterRow style={{ marginTop: '8px' }}>
                    <S.SortButton onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}>
                        {sortOrder === 'newest' ? '삭제순 ↓' : '삭제순 ↑'}
                    </S.SortButton>
                </S.FilterRow>
            </S.SearchAndFilterSection>

            {/* 검색 결과 개수 */}
            {(searchQuery || filterType !== 'all') && (
                <S.ResultCount>
                    {filteredAndSortedItems.length}개의 항목이 검색되었습니다
                </S.ResultCount>
            )}

            {filteredAndSortedItems.length === 0 ? (
                <S.EmptyState>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <div className="empty-text">
                        {searchQuery || filterType !== 'all'
                            ? '검색 결과가 없습니다'
                            : '휴지통이 비어있습니다'}
                    </div>
                </S.EmptyState>
            ) : (
                <S.TrashList>
                    {filteredAndSortedItems.map(item => {
                        const daysLeft = calculateDaysLeft(item.deletedAt);
                        const isSelected = selectedIds.has(item.id);
                        return (
                            <S.TrashItem
                                key={item.id}
                                $isSelected={isSelected}
                                $type={item.type}
                                onClick={(e) => {
                                    // 라디오 버튼 클릭이 아니면 상세보기
                                    if (!e.target.closest('[data-radio]')) {
                                        handleItemClick(item, e);
                                    }
                                }}
                            >
                                <S.ItemHeader>
                                    <S.ItemType $type={item.type}>
                                        {getTypeLabel(item.type)}
                                    </S.ItemType>
                                    <S.DeleteInfo>
                                        삭제일 - {format(new Date(item.deletedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                                    </S.DeleteInfo>
                                </S.ItemHeader>
                                <S.ItemContent>
                                    {item.type === 'secret' ? '*********************' : item.content}
                                </S.ItemContent>
                                <S.DaysLeft $days={daysLeft}>
                                    {daysLeft > 0
                                        ? `${daysLeft}일 후 자동 삭제`
                                        : '곧 자동 삭제됨'}
                                </S.DaysLeft>
                                <S.RadioButton
                                    data-radio
                                    $isSelected={isSelected}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleSelect(item.id);
                                    }}
                                />
                            </S.TrashItem>
                        );
                    })}
                </S.TrashList>
            )}

            {/* 복원 확인 모달 */}
            {isRestoreConfirmOpen && (
                <ConfirmationModal
                    isOpen={true}
                    message={`선택한 ${selectedIds.size}개 항목을 복원하시겠습니까?`}
                    confirmText="복원"
                    onConfirm={async () => {
                        const count = selectedIds.size;
                        await restoreFromTrash(Array.from(selectedIds));
                        showToast(`${count}개 항목이 복원되었습니다 ✅`);
                        setSelectedIds(new Set());
                        setIsRestoreConfirmOpen(false);
                    }}
                    onCancel={() => setIsRestoreConfirmOpen(false)}
                />
            )}

            {/* 영구 삭제 확인 모달 */}
            {isDeleteConfirmOpen && (
                <ConfirmationModal
                    isOpen={true}
                    message={`선택한 ${selectedIds.size}개 항목을 영구적으로 삭제하시겠습니까?`}
                    onConfirm={async () => {
                        const count = selectedIds.size;
                        try {
                            await permanentDelete(Array.from(selectedIds));
                            showToast(`${count}개 항목이 영구 삭제되었습니다 🔥`);
                            setSelectedIds(new Set());
                            setIsDeleteConfirmOpen(false);
                        } catch (error) {
                            console.error('영구 삭제 실패:', error);
                            showToast('❌ 영구 삭제 중 오류가 발생했습니다');
                        }
                    }}
                    onCancel={() => setIsDeleteConfirmOpen(false)}
                />
            )}

            {/* 상세보기 모달 */}
            {isDetailModalOpen && selectedItem && (
                <Portal>
                    <S.DetailModalOverlay onClick={handleCloseDetailModal}>
                        <S.DetailModalContainer onClick={(e) => e.stopPropagation()}>
                            <S.DetailModalHeader>
                                <S.DetailModalTitle>
                                    <S.DetailTypeLabel $type={selectedItem.type}>
                                        {getTypeLabel(selectedItem.type)}
                                    </S.DetailTypeLabel>
                                    <S.DetailDeleteInfo>
                                        삭제일: {format(new Date(selectedItem.deletedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                                    </S.DetailDeleteInfo>
                                    <S.DetailDaysLeft $days={calculateDaysLeft(selectedItem.deletedAt)}>
                                        {calculateDaysLeft(selectedItem.deletedAt) > 0
                                            ? `${calculateDaysLeft(selectedItem.deletedAt)}일 후 자동 삭제`
                                            : '곧 자동 삭제됨'}
                                    </S.DetailDaysLeft>
                                </S.DetailModalTitle>
                                <S.CloseIconButton onClick={handleCloseDetailModal}>
                                    ×
                                </S.CloseIconButton>
                            </S.DetailModalHeader>

                            <S.DetailModalContent>
                                {selectedItem.type === 'secret' ? (
                                    <>
                                        <S.SecretDocTitle>
                                            {selectedItem.originalData?.title || '제목 없음'}
                                        </S.SecretDocTitle>
                                        {selectedItem.originalData?.createdAt && (
                                            <S.SecretDocMeta>
                                                작성일: {format(new Date(selectedItem.originalData.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                                                <br />
                                                수정일: {format(new Date(selectedItem.originalData.updatedAt || selectedItem.originalData.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                                            </S.SecretDocMeta>
                                        )}
                                        <S.SecretDocContent>
                                            {selectedItem.originalData?.content || '내용 없음'}
                                        </S.SecretDocContent>
                                    </>
                                ) : (
                                    <S.NormalDocContent>
                                        {selectedItem.originalData?.content || selectedItem.originalData?.text || selectedItem.content}
                                    </S.NormalDocContent>
                                )}
                            </S.DetailModalContent>

                            <S.DetailModalActions>
                                <S.DetailActionButton
                                    $variant="restore"
                                    onClick={handleRestoreFromDetail}
                                >
                                    복원
                                </S.DetailActionButton>
                                <S.DetailActionButton
                                    $variant="delete"
                                    onClick={handleDeleteFromDetail}
                                >
                                    영구 삭제
                                </S.DetailActionButton>
                            </S.DetailModalActions>
                        </S.DetailModalContainer>
                    </S.DetailModalOverlay>
                </Portal>
            )}

            {/* PIN 입력 모달 */}
            {isPinModalOpen && (
                <Portal>
                    <S.PinModalOverlay onClick={() => {
                        setIsPinModalOpen(false);
                        setPendingSecretItem(null);
                        setPinInput('');
                        setPinError('');
                    }}>
                        <S.PinModalContainer onClick={(e) => e.stopPropagation()}>
                            <S.PinModalTitle>시크릿 문서 확인</S.PinModalTitle>
                            <S.PinModalSubtitle>
                                시크릿 문서를 보려면 PIN을 입력하세요
                            </S.PinModalSubtitle>

                            <S.PinInputContainer>
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                    <S.PinDigit key={index} $filled={index < pinInput.length}>
                                        {index < pinInput.length ? '●' : ''}
                                    </S.PinDigit>
                                ))}
                            </S.PinInputContainer>

                            <S.PinErrorMessage>{pinError}</S.PinErrorMessage>

                            <S.PinKeypad>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <S.PinKey key={num} onClick={() => handlePinKeyPress(num.toString())}>
                                        {num}
                                    </S.PinKey>
                                ))}
                                <S.PinKey onClick={() => handlePinKeyPress('backspace')}>
                                    ←
                                </S.PinKey>
                                <S.PinKey onClick={() => handlePinKeyPress('0')}>
                                    0
                                </S.PinKey>
                                <S.PinKey onClick={() => handlePinKeyPress('#')}>
                                    #
                                </S.PinKey>
                            </S.PinKeypad>

                            <S.PinCancelButton onClick={() => {
                                setIsPinModalOpen(false);
                                setPendingSecretItem(null);
                                setPinInput('');
                                setPinError('');
                            }}>
                                취소
                            </S.PinCancelButton>
                        </S.PinModalContainer>
                    </S.PinModalOverlay>
                </Portal>
            )}
        </S.PageContainer>
    );
};

export default TrashPage;
