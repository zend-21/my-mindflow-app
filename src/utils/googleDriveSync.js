// src/utils/googleDriveSync.js

const FOLDER_NAME = 'MemoApp_Backup';
const BACKUP_FOLDER_NAME = 'MindFlow_Backups';
const FILE_NAME = 'app_data.json';
const PROFILE_PICTURE_FILE_NAME = 'profile_picture.json';

// ⚠️ 중요: Google OAuth로 받은 credential은 ID Token이므로
// Drive API 사용을 위해서는 별도의 Access Token이 필요합니다.
// 하지만 @react-oauth/google의 credential에서는 Access Token을 직접 얻을 수 없으므로
// useGoogleLogin을 사용하여 Access Token을 받아야 합니다.

let gapiInited = false;
let tokenClient = null;

// GAPI 초기화
export const initializeGapiClient = () => {
  return new Promise((resolve, reject) => {
    if (gapiInited) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: '', // 선택사항
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          gapiInited = true;
          console.log('✅ GAPI 클라이언트 초기화 완료');
          resolve();
        } catch (error) {
          console.error('❌ GAPI 초기화 실패:', error);
          reject(error);
        }
      });
    };
    script.onerror = reject;
    
    if (!document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
      document.body.appendChild(script);
    } else {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: '',
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          gapiInited = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }
  });
};

// 액세스 토큰 설정
export const setAccessToken = (token) => {
  if (window.gapi && window.gapi.client) {
    window.gapi.client.setToken({ access_token: token });
    console.log('✅ Access Token 설정 완료');
    console.log('🔍 설정된 토큰 확인:', window.gapi.client.getToken()?.access_token?.substring(0, 20) + '...');
  } else {
    console.error('❌ GAPI 클라이언트가 없어서 토큰 설정 실패');
  }
};

