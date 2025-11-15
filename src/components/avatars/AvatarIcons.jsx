// src/components/avatars/AvatarIcons.jsx
// SVG 아바타 아이콘 컬렉션 (십이지신 12개 + 추가 8개) - 귀엽고 특징적인 디자인

import React from 'react';

// 십이지신 (12 Zodiac Animals) - 심플하고 귀여운 디자인
export const RatAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* 몸통 */}
        <circle cx="50" cy="60" r="27.5" fill="#D3D3D3" stroke="#6C7A89" strokeWidth="1"/>
        {/* 머리 */}
        <circle cx="50" cy="40" r="22.5" fill="#D3D3D3" stroke="#6C7A89" strokeWidth="1"/>

        {/* 큰 귀 */}
        <circle cx="35" cy="28" r="10" fill="#D3D3D3" stroke="#6C7A89" strokeWidth="1"/>
        <circle cx="35" cy="28" r="6" fill="#FFB6C1"/>
        <circle cx="65" cy="28" r="10" fill="#D3D3D3" stroke="#6C7A89" strokeWidth="1"/>
        <circle cx="65" cy="28" r="6" fill="#FFB6C1"/>

        {/* 눈 */}
        <circle cx="42" cy="38" r="3.5" fill="#333"/>
        <circle cx="58" cy="38" r="3.5" fill="#333"/>
        <circle cx="41" cy="37" r="1" fill="white"/>
        <circle cx="57" cy="37" r="1" fill="white"/>

        {/* 코 */}
        <ellipse cx="50" cy="45" rx="4" ry="3" fill="#FFB6C1"/>
        <circle cx="48" cy="44" r="0.8" fill="#6C7A89"/>
        <circle cx="52" cy="44" r="0.8" fill="#6C7A89"/>

        {/* 입 */}
        <path d="M 45 48 Q 50 52 55 48" stroke="#6C7A89" strokeWidth="1" fill="none"/>

        {/* 앞니 */}
        <rect x="47" y="52" width="2" height="3" fill="#FFFFFF" stroke="#6C7A89" strokeWidth="0.5"/>
        <rect x="51" y="52" width="2" height="3" fill="#FFFFFF" stroke="#6C7A89" strokeWidth="0.5"/>

        {/* 발 */}
        <circle cx="35" cy="82" r="9" fill="#D3D3D3" stroke="#6C7A89" strokeWidth="1"/>
        <circle cx="65" cy="82" r="9" fill="#D3D3D3" stroke="#6C7A89" strokeWidth="1"/>

        {/* 꼬리 */}
        <path d="M 70 65 Q 80 70 85 78" stroke="#A9A9A9" strokeWidth="2" fill="none"/>
    </svg>
);

export const OxAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* 몸통 */}
        <circle cx="50" cy="60" r="27.5" fill="#FFFFFF" stroke="#6C7A89" strokeWidth="1"/>
        {/* 머리 */}
        <circle cx="50" cy="40" r="22.5" fill="#FFFFFF" stroke="#6C7A89" strokeWidth="1"/>

        {/* 코 부분 */}
        <ellipse cx="50" cy="50" rx="10" ry="7.5" fill="#FFB6C1" stroke="#6C7A89" strokeWidth="0.75"/>
        <circle cx="45" cy="49" r="1.5" fill="#6C7A89"/>
        <circle cx="55" cy="49" r="1.5" fill="#6C7A89"/>

        {/* 뿔 */}
        <path d="M 37.5 30 Q 40 20 42.5 30" fill="#DAA520" stroke="#B8860B" strokeWidth="1"/>
        <path d="M 62.5 30 Q 60 20 57.5 30" fill="#DAA520" stroke="#B8860B" strokeWidth="1"/>

        {/* 눈 */}
        <circle cx="40" cy="37.5" r="3.5" fill="#333"/>
        <circle cx="60" cy="37.5" r="3.5" fill="#333"/>
        <circle cx="39.5" cy="37" r="1" fill="white"/>
        <circle cx="59.5" cy="37" r="1" fill="white"/>

        {/* 입 */}
        <path d="M 45 52.5 Q 50 55 55 52.5" stroke="#6C7A89" strokeWidth="1" fill="none"/>

        {/* 발 */}
        <circle cx="35" cy="82" r="9" fill="#FFFFFF" stroke="#6C7A89" strokeWidth="1"/>
        <circle cx="65" cy="82" r="9" fill="#FFFFFF" stroke="#6C7A89" strokeWidth="1"/>

        {/* 꼬리 & 풀 */}
        <path d="M 50 50 C 55 55 60 55 65 50" stroke="#A0522D" strokeWidth="1.5" fill="none"/>
        <path d="M 65 50 C 70 55 75 55 80 50" stroke="#A0522D" strokeWidth="1.5" fill="none"/>
        <path d="M 62.5 50 L 70 47.5 L 72.5 50 Q 70 55 62.5 52.5 Z" fill="#6B8E23" stroke="#4F641A" strokeWidth="0.75"/>
    </svg>
);

