import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Currency {
  code: string;
  name: string;
  nameKo: string;
  symbol: string;
  flag: string;
}

export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

// Supported currencies
export const CURRENCIES: Currency[] = [
  { code: 'KRW', name: 'South Korean Won', nameKo: '한국 원', symbol: '₩', flag: '🇰🇷' },
  { code: 'USD', name: 'US Dollar', nameKo: '미국 달러', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', nameKo: '유로', symbol: '€', flag: '🇪🇺' },
  { code: 'JPY', name: 'Japanese Yen', nameKo: '일본 엔', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', nameKo: '중국 위안', symbol: '¥', flag: '🇨🇳' },
  { code: 'GBP', name: 'British Pound', nameKo: '영국 파운드', symbol: '£', flag: '🇬🇧' },
  { code: 'AUD', name: 'Australian Dollar', nameKo: '호주 달러', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', nameKo: '캐나다 달러', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', nameKo: '스위스 프랑', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'HKD', name: 'Hong Kong Dollar', nameKo: '홍콩 달러', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'SGD', name: 'Singapore Dollar', nameKo: '싱가포르 달러', symbol: 'S$', flag: '🇸🇬' },
  { code: 'THB', name: 'Thai Baht', nameKo: '태국 바트', symbol: '฿', flag: '🇹🇭' },
  { code: 'VND', name: 'Vietnamese Dong', nameKo: '베트남 동', symbol: '₫', flag: '🇻🇳' },
  { code: 'PHP', name: 'Philippine Peso', nameKo: '필리핀 페소', symbol: '₱', flag: '🇵🇭' },
  { code: 'TWD', name: 'Taiwan Dollar', nameKo: '대만 달러', symbol: 'NT$', flag: '🇹🇼' },
  { code: 'MYR', name: 'Malaysian Ringgit', nameKo: '말레이시아 링깃', symbol: 'RM', flag: '🇲🇾' },
  { code: 'IDR', name: 'Indonesian Rupiah', nameKo: '인도네시아 루피아', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'INR', name: 'Indian Rupee', nameKo: '인도 루피', symbol: '₹', flag: '🇮🇳' },
  { code: 'NZD', name: 'New Zealand Dollar', nameKo: '뉴질랜드 달러', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'MXN', name: 'Mexican Peso', nameKo: '멕시코 페소', symbol: 'MX$', flag: '🇲🇽' },
];

// Fallback exchange rates (based on KRW, approximate as of 2024)
const FALLBACK_RATES: Record<string, number> = {
  KRW: 1,
  USD: 0.00075,
  EUR: 0.00069,
  JPY: 0.112,
  CNY: 0.0054,
  GBP: 0.00059,
  AUD: 0.00115,
  CAD: 0.00102,
  CHF: 0.00066,
  HKD: 0.00586,
  SGD: 0.00101,
  THB: 0.027,
  VND: 18.75,
  PHP: 0.042,
  TWD: 0.024,
  MYR: 0.0035,
  IDR: 11.85,
  INR: 0.063,
  NZD: 0.00124,
  MXN: 0.013,
};

const STORAGE_KEY = '@mohani_exchange_rates';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Get currency by code
 */
export function getCurrency(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code);
}

/**
 * Fetch latest exchange rates from API
 */
async function fetchExchangeRates(): Promise<ExchangeRates | null> {
  try {
    // Using exchangerate-api.com free tier (or fallback)
    // Note: In production, you'd want to use a proper API key
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/KRW',
      { timeout: 5000 } as RequestInit
    );

    if (!response.ok) {
      throw new Error('Failed to fetch rates');
    }

    const data = await response.json();

    return {
      base: 'KRW',
      date: new Date().toISOString(),
      rates: data.rates,
    };
  } catch (error) {
    console.log('Failed to fetch exchange rates:', error);
    return null;
  }
}

/**
 * Get exchange rates (cached or fresh)
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  try {
    // Check cache
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed: ExchangeRates = JSON.parse(cached);
      const cacheAge = Date.now() - new Date(parsed.date).getTime();

      if (cacheAge < CACHE_DURATION) {
        return parsed;
      }
    }

    // Fetch fresh rates
    const fresh = await fetchExchangeRates();
    if (fresh) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }

    // Return cached if fetch failed
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.log('Error getting exchange rates:', error);
  }

  // Return fallback rates
  return {
    base: 'KRW',
    date: new Date().toISOString(),
    rates: FALLBACK_RATES,
  };
}

/**
 * Convert amount between currencies
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Convert to KRW first (base currency)
  let inKRW: number;
  if (fromCurrency === 'KRW') {
    inKRW = amount;
  } else {
    const fromRate = rates[fromCurrency] || FALLBACK_RATES[fromCurrency] || 1;
    inKRW = amount / fromRate;
  }

  // Convert from KRW to target currency
  if (toCurrency === 'KRW') {
    return inKRW;
  }

  const toRate = rates[toCurrency] || FALLBACK_RATES[toCurrency] || 1;
  return inKRW * toRate;
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  const symbol = currency?.symbol || currencyCode;

  // Different formatting based on currency
  if (currencyCode === 'KRW' || currencyCode === 'JPY' || currencyCode === 'VND' || currencyCode === 'IDR') {
    // No decimals for these currencies
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }

  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get exchange rate between two currencies
 */
export function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return 1;

  const fromRate = fromCurrency === 'KRW' ? 1 : (rates[fromCurrency] || FALLBACK_RATES[fromCurrency] || 1);
  const toRate = toCurrency === 'KRW' ? 1 : (rates[toCurrency] || FALLBACK_RATES[toCurrency] || 1);

  return toRate / fromRate;
}

/**
 * Popular currency pairs for quick access
 */
export const POPULAR_PAIRS = [
  { from: 'KRW', to: 'USD' },
  { from: 'KRW', to: 'JPY' },
  { from: 'KRW', to: 'EUR' },
  { from: 'KRW', to: 'CNY' },
  { from: 'USD', to: 'KRW' },
  { from: 'JPY', to: 'KRW' },
];

/**
 * Get last updated time formatted
 */
export function formatLastUpdated(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;

  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}