// 폴더 찾기 또는 생성
const getOrCreateFolder = async () => {
  try {
    const response = await window.gapi.client.drive.files.list({
      q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (response.result.files && response.result.files.length > 0) {
      console.log('📁 기존 폴더 발견:', response.result.files[0].id);
      return response.result.files[0].id;
    }

    const folderMetadata = {
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const createResponse = await window.gapi.client.drive.files.create({
      resource: folderMetadata,
      fields: 'id',
    });

    console.log('📁 새 폴더 생성:', createResponse.result.id);
    return createResponse.result.id;
  } catch (error) {
    console.error('❌ 폴더 작업 실패:', error);
    throw error;
  }
};

// 기존 파일 찾기
const findExistingFile = async (folderId) => {
  try {
    const response = await window.gapi.client.drive.files.list({
      q: `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, modifiedTime)',
      spaces: 'drive',
    });

    if (response.result.files && response.result.files.length > 0) {
      console.log('📄 기존 파일 발견:', response.result.files[0].id);
      return response.result.files[0];
    }
    console.log('📄 기존 파일 없음');
    return null;
  } catch (error) {
    console.error('❌ 파일 검색 실패:', error);
    return null;
  }
};

// Google Drive에 데이터 업로드
export const syncToGoogleDrive = async (data) => {
  try {
    if (!window.gapi || !window.gapi.client) {
      throw new Error('GAPI 클라이언트가 초기화되지 않았습니다.');
    }

    // 🔍 토큰 확인
    const currentToken = window.gapi.client.getToken();
    console.log('🔍 동기화 시작 - 현재 GAPI 토큰:', currentToken?.access_token?.substring(0, 20) + '...');

    if (!currentToken || !currentToken.access_token) {
      console.error('❌ GAPI에 토큰이 설정되어 있지 않음!');
      throw new Error('토큰이 설정되지 않았습니다.');
    }

    const folderId = await getOrCreateFolder();
    const existingFile = await findExistingFile(folderId);

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = {
      name: FILE_NAME,
      mimeType: 'application/json',
      parents: existingFile ? undefined : [folderId],
    };

    const dataWithTimestamp = {
      ...data,
      syncedAt: new Date().toISOString(),
      version: '1.0',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(dataWithTimestamp) +
      close_delim;

    const request = window.gapi.client.request({
      path: existingFile
        ? `/upload/drive/v3/files/${existingFile.id}`
        : '/upload/drive/v3/files',
      method: existingFile ? 'PATCH' : 'POST',
      params: { uploadType: 'multipart' },
      headers: {
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: multipartRequestBody,
    });

    const response = await request;
    console.log('✅ Google Drive 동기화 성공:', response.result.id);
    
    return { 
      success: true, 
      fileId: response.result.id,
      modifiedTime: response.result.modifiedTime 
    };
  } catch (error) {
    console.error('❌ Google Drive 동기화 실패:', error);
    
    if (error.status === 401 || error.status === 403) {
      return { success: false, error: 'TOKEN_EXPIRED' };
    }
    
    return { success: false, error: error.message };
  }
};

// Google Drive에서 데이터 다운로드
export const loadFromGoogleDrive = async () => {
  try {
    if (!window.gapi || !window.gapi.client) {
      throw new Error('GAPI 클라이언트가 초기화되지 않았습니다.');
    }

    const folderId = await getOrCreateFolder();
    const existingFile = await findExistingFile(folderId);

    if (!existingFile) {
      console.log('📭 복원할 파일이 없습니다.');
      return { success: false, data: null, message: 'NO_FILE' };
    }

    const response = await window.gapi.client.drive.files.get({
      fileId: existingFile.id,
      alt: 'media',
    });

    console.log('✅ Google Drive 데이터 로드 성공');
    
    return { 
      success: true, 
      data: response.result,
      modifiedTime: existingFile.modifiedTime 
    };
  } catch (error) {
    console.error('❌ Google Drive 데이터 로드 실패:', error);
    
    if (error.status === 401 || error.status === 403) {
      return { success: false, error: 'TOKEN_EXPIRED' };
    }
    
    return { success: false, error: error.message };
  }
};

// Google OAuth Access Token 요청
export const requestAccessToken = (clientId) => {
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response) => {
        if (response.access_token) {
          console.log('✅ Access Token 발급 성공');
          resolve(response.access_token);
        } else {
          console.error('❌ Access Token 발급 실패');
          reject(new Error('Access Token을 받지 못했습니다.'));
        }
      },
    });

    client.requestAccessToken();
  });
};

// ========================================
// 프로필 사진 동기화 함수들
// ========================================

// 프로필 사진 파일 찾기
const findProfilePictureFile = async (folderId) => {
  try {
    const response = await window.gapi.client.drive.files.list({
      q: `name='${PROFILE_PICTURE_FILE_NAME}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, modifiedTime)',
      spaces: 'drive',
    });

    if (response.result.files && response.result.files.length > 0) {
      console.log('📸 기존 프로필 사진 파일 발견:', response.result.files[0].id);
      return response.result.files[0];
    }
    console.log('📸 기존 프로필 사진 파일 없음');
    return null;
  } catch (error) {
    console.error('❌ 프로필 사진 파일 검색 실패:', error);
    return null;
  }
};

// Google Drive에 프로필 사진 업로드
export const syncProfilePictureToGoogleDrive = async (base64Image, hash) => {
  try {
    if (!window.gapi || !window.gapi.client) {
      throw new Error('GAPI 클라이언트가 초기화되지 않았습니다.');
    }

    console.log('📸 프로필 사진 업로드 시작...');

    const folderId = await getOrCreateFolder();
    const existingFile = await findProfilePictureFile(folderId);

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = {
      name: PROFILE_PICTURE_FILE_NAME,
      mimeType: 'application/json',
      parents: existingFile ? undefined : [folderId],
    };

    const profileData = {
      base64: base64Image,
      hash: hash,
      uploadedAt: new Date().toISOString(),
      version: '1.0',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(profileData) +
      close_delim;

    const request = window.gapi.client.request({
      path: existingFile
        ? `/upload/drive/v3/files/${existingFile.id}`
        : '/upload/drive/v3/files',
      method: existingFile ? 'PATCH' : 'POST',
      params: { uploadType: 'multipart' },
      headers: {
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: multipartRequestBody,
    });

    const response = await request;
    console.log('✅ 프로필 사진 Google Drive 업로드 성공:', response.result.id);

    return {
      success: true,
      fileId: response.result.id,
      hash: hash
    };
  } catch (error) {
    console.error('❌ 프로필 사진 Google Drive 업로드 실패:', error);

    if (error.status === 401 || error.status === 403) {
      return { success: false, error: 'TOKEN_EXPIRED' };
    }

    return { success: false, error: error.message };
  }
};

// Google Drive에서 프로필 사진 다운로드
export const loadProfilePictureFromGoogleDrive = async () => {
  try {
    if (!window.gapi || !window.gapi.client) {
      throw new Error('GAPI 클라이언트가 초기화되지 않았습니다.');
    }

    console.log('📸 프로필 사진 다운로드 시작...');

    const folderId = await getOrCreateFolder();
    const existingFile = await findProfilePictureFile(folderId);

    if (!existingFile) {
      console.log('📭 복원할 프로필 사진이 없습니다.');
      return { success: false, data: null, message: 'NO_FILE' };
    }

    const response = await window.gapi.client.drive.files.get({
      fileId: existingFile.id,
      alt: 'media',
    });

    console.log('✅ 프로필 사진 Google Drive 다운로드 성공');

    return {
      success: true,
      data: response.result, // { base64, hash, uploadedAt, version }
      modifiedTime: existingFile.modifiedTime
    };
  } catch (error) {
    console.error('❌ 프로필 사진 Google Drive 다운로드 실패:', error);

    if (error.status === 401 || error.status === 403) {
      return { success: false, error: 'TOKEN_EXPIRED' };
    }

    return { success: false, error: error.message };
  }
};