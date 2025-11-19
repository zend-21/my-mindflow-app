// src/components/CategorySettingsModal.jsx

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './CategorySettingsModal.css';
import { REVIEWABLE_CATEGORIES, CATEGORY_ICONS, CATEGORY_SETTINGS_KEY, DEFAULT_CATEGORY } from '../config/categoryConfig';

const CategorySettingsModal = ({ isOpen, onClose, onSave, showToast }) => {
  const [selectedCategories, setSelectedCategories] = useState([DEFAULT_CATEGORY.id]);

  useEffect(() => {
    if (isOpen) {
      // localStorage에서 저장된 카테고리 설정 불러오기
      const saved = localStorage.getItem(CATEGORY_SETTINGS_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSelectedCategories(parsed);
        } catch (error) {
          console.error('카테고리 설정 로드 실패:', error);
          setSelectedCategories([DEFAULT_CATEGORY.id]);
        }
      } else {
        setSelectedCategories([DEFAULT_CATEGORY.id]);
      }
    }
  }, [isOpen]);

  // body 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleToggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        // 최소 1개는 선택되어야 함
        if (prev.length === 1) {
          showToast?.('최소 1개의 카테고리를 선택해야 합니다.');
          return prev;
        }
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSave = () => {
    if (selectedCategories.length === 0) {
      showToast?.('최소 1개의 카테고리를 선택해주세요.');
      return;
    }

    // localStorage에 저장
    localStorage.setItem(CATEGORY_SETTINGS_KEY, JSON.stringify(selectedCategories));

    // 카테고리 변경 이벤트 발생 (검색 자동 갱신용)
    window.dispatchEvent(new Event('categorySettingsChanged'));

    // 부모 컴포넌트에 전달
    onSave(selectedCategories);
    onClose();
    showToast?.('카테고리 설정이 저장되었습니다.');
  };

  const handleReset = () => {
    setSelectedCategories([DEFAULT_CATEGORY.id]);
    showToast?.('기본 설정(음식점)으로 초기화되었습니다.');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="category-settings-overlay">
      <div className="category-settings-modal">
        <div className="category-settings-header">
          <h3>리뷰 카테고리 설정</h3>
          <button className="category-settings-close" onClick={onClose}>×</button>
        </div>

        <div className="category-settings-content">
          <p className="category-settings-description">
            리뷰를 작성할 업종을 선택하세요. 선택한 카테고리만 검색 시 표시됩니다.
          </p>

          <div className="category-grid">
            {REVIEWABLE_CATEGORIES.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  className={`category-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleToggleCategory(category.id)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="category-icon"
                  >
                    <path d={CATEGORY_ICONS[category.icon]} />
                  </svg>
                  <span className="category-name">{category.name}</span>
                  {isSelected && (
                    <div className="category-check">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="category-selected-info">
            선택됨: {selectedCategories.length}개
          </div>
        </div>

        <div className="category-settings-actions">
          <button
            type="button"
            className="reset-btn"
            onClick={handleReset}
          >
            초기화
          </button>
          <button
            type="button"
            className="save-btn"
            onClick={handleSave}
          >
            저장
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CategorySettingsModal;
