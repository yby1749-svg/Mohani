import { Expense } from '../context/ExpenseContext';

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface CategorySuggestion {
  category: Category;
  confidence: number; // 0-100
  reason: 'keyword' | 'history' | 'amount';
}

// Korean keyword mappings for each category
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: [
    '점심', '저녁', '아침', '밥', '식사', '배달', '치킨', '피자', '햄버거', '라면',
    '국밥', '김밥', '떡볶이', '분식', '중식', '일식', '한식', '양식', '고기', '삼겹살',
    '회', '초밥', '돈까스', '짜장면', '짬뽕', '냉면', '비빔밥', '불고기', '갈비',
    '순대', '족발', '보쌈', '곱창', '마라탕', '쌀국수', '우동', '소바', '규동',
    '카레', '스테이크', '파스타', '리조또', '샐러드', '도시락', '편의점', 'GS25', 'CU', '세븐일레븐',
    '이마트24', '미니스톱', '식당', '맛집', '음식', '먹방', '야식', '간식', '과자',
    '빵', '베이커리', '떡', '빵집', '제과', '마트', '장보기', '식료품',
  ],
  transport: [
    '지하철', '버스', '택시', '카카오택시', '타다', '우버', 'KTX', 'SRT', '기차',
    '고속버스', '시외버스', '비행기', '항공', '대중교통', '교통카드', '티머니', '캐시비',
    '주유', '기름', '주유소', 'SK', 'GS칼텍스', '현대오일뱅크', 'S-OIL', '에쓰오일',
    '주차', '주차장', '톨게이트', '하이패스', '고속도로', '렌트카', '카셰어링', '쏘카', '그린카',
    '따릉이', '킥보드', '씽씽', '라임', '빔', '자전거', '오토바이', '배', '페리',
    '출퇴근', '등하교', '이동', '교통비',
  ],
  shopping: [
    '쇼핑', '옷', '의류', '신발', '가방', '악세사리', '액세서리', '화장품', '뷰티',
    '스킨케어', '메이크업', '향수', '백화점', '아울렛', '면세점', '쿠팡', '11번가',
    'G마켓', '옥션', '위메프', '티몬', '인터파크', '무신사', '지그재그', '에이블리',
    '브랜디', '하이버', '올리브영', '세포라', '롭스', '가구', '인테리어', '이케아',
    '가전', '전자제품', '핸드폰', '노트북', '태블릿', '애플', '삼성', 'LG',
    '다이소', '아트박스', '문구', '선물', '기프트', '생일선물', '크리스마스',
  ],
  entertainment: [
    '영화', 'CGV', '메가박스', '롯데시네마', '넷플릭스', '왓챠', '디즈니플러스', '웨이브',
    '유튜브', '프리미엄', '게임', '스팀', '플스', 'PS5', '닌텐도', '스위치', 'PC방',
    '노래방', '코인노래방', '볼링', '당구', '탁구', '클럽', '바', '술집', '호프',
    '콘서트', '공연', '뮤지컬', '연극', '전시', '박물관', '미술관', '놀이공원',
    '에버랜드', '롯데월드', '테마파크', '워터파크', '캐리비안베이', '여행', '호텔',
    '펜션', '리조트', '에어비앤비', '야구', '축구', '농구', '스포츠', '헬스',
    '요가', '필라테스', '수영', '골프', '테니스', '등산', '캠핑', '낚시',
    '취미', '레저', '오락', '놀이', '데이트',
  ],
  cafe: [
    '커피', '카페', '스타벅스', '투썸', '투썸플레이스', '이디야', '메가커피', '컴포즈',
    '빽다방', '할리스', '탐앤탐스', '폴바셋', '블루보틀', '커피빈', '엔제리너스',
    '파스쿠찌', '카페베네', '아메리카노', '라떼', '카푸치노', '에스프레소', '콜드브루',
    '아이스커피', '프라푸치노', '스무디', '에이드', '차', '녹차', '홍차', '밀크티',
    '버블티', '공차', '타이거슈가', '디저트', '케이크', '마카롱', '와플', '크로플',
    '베이글', '샌드위치', '브런치', '티타임', '카공', '스터디카페',
  ],
  health: [
    '병원', '의원', '클리닉', '치과', '안과', '피부과', '정형외과', '내과', '이비인후과',
    '산부인과', '비뇨기과', '정신과', '신경과', '외과', '성형외과', '한의원', '한방',
    '약국', '약', '영양제', '비타민', '유산균', '오메가3', '건강기능식품', '헬스케어',
    '진료', '검진', '건강검진', '예방접종', '코로나', 'PCR', '백신', '치료',
    '수술', '입원', '보험', '실비', '의료비', '마사지', '스파', '찜질방', '사우나',
    '헬스장', '피트니스', 'PT', '개인트레이닝', '다이어트', '체중관리',
  ],
  bills: [
    '공과금', '전기', '전기세', '수도', '수도세', '가스', '가스비', '난방', '난방비',
    '관리비', '아파트', '월세', '전세', '임대료', '보증금', '인터넷', 'KT', 'SKT', 'LG유플러스',
    '통신비', '핸드폰요금', '휴대폰', '유선전화', 'TV', '케이블', 'IPTV', '넷플릭스',
    '구독', '멤버십', '보험료', '자동차보험', '생명보험', '건강보험', '국민연금',
    '세금', '소득세', '재산세', '자동차세', '등록금', '학원비', '교육비', '과외',
  ],
};

