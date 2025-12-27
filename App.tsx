import React, { createContext, useContext, useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============ TYPES ============
interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  memo: string;
  items?: { name: string; amount: number; checked: boolean }[];
}

interface Schedule {
  id: string;
  date: string;
  title: string;
  time?: string;
  location?: string;
}

// ============ COLORS ============
const DarkColors = {
  bg: '#0a0a0f',
  card: '#1a1a2e',
  primary: '#7c3aed',
  text: '#ffffff',
  textMuted: '#888888',
  border: '#2a2a4e',
  schedule: '#22c55e',
  expense: '#eab308',
};

const LightColors = {
  bg: '#f5f5f7',
  card: '#ffffff',
  primary: '#7c3aed',
  text: '#1a1a2e',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  schedule: '#16a34a',
  expense: '#ca8a04',
};

// Default to dark
let Colors = DarkColors;

// ============ THEME CONTEXT ============
const ThemeContext = createContext<{
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof DarkColors;
}>({ isDark: true, toggleTheme: () => {}, colors: DarkColors });

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => { loadTheme(); }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('@mohani_theme');
      if (saved !== null) setIsDark(saved === 'dark');
    } catch (e) {}
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try { await AsyncStorage.setItem('@mohani_theme', newTheme ? 'dark' : 'light'); } catch (e) {}
  };

  const colors = isDark ? DarkColors : LightColors;
  Colors = colors; // Update global Colors

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

const useTheme = () => useContext(ThemeContext);

// ============ EXPENSE CONTEXT ============
const ExpenseContext = createContext<{
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  getExpensesByDate: (date: string) => Expense[];
  getDatesWithExpenses: () => string[];
}>({ expenses: [], addExpense: () => {}, getExpensesByDate: () => [], getDatesWithExpenses: () => [] });

function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => { loadExpenses(); }, []);
  useEffect(() => { if (expenses.length > 0) saveExpenses(); }, [expenses]);

  const loadExpenses = async () => {
    try {
      const data = await AsyncStorage.getItem('@mohani_expenses');
      if (data) {
        setExpenses(JSON.parse(data));
      } else {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = today.getDate();
        setExpenses([
          { id: '1', date: `${y}-${m}-${String(d).padStart(2, '0')}`, category: '식비', amount: 12000, memo: '점심 - 김치찌개' },
          { id: '2', date: `${y}-${m}-${String(d).padStart(2, '0')}`, category: '카페', amount: 5500, memo: '아메리카노' },
          { id: '3', date: `${y}-${m}-${String(Math.max(1, d-1)).padStart(2, '0')}`, category: '교통', amount: 3000, memo: '버스' },
          { id: '4', date: `${y}-${m}-${String(Math.max(1, d-2)).padStart(2, '0')}`, category: '장보기', amount: 67000, memo: '이마트', items: [
            { name: '삼겹살 600g', amount: 18000, checked: true },
            { name: '쌀 10kg', amount: 32000, checked: true },
            { name: '계란 30구', amount: 8500, checked: true },
          ]},
          { id: '5', date: `${y}-${m}-05`, category: '통신', amount: 55000, memo: 'KT 요금' },
          { id: '6', date: `${y}-${m}-10`, category: '구독', amount: 17000, memo: '넷플릭스' },
          { id: '7', date: `${y}-${m}-15`, category: '의료', amount: 25000, memo: '병원' },
        ]);
      }
    } catch (e) { console.log('Failed to load expenses'); }
  };

  const saveExpenses = async () => {
    try { await AsyncStorage.setItem('@mohani_expenses', JSON.stringify(expenses)); } catch (e) {}
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => [...prev, { ...expense, id: Date.now().toString() }]);
  };

  const getExpensesByDate = (date: string) => expenses.filter(e => e.date === date);
  const getDatesWithExpenses = () => [...new Set(expenses.map(e => e.date))];

  return (
    <ExpenseContext.Provider value={{ expenses, addExpense, getExpensesByDate, getDatesWithExpenses }}>
      {children}
    </ExpenseContext.Provider>
  );
}

const useExpenses = () => useContext(ExpenseContext);

// ============ SCHEDULE CONTEXT ============
const ScheduleContext = createContext<{
  schedules: Schedule[];
  addSchedule: (schedule: Omit<Schedule, 'id'>) => void;
  getSchedulesByDate: (date: string) => Schedule[];
  getDatesWithSchedules: () => string[];
  deleteSchedule: (id: string) => void;
}>({ schedules: [], addSchedule: () => {}, getSchedulesByDate: () => [], getDatesWithSchedules: () => [], deleteSchedule: () => {} });

