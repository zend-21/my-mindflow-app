import React from 'react';
import styled from 'styled-components';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
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

function LoginModal({ onSuccess, onError, onClose, setProfile }) {
    // ✅ useGoogleLogin 훅 사용 (Access Token 받기)
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log('🔑 Access Token 받음:', tokenResponse);
            
            // Access Token으로 사용자 정보 가져오기
            try {
                const userInfoResponse = await fetch(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    {
                        headers: {
                            Authorization: `Bearer ${tokenResponse.access_token}`,
                        },
                    }
                );
                
                const userInfo = await userInfoResponse.json();
                console.log('👤 사용자 정보:', userInfo);
                
                // onSuccess 콜백에 Access Token과 사용자 정보 전달
                onSuccess({
                    accessToken: tokenResponse.access_token,
                    userInfo: userInfo,
                });
            } catch (error) {
                console.error('사용자 정보 가져오기 실패:', error);
                onError();
            }
        },
        onError: () => {
            console.log('Login Failed');
            onError();
        },
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    });

    return (
        <ModalOverlay>
            <ModalContent>
                <CloseButton onClick={onClose}>×</CloseButton>
                <ModalTitle>로그인</ModalTitle>
                <ModalDescription>
                    Google 계정으로 로그인하고<br />
                    데이터를 안전하게 동기화하세요
                </ModalDescription>
                
                <GoogleButtonWrapper>
                    {/* ✅ 버튼 클릭 시 googleLogin 실행 */}
                    <GoogleButton onClick={() => googleLogin()}>
                        <GoogleIcon>G</GoogleIcon>
                        Google로 로그인
                    </GoogleButton>
                </GoogleButtonWrapper>
            </ModalContent>
        </ModalOverlay>
    );
}

export default LoginModal;

// 스타일 컴포넌트 추가
const GoogleButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    padding: 12px 24px;
    background: white;
    border: 1px solid #dadce0;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    color: #3c4043;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #f8f9fa;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    &:active {
        background: #f1f3f4;
    }
`;

const GoogleIcon = styled.div`
    width: 20px;
    height: 20px;
    background: #4285f4;
    color: white;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
`;

const GoogleButtonWrapper = styled.div`
    width: 100%;
    margin-top: 24px;
`;

const ModalTitle = styled.h2`
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 10px;
    color: #333;
`;

const ModalDescription = styled.p`
    font-size: 16px;
    color: #666;
    line-height: 1.5;
`;