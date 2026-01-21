// ═══════════════════════════════════════════════════════════════════════════
// 📦 스토리지 추상화 레이어 - Firebase Storage ↔ Cloudflare R2 전환 대비
// ═══════════════════════════════════════════════════════════════════════════
//
// 이 파일은 Firebase Storage와 Cloudflare R2 간의 마이그레이션을 쉽게 하기 위한
// 추상화 레이어입니다. .env의 VITE_STORAGE_PROVIDER만 변경하면 전체 앱이 전환됩니다.
//
// 사용 예시:
//   import { uploadImage } from '@/utils/storageService';
//   const url = await uploadImage(file);
//
// 마이그레이션:
//   1. .env에 VITE_STORAGE_PROVIDER=r2 추가
//   2. R2 환경변수 설정
//   3. 끝! (코드 변경 불필요)
//
// ═══════════════════════════════════════════════════════════════════════════

import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { validateFileSize, validateImageSize } from './sizeLimit';

// 환경변수로 스토리지 제공자 선택
// Production에서는 무조건 R2 사용
const STORAGE_PROVIDER = 'r2';  // 임시로 하드코딩


/**
 * 이미지 파일을 스토리지에 업로드
 * @param {File|Blob} file - 업로드할 파일 또는 Blob
 * @param {string} folder - 저장할 폴더명 (기본: 'images')
 * @param {string} originalFileName - 원본 파일명 (Blob일 경우 필수)
 * @returns {Promise<string>} 업로드된 파일의 URL
 */
export const uploadImage = async (file, folder = 'images', originalFileName = null) => {
  // 이미지 크기 검증 (최대 10MB, 권장 5MB)
  const validation = validateImageSize(file);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  // 권장 크기 초과 시 경고 로그
  if (validation.warning) {
    console.warn('⚠️ ' + validation.warning);
  }

  if (STORAGE_PROVIDER === 'r2') {
    return await uploadToR2(file, folder, originalFileName);
  } else {
    return await uploadToFirebase(file, folder, originalFileName);
  }
};

/**
 * Firebase Storage에 업로드
 * @private
 */
const uploadToFirebase = async (file, folder, originalFileName = null) => {
  try {
    // 파일명 생성: 타임스탬프_UUID.확장자
    const timestamp = Date.now();
    const fileName = originalFileName || file.name || 'image.jpg';
    const extension = fileName.split('.').pop();
    const randomId = Math.random().toString(36).substring(2, 15);
    const newFileName = `${timestamp}_${randomId}.${extension}`;

    // Storage 레퍼런스 생성
    const storageRef = ref(storage, `${folder}/${newFileName}`);

    // 파일 업로드
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });

    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('❌ Firebase Storage 업로드 실패:', error);
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }
};

/**
 * Cloudflare R2에 업로드
 * @private
 */
const uploadToR2 = async (file, folder, originalFileName = null) => {
  try {

    // S3 Client 설정 (환경변수의 개행문자 제거)
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: import.meta.env.VITE_R2_ENDPOINT?.trim(),
      credentials: {
        accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID?.trim(),
        secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY?.trim(),
      },
    });

    // 파일명 생성: 타임스탬프_UUID.확장자
    const timestamp = Date.now();
    const fileName = originalFileName || file.name || 'image.jpg';
    const extension = fileName.split('.').pop();
    const randomId = Math.random().toString(36).substring(2, 15);
    const newFileName = `${timestamp}_${randomId}.${extension}`;
    const key = `${folder}/${newFileName}`;

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();

    // R2에 업로드
    const command = new PutObjectCommand({
      Bucket: import.meta.env.VITE_R2_BUCKET_NAME?.trim(),
      Key: key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
    });

    await s3Client.send(command);

    // 공개 URL 생성 (R2 Public Development URL 형식)
    const publicUrl = `${import.meta.env.VITE_R2_PUBLIC_URL?.trim()}/${key}`;

    return publicUrl;
  } catch (error) {
    console.error('❌ Cloudflare R2 업로드 실패:', error);
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }
};

/**
 * 파일 삭제
 * @param {string} url - 삭제할 파일의 URL
 */
export const deleteImage = async (url) => {
  if (STORAGE_PROVIDER === 'r2') {
    return await deleteFromR2(url);
  } else {
    return await deleteFromFirebase(url);
  }
};

/**
 * Firebase Storage에서 삭제
 * @private
 */
