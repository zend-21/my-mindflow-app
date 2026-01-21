/**
 * User Data Service - Main Export Module
 *
 * This module provides backward compatibility by re-exporting all functions
 * from the modularized service files. External code can continue to import
 * from this single entry point without changes.
 *
 * Architecture:
 * - userDataHelpers.js: Utility functions (timestamp conversion, sanitization)
 * - userDataCRUD.js: Core CRUD operations for memos, folders, trash, macros, calendar, activities
 * - userDataSettings.js: User settings and profile management
 * - userDataListeners.js: Real-time onSnapshot listeners
 * - userDataMigration.js: Data migration utilities
 * - userDataSecret.js: Secret page data operations
 */

// Helper utilities
export {
  convertTimestampsToMillis,
  removeUndefinedValues
} from './userDataHelpers';

// Core CRUD operations
export {
  // Memos
  fetchMemosFromFirestore,
  saveMemoToFirestore,
  deleteMemoFromFirestore,
  saveMemosToFirestore,

  // Folders
  fetchFoldersFromFirestore,
  saveFolderToFirestore,
  deleteFolderFromFirestore,
  saveFoldersToFirestore,

  // Trash
  fetchTrashFromFirestore,
  saveTrashItemToFirestore,
  deleteTrashItemFromFirestore,
  saveTrashToFirestore,

  // Macros
  fetchMacrosFromFirestore,
  saveMacroToFirestore,
  saveMacrosToFirestore,

  // Calendar
  fetchCalendarFromFirestore,
  saveCalendarDateToFirestore,
  deleteCalendarDateFromFirestore,
  deleteBase64ImagesFromCalendar,
  saveCalendarToFirestore,
  cleanupDeletedFirestoreDocuments,

  // Activities
  fetchActivitiesFromFirestore,
  saveActivityToFirestore,
  deleteActivityFromFirestore,
  saveActivitiesToFirestore,

  // Bulk operations
  fetchAllUserData,

  // Cleanup
  deleteAllUserData
} from './userDataCRUD';

// Settings and profile
export {
  fetchSettingsFromFirestore,
  saveSettingsToFirestore,
  fetchFortuneProfileFromFirestore,
  saveFortuneProfileToFirestore,
  deleteFortuneProfileFromFirestore
} from './userDataSettings';

// Real-time listeners
export {
  setupMemosListener,
  setupFoldersListener,
  setupTrashListener,
  setupCalendarListener,
  setupActivitiesListener,
  setupSettingsListener
} from './userDataListeners';

// Migration utilities
export {
  migrateArrayToIndividualDocs,
  migrateLocalStorageToFirestore,
  migrateLegacyFirestoreData
} from './userDataMigration';

// Secret page operations
export {
  fetchSecretPinFromFirestore,
  saveSecretPinToFirestore,
  fetchSecretDocsFromFirestore,
  saveSecretDocsToFirestore,
  fetchSecretSettingsFromFirestore,
  saveSecretSettingsToFirestore,
  fetchDeletedSecretDocIds,
  saveDeletedSecretDocIds,
  fetchPendingCleanupIds,
  savePendingCleanupIds,
  fetchSecretDocsMetadata,
  fetchIndividualSecretDocsFromFirestore,
  saveIndividualSecretDocsToFirestore,
  deleteIndividualSecretDocsFromFirestore,
  migrateToIndividualEncryption
} from './userDataSecret';

/**
 * 🔐 사용자 데이터 구조 (개별 문서 저장 - 산업 표준 방식)
 * mindflowUsers/{userId}/memos/{memoId}
 * mindflowUsers/{userId}/folders/{folderId}
 * mindflowUsers/{userId}/trash/{trashId}
 * mindflowUsers/{userId}/macros/{macroId}
 * mindflowUsers/{userId}/calendar/{dateKey}
 * mindflowUsers/{userId}/activities/{activityId}
 * mindflowUsers/{userId}/userData/settings (단일 문서)
 *
 * 변경 사항:
 * - 배열 저장 방식(items) → 개별 문서 저장으로 완전 리팩토링
 * - 실시간 onSnapshot 리스너 지원
 * - 메모 1개 변경 시 1개만 저장 (효율성 대폭 향상)
 * - 타임스탬프 자동 관리 (serverTimestamp)
 */