function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => { loadSchedules(); }, []);
  useEffect(() => { if (schedules.length > 0) saveSchedules(); }, [schedules]);

  const loadSchedules = async () => {
    try {
      const data = await AsyncStorage.getItem('@mohani_schedules');
      if (data) {
        setSchedules(JSON.parse(data));
      } else {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = today.getDate();
        setSchedules([
          { id: '1', date: `${y}-${m}-${String(d).padStart(2, '0')}`, title: '팀 미팅', time: '10:00', location: '회의실 A' },
          { id: '2', date: `${y}-${m}-${String(Math.min(31, d+1)).padStart(2, '0')}`, title: '치과 예약', time: '14:00', location: '서울치과' },
          { id: '3', date: `${y}-${m}-${String(Math.min(31, d+3)).padStart(2, '0')}`, title: '친구 만남', time: '18:00', location: '강남역' },
          { id: '4', date: `${y}-${m}-05`, title: '월급날', time: '', location: '' },
          { id: '5', date: `${y}-${m}-10`, title: '카드 결제일', time: '', location: '' },
          { id: '6', date: `${y}-${m}-15`, title: '정기 회의', time: '09:00', location: '본사' },
          { id: '7', date: `${y}-${m}-20`, title: '생일파티', time: '19:00', location: '집' },
          { id: '8', date: `${y}-${m}-25`, title: '여행 출발', time: '08:00', location: '인천공항' },
        ]);
      }
    } catch (e) { console.log('Failed to load schedules'); }
  };

  const saveSchedules = async () => {
    try { await AsyncStorage.setItem('@mohani_schedules', JSON.stringify(schedules)); } catch (e) {}
  };

  const addSchedule = (schedule: Omit<Schedule, 'id'>) => {
    setSchedules(prev => [...prev, { ...schedule, id: Date.now().toString() }]);
  };

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const getSchedulesByDate = (date: string) => schedules.filter(s => s.date === date);
  const getDatesWithSchedules = () => [...new Set(schedules.map(s => s.date))];

  return (
    <ScheduleContext.Provider value={{ schedules, addSchedule, getSchedulesByDate, getDatesWithSchedules, deleteSchedule }}>
      {children}
    </ScheduleContext.Provider>
  );
}

const useSchedules = () => useContext(ScheduleContext);