export const TigerAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* 몸통 */}
        <circle cx="50" cy="60" r="27.5" fill="#FF8C00" stroke="#A0522D" strokeWidth="1"/>
        {/* 머리 */}
        <circle cx="50" cy="40" r="22.5" fill="#FF8C00" stroke="#A0522D" strokeWidth="1"/>

        {/* 호랑이 무늬 */}
        <path d="M 40 27.5 L 45 32.5 L 50 27.5 L 55 32.5 L 60 27.5" stroke="#333" strokeWidth="1"/>

        {/* 귀 */}
        <circle cx="37.5" cy="32.5" r="7.5" fill="#FF8C00" stroke="#A0522D" strokeWidth="1"/>
        <circle cx="62.5" cy="32.5" r="7.5" fill="#FF8C00" stroke="#A0522D" strokeWidth="1"/>
        <circle cx="37.5" cy="32.5" r="4" fill="#FFEBCD"/>
        <circle cx="62.5" cy="32.5" r="4" fill="#FFEBCD"/>

        {/* 눈 */}
        <circle cx="42.5" cy="40" r="3.5" fill="#333"/>
        <circle cx="57.5" cy="40" r="3.5" fill="#333"/>
        <circle cx="42" cy="39.5" r="1" fill="white"/>
        <circle cx="57" cy="39.5" r="1" fill="white"/>

        {/* 코 */}
        <path d="M 50 45 L 49 47.5 L 51 47.5 Z" fill="#A0522D"/>

        {/* 입 */}
        <path d="M 45 50 Q 50 52.5 55 50" stroke="#333" strokeWidth="1" fill="none"/>

        {/* 꼬리 */}
        <path d="M 70 70 Q 80 65 75 55 Q 70 50 60 50" stroke="#A0522D" strokeWidth="1" fill="none"/>

        {/* 발 */}
        <circle cx="35" cy="77.5" r="9" fill="#FF8C00" stroke="#A0522D" strokeWidth="1"/>
        <circle cx="65" cy="77.5" r="9" fill="#FF8C00" stroke="#A0522D" strokeWidth="1"/>

        {/* 호랑이 무늬 - 몸통 */}
        <path d="M 40 55 L 45 57.5 L 40 60 L 35 57.5 Z" fill="#333"/>
        <path d="M 60 55 L 55 57.5 L 60 60 L 65 57.5 Z" fill="#333"/>

        {/* 왕 문양 */}
        <path d="M 50 30 L 45 35 L 50 40 L 55 35 Z" fill="#333"/>
        <path d="M 50 35 L 47.5 37.5 L 52.5 37.5 Z" fill="#FFD700"/>
    </svg>
);

