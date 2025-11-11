// src/components/avatars/AvatarIcons.jsx
// SVG 아바타 아이콘 컬렉션 (십이지신 12개 + 추가 8개) - 귀엽고 특징적인 디자인

import React from 'react';

// 십이지신 (12 Zodiac Animals)
export const RatAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#E8E8E8"/>
        {/* 큰 귀 */}
        <circle cx="28" cy="28" r="14" fill="#D0D0D0"/>
        <circle cx="28" cy="28" r="9" fill="#FFB6C1"/>
        <circle cx="72" cy="28" r="14" fill="#D0D0D0"/>
        <circle cx="72" cy="28" r="9" fill="#FFB6C1"/>
        {/* 얼굴 */}
        <ellipse cx="50" cy="50" rx="24" ry="26" fill="#F5F5F5"/>
        {/* 큰 눈 */}
        <ellipse cx="42" cy="45" rx="3" ry="5" fill="#000"/>
        <ellipse cx="58" cy="45" rx="3" ry="5" fill="#000"/>
        <circle cx="42" cy="44" r="1.5" fill="#FFF"/>
        <circle cx="58" cy="44" r="1.5" fill="#FFF"/>
        {/* 작은 코 */}
        <ellipse cx="50" cy="55" rx="3" ry="2" fill="#FFB6C1"/>
        {/* 미소 */}
        <path d="M 44 58 Q 50 62 56 58" stroke="#888" strokeWidth="1.5" fill="none"/>
        <line x1="50" y1="55" x2="50" y2="58" stroke="#888" strokeWidth="1.5"/>
        {/* 수염 */}
        <line x1="30" y1="52" x2="18" y2="50" stroke="#888" strokeWidth="1"/>
        <line x1="30" y1="56" x2="18" y2="58" stroke="#888" strokeWidth="1"/>
        <line x1="70" y1="52" x2="82" y2="50" stroke="#888" strokeWidth="1"/>
        <line x1="70" y1="56" x2="82" y2="58" stroke="#888" strokeWidth="1"/>
    </svg>
);

export const OxAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#DEB887"/>
        {/* 뿔 */}
        <path d="M 25 30 Q 20 15 22 25" fill="#8B7355" stroke="#5D4E37" strokeWidth="2"/>
        <path d="M 75 30 Q 80 15 78 25" fill="#8B7355" stroke="#5D4E37" strokeWidth="2"/>
        {/* 얼굴 */}
        <ellipse cx="50" cy="52" rx="26" ry="28" fill="#F4A460"/>
        {/* 귀 */}
        <ellipse cx="24" cy="40" rx="8" ry="12" fill="#CD853F"/>
        <ellipse cx="76" cy="40" rx="8" ry="12" fill="#CD853F"/>
        {/* 큰 눈 */}
        <ellipse cx="42" cy="45" rx="4" ry="6" fill="#000"/>
        <ellipse cx="58" cy="45" rx="4" ry="6" fill="#000"/>
        <circle cx="42" cy="44" r="2" fill="#FFF"/>
        <circle cx="58" cy="44" r="2" fill="#FFF"/>
        {/* 큰 코와 콧구멍 */}
        <ellipse cx="50" cy="60" rx="10" ry="7" fill="#CD853F"/>
        <ellipse cx="46" cy="60" rx="2.5" ry="3" fill="#5D4E37"/>
        <ellipse cx="54" cy="60" rx="2.5" ry="3" fill="#5D4E37"/>
        {/* 입 */}
        <path d="M 42 66 Q 50 70 58 66" stroke="#8B7355" strokeWidth="2" fill="none"/>
    </svg>
);

export const TigerAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFB84D"/>
        {/* 호랑이 귀 (뾰족) */}
        <path d="M 28 25 L 22 12 L 34 22 Z" fill="#FFA500"/>
        <path d="M 72 25 L 78 12 L 66 22 Z" fill="#FFA500"/>
        {/* 얼굴 */}
        <ellipse cx="50" cy="50" rx="26" ry="28" fill="#FFCC80"/>
        {/* 호랑이 무늬 */}
        <path d="M 30 40 L 32 48" stroke="#8B4513" strokeWidth="2.5"/>
        <path d="M 68 40 L 66 48" stroke="#8B4513" strokeWidth="2.5"/>
        <path d="M 35 52 L 38 60" stroke="#8B4513" strokeWidth="2"/>
        <path d="M 65 52 L 62 60" stroke="#8B4513" strokeWidth="2"/>
        {/* 눈 (날카로운) */}
        <ellipse cx="40" cy="44" rx="5" ry="7" fill="#000"/>
        <ellipse cx="60" cy="44" rx="5" ry="7" fill="#000"/>
        <circle cx="40" cy="43" r="2" fill="#FFF"/>
        <circle cx="60" cy="43" r="2" fill="#FFF"/>
        {/* 코 */}
        <path d="M 50 54 L 48 58 L 52 58 Z" fill="#8B4513"/>
        {/* 입 (강한 인상) */}
        <path d="M 40 62 Q 50 66 60 62" stroke="#8B4513" strokeWidth="2" fill="none"/>
        <line x1="50" y1="58" x2="50" y2="62" stroke="#8B4513" strokeWidth="2"/>
        {/* 수염 */}
        <line x1="32" y1="55" x2="20" y2="53" stroke="#8B4513" strokeWidth="1.5"/>
        <line x1="68" y1="55" x2="80" y2="53" stroke="#8B4513" strokeWidth="1.5"/>
    </svg>
);

