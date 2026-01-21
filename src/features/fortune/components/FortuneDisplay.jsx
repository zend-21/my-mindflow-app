// src/components/FortuneDisplay.jsx
// 오늘의 운세 표시 컴포넌트 예시

import React from 'react';
import { getTodayFortune, CATEGORY_ICONS, CATEGORY_NAMES } from '../utils/fortuneSelector';

/**
 * 오늘의 운세 표시 컴포넌트
 * @param {Object} sajuResult - 사주 계산 결과
 */
const FortuneDisplay = ({ sajuResult }) => {
    // 사주 결과에서 운세 문장 생성
    const fortune = getTodayFortune(sajuResult);

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>📅 오늘의 운세</h2>
            <p style={styles.date}>{new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            })}</p>

            <div style={styles.fortuneList}>
                {/* 메인 운세 */}
                <FortuneCard
                    icon={CATEGORY_ICONS.Main}
                    title={CATEGORY_NAMES.Main}
                    keyword={sajuResult.main}
                    content={fortune.main}
                />

                {/* 재물운 */}
                <FortuneCard
                    icon={CATEGORY_ICONS.Money}
                    title={CATEGORY_NAMES.Money}
                    keyword={sajuResult.money}
                    content={fortune.money}
                />

                {/* 애정운 */}
                <FortuneCard
                    icon={CATEGORY_ICONS.Love}
                    title={CATEGORY_NAMES.Love}
                    keyword={sajuResult.love}
                    content={fortune.love}
                />

                {/* 건강운 */}
                <FortuneCard
                    icon={CATEGORY_ICONS.Health}
                    title={CATEGORY_NAMES.Health}
                    keyword={sajuResult.health}
                    content={fortune.health}
                />

                {/* 오늘의 조언 */}
                <FortuneCard
                    icon={CATEGORY_ICONS.Advice}
                    title={CATEGORY_NAMES.Advice}
                    keyword={sajuResult.advice}
                    content={fortune.advice}
                />

                {/* 행운 요소 */}
                <FortuneCard
                    icon={CATEGORY_ICONS.Lucky}
                    title={CATEGORY_NAMES.Lucky}
                    keyword={sajuResult.lucky}
                    content={fortune.lucky}
                />
            </div>
        </div>
    );
};

/**
 * 개별 운세 카드 컴포넌트
 */
const FortuneCard = ({ icon, title, keyword, content }) => {
    return (
        <div style={styles.card}>
            <div style={styles.cardHeader}>
                <span style={styles.icon}>{icon}</span>
                <h3 style={styles.cardTitle}>{title}</h3>
                <span style={styles.keyword}>{keyword}</span>
            </div>
            <p style={styles.content}>{content}</p>
        </div>
    );
};

// 기본 스타일 (styled-components로 변경 가능)
const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'linear-gradient(180deg, #2a2d35 0%, #1f2229 100%)',
        minHeight: '100vh'
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '10px',
        color: '#e0e0e0'
    },
    date: {
        textAlign: 'center',
        color: '#b0b0b0',
        marginBottom: '30px',
        fontSize: '14px'
    },
    fortuneList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    card: {
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '12px'
    },
    icon: {
        fontSize: '24px'
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#e0e0e0',
        margin: 0,
        flex: 1
    },
    keyword: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#fff',
        background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.3), rgba(245, 87, 108, 0.3))',
        padding: '4px 12px',
        borderRadius: '12px',
        border: '1px solid rgba(240, 147, 251, 0.5)'
    },
    content: {
        fontSize: '15px',
        lineHeight: '1.6',
        color: '#d0d0d0',
        margin: 0
    }
};

export default FortuneDisplay;
