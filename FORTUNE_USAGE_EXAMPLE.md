# 운세 시스템 전체 가이드

## 📚 개요

MindFlow 앱에는 **3가지 독립된 점술 시스템**이 구현되어 있습니다:
1. **사주/오늘의 운세** - 출생 정보 기반 (345개 문장)
2. **별자리 운세** - 12개 별자리별 운세 (240개 문장)
3. **타로 카드** - 78장 타로 카드 정/역방향 (156개 해석)

## 📁 전체 파일 구조

```
my-mindflow-app/
├── public/
│   └── fortune_data/
│       ├── Tarot.csv              ✅ 타로 카드 156장 (정/역방향)
│       └── horoscope.csv          ✅ 별자리 운세 240개 (12별자리)
├── src/
│   ├── data/
│   │   └── fortune_database.json ✅ 사주 운세 345개 (6카테고리)
│   ├── utils/
│   │   └── fortuneSelector.js    # 사주 운세 선택 유틸리티
│   └── components/
│       └── FortuneDisplay.jsx    # 사주 운세 표시 컴포넌트 (예시)
└── fortune_database.csv          # 사주 원본 CSV
```

### 각 시스템별 데이터 구조

**1. 사주/오늘의 운세** (`src/data/fortune_database.json`)
- 형식: JSON
- 구조: `{ Category: { Keyword: [문장들...] } }`
- 총 345개 문장 (6개 카테고리)

**2. 별자리 운세** (`public/fortune_data/horoscope.csv`)
- 형식: CSV (세미콜론 구분)
- 구조: `Category;ID;Keyword;Content;Image_File`
- 총 240개 문장 (12개 별자리)

**3. 타로 카드** (`public/fortune_data/Tarot.csv`)
- 형식: CSV (세미콜론 구분)
- 구조: `Category;ID;Keyword;Content;Image_File`
- 총 156개 해석 (78장 × 정/역방향)

---

# 📖 Part 1: 사주/오늘의 운세 시스템

## 🎯 사용 방법

### 1. 기본 사용법 (사주)

```javascript
import { getTodayFortune } from './utils/fortuneSelector';

// 사주 계산 결과 (예시)
const sajuResult = {
    main: '좋음',
    money: '재물상승',
    love: '관계발전',
    health: '건강좋음',
    advice: '조언강조',
    lucky: '행운좋음'
};

// 오늘의 운세 생성
const fortune = getTodayFortune(sajuResult);

console.log(fortune.main);   // "오늘은 전반적으로 좋은 하루가 될 것입니다..."
console.log(fortune.money);  // "오늘은 금전운이 상승하는 날입니다..."
console.log(fortune.love);   // "오늘은 연인과의 관계가 한 단계 더..."
```

### 2. 개별 카테고리 사용

```javascript
import { getRandomFortune } from './utils/fortuneSelector';

// 특정 카테고리만 가져오기
const mainFortune = getRandomFortune('Main', '매우좋음');
const moneyFortune = getRandomFortune('Money', '재물상승');
```

### 3. React 컴포넌트에서 사용

```javascript
import React from 'react';
import FortuneDisplay from './components/FortuneDisplay';

function SajuResultPage() {
    // 사주 계산 로직... (실제 계산 결과)
    const sajuResult = {
        main: '좋음',
        money: '현상유지',
        love: '애정최고',
        health: '활력넘침',
        advice: '실행권유',
        lucky: '행운최고'
    };

    return (
        <div>
            <h1>사주 계산 완료</h1>

            {/* 운세 표시 */}
            <FortuneDisplay sajuResult={sajuResult} />
        </div>
    );
}
```

## 📊 카테고리 및 키워드

### 카테고리별 키워드 목록

| 카테고리 | 영문 코드 | 아이콘 | 사용 가능한 키워드 | 문장 수 |
|---------|----------|--------|------------------|---------|
| 메인 운세 | Main | 🌟 | 매우좋음, 좋음, 보통, 주의 | 60 (각 15개) |
| 재물운 | Money | 💰 | 재물상승, 현상유지, 지출주의, 재정악화 | 60 (각 15개) |
| 애정운 | Love | ❤️ | 애정최고, 관계발전, 소강상태, 다툼주의 | 60 (각 15개) |
| 건강운 | Health | 🏥 | 건강좋음, 활력넘침, 피로누적, 질병주의 | 60 (각 15개) |
| 조언 | Advice | 💡 | 조언강조, 신중요함, 실행권유 | 45 (각 15개) |
| 행운 요소 | Lucky | 🍀 | 행운최고, 행운좋음, 행운보통, 행운주의 | 60 (각 15개) |

**총 345개 문장**

## 🔧 유틸리티 함수 API

### `getRandomFortune(category, keyword)`

특정 카테고리와 키워드에 해당하는 운세 문장을 랜덤으로 선택합니다.

**Parameters:**
- `category` (string): 카테고리 ('Main', 'Money', 'Love', 'Health', 'Advice', 'Lucky')
- `keyword` (string): 키워드 (예: '매우좋음', '재물상승' 등)

