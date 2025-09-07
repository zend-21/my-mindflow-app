// src/components/SideMenu.jsx

import React, { useRef } from 'react';
import styled, { keyframes } from 'styled-components';

const slideIn = keyframes`
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
`;

const slideOut = keyframes`
    from { transform: translateX(0); }
    to { transform: translateX(-100%); }
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 5000;
`;

const MenuContainer = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 250px;
    background: #fff;
    box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
    z-index: 5001;
    display: flex;
    flex-direction: column;
    padding: 20px;
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;
    ${props => props.isOpen && `
        transform: translateX(0);
    `}
`;

const MenuHeader = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 20px;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    color: #999;
    cursor: pointer;
`;

const MenuItem = styled.div`
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
    font-size: 18px;
    color: #333;
    cursor: pointer;

    &:hover {
        background: #f8f8f8;
    }
`;

const FileInput = styled.input`
    display: none;
`;

const SideMenu = ({ isOpen, onClose, onExport, onImport }) => {
    const fileInputRef = useRef(null);

    if (!isOpen) {
        return null;
    }

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <>
            <Overlay onClick={onClose} />
            <MenuContainer isOpen={isOpen}>
                <MenuHeader>
                    <CloseButton onClick={onClose}>&times;</CloseButton>
                </MenuHeader>
                <MenuItem onClick={onExport}>백업하기</MenuItem>
                <MenuItem onClick={handleImportClick}>
                    복원하기
                    <FileInput 
                        id="import-file" 
                        type="file" 
                        accept=".json" 
                        onChange={onImport}
                        ref={fileInputRef}
                    />
                </MenuItem>
                <MenuItem>메모</MenuItem>
                <MenuItem>캘린더</MenuItem>
                <MenuItem>설정</MenuItem>
            </MenuContainer>
        </>
    );
};

export default SideMenu;