export const RabbitAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFF5F5"/>
        {/* 긴 귀 */}
        <ellipse cx="35" cy="18" rx="7" ry="22" fill="#FFE4E1"/>
        <ellipse cx="35" cy="18" rx="4" ry="18" fill="#FFB6C1"/>
        <ellipse cx="65" cy="18" rx="7" ry="22" fill="#FFE4E1"/>
        <ellipse cx="65" cy="18" rx="4" ry="18" fill="#FFB6C1"/>
        {/* 얼굴 */}
        <ellipse cx="50" cy="52" rx="24" ry="26" fill="#FFFFFF"/>
        {/* 큰 눈 (토끼 특유의) */}
        <ellipse cx="42" cy="48" rx="5" ry="7" fill="#8B4513"/>
        <ellipse cx="58" cy="48" rx="5" ry="7" fill="#8B4513"/>
        <circle cx="42" cy="47" r="2.5" fill="#FFF"/>
        <circle cx="58" cy="47" r="2.5" fill="#FFF"/>
        {/* 작은 분홍코 */}
        <path d="M 48 58 L 50 60 L 52 58 Z" fill="#FFB6C1"/>
        {/* Y자 입 */}
        <line x1="50" y1="60" x2="50" y2="63" stroke="#D4A5A5" strokeWidth="1.5"/>
        <path d="M 44 64 Q 50 63 56 64" stroke="#D4A5A5" strokeWidth="1.5" fill="none"/>
        {/* 볼 */}
        <circle cx="32" cy="56" r="4" fill="#FFE4E1" opacity="0.6"/>
        <circle cx="68" cy="56" r="4" fill="#FFE4E1" opacity="0.6"/>
        {/* 앞니 */}
        <rect x="47" y="65" width="3" height="4" fill="#FFF" rx="1"/>
        <rect x="50" y="65" width="3" height="4" fill="#FFF" rx="1"/>
    </svg>
);

export const DragonAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#6495ED"/>
        {/* 뿔 (용의 특징) */}
        <path d="M 30 22 L 25 8 L 32 18 L 28 10 L 34 20 Z" fill="#FFD700"/>
        <path d="M 70 22 L 75 8 L 68 18 L 72 10 L 66 20 Z" fill="#FFD700"/>
        {/* 얼굴 */}
        <ellipse cx="50" cy="52" rx="26" ry="28" fill="#87CEEB"/>
        {/* 비늘 무늬 */}
        <circle cx="35" cy="45" r="3" fill="#6495ED" opacity="0.5"/>
        <circle cx="42" cy="50" r="3" fill="#6495ED" opacity="0.5"/>
        <circle cx="65" cy="45" r="3" fill="#6495ED" opacity="0.5"/>
        <circle cx="58" cy="50" r="3" fill="#6495ED" opacity="0.5"/>
        {/* 강렬한 눈 */}
        <ellipse cx="40" cy="46" rx="6" ry="8" fill="#FFD700"/>
        <ellipse cx="60" cy="46" rx="6" ry="8" fill="#FFD700"/>
        <ellipse cx="40" cy="46" rx="3" ry="5" fill="#8B0000"/>
        <ellipse cx="60" cy="46" rx="3" ry="5" fill="#8B0000"/>
        <ellipse cx="40" cy="45" rx="1" ry="2" fill="#FFF"/>
        <ellipse cx="60" cy="45" rx="1" ry="2" fill="#FFF"/>
        {/* 용의 코 */}
        <ellipse cx="50" cy="58" rx="5" ry="3" fill="#4682B4"/>
        <circle cx="47" cy="58" r="1.5" fill="#000"/>
        <circle cx="53" cy="58" r="1.5" fill="#000"/>
        {/* 입 (용다운) */}
        <path d="M 38 64 Q 50 68 62 64" stroke="#4682B4" strokeWidth="2" fill="none"/>
        {/* 수염 (용 수염) */}
        <path d="M 32 60 Q 25 62 22 65" stroke="#FFD700" strokeWidth="2" fill="none"/>
        <path d="M 68 60 Q 75 62 78 65" stroke="#FFD700" strokeWidth="2" fill="none"/>
    </svg>
);

export const SnakeAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#9ACD32"/>
        {/* 얼굴 (타원형, 뱀 특유의) */}
        <ellipse cx="50" cy="50" rx="28" ry="30" fill="#ADFF2F"/>
        {/* 뱀 무늬 */}
        <ellipse cx="35" cy="40" rx="5" ry="6" fill="#6B8E23" opacity="0.4"/>
        <ellipse cx="65" cy="40" rx="5" ry="6" fill="#6B8E23" opacity="0.4"/>
        <ellipse cx="40" cy="55" rx="4" ry="5" fill="#6B8E23" opacity="0.4"/>
        <ellipse cx="60" cy="55" rx="4" ry="5" fill="#6B8E23" opacity="0.4"/>
        {/* 뱀의 눈 (날카롭고 세로로 긴) */}
        <ellipse cx="42" cy="45" rx="4" ry="8" fill="#FFD700"/>
        <ellipse cx="58" cy="45" rx="4" ry="8" fill="#FFD700"/>
        <ellipse cx="42" cy="45" rx="1.5" ry="6" fill="#000"/>
        <ellipse cx="58" cy="45" rx="1.5" ry="6" fill="#000"/>
        {/* 작은 코구멍 */}
        <ellipse cx="48" cy="55" rx="1.5" ry="1" fill="#556B2F"/>
        <ellipse cx="52" cy="55" rx="1.5" ry="1" fill="#556B2F"/>
        {/* 갈라진 혀 */}
        <line x1="50" y1="58" x2="50" y2="64" stroke="#DC143C" strokeWidth="2"/>
        <path d="M 50 64 L 48 68" stroke="#DC143C" strokeWidth="1.5"/>
        <path d="M 50 64 L 52 68" stroke="#DC143C" strokeWidth="1.5"/>
    </svg>
);