// Amount-based category hints (typical expense ranges in KRW)
const AMOUNT_HINTS: Record<string, { min: number; max: number }[]> = {
  cafe: [{ min: 3000, max: 15000 }],
  food: [{ min: 5000, max: 50000 }],
  transport: [{ min: 1000, max: 5000 }, { min: 30000, max: 100000 }], // subway/bus or taxi/train
  entertainment: [{ min: 10000, max: 200000 }],
  shopping: [{ min: 10000, max: 500000 }],
  health: [{ min: 5000, max: 300000 }],
  bills: [{ min: 30000, max: 500000 }],
};

/**
 * Suggests categories based on note text using keyword matching
 */
export function suggestFromKeywords(
  noteText: string,
  categories: Category[]
): CategorySuggestion[] {
  if (!noteText || noteText.trim().length < 2) return [];

  const lowerNote = noteText.toLowerCase().trim();
  const suggestions: CategorySuggestion[] = [];

  for (const category of categories) {
    const keywords = CATEGORY_KEYWORDS[category.id] || [];
    let matchScore = 0;
    let matchedKeyword = '';

    for (const keyword of keywords) {
      if (lowerNote.includes(keyword.toLowerCase())) {
        // Longer keyword matches get higher scores
        const score = keyword.length * 10;
        if (score > matchScore) {
          matchScore = score;
          matchedKeyword = keyword;
        }
      }
    }

    if (matchScore > 0) {
      suggestions.push({
        category,
        confidence: Math.min(matchScore, 100),
        reason: 'keyword',
      });
    }
  }

  // Sort by confidence descending
  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

/**
 * Suggests categories based on user's past expense history
 */
export function suggestFromHistory(
  noteText: string,
  expenses: Expense[],
  categories: Category[]
): CategorySuggestion[] {
  if (!noteText || noteText.trim().length < 2) return [];

  const lowerNote = noteText.toLowerCase().trim();
  const suggestions: CategorySuggestion[] = [];

  // Build a map of note patterns to categories from history
  const notePatterns: Record<string, Record<string, number>> = {};

  for (const expense of expenses) {
    if (!expense.note) continue;
    const expenseNote = expense.note.toLowerCase().trim();

    // Skip if notes are too different in length
    if (Math.abs(expenseNote.length - lowerNote.length) > 10) continue;

    // Check for similar notes (contains or is contained by)
    if (expenseNote.includes(lowerNote) || lowerNote.includes(expenseNote)) {
      if (!notePatterns[expense.category]) {
        notePatterns[expense.category] = {};
      }
      notePatterns[expense.category][expenseNote] =
        (notePatterns[expense.category][expenseNote] || 0) + 1;
    }
  }

  // Calculate suggestions from patterns
  for (const [categoryId, patterns] of Object.entries(notePatterns)) {
    const totalMatches = Object.values(patterns).reduce((sum, count) => sum + count, 0);
    const category = categories.find((c) => c.id === categoryId);

    if (category && totalMatches > 0) {
      suggestions.push({
        category,
        confidence: Math.min(totalMatches * 25, 100),
        reason: 'history',
      });
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 2);
}

/**
 * Suggests categories based on expense amount
 */
export function suggestFromAmount(
  amount: number,
  categories: Category[]
): CategorySuggestion[] {
  if (!amount || amount <= 0) return [];

  const suggestions: CategorySuggestion[] = [];

  for (const [categoryId, ranges] of Object.entries(AMOUNT_HINTS)) {
    for (const range of ranges) {
      if (amount >= range.min && amount <= range.max) {
        const category = categories.find((c) => c.id === categoryId);
        if (category) {
          // Calculate confidence based on how close to middle of range
          const mid = (range.min + range.max) / 2;
          const distance = Math.abs(amount - mid) / (range.max - range.min);
          const confidence = Math.round((1 - distance) * 50); // Max 50 for amount-based

          suggestions.push({
            category,
            confidence,
            reason: 'amount',
          });
        }
        break;
      }
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 2);
}

/**
 * Main function to get combined category suggestions
 */
export function getCategorySuggestions(
  noteText: string,
  amount: number,
  expenses: Expense[],
  categories: Category[]
): CategorySuggestion[] {
  // Get suggestions from all sources
  const keywordSuggestions = suggestFromKeywords(noteText, categories);
  const historySuggestions = suggestFromHistory(noteText, expenses, categories);
  const amountSuggestions = suggestFromAmount(amount, categories);

  // Merge suggestions, combining confidence for same categories
  const merged: Record<string, CategorySuggestion> = {};

  for (const suggestion of [...keywordSuggestions, ...historySuggestions, ...amountSuggestions]) {
    const id = suggestion.category.id;
    if (merged[id]) {
      // Combine confidences with weighted average (keyword > history > amount)
      const weight = suggestion.reason === 'keyword' ? 1.5 : suggestion.reason === 'history' ? 1.2 : 1;
      merged[id].confidence = Math.min(
        Math.round(merged[id].confidence + suggestion.confidence * weight),
        100
      );
    } else {
      merged[id] = { ...suggestion };
    }
  }

  // Convert back to array and sort
  return Object.values(merged)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}