export const RabbitAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* 몸통 */}
        <circle cx="50" cy="60" r="27.5" fill="#FFFFFF" stroke="#6C7A89" strokeWidth="1"/>
        {/* 머리 */}
        <circle cx="50" cy="40" r="22.5" fill="#FFFFFF" stroke="#6C7A89" strokeWidth="1"/>

        {/* 긴 귀 */}
        <rect x="42.5" y="5" width="15" height="25" rx="7.5" ry="7.5" fill="#FFFFFF" stroke="#6C7A89" strokeWidth="1" transform="rotate(-5 50 17.5)"/>
        <rect x="42.5" y="5" width="15" height="25" rx="7.5" ry="7.5" fill="#FFFFFF" stroke="#6C7A89" strokeWidth="1" transform="rotate(5 50 17.5)"/>
        <rect x="45" y="7.5" width="10" height="15" rx="5" ry="5" fill="#FFB6C1" transform="rotate(-5 50 17.5)"/>
        <rect x="45" y="7.5" width="10" height="15" rx="5" ry="5" fill="#FFB6C1" transform="rotate(5 50 17.5)"/>

        {/* 눈 */}
        <circle cx="42.5" cy="42.5" r="2.5" fill="#333"/>
        <circle cx="57.5" cy="42.5" r="2.5" fill="#333"/>
        <circle cx="42" cy="42" r="0.75" fill="white"/>
        <circle cx="57" cy="42" r="0.75" fill="white"/>

        {/* 코 */}
        <path d="M 50 47.5 L 49 50 L 51 50 Z" fill="#FFB6C1"/>

        {/* 입 */}
        <path d="M 45 52.5 Q 50 55 55 52.5" stroke="#6C7A89" strokeWidth="0.75" fill="none"/>

        {/* 발 */}
        <circle cx="40" cy="75" r="7.5" fill="#FFFFFF" stroke="#6C7A89" strokeWidth="1"/>
        <circle cx="60" cy="75" r="7.5" fill="#FFFFFF" stroke="#6C7A89" strokeWidth="1"/>
    </svg>
);

export const DragonAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* 구름들 */}
        <circle cx="15" cy="75" r="5" fill="#E0E0E0" stroke="#C0C0C0" strokeWidth="0.5"/>
        <circle cx="22.5" cy="77.5" r="6" fill="#E0E0E0" stroke="#C0C0C0" strokeWidth="0.5"/>
        <circle cx="30" cy="75" r="5" fill="#E0E0E0" stroke="#C0C0C0" strokeWidth="0.5"/>
        <circle cx="70" cy="77.5" r="5" fill="#E0E0E0" stroke="#C0C0C0" strokeWidth="0.5"/>
        <circle cx="77.5" cy="75" r="6" fill="#E0E0E0" stroke="#C0C0C0" strokeWidth="0.5"/>
        <circle cx="85" cy="77.5" r="5" fill="#E0E0E0" stroke="#C0C0C0" strokeWidth="0.5"/>

        {/* 몸통 */}
        <circle cx="50" cy="60" r="27.5" fill="#87CEEB" stroke="#4682B4" strokeWidth="1"/>

        {/* 머리 */}
        <circle cx="50" cy="40" r="22.5" fill="#87CEEB" stroke="#4682B4" strokeWidth="1"/>

        {/* 뿔 */}
        <path d="M 37.5 25 L 32.5 10 L 37.5 20 L 35 15 L 40 27.5" fill="#FFD700" stroke="#DAA520" strokeWidth="0.75"/>
        <path d="M 62.5 25 L 67.5 10 L 62.5 20 L 65 15 L 60 27.5" fill="#FFD700" stroke="#DAA520" strokeWidth="0.75"/>

        {/* 눈 */}
        <circle cx="42.5" cy="40" r="3.5" fill="#333"/>
        <circle cx="57.5" cy="40" r="3.5" fill="#333"/>
        <circle cx="42" cy="39.5" r="1" fill="white"/>
        <circle cx="57" cy="39.5" r="1" fill="white"/>

        {/* 코 */}
        <ellipse cx="50" cy="48" rx="6" ry="4.5" fill="#5FA3D0"/>
        <circle cx="46.5" cy="47.5" r="1.5" fill="#4682B4"/>
        <circle cx="53.5" cy="47.5" r="1.5" fill="#4682B4"/>

        {/* 입 */}
        <path d="M 42 52.5 Q 50 56 58 52.5" stroke="#4682B4" strokeWidth="1" fill="none"/>

        {/* 수염 */}
        <path d="M 30 45 L 15 47.5" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M 70 45 L 85 47.5" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"/>

        {/* 발 */}
        <circle cx="35" cy="82" r="9" fill="#87CEEB" stroke="#4682B4" strokeWidth="1"/>
        <circle cx="65" cy="82" r="9" fill="#87CEEB" stroke="#4682B4" strokeWidth="1"/>
    </svg>
);