export const HorseAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#D2691E"/>
        {/* 갈기 */}
        <path d="M 35 20 Q 30 28 32 36" fill="#8B4513" stroke="#654321" strokeWidth="1"/>
        <path d="M 42 18 Q 38 26 40 34" fill="#8B4513" stroke="#654321" strokeWidth="1"/>
        <path d="M 50 16 Q 48 24 50 32" fill="#8B4513" stroke="#654321" strokeWidth="1"/>
        <path d="M 58 18 Q 58 26 60 34" fill="#8B4513" stroke="#654321" strokeWidth="1"/>
        <path d="M 65 20 Q 68 28 68 36" fill="#8B4513" stroke="#654321" strokeWidth="1"/>
        {/* 얼굴 (긴 타원형) */}
        <ellipse cx="50" cy="52" rx="22" ry="30" fill="#CD853F"/>
        {/* 뾰족한 귀 */}
        <path d="M 32 32 L 28 20 L 36 28 Z" fill="#A0522D"/>
        <path d="M 68 32 L 72 20 L 64 28 Z" fill="#A0522D"/>
        {/* 큰 눈 */}
        <ellipse cx="42" cy="46" rx="4" ry="6" fill="#000"/>
        <ellipse cx="58" cy="46" rx="4" ry="6" fill="#000"/>
        <circle cx="42" cy="45" r="2" fill="#FFF"/>
        <circle cx="58" cy="45" r="2" fill="#FFF"/>
        {/* 큰 콧구멍 */}
        <ellipse cx="50" cy="64" rx="9" ry="6" fill="#A0522D"/>
        <ellipse cx="46" cy="64" rx="3" ry="4" fill="#654321"/>
        <ellipse cx="54" cy="64" rx="3" ry="4" fill="#654321"/>
        {/* 입 */}
        <path d="M 42 70 Q 50 72 58 70" stroke="#8B4513" strokeWidth="2" fill="none"/>
    </svg>
);

export const GoatAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFF8DC"/>
        {/* 뿔 (염소 특유의 곡선) */}
        <path d="M 28 28 Q 22 18 24 12 Q 26 18 28 24" fill="#8B7355" stroke="#5D4E37" strokeWidth="1.5"/>
        <path d="M 72 28 Q 78 18 76 12 Q 74 18 72 24" fill="#8B7355" stroke="#5D4E37" strokeWidth="1.5"/>
        {/* 얼굴 */}
        <ellipse cx="50" cy="52" rx="24" ry="28" fill="#FFFAF0"/>
        {/* 귀 (옆으로 긴) */}
        <ellipse cx="24" cy="42" rx="6" ry="10" fill="#F5DEB3" transform="rotate(-30 24 42)"/>
        <ellipse cx="76" cy="42" rx="6" ry="10" fill="#F5DEB3" transform="rotate(30 76 42)"/>
        {/* 가로로 긴 눈동자 */}
        <ellipse cx="42" cy="48" rx="6" ry="5" fill="#8B7355"/>
        <ellipse cx="58" cy="48" rx="6" ry="5" fill="#8B7355"/>
        <rect x="39" y="47" width="6" height="2" fill="#000"/>
        <rect x="55" y="47" width="6" height="2" fill="#000"/>
        {/* 코 */}
        <ellipse cx="50" cy="60" rx="4" ry="3" fill="#D2B48C"/>
        {/* 턱수염 */}
        <ellipse cx="50" cy="72" rx="4" ry="8" fill="#F5DEB3"/>
        {/* 입 */}
        <path d="M 42 64 Q 50 66 58 64" stroke="#8B7355" strokeWidth="1.5" fill="none"/>
    </svg>
);

export const MonkeyAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#D2691E"/>
        {/* 큰 귀 */}
        <circle cx="22" cy="45" r="12" fill="#CD853F"/>
        <circle cx="22" cy="45" r="8" fill="#FFE4B5"/>
        <circle cx="78" cy="45" r="12" fill="#CD853F"/>
        <circle cx="78" cy="45" r="8" fill="#FFE4B5"/>
        {/* 얼굴 */}
        <ellipse cx="50" cy="50" rx="26" ry="28" fill="#F4A460"/>
        {/* 얼굴 중앙 밝은 부분 */}
        <ellipse cx="50" cy="56" rx="18" ry="16" fill="#FFE4B5"/>
        {/* 큰 눈 (원숭이 특유의) */}
        <ellipse cx="40" cy="44" rx="5" ry="6" fill="#8B4513"/>
        <ellipse cx="60" cy="44" rx="5" ry="6" fill="#8B4513"/>
        <circle cx="40" cy="43" r="2.5" fill="#FFF"/>
        <circle cx="60" cy="43" r="2.5" fill="#FFF"/>
        {/* 코 */}
        <ellipse cx="48" cy="56" rx="2" ry="3" fill="#8B4513"/>
        <ellipse cx="52" cy="56" rx="2" ry="3" fill="#8B4513"/>
        {/* 큰 입 (웃는 모습) */}
        <path d="M 38 62 Q 50 68 62 62" stroke="#8B4513" strokeWidth="2" fill="none"/>
        {/* 볼 */}
        <circle cx="30" cy="54" r="5" fill="#FFB6C1" opacity="0.4"/>
        <circle cx="70" cy="54" r="5" fill="#FFB6C1" opacity="0.4"/>
    </svg>
);

