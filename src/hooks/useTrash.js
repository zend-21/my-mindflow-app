// src/hooks/useTrash.js

import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * 휴지통 관리 커스텀 훅
 * @param {number} autoDeleteDays - 자동 삭제까지의 일수 (기본: 30일)
 * @returns {Object} 휴지통 관련 상태와 함수들
 */
export const useTrash = (autoDeleteDays = 30) => {
    // 휴지통 아이템 저장 (로컬스토리지)
    const [trashedItems, setTrashedItems] = useLocalStorage('trashedItems_shared', []);
    
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

        setTrashedItems(prev => [trashedItem, ...prev]);
        console.log(`🗑️ 휴지통으로 이동: ${type} - ${id}`);
    };

    /**
     * 휴지통에서 아이템 복원
     * @param {Array<string>} ids - 복원할 아이템 ID 배열
     * @returns {Array<Object>} 복원된 아이템들의 원본 데이터
     */
    const restoreFromTrash = (ids) => {
        const idsSet = new Set(ids);
        const itemsToRestore = trashedItems.filter(item => idsSet.has(item.id));
        
        // 휴지통에서 제거
        setTrashedItems(prev => prev.filter(item => !idsSet.has(item.id)));
        
        // 복원 이벤트 발생 (App.jsx에서 감지하여 실제 복원 처리)
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('itemsRestored', {
                detail: itemsToRestore
            });
            window.dispatchEvent(event);
        }
        
        console.log(`♻️ 복원: ${ids.length}개 아이템`);
        return itemsToRestore;
    };

    /**
     * 휴지통에서 영구 삭제
     * @param {Array<string>} ids - 삭제할 아이템 ID 배열
     */
    const permanentDelete = (ids) => {
        const idsSet = new Set(ids);
        setTrashedItems(prev => prev.filter(item => !idsSet.has(item.id)));
        console.log(`🔥 영구 삭제: ${ids.length}개 아이템`);
    };

    /**
     * 휴지통 비우기 (모든 아이템 영구 삭제)
     */
    const emptyTrash = () => {
        const count = trashedItems.length;
        setTrashedItems([]);
        console.log(`🧹 휴지통 비우기: ${count}개 아이템 삭제`);
    };

    /**
     * 자동 삭제 기간이 지난 아이템 자동 삭제
     */
    const autoDeleteExpiredItems = () => {
        const now = Date.now();
        const millisecondsInDay = 1000 * 60 * 60 * 24;
        const expirationTime = autoDeletePeriod * millisecondsInDay;

        const beforeCount = trashedItems.length;
        const updatedItems = trashedItems.filter(item => {
            const elapsed = now - item.deletedAt;
            return elapsed < expirationTime;
        });

        if (updatedItems.length < beforeCount) {
            setTrashedItems(updatedItems);
            const deletedCount = beforeCount - updatedItems.length;
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