export const SnakeAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* 뱀의 구불구불한 몸통 */}
        <path d="M 20 65 Q 35 55 50 60 Q 65 65 80 55" stroke="#9ACD32" strokeWidth="15" fill="none" strokeLinecap="round"/>

        {/* 머리 */}
        <circle cx="50" cy="40" r="20" fill="#9ACD32" stroke="#6B8E23" strokeWidth="1"/>

        {/* 눈 (뱀 특유의 수직 동공) */}
        <ellipse cx="42.5" cy="38" rx="4" ry="6" fill="#FFD700" stroke="#DAA520" strokeWidth="0.75"/>
        <ellipse cx="57.5" cy="38" rx="4" ry="6" fill="#FFD700" stroke="#DAA520" strokeWidth="0.75"/>
        <ellipse cx="42.5" cy="38" rx="1.5" ry="5" fill="#000"/>
        <ellipse cx="57.5" cy="38" rx="1.5" ry="5" fill="#000"/>

        {/* 코 */}
        <ellipse cx="50" cy="45" rx="5" ry="3.5" fill="#8FB82E"/>
        <circle cx="47" cy="44.5" r="1" fill="#6B8E23"/>
        <circle cx="53" cy="44.5" r="1" fill="#6B8E23"/>

        {/* 갈라진 혀 */}
        <line x1="50" y1="48" x2="50" y2="55" stroke="#DC143C" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M 50 55 L 46 60" stroke="#DC143C" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M 50 55 L 54 60" stroke="#DC143C" strokeWidth="1.2" strokeLinecap="round"/>

        {/* 비늘 무늬 (간단하게) */}
        <circle cx="35" cy="35" r="2.5" fill="#6B8E23" opacity="0.3"/>
        <circle cx="65" cy="35" r="2.5" fill="#6B8E23" opacity="0.3"/>
        <circle cx="40" cy="44" r="2" fill="#6B8E23" opacity="0.25"/>
        <circle cx="60" cy="44" r="2" fill="#6B8E23" opacity="0.25"/>
    </svg>
);

export const HorseAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* 몸통 */}
        <circle cx="50" cy="60" r="27.5" fill="#D2691E" stroke="#A0522D" strokeWidth="1"/>

        {/* 머리 */}
        <circle cx="50" cy="40" r="22.5" fill="#D2691E" stroke="#A0522D" strokeWidth="1"/>

        {/* 갈기 (간단하게 웨이브) */}
        <path d="M 38 20 Q 35 25 37 30" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 44 18 Q 42 23 44 28" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 50 17 Q 49 22 50 27" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 56 18 Q 56 23 56 28" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 62 20 Q 63 25 63 30" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round"/>

        {/* 귀 (뾰족한) */}
        <path d="M 35 28 L 30 18 L 37 30 Z" fill="#A0522D" stroke="#8B4513" strokeWidth="0.75"/>
        <path d="M 65 28 L 70 18 L 63 30 Z" fill="#A0522D" stroke="#8B4513" strokeWidth="0.75"/>

        {/* 눈 */}
        <circle cx="42.5" cy="40" r="4" fill="#333"/>
        <circle cx="57.5" cy="40" r="4" fill="#333"/>
        <circle cx="42" cy="39" r="1.5" fill="white"/>
        <circle cx="57" cy="39" r="1.5" fill="white"/>

        {/* 코 */}
        <ellipse cx="50" cy="50" rx="8" ry="6" fill="#A0522D"/>
        <circle cx="46" cy="49" r="2" fill="#654321"/>
        <circle cx="54" cy="49" r="2" fill="#654321"/>

        {/* 입 */}
        <path d="M 42 55 Q 50 58 58 55" stroke="#8B4513" strokeWidth="1" fill="none"/>

        {/* 발 */}
        <circle cx="35" cy="82" r="9" fill="#D2691E" stroke="#A0522D" strokeWidth="1"/>
        <circle cx="65" cy="82" r="9" fill="#D2691E" stroke="#A0522D" strokeWidth="1"/>

        {/* 꼬리 (간단한 흐름) */}
        <path d="M 72 65 Q 80 70 85 78" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
);

