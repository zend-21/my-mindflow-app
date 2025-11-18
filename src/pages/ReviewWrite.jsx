import React, { useState, useEffect } from 'react';
import { Camera } from '@capacitor/camera';
import { CameraResultType, CameraSource } from '@capacitor/camera';
import { createReview, getReview, updateReview } from '../services/reviewService';
import { compressImage } from '../utils/storage';
import RestaurantAutocomplete from '../components/RestaurantAutocomplete';
import DetailedRatingInput from '../components/DetailedRatingInput';
import RichTextEditorModal from '../components/RichTextEditorModal';
import ConfirmModal from '../components/ConfirmModal';
import './ReviewWrite.css';

const ReviewWrite = ({ reviewId, onBack, onSaved, showToast }) => {
  const isEditMode = !!reviewId;
  const [formData, setFormData] = useState({
    restaurantId: '',           // 카카오맵 가게 ID
    restaurantName: '',
    restaurantAddress: '',
    restaurantPhone: '',
    rating: 0,
    tasteRating: 0,             // 맛 별점 (선택)
    priceRating: 0,             // 가격 별점 (선택)
    serviceRating: 0,           // 친절 별점 (선택)
    title: '',
    content: '',
    photos: [],
    foodItems: [{ name: '', price: '' }], // { name: string, price: string }[]
    totalPrice: '',             // 총 결제 금액 (자동 계산 또는 직접 입력)
    orderDate: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isEditingRestaurant, setIsEditingRestaurant] = useState(false);
  const [showChangeRestaurantConfirm, setShowChangeRestaurantConfirm] = useState(false);

  // 수정 모드: 기존 리뷰 데이터 로드
  useEffect(() => {
    if (isEditMode && reviewId) {
      loadReviewData();
    } else {
      // 생성 모드: 폼 초기화 (브라우저 자동완성 방지)
      setFormData({
        restaurantId: '',
        restaurantName: '',
        restaurantAddress: '',
        restaurantPhone: '',
        rating: 0,
        tasteRating: 0,
        priceRating: 0,
        serviceRating: 0,
        title: '',
        content: '',
        photos: [],
        foodItems: [{ name: '', price: '' }],
        totalPrice: '',
        orderDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [reviewId, isEditMode]);

  const loadReviewData = async () => {
    try {
      setLoading(true);
      const review = await getReview(reviewId);

      // 기존 데이터 형식 호환성 처리
      let loadedFoodItems = [{ name: '', price: '' }];
      if (review.foodItems && review.foodItems.length > 0) {
        // 새 형식 { name, price } 또는 구 형식 string 모두 처리
        loadedFoodItems = review.foodItems.map(item => {
          if (typeof item === 'string') {
            return { name: item, price: '' };
          }
          return { name: item.name || '', price: item.price || '' };
        });
      }

      setFormData({
        restaurantId: review.restaurantId || '',
        restaurantName: review.restaurantName,
        restaurantAddress: review.restaurantAddress || '',
        restaurantPhone: review.restaurantPhone || '',
        rating: review.rating,
        tasteRating: review.tasteRating || 0,
        priceRating: review.priceRating || 0,
        serviceRating: review.serviceRating || 0,
        title: review.title || '',
        content: review.content,
        photos: review.photos || [],
        foodItems: loadedFoodItems,
        totalPrice: review.totalPrice ? String(review.totalPrice) : (review.price ? String(review.price) : ''),
        orderDate: review.orderDate
          ? new Date(review.orderDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('리뷰 로드 실패:', error);
      showToast?.('리뷰를 불러오는데 실패했습니다.');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 리치 텍스트 에디터에서 내용 저장
  const handleContentSave = (content) => {
    setFormData(prev => ({
      ...prev,
      content: content
    }));
  };

  // 마크다운 형식의 내용을 HTML로 렌더링 (간단한 구현)
  const renderFormattedContent = (text) => {
    if (!text) return '';

    let formatted = text;

    // 볼드 처리: **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 이탤릭 처리: *text*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 정렬 처리
    formatted = formatted.replace(/\[center\](.*?)\[\/center\]/g, '<div style="text-align: center;">$1</div>');
    formatted = formatted.replace(/\[left\](.*?)\[\/left\]/g, '<div style="text-align: left;">$1</div>');
    formatted = formatted.replace(/\[right\](.*?)\[\/right\]/g, '<div style="text-align: right;">$1</div>');

    // 이미지 처리: ![alt](src)
    formatted = formatted.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; border-radius: 8px; margin: 10px 0;" />');

    // 비디오 처리: [video](url)
    formatted = formatted.replace(/\[video\]\((.*?)\)/g, (match, url) => {
      // YouTube URL 감지
      const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
      const youtubeMatch = url.match(youtubeRegex);

      if (youtubeMatch) {
        const videoId = youtubeMatch[1];
        return `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 10px 0;">
          <iframe
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px;"
            src="https://www.youtube.com/embed/${videoId}"
            frameborder="0"
            allowfullscreen>
          </iframe>
        </div>`;
      }

      // 일반 비디오 URL
      return `<video controls style="max-width: 100%; border-radius: 8px; margin: 10px 0;">
        <source src="${url}" />
        Your browser does not support the video tag.
      </video>`;
    });

    // 링크 처리: [text](url)
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #f093fb; text-decoration: underline;">$1</a>');

    // 줄바꿈 처리
    formatted = formatted.replace(/\n/g, '<br />');

    return formatted;
  };

  // 별점 변경 핸들러
  const handleRatingChange = (ratingType, value) => {
    setFormData(prev => ({
      ...prev,
      [ratingType]: value
    }));
  };

  // 음식 항목 추가
  const handleAddFoodItem = () => {
    setFormData(prev => ({
      ...prev,
      foodItems: [...prev.foodItems, { name: '', price: '' }]
    }));
  };

  // 음식 이름 변경
  const handleFoodItemNameChange = (index, name) => {
    const newFoodItems = [...formData.foodItems];
    newFoodItems[index] = { ...newFoodItems[index], name };
    setFormData(prev => ({
      ...prev,
      foodItems: newFoodItems
    }));
  };

  // 음식 가격 변경
  const handleFoodItemPriceChange = (index, price) => {
    const newFoodItems = [...formData.foodItems];
    newFoodItems[index] = { ...newFoodItems[index], price };

    // 자동 총액 계산
    const calculatedTotal = calculateTotalPrice(newFoodItems);

    setFormData(prev => ({
      ...prev,
      foodItems: newFoodItems,
      totalPrice: calculatedTotal > 0 ? String(calculatedTotal) : prev.totalPrice
    }));
  };

  // 음식 항목 삭제
  const handleRemoveFoodItem = (index) => {
    const newFoodItems = formData.foodItems.filter((_, i) => i !== index);
    const finalFoodItems = newFoodItems.length > 0 ? newFoodItems : [{ name: '', price: '' }];

    // 자동 총액 재계산
    const calculatedTotal = calculateTotalPrice(finalFoodItems);

    setFormData(prev => ({
      ...prev,
      foodItems: finalFoodItems,
      totalPrice: calculatedTotal > 0 ? String(calculatedTotal) : prev.totalPrice
    }));
  };

  // 총액 자동 계산
  const calculateTotalPrice = (foodItems) => {
    return foodItems.reduce((total, item) => {
      const price = parseInt(item.price) || 0;
      return total + price;
    }, 0);
  };

  // 자동 계산된 총액 (표시용)
  const autoCalculatedTotal = calculateTotalPrice(formData.foodItems);

  // 가게 선택 핸들러 (자동완성에서 선택 시)
  const handleRestaurantSelect = (restaurant) => {
    setFormData(prev => ({
      ...prev,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantAddress: restaurant.address || restaurant.roadAddress || '',
      restaurantPhone: restaurant.phone || ''
    }));

    // 수정 모드에서 가게 변경 시 편집 모드 종료
    if (isEditMode) {
      setIsEditingRestaurant(false);
    }
  };

  // 가게명 변경 버튼 클릭
  const handleChangeRestaurant = () => {
    setShowChangeRestaurantConfirm(true);
  };

  // 가게명 변경 확인
  const handleConfirmChangeRestaurant = () => {
    setIsEditingRestaurant(true);
    setShowChangeRestaurantConfirm(false);
  };

  // 사진 촬영/선택
  const handleTakePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt // 카메라 또는 갤러리 선택
      });

      if (image.dataUrl) {
        // 이미지 압축
        const compressedImage = await compressImage(image.dataUrl, 1200, 0.8);

        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, compressedImage]
        }));
      }
    } catch (error) {
      console.error('사진 선택 실패:', error);
      showToast?.('사진 추가에 실패했습니다.');
    }
  };

  // 사진 삭제
  const handleRemovePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1단계: 가게명 확인
    if (!formData.restaurantName.trim()) {
      showToast?.('가게명을 입력해주세요.');

      // 가게명 입력 필드로 스크롤 (말풍선이 화면 상단에 보이도록)
      setTimeout(() => {
        const restaurantNameField = document.querySelector('#restaurantName');
        if (restaurantNameField) {
          // 부모 섹션을 기준으로 스크롤 (라벨과 입력필드가 함께 보이도록)
          const formSection = restaurantNameField.closest('.form-section');
          if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          // 포커스는 약간 지연시켜 스크롤 완료 후 실행
          setTimeout(() => {
            restaurantNameField.focus();
          }, 300);
        }
      }, 100);
      return;
    }

    // 2단계: 리뷰 내용 확인
    if (!formData.content.trim()) {
      showToast?.('리뷰 내용을 입력해주세요.');

      // 내용 섹션으로 스크롤
      setTimeout(() => {
        const contentSection = document.querySelector('.content-display-container');
        if (contentSection) {
          const formSection = contentSection.closest('.form-section');
          if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 100);
      return;
    }

    // 3단계: 별점 확인
    if (formData.rating === 0) {
      showToast?.('별점을 선택해주세요.');

      // 별점 섹션으로 스크롤
      setTimeout(() => {
        const ratingSection = document.querySelector('.detailed-rating-input');
        if (ratingSection) {
          // 별점 섹션 전체가 보이도록
          const formSection = ratingSection.closest('.form-section');
          if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          // 첫 번째 별 버튼에 포커스
          setTimeout(() => {
            const firstStarButton = ratingSection.querySelector('.star-button');
            if (firstStarButton) {
              firstStarButton.focus();
            }
          }, 300);
        }
      }, 100);
      return;
    }

    setLoading(true);

    try {
      // TODO: 실제 사용자 ID는 인증 시스템에서 가져와야 함
      // 임시로 'temp_user_id' 사용
      const userId = 'temp_user_id';

      if (isEditMode) {
        // 수정 모드
        await updateReview(reviewId, formData, userId);
        console.log('리뷰 수정 완료:', reviewId);
        onSaved('리뷰가 수정되었습니다!');
      } else {
        // 생성 모드
        const newReviewId = await createReview(formData, userId);
        console.log('리뷰 저장 완료:', newReviewId);
        onSaved('리뷰가 저장되었습니다!');
      }
    } catch (error) {
      console.error('리뷰 저장 실패:', error);
      showToast?.('리뷰 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-write-page">
      <header className="review-write-header">
        <h1>{isEditMode ? '리뷰 수정' : '리뷰 작성'}</h1>
      </header>

      <form className="review-write-form" onSubmit={handleSubmit} autoComplete="off">
        {/* 가게 정보 */}
        <section className="form-section">
          <h2>가게 정보</h2>

          {isEditMode && !isEditingRestaurant ? (
            // 수정 모드: 읽기 전용 표시
            <>
              <div className="form-group">
                <label htmlFor="restaurantName">
                  가게명 <span className="required">(필수)</span>
                </label>
                <div className="restaurant-display-row">
                  <div className="restaurant-name-display">
                    {formData.restaurantName}
                  </div>
                  <button
                    type="button"
                    className="change-restaurant-button"
                    onClick={handleChangeRestaurant}
                  >
                    변경
                  </button>
                </div>
              </div>

              <div className="form-group restaurant-info-compact">
                <label>주소</label>
                <div className="info-text">
                  {formData.restaurantAddress || '주소 정보 없음'}
                </div>
              </div>

              <div className="form-group restaurant-info-compact">
                <label>전화번호</label>
                <div className="info-text">
                  {formData.restaurantPhone || '전화번호 정보 없음'}
                </div>
              </div>
            </>
          ) : (
            // 생성 모드 또는 가게 변경 모드: 검색 가능
            <>
              <div className="form-group">
                <label htmlFor="restaurantName">
                  가게명 <span className="required">(필수)</span>
                </label>
                <RestaurantAutocomplete
                  onSelect={handleRestaurantSelect}
                  initialValue={formData.restaurantName}
                  showToast={showToast}
                />
                {isEditMode && isEditingRestaurant && (
                  <button
                    type="button"
                    className="cancel-change-button"
                    onClick={() => setIsEditingRestaurant(false)}
                  >
                    취소
                  </button>
                )}
              </div>

              <div className="form-group restaurant-info-compact">
                <label htmlFor="restaurantAddress">주소</label>
                <input
                  type="text"
                  id="restaurantAddress"
                  name="restaurantAddress"
                  value={formData.restaurantAddress}
                  readOnly
                  placeholder="가게를 선택하면 자동 입력됩니다"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    cursor: 'not-allowed',
                    flex: 1,
                    padding: '10px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div className="form-group restaurant-info-compact">
                <label htmlFor="restaurantPhone">전화번호</label>
                <input
                  type="tel"
                  id="restaurantPhone"
                  name="restaurantPhone"
                  value={formData.restaurantPhone}
                  readOnly
                  placeholder="가게를 선택하면 자동 입력됩니다"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    cursor: 'not-allowed',
                    flex: 1,
                    padding: '10px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '13px'
                  }}
                />
              </div>
            </>
          )}
        </section>

        {/* 리뷰 내용 */}
        <section className="form-section">
          <h2>리뷰 내용</h2>

          <div className="form-group">
            <label htmlFor="content">
              내용 <span className="required">(필수)</span>
            </label>
            <div
              className="content-display-container"
              onClick={() => setIsEditorOpen(true)}
              style={{ cursor: 'pointer' }}
            >
              {formData.content ? (
                <div
                  className="formatted-content-display-preview"
                  dangerouslySetInnerHTML={{ __html: renderFormattedContent(formData.content) }}
                />
              ) : (
                <div className="empty-content-placeholder-preview">
                  아직 작성된 내용이 없습니다.
                </div>
              )}
              <button
                type="button"
                className="open-editor-button"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('편집 버튼 클릭됨');
                  setIsEditorOpen(true);
                  console.log('isEditorOpen을 true로 설정함');
                }}
              >
                ✏️ 편집
              </button>
            </div>
          </div>
        </section>

        {/* 별점 */}
        <section className="form-section">
          <h2>별점</h2>

          <DetailedRatingInput
            label="종합 별점"
            value={formData.rating}
            onChange={(value) => handleRatingChange('rating', value)}
            required={true}
            showDetailLabel={false}
          />

          <DetailedRatingInput
            label="맛"
            value={formData.tasteRating}
            onChange={(value) => handleRatingChange('tasteRating', value)}
            required={false}
            showDetailLabel={false}
            isSubRating={true}
          />

          <DetailedRatingInput
            label="가격"
            value={formData.priceRating}
            onChange={(value) => handleRatingChange('priceRating', value)}
            required={false}
            showDetailLabel={false}
            isSubRating={true}
          />

          <DetailedRatingInput
            label="친절"
            value={formData.serviceRating}
            onChange={(value) => handleRatingChange('serviceRating', value)}
            required={false}
            showDetailLabel={false}
            isSubRating={true}
          />
        </section>

        {/* 주문 정보 */}
        <section className="form-section">
          <h2>주문 정보</h2>

          <div className="form-group">
            <label htmlFor="orderDate">주문 날짜</label>
            <input
              type="date"
              id="orderDate"
              name="orderDate"
              value={formData.orderDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>주문한 음식</label>
            {formData.foodItems.map((item, index) => (
              <div key={index} className="food-item-input-row">
                <input
                  type="text"
                  className="food-name-input"
                  value={item.name}
                  onChange={(e) => handleFoodItemNameChange(index, e.target.value)}
                  placeholder="메뉴명 (예: 양념치킨)"
                />
                <input
                  type="number"
                  className="food-price-input"
                  value={item.price}
                  onChange={(e) => handleFoodItemPriceChange(index, e.target.value)}
                  placeholder="원"
                />
                {formData.foodItems.length > 1 && (
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => handleRemoveFoodItem(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="add-button"
              onClick={handleAddFoodItem}
            >
              + 음식 추가
            </button>
          </div>

          <div className="form-group total-price-group">
            <label htmlFor="totalPrice">총 결제 금액 (원)</label>
            {autoCalculatedTotal > 0 && (
              <div className="auto-calculated-info">
                자동 계산: {autoCalculatedTotal.toLocaleString()}원
              </div>
            )}
            <input
              type="number"
              id="totalPrice"
              name="totalPrice"
              value={formData.totalPrice}
              onChange={handleChange}
              placeholder={autoCalculatedTotal > 0 ? "자동 계산됨" : "총 금액 입력 (예: 20000)"}
            />
            <div className="input-hint">
              {autoCalculatedTotal > 0
                ? "음식별 가격이 입력되어 자동 계산됩니다. 직접 수정도 가능합니다."
                : "음식별 가격을 입력하면 자동으로 계산됩니다."}
            </div>
          </div>
        </section>

        {/* 사진 - 임시 비활성화 (Storage 미설정) */}
        {false && (
        <section className="form-section">
          <h2>사진</h2>

          <div className="photo-section">
            <button
              type="button"
              className="photo-add-button"
              onClick={handleTakePhoto}
            >
              📷 사진 추가
            </button>

            {formData.photos.length > 0 && (
              <div className="photo-grid">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="photo-item">
                    <img src={photo} alt={`리뷰 사진 ${index + 1}`} />
                    <button
                      type="button"
                      className="photo-remove-button"
                      onClick={() => handleRemovePhoto(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        )}

        {/* 제출 버튼 */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={onBack}
            disabled={loading}
          >
            취소
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? '저장 중...' : isEditMode ? '수정하기' : '저장하기'}
          </button>
        </div>
      </form>

      {/* 리치 텍스트 에디터 모달 */}
      <RichTextEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        content={formData.content}
        onSave={handleContentSave}
        showToast={showToast}
        restaurantName={formData.restaurantName}
      />

      {/* 가게명 변경 확인 모달 */}
      {showChangeRestaurantConfirm && (
        <ConfirmModal
          title="가게명 변경"
          message={`가게명을 다시 검색할까요?\n주소와 전화번호도 함께 변경됩니다.`}
          icon=""
          confirmText="예"
          cancelText="아니오"
          onConfirm={handleConfirmChangeRestaurant}
          onCancel={() => setShowChangeRestaurantConfirm(false)}
        />
      )}
    </div>
  );
};

export default ReviewWrite;
