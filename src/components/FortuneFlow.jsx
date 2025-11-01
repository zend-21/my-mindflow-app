// src/components/FortuneFlow.jsx

import React, { useState, useEffect } from 'react';
import FortuneInputModal from './FortuneInputModal';
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
 * 1. 사용자 프로필 확인
 *    - 없으면 FortuneInputModal 표시 → 입력 후 저장
 * 2. 오늘의 운세 확인
 *    - 있으면 바로 FortuneResultPage 표시
 *    - 없으면 GachaAnimation → 운세 계산 → FortuneResultPage
 * 3. 결과 확인 후 종료 또는 다시 보기
 */

const FortuneFlow = ({ onClose, profile }) => {
    // Flow states: 'checkProfile' | 'inputProfile' | 'checkFortune' | 'gacha' | 'result'
    const [flowState, setFlowState] = useState('checkProfile');

    // Data
    const [userProfile, setUserProfile] = useState(null);
    const [fortuneResult, setFortuneResult] = useState(null);
    const [fortuneData, setFortuneData] = useState(null);

    // 사용자 이름 결정 (로그인 여부에 따라)
    const userName = profile?.name || profile?.email?.split('@')[0] || '게스트';

    // 🎬 Step 1: 초기화 - 프로필 및 운세 데이터 확인
    useEffect(() => {
        // Load fortune CSV data
        const data = getFortuneData();
        setFortuneData(data);

        // Check user profile
        const savedProfile = getUserProfile();
        if (savedProfile) {
            setUserProfile(savedProfile);
            // Profile exists, check today's fortune
            setFlowState('checkFortune');
        } else {
            // No profile, need to input
            setFlowState('inputProfile');
        }
    }, []);

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

    // 🎯 Handler: 프로필 입력 완료
    const handleProfileSubmit = (userData) => {
        saveUserProfile(userData);
        setUserProfile(userData);
        // Move to fortune check
        setFlowState('checkFortune');
    };

    // 🎯 Handler: 가차 애니메이션 완료
    const handleGachaComplete = () => {
        if (!userProfile || !fortuneData) {
            alert('데이터를 불러오는 중 오류가 발생했습니다.');
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
            {flowState === 'inputProfile' && (
                <FortuneInputModal
                    onClose={onClose}
                    onSubmit={handleProfileSubmit}
                    initialData={userProfile}
                    userName={userName}
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
