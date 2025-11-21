// 워크스페이스 수동 생성 유틸리티
import { createWorkspace, checkWorkspaceExists } from '../services/workspaceService';
import { auth } from '../firebase/config';

/**
 * 현재 로그인한 사용자의 워크스페이스를 수동으로 생성합니다.
 * 브라우저 콘솔에서 사용: window.createMyWorkspace()
 */
export const createWorkspaceManually = async () => {
  try {
    if (!auth.currentUser) {
      console.error('❌ 로그인이 필요합니다!');
      return { success: false, error: 'Not logged in' };
    }

    const userId = auth.currentUser.uid;
    const userName = auth.currentUser.displayName || '사용자';
    const userEmail = auth.currentUser.email;

    console.log('📝 사용자 정보:');
    console.log('  - User ID:', userId);
    console.log('  - Name:', userName);
    console.log('  - Email:', userEmail);

    // 기존 워크스페이스 확인
    console.log('\n🔍 기존 워크스페이스 확인 중...');
    const exists = await checkWorkspaceExists(userId);

    if (exists) {
      console.log('✅ 워크스페이스가 이미 존재합니다!');
      return { success: true, message: 'Workspace already exists' };
    }

    console.log('🚀 워크스페이스 생성 중...');
    const result = await createWorkspace(userId, userName, userEmail);

    if (result.success) {
      console.log('✅ 워크스페이스 생성 완료!');
      console.log('  - Workspace ID:', result.workspaceId);
      console.log('  - Workspace Code:', result.data.workspaceCode);
      console.log('\n🎉 이제 "내 워크스페이스"를 새로고침하면 방이 보입니다!');
      return result;
    } else {
      console.error('❌ 워크스페이스 생성 실패:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    return { success: false, error: error.message };
  }
};

// 브라우저 콘솔에서 사용할 수 있도록 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.createMyWorkspace = createWorkspaceManually;
  console.log('✅ 워크스페이스 수동 생성 함수가 등록되었습니다!');
  console.log('💡 사용법: 브라우저 콘솔에서 createMyWorkspace() 를 실행하세요.');
}

export default createWorkspaceManually;
