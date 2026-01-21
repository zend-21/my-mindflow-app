/**
 * 크기 제한 유틸리티
 * - 메모 크기 제한 (200KB)
 * - Storage 업로드 크기 제한 (10MB)
 */

// ==========================================
// 크기 제한 상수
// ==========================================

export const SIZE_LIMITS = {
  // 메모 크기 제한: 200KB
  MEMO_MAX_SIZE: 200 * 1024, // 200KB = 204,800 bytes

  // Storage 업로드 크기 제한: 10MB
  STORAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB = 10,485,760 bytes

  // 이미지 업로드 권장 크기: 5MB
  IMAGE_RECOMMENDED_SIZE: 5 * 1024 * 1024, // 5MB
};

// ==========================================
// 크기 계산 함수
// ==========================================

/**
 * 객체의 바이트 크기 계산 (UTF-16 기준)
 * @param {any} obj - 크기를 계산할 객체
 * @returns {number} 바이트 크기
 */
export const calculateObjectSize = (obj) => {
  const jsonString = JSON.stringify(obj);
  // JavaScript는 UTF-16을 사용하므로 문자당 2바이트
  return new Blob([jsonString]).size;
};

/**
 * 파일 크기 계산
 * @param {File} file - 파일 객체
 * @returns {number} 바이트 크기
 */
export const calculateFileSize = (file) => {
  return file?.size || 0;
};

/**
 * 바이트를 읽기 쉬운 형식으로 변환
 * @param {number} bytes - 바이트 크기
 * @returns {string} 포맷된 문자열 (예: "1.5 MB")
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// ==========================================
// 크기 검증 함수
// ==========================================

/**
 * 메모 크기 검증
 * @param {object} memo - 메모 객체
 * @returns {object} { valid: boolean, size: number, message: string }
 */
export const validateMemoSize = (memo) => {
  const size = calculateObjectSize(memo);
  const maxSize = SIZE_LIMITS.MEMO_MAX_SIZE;

  if (size > maxSize) {
    return {
      valid: false,
      size,
      maxSize,
      message: `메모 크기가 너무 큽니다. (현재: ${formatBytes(size)}, 최대: ${formatBytes(maxSize)})\n내용을 줄이거나 여러 메모로 나누어 저장해주세요.`
    };
  }

  return {
    valid: true,
    size,
    maxSize,
    message: ''
  };
};

/**
 * 파일 업로드 크기 검증
 * @param {File} file - 파일 객체
 * @param {number} customLimit - 커스텀 크기 제한 (선택)
 * @returns {object} { valid: boolean, size: number, message: string }
 */
export const validateFileSize = (file, customLimit = null) => {
  const size = calculateFileSize(file);
  const maxSize = customLimit || SIZE_LIMITS.STORAGE_MAX_SIZE;

  if (size > maxSize) {
    return {
      valid: false,
      size,
      maxSize,
      message: `파일 크기가 너무 큽니다. (현재: ${formatBytes(size)}, 최대: ${formatBytes(maxSize)})\n더 작은 파일을 선택해주세요.`
    };
  }

  return {
    valid: true,
    size,
    maxSize,
    message: ''
  };
};

/**
 * 이미지 파일 크기 검증 (권장 크기 경고 포함)
 * @param {File} file - 이미지 파일 객체
 * @returns {object} { valid: boolean, size: number, warning: string, message: string }
 */
export const validateImageSize = (file) => {
  const size = calculateFileSize(file);
  const maxSize = SIZE_LIMITS.STORAGE_MAX_SIZE;
  const recommendedSize = SIZE_LIMITS.IMAGE_RECOMMENDED_SIZE;

  if (size > maxSize) {
    return {
      valid: false,
      size,
      maxSize,
      warning: '',
      message: `이미지 크기가 너무 큽니다. (현재: ${formatBytes(size)}, 최대: ${formatBytes(maxSize)})\n더 작은 이미지를 선택하거나 압축해주세요.`
    };
  }

  if (size > recommendedSize) {
    return {
      valid: true,
      size,
      maxSize,
      warning: `이미지 크기가 큽니다. (현재: ${formatBytes(size)})\n권장 크기: ${formatBytes(recommendedSize)} 이하`,
      message: ''
    };
  }

  return {
    valid: true,
    size,
    maxSize,
    warning: '',
    message: ''
  };
};

/**
 * 여러 파일의 총 크기 검증
 * @param {File[]} files - 파일 배열
 * @param {number} maxTotalSize - 최대 총 크기 (선택)
 * @returns {object} { valid: boolean, totalSize: number, message: string }
 */
export const validateMultipleFilesSize = (files, maxTotalSize = SIZE_LIMITS.STORAGE_MAX_SIZE * 5) => {
  const totalSize = files.reduce((sum, file) => sum + calculateFileSize(file), 0);

  if (totalSize > maxTotalSize) {
    return {
      valid: false,
      totalSize,
      maxTotalSize,
      message: `전체 파일 크기가 너무 큽니다. (현재: ${formatBytes(totalSize)}, 최대: ${formatBytes(maxTotalSize)})\n파일 수를 줄이거나 크기를 줄여주세요.`
    };
  }

  return {
    valid: true,
    totalSize,
    maxTotalSize,
    message: ''
  };
};

export default {
  SIZE_LIMITS,
  calculateObjectSize,
  calculateFileSize,
  formatBytes,
  validateMemoSize,
  validateFileSize,
  validateImageSize,
  validateMultipleFilesSize
};
