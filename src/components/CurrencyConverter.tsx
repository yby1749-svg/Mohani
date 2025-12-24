import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rate: number; // Rate relative to KRW
}

// Static exchange rates (in real app, fetch from API)
const CURRENCIES: Currency[] = [
  { code: 'KRW', name: '한국 원', symbol: '₩', flag: '🇰🇷', rate: 1 },
  { code: 'USD', name: '미국 달러', symbol: '$', flag: '🇺🇸', rate: 0.00075 },
  { code: 'EUR', name: '유로', symbol: '€', flag: '🇪🇺', rate: 0.00069 },
  { code: 'JPY', name: '일본 엔', symbol: '¥', flag: '🇯🇵', rate: 0.11 },
  { code: 'CNY', name: '중국 위안', symbol: '¥', flag: '🇨🇳', rate: 0.0054 },
  { code: 'GBP', name: '영국 파운드', symbol: '£', flag: '🇬🇧', rate: 0.00059 },
  { code: 'AUD', name: '호주 달러', symbol: '$', flag: '🇦🇺', rate: 0.0012 },
  { code: 'CAD', name: '캐나다 달러', symbol: '$', flag: '🇨🇦', rate: 0.0010 },
  { code: 'SGD', name: '싱가포르 달러', symbol: '$', flag: '🇸🇬', rate: 0.0010 },
  { code: 'HKD', name: '홍콩 달러', symbol: '$', flag: '🇭🇰', rate: 0.0059 },
  { code: 'THB', name: '태국 바트', symbol: '฿', flag: '🇹🇭', rate: 0.026 },
  { code: 'VND', name: '베트남 동', symbol: '₫', flag: '🇻🇳', rate: 18.5 },
];

