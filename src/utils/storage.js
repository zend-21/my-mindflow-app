import { storage } from '../firebase/config';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * DataURL을 Firebase Storage에 업로드
 * @param {string} dataUrl - 이미지 DataURL
 * @param {string} path - 저장 경로 (예: 'reviews/userId/imageId.jpg')
 * @returns {Promise<string>} 업로드된 이미지의 다운로드 URL
 */
export const uploadImage = async (dataUrl, path) => {
  try {
    const storageRef = ref(storage, path);

    // DataURL 업로드
    const snapshot = await uploadString(storageRef, dataUrl, 'data_url');

    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    throw error;
  }
};

/**
 * 여러 이미지를 Firebase Storage에 업로드
 * @param {string[]} dataUrls - 이미지 DataURL 배열
 * @param {string} userId - 사용자 ID
 * @param {string} reviewId - 리뷰 ID
 * @returns {Promise<string[]>} 업로드된 이미지들의 다운로드 URL 배열
 */
export const uploadMultipleImages = async (dataUrls, userId, reviewId) => {
  try {
    const uploadPromises = dataUrls.map((dataUrl, index) => {
      const timestamp = Date.now();
      const path = `reviews/${userId}/${reviewId}/image_${timestamp}_${index}.jpg`;
      return uploadImage(dataUrl, path);
    });

    const downloadUrls = await Promise.all(uploadPromises);
    return downloadUrls;
  } catch (error) {
    console.error('다중 이미지 업로드 실패:', error);
    throw error;
  }
};

/**
 * Firebase Storage에서 이미지 삭제
 * @param {string} imageUrl - 삭제할 이미지의 다운로드 URL
 */
export const deleteImage = async (imageUrl) => {
  try {
    // URL에서 Storage 경로 추출
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('이미지 삭제 실패:', error);
    throw error;
  }
};

/**
 * 여러 이미지를 Firebase Storage에서 삭제
 * @param {string[]} imageUrls - 삭제할 이미지들의 다운로드 URL 배열
 */
export const deleteMultipleImages = async (imageUrls) => {
  try {
    const deletePromises = imageUrls.map(url => deleteImage(url));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('다중 이미지 삭제 실패:', error);
    throw error;
  }
};

/**
 * DataURL을 Blob으로 변환
 * @param {string} dataUrl - DataURL
 * @returns {Blob}
 */
export const dataURLtoBlob = (dataUrl) => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
};

/**
 * 이미지 압축 (클라이언트 사이드)
 * @param {string} dataUrl - 원본 이미지 DataURL
 * @param {number} maxWidth - 최대 너비 (기본: 1200)
 * @param {number} quality - 품질 (0-1, 기본: 0.8)
 * @returns {Promise<string>} 압축된 이미지 DataURL
 */
export const compressImage = (dataUrl, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      let { width, height } = img;

      // 최대 너비를 초과하면 비율에 맞게 축소
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      // 압축된 이미지 DataURL 반환
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = (error) => {
      reject(error);
    };

    img.src = dataUrl;
  });
};