export const RoosterAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFE4B5"/>
        {/* 볏 (닭 특유의 큰 볏) */}
        <path d="M 38 22 L 42 10 L 46 20 L 50 8 L 54 20 L 58 10 L 62 22 Z" fill="#DC143C"/>
        {/* 얼굴 */}
        <ellipse cx="50" cy="52" rx="24" ry="26" fill="#FFA500"/>
        {/* 부리 */}
        <path d="M 44 52 L 35 54 L 44 56 Z" fill="#FFD700" stroke="#FF8C00" strokeWidth="1"/>
        {/* 눈 */}
        <circle cx="42" cy="46" r="5" fill="#FFF"/>
        <circle cx="58" cy="46" r="5" fill="#FFF"/>
        <circle cx="42" cy="46" r="3" fill="#000"/>
        <circle cx="58" cy="46" r="3" fill="#000"/>
        <circle cx="42" cy="45" r="1.5" fill="#FFF"/>
        <circle cx="58" cy="45" r="1.5" fill="#FFF"/>
        {/* 뺨 (붉은색) */}
        <ellipse cx="32" cy="54" rx="6" ry="8" fill="#FF6347"/>
        <ellipse cx="68" cy="54" rx="6" ry="8" fill="#FF6347"/>
        {/* 턱밑 살 */}
        <ellipse cx="50" cy="68" rx="8" ry="10" fill="#DC143C"/>
        {/* 깃털 무늬 */}
        <path d="M 38 62 L 35 68" stroke="#8B4513" strokeWidth="1.5"/>
        <path d="M 62 62 L 65 68" stroke="#8B4513" strokeWidth="1.5"/>
    </svg>
);

export const DogAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#F5DEB3"/>
        {/* 축 늘어진 귀 */}
        <ellipse cx="24" cy="50" rx="8" ry="18" fill="#DEB887"/>
        <ellipse cx="76" cy="50" rx="8" ry="18" fill="#DEB887"/>
        {/* 얼굴 */}
        <ellipse cx="50" cy="50" rx="26" ry="28" fill="#FAEBD7"/>
        {/* 입 부분 (강아지 특유의) */}
        <ellipse cx="50" cy="60" rx="18" ry="14" fill="#FAEBD7"/>
        {/* 큰 눈 (강아지 눈) */}
        <circle cx="40" cy="44" r="5" fill="#000"/>
        <circle cx="60" cy="44" r="5" fill="#000"/>
        <circle cx="40" cy="43" r="2.5" fill="#FFF"/>
        <circle cx="60" cy="43" r="2.5" fill="#FFF"/>
        {/* 큰 코 */}
        <ellipse cx="50" cy="58" rx="5" ry="4" fill="#000"/>
        {/* 입 (웃는 표정) */}
        <path d="M 40 62 Q 50 68 60 62" stroke="#8B7355" strokeWidth="2" fill="none"/>
        <line x1="50" y1="58" x2="50" y2="62" stroke="#000" strokeWidth="2"/>
        {/* 혀 */}
        <ellipse cx="50" cy="66" rx="4" ry="3" fill="#FFB6C1"/>
        {/* 반점 (선택적) */}
        <circle cx="35" cy="38" r="4" fill="#DEB887" opacity="0.6"/>
    </svg>
);

export const PigAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFB6C1"/>
        {/* 얼굴 (통통한) */}
        <circle cx="50" cy="52" r="28" fill="#FFC0CB"/>
        {/* 귀 (뾰족한 삼각형) */}
        <path d="M 28 30 L 22 22 L 30 26 Z" fill="#FFB6C1"/>
        <path d="M 72 30 L 78 22 L 70 26 Z" fill="#FFB6C1"/>
        {/* 큰 눈 */}
        <circle cx="40" cy="46" r="4" fill="#000"/>
        <circle cx="60" cy="46" r="4" fill="#000"/>
        <circle cx="40" cy="45" r="2" fill="#FFF"/>
        <circle cx="60" cy="45" r="2" fill="#FFF"/>
        {/* 큰 코 (돼지 특유의) */}
        <ellipse cx="50" cy="58" rx="12" ry="10" fill="#FF69B4"/>
        <ellipse cx="46" cy="58" rx="4" ry="5" fill="#C71585"/>
        <ellipse cx="54" cy="58" rx="4" ry="5" fill="#C71585"/>
        {/* 입 (웃는 표정) */}
        <path d="M 38 66 Q 50 70 62 66" stroke="#FF69B4" strokeWidth="2" fill="none"/>
        {/* 볼 */}
        <circle cx="28" cy="54" r="6" fill="#FFE4E1" opacity="0.5"/>
        <circle cx="72" cy="54" r="6" fill="#FFE4E1" opacity="0.5"/>
    </svg>
);

