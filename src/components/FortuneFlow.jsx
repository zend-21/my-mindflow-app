// src/components/FortuneFlow.jsx

import React, { useState, useEffect } from 'react';
import FortuneInputModal from './FortuneInputModal';
import ProfileConfirmModal from './ProfileConfirmModal';
import FortuneNoticeModal from './FortuneNoticeModal';
import GachaAnimation from './GachaAnimation';
import FortuneResultPage from './FortuneResultPage';
import { getFortuneData } from '../utils/fortuneData';
import {
    calculateFortune,
    getTodayFortune,
    saveTodayFortune,
    getUserProfile,
    saveUserProfile,
    IS_TESTING_MODE
} from '../utils/fortuneLogic';

/**
 * 🔮 FortuneFlow - 운세 전체 플로우 통합 컴포넌트
 *
 * Flow:
 * 0. 안내 모달 표시 (처음 사용 시, "다시 보지 않기" 선택 안 한 경우)
 * 1. 사용자 프로필 확인
 *    - 없으면 FortuneInputModal 표시 → 입력 후 저장
 * 2. 프로필 확인 모달 (저장된 프로필이 있는 경우)
 *    - 저장된 정보 표시 및 확인/수정 선택
 * 3. 오늘의 운세 확인
 *    - 있으면 바로 FortuneResultPage 표시
 *    - 없으면 GachaAnimation → 운세 계산 → FortuneResultPage
 * 4. 결과 확인 후 종료 또는 다시 보기
 */

const FortuneFlow = ({ onClose, profile }) => {
    // Flow states: 'notice' | 'checkProfile' | 'inputProfile' | 'confirmProfile' | 'checkFortune' | 'gacha' | 'result'
    const [flowState, setFlowState] = useState('notice');
    const [isEditMode, setIsEditMode] = useState(false); // 편집 모드 플래그

    // Data
    const [userProfile, setUserProfile] = useState(null);
    const [fortuneResult, setFortuneResult] = useState(null);
    const [fortuneData, setFortuneData] = useState(null);

    // 사용자 이름 결정 (로그인 여부에 따라)
    const userName = profile?.name || profile?.email?.split('@')[0] || '게스트';

    // 🎬 Step 0: 초기화 - 안내 모달 표시 여부 확인
    useEffect(() => {
        // Load fortune CSV data
        const data = getFortuneData();
        setFortuneData(data);

        // Check if user has chosen "Don't show again"
        const noticeHidden = localStorage.getItem('fortuneNoticeHidden');

        if (noticeHidden === 'true') {
            // Skip notice, go to profile check
            checkProfileAndProceed();
        } else {
            // Show notice modal first
            setFlowState('notice');
        }
    }, []);

    // 프로필 확인 및 진행
    const checkProfileAndProceed = () => {
        // Check user profile
        const savedProfile = getUserProfile();
        if (savedProfile) {
            setUserProfile(savedProfile);
            // Profile exists, show confirmation modal
            setFlowState('confirmProfile');
        } else {
            // No profile, need to input
            setFlowState('inputProfile');
        }
    };

    // 🎬 Step 2: 오늘의 운세 확인 (프로필이 있는 경우)
    useEffect(() => {
        if (flowState === 'checkFortune') {
            // Check if today's fortune already exists
            const savedFortune = getTodayFortune();

            if (savedFortune && !IS_TESTING_MODE) {
                // Today's fortune already exists, show directly
                setFortuneResult(savedFortune);
                setFlowState('result');
            } else {
                // No fortune yet, start gacha
                setFlowState('gacha');
            }
        }
    }, [flowState]);

    // 🎯 Handler: 안내 모달 확인
    const handleNoticeConfirm = () => {
        // Proceed to profile check
        checkProfileAndProceed();
    };

    // 🎯 Handler: 프로필 입력 완료
    const handleProfileSubmit = (userData) => {
        saveUserProfile(userData);
        setUserProfile(userData);
        // Move to fortune check
        setFlowState('checkFortune');
    };

    // 🎯 Handler: 프로필 확인 모달에서 확인 버튼 클릭
    const handleProfileConfirm = () => {
        // Proceed to check fortune
        setFlowState('checkFortune');
    };

    // 🎯 Handler: 프로필 확인 모달에서 수정 버튼 클릭
    const handleProfileEdit = () => {
        // Go back to input modal for editing (편집 모드 활성화)
        setIsEditMode(true);
        setFlowState('inputProfile');
    };

    // 🎯 Handler: 가차 애니메이션 완료
    const handleGachaComplete = () => {
        if (!userProfile || !fortuneData) {
            console.error('데이터를 불러오는 중 오류가 발생했습니다.');
            onClose();
            return;
        }

        // Calculate fortune
        const result = calculateFortune(userProfile, fortuneData);

        // Save fortune
        saveTodayFortune(result);

        // Show result
        setFortuneResult(result);
        setFlowState('result');
    };

    // 🎯 Handler: 다시 보기 (프로필 재입력)
    const handleReset = () => {
        setFlowState('inputProfile');
    };

    // 🎬 Render based on flow state
    return (
        <>
            {flowState === 'notice' && (
                <FortuneNoticeModal onConfirm={handleNoticeConfirm} />
            )}

            {flowState === 'inputProfile' && (
                <FortuneInputModal
                    onClose={onClose}
                    onSubmit={handleProfileSubmit}
                    initialData={userProfile}
                    userName={userName}
                    isEditMode={isEditMode}
                    profile={profile}
                />
            )}

            {flowState === 'confirmProfile' && userProfile && (
                <ProfileConfirmModal
                    profile={userProfile}
                    userName={userName}
                    onConfirm={handleProfileConfirm}
                    onEdit={handleProfileEdit}
                    onClose={onClose}
                />
            )}

            {flowState === 'gacha' && (
                <GachaAnimation onComplete={handleGachaComplete} />
            )}

            {flowState === 'result' && fortuneResult && (
                <FortuneResultPage
                    fortuneResult={fortuneResult}
                    onClose={onClose}
                    onReset={handleReset}
                />
            )}
        </>
    );
};

export default FortuneFlow;
