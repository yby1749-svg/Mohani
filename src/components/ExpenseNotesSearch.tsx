import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useExpenses, Expense } from '../context/ExpenseContext';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
} from '../constants/theme';

interface ExpenseNotesSearchProps {
  visible: boolean;
  onClose: () => void;
}

interface SearchResult extends Expense {
  matchedText: string;
  matchIndex: number;
}

const RECENT_SEARCHES_KEY = '@mohani_recent_note_searches';
const MAX_RECENT_SEARCHES = 8;

export const ExpenseNotesSearch: React.FC<ExpenseNotesSearchProps> = ({
  visible,
  onClose,
}) => {
  const { expenses } = useExpenses();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  // Load recent searches
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [visible]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  const saveRecentSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const updated = [
      searchQuery.trim(),
      ...recentSearches.filter((s) => s.toLowerCase() !== searchQuery.toLowerCase()),
    ].slice(0, MAX_RECENT_SEARCHES);

    setRecentSearches(updated);
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  };

  const clearRecentSearches = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecentSearches([]);
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  };

  // Search results
  const searchResults = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    return expenses
      .filter((expense) => {
        const noteText = (expense.note || '').toLowerCase();
        const categoryText = expense.categoryLabel.toLowerCase();
        const searchText = `${noteText} ${categoryText}`;

        return searchTerms.every((term) => searchText.includes(term));
      })
      .map((expense) => {
        const noteText = expense.note || expense.categoryLabel;
        const lowerNote = noteText.toLowerCase();
        const matchIndex = lowerNote.indexOf(searchTerms[0]);

        return {
          ...expense,
          matchedText: noteText,
          matchIndex: matchIndex >= 0 ? matchIndex : 0,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50);
  }, [expenses, query]);

  // Highlight matching text
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return <Text>{text}</Text>;

    const terms = searchQuery.toLowerCase().trim().split(/\s+/);
    const lowerText = text.toLowerCase();

    // Find all match positions
    const matches: { start: number; end: number }[] = [];
    terms.forEach((term) => {
      let startIndex = 0;
      let index;
      while ((index = lowerText.indexOf(term, startIndex)) !== -1) {
        matches.push({ start: index, end: index + term.length });
        startIndex = index + 1;
      }
    });

    // Sort and merge overlapping matches
    matches.sort((a, b) => a.start - b.start);
    const mergedMatches: { start: number; end: number }[] = [];
    matches.forEach((match) => {
      if (mergedMatches.length === 0) {
        mergedMatches.push(match);
      } else {
        const last = mergedMatches[mergedMatches.length - 1];
        if (match.start <= last.end) {
          last.end = Math.max(last.end, match.end);
        } else {
          mergedMatches.push(match);
        }
      }
    });

    // Build highlighted text
    const parts: React.ReactNode[] = [];
    let lastEnd = 0;

    mergedMatches.forEach((match, index) => {
      if (match.start > lastEnd) {
        parts.push(
          <Text key={`text-${index}`} style={styles.normalText}>
            {text.substring(lastEnd, match.start)}
          </Text>
        );
      }
      parts.push(
        <Text key={`match-${index}`} style={styles.highlightedText}>
          {text.substring(match.start, match.end)}
        </Text>
      );
      lastEnd = match.end;
    });

    if (lastEnd < text.length) {
      parts.push(
        <Text key="text-end" style={styles.normalText}>
          {text.substring(lastEnd)}
        </Text>
      );
    }

    return <Text>{parts}</Text>;
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${mins}`;
  };

  const handleSearch = useCallback((searchQuery: string) => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery);
    }
  }, [recentSearches]);

  const handleSelectRecent = (search: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuery(search);
  };

  const renderResult = ({ item, index }: { item: SearchResult; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 30).duration(200)}>
      <View style={styles.resultItem}>
        <View style={styles.resultIcon}>
          <Text style={styles.iconText}>{item.categoryIcon}</Text>
        </View>
        <View style={styles.resultContent}>
          <View style={styles.resultHeader}>
            {highlightText(item.note || item.categoryLabel, query)}
          </View>
          <View style={styles.resultMeta}>
            <Text style={styles.resultCategory}>{item.categoryLabel}</Text>
            <Text style={styles.resultDot}>•</Text>
            <Text style={styles.resultDate}>{formatDate(item.date)}</Text>
          </View>
        </View>
        <Text style={styles.resultAmount}>
          ₩{item.amount.toLocaleString()}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={Colors.textMuted} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => handleSearch(query)}
                placeholder="메모 검색..."
                placeholderTextColor={Colors.textMuted}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {query.length === 0 ? (
            // Recent Searches
            <View style={styles.recentContainer}>
              {recentSearches.length > 0 && (
                <>
                  <View style={styles.recentHeader}>
                    <Text style={styles.recentTitle}>최근 검색</Text>
                    <TouchableOpacity onPress={clearRecentSearches}>
                      <Text style={styles.clearText}>지우기</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.recentTags}>
                    {recentSearches.map((search, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.recentTag}
                        onPress={() => handleSelectRecent(search)}
                      >
                        <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                        <Text style={styles.recentTagText}>{search}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Search Tips */}
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>검색 팁</Text>
                <View style={styles.tipItem}>
                  <Ionicons name="bulb-outline" size={16} color={Colors.purpleLight} />
                  <Text style={styles.tipText}>메모에 포함된 단어로 검색하세요</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="bulb-outline" size={16} color={Colors.purpleLight} />
                  <Text style={styles.tipText}>여러 단어로 검색하면 모두 포함된 결과를 찾습니다</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="bulb-outline" size={16} color={Colors.purpleLight} />
                  <Text style={styles.tipText}>카테고리 이름으로도 검색할 수 있어요</Text>
                </View>
              </View>
            </View>
          ) : (
            // Search Results
            <View style={styles.resultsContainer}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  {searchResults.length > 0
                    ? `${searchResults.length}개의 결과`
                    : '결과 없음'}
                </Text>
              </View>

              {searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  renderItem={renderResult}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.resultsList}
                  keyboardShouldPersistTaps="handled"
                />
              ) : (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsIcon}>🔍</Text>
                  <Text style={styles.noResultsText}>
                    "{query}"에 대한 결과가 없습니다
                  </Text>
                  <Text style={styles.noResultsHint}>
                    다른 검색어를 시도해보세요
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    marginTop: 50,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  cancelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  cancelText: {
    fontSize: FontSizes.md,
    color: Colors.purpleLight,
  },
  recentContainer: {
    padding: Spacing.lg,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  recentTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  clearText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  recentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  recentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  recentTagText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  tipsContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  tipsTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  resultsCount: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  resultsList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    marginBottom: 4,
  },
  normalText: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  highlightedText: {
    fontSize: FontSizes.md,
    color: Colors.goldPrimary,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    fontWeight: '600',
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultCategory: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  resultDot: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  resultDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  resultAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.error,
  },
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  noResultsText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  noResultsHint: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
});

export default ExpenseNotesSearch;