// 추가 동물 8개
export const CatAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFE4B5"/>
        {/* 뾰족한 귀 */}
        <path d="M 28 24 L 20 8 L 36 26 Z" fill="#FFA500"/>
        <path d="M 28 24 L 24 14 L 32 24 Z" fill="#FFE4B5"/>
        <path d="M 72 24 L 80 8 L 64 26 Z" fill="#FFA500"/>
        <path d="M 72 24 L 76 14 L 68 24 Z" fill="#FFE4B5"/>
        {/* 얼굴 */}
        <ellipse cx="50" cy="52" rx="24" ry="26" fill="#FFD700"/>
        {/* 큰 눈 (고양이 특유의) */}
        <ellipse cx="40" cy="46" rx="6" ry="8" fill="#32CD32"/>
        <ellipse cx="60" cy="46" rx="6" ry="8" fill="#32CD32"/>
        <ellipse cx="40" cy="46" rx="2" ry="6" fill="#000"/>
        <ellipse cx="60" cy="46" rx="2" ry="6" fill="#000"/>
        <ellipse cx="40" cy="44" rx="1" ry="3" fill="#FFF"/>
        <ellipse cx="60" cy="44" rx="1" ry="3" fill="#FFF"/>
        {/* 작은 분홍코 */}
        <path d="M 48 58 L 50 60 L 52 58 Z" fill="#FFB6C1"/>
        {/* W자 입 */}
        <line x1="50" y1="60" x2="50" y2="62" stroke="#8B7355" strokeWidth="1.5"/>
        <path d="M 42 64 Q 46 62 50 62 Q 54 62 58 64" stroke="#8B7355" strokeWidth="1.5" fill="none"/>
        {/* 수염 */}
        <line x1="28" y1="54" x2="16" y2="52" stroke="#8B7355" strokeWidth="1.5"/>
        <line x1="28" y1="58" x2="16" y2="60" stroke="#8B7355" strokeWidth="1.5"/>
        <line x1="72" y1="54" x2="84" y2="52" stroke="#8B7355" strokeWidth="1.5"/>
        <line x1="72" y1="58" x2="84" y2="60" stroke="#8B7355" strokeWidth="1.5"/>
    </svg>
);

export const BearAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#8B4513"/>
        {/* 둥근 귀 */}
        <circle cx="30" cy="28" r="14" fill="#A0522D"/>
        <circle cx="30" cy="28" r="9" fill="#8B7355"/>
        <circle cx="70" cy="28" r="14" fill="#A0522D"/>
        <circle cx="70" cy="28" r="9" fill="#8B7355"/>
        {/* 얼굴 */}
        <circle cx="50" cy="52" r="28" fill="#CD853F"/>
        {/* 입 부분 (밝은 색) */}
        <ellipse cx="50" cy="60" rx="16" ry="14" fill="#DEB887"/>
        {/* 작은 눈 */}
        <circle cx="40" cy="46" r="4" fill="#000"/>
        <circle cx="60" cy="46" r="4" fill="#000"/>
        <circle cx="40" cy="45" r="2" fill="#FFF"/>
        <circle cx="60" cy="45" r="2" fill="#FFF"/>
        {/* 큰 코 */}
        <ellipse cx="50" cy="60" rx="6" ry="5" fill="#000"/>
        {/* 입 */}
        <path d="M 42 66 Q 50 70 58 66" stroke="#8B7355" strokeWidth="2" fill="none"/>
        <line x1="50" y1="60" x2="50" y2="66" stroke="#000" strokeWidth="2"/>
    </svg>
);

export const FoxAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FF8C00"/>
        {/* 뾰족한 귀 */}
        <path d="M 30 24 L 24 8 L 36 28 Z" fill="#FF6347"/>
        <path d="M 30 24 L 28 14 L 34 26 Z" fill="#FFF"/>
        <path d="M 70 24 L 76 8 L 64 28 Z" fill="#FF6347"/>
        <path d="M 70 24 L 72 14 L 66 26 Z" fill="#FFF"/>
        {/* 얼굴 */}
        <ellipse cx="50" cy="52" rx="24" ry="28" fill="#FFA500"/>
        {/* 흰색 부분 */}
        <ellipse cx="50" cy="60" rx="18" ry="16" fill="#FFF"/>
        {/* 날카로운 눈 */}
        <ellipse cx="40" cy="46" rx="5" ry="7" fill="#FFD700"/>
        <ellipse cx="60" cy="46" rx="5" ry="7" fill="#FFD700"/>
        <ellipse cx="40" cy="46" rx="2" ry="5" fill="#000"/>
        <ellipse cx="60" cy="46" rx="2" ry="5" fill="#000"/>
        <ellipse cx="40" cy="45" rx="1" ry="2" fill="#FFF"/>
        <ellipse cx="60" cy="45" rx="1" ry="2" fill="#FFF"/>
        {/* 작은 검은 코 */}
        <path d="M 48 58 L 50 60 L 52 58 Z" fill="#000"/>
        {/* 입 */}
        <path d="M 42 62 Q 50 66 58 62" stroke="#FF6347" strokeWidth="1.5" fill="none"/>
        <line x1="50" y1="60" x2="50" y2="62" stroke="#000" strokeWidth="1.5"/>
    </svg>
);