export const GoatAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* 몸통 */}
        <circle cx="50" cy="60" r="27.5" fill="#FFFAF0" stroke="#D4C5A9" strokeWidth="1"/>

        {/* 머리 */}
        <circle cx="50" cy="40" r="22.5" fill="#FFFAF0" stroke="#D4C5A9" strokeWidth="1"/>

        {/* 뿔 (곡선 뿔) */}
        <path d="M 35 28 Q 28 20 25 12" stroke="#6D5A4F" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M 65 28 Q 72 20 75 12" stroke="#6D5A4F" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

        {/* 귀 */}
        <ellipse cx="32" cy="35" rx="5" ry="8" fill="#F5DEB3" stroke="#D4C5A9" strokeWidth="0.75" transform="rotate(-25 32 35)"/>
        <ellipse cx="68" cy="35" rx="5" ry="8" fill="#F5DEB3" stroke="#D4C5A9" strokeWidth="0.75" transform="rotate(25 68 35)"/>

        {/* 눈 (염소 특유의 수평 동공) */}
        <ellipse cx="42" cy="40" rx="6" ry="5" fill="#E8D4B8"/>
        <ellipse cx="58" cy="40" rx="6" ry="5" fill="#E8D4B8"/>
        <rect x="38" y="39" width="8" height="2.5" rx="1.25" fill="#2C1810"/>
        <rect x="54" y="39" width="8" height="2.5" rx="1.25" fill="#2C1810"/>

        {/* 코 */}
        <ellipse cx="50" cy="48" rx="5" ry="4" fill="#D2B48C"/>
        <circle cx="47" cy="47.5" r="1.5" fill="#A0826D"/>
        <circle cx="53" cy="47.5" r="1.5" fill="#A0826D"/>

        {/* 입 */}
        <path d="M 42 52 Q 50 55 58 52" stroke="#A0826D" strokeWidth="1" fill="none"/>

        {/* 턱수염 */}
        <ellipse cx="50" cy="60" rx="4" ry="8" fill="#F5DEB3" stroke="#D4C5A9" strokeWidth="0.75"/>
        <path d="M 48 55 L 48 65" stroke="#D4C5A9" strokeWidth="1" opacity="0.5"/>
        <path d="M 50 55 L 50 66" stroke="#D4C5A9" strokeWidth="1" opacity="0.5"/>
        <path d="M 52 55 L 52 65" stroke="#D4C5A9" strokeWidth="1" opacity="0.5"/>

        {/* 발 */}
        <circle cx="35" cy="82" r="9" fill="#FFFAF0" stroke="#D4C5A9" strokeWidth="1"/>
        <circle cx="65" cy="82" r="9" fill="#FFFAF0" stroke="#D4C5A9" strokeWidth="1"/>
    </svg>
);

export const MonkeyAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* 몸통 */}
        <ellipse cx="50" cy="50.8" rx="19.5" ry="17.6" fill="#A67C52" stroke="#7B5A3A" strokeWidth="0.78"/>

        {/* 얼굴 */}
        <circle cx="50" cy="39.1" r="11.7" fill="#F5E6C8" stroke="#D4C0A4" strokeWidth="0.59"/>

        {/* 눈 */}
        <circle cx="46.1" cy="37.1" r="2" fill="#000000"/>
        <circle cx="53.9" cy="37.1" r="2" fill="#000000"/>
        <circle cx="45.3" cy="36.3" r="0.59" fill="#FFFFFF"/>
        <circle cx="53.1" cy="36.3" r="0.59" fill="#FFFFFF"/>

        {/* 볼터치 */}
        <circle cx="43" cy="41" r="1.2" fill="#FFB6C1"/>
        <circle cx="57" cy="41" r="1.2" fill="#FFB6C1"/>

        {/* 입 */}
        <path d="M 46.9 44 Q 50 45.9 53.1 44" stroke="#000000" strokeWidth="0.39" fill="none" strokeLinecap="round"/>

        {/* 귀 */}
        <path d="M 37.1 35.2 C 33.2 31.3 33.2 27.3 37.1 25.4 C 41 23.4 45 25.4 45 29.3 C 45 33.2 41 37.1 37.1 35.2 Z" fill="#F5E6C8" stroke="#D4C0A4" strokeWidth="0.39"/>
        <path d="M 62.9 35.2 C 66.8 31.3 66.8 27.3 62.9 25.4 C 59 23.4 55 25.4 55 29.3 C 55 33.2 59 37.1 62.9 35.2 Z" fill="#F5E6C8" stroke="#D4C0A4" strokeWidth="0.39"/>

        {/* 배 */}
        <ellipse cx="50" cy="52.7" rx="9.8" ry="5.9" fill="#F5E6C8" stroke="#D4C0A4" strokeWidth="0.39"/>

        {/* 바나나 (손에 들고 있는) */}
        <path d="M 35.2 50.8 C 37.1 52.7 39.1 52.7 41 50.8 C 43 48.8 43 46.9 41 45 C 39.1 43 37.1 43 35.2 45 C 33.2 46.9 33.2 48.8 35.2 50.8 Z" fill="#FFD700" stroke="#B8860B" strokeWidth="0.39"/>

        {/* 꼬리 */}
        <path d="M 70.3 58.6 C 76.2 54.7 80.1 56.6 82 60.5 C 84 64.5 82 68.4 78.1 70.3 C 74.2 72.3 70.3 70.3 68.4 66.4" fill="none" stroke="#A67C52" strokeWidth="1.17" strokeLinecap="round"/>

        {/* 발 */}
        <circle cx="43" cy="75" r="7" fill="#A67C52" stroke="#7B5A3A" strokeWidth="0.78"/>
        <circle cx="57" cy="75" r="7" fill="#A67C52" stroke="#7B5A3A" strokeWidth="0.78"/>
    </svg>
);

