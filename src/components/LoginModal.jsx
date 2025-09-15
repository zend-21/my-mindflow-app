import React from 'react';
import styled from 'styled-components';
import { GoogleLogin } from '@react-oauth/google';
import Portal from './Portal'; // ★ 1. Portal 컴포넌트를 import 합니다.
import { jwtDecode } from "jwt-decode";

const ModalOverlay = styled.div`
    position: fixed; /* ★ 2. Portal과 함께 사용하기 위해 position을 fixed로 변경합니다. */
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 20000;
`;

const ModalContent = styled.div`
    background: white;
    padding: 40px;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
    position: relative;
    
    h2 {
        margin-top: 0;
        margin-bottom: 10px;
        color: #333;
    }
    
    p {
        margin-bottom: 25px;
        color: #777;
    }
`;

const CloseButton = styled.button`
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #aaa;
`;

const LoginModal = ({ onClose, setProfile }) => {
    const handleSuccess = (credentialResponse) => {
        console.log("✅ Login Success:", credentialResponse);

        // ✅ 구글에서 받은 credential(JWT)을 디코드
        const user = jwtDecode(credentialResponse.credential);
        console.log("👤 User Info:", user);

        // ✅ 상위(App.jsx) state에 저장 → Header/SideMenu에서 profile 사용 가능
        setProfile(user);

        // ✅ 로그인 성공했으니 모달 닫기
        onClose();
    };

    const handleError = () => {
        console.error("❌ Login Failed");
    };

    return (
        <Portal>
            <ModalOverlay onClick={onClose}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                    <CloseButton onClick={onClose}>&times;</CloseButton>
                    <h2>내 손안의 비서</h2>
                    <p>구글 계정으로 모든 정보를 안전하게 관리하세요.</p>
                    <GoogleLogin
  onSuccess={handleSuccess}
  onError={handleError}
  onClose={() => setIsLoginOpen(false)}
                    />
                </ModalContent>
            </ModalOverlay>
        </Portal>
    );
};

export default LoginModal;