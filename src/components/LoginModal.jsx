import React from 'react';
import styled from 'styled-components';
import { useGoogleLogin } from '@react-oauth/google';
import Portal from './Portal';

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 20000;
`;

const ModalContent = styled.div`
    background: #2a2d35;
    padding: 40px;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
    position: relative;

    h2 {
        margin-top: 0;
        margin-bottom: 10px;
        color: #e0e0e0;
    }

    p {
        margin-bottom: 25px;
        color: #b0b0b0;
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
    color: #b0b0b0;
`;

const GoogleButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    padding: 12px 24px;
    background: #333842;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    color: #e0e0e0;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #3d4250;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    }

    &:active {
        background: #2d3139;
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
    color: #e0e0e0;
`;

const ModalDescription = styled.p`
    font-size: 16px;
    color: #b0b0b0;
    line-height: 1.5;
`;

function LoginModal({ onSuccess, onError, onClose, setProfile }) {
    console.log('🔧 LoginModal 렌더링');

    // Refresh Token을 받기 위한 설정 추가
    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log('✅ Google OAuth 성공:', tokenResponse);

            try {
                // Access Token으로 사용자 정보 가져오기
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: {
                        Authorization: `Bearer ${tokenResponse.access_token}`,
                    },
                });

                const userInfo = await userInfoResponse.json();
                console.log('사용자 정보:', userInfo);

                // onSuccess 콜백 호출 (토큰 만료 시간 포함)
                // Google OAuth 액세스 토큰은 기본적으로 3600초(1시간) 유효
                const expiresAt = Date.now() + (tokenResponse.expires_in || 3600) * 1000;

                onSuccess({
                    accessToken: tokenResponse.access_token,
                    refreshToken: tokenResponse.refresh_token, // Refresh Token 추가
                    userInfo: userInfo,
                    expiresAt: expiresAt, // 만료 시간 추가
                    expiresIn: tokenResponse.expires_in, // 만료 시간(초) 추가
                });
            } catch (error) {
                console.error('사용자 정보 가져오기 실패:', error);
                onError();
            }
        },
        onError: (error) => {
            console.error('Google OAuth 실패:', error);
            onError();
        },
        scope: 'https://www.googleapis.com/auth/drive.file',
        flow: 'implicit', // 명시적으로 implicit flow 설정
        ux_mode: 'popup', // 팝업 모드 강제
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
                    <GoogleButton onClick={() => {
                        console.log('🔵 로그인 버튼 클릭됨');
                        console.log('🔧 login 함수 타입:', typeof login);
                        console.log('🔧 login 함수:', login);
                        try {
                            login();
                            console.log('✅ login() 호출 완료');
                        } catch (error) {
                            console.error('❌ login() 호출 중 에러:', error);
                        }
                    }}>
                        <GoogleIcon>G</GoogleIcon>
                        Google로 로그인
                    </GoogleButton>
                </GoogleButtonWrapper>
            </ModalContent>
        </ModalOverlay>
    );
}

export default LoginModal;
