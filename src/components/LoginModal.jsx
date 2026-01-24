import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
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

    const isNative = Capacitor.isNativePlatform();

    // ✅ 모달이 열릴 때마다 Google 세션 초기화
    useEffect(() => {
        console.log('🔄 Google 세션 초기화 중...');
        console.log('🔧 플랫폼:', isNative ? '네이티브 앱' : '웹');

        if (isNative) {
            // 네이티브 앱에서 GoogleAuth 초기화
            GoogleAuth.initialize({
                clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
                grantOfflineAccess: true,
            });
            console.log('✅ GoogleAuth 초기화 완료');
        } else {
            // 웹에서 Google 세션 초기화
            try {
                googleLogout();
                if (window.google?.accounts?.id) {
                    window.google.accounts.id.disableAutoSelect();
                    console.log('✅ Google disableAutoSelect 호출됨');
                }
            } catch (error) {
                console.warn('⚠️ Google 세션 초기화 중 오류:', error);
            }
        }
    }, [isNative]);

    // 네이티브 앱용 Google 로그인
    const handleNativeLogin = async () => {
        console.log('🔵 네이티브 Google 로그인 시작');
        try {
            // ✅ 로그인 전 기존 세션 완전히 제거 (계정 선택 화면 강제)
            try {
                await GoogleAuth.signOut();
                console.log('✅ 기존 Google 세션 정리 완료');
            } catch (signOutError) {
                console.warn('⚠️ Google 세션 정리 실패 (무시):', signOutError);
            }

            const result = await GoogleAuth.signIn();
            console.log('✅ 네이티브 Google 로그인 성공');
            console.log('📦 전체 result 객체:', JSON.stringify(result, null, 2));
            console.log('📦 result.id:', result.id);
            console.log('📦 result.email:', result.email);
            console.log('📦 result.authentication:', result.authentication);

            // 네이티브 로그인 결과를 웹과 동일한 형식으로 변환
            // @codetrix-studio/capacitor-google-auth의 응답 구조에 맞춤
            const userInfo = {
                sub: result.id || result.userId,
                email: result.email,
                name: result.name || result.displayName,
                picture: result.imageUrl || result.photoUrl,
                given_name: result.givenName || result.familyName,
                family_name: result.familyName,
            };

            console.log('📦 변환된 userInfo:', JSON.stringify(userInfo, null, 2));

            const expiresAt = Date.now() + 3600 * 1000; // 1시간

            const successData = {
                accessToken: result.authentication?.accessToken || result.accessToken,
                refreshToken: result.authentication?.refreshToken || result.serverAuthCode,
                userInfo: userInfo,
                expiresAt: expiresAt,
                expiresIn: 3600,
            };

            console.log('📦 onSuccess에 전달할 데이터:', JSON.stringify(successData, null, 2));

            onClose();
            onSuccess(successData);
        } catch (error) {
            console.error('❌ 네이티브 Google 로그인 실패:', error);
            console.error('❌ 에러 타입:', typeof error);
            console.error('❌ 에러 메시지:', error?.message);
            console.error('❌ 에러 코드:', error?.code);
            console.error('❌ 전체 에러:', JSON.stringify(error, null, 2));
            onError();
        }
    };

    // 웹용 Google OAuth 로그인 설정
    const webLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log('✅ Google OAuth 성공:', tokenResponse);

            onClose();

            try {
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: {
                        Authorization: `Bearer ${tokenResponse.access_token}`,
                    },
                });

                const userInfo = await userInfoResponse.json();
                console.log('사용자 정보:', userInfo);

                const expiresAt = Date.now() + (tokenResponse.expires_in || 3600) * 1000;

                onSuccess({
                    accessToken: tokenResponse.access_token,
                    refreshToken: tokenResponse.refresh_token,
                    userInfo: userInfo,
                    expiresAt: expiresAt,
                    expiresIn: tokenResponse.expires_in,
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
        // ✅ 계정 선택 화면 강제 표시 (One Tap 자동 선택 방지)
        prompt: 'select_account',
    });

    // 플랫폼에 따라 적절한 로그인 함수 선택
    const login = isNative ? handleNativeLogin : webLogin;

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