export const RoosterAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* 몸통 (흰색) */}
        <ellipse cx="50" cy="50.8" rx="19.5" ry="15.6" fill="#FFFFFF" stroke="#CCCCCC" strokeWidth="0.78"/>

        {/* 날개 (갈색) */}
        <path d="M 35.2 50.8 C 31.3 54.7 31.3 58.6 35.2 62.5 C 39.1 66.4 43 66.4 46.9 62.5 C 50.8 58.6 50.8 54.7 46.9 50.8 C 43 46.9 39.1 46.9 35.2 50.8 Z" fill="#A0522D" stroke="#7B3F20" strokeWidth="0.59"/>

        {/* 꼬리 깃털 (파랑, 초록, 주황) */}
        <path d="M 70.3 50.8 C 74.2 46.9 78.1 48.8 80.1 52.7 C 82 56.6 80.1 60.5 76.2 62.5 C 72.3 64.5 68.4 62.5 66.4 58.6 Z" fill="#4682B4" stroke="#2F4F4F" strokeWidth="0.59"/>
        <path d="M 72.3 52.7 C 76.2 48.8 80.1 50.8 82 54.7 C 84 58.6 82 62.5 78.1 64.5 C 74.2 66.4 70.3 64.5 68.4 60.5 Z" fill="#3CB371" stroke="#2E8B57" strokeWidth="0.59"/>
        <path d="M 74.2 54.7 C 78.1 50.8 82 52.7 84 56.6 C 86 60.5 84 64.5 80.1 66.4 C 76.2 68.4 72.3 66.4 70.3 62.5 Z" fill="#FFA500" stroke="#CD853F" strokeWidth="0.59"/>

        {/* 머리 (흰색) */}
        <circle cx="50" cy="27.3" r="9.8" fill="#FFFFFF" stroke="#CCCCCC" strokeWidth="0.59"/>

        {/* 눈 */}
        <circle cx="46.1" cy="25.4" r="2" fill="#000000"/>
        <circle cx="53.9" cy="25.4" r="2" fill="#000000"/>
        <circle cx="45.3" cy="24.6" r="0.59" fill="#FFFFFF"/>
        <circle cx="53.1" cy="24.6" r="0.59" fill="#FFFFFF"/>

        {/* 부리 */}
        <path d="M 48.8 29.3 L 51.2 29.3 L 50 32.2 Z" fill="#FFD700" stroke="#B8860B" strokeWidth="0.39"/>

        {/* 볏 */}
        <path d="M 46.9 19.5 C 45 17.6 45 15.6 46.9 13.7 C 48.8 11.7 52.7 11.7 54.7 13.7 C 56.6 15.6 56.6 17.6 54.7 19.5 C 52.7 21.5 48.8 21.5 46.9 19.5 Z" fill="#DC143C" stroke="#8B0000" strokeWidth="0.59"/>

        {/* 턱볏 */}
        <path d="M 48.8 33.2 C 46.9 35.2 46.9 37.1 48.8 39.1 C 50.8 41 54.7 41 56.6 39.1 C 58.6 37.1 58.6 35.2 56.6 33.2 C 54.7 31.3 50.8 31.3 48.8 33.2 Z" fill="#DC143C" stroke="#8B0000" strokeWidth="0.59"/>

        {/* 발 */}
        <rect x="45" y="70.3" width="2.3" height="7.8" fill="#FFD700"/>
        <rect x="52.7" y="70.3" width="2.3" height="7.8" fill="#FFD700"/>
    </svg>
);

