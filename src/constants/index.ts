export * from './theme';

export const APP_NAME = 'MOHANI';

export const CATEGORIES = [
  { id: 'food', icon: '🍔', label: 'Food', color: '#7c3aed' },
  { id: 'cafe', icon: '☕', label: 'Cafe', color: '#8b5cf6' },
  { id: 'transport', icon: '🚇', label: 'Transport', color: '#a78bfa' },
  { id: 'shopping', icon: '🛒', label: 'Shopping', color: '#f59e0b' },
  { id: 'leisure', icon: '🎮', label: 'Leisure', color: '#fbbf24' },
  { id: 'medical', icon: '💊', label: 'Medical', color: '#22c55e' },
  { id: 'education', icon: '📚', label: 'Education', color: '#3b82f6' },
  { id: 'other', icon: '📦', label: 'Other', color: '#6b7280' },
];

export const DIARY_STYLES = [
  { id: 'calm', icon: '📝', name: 'Calm', preview: '"Work. Lunch. Drinks after."' },
  { id: 'casual', icon: '😄', name: 'Casual', preview: '"Survived Monday! Ramen was fire 🔥"' },
  { id: 'poetic', icon: '🌸', name: 'Poetic', preview: '"Morning mist, coffee warmth..."' },
  { id: 'funny', icon: '😂', name: 'Funny', preview: '"Salary came and went like my ex 💸"' },
];

export const MOODS = [
  { id: 'great', emoji: '😄', label: 'Great' },
  { id: 'good', emoji: '🙂', label: 'Good' },
  { id: 'neutral', emoji: '😐', label: 'Neutral' },
  { id: 'sad', emoji: '😢', label: 'Sad' },
  { id: 'stressed', emoji: '😤', label: 'Stressed' },
];

export const QUICK_EXPENSES = [
  { label: 'Subway', amount: 1400, icon: '🚇' },
  { label: 'Coffee', amount: 4500, icon: '☕' },
  { label: 'Lunch', amount: 9000, icon: '🍔' },
  { label: 'Dinner', amount: 15000, icon: '🍽️' },
];
