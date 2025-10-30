// src/utils/googleDriveSync.js

const FOLDER_NAME = 'MemoApp_Backup';
const FILE_NAME = 'app_data.json';

// Google API 클라이언트 로드 및 초기화
export const initializeGapiClient = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client', () => {
        window.gapi.client
          .init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          })
          .then(() => {
            console.log('✅ GAPI 클라이언트 초기화 완료');
            resolve();
          })
          .catch((error) => {
            console.error('❌ GAPI 초기화 실패:', error);
            reject(error);
          });
      });
    };
    script.onerror = reject;
    
    if (!document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
      document.body.appendChild(script);
    } else {
      window.gapi.load('client', () => {
        window.gapi.client
          .init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          })
          .then(resolve)
          .catch(reject);
      });
    }
  });
};

// 액세스 토큰 설정
export const setAccessToken = (token) => {
  if (window.gapi && window.gapi.client) {
    window.gapi.client.setToken({ access_token: token });
  }
};

// 폴더 찾기 또는 생성
const getOrCreateFolder = async () => {
  try {
    // 기존 폴더 검색
    const response = await window.gapi.client.drive.files.list({
      q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (response.result.files && response.result.files.length > 0) {
      console.log('📁 기존 폴더 발견:', response.result.files[0].id);
      return response.result.files[0].id;
    }

    // 폴더 생성
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

// Google Drive에 데이터 업로드 (동기화)
export const syncToGoogleDrive = async (data) => {
  try {
    if (!window.gapi || !window.gapi.client) {
      throw new Error('GAPI 클라이언트가 초기화되지 않았습니다.');
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
    
    // 토큰 만료 에러 체크
    if (error.status === 401) {
      return { success: false, error: 'TOKEN_EXPIRED' };
    }
    
    return { success: false, error: error.message };
  }
};

// Google Drive에서 데이터 다운로드 (복원)
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
    
    if (error.status === 401) {
      return { success: false, error: 'TOKEN_EXPIRED' };
    }
    
    return { success: false, error: error.message };
  }
};