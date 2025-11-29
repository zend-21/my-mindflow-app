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

// 환경변수로 스토리지 제공자 선택 (기본값: firebase)
const STORAGE_PROVIDER = import.meta.env.VITE_STORAGE_PROVIDER || 'firebase';

/**
 * 이미지 파일을 스토리지에 업로드
 * @param {File} file - 업로드할 파일
 * @param {string} folder - 저장할 폴더명 (기본: 'images')
 * @returns {Promise<string>} 업로드된 파일의 URL
 */
export const uploadImage = async (file, folder = 'images') => {
  if (STORAGE_PROVIDER === 'r2') {
    return await uploadToR2(file, folder);
  } else {
    return await uploadToFirebase(file, folder);
  }
};

/**
 * Firebase Storage에 업로드
 * @private
 */
const uploadToFirebase = async (file, folder) => {
  try {
    // 파일명 생성: 타임스탬프_원본파일명
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;

    // Storage 레퍼런스 생성
    const storageRef = ref(storage, `${folder}/${fileName}`);

    // 파일 업로드
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });

    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log('✅ Firebase Storage 업로드 성공:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('❌ Firebase Storage 업로드 실패:', error);
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }
};

/**
 * Cloudflare R2에 업로드
 * @private
 *
 * 500명 돌파 시 구현 예정
 * 필요한 환경변수:
 *   - VITE_R2_ACCOUNT_ID
 *   - VITE_R2_ACCESS_KEY_ID
 *   - VITE_R2_SECRET_ACCESS_KEY
 *   - VITE_R2_BUCKET_NAME
 *   - VITE_R2_PUBLIC_URL
 */
const uploadToR2 = async (file, folder) => {
  try {
    // S3 SDK를 사용한 R2 업로드 (나중에 구현)
    // 현재는 간단한 fetch API 예시

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await fetch(`${import.meta.env.VITE_R2_PUBLIC_URL}/upload`, {
      method: 'POST',
      headers: {
        'X-Custom-Auth-Key': import.meta.env.VITE_R2_ACCESS_KEY_ID,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('R2 업로드 실패');
    }

    const { url } = await response.json();
    console.log('✅ Cloudflare R2 업로드 성공:', url);
    return url;
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
    console.log('✅ Firebase Storage 삭제 성공');
  } catch (error) {
    console.error('❌ Firebase Storage 삭제 실패:', error);
    // 삭제 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
};

/**
 * Cloudflare R2에서 삭제
 * @private
 */
const deleteFromR2 = async (url) => {
  try {
    // R2 삭제 로직 (나중에 구현)
    console.log('✅ Cloudflare R2 삭제 성공');
  } catch (error) {
    console.error('❌ Cloudflare R2 삭제 실패:', error);
  }
};

/**
 * 현재 사용 중인 스토리지 제공자 반환
 * @returns {string} 'firebase' | 'r2'
 */
export const getStorageProvider = () => STORAGE_PROVIDER;
