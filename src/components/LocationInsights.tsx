import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';

interface Expense {
  id: string;
  amount: number;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  note: string;
  date: Date;
}

interface LocationInsightsProps {
  expenses: Expense[];
}

interface MerchantData {
  name: string;
  total: number;
  count: number;
  avgAmount: number;
  category: string;
  categoryIcon: string;
  lastVisit: Date;
}

// Common Korean store/merchant keywords to extract
const MERCHANT_PATTERNS = [
  // Convenience stores
  { pattern: /GS25|gs25|지에스25/, name: 'GS25', icon: '🏪' },
  { pattern: /CU|씨유/, name: 'CU', icon: '🏪' },
  { pattern: /세븐일레븐|7-?eleven/i, name: '세븐일레븐', icon: '🏪' },
  { pattern: /이마트24|emart24/i, name: '이마트24', icon: '🏪' },

  // Coffee shops
  { pattern: /스타벅스|starbucks/i, name: '스타벅스', icon: '☕' },
  { pattern: /투썸|twosome/i, name: '투썸플레이스', icon: '☕' },
  { pattern: /이디야|ediya/i, name: '이디야커피', icon: '☕' },
  { pattern: /메가커피|mega.*coffee/i, name: '메가커피', icon: '☕' },
  { pattern: /컴포즈|compose/i, name: '컴포즈커피', icon: '☕' },
  { pattern: /빽다방|paik/i, name: '빽다방', icon: '☕' },

  // Fast food
  { pattern: /맥도날드|mcdonald/i, name: '맥도날드', icon: '🍔' },
  { pattern: /버거킹|burgerking|burger.*king/i, name: '버거킹', icon: '🍔' },
  { pattern: /롯데리아|lotteria/i, name: '롯데리아', icon: '🍔' },
  { pattern: /맘스터치|momstouch|mom.*touch/i, name: '맘스터치', icon: '🍔' },
  { pattern: /KFC|케이에프씨/i, name: 'KFC', icon: '🍗' },

  // Grocery stores
  { pattern: /이마트|e-?mart/i, name: '이마트', icon: '🛒' },
  { pattern: /홈플러스|homeplus/i, name: '홈플러스', icon: '🛒' },
  { pattern: /롯데마트|lottemart/i, name: '롯데마트', icon: '🛒' },
  { pattern: /코스트코|costco/i, name: '코스트코', icon: '🛒' },
  { pattern: /트레이더스|traders/i, name: '트레이더스', icon: '🛒' },

  // Delivery apps
  { pattern: /배달의민족|배민|baemin/i, name: '배달의민족', icon: '🛵' },
  { pattern: /쿠팡이츠|coupangeats/i, name: '쿠팡이츠', icon: '🛵' },
  { pattern: /요기요|yogiyo/i, name: '요기요', icon: '🛵' },

  // Online shopping
  { pattern: /쿠팡|coupang/i, name: '쿠팡', icon: '📦' },
  { pattern: /네이버.*쇼핑|smartstore/i, name: '네이버쇼핑', icon: '📦' },
  { pattern: /11번가|11st/i, name: '11번가', icon: '📦' },
  { pattern: /G마켓|gmarket/i, name: 'G마켓', icon: '📦' },

  // Transportation
  { pattern: /카카오.*택시|kakao.*taxi/i, name: '카카오택시', icon: '🚕' },
  { pattern: /티머니|t-?money/i, name: '티머니', icon: '🚇' },
  { pattern: /주유소|SK에너지|GS칼텍스|현대오일뱅크|S-?OIL/i, name: '주유소', icon: '⛽' },

  // Entertainment
  { pattern: /CGV|cgv/i, name: 'CGV', icon: '🎬' },
  { pattern: /메가박스|megabox/i, name: '메가박스', icon: '🎬' },
  { pattern: /롯데시네마|lotte.*cinema/i, name: '롯데시네마', icon: '🎬' },
  { pattern: /넷플릭스|netflix/i, name: '넷플릭스', icon: '📺' },

  // Health & Beauty
  { pattern: /올리브영|oliveyoung/i, name: '올리브영', icon: '💄' },
  { pattern: /다이소|daiso/i, name: '다이소', icon: '🏬' },
  { pattern: /약국|pharmacy/i, name: '약국', icon: '💊' },
];

