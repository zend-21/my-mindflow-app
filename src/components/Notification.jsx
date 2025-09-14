// src/components/Notification.jsx

import React from 'react';
import styled, { keyframes } from 'styled-components';
import Portal from './Portal';

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(20px); }
`;

const NotificationContainer = styled.div`
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(45, 55, 72, 0.9);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    font-size: 16px;
    animation: ${({ isVisible }) => isVisible ? fadeIn : fadeOut} 0.5s ease-in-out forwards;
`;

const Notification = ({ message, isVisible }) => {
    if (!isVisible) {
        return null;
    }

    return ( 
      <Portal>
        <NotificationContainer isVisible={isVisible}>
            {message}
        </NotificationContainer>
        </Portal>
    );
};

export default Notification;