// ============ CALENDAR SCREEN ============
function CalendarScreen() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [showDetail, setShowDetail] = useState(false);
  const { expenses, addExpense, getExpensesByDate, getDatesWithExpenses } = useExpenses();
  const { schedules, addSchedule, getSchedulesByDate, getDatesWithSchedules, deleteSchedule } = useSchedules();
  const { colors } = useTheme();

  // Add modals state
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [newScheduleTime, setNewScheduleTime] = useState('');
  const [newScheduleLocation, setNewScheduleLocation] = useState('');
  const [expenseItems, setExpenseItems] = useState([{ id: 1, name: '', amount: '', checked: false }]);
  const expenseTotal = expenseItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);

  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const expenseDates = getDatesWithExpenses();
  const scheduleDates = getDatesWithSchedules();

  const getDateString = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const selectedDateStr = getDateString(selectedDate);
  const selectedExpenses = getExpensesByDate(selectedDateStr);
  const selectedSchedules = getSchedulesByDate(selectedDateStr);
  const totalForDay = selectedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const hasData = selectedExpenses.length > 0 || selectedSchedules.length > 0;

  const handleDayPress = (day: number) => {
    setSelectedDate(day);
    setShowDetail(true);
  };

  const renderCalendar = () => {
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<View key={`e${i}`} style={styles.dayCell} />);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = getDateString(day);
      const isToday = day === today.getDate();
      const isSelected = day === selectedDate;
      const hasExpense = expenseDates.includes(dateStr);
      const hasSchedule = scheduleDates.includes(dateStr);

      cells.push(
        <TouchableOpacity key={day} style={[styles.dayCell, isSelected && styles.selectedDay]} onPress={() => handleDayPress(day)}>
          <Text style={[styles.dayText, { color: colors.text }, isToday && styles.todayText, isSelected && styles.selectedDayText]}>{day}</Text>
          <View style={styles.dots}>
            {hasSchedule && <View style={[styles.dot, { backgroundColor: colors.schedule }]} />}
            {hasExpense && <View style={[styles.dot, { backgroundColor: colors.expense }]} />}
          </View>
        </TouchableOpacity>
      );
    }

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(<View key={i} style={styles.weekRow}>{cells.slice(i, i + 7)}</View>);
    return weeks;
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={styles.header}><Text style={[styles.title, { color: colors.text }]}>{year}년 {month + 1}월</Text></View>

      <View style={styles.weekHeader}>
        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
          <Text key={i} style={[styles.weekDay, { color: colors.textMuted }, i === 0 && { color: '#ef4444' }, i === 6 && { color: '#3b82f6' }]}>{d}</Text>
        ))}
      </View>

      <View style={styles.calendar}>{renderCalendar()}</View>

      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.schedule }]} /><Text style={[styles.legendText, { color: colors.textMuted }]}>일정</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.expense }]} /><Text style={[styles.legendText, { color: colors.textMuted }]}>지출</Text></View>
      </View>

      {/* Day Detail Modal */}
      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{month + 1}월 {selectedDate}일</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Schedules Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>일정</Text>
                  <TouchableOpacity onPress={() => setShowAddSchedule(true)}>
                    <View style={[styles.addBtnSmall, { backgroundColor: colors.schedule }]}>
                      <Ionicons name="add" size={16} color="#fff" />
                    </View>
                  </TouchableOpacity>
                </View>
                {selectedSchedules.length > 0 ? (
                  selectedSchedules.map(schedule => (
                    <View key={schedule.id} style={[styles.scheduleItem, { backgroundColor: colors.bg }]}>
                      <View style={styles.scheduleLeft}>
                        <View style={[styles.scheduleDot, { backgroundColor: colors.schedule }]} />
                        <View>
                          <Text style={[styles.scheduleTitle, { color: colors.text }]}>{schedule.title}</Text>
                          {(schedule.time || schedule.location) && (
                            <Text style={[styles.scheduleInfo, { color: colors.textMuted }]}>
                              {schedule.time && `${schedule.time}`}{schedule.time && schedule.location && ' · '}{schedule.location}
                            </Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => {
                        Alert.alert('삭제', '이 일정을 삭제하시겠습니까?', [
                          { text: '취소', style: 'cancel' },
                          { text: '삭제', style: 'destructive', onPress: () => deleteSchedule(schedule.id) },
                        ]);
                      }}>
                        <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>일정이 없습니다</Text>
                )}
              </View>

              {/* Expenses Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>지출</Text>
                  <TouchableOpacity onPress={() => setShowAddExpense(true)}>
                    <View style={[styles.addBtnSmall, { backgroundColor: colors.expense }]}>
                      <Ionicons name="add" size={16} color="#fff" />
                    </View>
                  </TouchableOpacity>
                </View>
                {selectedExpenses.length > 0 ? (
                  selectedExpenses.map(expense => (
                    <View key={expense.id} style={[styles.expenseItem, { backgroundColor: colors.bg }]}>
                      <View style={styles.expenseHeader}>
                        <Text style={[styles.expenseCategory, { color: colors.text }]}>{expense.category}</Text>
                        <Text style={[styles.expenseAmount, { color: colors.expense }]}>{expense.amount.toLocaleString()}원</Text>
                      </View>
                      <Text style={[styles.expenseMemo, { color: colors.textMuted }]}>{expense.memo}</Text>
                      {expense.items && (
                        <View style={styles.itemsDetail}>
                          {expense.items.map((item, idx) => (
                            <View key={idx} style={styles.itemDetailRow}>
                              <Ionicons name={item.checked ? "checkmark-circle" : "ellipse-outline"} size={16} color={item.checked ? colors.schedule : colors.textMuted} />
                              <Text style={[styles.itemDetailName, { color: colors.text }, item.checked && styles.itemChecked]}>{item.name}</Text>
                              <Text style={[styles.itemDetailAmount, { color: colors.textMuted }]}>{item.amount.toLocaleString()}원</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>지출이 없습니다</Text>
                )}
              </View>
            </ScrollView>

            {totalForDay > 0 && (
              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}><Text style={[styles.modalTotal, { color: colors.expense }]}>총 {totalForDay.toLocaleString()}원</Text></View>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Schedule Modal */}
      <Modal visible={showAddSchedule} transparent animationType="fade">
        <View style={styles.memoModalOverlay}>
          <View style={[styles.memoModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.memoModalTitle, { color: colors.text }]}>일정 추가</Text>
            <TextInput
              style={[styles.memoNameInput, { backgroundColor: colors.bg, color: colors.text }]}
              value={newScheduleTitle}
              onChangeText={setNewScheduleTitle}
              placeholder="제목 *"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <TextInput
              style={[styles.memoNameInput, { backgroundColor: colors.bg, color: colors.text }]}
              value={newScheduleTime}
              onChangeText={setNewScheduleTime}
              placeholder="시간 (예: 14:00)"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[styles.memoNameInput, { backgroundColor: colors.bg, color: colors.text }]}
              value={newScheduleLocation}
              onChangeText={setNewScheduleLocation}
              placeholder="장소"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.memoModalButtons}>
              <TouchableOpacity style={[styles.memoModalCancel, { backgroundColor: colors.bg }]} onPress={() => { setShowAddSchedule(false); setNewScheduleTitle(''); setNewScheduleTime(''); setNewScheduleLocation(''); }}>
                <Text style={[styles.memoModalCancelText, { color: colors.textMuted }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.memoModalSave, { backgroundColor: colors.schedule }]} onPress={() => {
                if (newScheduleTitle.trim()) {
                  addSchedule({ date: selectedDateStr, title: newScheduleTitle.trim(), time: newScheduleTime, location: newScheduleLocation });
                  setNewScheduleTitle(''); setNewScheduleTime(''); setNewScheduleLocation('');
                  setShowAddSchedule(false);
                }
              }}>
                <Text style={styles.memoModalSaveText}>추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Expense Modal */}
      <Modal visible={showAddExpense} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.expenseModalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>지출 추가</Text>
              <TouchableOpacity onPress={() => { setShowAddExpense(false); setExpenseItems([{ id: 1, name: '', amount: '', checked: false }]); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.expenseModalScroll} keyboardShouldPersistTaps="handled">
              <Text style={[styles.cardSubtitle, { color: colors.textMuted, marginBottom: 12 }]}>구매 항목을 입력하세요</Text>

              {expenseItems.map(item => (
                <View key={item.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                  <TouchableOpacity style={[styles.checkbox, item.checked && styles.checked]} onPress={() => setExpenseItems(expenseItems.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i))}>
                    {item.checked && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </TouchableOpacity>
                  <TextInput style={[styles.itemNameInput, { color: colors.text }, item.checked && styles.itemChecked]} value={item.name} onChangeText={(text) => setExpenseItems(expenseItems.map(i => i.id === item.id ? { ...i, name: text } : i))} placeholder="항목명" placeholderTextColor={colors.textMuted} />
                  <TextInput style={[styles.itemAmountInput, { color: colors.text }]} value={item.amount} onChangeText={(text) => setExpenseItems(expenseItems.map(i => i.id === item.id ? { ...i, amount: text.replace(/^0+/, '') || '' } : i))} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
                  <Text style={[styles.won, { color: colors.textMuted }]}>원</Text>
                </View>
              ))}

              <TouchableOpacity style={styles.addItemButton} onPress={() => setExpenseItems([...expenseItems, { id: Date.now(), name: '', amount: '', checked: false }])}>
                <Ionicons name="add" size={20} color={colors.primary} /><Text style={[styles.addItemText, { color: colors.primary }]}>항목 추가</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={[styles.expenseModalFooter, { borderTopColor: colors.border }]}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>합계</Text>
                <Text style={[styles.totalAmount, { color: colors.primary }]}>{expenseTotal.toLocaleString()}원</Text>
              </View>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.expense }]} onPress={() => {
                if (expenseTotal > 0) {
                  addExpense({
                    date: selectedDateStr,
                    category: '장보기',
                    amount: expenseTotal,
                    memo: '장보기',
                    items: expenseItems.filter(i => i.name).map(i => ({ name: i.name, amount: parseInt(i.amount) || 0, checked: i.checked }))
                  });
                  setExpenseItems([{ id: Date.now(), name: '', amount: '', checked: false }]);
                  setShowAddExpense(false);
                }
              }}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={styles.buttonText}>지출 기록하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============ ADD SCREEN ============
