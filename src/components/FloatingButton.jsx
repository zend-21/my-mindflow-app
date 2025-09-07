import React from 'react';
import styled from 'styled-components';
import { fadeInUp } from '../styles.js';

const FloatingButtonContainer = styled.button`
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f093fb, #f5576c);
    color: white;
    font-size: 36px; /* 돋보기 아이콘을 위해 기존 크기 유지 */
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    border: none;
    position: absolute;
    bottom: 100px;
    right: 24px;
    z-index: 10;
    transition: transform 0.3s ease;
    animation: ${fadeInUp} 0.6s ease forwards;
    animation-delay: 0.5s;

    &:hover {
        transform: translateY(-5px);
    }
`;

const FloatingButton = ({ onClick }) => {
    return (
        <FloatingButtonContainer onClick={onClick}>
            🔍
        </FloatingButtonContainer>
    );
};

export default FloatingButton;