export const PandaAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#F5F5F5"/>
        {/* 검은 귀 */}
        <circle cx="30" cy="32" r="12" fill="#000"/>
        <circle cx="70" cy="32" r="12" fill="#000"/>
        {/* 흰 얼굴 */}
        <circle cx="50" cy="52" r="26" fill="#FFF"/>
        {/* 큰 검은 눈 주위 */}
        <ellipse cx="38" cy="46" rx="9" ry="11" fill="#000"/>
        <ellipse cx="62" cy="46" rx="9" ry="11" fill="#000"/>
        {/* 흰 눈 */}
        <circle cx="38" cy="46" r="5" fill="#FFF"/>
        <circle cx="62" cy="46" r="5" fill="#FFF"/>
        <circle cx="38" cy="46" r="3" fill="#000"/>
        <circle cx="62" cy="46" r="3" fill="#000"/>
        <circle cx="38" cy="45" r="1.5" fill="#FFF"/>
        <circle cx="62" cy="45" r="1.5" fill="#FFF"/>
        {/* 코 */}
        <ellipse cx="50" cy="58" rx="5" ry="4" fill="#000"/>
        {/* 입 */}
        <path d="M 42 64 Q 50 68 58 64" stroke="#000" strokeWidth="2" fill="none"/>
        <line x1="50" y1="58" x2="50" y2="64" stroke="#000" strokeWidth="2"/>
        {/* 대나무 (선택적) */}
        <rect x="68" y="60" width="4" height="20" fill="#8FBC8F" rx="2"/>
    </svg>
);

export const KoalaAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#B0B0B0"/>
        {/* 큰 솜털 귀 */}
        <circle cx="26" cy="30" r="16" fill="#A9A9A9"/>
        <circle cx="26" cy="30" r="11" fill="#D3D3D3"/>
        <circle cx="74" cy="30" r="16" fill="#A9A9A9"/>
        <circle cx="74" cy="30" r="11" fill="#D3D3D3"/>
        {/* 얼굴 */}
        <ellipse cx="50" cy="54" rx="26" ry="28" fill="#C0C0C0"/>
        {/* 코 (코알라 특유의 큰 코) */}
        <ellipse cx="50" cy="58" rx="10" ry="12" fill="#696969"/>
        <ellipse cx="48" cy="56" rx="2" ry="3" fill="#000"/>
        <ellipse cx="52" cy="56" rx="2" ry="3" fill="#000"/>
        {/* 작은 눈 */}
        <circle cx="38" cy="46" r="4" fill="#000"/>
        <circle cx="62" cy="46" r="4" fill="#000"/>
        <circle cx="38" cy="45" r="2" fill="#FFF"/>
        <circle cx="62" cy="45" r="2" fill="#FFF"/>
        {/* 입 */}
        <path d="M 42 66 Q 50 68 58 66" stroke="#696969" strokeWidth="2" fill="none"/>
    </svg>
);

export const LionAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#F4A460"/>
        {/* 갈기 (여러 개의 원으로 표현) */}
        <circle cx="30" cy="28" r="10" fill="#D2691E" opacity="0.8"/>
        <circle cx="70" cy="28" r="10" fill="#D2691E" opacity="0.8"/>
        <circle cx="22" cy="42" r="10" fill="#D2691E" opacity="0.8"/>
        <circle cx="78" cy="42" r="10" fill="#D2691E" opacity="0.8"/>
        <circle cx="24" cy="58" r="10" fill="#D2691E" opacity="0.8"/>
        <circle cx="76" cy="58" r="10" fill="#D2691E" opacity="0.8"/>
        <circle cx="32" cy="70" r="10" fill="#D2691E" opacity="0.8"/>
        <circle cx="68" cy="70" r="10" fill="#D2691E" opacity="0.8"/>
        {/* 얼굴 */}
        <circle cx="50" cy="52" r="24" fill="#FFD700"/>
        {/* 강한 눈 */}
        <ellipse cx="42" cy="48" rx="5" ry="6" fill="#8B4513"/>
        <ellipse cx="58" cy="48" rx="5" ry="6" fill="#8B4513"/>
        <circle cx="42" cy="47" r="2" fill="#FFF"/>
        <circle cx="58" cy="47" r="2" fill="#FFF"/>
        {/* 코 */}
        <path d="M 48 56 L 50 58 L 52 56 Z" fill="#8B4513"/>
        {/* 입 (웅장한) */}
        <path d="M 40 62 Q 50 66 60 62" stroke="#8B4513" strokeWidth="2" fill="none"/>
        <line x1="50" y1="58" x2="50" y2="62" stroke="#8B4513" strokeWidth="2"/>
        {/* 수염 */}
        <line x1="32" y1="56" x2="20" y2="54" stroke="#8B4513" strokeWidth="1.5"/>
        <line x1="68" y1="56" x2="80" y2="54" stroke="#8B4513" strokeWidth="1.5"/>
    </svg>
);

export const PenguinAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#2F4F4F"/>
        {/* 몸통 (검은색) */}
        <ellipse cx="50" cy="54" rx="24" ry="32" fill="#000"/>
        {/* 배 (흰색) */}
        <ellipse cx="50" cy="58" rx="18" ry="24" fill="#FFF"/>
        {/* 얼굴 흰 부분 */}
        <ellipse cx="40" cy="42" rx="8" ry="10" fill="#FFF"/>
        <ellipse cx="60" cy="42" rx="8" ry="10" fill="#FFF"/>
        {/* 눈 */}
        <circle cx="40" cy="42" r="4" fill="#000"/>
        <circle cx="60" cy="42" r="4" fill="#000"/>
        <circle cx="40" cy="41" r="2" fill="#FFF"/>
        <circle cx="60" cy="41" r="2" fill="#FFF"/>
        {/* 부리 */}
        <path d="M 46 50 L 40 52 L 46 54 Z" fill="#FFA500"/>
        {/* 볼 (분홍색) */}
        <circle cx="32" cy="48" r="4" fill="#FFB6C1" opacity="0.6"/>
        <circle cx="68" cy="48" r="4" fill="#FFB6C1" opacity="0.6"/>
        {/* 날개 */}
        <ellipse cx="26" cy="60" rx="6" ry="14" fill="#000" transform="rotate(-20 26 60)"/>
        <ellipse cx="74" cy="60" rx="6" ry="14" fill="#000" transform="rotate(20 74 60)"/>
        {/* 발 */}
        <ellipse cx="44" cy="80" rx="6" ry="4" fill="#FFA500"/>
        <ellipse cx="56" cy="80" rx="6" ry="4" fill="#FFA500"/>
    </svg>
);