interface SavedMemo {
  id: number;
  name: string;
  items: { id: number; name: string; amount: string; checked: boolean }[];
  createdAt: string;
  updatedAt: string;
}

function AddScreen() {
  const { addExpense } = useExpenses();
  const { addSchedule } = useSchedules();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'expense' | 'schedule'>('expense');

  // Expense state
  const [items, setItems] = useState([{ id: 1, name: '', amount: '0', checked: false }]);
  const total = items.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);

  // Saved memos state
  const [savedMemos, setSavedMemos] = useState<SavedMemo[]>([]);
  const [currentMemoId, setCurrentMemoId] = useState<number | null>(null);
  const [memoName, setMemoName] = useState('');
  const [showSavedMemos, setShowSavedMemos] = useState(false);
  const [showMemoNameInput, setShowMemoNameInput] = useState(false);

  // Load saved memos on mount
  useEffect(() => {
    loadSavedMemos();
  }, []);

  const loadSavedMemos = async () => {
    try {
      const data = await AsyncStorage.getItem('@mohani_shopping_memos');
      if (data) setSavedMemos(JSON.parse(data));
    } catch (e) { console.log('Failed to load memos'); }
  };

  const saveMemoToStorage = async (memos: SavedMemo[]) => {
    try {
      await AsyncStorage.setItem('@mohani_shopping_memos', JSON.stringify(memos));
      setSavedMemos(memos);
    } catch (e) { console.log('Failed to save memos'); }
  };

  const saveMemo = () => {
    if (items.every(i => !i.name.trim())) {
      Alert.alert('알림', '항목을 입력해주세요');
      return;
    }
    setShowMemoNameInput(true);
  };

  const confirmSaveMemo = () => {
    const now = new Date().toISOString();
    const name = memoName.trim() || `메모 ${savedMemos.length + 1}`;

    if (currentMemoId) {
      // Update existing memo
      const updated = savedMemos.map(m => m.id === currentMemoId ? { ...m, name, items, updatedAt: now } : m);
      saveMemoToStorage(updated);
      Alert.alert('완료', '메모가 업데이트되었습니다!');
    } else {
      // Create new memo
      const newMemo: SavedMemo = { id: Date.now(), name, items, createdAt: now, updatedAt: now };
      saveMemoToStorage([...savedMemos, newMemo]);
      setCurrentMemoId(newMemo.id);
      Alert.alert('완료', '메모가 저장되었습니다!');
    }
    setShowMemoNameInput(false);
    setMemoName('');
  };

  const loadMemo = (memo: SavedMemo) => {
    setItems(memo.items.map(i => ({ ...i, id: Date.now() + Math.random() })));
    setCurrentMemoId(memo.id);
    setMemoName(memo.name);
    setShowSavedMemos(false);
  };

  const deleteMemo = (id: number) => {
    Alert.alert('삭제', '이 메모를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => {
        const updated = savedMemos.filter(m => m.id !== id);
        saveMemoToStorage(updated);
        if (currentMemoId === id) {
          setCurrentMemoId(null);
          setMemoName('');
        }
      }}
    ]);
  };

  const newMemo = () => {
    setItems([{ id: Date.now(), name: '', amount: '', checked: false }]);
    setCurrentMemoId(null);
    setMemoName('');
    setShowSavedMemos(false);
  };

  // Schedule state
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleLocation, setScheduleLocation] = useState('');

  const saveExpense = () => {
    if (total === 0) { Alert.alert('알림', '금액을 입력해주세요'); return; }
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    addExpense({ date: dateStr, category: '장보기', amount: total, memo: '장보기', items: items.filter(i => i.name).map(i => ({ name: i.name, amount: parseInt(i.amount) || 0, checked: i.checked })) });
    Alert.alert('완료', '지출이 기록되었습니다!');
    setItems([{ id: Date.now(), name: '', amount: '0', checked: false }]);
  };

  const [scheduleSaved, setScheduleSaved] = useState(false);

  const saveSchedule = () => {
    Keyboard.dismiss();
    if (!scheduleTitle.trim()) { Alert.alert('알림', '일정 제목을 입력해주세요'); return; }
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    addSchedule({ date: dateStr, title: scheduleTitle.trim(), time: scheduleTime, location: scheduleLocation });
    setScheduleTitle(''); setScheduleTime(''); setScheduleLocation('');
    setScheduleSaved(true);
    setTimeout(() => setScheduleSaved(false), 2000);
  };

  const addQuickExpense = (category: string) => {
    Alert.prompt(`${category} 지출`, '금액을 입력하세요', [
      { text: '취소', style: 'cancel' },
      { text: '저장', onPress: (amount) => {
        if (amount && parseInt(amount) > 0) {
          const today = new Date();
          const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          addExpense({ date: dateStr, category, amount: parseInt(amount), memo: category });
          Alert.alert('완료', '지출이 기록되었습니다!');
        }
      }},
    ], 'plain-text', '', 'number-pad');
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.bg }]} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><Text style={[styles.title, { color: colors.text }]}>추가</Text></View>

      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={[styles.tab, activeTab === 'expense' && styles.activeTab]} onPress={() => setActiveTab('expense')}>
          <Ionicons name="card-outline" size={20} color={activeTab === 'expense' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === 'expense' && styles.activeTabText]}>지출</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'schedule' && styles.activeTab]} onPress={() => setActiveTab('schedule')}>
          <Ionicons name="calendar-outline" size={20} color={activeTab === 'schedule' ? colors.schedule : colors.textMuted} />
          <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === 'schedule' && styles.activeTabText]}>일정</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'expense' ? (
        <>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>구매 메모장</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>장보기 항목을 입력하세요</Text>

            {items.map(item => (
              <View key={item.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                <TouchableOpacity style={[styles.checkbox, item.checked && styles.checked]} onPress={() => setItems(items.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i))}>
                  {item.checked && <Ionicons name="checkmark" size={16} color="#fff" />}
                </TouchableOpacity>
                <TextInput style={[styles.itemNameInput, { color: colors.text }, item.checked && styles.itemChecked]} value={item.name} onChangeText={(text) => setItems(items.map(i => i.id === item.id ? { ...i, name: text } : i))} placeholder="항목명" placeholderTextColor={colors.textMuted} />
                <TextInput style={[styles.itemAmountInput, { color: colors.text }]} value={item.amount} onChangeText={(text) => setItems(items.map(i => i.id === item.id ? { ...i, amount: text.replace(/^0+/, '') || '' } : i))} onFocus={() => { if (item.amount === '0') setItems(items.map(i => i.id === item.id ? { ...i, amount: '' } : i)); }} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
                <Text style={[styles.won, { color: colors.textMuted }]}>원</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.addItemButton} onPress={() => setItems([...items, { id: Date.now(), name: '', amount: '', checked: false }])}>
              <Ionicons name="add" size={20} color={colors.primary} /><Text style={[styles.addItemText, { color: colors.primary }]}>항목 추가</Text>
            </TouchableOpacity>

            <View style={styles.memoButtonRow}>
              <TouchableOpacity style={styles.memoButton} onPress={saveMemo}>
                <Ionicons name="save-outline" size={18} color={colors.primary} /><Text style={[styles.memoButtonText, { color: colors.primary }]}>{currentMemoId ? '메모 업데이트' : '메모 저장하기'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.memoButton} onPress={() => setShowSavedMemos(true)}>
                <Ionicons name="folder-outline" size={18} color={colors.primary} /><Text style={[styles.memoButtonText, { color: colors.primary }]}>저장된 메모</Text>
              </TouchableOpacity>
            </View>

            {currentMemoId && (
              <View style={styles.currentMemoInfo}>
                <Ionicons name="document-text" size={14} color={colors.textMuted} />
                <Text style={[styles.currentMemoText, { color: colors.textMuted }]}>현재: {savedMemos.find(m => m.id === currentMemoId)?.name}</Text>
                <TouchableOpacity onPress={newMemo}><Text style={[styles.newMemoLink, { color: colors.primary }]}>새 메모</Text></TouchableOpacity>
              </View>
            )}

            <View style={[styles.totalRow, { borderTopColor: colors.border }]}><Text style={[styles.totalLabel, { color: colors.text }]}>합계</Text><Text style={[styles.totalAmount, { color: colors.primary }]}>{total.toLocaleString()}원</Text></View>

            <TouchableOpacity style={styles.primaryButton} onPress={saveExpense}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={styles.buttonText}>지출 기록하기</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>빠른 지출</Text>
            <View style={styles.quickGrid}>
              {[{ icon: 'fast-food', label: '식비', color: '#f97316' }, { icon: 'car', label: '교통', color: '#3b82f6' }, { icon: 'cart', label: '쇼핑', color: '#ec4899' }, { icon: 'ellipsis-horizontal', label: '기타', color: '#6b7280' }].map((cat, i) => (
                <TouchableOpacity key={i} style={[styles.quickButton, { backgroundColor: colors.bg }]} onPress={() => addQuickExpense(cat.label)}>
                  <Ionicons name={cat.icon as any} size={24} color={cat.color} /><Text style={[styles.quickLabel, { color: colors.text }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>새 일정</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>오늘 날짜에 일정을 추가합니다</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>제목 *</Text>
            <TextInput style={[styles.textInput, { backgroundColor: colors.bg, color: colors.text }]} value={scheduleTitle} onChangeText={setScheduleTitle} placeholder="일정 제목" placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>시간</Text>
            <TextInput style={[styles.textInput, { backgroundColor: colors.bg, color: colors.text }]} value={scheduleTime} onChangeText={setScheduleTime} placeholder="예: 14:00" placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>장소</Text>
            <TextInput style={[styles.textInput, { backgroundColor: colors.bg, color: colors.text }]} value={scheduleLocation} onChangeText={setScheduleLocation} placeholder="예: 강남역" placeholderTextColor={colors.textMuted} />
          </View>

          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.schedule }]} onPress={saveSchedule}>
            <Ionicons name="calendar-outline" size={20} color="#fff" /><Text style={styles.buttonText}>일정 추가하기</Text>
          </TouchableOpacity>

          {scheduleSaved && (
            <View style={styles.successMessage}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.schedule} />
              <Text style={styles.successText}>일정이 추가되었습니다!</Text>
            </View>
          )}
        </View>
      )}

      {/* Memo Name Input Modal */}
      <Modal visible={showMemoNameInput} transparent animationType="fade">
        <View style={styles.memoModalOverlay}>
          <View style={styles.memoModal}>
            <Text style={styles.memoModalTitle}>메모 이름</Text>
            <TextInput
              style={styles.memoNameInput}
              value={memoName}
              onChangeText={setMemoName}
              placeholder="메모 이름을 입력하세요"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <View style={styles.memoModalButtons}>
              <TouchableOpacity style={styles.memoModalCancel} onPress={() => { setShowMemoNameInput(false); setMemoName(''); }}>
                <Text style={styles.memoModalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.memoModalSave} onPress={confirmSaveMemo}>
                <Text style={styles.memoModalSaveText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Saved Memos List Modal */}
      <Modal visible={showSavedMemos} transparent animationType="slide">
        <View style={styles.memoModalOverlay}>
          <View style={styles.savedMemosModal}>
            <View style={styles.savedMemosHeader}>
              <Text style={styles.savedMemosTitle}>저장된 메모</Text>
              <TouchableOpacity onPress={() => setShowSavedMemos(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.savedMemosList}>
              {savedMemos.length === 0 ? (
                <Text style={styles.noMemosText}>저장된 메모가 없습니다</Text>
              ) : (
                savedMemos.map(memo => (
                  <TouchableOpacity key={memo.id} style={styles.savedMemoItem} onPress={() => loadMemo(memo)}>
                    <View style={styles.savedMemoInfo}>
                      <Text style={styles.savedMemoName}>{memo.name}</Text>
                      <Text style={styles.savedMemoDetails}>
                        {memo.items.filter(i => i.name).length}개 항목 · {memo.items.reduce((s, i) => s + (parseInt(i.amount) || 0), 0).toLocaleString()}원
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteMemo(memo.id)} style={styles.deleteMemoButton}>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.newMemoButton} onPress={newMemo}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.newMemoButtonText}>새 메모 작성</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ============ SETTINGS SCREEN ============
function SettingsScreen() {
  const { expenses } = useExpenses();
  const { schedules } = useSchedules();
  const { isDark, toggleTheme, colors } = useTheme();

  const clearData = () => {
    Alert.alert('데이터 초기화', '모든 데이터를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('@mohani_expenses');
        await AsyncStorage.removeItem('@mohani_schedules');
        Alert.alert('완료', '데이터가 삭제되었습니다. 앱을 재시작하세요.');
      }},
    ]);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={styles.header}><Text style={[styles.title, { color: colors.text }]}>설정</Text></View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: colors.text }]}>Mohani Simple</Text>
          <Text style={[styles.appDesc, { color: colors.textMuted }]}>달력 중심 가계부</Text>
          <Text style={[styles.version, { color: colors.textMuted }]}>v1.1.0</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>이번 달 통계</Text>
        <View style={styles.statRow}><Text style={[styles.statLabel, { color: colors.textMuted }]}>총 지출</Text><Text style={[styles.statValue, { color: colors.text }]}>{totalExpenses.toLocaleString()}원</Text></View>
        <View style={styles.statRow}><Text style={[styles.statLabel, { color: colors.textMuted }]}>지출 건수</Text><Text style={[styles.statValue, { color: colors.text }]}>{expenses.length}건</Text></View>
        <View style={styles.statRow}><Text style={[styles.statLabel, { color: colors.textMuted }]}>일정 수</Text><Text style={[styles.statValue, { color: colors.schedule }]}>{schedules.length}개</Text></View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={toggleTheme}>
          <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.primary} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>{isDark ? '다크 모드' : '라이트 모드'}</Text>
          <View style={[styles.themeToggle, { backgroundColor: isDark ? colors.primary : colors.border }]}>
            <View style={[styles.themeToggleKnob, { marginLeft: isDark ? 20 : 2 }]} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]} onPress={clearData}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
          <Text style={[styles.settingLabel, { color: colors.text }]}>데이터 초기화</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============ TAB NAVIGATOR ============
