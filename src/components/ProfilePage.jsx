// src/components/ProfilePage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { syncProfilePictureToGoogleDrive, loadProfilePictureFromGoogleDrive } from '../utils/googleDriveSync';
import AvatarSelector from './AvatarSelector';
import { avatarList } from './avatars/AvatarIcons';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import QRCode from 'qrcode';
import { Copy, Lock, Trash2 } from 'lucide-react';
import { checkNicknameAvailability, updateNickname, deleteNickname } from '../services/nicknameService';
import ChangePasswordModal from './ChangePasswordModal';
import { hasMasterPassword } from '../services/keyManagementService';
import { getProfileSetting, setProfileSetting } from '../utils/userStorage';
import ConfirmModal from './ConfirmModal';
import SecurityDocViewer from './SecurityDocViewer';
import * as S from './ProfilePage.styles';

const BACKGROUND_COLORS = {
    // 그라데이션
    'none': 'transparent',
    'lavender': 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'peach': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'mint': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'sunset': 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    'ocean': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    // 비비드한 단색
    'pink': '#FF69B4',
    'blue': '#4169E1',
    'yellow': '#FFD700',
    'green': '#32CD32',
    'purple': '#9370DB',
    'custom': () => localStorage.getItem('avatarCustomColor') || '#FF1493',
};