export const LocationInsights: React.FC<LocationInsightsProps> = ({ expenses }) => {
  const insights = useMemo(() => {
    if (expenses.length === 0) return null;

    const merchantMap = new Map<string, MerchantData>();
    const unknownMerchants = new Map<string, MerchantData>();

    expenses.forEach((expense) => {
      const note = expense.note.toLowerCase();
      let matched = false;

      // Try to match known merchants
      for (const { pattern, name, icon } of MERCHANT_PATTERNS) {
        if (pattern.test(expense.note)) {
          const existing = merchantMap.get(name);
          if (existing) {
            existing.total += expense.amount;
            existing.count += 1;
            existing.avgAmount = existing.total / existing.count;
            if (new Date(expense.date) > existing.lastVisit) {
              existing.lastVisit = new Date(expense.date);
            }
          } else {
            merchantMap.set(name, {
              name,
              total: expense.amount,
              count: 1,
              avgAmount: expense.amount,
              category: expense.category,
              categoryIcon: icon,
              lastVisit: new Date(expense.date),
            });
          }
          matched = true;
          break;
        }
      }

      // If no known merchant matched, try to extract from note
      if (!matched && expense.note.trim()) {
        // Extract first significant word as potential merchant
        const words = expense.note.split(/[\s,]/);
        const merchantName = words[0]?.trim();
        if (merchantName && merchantName.length >= 2) {
          const existing = unknownMerchants.get(merchantName);
          if (existing) {
            existing.total += expense.amount;
            existing.count += 1;
            existing.avgAmount = existing.total / existing.count;
            if (new Date(expense.date) > existing.lastVisit) {
              existing.lastVisit = new Date(expense.date);
            }
          } else {
            unknownMerchants.set(merchantName, {
              name: merchantName,
              total: expense.amount,
              count: 1,
              avgAmount: expense.amount,
              category: expense.category,
              categoryIcon: expense.categoryIcon,
              lastVisit: new Date(expense.date),
            });
          }
        }
      }
    });

    // Merge unknown merchants that appear more than twice
    unknownMerchants.forEach((data, name) => {
      if (data.count >= 2 && !merchantMap.has(name)) {
        merchantMap.set(name, data);
      }
    });

    // Sort by total spending
    const topMerchants = Array.from(merchantMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Sort by visit count
    const frequentPlaces = Array.from(merchantMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate total for percentage
    const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);
    const trackedSpending = topMerchants.reduce((sum, m) => sum + m.total, 0);
    const trackedPercent = totalSpending > 0 ? Math.round((trackedSpending / totalSpending) * 100) : 0;

    // Generate insights
    const spendingInsights: { icon: string; text: string; type: 'info' | 'warning' | 'tip' }[] = [];

    if (topMerchants.length > 0) {
      const topMerchant = topMerchants[0];
      const topPercent = totalSpending > 0 ? Math.round((topMerchant.total / totalSpending) * 100) : 0;

      if (topPercent > 20) {
        spendingInsights.push({
          icon: topMerchant.categoryIcon,
          text: `${topMerchant.name}에서 전체 지출의 ${topPercent}%를 사용했어요`,
          type: 'warning',
        });
      }
    }

    const frequentPlace = frequentPlaces.find(p => p.count >= 5);
    if (frequentPlace) {
      spendingInsights.push({
        icon: '📍',
        text: `${frequentPlace.name}에 ${frequentPlace.count}번 방문했어요`,
        type: 'info',
      });
    }

    return {
      topMerchants,
      frequentPlaces,
      trackedPercent,
      insights: spendingInsights,
    };
  }, [expenses]);

  if (!insights || insights.topMerchants.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📍</Text>
        <Text style={styles.emptyText}>지출 메모에 장소를 기록하면 분석해드려요</Text>
        <Text style={styles.emptySubtext}>예: "스타벅스 아이스 아메리카노"</Text>
      </View>
    );
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 10000) {
      return `${Math.round(amount / 10000)}만`;
    }
    return `${Math.round(amount / 1000)}천`;
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    return `${Math.floor(days / 30)}개월 전`;
  };

  return (
    <View style={styles.container}>
      {/* Top Merchants by Spending */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>가장 많이 사용한 곳</Text>
        {insights.topMerchants.map((merchant, index) => {
          const maxTotal = insights.topMerchants[0]?.total || 1;
          const barWidth = (merchant.total / maxTotal) * 100;

          return (
            <Animated.View
              key={merchant.name}
              entering={FadeInDown.delay(index * 100).duration(300)}
              style={styles.merchantItem}
            >
              <View style={styles.merchantLeft}>
                <Text style={styles.merchantRank}>#{index + 1}</Text>
                <Text style={styles.merchantIcon}>{merchant.categoryIcon}</Text>
                <View style={styles.merchantInfo}>
                  <Text style={styles.merchantName}>{merchant.name}</Text>
                  <Text style={styles.merchantVisits}>
                    {merchant.count}회 방문 · {getTimeAgo(merchant.lastVisit)}
                  </Text>
                </View>
              </View>
              <Text style={styles.merchantAmount}>₩{formatCurrency(merchant.total)}</Text>
            </Animated.View>
          );
        })}
      </View>

      {/* Frequent Places */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>자주 가는 곳</Text>
        <View style={styles.frequentGrid}>
          {insights.frequentPlaces.slice(0, 4).map((place, index) => (
            <View key={place.name} style={styles.frequentItem}>
              <Text style={styles.frequentIcon}>{place.categoryIcon}</Text>
              <Text style={styles.frequentName} numberOfLines={1}>{place.name}</Text>
              <Text style={styles.frequentCount}>{place.count}회</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Tracking Coverage */}
      <View style={styles.coverageContainer}>
        <View style={styles.coverageHeader}>
          <Text style={styles.coverageLabel}>장소 인식률</Text>
          <Text style={styles.coveragePercent}>{insights.trackedPercent}%</Text>
        </View>
        <View style={styles.coverageBar}>
          <LinearGradient
            colors={['#7c3aed', '#6d28d9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.coverageFill, { width: `${insights.trackedPercent}%` }]}
          />
        </View>
        <Text style={styles.coverageHint}>
          메모에 장소명을 입력하면 인식률이 올라갑니다
        </Text>
      </View>

      {/* Insights */}
      {insights.insights.length > 0 && (
        <View style={styles.insightsContainer}>
          {insights.insights.map((insight, index) => (
            <View
              key={index}
              style={[
                styles.insightItem,
                insight.type === 'warning' && styles.insightWarning,
                insight.type === 'tip' && styles.insightTip,
              ]}
            >
              <Text style={styles.insightIcon}>{insight.icon}</Text>
              <Text style={styles.insightText}>{insight.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  merchantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  merchantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  merchantRank: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    width: 24,
  },
  merchantIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  merchantVisits: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  merchantAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.purpleLight,
  },
  frequentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  frequentItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  frequentIcon: {
    fontSize: 18,
  },
  frequentName: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  frequentCount: {
    fontSize: FontSizes.xs,
    color: Colors.purpleLight,
    fontWeight: '600',
  },
  coverageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  coverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  coverageLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  coveragePercent: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.purpleLight,
  },
  coverageBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  coverageFill: {
    height: '100%',
    borderRadius: 4,
  },
  coverageHint: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  insightsContainer: {
    gap: Spacing.sm,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  insightWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  insightTip: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  insightIcon: {
    fontSize: 16,
  },
  insightText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
});
