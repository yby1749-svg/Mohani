import * as FileSystem from 'expo-file-system';

export interface ExtractedReceiptData {
  amount: number | null;
  merchantName: string | null;
  date: Date | null;
  category: string | null;
  categoryLabel: string | null;
  categoryIcon: string | null;
  items: string[];
  rawText: string;
  confidence: number;
}

export interface OCRResult {
  success: boolean;
  data: ExtractedReceiptData | null;
  error: string | null;
}

// Category mapping based on merchant keywords
const CATEGORY_KEYWORDS: Record<string, { category: string; label: string; icon: string; keywords: string[] }> = {
  food: {
    category: 'food',
    label: '식비',
    icon: '🍽️',
    keywords: ['식당', '레스토랑', '음식', '치킨', '피자', '햄버거', '국밥', '김밥', '분식', '중국집', '일식', '한식', '양식', '배달', '요기요', '배민', '쿠팡이츠'],
  },
  cafe: {
    category: 'cafe',
    label: '카페',
    icon: '☕',
    keywords: ['스타벅스', '커피', '카페', '투썸', '이디야', '할리스', '빽다방', '메가커피', '컴포즈', '더벤티', 'cafe', 'coffee', '베이커리', '빵'],
  },
  transport: {
    category: 'transport',
    label: '교통',
    icon: '🚌',
    keywords: ['택시', '버스', '지하철', '주유소', 'GS칼텍스', 'SK에너지', '현대오일', 'S-OIL', '주유', '충전', '카카오T', '우버', '타다'],
  },
  shopping: {
    category: 'shopping',
    label: '쇼핑',
    icon: '🛍️',
    keywords: ['마트', '이마트', '홈플러스', '롯데마트', '코스트코', 'GS25', 'CU', '세븐일레븐', '편의점', '올리브영', '다이소', '쿠팡', '11번가', '옥션', 'G마켓'],
  },
  entertainment: {
    category: 'entertainment',
    label: '여가',
    icon: '🎬',
    keywords: ['CGV', '롯데시네마', '메가박스', '영화', '노래방', '볼링', '당구', 'PC방', '게임', '넷플릭스', '왓챠', '유튜브'],
  },
  health: {
    category: 'health',
    label: '건강',
    icon: '💊',
    keywords: ['약국', '병원', '의원', '클리닉', '치과', '피부과', '안과', '정형외과', '건강', '헬스', '필라테스', '요가'],
  },
  bills: {
    category: 'bills',
    label: '공과금',
    icon: '📄',
    keywords: ['전기', '가스', '수도', '통신', 'KT', 'SKT', 'LG유플러스', '인터넷', '관리비'],
  },
};

/**
 * Extract amount from Korean receipt text
 */
function extractAmount(text: string): number | null {
  // Common Korean receipt amount patterns
  const patterns = [
    // 합계, 총액, 결제금액 followed by amount
    /(?:합\s*계|총\s*액|총\s*금\s*액|결\s*제\s*금\s*액|받을\s*금액|판매\s*금액|거래\s*금액)[:\s]*[₩￦]?\s*([\d,]+)/gi,
    // Amount followed by 원
    /[₩￦]\s*([\d,]+)\s*원?/g,
    // Amount with 원 suffix
    /([\d,]{3,})\s*원/g,
    // Card payment patterns
    /(?:카드|신용|체크)\s*[:\s]*([\d,]+)/gi,
    // Just large numbers (fallback)
    /\b([\d,]{4,})\b/g,
  ];

  const amounts: number[] = [];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseInt(amountStr, 10);
      if (amount >= 100 && amount <= 10000000) { // Reasonable range for Korean Won
        amounts.push(amount);
      }
    }
  }

  if (amounts.length === 0) return null;

  // Return the largest amount (usually the total)
  return Math.max(...amounts);
}

/**
 * Extract date from receipt text
 */
function extractDate(text: string): Date | null {
  const patterns = [
    // YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
    /(\d{4})[-./](\d{1,2})[-./](\d{1,2})/,
    // YY-MM-DD or YY/MM/DD or YY.MM.DD
    /(\d{2})[-./](\d{1,2})[-./](\d{1,2})/,
    // Korean date format: YYYY년 MM월 DD일
    /(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/,
    // MM/DD/YYYY (US format sometimes used)
    /(\d{1,2})[-./](\d{1,2})[-./](\d{4})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let year: number, month: number, day: number;

      if (pattern.source.includes('년')) {
        // Korean format
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        day = parseInt(match[3], 10);
      } else if (match[1].length === 4) {
        // YYYY-MM-DD
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        day = parseInt(match[3], 10);
      } else if (match[3].length === 4) {
        // MM/DD/YYYY
        year = parseInt(match[3], 10);
        month = parseInt(match[1], 10) - 1;
        day = parseInt(match[2], 10);
      } else {
        // YY-MM-DD
        year = 2000 + parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        day = parseInt(match[3], 10);
      }

      const date = new Date(year, month, day);
      if (!isNaN(date.getTime()) && date <= new Date()) {
        return date;
      }
    }
  }

  return null;
}

/**
 * Extract merchant name from receipt text
 */
