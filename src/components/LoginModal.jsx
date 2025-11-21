import React from 'react';
import styled from 'styled-components';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import Portal from './Portal'; // ★ 1. Portal 컴포넌트를 import 합니다.
import { jwtDecode } from "jwt-decode";
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase/config';

const ModalOverlay = styled.div`
    position: fixed; /* ★ 2. Portal과 함께 사용하기 위해 position을 fixed로 변경합니다. */
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

function LoginModal({ onSuccess, onError, onClose, setProfile }) {
    // ✅ Firebase Auth + Google Drive 스코프를 함께 사용하는 로그인
    const handleGoogleLogin = async () => {
        try {
            // Google Auth Provider 설정
            const provider = new GoogleAuthProvider();

            // Google Drive 스코프 추가 (기존 기능 유지)
            provider.addScope('https://www.googleapis.com/auth/drive.file');
            provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
            provider.addScope('https://www.googleapis.com/auth/userinfo.email');

            // Firebase Auth로 Google 로그인
            const result = await signInWithPopup(auth, provider);

            // Google Access Token 얻기 (Google Drive용)
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const accessToken = credential.accessToken;

            // Firebase User 정보
            const user = result.user;

            console.log('🔥 Firebase 로그인 성공:', user.uid);
            console.log('🔑 Access Token:', accessToken);

            // 사용자 정보 구성
            const userInfo = {
                sub: user.uid, // Firebase UID 사용 (Firestore 규칙과 일치)
                email: user.email,
                name: user.displayName,
                picture: user.photoURL,
            };

            console.log('👤 사용자 정보:', userInfo);

            // onSuccess 콜백에 Access Token과 사용자 정보 전달
            onSuccess({
                accessToken: accessToken,
                userInfo: userInfo,
                firebaseUser: user, // Firebase User 객체도 전달
            });

        } catch (error) {
            console.error('Google 로그인 실패:', error);
            onError();
        }
    };

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
                    {/* ✅ 버튼 클릭 시 Firebase Google 로그인 실행 */}
                    <GoogleButton onClick={handleGoogleLogin}>
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