export const OwlAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#8B7355"/>
        {/* 귀 깃털 (뾰족) */}
        <path d="M 28 20 L 24 8 L 32 24 Z" fill="#654321"/>
        <path d="M 72 20 L 76 8 L 68 24 Z" fill="#654321"/>
        {/* 얼굴 */}
        <ellipse cx="50" cy="52" rx="28" ry="32" fill="#A0826D"/>
        {/* 큰 눈 주위 (올빼미 특유의) */}
        <circle cx="38" cy="46" r="12" fill="#F5DEB3"/>
        <circle cx="62" cy="46" r="12" fill="#F5DEB3"/>
        {/* 큰 눈동자 */}
        <circle cx="38" cy="46" r="8" fill="#FFD700"/>
        <circle cx="62" cy="46" r="8" fill="#FFD700"/>
        <circle cx="38" cy="46" r="5" fill="#000"/>
        <circle cx="62" cy="46" r="5" fill="#000"/>
        <circle cx="38" cy="44" r="2" fill="#FFF"/>
        <circle cx="62" cy="44" r="2" fill="#FFF"/>
        {/* 부리 */}
        <path d="M 46 54 L 50 62 L 54 54 Z" fill="#8B7355"/>
        {/* 깃털 무늬 */}
        <path d="M 30 64 Q 34 68 38 64" stroke="#654321" strokeWidth="1.5" fill="none"/>
        <path d="M 62 64 Q 66 68 70 64" stroke="#654321" strokeWidth="1.5" fill="none"/>
    </svg>
);

// 아바타 목록 (순서: 십이지신 12개 + 추가 8개)
export const avatarList = [
    { id: 'rat', name: '쥐', component: RatAvatar, zodiacYear: [0, 12, 24, 36, 48, 60, 72, 84, 96] },
    { id: 'ox', name: '소', component: OxAvatar, zodiacYear: [1, 13, 25, 37, 49, 61, 73, 85, 97] },
    { id: 'tiger', name: '호랑이', component: TigerAvatar, zodiacYear: [2, 14, 26, 38, 50, 62, 74, 86, 98] },
    { id: 'rabbit', name: '토끼', component: RabbitAvatar, zodiacYear: [3, 15, 27, 39, 51, 63, 75, 87, 99] },
    { id: 'dragon', name: '용', component: DragonAvatar, zodiacYear: [4, 16, 28, 40, 52, 64, 76, 88, 100] },
    { id: 'snake', name: '뱀', component: SnakeAvatar, zodiacYear: [5, 17, 29, 41, 53, 65, 77, 89, 101] },
    { id: 'horse', name: '말', component: HorseAvatar, zodiacYear: [6, 18, 30, 42, 54, 66, 78, 90, 102] },
    { id: 'goat', name: '양', component: GoatAvatar, zodiacYear: [7, 19, 31, 43, 55, 67, 79, 91, 103] },
    { id: 'monkey', name: '원숭이', component: MonkeyAvatar, zodiacYear: [8, 20, 32, 44, 56, 68, 80, 92, 104] },
    { id: 'rooster', name: '닭', component: RoosterAvatar, zodiacYear: [9, 21, 33, 45, 57, 69, 81, 93, 105] },
    { id: 'dog', name: '개', component: DogAvatar, zodiacYear: [10, 22, 34, 46, 58, 70, 82, 94, 106] },
    { id: 'pig', name: '돼지', component: PigAvatar, zodiacYear: [11, 23, 35, 47, 59, 71, 83, 95, 107] },
    { id: 'cat', name: '고양이', component: CatAvatar, zodiacYear: null },
    { id: 'bear', name: '곰', component: BearAvatar, zodiacYear: null },
    { id: 'fox', name: '여우', component: FoxAvatar, zodiacYear: null },
    { id: 'panda', name: '판다', component: PandaAvatar, zodiacYear: null },
    { id: 'koala', name: '코알라', component: KoalaAvatar, zodiacYear: null },
    { id: 'lion', name: '사자', component: LionAvatar, zodiacYear: null },
    { id: 'penguin', name: '펭귄', component: PenguinAvatar, zodiacYear: null },
    { id: 'owl', name: '부엉이', component: OwlAvatar, zodiacYear: null },
];

