// src/components/CreateNewModal.jsx

import React from 'react';
import styled, { keyframes } from 'styled-components';
import Portal from './Portal';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 1000;
`;

const ModalContent = styled.div`
    background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
    border-radius: 20px 20px 0 0;
    width: 100%;
    max-width: 450px;
    padding: 24px;
    box-shadow: 0 -8px 20px rgba(0, 0, 0, 0.5);
    animation: ${fadeIn} 0.3s ease-out;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: none;
`;

const ModalTitle = styled.h3`
    font-size: 18px;
    font-weight: 700;
    color: #e0e0e0;
    margin-bottom: 24px;
`;

const ActionButton = styled.div`
    display: flex;
    align-items: center;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(240, 147, 251, 0.3);
    }
`;

const ActionIcon = styled.span`
    font-size: 24px;
    margin-right: 12px;
`;

const ActionText = styled.span`
    font-size: 16px;
    font-weight: 500;
    color: #d0d0d0;
`;

const CreateNewModal = ({ onClose, onActionSelect }) => {
    const actions = [
        { name: 'memo', icon: '📝', label: '새 메모' },
        { name: 'todo', icon: '✅', label: '새 할 일' },
        { name: 'calendar', icon: '📅', label: '새 일정' },
    ];

    return (
      <Portal>
        <Overlay>
            <ModalContent>
                <ModalTitle>새 항목 만들기</ModalTitle>
                {actions.map(action => (
                    <ActionButton key={action.name} onClick={() => onActionSelect(action.name)}>
                        <ActionIcon>{action.icon}</ActionIcon>
                        <ActionText>{action.label}</ActionText>
                    </ActionButton>
                ))}
            </ModalContent>
        </Overlay>
      </Portal>
    );
};

export default CreateNewModal;