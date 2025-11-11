// src/modules/calendar/alarm/hooks/useAlarmModals.js
// 알람 모달 UI 상태 관리 (확인, 검증 모달 등)

import { useState } from 'react';

export const useAlarmModals = () => {
  // 검증 모달
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // 삭제 확인 모달
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmMessage, setDeleteConfirmMessage] = useState('');
  const [deleteTargetAlarm, setDeleteTargetAlarm] = useState(null);
  const [deleteTargetType, setDeleteTargetType] = useState(''); // 'pending', 'registered', 'anniversary'

  // 수정 저장 확인 모달
  const [showEditSaveConfirmModal, setShowEditSaveConfirmModal] = useState(false);

  // 검증 모달 표시
  const showValidation = (message) => {
    setValidationMessage(message);
    setShowValidationModal(true);
  };

  // 검증 모달 닫기
  const closeValidationModal = () => {
    setShowValidationModal(false);
    setValidationMessage('');
  };

  // 삭제 확인 모달 표시
  const showDeleteConfirmation = (alarm, type) => {
    setDeleteTargetAlarm(alarm);
    setDeleteTargetType(type);

    if (alarm.isAnniversary) {
      setDeleteConfirmMessage(
        `기념일 "${alarm.title}"을(를) 삭제하시겠습니까?\n이 기념일과 관련된 모든 반복 알람이 삭제됩니다.`
      );
    } else {
      setDeleteConfirmMessage(
        `알람 "${alarm.title}"을(를) 삭제하시겠습니까?`
      );
    }

    setShowDeleteConfirmModal(true);
  };

  // 삭제 확인 모달 닫기
  const closeDeleteConfirmModal = () => {
    setShowDeleteConfirmModal(false);
    setDeleteConfirmMessage('');
    setDeleteTargetAlarm(null);
    setDeleteTargetType('');
  };

  // 수정 저장 확인 모달 표시
  const showEditSaveConfirmation = () => {
    setShowEditSaveConfirmModal(true);
  };

  // 수정 저장 확인 모달 닫기
  const closeEditSaveConfirmModal = () => {
    setShowEditSaveConfirmModal(false);
  };

  return {
    // 검증 모달
    showValidationModal,
    validationMessage,
    setShowValidationModal,
    setValidationMessage,
    showValidation,
    closeValidationModal,

    // 삭제 확인 모달
    showDeleteConfirmModal,
    deleteConfirmMessage,
    deleteTargetAlarm,
    deleteTargetType,
    setShowDeleteConfirmModal,
    setDeleteConfirmMessage,
    setDeleteTargetAlarm,
    setDeleteTargetType,
    showDeleteConfirmation,
    closeDeleteConfirmModal,

    // 수정 저장 확인 모달
    showEditSaveConfirmModal,
    setShowEditSaveConfirmModal,
    showEditSaveConfirmation,
    closeEditSaveConfirmModal,
  };
};
