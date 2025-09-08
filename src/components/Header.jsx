// src/components/Header.jsx

import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    padding-top: 18px;  
    padding-bottom: 24px;
`;

// 프로필 사진을 위한 원형 영역
const ProfileAvatar = styled.div`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #e0e0e0;
    margin-right: 12px;
`;

const ActionIcon = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0;
    
    img {
        width: 24px;
        height: 24px;
        transition: transform 0.2s ease;
    }
    &:hover img {
        transform: scale(1.1);
    }
`;

const Header = ({ onMenuClick }) => {
  return (
    <HeaderContainer className="flex items-center justify-between px-4">
      {/* 좌측: 프로필 사진 영역 */}
      <ProfileAvatar />

      {/* 우측: 메뉴바 열기 버튼 */}
      <ActionIcon
        onClick={onMenuClick}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 shadow-lg hover:shadow-xl transition-shadow mr-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#808080ff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </ActionIcon>
    </HeaderContainer>
  );
};

export default Header;