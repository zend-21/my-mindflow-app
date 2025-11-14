// src/utils/googleDriveBackup.js
// Google Drive 백업 파일 관리 전용 유틸리티

const BACKUP_FOLDER_NAME = 'MindFlow_Backups';

// 백업 폴더 찾기 또는 생성
const getOrCreateBackupFolder = async () => {
  try {
    const response = await window.gapi.client.drive.files.list({
      q: `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (response.result.files && response.result.files.length > 0) {
      console.log('📁 기존 백업 폴더 발견:', response.result.files[0].id);
      return response.result.files[0].id;
    }

    const folderMetadata = {
      name: BACKUP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const createResponse = await window.gapi.client.drive.files.create({
      resource: folderMetadata,
      fields: 'id',
    });

    console.log('📁 새 백업 폴더 생성:', createResponse.result.id);
    return createResponse.result.id;
  } catch (error) {
    console.error('❌ 백업 폴더 작업 실패:', error);
    throw error;
  }
};

// Google Drive에 백업 파일 저장 (날짜별 파일명)
export const backupToGoogleDrive = async (data) => {
  try {
    if (!window.gapi || !window.gapi.client) {
      throw new Error('GAPI 클라이언트가 초기화되지 않았습니다.');
    }

    const folderId = await getOrCreateBackupFolder();

    // 날짜별 파일명 생성
    const now = new Date();
    const fileName = `backup_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.json`;

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      parents: [folderId],
    };

    const dataWithTimestamp = {
      ...data,
      backedUpAt: now.toISOString(),
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
      path: '/upload/drive/v3/files',
      method: 'POST',
      params: { uploadType: 'multipart' },
      headers: {
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: multipartRequestBody,
    });

    const response = await request;
    console.log('✅ Google Drive 백업 성공:', response.result.id);

    // 오래된 백업 파일 삭제 (최근 10개만 유지)
    await deleteOldBackups(folderId);

    return {
      success: true,
      fileId: response.result.id,
      fileName: fileName
    };
  } catch (error) {
    console.error('❌ Google Drive 백업 실패:', error);

    if (error.status === 401 || error.status === 403) {
      return { success: false, error: 'TOKEN_EXPIRED' };
    }

    return { success: false, error: error.message };
  }
};

// 오래된 백업 파일 삭제 (최근 10개만 유지)
const deleteOldBackups = async (folderId) => {
  try {
    const response = await window.gapi.client.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, createdTime)',
      orderBy: 'createdTime desc',
      spaces: 'drive',
    });

    const files = response.result.files || [];

    // 10개 초과하는 파일들 삭제
    if (files.length > 10) {
      const filesToDelete = files.slice(10);
      console.log(`🗑️ ${filesToDelete.length}개의 오래된 백업 파일 삭제 중...`);

      for (const file of filesToDelete) {
        await window.gapi.client.drive.files.delete({
          fileId: file.id,
        });
        console.log(`🗑️ 삭제됨: ${file.name}`);
      }
    }
  } catch (error) {
    console.error('❌ 오래된 백업 삭제 실패:', error);
    // 삭제 실패해도 백업은 성공했으므로 에러를 throw하지 않음
  }
};

// Google Drive에서 백업 파일 목록 조회
export const listBackupFiles = async () => {
  try {
    if (!window.gapi || !window.gapi.client) {
      throw new Error('GAPI 클라이언트가 초기화되지 않았습니다.');
    }

    const folderId = await getOrCreateBackupFolder();

    const response = await window.gapi.client.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, createdTime, modifiedTime)',
      orderBy: 'createdTime desc',
      spaces: 'drive',
    });

    console.log('✅ 백업 파일 목록 조회 성공');

    return {
      success: true,
      files: response.result.files || []
    };
  } catch (error) {
    console.error('❌ 백업 파일 목록 조회 실패:', error);

    if (error.status === 401 || error.status === 403) {
      return { success: false, error: 'TOKEN_EXPIRED' };
    }

    return { success: false, error: error.message };
  }
};

// Google Drive에서 특정 백업 파일 복원
export const restoreFromBackupFile = async (fileId) => {
  try {
    if (!window.gapi || !window.gapi.client) {
      throw new Error('GAPI 클라이언트가 초기화되지 않았습니다.');
    }

    const response = await window.gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });

    console.log('✅ 백업 파일 복원 성공');

    return {
      success: true,
      data: response.result
    };
  } catch (error) {
    console.error('❌ 백업 파일 복원 실패:', error);

    if (error.status === 401 || error.status === 403) {
      return { success: false, error: 'TOKEN_EXPIRED' };
    }

    return { success: false, error: error.message };
  }
};
