/**
 * 리뷰 데이터 타입 정의
 */

/**
 * @typedef {Object} Review
 * @property {string} id - 리뷰 고유 ID
 * @property {string} userId - 작성자 ID
 * @property {string} [restaurantId] - 카카오맵 가게 ID (고유값, 공개 시 가게별 그룹화)
 * @property {string} restaurantName - 가게명
 * @property {string} [restaurantAddress] - 가게 주소 (선택)
 * @property {string} [restaurantPhone] - 가게 전화번호 (선택)
 * @property {number} rating - 종합 별점 (1.00-5.00, 소수점 둘째자리)
 * @property {number} [tasteRating] - 맛 별점 (1.00-5.00, 선택)
 * @property {number} [priceRating] - 가격 별점 (1.00-5.00, 선택)
 * @property {number} [serviceRating] - 친절 별점 (1.00-5.00, 선택)
 * @property {string} [title] - 리뷰 제목 (선택)
 * @property {string} content - 리뷰 내용
 * @property {string[]} photos - 사진 URL 배열
 * @property {string[]} [foodItems] - 주문한 음식 목록 (선택)
 * @property {number} [price] - 가격 (선택)
 * @property {Date} orderDate - 주문 날짜
 * @property {boolean} isPublic - 공개 여부 (false: 비공개/개인용, true: 공개/커뮤니티)
 * @property {Date} createdAt - 작성 일시
 * @property {Date} updatedAt - 수정 일시
 * @property {Date} [publishableAfter] - 공개 가능 일시 (타임캡슐)
 *
 * // 커뮤니티 기능 (추후 구현)
 * @property {string} [anonymousId] - 익명 ID (공개 시)
 * @property {number} [views] - 조회수 (공개 시)
 * @property {number} [likes] - 좋아요 수 (공개 시)
 * @property {number} [reportCount] - 신고 횟수 (공개 시)
 * @property {boolean} [isBlinded] - 블라인드 여부 (공개 시)
 * @property {number} [trustScore] - 신뢰도 점수 (공개 시)
 * @property {boolean} [isVerified] - 주문 인증 여부 (공개 시)
 */

/**
 * 리뷰 필터 옵션
 * @typedef {Object} ReviewFilter
 * @property {string} [searchQuery] - 검색어 (가게명, 음식명)
 * @property {number} [minRating] - 최소 별점
 * @property {number} [maxRating] - 최대 별점
 * @property {Date} [startDate] - 시작 날짜
 * @property {Date} [endDate] - 종료 날짜
 * @property {boolean} [hasPhotos] - 사진 포함 여부
 */

/**
 * 리뷰 정렬 옵션
 * @typedef {'latest' | 'oldest' | 'rating-high' | 'rating-low' | 'name-asc' | 'name-desc'} ReviewSortOption
 */

export const REVIEW_SORT_OPTIONS = {
  LATEST: 'latest',
  OLDEST: 'oldest',
  RATING_HIGH: 'rating-high',
  RATING_LOW: 'rating-low',
  NAME_ASC: 'name-asc',
  NAME_DESC: 'name-desc'
};

export const RATING_VALUES = [1, 2, 3, 4, 5];

/**
 * 새 리뷰 생성을 위한 초기 데이터
 * @returns {Partial<Review>}
 */
export const createEmptyReview = () => ({
  restaurantName: '',
  restaurantAddress: '',
  restaurantPhone: '',
  rating: 0,
  title: '',
  content: '',
  photos: [],
  foodItems: [],
  price: null,
  orderDate: new Date(),
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date()
});