const CurrencyConverter: React.FC = () => {
  const [amount, setAmount] = useState<string>('10000');
  const [fromCurrency, setFromCurrency] = useState<Currency>(CURRENCIES[0]); // KRW
  const [toCurrency, setToCurrency] = useState<Currency>(CURRENCIES[1]); // USD
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [lastUpdated] = useState<Date>(new Date());

  const convertAmount = (value: number, from: Currency, to: Currency): number => {
    // Convert to KRW first, then to target currency
    const inKRW = value / from.rate;
    return inKRW * to.rate;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return num.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
    }
    if (num >= 100) {
      return num.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
    }
    if (num >= 1) {
      return num.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
    }
    return num.toLocaleString('ko-KR', { maximumFractionDigits: 6 });
  };

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const numericAmount = parseFloat(amount) || 0;
  const convertedAmount = convertAmount(numericAmount, fromCurrency, toCurrency);
  const exchangeRate = convertAmount(1, fromCurrency, toCurrency);

  const CurrencyPicker: React.FC<{
    selected: Currency;
    onSelect: (currency: Currency) => void;
    onClose: () => void;
  }> = ({ selected, onSelect, onClose }) => (
    <View style={styles.pickerOverlay}>
      <TouchableOpacity style={styles.pickerBackdrop} onPress={onClose} />
      <Animated.View entering={FadeInDown} style={styles.pickerContainer}>
        <LinearGradient
          colors={['rgba(124, 58, 237, 0.15)', 'rgba(124, 58, 237, 0.05)']}
          style={styles.pickerGradient}
        >
          <Text style={styles.pickerTitle}>통화 선택</Text>
          <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false}>
            {CURRENCIES.map((currency, index) => (
              <Animated.View key={currency.code} entering={FadeIn.delay(index * 30)}>
                <TouchableOpacity
                  style={[
                    styles.currencyOption,
                    selected.code === currency.code && styles.selectedCurrency,
                  ]}
                  onPress={() => {
                    onSelect(currency);
                    onClose();
                  }}
                >
                  <Text style={styles.currencyFlag}>{currency.flag}</Text>
                  <View style={styles.currencyInfo}>
                    <Text style={styles.currencyCode}>{currency.code}</Text>
                    <Text style={styles.currencyName}>{currency.name}</Text>
                  </View>
                  {selected.code === currency.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100)}>
        <LinearGradient
          colors={['rgba(124, 58, 237, 0.2)', 'rgba(124, 58, 237, 0.05)']}
          style={styles.headerCard}
        >
          <Text style={styles.title}>💱 환율 계산기</Text>
          <Text style={styles.updateTime}>
            마지막 업데이트: {lastUpdated.toLocaleDateString('ko-KR')}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* From Currency */}
      <Animated.View entering={FadeInDown.delay(200)}>
        <View style={styles.currencyCard}>
          <TouchableOpacity
            style={styles.currencySelector}
            onPress={() => setShowFromPicker(true)}
          >
            <Text style={styles.currencyFlag}>{fromCurrency.flag}</Text>
            <Text style={styles.currencyCode}>{fromCurrency.code}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="금액 입력"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
      </Animated.View>

      {/* Swap Button */}
      <Animated.View entering={FadeInDown.delay(300)} style={styles.swapContainer}>
        <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
          <Text style={styles.swapIcon}>⇅</Text>
        </TouchableOpacity>
        <View style={styles.rateInfo}>
          <Text style={styles.rateText}>
            1 {fromCurrency.code} = {formatNumber(exchangeRate)} {toCurrency.code}
          </Text>
        </View>
      </Animated.View>

      {/* To Currency */}
      <Animated.View entering={FadeInDown.delay(400)}>
        <View style={styles.currencyCard}>
          <TouchableOpacity
            style={styles.currencySelector}
            onPress={() => setShowToPicker(true)}
          >
            <Text style={styles.currencyFlag}>{toCurrency.flag}</Text>
            <Text style={styles.currencyCode}>{toCurrency.code}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          <View style={styles.resultContainer}>
            <Text style={styles.resultAmount}>
              {toCurrency.symbol}{formatNumber(convertedAmount)}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Quick Amounts */}
      <Animated.View entering={FadeInDown.delay(500)}>
        <Text style={styles.quickLabel}>빠른 금액</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.quickAmounts}>
            {[1000, 5000, 10000, 50000, 100000, 500000, 1000000].map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[
                  styles.quickAmount,
                  parseFloat(amount) === amt && styles.selectedQuickAmount,
                ]}
                onPress={() => setAmount(amt.toString())}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    parseFloat(amount) === amt && styles.selectedQuickAmountText,
                  ]}
                >
                  {amt >= 10000 ? `${amt / 10000}만` : `${amt / 1000}천`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Conversion Table */}
      <Animated.View entering={FadeInDown.delay(600)}>
        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>환산표 ({fromCurrency.code})</Text>
          {CURRENCIES.filter((c) => c.code !== fromCurrency.code)
            .slice(0, 6)
            .map((currency) => {
              const converted = convertAmount(numericAmount, fromCurrency, currency);
              return (
                <View key={currency.code} style={styles.tableRow}>
                  <View style={styles.tableRowLeft}>
                    <Text style={styles.tableFlag}>{currency.flag}</Text>
                    <Text style={styles.tableCode}>{currency.code}</Text>
                  </View>
                  <Text style={styles.tableValue}>
                    {currency.symbol}{formatNumber(converted)}
                  </Text>
                </View>
              );
            })}
        </View>
      </Animated.View>

      {/* Currency Pickers */}
      {showFromPicker && (
        <CurrencyPicker
          selected={fromCurrency}
          onSelect={setFromCurrency}
          onClose={() => setShowFromPicker(false)}
        />
      )}
      {showToPicker && (
        <CurrencyPicker
          selected={toCurrency}
          onSelect={setToCurrency}
          onClose={() => setShowToPicker(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  headerCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  updateTime: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  currencyCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  currencyFlag: {
    fontSize: 28,
    marginRight: Spacing.sm,
  },
  currencyCode: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginRight: Spacing.xs,
  },
  dropdownIcon: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  amountInput: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    textAlign: 'right',
  },
  resultContainer: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  resultAmount: {
    color: Colors.purplePrimary,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    textAlign: 'right',
  },
  swapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  swapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.purplePrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapIcon: {
    fontSize: 24,
    color: Colors.textPrimary,
  },
  rateInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  rateText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  quickLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickAmount: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgSecondary,
  },
  selectedQuickAmount: {
    backgroundColor: Colors.purplePrimary,
  },
  quickAmountText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  selectedQuickAmountText: {
    color: Colors.textPrimary,
  },
  tableCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  tableTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tableRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableFlag: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  tableCode: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  tableValue: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  pickerContainer: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  pickerGradient: {
    padding: Spacing.lg,
  },
  pickerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  currencyList: {
    maxHeight: 400,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  selectedCurrency: {
    backgroundColor: Colors.purplePrimary + '30',
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  checkmark: {
    color: Colors.purplePrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
});

export default CurrencyConverter;