function extractMerchantName(text: string): string | null {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // First few lines often contain merchant name
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];

    // Skip lines that look like addresses, phone numbers, or amounts
    if (/^\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4}$/.test(line)) continue; // Phone
    if (/[₩￦]|원|합계|총액/.test(line)) continue; // Amount
    if (/^\d+$/.test(line)) continue; // Just numbers
    if (line.length < 2 || line.length > 30) continue; // Too short or too long

    // Likely a business name
    if (line.length >= 2) {
      return line.replace(/[^\w가-힣\s]/g, '').trim();
    }
  }

  return null;
}

/**
 * Detect category based on merchant name and receipt content
 */
function detectCategory(text: string, merchantName: string | null): { category: string; label: string; icon: string } | null {
  const searchText = `${text} ${merchantName || ''}`.toLowerCase();

  for (const [key, info] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of info.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return {
          category: info.category,
          label: info.label,
          icon: info.icon,
        };
      }
    }
  }

  return null;
}

/**
 * Extract item names from receipt
 */
function extractItems(text: string): string[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const items: string[] = [];

  for (const line of lines) {
    // Skip header/footer lines
    if (/합계|총액|결제|카드|현금|거스름|부가세|VAT|사업자|전화|주소|영수증/.test(line)) continue;

    // Lines with item name and price
    const itemMatch = line.match(/^(.+?)\s+[\d,]+\s*원?$/);
    if (itemMatch && itemMatch[1].length >= 2 && itemMatch[1].length <= 30) {
      items.push(itemMatch[1].trim());
    }
  }

  return items.slice(0, 10); // Limit to 10 items
}

/**
 * Call OCR API to extract text from image
 */
async function callOCRAPI(imageUri: string): Promise<string> {
  try {
    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Use OCR.space free API (limited to 25,000 calls/month)
    // For production, consider Google Cloud Vision or AWS Textract
    const formData = new FormData();
    formData.append('base64Image', `data:image/jpeg;base64,${base64}`);
    formData.append('language', 'kor'); // Korean
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Engine 2 is better for Asian languages

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': 'K83918329688957', // Free API key (limited usage)
      },
      body: formData,
    });

    const result = await response.json();

    if (result.IsErroredOnProcessing) {
      throw new Error(result.ErrorMessage?.[0] || 'OCR processing failed');
    }

    const parsedText = result.ParsedResults?.[0]?.ParsedText || '';
    return parsedText;
  } catch (error) {
    console.error('OCR API error:', error);
    throw error;
  }
}

/**
 * Main function to process receipt image
 */
export async function processReceiptImage(imageUri: string): Promise<OCRResult> {
  try {
    // Call OCR API
    const rawText = await callOCRAPI(imageUri);

    if (!rawText || rawText.trim().length === 0) {
      return {
        success: false,
        data: null,
        error: '영수증에서 텍스트를 인식할 수 없습니다.',
      };
    }

    // Extract data from OCR text
    const amount = extractAmount(rawText);
    const date = extractDate(rawText);
    const merchantName = extractMerchantName(rawText);
    const categoryInfo = detectCategory(rawText, merchantName);
    const items = extractItems(rawText);

    // Calculate confidence score
    let confidence = 0;
    if (amount) confidence += 40;
    if (merchantName) confidence += 25;
    if (date) confidence += 20;
    if (categoryInfo) confidence += 15;

    const extractedData: ExtractedReceiptData = {
      amount,
      merchantName,
      date,
      category: categoryInfo?.category || null,
      categoryLabel: categoryInfo?.label || null,
      categoryIcon: categoryInfo?.icon || null,
      items,
      rawText,
      confidence,
    };

    return {
      success: true,
      data: extractedData,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : '영수증 처리 중 오류가 발생했습니다.',
    };
  }
}

/**
 * Fallback: Manual text extraction patterns for offline use
 */
export function parseReceiptText(text: string): ExtractedReceiptData {
  const amount = extractAmount(text);
  const date = extractDate(text);
  const merchantName = extractMerchantName(text);
  const categoryInfo = detectCategory(text, merchantName);
  const items = extractItems(text);

  let confidence = 0;
  if (amount) confidence += 40;
  if (merchantName) confidence += 25;
  if (date) confidence += 20;
  if (categoryInfo) confidence += 15;

  return {
    amount,
    merchantName,
    date,
    category: categoryInfo?.category || null,
    categoryLabel: categoryInfo?.label || null,
    categoryIcon: categoryInfo?.icon || null,
    items,
    rawText: text,
    confidence,
  };
}

/**
 * Format extracted data for display
 */
export function formatExtractedData(data: ExtractedReceiptData): string {
  const parts: string[] = [];

  if (data.merchantName) {
    parts.push(`가게: ${data.merchantName}`);
  }
  if (data.amount) {
    parts.push(`금액: ₩${data.amount.toLocaleString()}`);
  }
  if (data.date) {
    parts.push(`날짜: ${data.date.toLocaleDateString('ko-KR')}`);
  }
  if (data.categoryLabel) {
    parts.push(`카테고리: ${data.categoryIcon} ${data.categoryLabel}`);
  }
  if (data.items.length > 0) {
    parts.push(`항목: ${data.items.join(', ')}`);
  }

  return parts.join('\n');
}