export const DogAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* 몸통 */}
        <circle cx="50" cy="60" r="27.5" fill="#F5DEB3" stroke="#E8D4B8" strokeWidth="1"/>

        {/* 머리 */}
        <circle cx="50" cy="40" r="22.5" fill="#F5DEB3" stroke="#E8D4B8" strokeWidth="1"/>

        {/* 늘어진 귀 */}
        <ellipse cx="28" cy="42" rx="8" ry="18" fill="#DEB887" stroke="#C9A87C" strokeWidth="1"/>
        <ellipse cx="72" cy="42" rx="8" ry="18" fill="#DEB887" stroke="#C9A87C" strokeWidth="1"/>

        {/* 눈 */}
        <circle cx="42" cy="38" r="5" fill="#2C1810"/>
        <circle cx="58" cy="38" r="5" fill="#2C1810"/>
        <circle cx="42.5" cy="37" r="2" fill="white"/>
        <circle cx="58.5" cy="37" r="2" fill="white"/>

        {/* 주둥이 (돌출된) */}
        <ellipse cx="50" cy="50" rx="12" ry="10" fill="#FFF8E8" stroke="#F5DEB3" strokeWidth="0.75"/>

        {/* 코 */}
        <ellipse cx="50" cy="47" rx="4" ry="3.5" fill="#2C1810"/>

        {/* 입 */}
        <path d="M 42 54 Q 50 58 58 54" stroke="#B8956A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <line x1="50" y1="47" x2="50" y2="54" stroke="#2C1810" strokeWidth="1.5" strokeLinecap="round"/>

        {/* 혀 (간단하게) */}
        <ellipse cx="50" cy="58" rx="3" ry="2.5" fill="#FFB6C1"/>

        {/* 발 */}
        <circle cx="35" cy="82" r="9" fill="#F5DEB3" stroke="#E8D4B8" strokeWidth="1"/>
        <circle cx="65" cy="82" r="9" fill="#F5DEB3" stroke="#E8D4B8" strokeWidth="1"/>

        {/* 꼬리 */}
        <path d="M 72 65 Q 80 68 85 75" stroke="#DEB887" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
);

export const PigAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* 몸통 */}
        <ellipse cx="50" cy="50.8" rx="19.5" ry="11.7" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="0.78"/>

        {/* 얼굴 */}
        <circle cx="50" cy="39.1" r="15.6" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="0.59"/>

        {/* 귀 */}
        <ellipse cx="37.1" cy="27.3" rx="3.9" ry="5.9" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="0.39"/>
        <ellipse cx="62.9" cy="27.3" rx="3.9" ry="5.9" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="0.39"/>

        {/* 눈 */}
        <circle cx="43.8" cy="37.1" r="2" fill="#000000"/>
        <circle cx="56.2" cy="37.1" r="2" fill="#000000"/>
        <circle cx="43" cy="36.3" r="0.59" fill="#FFFFFF"/>
        <circle cx="55.5" cy="36.3" r="0.59" fill="#FFFFFF"/>

        {/* 큰 코 */}
        <ellipse cx="50" cy="43.8" rx="7.8" ry="5.9" fill="#FF85A8" stroke="#FF69B4" strokeWidth="0.59"/>
        <circle cx="46.9" cy="43.8" r="1.6" fill="#C71585"/>
        <circle cx="53.1" cy="43.8" r="1.6" fill="#C71585"/>

        {/* 입 */}
        <path d="M 45.3 48.8 Q 50 51.6 54.7 48.8" stroke="#FF69B4" strokeWidth="0.59" fill="none" strokeLinecap="round"/>

        {/* 발 */}
        <ellipse cx="43" cy="62.5" rx="3.9" ry="3.1" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="0.59"/>
        <ellipse cx="57" cy="62.5" rx="3.9" ry="3.1" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="0.59"/>

        {/* 꼬리 (말린) */}
        <path d="M 70.3 50.8 C 72.3 48.8 74.2 50.8 74.2 52.7 C 74.2 54.7 72.3 56.6 70.3 54.7" fill="none" stroke="#FFB6C1" strokeWidth="1.17" strokeLinecap="round"/>
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