// 음력 설날 날짜 (1900-2100년) - MM-DD 형식
// 음력 설날 이전에 태어난 사람은 이전 해의 띠를 가짐
const lunarNewYearDates = {
    1900: '01-31', 1901: '02-19', 1902: '02-08', 1903: '01-29', 1904: '02-16',
    1905: '02-04', 1906: '01-25', 1907: '02-13', 1908: '02-02', 1909: '01-22',
    1910: '02-10', 1911: '01-30', 1912: '02-18', 1913: '02-06', 1914: '01-26',
    1915: '02-14', 1916: '02-03', 1917: '01-23', 1918: '02-11', 1919: '02-01',
    1920: '02-20', 1921: '02-08', 1922: '01-28', 1923: '02-16', 1924: '02-05',
    1925: '01-24', 1926: '02-13', 1927: '02-02', 1928: '01-23', 1929: '02-10',
    1930: '01-30', 1931: '02-17', 1932: '02-06', 1933: '01-26', 1934: '02-14',
    1935: '02-04', 1936: '01-24', 1937: '02-11', 1938: '01-31', 1939: '02-19',
    1940: '02-08', 1941: '01-27', 1942: '02-15', 1943: '02-05', 1944: '01-25',
    1945: '02-13', 1946: '02-02', 1947: '01-22', 1948: '02-10', 1949: '01-29',
    1950: '02-17', 1951: '02-06', 1952: '01-27', 1953: '02-14', 1954: '02-03',
    1955: '01-24', 1956: '02-12', 1957: '01-31', 1958: '02-18', 1959: '02-08',
    1960: '01-28', 1961: '02-15', 1962: '02-05', 1963: '01-25', 1964: '02-13',
    1965: '02-02', 1966: '01-21', 1967: '02-09', 1968: '01-30', 1969: '02-17',
    1970: '02-06', 1971: '01-27', 1972: '02-15', 1973: '02-03', 1974: '01-23',
    1975: '02-11', 1976: '01-31', 1977: '02-18', 1978: '02-07', 1979: '01-28',
    1980: '02-16', 1981: '02-05', 1982: '01-25', 1983: '02-13', 1984: '02-02',
    1985: '02-20', 1986: '02-09', 1987: '01-29', 1988: '02-17', 1989: '02-06',
    1990: '01-27', 1991: '02-15', 1992: '02-04', 1993: '01-23', 1994: '02-10',
    1995: '01-31', 1996: '02-19', 1997: '02-07', 1998: '01-28', 1999: '02-16',
    2000: '02-05', 2001: '01-24', 2002: '02-12', 2003: '02-01', 2004: '01-22',
    2005: '02-09', 2006: '01-29', 2007: '02-18', 2008: '02-07', 2009: '01-26',
    2010: '02-14', 2011: '02-03', 2012: '01-23', 2013: '02-10', 2014: '01-31',
    2015: '02-19', 2016: '02-08', 2017: '01-28', 2018: '02-16', 2019: '02-05',
    2020: '01-25', 2021: '02-12', 2022: '02-01', 2023: '01-22', 2024: '02-10',
    2025: '01-29', 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13',
    2030: '02-03', 2031: '01-23', 2032: '02-11', 2033: '01-31', 2034: '02-19',
    2035: '02-08', 2036: '01-28', 2037: '02-15', 2038: '02-04', 2039: '01-24',
    2040: '02-12', 2041: '02-01', 2042: '01-22', 2043: '02-10', 2044: '01-30',
    2045: '02-17', 2046: '02-06', 2047: '01-26', 2048: '02-14', 2049: '02-02',
    2050: '01-23', 2051: '02-11', 2052: '02-01', 2053: '02-19', 2054: '02-08',
    2055: '01-28', 2056: '02-15', 2057: '02-04', 2058: '01-24', 2059: '02-12',
    2060: '02-02', 2061: '01-21', 2062: '02-09', 2063: '01-29', 2064: '02-17',
    2065: '02-05', 2066: '01-26', 2067: '02-14', 2068: '02-03', 2069: '01-23',
    2070: '02-11', 2071: '01-31', 2072: '02-19', 2073: '02-07', 2074: '01-27',
    2075: '02-15', 2076: '02-05', 2077: '01-24', 2078: '02-12', 2079: '02-02',
    2080: '01-22', 2081: '02-09', 2082: '01-29', 2083: '02-17', 2084: '02-06',
    2085: '01-26', 2086: '02-14', 2087: '02-03', 2088: '01-24', 2089: '02-10',
    2090: '01-30', 2091: '02-18', 2092: '02-07', 2093: '01-27', 2094: '02-15',
    2095: '02-05', 2096: '01-25', 2097: '02-12', 2098: '02-01', 2099: '01-21',
    2100: '02-09'
};

// 생년월일을 기반으로 추천 아바타 찾기 (음력 설날 기준)
export const getRecommendedAvatar = (birthYear, birthMonth, birthDay) => {
    if (!birthYear) return null;
    const year = parseInt(birthYear);
    if (isNaN(year) || year < 1900 || year > 2100) return null;

    // 실제 띠를 결정할 연도 (음력 설날 이전이면 전년도)
    let zodiacYear = year;

    // 생월일이 제공되고, 음력 설날 정보가 있는 경우
    if (birthMonth && birthDay && lunarNewYearDates[year]) {
        const month = parseInt(birthMonth);
        const day = parseInt(birthDay);

        if (!isNaN(month) && !isNaN(day)) {
            const [lunarMonth, lunarDay] = lunarNewYearDates[year].split('-').map(Number);

            // 생일이 음력 설날 이전이면 전년도의 띠
            if (month < lunarMonth || (month === lunarMonth && day < lunarDay)) {
                zodiacYear = year - 1;
            }
        }
    }

    const yearOffset = zodiacYear - 1900;
    const zodiacIndex = yearOffset % 12;

    return avatarList.find(avatar =>
        avatar.zodiacYear && avatar.zodiacYear.includes(zodiacIndex)
    );
};
