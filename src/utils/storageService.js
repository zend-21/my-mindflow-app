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

// 환경변수로 스토리지 제공자 선택
// Production에서는 무조건 R2 사용
const STORAGE_PROVIDER = 'r2';  // 임시로 하드코딩

// 디버깅: 실제 사용되는 스토리지 제공자 확인
console.log('🔧 Storage Provider:', STORAGE_PROVIDER);
console.log('🔧 R2 Endpoint:', import.meta.env.VITE_R2_ENDPOINT);
console.log('🔧 R2 Bucket:', import.meta.env.VITE_R2_BUCKET_NAME);

/**
 * 이미지 파일을 스토리지에 업로드
 * @param {File|Blob} file - 업로드할 파일 또는 Blob
 * @param {string} folder - 저장할 폴더명 (기본: 'images')
 * @param {string} originalFileName - 원본 파일명 (Blob일 경우 필수)
 * @returns {Promise<string>} 업로드된 파일의 URL
 */
export const uploadImage = async (file, folder = 'images', originalFileName = null) => {
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
    // S3 Client 설정
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: import.meta.env.VITE_R2_ENDPOINT,
      credentials: {
        accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
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
      Bucket: import.meta.env.VITE_R2_BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
    });

    await s3Client.send(command);

    // 공개 URL 생성 (R2 Public Development URL 형식)
    const publicUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/${key}`;

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
    // S3 Client 설정
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: import.meta.env.VITE_R2_ENDPOINT,
      credentials: {
        accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
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
    console.log('✅ Cloudflare R2 삭제 성공');
  } catch (error) {
    console.error('❌ Cloudflare R2 삭제 실패:', error);
    // 삭제 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
};

/**
 * 현재 사용 중인 스토리지 제공자 반환
 * @returns {string} 'firebase' | 'r2'
 */
export const getStorageProvider = () => STORAGE_PROVIDER;
