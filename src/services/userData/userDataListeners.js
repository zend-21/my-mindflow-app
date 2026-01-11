/**
 * Real-time listeners for user data
 * Provides onSnapshot listeners for all data types
 */
import { db } from '../../firebase/config';
import {
  doc,
  collection,
  onSnapshot
} from 'firebase/firestore';
import { convertTimestampsToMillis } from './userDataHelpers';

// ========================================
// 실시간 리스너 설정
// ========================================

/**
 * 메모 실시간 리스너 설정
 */
export const setupMemosListener = (userId, callback) => {
  const colRef = collection(db, 'mindflowUsers', userId, 'memos');
  return onSnapshot(colRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const rawData = change.doc.data();
      const data = {
        id: change.doc.id,
        ...convertTimestampsToMillis(rawData)
      };

      callback(change.type, data);
    });
  }, (error) => {
    console.error('메모 리스너 에러:', error);
  });
};

/**
 * 폴더 실시간 리스너 설정
 */
export const setupFoldersListener = (userId, callback) => {
  const colRef = collection(db, 'mindflowUsers', userId, 'folders');
  return onSnapshot(colRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const rawData = change.doc.data();
      const data = {
        id: change.doc.id,
        ...convertTimestampsToMillis(rawData)
      };
      callback(change.type, data);
    });
  }, (error) => {
    console.error('폴더 리스너 에러:', error);
  });
};

/**
 * 휴지통 실시간 리스너 설정
 */
export const setupTrashListener = (userId, callback) => {
  const colRef = collection(db, 'mindflowUsers', userId, 'trash');
  return onSnapshot(colRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const rawData = change.doc.data();
      const data = {
        id: change.doc.id,
        ...convertTimestampsToMillis(rawData)
      };
      callback(change.type, data);
    });
  }, (error) => {
    console.error('휴지통 리스너 에러:', error);
  });
};

/**
 * 캘린더 실시간 리스너 설정
 */
export const setupCalendarListener = (userId, callback) => {
  const colRef = collection(db, 'mindflowUsers', userId, 'calendar');
  return onSnapshot(colRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const dateKey = change.doc.id;
      const rawData = change.doc.data();
      const convertedData = convertTimestampsToMillis(rawData);
      const schedule = convertedData.schedule || {};
      callback(change.type, dateKey, schedule);
    });
  }, (error) => {
    console.error('캘린더 리스너 에러:', error);
  });
};

/**
 * 활동 실시간 리스너 설정
 */
export const setupActivitiesListener = (userId, callback) => {
  const colRef = collection(db, 'mindflowUsers', userId, 'activities');
  return onSnapshot(colRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const rawData = change.doc.data();
      const data = {
        id: change.doc.id,
        ...convertTimestampsToMillis(rawData)
      };
      callback(change.type, data);
    });
  }, (error) => {
    console.error('활동 리스너 에러:', error);
  });
};

/**
 * 설정 실시간 리스너 설정
 */
export const setupSettingsListener = (userId, callback) => {
  const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'settings');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const rawData = snapshot.data();
      const convertedData = convertTimestampsToMillis(rawData);
      callback(convertedData);
    }
  }, (error) => {
    console.error('설정 리스너 에러:', error);
  });
};
