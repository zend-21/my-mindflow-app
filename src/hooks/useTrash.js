// src/hooks/useTrash.js

import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * 휴지통 관리 커스텀 훅
 * @param {number} autoDeleteDays - 자동 삭제까지의 일수 (기본: 30일)
 * @param {Array} externalTrashedItems - 외부에서 관리되는 휴지통 아이템 (Firestore 동기화용)
 * @param {Function} externalSetTrashedItems - 외부 상태 업데이트 함수 (Firestore 동기화용)
 * @returns {Object} 휴지통 관련 상태와 함수들
 */
export const useTrash = (autoDeleteDays = 30, externalTrashedItems = null, externalSetTrashedItems = null) => {
    // 외부 상태가 제공되면 사용, 아니면 로컬스토리지 사용 (하위 호환성)
    const [localTrashedItems, setLocalTrashedItems] = useLocalStorage('trashedItems_shared', []);
    const trashedItems = externalTrashedItems !== null ? externalTrashedItems : localTrashedItems;
    const setTrashedItems = externalSetTrashedItems !== null ? externalSetTrashedItems : setLocalTrashedItems;

    // 자동 삭제 기간 설정 (로컬스토리지)
    const [autoDeletePeriod, setAutoDeletePeriod] = useLocalStorage('autoDeletePeriod_shared', autoDeleteDays);

    /**
     * 아이템을 휴지통으로 이동
     * @param {string} id - 아이템 ID
     * @param {string} type - 아이템 타입 ('memo', 'schedule', 'secret', 'review')
     * @param {string} content - 아이템 내용 (미리보기용)
     * @param {Object} originalData - 복원을 위한 원본 데이터
     */
    const moveToTrash = (id, type, content, originalData) => {
        const trashedItem = {
            id,
            type,
            content,
            originalData,
            deletedAt: Date.now()
        };

        const newTrashItems = [trashedItem, ...trashedItems];
        setTrashedItems(newTrashItems);
        console.log(`🗑️ 휴지통으로 이동: ${type} - ${id}`);

        // 즉시 Firestore 저장 (디바운스 없이)
        const userId = localStorage.getItem('firebaseUserId');
        if (userId) {
            import('../services/userDataService').then(({ saveTrashToFirestore }) => {
                saveTrashToFirestore(userId, newTrashItems).catch(err => {
                    console.error('휴지통 즉시 저장 실패:', err);
                });
            });
        }
    };

    /**
     * 휴지통에서 아이템 복원
     * @param {Array<string>} ids - 복원할 아이템 ID 배열
     * @returns {Array<Object>} 복원된 아이템들의 원본 데이터
     */
    const restoreFromTrash = async (ids) => {
        const idsSet = new Set(ids);
        const itemsToRestore = trashedItems.filter(item => idsSet.has(item.id));

        console.log(`♻️ 복원 시작: ${ids.length}개 아이템`, itemsToRestore);

        // 시크릿 문서와 일반 문서 분리
        const secretItems = itemsToRestore.filter(item => item.type === 'secret');
        const normalItems = itemsToRestore.filter(item => item.type !== 'secret');

        // 일반 문서는 기존 방식대로 복원 이벤트 발생
        if (normalItems.length > 0 && typeof window !== 'undefined') {
            const event = new CustomEvent('itemsRestored', {
                detail: normalItems
            });
            window.dispatchEvent(event);
        }

        // 시크릿 문서는 PIN 없이 복원 (삭제 ID 목록에서만 제거)
        if (secretItems.length > 0) {
            try {
                const { restoreSecretDocsWithoutPin } = await import('../utils/secretStorage');
                const secretDocIds = secretItems.map(item => item.id);
                await restoreSecretDocsWithoutPin(secretDocIds);
                console.log('✅ 시크릿 문서 복원 완료 (PIN 없음):', secretItems.length, '개');
            } catch (error) {
                console.error('❌ 시크릿 문서 복원 실패:', error);
            }
        }

        // 휴지통에서 복원된 아이템 제거 (시크릿, 일반 모두)
        const newTrashItems = trashedItems.filter(item => !idsSet.has(item.id));
        setTrashedItems(newTrashItems);

        // 즉시 Firestore 저장 (디바운스 없이) - await로 완료 대기
        const userId = localStorage.getItem('firebaseUserId');
        if (userId) {
            try {
                const { saveTrashToFirestore } = await import('../services/userDataService');
                await saveTrashToFirestore(userId, newTrashItems);
                console.log('✅ 휴지통 복원 Firestore 저장 완료');
            } catch (err) {
                console.error('❌ 휴지통 복원 후 저장 실패:', err);
                throw err; // 에러를 상위로 전파
            }
        }

        console.log(`✅ 복원 완료: ${ids.length}개 아이템 (일반: ${normalItems.length}, 시크릿: ${secretItems.length})`);
        return itemsToRestore;
    };

    /**
     * 휴지통에서 영구 삭제
     * @param {Array<string>} ids - 삭제할 아이템 ID 배열
     */
    const permanentDelete = async (ids) => {
        const idsSet = new Set(ids);
        const itemsToDelete = trashedItems.filter(item => idsSet.has(item.id));

        console.log(`🔥 영구 삭제 시작: ${ids.length}개 아이템`, itemsToDelete);

        // 시크릿 문서와 일반 문서 분리
        const secretItems = itemsToDelete.filter(item => item.type === 'secret');
        const normalItems = itemsToDelete.filter(item => item.type !== 'secret');

        // 시크릿 문서는 삭제 ID 목록에서만 제거 (실제 삭제는 다음 PIN 입력 시 자동 정리)
        if (secretItems.length > 0) {
            try {
                const { permanentDeleteSecretDocWithoutPin } = await import('../utils/secretStorage');
                const secretDocIds = secretItems.map(item => item.id);
                await permanentDeleteSecretDocWithoutPin(secretDocIds);
                console.log('✅ 시크릿 문서 영구 삭제 완료 (삭제 ID 목록에서 제거):', secretItems.length, '개');
            } catch (error) {
                console.error('❌ 시크릿 문서 영구 삭제 실패:', error);
            }
        }

        // 휴지통에서 영구 삭제된 아이템 제거 (시크릿, 일반 모두)
        const newTrashItems = trashedItems.filter(item => !idsSet.has(item.id));
        setTrashedItems(newTrashItems);

        // 즉시 Firestore 저장 (디바운스 없이) - await로 완료 대기
        const userId = localStorage.getItem('firebaseUserId');
        if (userId) {
            try {
                const { saveTrashToFirestore } = await import('../services/userDataService');
                await saveTrashToFirestore(userId, newTrashItems);
                console.log('✅ 휴지통 Firestore 저장 완료');
            } catch (err) {
                console.error('❌ 휴지통 영구 삭제 후 저장 실패:', err);
                throw err; // 에러를 상위로 전파하여 사용자에게 알림
            }
        }

        console.log(`✅ 영구 삭제 완료: ${ids.length}개 아이템 (일반: ${normalItems.length}, 시크릿: ${secretItems.length})`);
    };

    /**
     * 휴지통 비우기 (모든 아이템 영구 삭제)
     */
    const emptyTrash = async () => {
        const count = trashedItems.length;
        setTrashedItems([]);

        // 즉시 Firestore 저장 (디바운스 없이) - await로 완료 대기
        const userId = localStorage.getItem('firebaseUserId');
        if (userId) {
            try {
                const { saveTrashToFirestore } = await import('../services/userDataService');
                await saveTrashToFirestore(userId, []);
                console.log('✅ 휴지통 비우기 Firestore 저장 완료');
            } catch (err) {
                console.error('❌ 휴지통 비우기 후 저장 실패:', err);
                throw err; // 에러를 상위로 전파
            }
        }

        console.log(`🧹 휴지통 비우기: ${count}개 아이템 삭제`);
    };

    /**
     * 자동 삭제 기간이 지난 아이템 자동 삭제 (자정 기준)
     */
    const autoDeleteExpiredItems = async () => {
        // 오늘 자정
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);

        const beforeCount = trashedItems.length;
        const updatedItems = trashedItems.filter(item => {
            // 삭제일 자정
            const deletedDate = new Date(item.deletedAt);
            deletedDate.setHours(0, 0, 0, 0);

            // 날짜 차이 계산 (자정 기준)
            const diffTime = todayMidnight - deletedDate;
            const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            return daysElapsed < autoDeletePeriod;
        });

        if (updatedItems.length < beforeCount) {
            setTrashedItems(updatedItems);
            const deletedCount = beforeCount - updatedItems.length;

            // 즉시 Firestore 저장 (디바운스 없이) - await로 완료 대기
            const userId = localStorage.getItem('firebaseUserId');
            if (userId) {
                try {
                    const { saveTrashToFirestore } = await import('../services/userDataService');
                    await saveTrashToFirestore(userId, updatedItems);
                    console.log('✅ 자동 삭제 Firestore 저장 완료');
                } catch (err) {
                    console.error('❌ 자동 삭제 후 저장 실패:', err);
                    throw err; // 에러를 상위로 전파
                }
            }

            console.log(`🕐 자동 삭제: ${deletedCount}개 아이템 (${autoDeletePeriod}일 경과)`);
        }
    };

    /**
     * 특정 ID의 아이템이 휴지통에 있는지 확인
     * @param {string} id - 확인할 아이템 ID
     * @returns {boolean}
     */
    const isInTrash = (id) => {
        return trashedItems.some(item => item.id === id);
    };

    /**
     * 특정 타입의 휴지통 아이템 개수 반환
     * @param {string} type - 아이템 타입
     * @returns {number}
     */
    const getTrashCountByType = (type) => {
        return trashedItems.filter(item => item.type === type).length;
    };

    // 앱 시작 시 자동 삭제 실행
    useEffect(() => {
        autoDeleteExpiredItems();
    }, []);

    // 1시간마다 자동 삭제 체크
    useEffect(() => {
        const intervalId = setInterval(() => {
            autoDeleteExpiredItems();
        }, 1000 * 60 * 60); // 1시간

        return () => clearInterval(intervalId);
    }, [trashedItems, autoDeletePeriod]);

    return {
        // 상태
        trashedItems,
        autoDeletePeriod,
        
        // 함수
        moveToTrash,
        restoreFromTrash,
        permanentDelete,
        emptyTrash,
        autoDeleteExpiredItems,
        isInTrash,
        getTrashCountByType,
        setAutoDeletePeriod
    };
};