const Tab = createBottomTabNavigator();

function AppContent() {
  const { isDark, colors } = useTheme();

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tab.Navigator screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused, color, size }) => {
          let icon: keyof typeof Ionicons.glyphMap = 'calendar';
          if (route.name === 'Calendar') icon = focused ? 'calendar' : 'calendar-outline';
          if (route.name === 'Add') icon = focused ? 'add-circle' : 'add-circle-outline';
          if (route.name === 'Settings') icon = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}>
        <Tab.Screen name="Calendar" component={CalendarScreen} options={{ tabBarLabel: '달력' }} />
        <Tab.Screen name="Add" component={AddScreen} options={{ tabBarLabel: '추가' }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: '설정' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ExpenseProvider>
          <ScheduleProvider>
            <AppContent />
          </ScheduleProvider>
        </ExpenseProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.text },

  weekHeader: { flexDirection: 'row', paddingHorizontal: 10, marginBottom: 8 },
  weekDay: { flex: 1, textAlign: 'center', color: Colors.textMuted, fontSize: 14 },
  calendar: { paddingHorizontal: 10 },
  weekRow: { flexDirection: 'row' },
  dayCell: { flex: 1, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', margin: 2, borderRadius: 8 },
  selectedDay: { backgroundColor: Colors.primary },
  dayText: { color: Colors.text, fontSize: 16 },
  todayText: { fontWeight: 'bold', color: Colors.primary },
  selectedDayText: { color: '#fff', fontWeight: 'bold' },
  dots: { flexDirection: 'row', marginTop: 2, gap: 3 },
  dot: { width: 5, height: 5, borderRadius: 3 },

  legend: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginVertical: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { color: Colors.textMuted, fontSize: 12 },

  card: { backgroundColor: Colors.card, marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { color: Colors.textMuted, fontSize: 14, marginTop: 4 },
  scheduleCount: { color: Colors.schedule, fontSize: 14, marginTop: 8 },
  expenseCount: { color: Colors.textMuted, fontSize: 14, marginTop: 8 },
  expenseTotal: { color: Colors.expense, fontSize: 24, fontWeight: 'bold', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  modalScroll: { padding: 20 },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: Colors.border },
  modalTotal: { color: Colors.expense, fontSize: 22, fontWeight: 'bold', textAlign: 'right' },

  section: { marginBottom: 20 },
  sectionTitle: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtnSmall: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', paddingVertical: 20, fontSize: 14 },

  // Quick Add in Modal
  quickAddSection: { padding: 16, borderTopWidth: 1 },
  quickAddTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  quickAddRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  quickAddLabel: { width: 40, fontSize: 13, fontWeight: '600' },
  quickAddButtons: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickAddBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, gap: 4 },
  quickAddBtnText: { fontSize: 13 },
  totalRowModal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  totalLabelModal: { fontSize: 14 },
  totalAmountModal: { fontSize: 18, fontWeight: 'bold' },

  // Category picker
  categoryPicker: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  categoryBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  categoryBtnText: { fontSize: 14, fontWeight: '500' },

  // Expense Modal
  expenseModalContent: { width: '100%', height: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: 'auto' },
  expenseModalScroll: { flex: 1, padding: 20 },
  expenseModalFooter: { padding: 20, borderTopWidth: 1 },

  scheduleItem: { backgroundColor: Colors.bg, padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scheduleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  scheduleDot: { width: 10, height: 10, borderRadius: 5 },
  scheduleTitle: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  scheduleInfo: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },

  expenseItem: { backgroundColor: Colors.bg, padding: 16, borderRadius: 12, marginBottom: 12 },
  expenseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expenseCategory: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  expenseAmount: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  expenseMemo: { color: Colors.textMuted, fontSize: 14, marginTop: 4 },
  itemsDetail: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  itemDetailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  itemDetailName: { flex: 1, color: Colors.text, fontSize: 14 },
  itemDetailAmount: { color: Colors.textMuted, fontSize: 14 },

  tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: Colors.card, borderRadius: 12, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8, borderRadius: 10 },
  activeTab: { backgroundColor: Colors.bg },
  tabText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  activeTabText: { color: Colors.text },

  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checked: { backgroundColor: Colors.primary },
  itemNameInput: { flex: 1, color: Colors.text, fontSize: 16, padding: 0 },
  itemAmountInput: { width: 80, color: Colors.text, fontSize: 16, textAlign: 'right', padding: 0 },
  won: { color: Colors.textMuted, fontSize: 14, marginLeft: 4 },
  itemChecked: { textDecorationLine: 'line-through', color: Colors.textMuted },
  addItemButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  addItemText: { color: Colors.primary, fontSize: 14 },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 8 },
  totalLabel: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  totalAmount: { color: Colors.primary, fontSize: 18, fontWeight: 'bold' },

  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, padding: 14, borderRadius: 12, marginTop: 12, gap: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  quickButton: { width: '22%', aspectRatio: 1, backgroundColor: Colors.bg, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { color: Colors.text, fontSize: 12, marginTop: 6 },

  inputGroup: { marginBottom: 16 },
  inputLabel: { color: Colors.textMuted, fontSize: 14, marginBottom: 8 },
  textInput: { backgroundColor: Colors.bg, borderRadius: 12, padding: 14, color: Colors.text, fontSize: 16 },

  appInfo: { alignItems: 'center', paddingVertical: 20 },
  appName: { color: Colors.text, fontSize: 22, fontWeight: 'bold' },
  appDesc: { color: Colors.textMuted, fontSize: 14, marginTop: 4 },
  version: { color: Colors.textMuted, fontSize: 12, marginTop: 8 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  settingLabel: { flex: 1, color: Colors.text, fontSize: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  statLabel: { color: Colors.textMuted, fontSize: 14 },
  statValue: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  successMessage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 8, backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: 12, borderRadius: 8 },
  successText: { color: Colors.schedule, fontSize: 14, fontWeight: '600' },

  // Memo styles
  memoButtonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  memoButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124, 58, 237, 0.1)', padding: 10, borderRadius: 8, gap: 6 },
  memoButtonText: { color: Colors.primary, fontSize: 13, fontWeight: '500' },
  currentMemoInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 6 },
  currentMemoText: { color: Colors.textMuted, fontSize: 12 },
  newMemoLink: { color: Colors.primary, fontSize: 12, fontWeight: '600' },

  memoModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  memoModal: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, width: '85%' },
  memoModalTitle: { color: Colors.text, fontSize: 18, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  memoNameInput: { backgroundColor: Colors.bg, borderRadius: 12, padding: 14, color: Colors.text, fontSize: 16, marginBottom: 16 },
  memoModalButtons: { flexDirection: 'row', gap: 12 },
  memoModalCancel: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: Colors.bg, alignItems: 'center' },
  memoModalCancelText: { color: Colors.textMuted, fontSize: 16 },
  memoModalSave: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: Colors.primary, alignItems: 'center' },
  memoModalSaveText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  savedMemosModal: { backgroundColor: Colors.card, borderRadius: 16, width: '90%', maxHeight: '70%', padding: 16 },
  savedMemosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  savedMemosTitle: { color: Colors.text, fontSize: 18, fontWeight: '600' },
  savedMemosList: { maxHeight: 300 },
  noMemosText: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 40 },
  savedMemoItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 12, padding: 14, marginBottom: 8 },
  savedMemoInfo: { flex: 1 },
  savedMemoName: { color: Colors.text, fontSize: 16, fontWeight: '500' },
  savedMemoDetails: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  deleteMemoButton: { padding: 8 },
  newMemoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 12, gap: 6, borderTopWidth: 1, borderTopColor: Colors.border },
  newMemoButtonText: { color: Colors.primary, fontSize: 14, fontWeight: '500' },

  // Theme toggle
  themeToggle: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center', padding: 2 },
  themeToggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
});