**Returns:**
- `string`: 랜덤으로 선택된 운세 문장

**Example:**
```javascript
const fortune = getRandomFortune('Main', '좋음');
// "오늘은 전반적으로 좋은 하루가 될 것입니다..."
```

### `getTodayFortune(sajuResult)`

사주 계산 결과를 받아 모든 카테고리의 운세 문장을 생성합니다.

**Parameters:**
- `sajuResult` (Object): 사주 계산 결과 객체
  - `main` (string): 메인 운세 키워드
  - `money` (string): 재물운 키워드
  - `love` (string): 애정운 키워드
  - `health` (string): 건강운 키워드
  - `advice` (string): 조언 키워드
  - `lucky` (string): 행운 요소 키워드

**Returns:**
- `Object`: 각 카테고리별 운세 문장
  ```javascript
  {
      main: "...",
      money: "...",
      love: "...",
      health: "...",
      advice: "...",
      lucky: "..."
  }
  ```

## 🎨 스타일링 가이드

### 키워드별 추천 색상

```javascript
// 긍정적인 키워드 (초록색 계열)
const POSITIVE_KEYWORDS = [
    '매우좋음', '좋음', '재물상승', '애정최고',
    '관계발전', '건강좋음', '활력넘침', '행운최고', '행운좋음'
];
// 색상: #4CAF50

// 중립적인 키워드 (파란색 계열)
const NEUTRAL_KEYWORDS = [
    '보통', '현상유지', '소강상태', '피로누적',
    '조언강조', '신중요함', '행운보통'
];
// 색상: #2196F3

// 주의 키워드 (주황색/빨간색 계열)
const WARNING_KEYWORDS = [
    '주의', '지출주의', '재정악화', '다툼주의',
    '질병주의', '실행권유', '행운주의'
];
// 색상: #FF9800 또는 #F44336
```

---

# 📖 Part 2: 별자리 운세 시스템

## 📊 별자리 운세 데이터

**파일 위치**: `public/fortune_data/horoscope.csv`

### 데이터 구조
```csv
Category;ID;Keyword;Content;Image_File
Horoscope;H_AR_001;활력 상승;오늘 양자리는 평소보다...;horoscope_aries.png
```

### 12개 별자리
- 양자리 (Aries) - 3/21~4/19
- 황소자리 (Taurus) - 4/20~5/20
- 쌍둥이자리 (Gemini) - 5/21~6/21
- 게자리 (Cancer) - 6/22~7/22
- 사자자리 (Leo) - 7/23~8/22
- 처녀자리 (Virgo) - 8/23~9/22
- 천칭자리 (Libra) - 9/23~10/22
- 전갈자리 (Scorpio) - 10/23~11/22
- 사수자리 (Sagittarius) - 11/23~12/21
- 염소자리 (Capricorn) - 12/22~1/19
- 물병자리 (Aquarius) - 1/20~2/18
- 물고기자리 (Pisces) - 2/19~3/20

### 별자리별 키워드 (각 별자리당 20개)
- 활력 상승
- 인간관계 강화
- 재물운 주의
- 건강 관리
- 등 총 240개 문장

### 사용 예시 (별자리)
```javascript
// CSV 파일 로드
fetch('/fortune_data/horoscope.csv')
  .then(response => response.text())
  .then(data => {
    // 세미콜론으로 파싱
    const lines = data.split('\n');
    // 별자리별 필터링
    const ariesFortunes = lines.filter(line =>
      line.includes('H_AR_')
    );
    // 랜덤 선택
    const randomFortune = ariesFortunes[
      Math.floor(Math.random() * ariesFortunes.length)
    ];
  });
```

---

# 📖 Part 3: 타로 카드 시스템

## 🔮 타로 카드 데이터

**파일 위치**: `public/fortune_data/Tarot.csv`

### 데이터 구조
```csv
Category;ID;Keyword;Content;Image_File
Tarot;T001;바보;새로운 시작, 자유, 무한한 가능성을...;major_00.jpg
Tarot;T002;바보 역방향;미성숙함, 무모함, 책임감 부족을...;major_00.jpg
```

### 타로 카드 구성
**메이저 아르카나 (22장 × 2 = 44개)**
- 0. 바보 (The Fool)
- 1. 마법사 (The Magician)
- 2. 여사제 (The High Priestess)
- ... (총 22장)

**마이너 아르카나 (56장 × 2 = 112개)**
- 완드 (Wands) 14장
- 컵 (Cups) 14장
- 소드 (Swords) 14장
- 펜타클 (Pentacles) 14장

### 정방향 vs 역방향
각 카드는 **정방향**과 **역방향** 두 가지 해석이 있습니다.
- 정방향: 긍정적/본래의 의미
- 역방향: 부정적/반대의 의미

### 사용 예시 (타로)
```javascript
// CSV 파일 로드
fetch('/fortune_data/Tarot.csv')
  .then(response => response.text())
  .then(data => {
    const lines = data.split('\n').slice(1); // 헤더 제외

    // 랜덤 카드 선택 (정/역방향 포함)
    const randomCard = lines[
      Math.floor(Math.random() * lines.length)
    ];

    // 세미콜론으로 파싱
    const [category, id, keyword, content, imageFile] =
      randomCard.split(';');

    console.log(`선택된 카드: ${keyword}`);
    console.log(`의미: ${content}`);
  });
```