const ProfilePage = ({ profile, memos, folders, calendarSchedules, showToast, onCleanupOrphanedMemos, onClose }) => {
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [nickname, setNickname] = useState(''); // 초기값 빈 문자열로 변경 - Firebase에서 로드
    const [imageError, setImageError] = useState(false);

    // 아바타 관련 상태 (계정별로 분리)
    const [profileImageType, setProfileImageType] = useState(getProfileSetting('profileImageType') || 'avatar'); // 'avatar' | 'photo'
    const [selectedAvatarId, setSelectedAvatarId] = useState(getProfileSetting('selectedAvatarId') || null);
    const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
    const [avatarBgColor, setAvatarBgColor] = useState(getProfileSetting('avatarBgColor') || 'none');
    const [customPicture, setCustomPicture] = useState(getProfileSetting('customProfilePicture') || null);

    // 생년월일 마스킹 관련 상태
    const [isBirthDateRevealed, setIsBirthDateRevealed] = useState(false);
    const birthDateTimerRef = useRef(null);

    // WS 코드 (친구 코드) 관련 상태
    const [wsCode, setWsCode] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);

    // 비밀번호 변경 관련 상태
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
    const [hasMasterPasswordSet, setHasMasterPasswordSet] = useState(false);

    // 프로필 초기화 확인 모달
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // 보안 & 개인정보 모달
    const [isSecurityDocViewerOpen, setIsSecurityDocViewerOpen] = useState(false);

    // 사용자 이름 결정
    const userName = nickname || profile?.name || profile?.email?.split('@')[0] || '게스트';

    // 프로필 이미지 첫 글자
    const profileInitial = userName.charAt(0).toUpperCase();

    // 통계 계산
    const totalMemos = memos?.length || 0;
    const totalSchedules = Object.keys(calendarSchedules || {}).length;
    const importantMemos = memos?.filter(m => m.isImportant).length || 0;

    // 숨겨진 메모 계산 (존재하지 않는 폴더에 속한 메모)
    // 'shared'는 가상 폴더이므로 제외
    const folderIds = new Set(folders?.map(f => f.id) || []);
    folderIds.add('shared');
    const orphanedMemosCount = memos?.filter(memo => memo.folderId && !folderIds.has(memo.folderId)).length || 0;

    // 닉네임 저장
    const handleSaveNickname = async () => {
        if (!nickname.trim()) {
            setIsEditingNickname(false);
            return;
        }

        const savedNickname = getProfileSetting('userNickname');
        const newNickname = nickname.trim();

        // 닉네임이 변경되지 않았으면 그냥 종료
        if (savedNickname === newNickname) {
            setIsEditingNickname(false);
            return;
        }

        try {
            // Firebase userId 가져오기
            const userId = localStorage.getItem('firebaseUserId');
            if (!userId) {
                showToast?.('⚠️ 사용자 정보를 찾을 수 없습니다');
                setIsEditingNickname(false);
                return;
            }

            // 🔥 nicknames 컬렉션에 저장 (중복 체크용 - 공개 읽기 가능)
            const nicknameSuccess = await updateNickname(userId, newNickname);
            if (!nicknameSuccess) {
                showToast?.('⚠️ 이미 사용 중인 닉네임이거나 저장에 실패했습니다');
                setNickname(savedNickname || '');
                setIsEditingNickname(false);
                return;
            }

            // localStorage에 저장
            setProfileSetting('userNickname', newNickname);

            // nickname state 업데이트 (즉시 UI 반영)
            setNickname(newNickname);

            // ✅ 닉네임은 nicknames 컬렉션에만 저장 (위에서 updateNickname으로 이미 저장됨)
            // ChatRoom도 nicknames 컬렉션에서 읽으므로 별도 동기화 불필요

            showToast?.('✅ 닉네임이 변경되었습니다');

            // userProfile localStorage도 업데이트 (앱 새로고침 시 반영되도록)
            try {
                const savedProfile = localStorage.getItem('userProfile');
                if (savedProfile) {
                    const profileData = JSON.parse(savedProfile);
                    profileData.nickname = newNickname;
                    localStorage.setItem('userProfile', JSON.stringify(profileData));
                }
            } catch (e) {
                console.error('userProfile localStorage 업데이트 실패:', e);
            }

            // profile 상태 업데이트를 위해 이벤트 발생
            window.dispatchEvent(new CustomEvent('nicknameChanged', { detail: newNickname }));
        } catch (error) {
            console.error('닉네임 저장 오류:', error);
            showToast?.('❌ 닉네임 저장 중 오류가 발생했습니다');
            setNickname(savedNickname || '');
        } finally {
            setIsEditingNickname(false);
        }
    };

    // 프로필 초기화 (구글 프로필로 되돌리기)
    const handleResetProfile = () => {
        setShowResetConfirm(true);
    };

    const confirmResetProfile = async () => {
        setShowResetConfirm(false);
        try {
            const userId = localStorage.getItem('firebaseUserId');
            if (!userId) {
                showToast?.('⚠️ 사용자 정보를 찾을 수 없습니다');
                return;
            }

            // 1. Firestore 닉네임 삭제
            await deleteNickname(userId);

            // 2. localStorage 프로필 설정 초기화
            setProfileSetting('userNickname', '');
            setProfileSetting('profileImageType', 'avatar');
            setProfileSetting('selectedAvatarId', '');
            setProfileSetting('avatarBgColor', 'none');
            setProfileSetting('customProfilePicture', '');

            // 3. Firestore users/{userId}/settings/profile 초기화
            try {
                const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
                const { db } = await import('../firebase/config');

                const settingsRef = doc(db, 'users', userId, 'settings', 'profile');
                await setDoc(settingsRef, {
                    profileImageType: 'avatar',
                    selectedAvatarId: null,
                    avatarBgColor: 'none',
                    profileImageVersion: null,
                    updatedAt: serverTimestamp(),
                }, { merge: true });

                console.log('✅ Firestore 프로필 설정 초기화 완료');
            } catch (settingsError) {
                console.error('Firestore 프로필 설정 초기화 실패:', settingsError);
            }

            // 4. 로컬 state 업데이트
            setNickname('');
            setProfileImageType('avatar');
            setSelectedAvatarId(null);
            setAvatarBgColor('none');
            setCustomPicture(null);

            // 5. 이벤트 발생으로 다른 컴포넌트 동기화
            window.dispatchEvent(new CustomEvent('nicknameChanged', { detail: '' }));
            window.dispatchEvent(new CustomEvent('profileImageTypeChanged', { detail: 'avatar' }));

            showToast?.('✅ 구글 프로필로 되돌렸습니다');
        } catch (error) {
            console.error('프로필 초기화 오류:', error);
            showToast?.('❌ 프로필 초기화 중 오류가 발생했습니다');
        }
    };

    // 프로필 이미지 에러 처리
    const handleImageError = () => {
        console.log('⚠️ 프로필 이미지 로드 실패 - Placeholder 표시');
        setImageError(true);
    };

    // 프로필 사진 업로드 input ref
    const fileInputRef = useRef(null);

    // 이미지 타입 변경 핸들러
    const handleImageTypeChange = async (type) => {
        console.log('🔄 프로필 이미지 타입 변경:', type);
        setProfileImageType(type);
        setProfileSetting('profileImageType', type);

        // Header에 알림
        window.dispatchEvent(new CustomEvent('profileImageTypeChanged', { detail: type }));

        // 🔥 Firestore users/{userId}/settings/profile에 동기화
        try {
            const userId = localStorage.getItem('firebaseUserId');
            if (userId) {
                const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
                const { db } = await import('../firebase/config');

                const settingsRef = doc(db, 'users', userId, 'settings', 'profile');
                await setDoc(settingsRef, {
                    profileImageType: type,
                    updatedAt: serverTimestamp(),
                }, { merge: true });

                console.log('✅ 프로필 이미지 타입 Firestore 동기화 완료');
            }
        } catch (error) {
            console.error('프로필 이미지 타입 동기화 실패:', error);
        }

        // 버튼 클릭 시에는 모달을 열지 않고 타입만 변경
        // 아바타 모드에서 프로필 사진을 클릭하면 모달이 열림
    };

    // 아바타 선택 핸들러
    const handleAvatarSelect = async (avatarId) => {
        setSelectedAvatarId(avatarId);
        setProfileSetting('selectedAvatarId', avatarId);
        showToast?.('아바타가 변경되었습니다');

        // 🔥 Firestore users/{userId}/settings/profile에 동기화
        try {
            const userId = localStorage.getItem('firebaseUserId');
            if (userId) {
                const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
                const { db } = await import('../firebase/config');

                const settingsRef = doc(db, 'users', userId, 'settings', 'profile');
                await setDoc(settingsRef, {
                    profileImageType: 'avatar',
                    selectedAvatarId: avatarId,
                    avatarBgColor: avatarBgColor,
                    updatedAt: serverTimestamp(),
                }, { merge: true });

                console.log('✅ 아바타 선택 Firestore 동기화 완료');
            }
        } catch (error) {
            console.error('아바타 선택 동기화 실패:', error);
        }
    };

    // 아바타 아이콘 렌더링
    const renderAvatarIcon = () => {
        if (!selectedAvatarId) return null;
        const avatar = avatarList.find(a => a.id === selectedAvatarId);
        if (!avatar) return null;
        const AvatarComponent = avatar.component;
        return <AvatarComponent />;
    };

    // 생년월일 탭 핸들러 (3초간 표시)
    const handleBirthDateTap = () => {
        if (birthDateTimerRef.current) {
            clearTimeout(birthDateTimerRef.current);
        }

        setIsBirthDateRevealed(true);

        birthDateTimerRef.current = setTimeout(() => {
            setIsBirthDateRevealed(false);
        }, 3000);
    };

    // 컴포넌트 언마운트 시 타이머 정리
    // 🔥 프로필 페이지 마운트 시 Firebase에서 최신 닉네임 직접 로드
    useEffect(() => {
        const loadLatestNickname = async () => {
            try {
                const userId = localStorage.getItem('firebaseUserId');
                if (!userId) return;

                // Firebase에서 최신 닉네임 가져오기
                const { getUserNickname } = await import('../services/nicknameService');
                const latestNickname = await getUserNickname(userId);

                if (latestNickname) {
                    // Firebase에 닉네임이 있으면 그것을 사용
                    setNickname(latestNickname);
                    // localStorage도 업데이트
                    setProfileSetting('userNickname', latestNickname);
                } else {
                    // Firebase에 닉네임이 없으면 localStorage 또는 profile 사용
                    const savedNickname = getProfileSetting('userNickname');
                    setNickname(savedNickname || profile?.nickname || '');
                }
            } catch (error) {
                console.error('최신 닉네임 로드 오류:', error);
                // 오류 시 localStorage 또는 profile 사용
                const savedNickname = getProfileSetting('userNickname');
                setNickname(savedNickname || profile?.nickname || '');
            }
        };

        loadLatestNickname();
    }, []); // 컴포넌트 마운트 시 한 번만 실행

    // 🔥 프로필 사진 Firestore에서 로드
    useEffect(() => {
        const loadProfileSettings = async () => {
            const userId = localStorage.getItem('firebaseUserId');
            if (!userId) return;

            try {
                const { doc, getDoc } = await import('firebase/firestore');
                const { db } = await import('../firebase/config');
                const { getProfileImageUrl } = await import('../utils/storageService');

                const settingsRef = doc(db, 'users', userId, 'settings', 'profile');
                const settingsSnap = await getDoc(settingsRef);

                if (settingsSnap.exists()) {
                    const settings = settingsSnap.data();

                    // Firestore에서 가져온 설정으로 업데이트
                    if (settings.profileImageType) {
                        setProfileImageType(settings.profileImageType);
                        setProfileSetting('profileImageType', settings.profileImageType);

                        // 'photo' 모드면 버전 기반 URL 사용
                        if (settings.profileImageType === 'photo') {
                            const version = settings.profileImageVersion || null;
                            const imageUrl = getProfileImageUrl(userId, version);
                            setCustomPicture(imageUrl);
                        }
                    }
                    if (settings.selectedAvatarId) {
                        setSelectedAvatarId(settings.selectedAvatarId);
                        setProfileSetting('selectedAvatarId', settings.selectedAvatarId);
                    }
                    if (settings.avatarBgColor) {
                        setAvatarBgColor(settings.avatarBgColor);
                        setProfileSetting('avatarBgColor', settings.avatarBgColor);
                    }
                    console.log('✅ Firestore에서 프로필 설정 로드 완료:', {
                        profileImageType: settings.profileImageType,
                        profileImageVersion: settings.profileImageVersion
                    });
                }
            } catch (error) {
                console.error('프로필 설정 로드 오류:', error);
            }
        };

        loadProfileSettings();
    }, []); // 컴포넌트 마운트 시 한 번만 실행

    useEffect(() => {
        return () => {
            if (birthDateTimerRef.current) {
                clearTimeout(birthDateTimerRef.current);
            }
        };
    }, []);

    // 배경색 변경 이벤트 리스너
    useEffect(() => {
        const handleBgColorChange = async (e) => {
            const newColor = e.detail;
            setAvatarBgColor(newColor);

            // 🔥 Firestore users/{userId}/settings/profile에 동기화
            try {
                const userId = localStorage.getItem('firebaseUserId');
                if (userId) {
                    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
                    const { db } = await import('../firebase/config');

                    const settingsRef = doc(db, 'users', userId, 'settings', 'profile');
                    await setDoc(settingsRef, {
                        avatarBgColor: newColor,
                        updatedAt: serverTimestamp(),
                    }, { merge: true });

                    console.log('✅ 아바타 배경색 Firestore 동기화 완료');
                }
            } catch (error) {
                console.error('아바타 배경색 동기화 실패:', error);
            }
        };
        window.addEventListener('avatarBgColorChanged', handleBgColorChange);
        return () => window.removeEventListener('avatarBgColorChanged', handleBgColorChange);
    }, []);

    // WS 코드 (친구 코드) 로드
    useEffect(() => {
        const loadWsCode = async () => {
            // localStorage에서 userId 가져오기
            const userId = localStorage.getItem('firebaseUserId');
            console.log('🔍 [ProfilePage] WS 코드 로드 시작 - userId:', userId, 'profile:', profile?.name);

            if (!userId || !profile) {
                console.log('⚠️ [ProfilePage] WS 코드 로드 실패: userId 또는 profile 없음');
                return;
            }

            // localStorage에서 먼저 확인
            const cachedWsCode = localStorage.getItem(`wsCode_${userId}`);
            if (cachedWsCode) {
                console.log('✅ [ProfilePage] localStorage에서 WS 코드 로드:', cachedWsCode);
                setWsCode(cachedWsCode);

                // QR 코드 생성
                try {
                    const qrUrl = await QRCode.toDataURL(cachedWsCode, {
                        width: 200,
                        margin: 2,
                        color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                        }
                    });
                    setQrCodeUrl(qrUrl);
                } catch (qrErr) {
                    console.error('QR 코드 생성 오류:', qrErr);
                }
                return;
            }

            try {
                // workspaces 컬렉션에서 WS 코드 가져오기
                const workspaceId = `workspace_${userId}`;
                console.log('🔍 [ProfilePage] Firestore에서 WS 코드 조회:', workspaceId);
                const workspaceRef = doc(db, 'workspaces', workspaceId);
                const workspaceDoc = await getDoc(workspaceRef);

                if (workspaceDoc.exists()) {
                    const code = workspaceDoc.data().workspaceCode;
                    console.log('✅ [ProfilePage] Firestore에서 WS 코드 로드:', code);
                    setWsCode(code);

                    // localStorage에 캐시
                    if (code) {
                        localStorage.setItem(`wsCode_${userId}`, code);
                    }

                    // QR 코드 생성
                    if (code) {
                        const qrUrl = await QRCode.toDataURL(code, {
                            width: 200,
                            margin: 2,
                            color: {
                                dark: '#000000',
                                light: '#FFFFFF'
                            }
                        });
                        setQrCodeUrl(qrUrl);
                    }
                } else {
                    console.log('⚠️ [ProfilePage] Firestore에 workspace 문서 없음:', workspaceId);
                }
            } catch (err) {
                console.error('❌ [ProfilePage] WS 코드 로드 오류:', err);
            }
        };

        if (profile) {
            loadWsCode();
        }
    }, [profile]);

    // 닉네임 초기화 (Firestore 우선, localStorage는 백업)
    useEffect(() => {
        const loadNickname = async () => {
            const userId = localStorage.getItem('firebaseUserId');
            if (!userId) return;

            try {
                // Firestore에서 최신 닉네임 가져오기
                const { getUserNickname } = await import('../services/nicknameService');
                const firestoreNickname = await getUserNickname(userId);

                if (firestoreNickname) {
                    setNickname(firestoreNickname);
                    // localStorage 동기화
                    localStorage.setItem('userNickname', firestoreNickname);
                } else {
                    // Firestore에 없으면 localStorage 사용
                    const savedNickname = localStorage.getItem('userNickname');
                    if (savedNickname) {
                        setNickname(savedNickname);
                    }
                }
            } catch (error) {
                console.error('닉네임 로드 실패:', error);
                // 에러 시 localStorage 폴백
                const savedNickname = localStorage.getItem('userNickname');
                if (savedNickname) {
                    setNickname(savedNickname);
                }
            }
        };

        loadNickname();
    }, []);

    // 마스터 비밀번호 설정 여부 확인
    useEffect(() => {
        setHasMasterPasswordSet(hasMasterPassword());
    }, []);

    // 생년월일 마스킹 함수
    const maskBirthDate = (year, month, day) => {
        if (isBirthDateRevealed) {
            return `${year}년 ${month}월 ${day}일`;
        }

        // 연도의 앞 2자리만 표시, 나머지는 *로 마스킹
        const yearStr = String(year);
        const maskedYear = yearStr.substring(0, 2) + '**';

        return `${maskedYear}년 **월 **일`;
    };

    // 이미지를 압축하고 Base64로 변환
    const compressAndConvertImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 400;
                    const MAX_HEIGHT = 400;
                    let width = img.width;
                    let height = img.height;

                    // 비율 유지하면서 리사이즈
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // JPEG 품질 0.7로 압축
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(compressedBase64);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    // 해시 계산 함수
    const calculateHash = async (base64String) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(base64String);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    };

    // 프로필 사진 변경
    const handleProfileImageClick = () => {
        if (profileImageType === 'avatar') {
            // 아바타 모드일 때는 아바타 선택 모달 열기
            setIsAvatarSelectorOpen(true);
        } else {
            // 사진 모드일 때는 파일 선택
            fileInputRef.current?.click();
        }
    };

    // 프로필 사진/아바타 제거 (초기화)
    const handleRemoveProfile = async () => {
        if (profileImageType === 'avatar') {
            // 아바타 제거
            setSelectedAvatarId(null);
            localStorage.removeItem('selectedAvatarId');
            localStorage.removeItem('avatarBgColor');
            setAvatarBgColor('none');

            // Header에 알림 (아바타 제거)
            window.dispatchEvent(new CustomEvent('avatarChanged', {
                detail: { avatarId: null, bgColor: 'none' }
            }));

            // 🔥 Firestore settings에도 동기화
            try {
                const userId = localStorage.getItem('firebaseUserId');
                if (userId) {
                    const { fetchSettingsFromFirestore, saveSettingsToFirestore } = await import('../services/userDataService');
                    const currentSettings = await fetchSettingsFromFirestore(userId);
                    await saveSettingsToFirestore(userId, {
                        ...currentSettings,
                        selectedAvatarId: null,
                        avatarBgColor: 'none'
                    });
                    console.log('✅ 아바타 제거 Firestore 동기화 완료');
                }
            } catch (error) {
                console.error('아바타 제거 동기화 실패:', error);
            }

            showToast?.('아바타가 제거되었습니다');
        } else {
            // 사진 제거
            setCustomPicture(null);
            localStorage.removeItem('customProfilePicture');
            localStorage.removeItem('customProfilePictureHash');
            setImageError(false);

            // Header에 알림
            window.dispatchEvent(new CustomEvent('profilePictureChanged', {
                detail: { picture: null, hash: null }
            }));

            // 🔥 Firestore settings에도 동기화
            try {
                const userId = localStorage.getItem('firebaseUserId');
                if (userId) {
                    const { fetchSettingsFromFirestore, saveSettingsToFirestore } = await import('../services/userDataService');
                    const currentSettings = await fetchSettingsFromFirestore(userId);
                    await saveSettingsToFirestore(userId, {
                        ...currentSettings,
                        customProfilePicture: null,
                        customProfilePictureHash: null
                    });
                    console.log('✅ 커스텀 프로필 사진 제거 Firestore 동기화 완료');
                }
            } catch (error) {
                console.error('커스텀 프로필 사진 제거 동기화 실패:', error);
            }

            showToast?.('프로필 사진이 제거되었습니다');
        }
    };

    // 파일 선택 시 처리
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 이미지 파일인지 확인
        if (!file.type.startsWith('image/')) {
            showToast?.('이미지 파일만 업로드할 수 있습니다');
            return;
        }

        // 파일 크기 체크 (10MB 제한)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
            showToast?.('이미지 크기는 10MB 이하여야 합니다');
            e.target.value = '';
            return;
        }

        try {
            showToast?.('이미지 업로드 중...');

            const userId = localStorage.getItem('firebaseUserId');
            if (!userId) {
                showToast?.('로그인이 필요합니다');
                e.target.value = '';
                return;
            }

            // R2에 프로필 이미지 업로드 (Firestore settings/profile에 자동 저장됨)
            const { uploadProfileImage, getProfileImageUrl } = await import('../utils/storageService');
            await uploadProfileImage(file, userId);

            // Firestore에서 최신 버전 정보 가져오기
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase/config');
            const settingsRef = doc(db, 'users', userId, 'settings', 'profile');
            const settingsSnap = await getDoc(settingsRef);
            const version = settingsSnap.exists() ? settingsSnap.data().profileImageVersion : null;

            // 버전 기반 URL 생성
            const imageUrl = getProfileImageUrl(userId, version);

            console.log('✅ 프로필 이미지 업로드 완료 (버전:', version + ')');

            // localStorage에 'photo' 모드 저장
            setProfileSetting('profileImageType', 'photo');
            setProfileImageType('photo');

            // 프로필 상태 업데이트
            setCustomPicture(imageUrl);

            // 프로필 상태 업데이트 이벤트 발생 (다른 컴포넌트 동기화)
            window.dispatchEvent(new CustomEvent('profilePictureChanged', {
                detail: { picture: imageUrl }
            }));

            showToast?.('프로필 사진이 변경되었습니다 📸');

            // 이미지 에러 상태 초기화
            setImageError(false);
        } catch (error) {
            console.error('이미지 처리 오류:', error);

            // 메모리 부족 에러 감지
            if (error.message && error.message.includes('memory')) {
                showToast?.('이미지가 너무 커서 처리할 수 없습니다');
            } else {
                showToast?.('이미지 처리 중 오류가 발생했습니다');
            }
        }

        // input 초기화 (같은 파일을 다시 선택할 수 있도록)
        e.target.value = '';
    };

    // 운세 정보 수정
    const handleEditFortuneInfo = () => {
        setIsFortuneInputModalOpen(true);
    };

    // 오늘의 운세 보기 / 다시보기
    const handleViewFortune = () => {
        setIsFortuneFlowOpen(true);
    };

    // 생일 알림 활성화/비활성화
    const handleBirthdayReminderToggle = () => {
        setIsBirthdayReminderEnabled(!isBirthdayReminderEnabled);
        if (!isBirthdayReminderEnabled) {
            showToast?.('생일 알림이 활성화되었습니다 🎂');
        } else {
            showToast?.('생일 알림이 비활성화되었습니다');
        }
    };

    // 아이디 복사 (WS 코드의 6자리 부분만)
    const handleCopyWsCode = () => {
        if (wsCode) {
            // "WS-Y3T1ZM"에서 "Y3T1ZM"만 추출하고 대문자로 변환
            const idOnly = (wsCode.split('-')[1] || wsCode).toUpperCase();
            navigator.clipboard.writeText(idOnly);
            showToast?.('아이디가 복사되었습니다');
        }
    };

    // 이메일 복사
    const handleCopyEmail = () => {
        if (profile?.email) {
            navigator.clipboard.writeText(profile.email);
            showToast?.('이메일이 복사되었습니다');
        }
    };

    // QR 이미지 저장
    const handleSaveQRImage = () => {
        if (!qrCodeUrl) return;

        // Base64 이미지를 다운로드
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        const idOnly = wsCode ? wsCode.split('-')[1] || wsCode : 'QR';
        link.download = `아이디_${idOnly}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast?.('QR 코드가 저장되었습니다');
    };

    // QR 이미지를 클립보드에 복사
    const handleCopyQRImage = async () => {
        if (!qrCodeUrl) return;

        try {
            // Base64를 Blob으로 변환
            const response = await fetch(qrCodeUrl);
            const blob = await response.blob();

            // 클립보드에 이미지 복사
            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob
                })
            ]);

            showToast?.('QR 코드가 클립보드에 복사되었습니다');
        } catch (error) {
            console.error('QR 이미지 복사 오류:', error);
            showToast?.('QR 코드 복사에 실패했습니다');
        }
    };

    // 이메일 마스킹 함수
    const maskEmail = (email) => {
        if (!email) return '';

        const [localPart, domain] = email.split('@');
        if (!localPart || !domain) return email;

        // 앞 3자리만 표시하고 나머지는 * 처리
        const visiblePart = localPart.substring(0, 3);
        const maskedPart = '*'.repeat(Math.max(0, localPart.length - 3));

        return `${visiblePart}${maskedPart}@${domain}`;
    };

    return (
        <>
            <S.Overlay>
                <S.ModalContainer>
                    <S.Header>
                        <S.HeaderTitle>프로필</S.HeaderTitle>
                        <S.CloseButton onClick={onClose}>&times;</S.CloseButton>
                    </S.Header>

                    <S.ScrollContent>
                        <S.Container>
                {/* 프로필 헤더 */}
                <S.Section>
                    <S.ProfileHeader>
                        <S.ProfileImageWrapper>
                            <S.ProfileImageClickable onClick={handleProfileImageClick}>
                                {profileImageType === 'avatar' ? (
                                    selectedAvatarId ? (
                                        <S.AvatarIconWrapper $bgColor={typeof BACKGROUND_COLORS[avatarBgColor] === 'function' ? BACKGROUND_COLORS[avatarBgColor]() : BACKGROUND_COLORS[avatarBgColor]}>
                                            {renderAvatarIcon()}
                                        </S.AvatarIconWrapper>
                                    ) : !nickname && profile?.picture && !imageError ? (
                                        <S.ProfileImage
                                            src={profile.picture}
                                            alt="Profile"
                                            onError={handleImageError}
                                            crossOrigin="anonymous"
                                        />
                                    ) : (
                                        <S.DefaultProfileIcon>{profileInitial}</S.DefaultProfileIcon>
                                    )
                                ) : (
                                    customPicture && !imageError ? (
                                        <S.ProfileImage
                                            src={customPicture}
                                            alt="Profile"
                                            onError={handleImageError}
                                        />
                                    ) : !nickname && profile?.picture && !imageError ? (
                                        <S.ProfileImage
                                            src={profile.picture}
                                            alt="Profile"
                                            onError={handleImageError}
                                            crossOrigin="anonymous"
                                        />
                                    ) : (
                                        <S.DefaultProfileIcon>{profileInitial}</S.DefaultProfileIcon>
                                    )
                                )}
                                <S.EditOverlay className="edit-overlay">변경</S.EditOverlay>
                            </S.ProfileImageClickable>

                            {/* 제거 버튼 - 아바타가 선택되었거나 사진이 업로드된 경우에만 표시 */}
                            {(profileImageType === 'avatar' && selectedAvatarId) || (profileImageType === 'photo' && customPicture) ? (
                                <S.RemoveButton onClick={handleRemoveProfile}>
                                    초기화
                                </S.RemoveButton>
                            ) : null}
                        </S.ProfileImageWrapper>

                        {/* 이미지 타입 선택 버튼 */}
                        <S.ProfileImageTypeSelector>
                            <S.ImageTypeButton
                                $selected={profileImageType === 'avatar'}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleImageTypeChange('avatar');
                                }}
                            >
                                🎨 아바타
                            </S.ImageTypeButton>
                            <S.ImageTypeButton
                                $selected={profileImageType === 'photo'}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleImageTypeChange('photo');
                                }}
                            >
                                📸 이미지
                            </S.ImageTypeButton>
                        </S.ProfileImageTypeSelector>

                        {/* 숨겨진 파일 input (카메라/앨범 선택) */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />

                        <S.NicknameContainer>
                            {isEditingNickname ? (
                                <>
                                    <S.NicknameInput
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            // 가중치 계산: 한글 2포인트, 영문/숫자 1포인트
                                            let totalPoints = 0;

                                            for (let char of value) {
                                                // 한글 범위: AC00-D7A3 (가-힣)
                                                if (/[\uAC00-\uD7A3]/.test(char)) {
                                                    totalPoints += 2;
                                                } else {
                                                    totalPoints += 1;
                                                }
                                            }

                                            // 총 16포인트 이하 (한글 기준 8자)
                                            if (totalPoints <= 16) {
                                                setNickname(value);
                                            }
                                        }}
                                        onBlur={handleSaveNickname}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSaveNickname()}
                                        maxLength={16}
                                        autoFocus
                                    />
                                    <S.EditButton onClick={handleSaveNickname}>닉 저장</S.EditButton>
                                </>
                            ) : (
                                <>
                                    <S.Nickname>{userName}</S.Nickname>
                                    <S.EditButton onClick={() => setIsEditingNickname(true)}>닉 변경</S.EditButton>
                                </>
                            )}
                        </S.NicknameContainer>

                        {/* 이메일 행 */}
                        {profile && (
                            <S.InfoRowInHeader>
                                <S.InfoTextInHeader>로그인 계정: {profile.email}</S.InfoTextInHeader>
                            </S.InfoRowInHeader>
                        )}

                        {/* 아이디 + QR 섹션 */}
                        {profile && wsCode && (
                            <S.WsCodeQrContainer>
                                <S.WsCodeSection>
                                    <S.WsCodeText>셰어노트 ID: {(wsCode.split('-')[1] || wsCode).toUpperCase()}</S.WsCodeText>
                                    <S.CopyButtonInHeader onClick={handleCopyWsCode}>
                                        <Copy size={14} />
                                        복사
                                    </S.CopyButtonInHeader>
                                </S.WsCodeSection>
                                {qrCodeUrl && (
                                    <S.QrImageSection onClick={() => setIsQRModalOpen(true)}>
                                        <S.QrImageSmall src={qrCodeUrl} alt="내 아이디 QR" />
                                    </S.QrImageSection>
                                )}
                            </S.WsCodeQrContainer>
                        )}

                        {/* 게스트 모드일 때 이메일만 표시 */}
                        {!profile && (
                            <S.Email>게스트 모드</S.Email>
                        )}
                    </S.ProfileHeader>
                </S.Section>

                {/* 나의 활동 */}
                <S.Section>
                    <S.SectionTitle>📊 나의 활동</S.SectionTitle>
                    <S.StatsGrid>
                        <S.StatItem>
                            <S.StatValue>{totalMemos}</S.StatValue>
                            <S.StatLabel>전체 메모</S.StatLabel>
                        </S.StatItem>
                        <S.StatItem>
                            <S.StatValue>{importantMemos}</S.StatValue>
                            <S.StatLabel>중요 메모</S.StatLabel>
                        </S.StatItem>
                        <S.StatItem>
                            <S.StatValue>{totalSchedules}</S.StatValue>
                            <S.StatLabel>스케줄</S.StatLabel>
                        </S.StatItem>
                    </S.StatsGrid>
                </S.Section>

                {/* 데이터 정리 */}
                {orphanedMemosCount > 0 && (
                    <S.Section>
                        <S.SectionTitle>🧹 데이터 정리</S.SectionTitle>
                        <S.CleanupButton onClick={onCleanupOrphanedMemos}>
                            <Trash2 size={18} />
                            숨겨진 메모 정리 ({orphanedMemosCount}개)
                        </S.CleanupButton>
                    </S.Section>
                )}

                {/* 보안 설정 */}
                {hasMasterPasswordSet && (
                    <S.Section>
                        <S.SectionTitle>🔐 보안 설정</S.SectionTitle>
                        <S.SecurityButton onClick={() => setIsChangePasswordModalOpen(true)}>
                            <Lock size={18} />
                            마스터 비밀번호 변경
                        </S.SecurityButton>
                    </S.Section>
                )}

                {/* 보안 & 개인정보 */}
                <S.Section>
                    <S.SectionTitle>🔒 보안 & 개인정보</S.SectionTitle>
                    <S.SecurityLinkButton onClick={() => setIsSecurityDocViewerOpen(true)}>
                        <span>이용약관 · 개인정보처리방침</span>
                        <span style={{ opacity: 0.5 }}>›</span>
                    </S.SecurityLinkButton>
                </S.Section>
                        </S.Container>
                    </S.ScrollContent>
                </S.ModalContainer>
            </S.Overlay>

            {/* 아바타 선택 모달 */}
            {isAvatarSelectorOpen && (
                <AvatarSelector
                    isOpen={isAvatarSelectorOpen}
                    onClose={() => setIsAvatarSelectorOpen(false)}
                    onSelect={handleAvatarSelect}
                    currentAvatarId={selectedAvatarId}
                    birthYear={fortuneProfile?.birthYear}
                    birthMonth={fortuneProfile?.birthMonth}
                    birthDay={fortuneProfile?.birthDay}
                />
            )}

            {/* QR 코드 모달 */}
            {isQRModalOpen && qrCodeUrl && (
                <S.QRModalOverlay onClick={() => setIsQRModalOpen(false)}>
                    <S.QRModalContent onClick={(e) => e.stopPropagation()}>
                        <S.QRModalTitle>내 아이디 QR</S.QRModalTitle>
                        <S.QRImageWrapper>
                            <S.QRImageLarge src={qrCodeUrl} alt="내 아이디 QR" />
                        </S.QRImageWrapper>
                        <S.QRModalButtons>
                            <S.QRModalButton $primary onClick={handleCopyQRImage}>
                                복사
                            </S.QRModalButton>
                            <S.QRModalButton onClick={() => setIsQRModalOpen(false)}>
                                닫기
                            </S.QRModalButton>
                        </S.QRModalButtons>
                    </S.QRModalContent>
                </S.QRModalOverlay>
            )}

            {/* 비밀번호 변경 모달 */}
            {isChangePasswordModalOpen && (
                <ChangePasswordModal
                    onClose={() => setIsChangePasswordModalOpen(false)}
                    onSuccess={() => {
                        showToast?.('✅ 비밀번호가 성공적으로 변경되었습니다');
                    }}
                />
            )}

            {/* 프로필 초기화 확인 모달 */}
            {showResetConfirm && (
                <ConfirmModal
                    icon="🔄"
                    title="프로필 초기화"
                    message="구글 계정 프로필로 되돌리시겠습니까?\n\n닉네임과 프로필 사진이 초기화됩니다."
                    confirmText="초기화"
                    cancelText="취소"
                    onConfirm={confirmResetProfile}
                    onCancel={() => setShowResetConfirm(false)}
                />
            )}

            {/* 보안 & 개인정보 문서 뷰어 */}
            {isSecurityDocViewerOpen && (
                <SecurityDocViewer
                    onClose={() => setIsSecurityDocViewerOpen(false)}
                />
            )}

        </>
    );
};

export default ProfilePage;