const deleteFromFirebase = async (url) => {
  try {
    const { deleteObject, ref: storageRef } = await import('firebase/storage');
    const fileRef = storageRef(storage, url);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Firebase Storage 삭제 실패:', error);
    // 삭제 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
};

/**
 * Cloudflare R2에서 삭제
 * @private
 */
const deleteFromR2 = async (url) => {
  try {
    // S3 Client 설정 (환경변수의 개행문자 제거)
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: import.meta.env.VITE_R2_ENDPOINT?.trim(),
      credentials: {
        accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID?.trim(),
        secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY?.trim(),
      },
    });

    // URL에서 Key 추출
    // 예: https://pub-xxxxx.r2.dev/images/file.jpg -> images/file.jpg
    const urlParts = url.split('/');
    // Public URL의 경우 도메인 이후의 모든 부분이 key
    const key = urlParts.slice(3).join('/');

    // R2에서 삭제
    const command = new DeleteObjectCommand({
      Bucket: import.meta.env.VITE_R2_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Cloudflare R2 삭제 실패:', error);
    // 삭제 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
};

/**
 * 프로필 이미지를 버전이 포함된 파일명으로 업로드
 * @param {File|Blob} file - 업로드할 파일 또는 Blob
 * @param {string} userId - 사용자 ID
 * @returns {Promise<string>} 업로드된 파일의 URL
 */
export const uploadProfileImage = async (file, userId) => {
  if (!userId) {
    throw new Error('userId is required for profile image upload');
  }

  // 프로필 이미지 크기 검증 (최대 10MB)
  const validation = validateImageSize(file);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  // 권장 크기 초과 시 경고 로그
  if (validation.warning) {
    console.warn('⚠️ ' + validation.warning);
  }

  try {
    // S3 Client 설정
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: import.meta.env.VITE_R2_ENDPOINT?.trim(),
      credentials: {
        accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID?.trim(),
        secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY?.trim(),
      },
    });

    // 버전 생성
    const version = Date.now();

    // 🆕 Firestore에서 이전 버전 정보 가져오기 (이전 파일 삭제용)
    const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('../firebase/config');

    const settingsRef = doc(db, 'users', userId, 'settings', 'profile');
    let oldVersion = null;

    try {
      const oldSettings = await getDoc(settingsRef);
      if (oldSettings.exists() && oldSettings.data().profileImageVersion) {
        oldVersion = oldSettings.data().profileImageVersion;
      }
    } catch (err) {
      console.log('이전 버전 정보 없음 (첫 업로드)');
    }

    // 버전이 포함된 파일명
    const key = `profile-images/${userId}-${version}.jpg`;

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();

    // R2에 업로드
    const command = new PutObjectCommand({
      Bucket: import.meta.env.VITE_R2_BUCKET_NAME?.trim(),
      Key: key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: 'image/jpeg',
    });

    await s3Client.send(command);

    // Firestore에 프로필 사진 설정 저장 (버전 + 타입)
    await setDoc(settingsRef, {
      profileImageType: 'photo',
      profileImageVersion: version,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // 🆕 이전 파일 삭제 (R2 용량 절약)
    if (oldVersion) {
      try {
        const oldKey = `profile-images/${userId}-${oldVersion}.jpg`;
        const deleteCommand = new DeleteObjectCommand({
          Bucket: import.meta.env.VITE_R2_BUCKET_NAME?.trim(),
          Key: oldKey,
        });
        await s3Client.send(deleteCommand);
      } catch (deleteError) {
        // 이전 파일 삭제 실패는 무시 (파일이 없을 수도 있음)
      }
    }

    // 공개 URL 생성 (버전이 파일명에 포함되어 있음)
    const publicUrl = `${import.meta.env.VITE_R2_PUBLIC_URL?.trim()}/${key}`;

    return publicUrl;
  } catch (error) {
    console.error('프로필 이미지 업로드 실패:', error);
    throw new Error(`프로필 이미지 업로드 실패: ${error.message}`);
  }
};

/**
 * 프로필 이미지 URL 생성 (버전 기반 - Firestore에서 읽음)
 * @param {string} userId - 사용자 ID
 * @param {number} version - 프로필 이미지 버전 (Firestore에서 읽은 값)
 * @returns {string} 프로필 이미지 URL
 */
export const getProfileImageUrl = (userId, version = null) => {
  if (!userId) return null;

  // 버전이 없으면 이전 방식으로 폴백 (하위 호환성)
  if (!version) {
    return `${import.meta.env.VITE_R2_PUBLIC_URL?.trim()}/profile-images/${userId}.jpg`;
  }

  // 버전이 파일명에 포함됨 (예: userId-1234567890.jpg)
  return `${import.meta.env.VITE_R2_PUBLIC_URL?.trim()}/profile-images/${userId}-${version}.jpg`;
};

/**
 * 현재 사용 중인 스토리지 제공자 반환
 * @returns {string} 'firebase' | 'r2'
 */
export const getStorageProvider = () => STORAGE_PROVIDER;
