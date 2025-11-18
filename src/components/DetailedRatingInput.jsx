// src/components/DetailedRatingInput.jsx

import React, { useState, useEffect } from 'react';
import './DetailedRatingInput.css';

/**
 * 세밀한 별점 입력 컴포넌트
 * - 별 1-5개 클릭
 * - 소수점 1-99 입력 (5점 만점이면 입력폼 숨김)
 * - 소수점에 따라 별 색상 그라데이션
 */
const DetailedRatingInput = ({
  label = "별점",
  value = 0,
  onChange,
  required = false,
  showDetailLabel = false,
  isSubRating = false
}) => {
  const [wholeNumber, setWholeNumber] = useState(0); // 1-5
  const [decimal, setDecimal] = useState(''); // 1-99 (문자열로 관리)

  // value가 변경되면 wholeNumber와 decimal 분리
  useEffect(() => {
    if (value > 0) {
      const whole = Math.floor(value);
      const dec = Math.round((value - whole) * 100);
      setWholeNumber(whole);
      setDecimal(dec > 0 ? dec.toString() : '');
    } else {
      setWholeNumber(0);
      setDecimal('');
    }
  }, [value]);

  // 별 클릭 핸들러
  const handleStarClick = (star) => {
    setWholeNumber(star);

    // 5점 만점이면 소수점 0으로 초기화
    if (star === 5) {
      setDecimal('');
      onChange(5.0);
    } else {
      // 기존 소수점 유지하며 값 계산
      const decValue = decimal ? parseInt(decimal) / 100 : 0;
      onChange(star + decValue);
    }
  };

  // 소수점 입력 핸들러
  const handleDecimalChange = (e) => {
    const input = e.target.value;

    // 빈 문자열이면 허용
    if (input === '') {
      setDecimal('');
      onChange(wholeNumber);
      return;
    }

    // 숫자만 허용
    if (!/^\d+$/.test(input)) return;

    // 1-99 범위 체크
    const num = parseInt(input);
    if (num < 1 || num > 99) return;

    setDecimal(input);
    onChange(wholeNumber + num / 100);
  };

  // 별점 리셋 핸들러
  const handleReset = () => {
    setWholeNumber(0);
    setDecimal('');
    onChange(0);
  };

  // 별 렌더링 (그라데이션 포함)
  const renderStar = (index) => {
    const starNumber = index + 1;

    // 꽉 찬 별
    if (starNumber <= wholeNumber) {
      return (
        <button
          key={index}
          type="button"
          className="star-button filled"
          onClick={() => handleStarClick(starNumber)}
        >
          ★
        </button>
      );
    }

    // 부분적으로 채워진 별 (다음 별)
    if (starNumber === wholeNumber + 1 && decimal) {
      const fillPercent = parseInt(decimal);
      return (
        <button
          key={index}
          type="button"
          className="star-button partial"
          onClick={() => handleStarClick(starNumber)}
          style={{
            '--fill-percent': `${fillPercent}%`
          }}
        >
          ★
        </button>
      );
    }

    // 빈 별
    return (
      <button
        key={index}
        type="button"
        className="star-button empty"
        onClick={() => handleStarClick(starNumber)}
      >
        ★
      </button>
    );
  };

  return (
    <div className={`detailed-rating-input ${isSubRating ? 'sub-rating' : ''}`}>
      <label className="rating-label">
        {label}
        {required && <span className="required">(필수)</span>}
      </label>

      <div className="rating-controls">
        {/* 별 5개 */}
        <div className="star-selector">
          {[0, 1, 2, 3, 4].map(renderStar)}
        </div>

        {/* 점수 표시 및 소수점 입력 */}
        <div className="score-display">
          <span className="score-number">{wholeNumber}</span>

          {/* 5점 만점이 아닐 때만 소수점 입력 표시 */}
          {wholeNumber > 0 && wholeNumber < 5 && (
            <>
              <span className="decimal-dot">.</span>
              <input
                type="text"
                className="decimal-input"
                value={decimal}
                onChange={handleDecimalChange}
                placeholder="00"
                maxLength={2}
              />
            </>
          )}

          {wholeNumber === 5 && <span className="decimal-dot">.00</span>}
          {wholeNumber > 0 && <span className="score-suffix">점</span>}
        </div>

        {/* 리셋 버튼 (별점이 설정된 경우에만 표시) */}
        {wholeNumber > 0 && (
          <button
            type="button"
            className="rating-reset-button"
            onClick={handleReset}
            title="별점 초기화"
          >
            Del
          </button>
        )}
      </div>

      {/* 세부 라벨 (선택 사항) */}
      {showDetailLabel && value > 0 && (
        <div className="rating-detail">
          {value.toFixed(2)}점
        </div>
      )}
    </div>
  );
};

export default DetailedRatingInput;