---

# 🔄 3가지 시스템 비교

| 구분 | 사주/오늘의 운세 | 별자리 운세 | 타로 카드 |
|-----|-----------------|------------|----------|
| **파일 위치** | `src/data/fortune_database.json` | `public/fortune_data/horoscope.csv` | `public/fortune_data/Tarot.csv` |
| **데이터 형식** | JSON | CSV (세미콜론) | CSV (세미콜론) |
| **총 데이터 수** | 345개 | 240개 | 156개 |
| **기반 정보** | 출생 정보 + 날짜 | 출생 월일 (별자리) | 랜덤 선택 |
| **카테고리** | 6개 (메인, 재물 등) | 12개 (별자리) | 78장 (정/역방향) |
| **사용 방식** | 사주 계산 → 키워드 매칭 | 별자리 판별 → 랜덤 선택 | 랜덤 카드 뽑기 |
| **이미지** | ❌ 없음 | ✅ 별자리별 이미지 | ✅ 카드별 이미지 |
| **구현 상태** | ✅ 완료 | ✅ 완료 | ✅ 완료 |

## 💡 실제 통합 예시

```javascript
// 1. 사주 계산 (기존 로직)
const calculateSaju = (birthInfo) => {
    // ... 사주 계산 로직 ...

    // 계산 결과를 키워드로 매핑
    return {
        main: determinMainFortune(사주결과),      // '좋음'
        money: determinMoneyFortune(사주결과),    // '재물상승'
        love: determinLoveFortune(사주결과),      // '관계발전'
        health: determinHealthFortune(사주결과),  // '건강좋음'
        advice: determinAdvice(사주결과),         // '조언강조'
        lucky: determinLucky(사주결과)            // '행운좋음'
    };
};

// 2. 운세 문장 생성
const sajuResult = calculateSaju(userBirthInfo);
const fortune = getTodayFortune(sajuResult);

// 3. 화면에 표시
<FortuneDisplay sajuResult={sajuResult} />
```

---

# 🚀 구현 현황 및 다음 단계

## ✅ 완료된 작업

### 사주/오늘의 운세
- ✅ CSV 데이터 생성 (345개 문장)
- ✅ CSV → JSON 변환
- ✅ 유틸리티 함수 작성 (`fortuneSelector.js`)
- ✅ 예시 컴포넌트 작성 (`FortuneDisplay.jsx`)

### 별자리 운세
- ✅ CSV 데이터 생성 (240개 문장)
- ✅ 12개 별자리별 20가지 운세
- ✅ 이미지 파일 매핑

### 타로 카드
- ✅ CSV 데이터 생성 (156개 해석)
- ✅ 78장 카드 정/역방향
- ✅ 이미지 파일 매핑

## ⏳ 다음 작업

### 사주 시스템
1. 실제 사주 계산 로직과 통합
2. 키워드 매핑 로직 구현 (계산 결과 → 키워드)
3. UI/UX 디자인 적용

### 별자리 시스템
1. 별자리 판별 로직 (생년월일 → 별자리)
2. CSV 파싱 유틸리티 함수
3. UI/UX 디자인 적용

### 타로 시스템
1. 랜덤 카드 선택 로직
2. 카드 뒤집기 애니메이션
3. 정/역방향 판정 로직
4. UI/UX 디자인 적용

---

# 📝 주의사항

## 공통 사항
- **3가지 시스템은 완전히 독립적**으로 작동합니다.
- 각 시스템은 **다른 입력 정보**를 사용합니다:
  - 사주: 생년월일시 + 출생지
  - 별자리: 생년월일
  - 타로: 랜덤 (입력 정보 없음)

## 사주 시스템
- 매번 **랜덤으로** 문장이 선택됩니다.
- 각 키워드당 **15개의 문장**이 준비되어 있습니다.
- JSON 파일 크기: 약 **100KB** (매우 가벼움)

## 별자리 시스템
- CSV 파일이므로 **세미콜론(;)으로 파싱**해야 합니다.
- 각 별자리당 **20개의 다양한 상황**이 준비되어 있습니다.
- 이미지 파일명: `horoscope_{별자리영문}.png`

## 타로 시스템
- CSV 파일이므로 **세미콜론(;)으로 파싱**해야 합니다.
- **정방향/역방향**을 랜덤으로 결정해야 합니다.
- 이미지 파일명: `major_{번호}.jpg` 또는 `{suit}_{번호}.jpg`

---

# 📞 문의 및 참고

이 문서는 MindFlow 앱의 3가지 점술 시스템에 대한 전체 가이드입니다.
각 시스템은 독립적으로 작동하며, 필요에 따라 개별적으로 통합하거나 활용할 수 있습니다.

**총 데이터**: 345 (사주) + 240 (별자리) + 156 (타로) = **741개의 운세 콘텐츠** 🎉
