// src/components/AppContent.jsx
// App.jsx에서 분리된 메인 콘텐츠 컴포넌트 (useTrashContext 사용)

import React, { useState, useEffect, useRef } from 'react';
import { useTrashContext } from '../contexts/TrashContext';
import { format } from 'date-fns';

/**
 * AppContent - 실제 앱의 모든 로직과 UI를 담당
 * TrashProvider 내부에서 실행되므로 useTrashContext 사용 가능
 */
const AppContent = ({
    // 모든 props를 App.jsx에서 전달받음
    children
}) => {
    // 휴지통 컨텍스트 가져오기
    const { moveToTrash, restoreFromTrash } = useTrashContext();

    // 복원 이벤트 리스너
    useEffect(() => {
        const handleRestore = (event) => {
            const restoredItems = event.detail;
            
            console.log('♻️ 복원 이벤트 수신:', restoredItems);
            
            // 이 부분은 App.jsx에서 처리해야 하므로
            // 커스텀 이벤트로 다시 전파
            const restoreEvent = new CustomEvent('restoreToApp', {
                detail: restoredItems
            });
            window.dispatchEvent(restoreEvent);
        };

        window.addEventListener('itemsRestored', handleRestore);
        return () => window.removeEventListener('itemsRestored', handleRestore);
    }, []);

    // 삭제 이벤트 리스너
    useEffect(() => {
        const handleDelete = (event) => {
            const { id, type, content, originalData } = event.detail;
            
            console.log('🗑️ 삭제 이벤트 수신:', { id, type, content });
            
            // 휴지통으로 이동
            moveToTrash(id, type, content, originalData);
        };

        window.addEventListener('moveToTrash', handleDelete);
        return () => window.removeEventListener('moveToTrash', handleDelete);
    }, [moveToTrash]);

    return children;
};

export default AppContent;
