import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Keyboard, Animated, Dimensions, Image } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { GoalsProvider, useGoals } from './src/context/GoalsContext';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';

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

// ============ TRANSLATIONS ============
const LANGUAGES = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

const CURRENCIES = [
  { code: 'KRW', symbol: '₩', label: '원 (KRW)', flag: '🇰🇷' },
  { code: 'USD', symbol: '$', label: 'Dollar (USD)', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR)', flag: '🇪🇺' },
  { code: 'JPY', symbol: '¥', label: '円 (JPY)', flag: '🇯🇵' },
  { code: 'CNY', symbol: '¥', label: '元 (CNY)', flag: '🇨🇳' },
  { code: 'GBP', symbol: '£', label: 'Pound (GBP)', flag: '🇬🇧' },
  { code: 'AUD', symbol: 'A$', label: 'Dollar (AUD)', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', label: 'Dollar (CAD)', flag: '🇨🇦' },
  { code: 'CHF', symbol: 'Fr', label: 'Franc (CHF)', flag: '🇨🇭' },
  { code: 'HKD', symbol: 'HK$', label: 'Dollar (HKD)', flag: '🇭🇰' },
  { code: 'SGD', symbol: 'S$', label: 'Dollar (SGD)', flag: '🇸🇬' },
  { code: 'TWD', symbol: 'NT$', label: '元 (TWD)', flag: '🇹🇼' },
  { code: 'THB', symbol: '฿', label: 'Baht (THB)', flag: '🇹🇭' },
  { code: 'VND', symbol: '₫', label: 'Dong (VND)', flag: '🇻🇳' },
  { code: 'PHP', symbol: '₱', label: 'Peso (PHP)', flag: '🇵🇭' },
  { code: 'INR', symbol: '₹', label: 'Rupee (INR)', flag: '🇮🇳' },
  { code: 'MYR', symbol: 'RM', label: 'Ringgit (MYR)', flag: '🇲🇾' },
  { code: 'IDR', symbol: 'Rp', label: 'Rupiah (IDR)', flag: '🇮🇩' },
];

const translations: Record<string, Record<string, string>> = {
  ko: {
    // Navigation
    calendar: '달력',
    expenses: '가계부',
    savings: '저금통',
    settings: '설정',
    // Settings
    settingsTitle: '설정',
    income: '수입',
    incomeCount: '개',
    thisMonth: '이번달',
    won: '원',
    fixedExpenses: '고정 지출',
    monthly: '월',
    darkMode: '다크 모드',
    lightMode: '라이트 모드',
    clearData: '데이터 초기화',
    language: '언어',
    currency: '화폐단위',
    add: '+ 추가',
    cancel: '취소',
    delete: '삭제',
    confirm: '확인',
    // Income
    addIncome: '수입 추가',
    incomeType: '수입 유형',
    amount: '금액',
    note: '메모',
    recurring: '매월 반복',
    save: '저장',
    salary: '급여',
    bonus: '보너스',
    freelance: '프리랜서',
    investment: '투자',
    gift: '선물',
    other: '기타',
    noIncome: '등록된 수입이 없습니다',
    // Fixed Expenses
    addFixedExpense: '고정 지출 추가',
    expenseName: '지출명',
    category: '카테고리',
    frequency: '결제 주기',
    monthlyPayment: '매월',
    yearlyPayment: '매년',
    paymentDay: '결제일',
    day: '일',
    subscription: '구독',
    telecom: '통신',
    insurance: '보험',
    housing: '주거',
    transport: '교통',
    noFixedExpense: '등록된 고정 지출이 없습니다',
    // Alerts
    clearDataTitle: '데이터 초기화',
    clearDataMsg: '모든 데이터를 삭제하시겠습니까?',
    clearDataDone: '데이터가 삭제되었습니다. 앱을 재시작하세요.',
    done: '완료',
    alert: '알림',
    enterNameAmount: '이름과 금액을 입력해주세요',
    enterAmount: '금액을 입력해주세요',
    deleteConfirm: '을(를) 삭제하시겠습니까?',
    // Calendar
    today: '오늘',
    sun: '일',
    mon: '월',
    tue: '화',
    wed: '수',
    thu: '목',
    fri: '금',
    sat: '토',
    schedule: '일정',
    expense: '지출',
    // Savings
    savingsTitle: '저금통',
    addGoal: '목표 추가',
    goalName: '목표명',
    targetAmount: '목표 금액',
    goalColor: '목표 색상',
    createGoal: '목표 만들기',
    deposit: '저금하기',
    quickAmount: '빠른 입력',
    tips: '팁',
    milestone: '마일스톤',
    // Tutorial
    tutorialTitle1: '목표를 세워요',
    tutorialDesc1: '여행, 비상금, 선물 등\n나만의 저축 목표를 만들어요',
    tutorialTitle2: '꾸며보세요',
    tutorialDesc2: '아이콘과 색상을 선택해서\n나만의 목표를 만들어요',
    tutorialTitle3: '저금해요',
    tutorialDesc3: '저금하기 버튼을 눌러\n조금씩 모아가요',
    tutorialTitle4: '성장을 지켜봐요',
    tutorialDesc4: '🌱→🌿→🌳→🎉\n마일스톤을 달성해가요',
    createFirstGoal: '첫 목표 만들기',
    // Date formats
    monthOnly: '{month}월',
    monthDay: '{month}월 {day}일',
    yearMonth: '{year}년 {month}월',
    dayWithWeek: '{month}월 {day}일 ({week})',
    monthlyOnDay: '매월 {day}일',
    daysPassed: '{days}일 경과',
    oneTime: '일회성',
    yearly: '매년',
    // PDF Report
    expenseReport: '지출 리포트',
    totalExpenseThisMonth: '이번 달 총 지출',
    expenseCount: '{count}건의 지출',
    detailedHistory: '상세 내역',
    purchase: '구매',
    purchaseItems: '구매 항목',
    noExpenseRecorded: '기록된 지출이 없습니다',
    monthlyAnalysis: '월별 분석',
    totalExpense: '총 지출',
    averageExpense: '평균 지출',
    // Additional UI
    addSchedule: '일정 추가',
    addExpense: '지출 추가',
    goToToday: '오늘로',
    noSchedule: '일정이 없습니다',
    noExpense: '지출이 없습니다',
    total: '총',
    totalAmount: '합계',
    recordExpense: '지출 기록하기',
    addScheduleBtn: '일정 추가하기',
    addItem: '항목 추가',
    itemName: '항목명',
    tempSave: '임시저장',
    tempSaveUpdate: '임시저장 업데이트',
    tempSaved: '임시저장 되었습니다!',
    expenseRecorded: '지출이 기록되었습니다!',
    scheduleAdded: '일정이 추가되었습니다!',
    memoName: '메모 이름',
    noSavedMemo: '저장된 메모가 없습니다',
    newMemo: '새 메모 작성',
    enterItem: '항목을 입력해주세요',
    enterScheduleTitle: '일정 제목을 입력해주세요',
    deleteThis: '삭제',
    deleteScheduleConfirm: '이 일정을 삭제하시겠습니까?',
    deleteExpenseConfirm: '이 지출을 삭제하시겠습니까?',
    deleteMemoConfirm: '이 메모를 삭제하시겠습니까?',
    deleteIncomeConfirm: '수입을 삭제하시겠습니까?',
    deleteFixedConfirm: '을(를) 삭제하시겠습니까?',
    // Add Screen
    addTitle: '추가',
    expenseTab: '지출',
    scheduleTab: '일정',
    purchaseMemo: '구매 메모장',
    enterPurchaseItems: '장보기 항목을 입력하세요',
    quickExpense: '빠른 지출',
    food: '식비',
    cafe: '카페',
    shopping: '쇼핑',
    newSchedule: '새 일정',
    addScheduleToday: '오늘 날짜에 일정을 추가합니다',
    title: '제목',
    time: '시간',
    location: '장소',
    // Settings Screen
    premiumUser: '프리미엄 사용자',
    usingAllFeatures: '모든 기능을 사용 중입니다',
    upgradeToPremium: '프리미엄으로 업그레이드',
    thisMonthRecord: '이번 달 {count}/{max}건 기록',
    useUnlimited: '무제한으로 사용하기',
    monthlyRecurringIncome: '매월 반복 수입',
    addBtn: '추가하기',
    cycle: '주기',
    // Analysis
    incomeLabel: '수입',
    fixedExpenseLabel: '고정지출',
    dailySpending: '일일소비',
    remainingAmount: '남은 금액',
    remainingDaysUsage: '남은 {days}일간 하루 사용 가능',
    categorySpending: '카테고리별 소비',
    monthEndProjection: '월말 예상 잔액',
    reduceSpending: '지출을 줄여야 합니다!',
    lowSavings: '저축 여유가 적습니다',
    goodSavingHabit: '좋은 저축 습관입니다!',
    target: '목표',
    remaining: '남은 금액',
    // Savings Screen
    newSavingGoal: '새 저축 목표',
    selectIcon: '아이콘 선택',
    selectColor: '색상 선택',
    addGoalBtn: '목표 추가',
    depositAmount: '저금할 금액',
    goalAchieved: '목표 달성!',
    remainingAmountLabel: '남은 금액',
    noSavingGoal: '아직 저축 목표가 없습니다',
    addNewGoal: '새 목표를 추가해보세요!',
    newGoalAdd: '새 목표 추가',
    milestoneStart: '시작',
    milestoneMiddle: '중간',
    milestoneAlmost: '거의',
    // Expenses Screen
    viewExpenses: '지출 보기',
    thisMonthAmount: '이번달 {amount}원',
    daily: '일간',
    weekly: '주간',
    monthlyView: '월간',
    noExpenseHistory: '지출 내역이 없습니다',
    financialAnalysis: '재정 분석',
    financialAnalysisSubtitle: '수입·지출·잔액 현황',
    export: '내보내기',
    // Week names
    week1: '첫째주',
    week2: '둘째주',
    week3: '셋째주',
    week4: '넷째주',
    week5: '다섯째주',
    // Premium Modal
    premiumTitle: '프리미엄으로 업그레이드',
    premiumSubtitle: '모든 기능을 제한 없이 사용하세요',
    lifetimeLicense: '평생 이용권 (1회 결제)',
    purchasePremium: '프리미엄 구매하기',
    restorePurchase: '구매 복원하기',
    // Errors
    error: '오류',
    paymentError: '결제 처리 중 오류가 발생했습니다.',
    noPurchaseToRestore: '복원할 구매 내역이 없습니다.',
    restoreError: '복원 중 오류가 발생했습니다.',
    pdfError: 'PDF 생성에 실패했습니다',
    // Categories
    medical: '의료',
    leisure: '여가',
    exercise: '운동',
    // Placeholders
    titleRequired: '제목 *',
    timePlaceholder: '시간 (예: 14:00)',
    locationPlaceholder: '장소',
    locationExample: '예: 강남역',
    scheduleTitlePlaceholder: '일정 제목',
    enterMemoName: '메모 이름을 입력하세요',
    savedMemos: '저장된 메모',
    itemsCount: '{count}개 항목',
    quickExpenseTitle: '{category} 지출',
    quickExpensePrompt: '금액을 입력하세요',
    transactions: '건',
    // Additional keys
    memoOptional: '메모 (선택)',
    incomeExample: '예: 12월 급여',
    expenseNameExample: '예: 넷플릭스, KT 통신비',
    goalNameExample: '예: 여행 자금, 비상금',
    nameLabel: '이름',
    deleteGoalTitle: '목표 삭제',
    deleteGoalConfirm: '"{name}" 목표를 삭제하시겠습니까?',
    savingTip: '목표를 탭하면 저축할 수 있어요.\n삭제는 휴지통 아이콘을 눌러주세요.',
    quickAmountWan: '+{amount}만',
    milestoneDone: '달성!',
  },
  en: {
    // Navigation
    calendar: 'Calendar',
    expenses: 'Expenses',
    savings: 'Savings',
    settings: 'Settings',
    // Settings
    settingsTitle: 'Settings',
    income: 'Income',
    incomeCount: ' items',
    thisMonth: 'This month',
    won: '',
    fixedExpenses: 'Fixed Expenses',
    monthly: 'Monthly',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    clearData: 'Clear Data',
    language: 'Language',
    currency: 'Currency',
    add: '+ Add',
    cancel: 'Cancel',
    delete: 'Delete',
    confirm: 'Confirm',
    // Income
    addIncome: 'Add Income',
    incomeType: 'Income Type',
    amount: 'Amount',
    note: 'Note',
    recurring: 'Monthly recurring',
    save: 'Save',
    salary: 'Salary',
    bonus: 'Bonus',
    freelance: 'Freelance',
    investment: 'Investment',
    gift: 'Gift',
    other: 'Other',
    noIncome: 'No income registered',
    // Fixed Expenses
    addFixedExpense: 'Add Fixed Expense',
    expenseName: 'Expense Name',
    category: 'Category',
    frequency: 'Frequency',
    monthlyPayment: 'Monthly',
    yearlyPayment: 'Yearly',
    paymentDay: 'Payment Day',
    day: '',
    subscription: 'Subscription',
    telecom: 'Telecom',
    insurance: 'Insurance',
    housing: 'Housing',
    transport: 'Transport',
    noFixedExpense: 'No fixed expenses registered',
    // Alerts
    clearDataTitle: 'Clear Data',
    clearDataMsg: 'Delete all data?',
    clearDataDone: 'Data deleted. Please restart the app.',
    done: 'Done',
    alert: 'Alert',
    enterNameAmount: 'Please enter name and amount',
    enterAmount: 'Please enter amount',
    deleteConfirm: 'Delete this item?',
    // Calendar
    today: 'Today',
    sun: 'Sun',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    schedule: 'Schedule',
    expense: 'Expense',
    // Savings
    savingsTitle: 'Savings',
    addGoal: 'Add Goal',
    goalName: 'Goal Name',
    targetAmount: 'Target Amount',
    goalColor: 'Goal Color',
    createGoal: 'Create Goal',
    deposit: 'Deposit',
    quickAmount: 'Quick Amount',
    tips: 'Tips',
    milestone: 'Milestone',
    // Tutorial
    tutorialTitle1: 'Set a Goal',
    tutorialDesc1: 'Create your own savings goal\nfor travel, emergency, gifts, etc.',
    tutorialTitle2: 'Customize',
    tutorialDesc2: 'Choose icons and colors\nto personalize your goal',
    tutorialTitle3: 'Save Money',
    tutorialDesc3: 'Tap the deposit button\nto save little by little',
    tutorialTitle4: 'Watch it Grow',
    tutorialDesc4: '🌱→🌿→🌳→🎉\nReach your milestones',
    createFirstGoal: 'Create First Goal',
    // Date formats
    monthOnly: '{month}',
    monthDay: '{month}/{day}',
    yearMonth: '{month}/{year}',
    dayWithWeek: '{month}/{day} ({week})',
    monthlyOnDay: '{day}th monthly',
    daysPassed: '{days} days passed',
    oneTime: 'One-time',
    yearly: 'Yearly',
    // PDF Report
    expenseReport: 'Expense Report',
    totalExpenseThisMonth: 'Total Expenses This Month',
    expenseCount: '{count} expenses',
    detailedHistory: 'Detailed History',
    purchase: 'Purchase',
    purchaseItems: 'Items Purchased',
    noExpenseRecorded: 'No expenses recorded',
    monthlyAnalysis: 'Monthly Analysis',
    totalExpense: 'Total Expense',
    averageExpense: 'Average Expense',
    // Additional UI
    addSchedule: 'Add Schedule',
    addExpense: 'Add Expense',
    goToToday: 'Today',
    noSchedule: 'No schedules',
    noExpense: 'No expenses',
    total: 'Total',
    totalAmount: 'Total',
    recordExpense: 'Record Expense',
    addScheduleBtn: 'Add Schedule',
    addItem: 'Add Item',
    itemName: 'Item name',
    tempSave: 'Save Draft',
    tempSaveUpdate: 'Update Draft',
    tempSaved: 'Draft saved!',
    expenseRecorded: 'Expense recorded!',
    scheduleAdded: 'Schedule added!',
    memoName: 'Memo Name',
    noSavedMemo: 'No saved memos',
    newMemo: 'New Memo',
    enterItem: 'Please enter an item',
    enterScheduleTitle: 'Please enter a schedule title',
    deleteThis: 'Delete',
    deleteScheduleConfirm: 'Delete this schedule?',
    deleteExpenseConfirm: 'Delete this expense?',
    deleteMemoConfirm: 'Delete this memo?',
    deleteIncomeConfirm: 'Delete this income?',
    deleteFixedConfirm: 'Delete this item?',
    // Add Screen
    addTitle: 'Add',
    expenseTab: 'Expense',
    scheduleTab: 'Schedule',
    purchaseMemo: 'Shopping Memo',
    enterPurchaseItems: 'Enter shopping items',
    quickExpense: 'Quick Expense',
    food: 'Food',
    cafe: 'Cafe',
    shopping: 'Shopping',
    newSchedule: 'New Schedule',
    addScheduleToday: 'Add schedule for today',
    title: 'Title',
    time: 'Time',
    location: 'Location',
    // Settings Screen
    premiumUser: 'Premium User',
    usingAllFeatures: 'Using all features',
    upgradeToPremium: 'Upgrade to Premium',
    thisMonthRecord: 'This month {count}/{max} records',
    useUnlimited: 'Use unlimited',
    monthlyRecurringIncome: 'Monthly recurring income',
    addBtn: 'Add',
    cycle: 'Cycle',
    // Analysis
    incomeLabel: 'Income',
    fixedExpenseLabel: 'Fixed',
    dailySpending: 'Daily',
    remainingAmount: 'Remaining',
    remainingDaysUsage: 'Daily budget for {days} days',
    categorySpending: 'Spending by Category',
    monthEndProjection: 'Month-end Projection',
    reduceSpending: 'Reduce spending!',
    lowSavings: 'Low savings margin',
    goodSavingHabit: 'Good saving habit!',
    target: 'Target',
    remaining: 'Remaining',
    // Savings Screen
    newSavingGoal: 'New Saving Goal',
    selectIcon: 'Select Icon',
    selectColor: 'Select Color',
    addGoalBtn: 'Add Goal',
    depositAmount: 'Deposit Amount',
    goalAchieved: 'Goal Achieved!',
    remainingAmountLabel: 'Remaining',
    noSavingGoal: 'No saving goals yet',
    addNewGoal: 'Add a new goal!',
    newGoalAdd: 'Add New Goal',
    milestoneStart: 'Start',
    milestoneMiddle: 'Half',
    milestoneAlmost: 'Almost',
    // Expenses Screen
    viewExpenses: 'View Expenses',
    thisMonthAmount: 'This month {amount}',
    daily: 'Daily',
    weekly: 'Weekly',
    monthlyView: 'Monthly',
    noExpenseHistory: 'No expense history',
    financialAnalysis: 'Financial Analysis',
    financialAnalysisSubtitle: 'Income, Expenses & Balance',
    export: 'Export',
    // Week names
    week1: 'Week 1',
    week2: 'Week 2',
    week3: 'Week 3',
    week4: 'Week 4',
    week5: 'Week 5',
    // Premium Modal
    premiumTitle: 'Upgrade to Premium',
    premiumSubtitle: 'Use all features without limits',
    lifetimeLicense: 'Lifetime License (One-time)',
    purchasePremium: 'Purchase Premium',
    restorePurchase: 'Restore Purchase',
    // Errors
    error: 'Error',
    paymentError: 'Payment processing error.',
    noPurchaseToRestore: 'No purchase to restore.',
    restoreError: 'Restore error.',
    pdfError: 'PDF generation failed',
    // Categories
    medical: 'Medical',
    leisure: 'Leisure',
    exercise: 'Exercise',
    // Placeholders
    titleRequired: 'Title *',
    timePlaceholder: 'Time (e.g. 14:00)',
    locationPlaceholder: 'Location',
    locationExample: 'e.g. Downtown',
    scheduleTitlePlaceholder: 'Schedule title',
    enterMemoName: 'Enter memo name',
    savedMemos: 'Saved Memos',
    itemsCount: '{count} items',
    quickExpenseTitle: '{category} Expense',
    quickExpensePrompt: 'Enter amount',
    transactions: '',
    // Additional keys
    memoOptional: 'Memo (optional)',
    incomeExample: 'e.g. December salary',
    expenseNameExample: 'e.g. Netflix, Phone bill',
    goalNameExample: 'e.g. Travel fund, Emergency',
    nameLabel: 'Name',
    deleteGoalTitle: 'Delete Goal',
    deleteGoalConfirm: 'Delete "{name}" goal?',
    savingTip: 'Tap a goal to save money.\nTap trash icon to delete.',
    quickAmountWan: '+{amount}0K',
    milestoneDone: 'Done!',
  },
  ja: {
    // Navigation
    calendar: 'カレンダー',
    expenses: '家計簿',
    savings: '貯金箱',
    settings: '設定',
    // Settings
    settingsTitle: '設定',
    income: '収入',
    incomeCount: '件',
    thisMonth: '今月',
    won: '円',
    fixedExpenses: '固定支出',
    monthly: '月',
    darkMode: 'ダークモード',
    lightMode: 'ライトモード',
    clearData: 'データ初期化',
    language: '言語',
    currency: '通貨',
    add: '+ 追加',
    cancel: 'キャンセル',
    delete: '削除',
    confirm: '確認',
    // Income
    addIncome: '収入追加',
    incomeType: '収入タイプ',
    amount: '金額',
    note: 'メモ',
    recurring: '毎月繰り返し',
    save: '保存',
    salary: '給与',
    bonus: 'ボーナス',
    freelance: 'フリーランス',
    investment: '投資',
    gift: 'プレゼント',
    other: 'その他',
    noIncome: '登録された収入がありません',
    // Fixed Expenses
    addFixedExpense: '固定支出追加',
    expenseName: '支出名',
    category: 'カテゴリー',
    frequency: '支払い周期',
    monthlyPayment: '毎月',
    yearlyPayment: '毎年',
    paymentDay: '支払日',
    day: '日',
    subscription: 'サブスク',
    telecom: '通信',
    insurance: '保険',
    housing: '住居',
    transport: '交通',
    noFixedExpense: '登録された固定支出がありません',
    // Alerts
    clearDataTitle: 'データ初期化',
    clearDataMsg: 'すべてのデータを削除しますか？',
    clearDataDone: 'データが削除されました。アプリを再起動してください。',
    done: '完了',
    alert: 'お知らせ',
    enterNameAmount: '名前と金額を入力してください',
    enterAmount: '金額を入力してください',
    deleteConfirm: 'を削除しますか？',
    // Calendar
    today: '今日',
    sun: '日',
    mon: '月',
    tue: '火',
    wed: '水',
    thu: '木',
    fri: '金',
    sat: '土',
    schedule: '予定',
    expense: '支出',
    // Savings
    savingsTitle: '貯金箱',
    addGoal: '目標追加',
    goalName: '目標名',
    targetAmount: '目標金額',
    goalColor: '目標の色',
    createGoal: '目標を作る',
    deposit: '貯金する',
    quickAmount: 'クイック入力',
    tips: 'ヒント',
    milestone: 'マイルストーン',
    // Tutorial
    tutorialTitle1: '目標を立てよう',
    tutorialDesc1: '旅行、緊急資金、プレゼントなど\n自分だけの貯金目標を作ろう',
    tutorialTitle2: 'カスタマイズ',
    tutorialDesc2: 'アイコンと色を選んで\n自分だけの目標を作ろう',
    tutorialTitle3: '貯金しよう',
    tutorialDesc3: '貯金ボタンを押して\n少しずつ貯めよう',
    tutorialTitle4: '成長を見守ろう',
    tutorialDesc4: '🌱→🌿→🌳→🎉\nマイルストーンを達成しよう',
    createFirstGoal: '最初の目標を作る',
    // Date formats
    monthOnly: '{month}月',
    monthDay: '{month}月{day}日',
    yearMonth: '{year}年{month}月',
    dayWithWeek: '{month}月{day}日 ({week})',
    monthlyOnDay: '毎月{day}日',
    daysPassed: '{days}日経過',
    oneTime: '一回',
    yearly: '毎年',
    // PDF Report
    expenseReport: '支出レポート',
    totalExpenseThisMonth: '今月の総支出',
    expenseCount: '{count}件の支出',
    detailedHistory: '詳細履歴',
    purchase: '購入',
    purchaseItems: '購入品目',
    noExpenseRecorded: '記録された支出はありません',
    monthlyAnalysis: '月別分析',
    totalExpense: '総支出',
    averageExpense: '平均支出',
    // Additional UI
    addSchedule: '予定追加',
    addExpense: '支出追加',
    goToToday: '今日へ',
    noSchedule: '予定がありません',
    noExpense: '支出がありません',
    total: '合計',
    totalAmount: '合計',
    recordExpense: '支出を記録',
    addScheduleBtn: '予定を追加',
    addItem: '項目追加',
    itemName: '項目名',
    tempSave: '一時保存',
    tempSaveUpdate: '一時保存更新',
    tempSaved: '一時保存しました！',
    expenseRecorded: '支出を記録しました！',
    scheduleAdded: '予定を追加しました！',
    memoName: 'メモ名',
    noSavedMemo: '保存されたメモがありません',
    newMemo: '新規メモ',
    enterItem: '項目を入力してください',
    enterScheduleTitle: '予定タイトルを入力してください',
    deleteThis: '削除',
    deleteScheduleConfirm: 'この予定を削除しますか？',
    deleteExpenseConfirm: 'この支出を削除しますか？',
    deleteMemoConfirm: 'このメモを削除しますか？',
    deleteIncomeConfirm: 'この収入を削除しますか？',
    deleteFixedConfirm: 'を削除しますか？',
    addTitle: '追加',
    expenseTab: '支出',
    scheduleTab: '予定',
    purchaseMemo: '買い物メモ',
    enterPurchaseItems: '買い物リストを入力',
    quickExpense: 'クイック支出',
    food: '食費',
    cafe: 'カフェ',
    shopping: '買い物',
    newSchedule: '新規予定',
    addScheduleToday: '今日の予定を追加',
    title: 'タイトル',
    time: '時間',
    location: '場所',
    premiumUser: 'プレミアムユーザー',
    usingAllFeatures: 'すべての機能を利用中',
    upgradeToPremium: 'プレミアムにアップグレード',
    thisMonthRecord: '今月 {count}/{max}件記録',
    useUnlimited: '無制限で使用',
    monthlyRecurringIncome: '毎月の繰り返し収入',
    addBtn: '追加',
    cycle: '周期',
    incomeLabel: '収入',
    fixedExpenseLabel: '固定支出',
    dailySpending: '日常支出',
    remainingAmount: '残り',
    remainingDaysUsage: '残り{days}日の1日予算',
    categorySpending: 'カテゴリ別支出',
    monthEndProjection: '月末予想',
    reduceSpending: '支出を減らしましょう！',
    lowSavings: '貯蓄余裕が少ない',
    goodSavingHabit: '良い貯蓄習慣です！',
    target: '目標',
    remaining: '残り',
    newSavingGoal: '新規貯金目標',
    selectIcon: 'アイコン選択',
    selectColor: '色選択',
    addGoalBtn: '目標追加',
    depositAmount: '貯金額',
    goalAchieved: '目標達成！',
    remainingAmountLabel: '残り',
    noSavingGoal: 'まだ貯金目標がありません',
    addNewGoal: '新しい目標を追加しましょう！',
    newGoalAdd: '新規目標追加',
    milestoneStart: '開始',
    milestoneMiddle: '中間',
    milestoneAlmost: 'もう少し',
    viewExpenses: '支出を見る',
    thisMonthAmount: '今月 {amount}円',
    daily: '日別',
    weekly: '週別',
    monthlyView: '月別',
    noExpenseHistory: '支出履歴がありません',
    financialAnalysis: '財務分析',
    financialAnalysisSubtitle: '収入・支出・残高',
    export: 'エクスポート',
    week1: '第1週',
    week2: '第2週',
    week3: '第3週',
    week4: '第4週',
    week5: '第5週',
    premiumTitle: 'プレミアムにアップグレード',
    premiumSubtitle: 'すべての機能を制限なく使用',
    lifetimeLicense: '永久ライセンス（1回払い）',
    purchasePremium: 'プレミアム購入',
    restorePurchase: '購入を復元',
    error: 'エラー',
    paymentError: '決済処理エラー',
    noPurchaseToRestore: '復元する購入がありません',
    restoreError: '復元エラー',
    pdfError: 'PDF生成に失敗しました',
    medical: '医療',
    leisure: 'レジャー',
    exercise: '運動',
    // Placeholders
    titleRequired: 'タイトル *',
    timePlaceholder: '時間 (例: 14:00)',
    locationPlaceholder: '場所',
    locationExample: '例: 渋谷駅',
    scheduleTitlePlaceholder: '予定のタイトル',
    enterMemoName: 'メモ名を入力してください',
    savedMemos: '保存されたメモ',
    itemsCount: '{count}件',
    quickExpenseTitle: '{category}支出',
    quickExpensePrompt: '金額を入力してください',
    transactions: '件',
    // Additional keys
    memoOptional: 'メモ (任意)',
    incomeExample: '例: 12月給与',
    expenseNameExample: '例: Netflix、通信費',
    goalNameExample: '例: 旅行資金、緊急資金',
    nameLabel: '名前',
    deleteGoalTitle: '目標削除',
    deleteGoalConfirm: '「{name}」目標を削除しますか？',
    savingTip: '目標をタップして貯金できます。\nゴミ箱アイコンで削除できます。',
    quickAmountWan: '+{amount}万',
    milestoneDone: '達成！',
  },
  zh: {
    // Navigation
    calendar: '日历',
    expenses: '账本',
    savings: '储蓄罐',
    settings: '设置',
    // Settings
    settingsTitle: '设置',
    income: '收入',
    incomeCount: '个',
    thisMonth: '本月',
    won: '元',
    fixedExpenses: '固定支出',
    monthly: '月',
    darkMode: '深色模式',
    lightMode: '浅色模式',
    clearData: '清除数据',
    language: '语言',
    currency: '货币',
    add: '+ 添加',
    cancel: '取消',
    delete: '删除',
    confirm: '确认',
    // Income
    addIncome: '添加收入',
    incomeType: '收入类型',
    amount: '金额',
    note: '备注',
    recurring: '每月重复',
    save: '保存',
    salary: '工资',
    bonus: '奖金',
    freelance: '自由职业',
    investment: '投资',
    gift: '礼物',
    other: '其他',
    noIncome: '没有登记的收入',
    // Fixed Expenses
    addFixedExpense: '添加固定支出',
    expenseName: '支出名称',
    category: '类别',
    frequency: '付款周期',
    monthlyPayment: '每月',
    yearlyPayment: '每年',
    paymentDay: '付款日',
    day: '日',
    subscription: '订阅',
    telecom: '通讯',
    insurance: '保险',
    housing: '住房',
    transport: '交通',
    noFixedExpense: '没有登记的固定支出',
    // Alerts
    clearDataTitle: '清除数据',
    clearDataMsg: '删除所有数据吗？',
    clearDataDone: '数据已删除。请重启应用。',
    done: '完成',
    alert: '提示',
    enterNameAmount: '请输入名称和金额',
    enterAmount: '请输入金额',
    deleteConfirm: '要删除吗？',
    // Calendar
    today: '今天',
    sun: '日',
    mon: '一',
    tue: '二',
    wed: '三',
    thu: '四',
    fri: '五',
    sat: '六',
    schedule: '日程',
    expense: '支出',
    // Savings
    savingsTitle: '储蓄罐',
    addGoal: '添加目标',
    goalName: '目标名称',
    targetAmount: '目标金额',
    goalColor: '目标颜色',
    createGoal: '创建目标',
    deposit: '存钱',
    quickAmount: '快速输入',
    tips: '提示',
    milestone: '里程碑',
    // Tutorial
    tutorialTitle1: '设立目标',
    tutorialDesc1: '为旅行、应急资金、礼物等\n创建自己的储蓄目标',
    tutorialTitle2: '个性化',
    tutorialDesc2: '选择图标和颜色\n创建专属目标',
    tutorialTitle3: '存钱',
    tutorialDesc3: '点击存钱按钮\n一点一点积累',
    tutorialTitle4: '看着它成长',
    tutorialDesc4: '🌱→🌿→🌳→🎉\n达成里程碑',
    createFirstGoal: '创建第一个目标',
    // Date formats
    monthOnly: '{month}月',
    monthDay: '{month}月{day}日',
    yearMonth: '{year}年{month}月',
    dayWithWeek: '{month}月{day}日 ({week})',
    monthlyOnDay: '每月{day}日',
    daysPassed: '{days}天过去',
    oneTime: '一次性',
    yearly: '每年',
    // PDF Report
    expenseReport: '支出报告',
    totalExpenseThisMonth: '本月总支出',
    expenseCount: '{count}笔支出',
    detailedHistory: '详细记录',
    purchase: '购买',
    purchaseItems: '购买项目',
    noExpenseRecorded: '没有记录的支出',
    monthlyAnalysis: '月度分析',
    totalExpense: '总支出',
    averageExpense: '平均支出',
    // Additional UI
    addSchedule: '添加日程',
    addExpense: '添加支出',
    goToToday: '今天',
    noSchedule: '没有日程',
    noExpense: '没有支出',
    total: '总计',
    totalAmount: '合计',
    recordExpense: '记录支出',
    addScheduleBtn: '添加日程',
    addItem: '添加项目',
    itemName: '项目名',
    tempSave: '临时保存',
    tempSaveUpdate: '更新保存',
    tempSaved: '临时保存成功！',
    expenseRecorded: '支出已记录！',
    scheduleAdded: '日程已添加！',
    memoName: '备忘录名称',
    noSavedMemo: '没有保存的备忘录',
    newMemo: '新建备忘录',
    enterItem: '请输入项目',
    enterScheduleTitle: '请输入日程标题',
    deleteThis: '删除',
    deleteScheduleConfirm: '删除此日程？',
    deleteExpenseConfirm: '删除此支出？',
    deleteMemoConfirm: '删除此备忘录？',
    deleteIncomeConfirm: '删除此收入？',
    deleteFixedConfirm: '删除此项目？',
    addTitle: '添加',
    expenseTab: '支出',
    scheduleTab: '日程',
    purchaseMemo: '购物备忘录',
    enterPurchaseItems: '输入购物清单',
    quickExpense: '快速支出',
    food: '餐饮',
    cafe: '咖啡',
    shopping: '购物',
    newSchedule: '新日程',
    addScheduleToday: '添加今天的日程',
    title: '标题',
    time: '时间',
    location: '地点',
    premiumUser: '高级用户',
    usingAllFeatures: '正在使用所有功能',
    upgradeToPremium: '升级到高级版',
    thisMonthRecord: '本月 {count}/{max} 条记录',
    useUnlimited: '无限使用',
    monthlyRecurringIncome: '每月重复收入',
    addBtn: '添加',
    cycle: '周期',
    incomeLabel: '收入',
    fixedExpenseLabel: '固定支出',
    dailySpending: '日常支出',
    remainingAmount: '剩余',
    remainingDaysUsage: '剩余{days}天的日预算',
    categorySpending: '分类支出',
    monthEndProjection: '月末预测',
    reduceSpending: '需要减少支出！',
    lowSavings: '储蓄余地较少',
    goodSavingHabit: '良好的储蓄习惯！',
    target: '目标',
    remaining: '剩余',
    newSavingGoal: '新储蓄目标',
    selectIcon: '选择图标',
    selectColor: '选择颜色',
    addGoalBtn: '添加目标',
    depositAmount: '存款金额',
    goalAchieved: '目标达成！',
    remainingAmountLabel: '剩余',
    noSavingGoal: '还没有储蓄目标',
    addNewGoal: '添加新目标！',
    newGoalAdd: '添加新目标',
    milestoneStart: '开始',
    milestoneMiddle: '一半',
    milestoneAlmost: '快了',
    viewExpenses: '查看支出',
    thisMonthAmount: '本月 {amount}元',
    daily: '日',
    weekly: '周',
    monthlyView: '月',
    noExpenseHistory: '没有支出记录',
    financialAnalysis: '财务分析',
    financialAnalysisSubtitle: '收入·支出·余额',
    export: '导出',
    week1: '第一周',
    week2: '第二周',
    week3: '第三周',
    week4: '第四周',
    week5: '第五周',
    premiumTitle: '升级到高级版',
    premiumSubtitle: '无限制使用所有功能',
    lifetimeLicense: '终身许可（一次性付款）',
    purchasePremium: '购买高级版',
    restorePurchase: '恢复购买',
    error: '错误',
    paymentError: '支付处理错误',
    noPurchaseToRestore: '没有可恢复的购买',
    restoreError: '恢复错误',
    pdfError: 'PDF生成失败',
    medical: '医疗',
    leisure: '休闲',
    exercise: '运动',
    // Placeholders
    titleRequired: '标题 *',
    timePlaceholder: '时间 (例: 14:00)',
    locationPlaceholder: '地点',
    locationExample: '例: 市中心',
    scheduleTitlePlaceholder: '日程标题',
    enterMemoName: '请输入备忘名称',
    savedMemos: '已保存的备忘',
    itemsCount: '{count}个项目',
    quickExpenseTitle: '{category}支出',
    quickExpensePrompt: '请输入金额',
    transactions: '笔',
    // Additional keys
    memoOptional: '备注（可选）',
    incomeExample: '例: 12月工资',
    expenseNameExample: '例: Netflix、话费',
    goalNameExample: '例: 旅行基金、应急资金',
    nameLabel: '名称',
    deleteGoalTitle: '删除目标',
    deleteGoalConfirm: '删除"{name}"目标？',
    savingTip: '点击目标可以存钱。\n点击垃圾桶图标删除。',
    quickAmountWan: '+{amount}万',
    milestoneDone: '完成！',
  },
};

const getTranslation = (lang: string, key: string): string => {
  return translations[lang]?.[key] || translations['ko'][key] || key;
};

const formatTranslation = (lang: string, key: string, values: Record<string, string | number>): string => {
  let result = getTranslation(lang, key);
  Object.entries(values).forEach(([k, v]) => {
    result = result.replace(`{${k}}`, String(v));
  });
  return result;
};

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

// ============ PREMIUM CONTEXT ============
const PremiumContext = createContext<{
  isPremium: boolean;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  purchasePremium: () => void;
  restorePurchase: () => void;
}>({ isPremium: false, showUpgradeModal: false, setShowUpgradeModal: () => {}, purchasePremium: () => {}, restorePurchase: () => {} });

function PremiumProvider({ children }: { children: React.ReactNode }) {
  // TODO: 출시 시 false로 변경
  const [isPremium, setIsPremium] = useState(true); // 개발 중 모든 기능 활성화
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => { loadPremiumStatus(); }, []);

  const loadPremiumStatus = async () => {
    try {
      const status = await AsyncStorage.getItem('@mohani_premium');
      if (status === 'true') setIsPremium(true);
    } catch (e) {}
  };

  const purchasePremium = async () => {
    // TODO: 실제 인앱 결제 연동 (react-native-iap 또는 RevenueCat)
    // 지금은 테스트용으로 바로 프리미엄 활성화
    try {
      await AsyncStorage.setItem('@mohani_premium', 'true');
      setIsPremium(true);
      setShowUpgradeModal(false);
      Alert.alert('🎉 프리미엄 활성화', '모든 프리미엄 기능을 사용할 수 있습니다!');
    } catch (e) {
      Alert.alert('오류', '결제 처리 중 오류가 발생했습니다.');
    }
  };

  const restorePurchase = async () => {
    // TODO: 실제 구매 복원 로직
    try {
      const status = await AsyncStorage.getItem('@mohani_premium');
      if (status === 'true') {
        setIsPremium(true);
        Alert.alert('복원 완료', '프리미엄 구매가 복원되었습니다.');
      } else {
        Alert.alert('알림', '복원할 구매 내역이 없습니다.');
      }
    } catch (e) {
      Alert.alert('오류', '복원 중 오류가 발생했습니다.');
    }
  };

  return (
    <PremiumContext.Provider value={{ isPremium, showUpgradeModal, setShowUpgradeModal, purchasePremium, restorePurchase }}>
      {children}
    </PremiumContext.Provider>
  );
}

const usePremium = () => useContext(PremiumContext);

// ============ EXPENSE CONTEXT ============
const ExpenseContext = createContext<{
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  getExpensesByDate: (date: string) => Expense[];
  getDatesWithExpenses: () => string[];
}>({ expenses: [], addExpense: () => {}, deleteExpense: () => {}, getExpensesByDate: () => [], getDatesWithExpenses: () => [] });

function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => { loadExpenses(); }, []);
  useEffect(() => { if (isLoaded) saveExpenses(); }, [expenses]);

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
          { id: '4', date: `${y}-${m}-${String(Math.max(1, d-2)).padStart(2, '0')}`, category: '구매', amount: 67000, memo: '이마트', items: [
            { name: '삼겹살 600g', amount: 18000, checked: true },
            { name: '쌀 10kg', amount: 32000, checked: true },
            { name: '계란 30구', amount: 8500, checked: true },
          ]},
          { id: '5', date: `${y}-${m}-05`, category: '통신', amount: 55000, memo: 'KT 요금' },
          { id: '6', date: `${y}-${m}-10`, category: '구독', amount: 17000, memo: '넷플릭스' },
          { id: '7', date: `${y}-${m}-15`, category: '의료', amount: 25000, memo: '병원' },
        ]);
      }
      setIsLoaded(true);
    } catch (e) { console.log('Failed to load expenses'); setIsLoaded(true); }
  };

  const saveExpenses = async () => {
    try { await AsyncStorage.setItem('@mohani_expenses', JSON.stringify(expenses)); } catch (e) {}
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => [...prev, { ...expense, id: Date.now().toString() }]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const getExpensesByDate = (date: string) => expenses.filter(e => e.date === date);
  const getDatesWithExpenses = () => [...new Set(expenses.map(e => e.date))];

  return (
    <ExpenseContext.Provider value={{ expenses, addExpense, deleteExpense, getExpensesByDate, getDatesWithExpenses }}>
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

// ============ RECURRING EXPENSE CONTEXT ============
interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: 'monthly' | 'yearly';
  dayOfMonth: number;
  isActive: boolean;
  createdAt: string;
}

const RecurringContext = createContext<{
  recurringExpenses: RecurringExpense[];
  addRecurring: (expense: Omit<RecurringExpense, 'id' | 'createdAt' | 'isActive'>) => void;
  updateRecurring: (id: string, updates: Partial<RecurringExpense>) => void;
  deleteRecurring: (id: string) => void;
  toggleActive: (id: string) => void;
  getTotalMonthly: () => number;
  getUpcoming: (days?: number) => { expense: RecurringExpense; dueDate: Date; daysUntil: number }[];
  processRecurringForDate: (date: string, addExpense: (expense: Omit<Expense, 'id'>) => void) => void;
  getRecurringForDate: (date: string) => RecurringExpense[];
}>({
  recurringExpenses: [],
  addRecurring: () => {},
  updateRecurring: () => {},
  deleteRecurring: () => {},
  toggleActive: () => {},
  getTotalMonthly: () => 0,
  getUpcoming: () => [],
  processRecurringForDate: () => {},
  getRecurringForDate: () => [],
});

function RecurringProvider({ children }: { children: React.ReactNode }) {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [processedEntries, setProcessedEntries] = useState<{ recurringId: string; date: string }[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => { loadRecurring(); }, []);
  useEffect(() => { if (isLoaded) saveRecurring(); }, [recurringExpenses, processedEntries]);

  const loadRecurring = async () => {
    try {
      const data = await AsyncStorage.getItem('@mohani_recurring');
      const processed = await AsyncStorage.getItem('@mohani_recurring_processed');
      if (data) {
        setRecurringExpenses(JSON.parse(data));
      } else {
        // 샘플 고정지출 데이터
        const today = new Date().toISOString().split('T')[0];
        setRecurringExpenses([
          { id: '1', name: '월세', amount: 500000, category: '주거', frequency: 'monthly', dayOfMonth: 1, isActive: true, createdAt: today },
          { id: '2', name: '통신비', amount: 55000, category: '통신', frequency: 'monthly', dayOfMonth: 5, isActive: true, createdAt: today },
          { id: '3', name: '보험료', amount: 100000, category: '보험', frequency: 'monthly', dayOfMonth: 10, isActive: true, createdAt: today },
          { id: '4', name: '넷플릭스', amount: 17000, category: '구독', frequency: 'monthly', dayOfMonth: 15, isActive: true, createdAt: today },
          { id: '5', name: '헬스장', amount: 80000, category: '운동', frequency: 'monthly', dayOfMonth: 1, isActive: true, createdAt: today },
        ]);
      }
      if (processed) setProcessedEntries(JSON.parse(processed));
      setIsLoaded(true);
    } catch (e) { setIsLoaded(true); }
  };

  const saveRecurring = async () => {
    try {
      await AsyncStorage.setItem('@mohani_recurring', JSON.stringify(recurringExpenses));
      await AsyncStorage.setItem('@mohani_recurring_processed', JSON.stringify(processedEntries));
    } catch (e) {}
  };

  const addRecurring = (expense: Omit<RecurringExpense, 'id' | 'createdAt' | 'isActive'>) => {
    const newExpense: RecurringExpense = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    setRecurringExpenses(prev => [newExpense, ...prev]);
  };

  const updateRecurring = (id: string, updates: Partial<RecurringExpense>) => {
    setRecurringExpenses(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteRecurring = (id: string) => {
    setRecurringExpenses(prev => prev.filter(item => item.id !== id));
  };

  const toggleActive = (id: string) => {
    setRecurringExpenses(prev => prev.map(item => item.id === id ? { ...item, isActive: !item.isActive } : item));
  };

  const getTotalMonthly = () => {
    return recurringExpenses
      .filter(e => e.isActive)
      .reduce((sum, e) => {
        if (e.frequency === 'yearly') return sum + Math.round(e.amount / 12);
        return sum + e.amount;
      }, 0);
  };

  const getUpcoming = (days: number = 7) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return recurringExpenses
      .filter(e => e.isActive)
      .map(expense => {
        const dueDate = new Date(today);
        const targetDay = expense.dayOfMonth;
        const currentDay = today.getDate();

        if (expense.frequency === 'monthly') {
          if (currentDay > targetDay) {
            dueDate.setMonth(dueDate.getMonth() + 1);
          }
          dueDate.setDate(Math.min(targetDay, new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate()));
        } else {
          // yearly - use createdAt month
          const created = new Date(expense.createdAt);
          dueDate.setMonth(created.getMonth());
          dueDate.setDate(targetDay);
          if (dueDate <= today) dueDate.setFullYear(dueDate.getFullYear() + 1);
        }

        const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { expense, dueDate, daysUntil };
      })
      .filter(item => item.daysUntil >= 0 && item.daysUntil <= days)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  };

  const getRecurringForDate = (date: string): RecurringExpense[] => {
    const [year, month, day] = date.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const dayOfMonth = targetDate.getDate();
    const monthOfYear = targetDate.getMonth();

    return recurringExpenses.filter(e => {
      if (!e.isActive) return false;
      if (e.frequency === 'monthly') {
        return e.dayOfMonth === dayOfMonth;
      } else {
        // yearly - check month and day
        const created = new Date(e.createdAt);
        return created.getMonth() === monthOfYear && e.dayOfMonth === dayOfMonth;
      }
    });
  };

  const processRecurringForDate = (date: string, addExpense: (expense: Omit<Expense, 'id'>) => void) => {
    const recurring = getRecurringForDate(date);

    recurring.forEach(expense => {
      const isProcessed = processedEntries.some(
        entry => entry.recurringId === expense.id && entry.date === date
      );

      if (!isProcessed) {
        addExpense({
          date,
          category: expense.category,
          amount: expense.amount,
          memo: `[고정] ${expense.name}`,
        });
        setProcessedEntries(prev => [...prev, { recurringId: expense.id, date }]);
      }
    });
  };

  return (
    <RecurringContext.Provider value={{ recurringExpenses, addRecurring, updateRecurring, deleteRecurring, toggleActive, getTotalMonthly, getUpcoming, processRecurringForDate, getRecurringForDate }}>
      {children}
    </RecurringContext.Provider>
  );
}

const useRecurring = () => useContext(RecurringContext);

// ============ INCOME CONTEXT ============
interface Income {
  id: string;
  amount: number;
  source: string;
  type: 'salary' | 'bonus' | 'freelance' | 'investment' | 'gift' | 'other';
  date: string;
  note?: string;
  isRecurring: boolean;
  recurringDay?: number;
}

const INCOME_TYPES = [
  { id: 'salary', label: '급여', icon: 'briefcase' },
  { id: 'bonus', label: '보너스', icon: 'gift' },
  { id: 'freelance', label: '프리랜서', icon: 'laptop' },
  { id: 'investment', label: '투자 수익', icon: 'trending-up' },
  { id: 'gift', label: '용돈/선물', icon: 'heart' },
  { id: 'other', label: '기타', icon: 'cash' },
] as const;

const IncomeContext = createContext<{
  incomes: Income[];
  addIncome: (income: Omit<Income, 'id'>) => void;
  updateIncome: (id: string, updates: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  getMonthlyIncome: () => number;
  getTotalIncomeThisMonth: () => number;
}>({
  incomes: [],
  addIncome: () => {},
  updateIncome: () => {},
  deleteIncome: () => {},
  getMonthlyIncome: () => 0,
  getTotalIncomeThisMonth: () => 0,
});

function IncomeProvider({ children }: { children: React.ReactNode }) {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => { loadIncomes(); }, []);
  useEffect(() => { if (isLoaded) saveIncomes(); }, [incomes]);

  const loadIncomes = async () => {
    try {
      const data = await AsyncStorage.getItem('@mohani_incomes');
      if (data) {
        setIncomes(JSON.parse(data));
      } else {
        // 샘플 수입 데이터
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        setIncomes([
          { id: '1', amount: 3000000, source: '월급', type: 'salary', date: `${y}-${m}-25`, isRecurring: true, recurringDay: 25 },
          { id: '2', amount: 500000, source: '부업', type: 'freelance', date: `${y}-${m}-15`, isRecurring: false },
        ]);
      }
      setIsLoaded(true);
    } catch (e) { setIsLoaded(true); }
  };

  const saveIncomes = async () => {
    try {
      await AsyncStorage.setItem('@mohani_incomes', JSON.stringify(incomes));
    } catch (e) {}
  };

  const addIncome = (income: Omit<Income, 'id'>) => {
    const newIncome: Income = {
      ...income,
      id: Date.now().toString(),
    };
    setIncomes(prev => [newIncome, ...prev]);
  };

  const updateIncome = (id: string, updates: Partial<Income>) => {
    setIncomes(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteIncome = (id: string) => {
    setIncomes(prev => prev.filter(item => item.id !== id));
  };

  const getMonthlyIncome = () => {
    return incomes
      .filter(income => income.isRecurring)
      .reduce((sum, income) => sum + income.amount, 0);
  };

  const getTotalIncomeThisMonth = () => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return incomes
      .filter(income => income.date.startsWith(thisMonth))
      .reduce((sum, income) => sum + income.amount, 0);
  };

  return (
    <IncomeContext.Provider value={{ incomes, addIncome, updateIncome, deleteIncome, getMonthlyIncome, getTotalIncomeThisMonth }}>
      {children}
    </IncomeContext.Provider>
  );
}

const useIncome = () => useContext(IncomeContext);

// ============ CALENDAR SCREEN ============
function CalendarScreen() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [showDetail, setShowDetail] = useState(false);
  const { expenses, addExpense, deleteExpense, getExpensesByDate, getDatesWithExpenses } = useExpenses();
  const { schedules, addSchedule, getSchedulesByDate, getDatesWithSchedules, deleteSchedule } = useSchedules();
  const { processRecurringForDate, getRecurringForDate } = useRecurring();
  const { colors } = useTheme();
  const { isPremium, setShowUpgradeModal } = usePremium();
  const { settings } = useSettings();
  const t = (key: string) => getTranslation(settings.language, key);
  const tf = (key: string, values: Record<string, string | number>) => formatTranslation(settings.language, key, values);
  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || '₩';

  // 오늘 날짜의 고정 지출 자동 처리
  useEffect(() => {
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    processRecurringForDate(todayStr, addExpense);
  }, []);

  // Month navigation (프리미엄 기능)
  const goToPrevMonth = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDate(1);
  };

  const goToNextMonth = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedDate(1);
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(today.getDate());
  };

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  // Add modals state
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [newScheduleTime, setNewScheduleTime] = useState('');
  const [newScheduleLocation, setNewScheduleLocation] = useState('');
  const [expenseItems, setExpenseItems] = useState([{ id: 1, name: '', amount: '', checked: false }]);
  const expenseTotal = expenseItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);

  // Expanded expenses state
  const [expandedExpenses, setExpandedExpenses] = useState<Set<string>>(new Set());

  // Focus state for new items
  const [focusedItemId, setFocusedItemId] = useState<number | null>(null);

  // 날짜별 메모 state
  const [dateMemos, setDateMemos] = useState<{id: number; name: string; items: typeof expenseItems}[]>([]);
  const [showSavedMemos, setShowSavedMemos] = useState(false);
  const [showMemoName, setShowMemoName] = useState(false);
  const [memoName, setMemoName] = useState('');
  const [currentMemoId, setCurrentMemoId] = useState<number | null>(null);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const expenseDates = getDatesWithExpenses();
  const scheduleDates = getDatesWithSchedules();

  const getDateString = (day: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const selectedDateStr = getDateString(selectedDate);
  const selectedExpenses = getExpensesByDate(selectedDateStr);
  const selectedSchedules = getSchedulesByDate(selectedDateStr);
  const totalForDay = selectedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const hasData = selectedExpenses.length > 0 || selectedSchedules.length > 0;

  // 날짜별 메모 로드/저장 함수
  const loadDateMemos = useCallback(async (dateStr: string) => {
    try {
      const data = await AsyncStorage.getItem(`@mohani_memo_${dateStr}`);
      if (data) {
        setDateMemos(JSON.parse(data));
      } else {
        setDateMemos([]);
      }
    } catch (e) {
      setDateMemos([]);
    }
  }, []);

  const saveDateMemos = useCallback(async (dateStr: string, memos: typeof dateMemos) => {
    try {
      await AsyncStorage.setItem(`@mohani_memo_${dateStr}`, JSON.stringify(memos));
      setDateMemos(memos);
    } catch (e) {}
  }, []);

  // 날짜 변경시 메모 로드 (showDetail이 true일 때만)
  const prevDateRef = useRef<string>('');
  useEffect(() => {
    if (showDetail && selectedDateStr !== prevDateRef.current) {
      prevDateRef.current = selectedDateStr;
      loadDateMemos(selectedDateStr);
      setCurrentMemoId(null);
      setMemoName('');
    }
  }, [showDetail, selectedDateStr, loadDateMemos]);

  const handleSaveMemo = () => {
    if (expenseItems.every(i => !i.name.trim())) {
      Alert.alert('알림', '항목을 입력해주세요');
      return;
    }
    if (currentMemoId) {
      const updated = dateMemos.map(m => m.id === currentMemoId ? { ...m, items: expenseItems } : m);
      saveDateMemos(selectedDateStr, updated);
      Alert.alert('완료', '임시저장 되었습니다!');
      // 날짜 상세 화면으로 돌아가기
      setShowAddExpense(false);
      setExpenseItems([{ id: Date.now(), name: '', amount: '', checked: false }]);
      setCurrentMemoId(null);
      setMemoName('');
    } else {
      setShowMemoName(true);
    }
  };

  const confirmSaveMemo = () => {
    const name = memoName.trim() || `메모 ${dateMemos.length + 1}`;
    const newMemo = { id: Date.now(), name, items: expenseItems };
    saveDateMemos(selectedDateStr, [...dateMemos, newMemo]);
    Alert.alert('완료', '임시저장 되었습니다!');
    setShowMemoName(false);
    setMemoName('');
    // 날짜 상세 화면으로 돌아가기
    setShowAddExpense(false);
    setExpenseItems([{ id: Date.now(), name: '', amount: '', checked: false }]);
    setCurrentMemoId(null);
  };

  const loadMemo = (memo: typeof dateMemos[0]) => {
    setExpenseItems(memo.items.map(i => ({ ...i, id: Date.now() + Math.random() })));
    setCurrentMemoId(memo.id);
    setMemoName(memo.name);
    setShowSavedMemos(false);
  };

  const deleteMemo = (id: number) => {
    Alert.alert('삭제', '이 메모를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => {
        saveDateMemos(selectedDateStr, dateMemos.filter(m => m.id !== id));
        if (currentMemoId === id) {
          setCurrentMemoId(null);
          setMemoName('');
        }
      }}
    ]);
  };

  const handleDayPress = (day: number) => {
    setSelectedDate(day);
    setShowDetail(true);
  };

  const renderCalendar = () => {
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<View key={`e${i}`} style={styles.dayCellModern} />);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = getDateString(day);
      const isToday = isCurrentMonth && day === today.getDate();
      const isSelected = day === selectedDate;
      const hasExpense = expenseDates.includes(dateStr);
      const hasSchedule = scheduleDates.includes(dateStr);
      const dayOfWeek = new Date(viewYear, viewMonth, day).getDay();
      const isSunday = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;
      const hasData = hasExpense || hasSchedule;

      cells.push(
        <TouchableOpacity
          key={day}
          activeOpacity={0.6}
          style={[styles.dayCellModern]}
          onPress={() => handleDayPress(day)}
        >
          {isSelected ? (
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.selectedCellGradient}
            >
              <Text style={styles.selectedTextModern}>{day}</Text>
              {hasData && (
                <View style={styles.dotsModern}>
                  {hasSchedule && <View style={[styles.dotModern, { backgroundColor: 'rgba(255,255,255,0.9)' }]} />}
                  {hasExpense && <View style={[styles.dotModern, { backgroundColor: 'rgba(255,255,255,0.9)' }]} />}
                </View>
              )}
            </LinearGradient>
          ) : (
            <View style={[
              styles.dayCellInner,
              isToday && styles.todayCellModern,
              hasData && !isToday && { backgroundColor: colors.bg },
            ]}>
              <Text style={[
                styles.dayTextModern,
                { color: colors.text },
                isSunday && { color: '#ef4444' },
                isSaturday && { color: '#3b82f6' },
                isToday && styles.todayTextModern,
              ]}>{day}</Text>
              {hasData && (
                <View style={styles.dotsModern}>
                  {hasSchedule && <View style={[styles.dotModern, { backgroundColor: colors.schedule }]} />}
                  {hasExpense && <View style={[styles.dotModern, { backgroundColor: colors.expense }]} />}
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      );
    }

    // 마지막 주의 남은 칸을 빈 셀로 채우기
    const remainingCells = 7 - (cells.length % 7);
    if (remainingCells < 7) {
      for (let i = 0; i < remainingCells; i++) {
        cells.push(<View key={`end${i}`} style={styles.dayCellModern} />);
      }
    }

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(<View key={i} style={styles.weekRowModern}>{cells.slice(i, i + 7)}</View>);
    return weeks;
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Premium Glass Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.calendarHeader}
      >
        {/* Decorative circles */}
        <View style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)' }} />
        <View style={{ position: 'absolute', bottom: -40, left: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.08)' }} />

        <View style={styles.calendarHeaderContent}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text style={[styles.calendarYear, { opacity: 0.9, fontSize: 14, fontWeight: '500' }]}>{viewYear}년</Text>
              {!isPremium && (
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="lock-closed" size={10} color="rgba(255,255,255,0.8)" />
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>PRO</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={goToPrevMonth}
                style={[styles.navButton, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 8 }, !isPremium && { opacity: 0.5 }]}
              >
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={[styles.calendarMonth, { fontSize: 32, fontWeight: '800', letterSpacing: -1 }]}>{tf('monthOnly', { month: viewMonth + 1 })}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={goToNextMonth}
                style={[styles.navButton, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 8 }, !isPremium && { opacity: 0.5 }]}
              >
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          {!isCurrentMonth ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={goToToday}
              style={[styles.calendarTodayBtn, { backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }]}
            >
              <Ionicons name="today-outline" size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.calendarTodayBtnText}>{t('goToToday')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.calendarToday, { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }]}>
              <Text style={[styles.calendarTodayNum, { fontSize: 28, fontWeight: '800' }]}>{today.getDate()}</Text>
              <Text style={[styles.calendarTodayLabel, { fontSize: 10, letterSpacing: 1 }]}>TODAY</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Glass Calendar Card */}
      <View style={[styles.calendarCard, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
        {/* Week Header with gradient underline */}
        <View style={styles.weekHeaderModern}>
          {[t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')].map((d, i) => (
            <View key={i} style={styles.weekDayWrapper}>
              <Text style={[
                styles.weekDayModern,
                { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
                i === 0 && { color: '#ef4444' },
                i === 6 && { color: '#3b82f6' }
              ]}>{d}</Text>
            </View>
          ))}
        </View>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 2, marginHorizontal: 8, borderRadius: 1, marginBottom: 8, opacity: 0.3 }}
        />

        <View style={styles.calendarGrid}>{renderCalendar()}</View>

        {/* Modern Legend */}
        <View style={[styles.legendModern, { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }]}>
          <View style={[styles.legendItemModern, { backgroundColor: colors.schedule + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }]}>
            <View style={[styles.legendDot, { backgroundColor: colors.schedule, width: 8, height: 8 }]} />
            <Text style={[styles.legendTextModern, { color: colors.schedule, fontWeight: '600' }]}>{t('schedule')}</Text>
          </View>
          <View style={[styles.legendItemModern, { backgroundColor: colors.expense + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }]}>
            <View style={[styles.legendDot, { backgroundColor: colors.expense, width: 8, height: 8 }]} />
            <Text style={[styles.legendTextModern, { color: colors.expense, fontWeight: '600' }]}>{t('expense')}</Text>
          </View>
        </View>
      </View>

      {/* Day Detail Modal */}
      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{tf('monthDay', { month: viewMonth + 1, day: selectedDate })}</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Schedules Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('schedule')}</Text>
                  <TouchableOpacity activeOpacity={0.6} onPress={() => setShowAddSchedule(true)}>
                    <View style={[styles.addBtnSmall, { backgroundColor: colors.schedule }]}>
                      <Ionicons name="add" size={18} color="#fff" />
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
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noSchedule')}</Text>
                )}
              </View>

              {/* Expenses Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('expense')}</Text>
                  <TouchableOpacity activeOpacity={0.6} onPress={() => setShowAddExpense(true)}>
                    <View style={[styles.addBtnSmall, { backgroundColor: colors.expense }]}>
                      <Ionicons name="add" size={18} color="#fff" />
                    </View>
                  </TouchableOpacity>
                </View>
                {selectedExpenses.length > 0 ? (
                  selectedExpenses.map(expense => {
                    const isExpanded = expandedExpenses.has(expense.id);
                    const toggleExpand = () => {
                      setExpandedExpenses(prev => {
                        const next = new Set(prev);
                        if (next.has(expense.id)) next.delete(expense.id);
                        else next.add(expense.id);
                        return next;
                      });
                    };
                    return (
                      <TouchableOpacity
                        key={expense.id}
                        activeOpacity={expense.items ? 0.7 : 1}
                        style={[styles.expenseItem, { backgroundColor: colors.bg }]}
                        onPress={expense.items ? toggleExpand : undefined}
                      >
                        <View style={styles.expenseHeader}>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={[styles.expenseCategory, { color: colors.text }]}>{t('purchase')}</Text>
                            <Text style={[styles.expenseMemo, { color: colors.textMuted }]}>({expense.memo})</Text>
                            {expense.items && (
                              <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} style={{ marginLeft: 4 }} />
                            )}
                          </View>
                          <Text style={[styles.expenseAmount, { color: colors.expense }]}>{currencySymbol}{expense.amount.toLocaleString()}</Text>
                          <TouchableOpacity activeOpacity={0.5} style={{ padding: 8, marginLeft: 8 }} onPress={() => {
                            Alert.alert(t('delete'), t('deleteExpenseConfirm'), [
                              { text: t('cancel'), style: 'cancel' },
                              { text: t('delete'), style: 'destructive', onPress: () => deleteExpense(expense.id) },
                            ]);
                          }}>
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                        {expense.items && isExpanded && (
                          <View style={styles.itemsDetail}>
                            {expense.items.map((item, idx) => (
                              <View key={idx} style={styles.itemDetailRow}>
                                <Ionicons name={item.checked ? "checkmark-circle" : "ellipse-outline"} size={16} color={item.checked ? colors.schedule : colors.textMuted} />
                                <Text style={[styles.itemDetailName, { color: colors.text }, item.checked && styles.itemChecked]}>{item.name}</Text>
                                <Text style={[styles.itemDetailAmount, { color: colors.textMuted }]}>{currencySymbol}{item.amount.toLocaleString()}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noExpense')}</Text>
                )}
              </View>

              {/* 메모장 Section - 메모가 있을 때만 표시 */}
              {dateMemos.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('purchaseMemo')}</Text>
                  </View>
                  {dateMemos.map(memo => (
                    <TouchableOpacity
                      key={memo.id}
                      style={[styles.memoItem, { backgroundColor: colors.bg }]}
                      activeOpacity={0.7}
                      onPress={() => { loadMemo(memo); setShowAddExpense(true); }}
                    >
                      <View style={styles.memoItemLeft}>
                        <Ionicons name="document-text" size={20} color={colors.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.memoItemName, { color: colors.text }]}>{memo.name}</Text>
                          <Text style={[styles.memoItemDetail, { color: colors.textMuted }]}>
                            {tf('itemsCount', { count: memo.items.filter(i => i.name).length })} · {currencySymbol}{memo.items.reduce((s, i) => s + (parseInt(i.amount) || 0), 0).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => deleteMemo(memo.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

            </ScrollView>

            {totalForDay > 0 && (
              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}><Text style={[styles.modalTotal, { color: colors.expense }]}>{t('total')} {currencySymbol}{totalForDay.toLocaleString()}</Text></View>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Schedule Modal */}
      <Modal visible={showAddSchedule} transparent animationType="fade">
        <View style={styles.memoModalOverlay}>
          <View style={[styles.memoModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.memoModalTitle, { color: colors.text }]}>{t('addSchedule')}</Text>
            <TextInput
              style={[styles.memoNameInput, { backgroundColor: colors.bg, color: colors.text }]}
              value={newScheduleTitle}
              onChangeText={setNewScheduleTitle}
              placeholder={t('titleRequired')}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <TextInput
              style={[styles.memoNameInput, { backgroundColor: colors.bg, color: colors.text }]}
              value={newScheduleTime}
              onChangeText={setNewScheduleTime}
              placeholder={t('timePlaceholder')}
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[styles.memoNameInput, { backgroundColor: colors.bg, color: colors.text }]}
              value={newScheduleLocation}
              onChangeText={setNewScheduleLocation}
              placeholder={t('locationPlaceholder')}
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.memoModalButtons}>
              <TouchableOpacity style={[styles.memoModalCancel, { backgroundColor: colors.bg }]} onPress={() => { setShowAddSchedule(false); setNewScheduleTitle(''); setNewScheduleTime(''); setNewScheduleLocation(''); }}>
                <Text style={[styles.memoModalCancelText, { color: colors.textMuted }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.memoModalSave, { backgroundColor: colors.schedule }]} onPress={() => {
                if (newScheduleTitle.trim()) {
                  addSchedule({ date: selectedDateStr, title: newScheduleTitle.trim(), time: newScheduleTime, location: newScheduleLocation });
                  setNewScheduleTitle(''); setNewScheduleTime(''); setNewScheduleLocation('');
                  setShowAddSchedule(false);
                }
              }}>
                <Text style={styles.memoModalSaveText}>{t('add')}</Text>
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('addExpense')}</Text>
              <TouchableOpacity onPress={() => { setShowAddExpense(false); setExpenseItems([{ id: 1, name: '', amount: '', checked: false }]); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.expenseModalScroll} keyboardShouldPersistTaps="handled">
              <Text style={[styles.cardSubtitle, { color: colors.textMuted, marginBottom: 12, marginTop: 8 }]}>{t('enterPurchaseItems')}</Text>

              {expenseItems.map(item => (
                <View key={item.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                  <TouchableOpacity style={[styles.checkbox, item.checked && styles.checked]} onPress={() => setExpenseItems(expenseItems.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i))}>
                    {item.checked && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.itemNameInput, { color: colors.text }, item.checked && styles.itemChecked]}
                    value={item.name}
                    onChangeText={(text) => setExpenseItems(expenseItems.map(i => i.id === item.id ? { ...i, name: text } : i))}
                    placeholder={t('itemName')}
                    placeholderTextColor={colors.textMuted}
                    autoFocus={item.id === focusedItemId}
                    onFocus={() => { if (focusedItemId === item.id) setFocusedItemId(null); }}
                  />
                  <TextInput style={[styles.itemAmountInput, { color: colors.text }]} value={item.amount ? parseInt(item.amount).toLocaleString() : ''} onChangeText={(text) => setExpenseItems(expenseItems.map(i => i.id === item.id ? { ...i, amount: text.replace(/[^0-9]/g, '').replace(/^0+/, '') || '' } : i))} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
                  <Text style={[styles.won, { color: colors.textMuted }]}>{currencySymbol}</Text>
                </View>
              ))}

              <View style={styles.memoButtonRow}>
                <TouchableOpacity activeOpacity={0.6} style={[styles.memoButton, { flex: 1 }]} onPress={() => {
                  const newId = Date.now();
                  setExpenseItems([...expenseItems, { id: newId, name: '', amount: '', checked: false }]);
                  setFocusedItemId(newId);
                }}>
                  <Ionicons name="add" size={20} color={colors.primary} /><Text style={[styles.memoButtonText, { color: colors.primary }]}>{t('addItem')}</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.6} style={[styles.memoButton, { flex: 1 }]} onPress={handleSaveMemo}>
                  <Ionicons name={currentMemoId ? "sync-outline" : "save-outline"} size={20} color={colors.primary} />
                  <Text style={[styles.memoButtonText, { color: colors.primary }]}>{currentMemoId ? t('tempSaveUpdate') : t('tempSave')}</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.totalRow, { borderTopColor: colors.border, marginTop: 16 }]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>{t('totalAmount')}</Text>
                <Text style={[styles.totalAmount, { color: colors.primary }]}>{currencySymbol}{expenseTotal.toLocaleString()}</Text>
              </View>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.expense, marginBottom: 20 }]} onPress={() => {
                if (expenseTotal > 0) {
                  // 무료 사용자 월 10건 제한 체크
                  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
                  const thisMonthCount = expenses.filter(e => e.date.startsWith(thisMonth)).length;
                  if (!isPremium && thisMonthCount >= 10) {
                    setShowUpgradeModal(true);
                    return;
                  }
                  addExpense({
                    date: selectedDateStr,
                    category: t('purchase'),
                    amount: expenseTotal,
                    memo: currentMemoId ? dateMemos.find(m => m.id === currentMemoId)?.name || t('shopping') : t('shopping'),
                    items: expenseItems.filter(i => i.name).map(i => ({ name: i.name, amount: parseInt(i.amount) || 0, checked: i.checked }))
                  });
                  // 메모가 있으면 삭제 (사용 완료)
                  if (currentMemoId) {
                    saveDateMemos(selectedDateStr, dateMemos.filter(m => m.id !== currentMemoId));
                    setCurrentMemoId(null);
                    setMemoName('');
                  }
                  setExpenseItems([{ id: Date.now(), name: '', amount: '', checked: false }]);
                  setShowAddExpense(false);
                }
              }}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={styles.buttonText}>{t('recordExpense')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 메모 이름 입력 모달 */}
      <Modal visible={showMemoName} transparent animationType="fade">
        <View style={styles.memoModalOverlay}>
          <View style={[styles.memoModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.memoModalTitle, { color: colors.text }]}>{t('memoName')}</Text>
            <TextInput
              style={[styles.memoNameInput, { backgroundColor: colors.bg, color: colors.text }]}
              value={memoName}
              onChangeText={setMemoName}
              placeholder={t('enterMemoName')}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.memoModalButtons}>
              <TouchableOpacity style={[styles.memoModalCancel, { backgroundColor: colors.bg }]} onPress={() => { setShowMemoName(false); setMemoName(''); }}>
                <Text style={[styles.memoModalCancelText, { color: colors.textMuted }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.memoModalSave, { backgroundColor: colors.primary }]} onPress={confirmSaveMemo}>
                <Text style={styles.memoModalSaveText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 저장된 메모 목록 모달 */}
      <Modal visible={showSavedMemos} transparent animationType="slide">
        <View style={styles.memoModalOverlay}>
          <View style={[styles.savedMemosModal, { backgroundColor: colors.card }]}>
            <View style={styles.savedMemosHeader}>
              <Text style={[styles.savedMemosTitle, { color: colors.text }]}>{selectedDateStr} {t('savedMemos')}</Text>
              <TouchableOpacity onPress={() => setShowSavedMemos(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.savedMemosList}>
              {dateMemos.length === 0 ? (
                <Text style={[styles.noMemosText, { color: colors.textMuted }]}>{t('noSavedMemo')}</Text>
              ) : (
                dateMemos.map(memo => (
                  <TouchableOpacity key={memo.id} style={[styles.savedMemoItem, { backgroundColor: colors.bg }]} onPress={() => loadMemo(memo)}>
                    <View style={styles.savedMemoInfo}>
                      <Text style={[styles.savedMemoName, { color: colors.text }]}>{memo.name}</Text>
                      <Text style={[styles.savedMemoDetails, { color: colors.textMuted }]}>
                        {memo.items.filter(i => i.name).length}개 항목 · {currencySymbol}{memo.items.reduce((s, i) => s + (parseInt(i.amount) || 0), 0).toLocaleString()}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteMemo(memo.id)} style={styles.deleteMemoButton}>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={[styles.newMemoButton, { borderTopColor: colors.border }]} onPress={() => { setCurrentMemoId(null); setMemoName(''); setExpenseItems([{ id: Date.now(), name: '', amount: '', checked: false }]); setShowSavedMemos(false); }}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.newMemoButtonText, { color: colors.primary }]}>{t('newMemo')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ============ ADD SCREEN ============
function AddScreen() {
  const { addExpense } = useExpenses();
  const { addSchedule } = useSchedules();
  const { colors } = useTheme();
  const { settings } = useSettings();
  const t = (key: string) => getTranslation(settings.language, key);
  const tf = (key: string, values: Record<string, string | number>) => formatTranslation(settings.language, key, values);
  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || '₩';
  const [activeTab, setActiveTab] = useState<'expense' | 'schedule'>('expense');

  // Expense state
  const [items, setItems] = useState([{ id: 1, name: '', amount: '0', checked: false }]);
  const total = items.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);

  // Schedule state
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleLocation, setScheduleLocation] = useState('');

  const saveExpense = () => {
    if (total === 0) { Alert.alert('알림', '금액을 입력해주세요'); return; }
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    addExpense({ date: dateStr, category: '구매', amount: total, memo: '장보기', items: items.filter(i => i.name).map(i => ({ name: i.name, amount: parseInt(i.amount) || 0, checked: i.checked })) });
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
      <View style={styles.header}><Text style={[styles.title, { color: colors.text }]}>{t('addTitle')}</Text></View>

      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={[styles.tab, activeTab === 'expense' && styles.activeTab]} onPress={() => setActiveTab('expense')}>
          <Ionicons name="card-outline" size={20} color={activeTab === 'expense' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === 'expense' && styles.activeTabText]}>{t('expenseTab')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'schedule' && styles.activeTab]} onPress={() => setActiveTab('schedule')}>
          <Ionicons name="calendar-outline" size={20} color={activeTab === 'schedule' ? colors.schedule : colors.textMuted} />
          <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === 'schedule' && styles.activeTabText]}>{t('scheduleTab')}</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'expense' ? (
        <>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('purchaseMemo')}</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>{t('enterPurchaseItems')}</Text>

            {items.map(item => (
              <View key={item.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                <TouchableOpacity style={[styles.checkbox, item.checked && styles.checked]} onPress={() => setItems(items.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i))}>
                  {item.checked && <Ionicons name="checkmark" size={16} color="#fff" />}
                </TouchableOpacity>
                <TextInput style={[styles.itemNameInput, { color: colors.text }, item.checked && styles.itemChecked]} value={item.name} onChangeText={(text) => setItems(items.map(i => i.id === item.id ? { ...i, name: text } : i))} placeholder="항목명" placeholderTextColor={colors.textMuted} />
                <TextInput style={[styles.itemAmountInput, { color: colors.text }]} value={item.amount ? parseInt(item.amount).toLocaleString() : ''} onChangeText={(text) => setItems(items.map(i => i.id === item.id ? { ...i, amount: text.replace(/[^0-9]/g, '').replace(/^0+/, '') || '' } : i))} onFocus={() => { if (item.amount === '0') setItems(items.map(i => i.id === item.id ? { ...i, amount: '' } : i)); }} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
                <Text style={[styles.won, { color: colors.textMuted }]}>{currencySymbol}</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.addItemButton} onPress={() => setItems([...items, { id: Date.now(), name: '', amount: '', checked: false }])}>
              <Ionicons name="add" size={20} color={colors.primary} /><Text style={[styles.addItemText, { color: colors.primary }]}>{t('addItem')}</Text>
            </TouchableOpacity>

            <View style={[styles.totalRow, { borderTopColor: colors.border }]}><Text style={[styles.totalLabel, { color: colors.text }]}>{t('total')}</Text><Text style={[styles.totalAmount, { color: colors.primary }]}>{currencySymbol}{total.toLocaleString()}</Text></View>

            <TouchableOpacity style={styles.primaryButton} onPress={saveExpense}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={styles.buttonText}>{t('recordExpense')}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('quickExpense')}</Text>
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
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('newSchedule')}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>{t('addScheduleToday')}</Text>

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
            <Ionicons name="calendar-outline" size={20} color="#fff" /><Text style={styles.buttonText}>{t('addScheduleBtn')}</Text>
          </TouchableOpacity>

          {scheduleSaved && (
            <View style={styles.successMessage}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.schedule} />
              <Text style={styles.successText}>일정이 추가되었습니다!</Text>
            </View>
          )}
        </View>
      )}

    </ScrollView>
  );
}

// ============ SETTINGS SCREEN ============
function SettingsScreen() {
  const { isDark, toggleTheme, colors } = useTheme();
  const { isPremium, setShowUpgradeModal } = usePremium();
  const { expenses } = useExpenses();
  const { recurringExpenses, addRecurring, deleteRecurring, getTotalMonthly } = useRecurring();
  const { incomes, addIncome, deleteIncome, getMonthlyIncome, getTotalIncomeThisMonth } = useIncome();
  const { settings, updateSettings } = useSettings();
  const t = (key: string) => getTranslation(settings.language, key);
  const tf = (key: string, values: Record<string, string | number>) => formatTranslation(settings.language, key, values);
  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || '₩';

  // 이번달 지출 건수
  const today = new Date();
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthCount = expenses.filter(e => e.date.startsWith(thisMonth)).length;

  // 언어 선택 모달
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  // 화폐단위 선택 모달
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  // 수입 추가 모달
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showIncomeList, setShowIncomeList] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeType, setIncomeType] = useState<'salary' | 'bonus' | 'freelance' | 'investment' | 'gift' | 'other'>('salary');
  const [incomeNote, setIncomeNote] = useState('');
  const [incomeIsRecurring, setIncomeIsRecurring] = useState(false);

  // 고정 지출 추가 모달
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [showRecurringList, setShowRecurringList] = useState(false);
  const [recurringName, setRecurringName] = useState('');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [recurringCategory, setRecurringCategory] = useState('구독');
  const [recurringFrequency, setRecurringFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [recurringDay, setRecurringDay] = useState(today.getDate().toString());

  const clearData = () => {
    Alert.alert('데이터 초기화', '모든 데이터를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('@mohani_expenses');
        await AsyncStorage.removeItem('@mohani_schedules');
        await AsyncStorage.removeItem('@mohani_recurring');
        Alert.alert('완료', '데이터가 삭제되었습니다. 앱을 재시작하세요.');
      }},
    ]);
  };

  const handleAddRecurring = () => {
    if (!recurringName.trim() || !recurringAmount) {
      Alert.alert('알림', '이름과 금액을 입력해주세요');
      return;
    }
    addRecurring({
      name: recurringName.trim(),
      amount: parseInt(recurringAmount) || 0,
      category: recurringCategory,
      frequency: recurringFrequency,
      dayOfMonth: parseInt(recurringDay) || 1,
    });
    setShowAddRecurring(false);
    setRecurringName('');
    setRecurringAmount('');
    setRecurringCategory('구독');
    setRecurringFrequency('monthly');
    setRecurringDay(today.getDate().toString());
  };

  const handleDeleteRecurring = (id: string, name: string) => {
    Alert.alert('삭제', `"${name}"을(를) 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteRecurring(id) }
    ]);
  };

  const handleAddIncome = () => {
    if (!incomeAmount) {
      Alert.alert('알림', '금액을 입력해주세요');
      return;
    }
    const typeInfo = INCOME_TYPES.find(t => t.id === incomeType);
    addIncome({
      amount: parseInt(incomeAmount.replace(/,/g, '')) || 0,
      source: typeInfo?.label || '기타',
      type: incomeType,
      date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      note: incomeNote.trim() || undefined,
      isRecurring: incomeIsRecurring,
      recurringDay: incomeIsRecurring ? today.getDate() : undefined,
    });
    setShowAddIncome(false);
    setIncomeAmount('');
    setIncomeType('salary');
    setIncomeNote('');
    setIncomeIsRecurring(false);
  };

  const handleDeleteIncome = (id: string, source: string) => {
    Alert.alert('삭제', `"${source}" 수입을 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteIncome(id) }
    ]);
  };

  const incomeIcons: Record<string, string> = {
    'salary': 'briefcase',
    'bonus': 'gift',
    'freelance': 'laptop',
    'investment': 'trending-up',
    'gift': 'heart',
    'other': 'cash',
  };

  const categoryIcons: Record<string, string> = {
    '구독': 'play-circle',
    '통신': 'phone-portrait',
    '보험': 'shield-checkmark',
    '주거': 'home',
    '교통': 'car',
    '기타': 'ellipsis-horizontal-circle',
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={styles.header}><Text style={[styles.title, { color: colors.text }]}>{t('settings')}</Text></View>

      {/* 프리미엄 카드 - TODO: 출시 시 주석 해제 */}
      {/* {isPremium ? (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 24 }}>👑</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.appName, { color: colors.text }]}>{t('premiumUser')}</Text>
              <Text style={[styles.appDesc, { color: colors.textMuted }]}>{t('usingAllFeatures')}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          </View>
        </View>
      ) : (
        <TouchableOpacity activeOpacity={0.8} onPress={() => setShowUpgradeModal(true)}>
          <LinearGradient
            colors={['#7c3aed', '#a855f7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.card, { padding: 16 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 32 }}>👑</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: 'bold' }}>{t('upgradeToPremium')}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>
                  이번 달 {thisMonthCount}/10건 기록 · 무제한으로 사용하기
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )} */}

      {/* 수입 섹션 */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowIncomeList(!showIncomeList)}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="wallet" size={22} color={colors.schedule} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('income')}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                {incomes.length}{t('incomeCount')} · {t('thisMonth')} {currencySymbol}{getTotalIncomeThisMonth().toLocaleString()}
              </Text>
            </View>
          </View>
          <Ionicons name={showIncomeList ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textMuted} />
        </TouchableOpacity>

        {showIncomeList && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, marginBottom: 8 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowAddIncome(true)}
                style={{ backgroundColor: colors.schedule, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>+ 추가</Text>
              </TouchableOpacity>
            </View>

            {incomes.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Ionicons name="wallet-outline" size={40} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, marginTop: 8 }}>{t('noIncome')}</Text>
              </View>
            ) : (
              incomes.map(item => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.schedule + '15', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name={incomeIcons[item.type] as any || 'cash'} size={20} color={colors.schedule} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: '500' }}>{item.source}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                      {item.note || (item.isRecurring ? t('recurring') : t('oneTime'))}
                    </Text>
                  </View>
                  <Text style={{ color: colors.schedule, fontSize: 15, fontWeight: '600', marginRight: 12 }}>
                    +{currencySymbol}{item.amount.toLocaleString()}
                  </Text>
                  <TouchableOpacity activeOpacity={0.6} onPress={() => handleDeleteIncome(item.id, item.source)} style={{ padding: 4 }}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}
      </View>

      {/* 고정 지출 섹션 */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowRecurringList(!showRecurringList)}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="repeat" size={22} color={colors.primary} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('fixedExpenses')}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                {recurringExpenses.length}{t('incomeCount')} · {t('monthly')} {currencySymbol}{getTotalMonthly().toLocaleString()}
              </Text>
            </View>
          </View>
          <Ionicons name={showRecurringList ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textMuted} />
        </TouchableOpacity>

        {showRecurringList && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, marginBottom: 8 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowAddRecurring(true)}
                style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>+ 추가</Text>
              </TouchableOpacity>
            </View>

            {recurringExpenses.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Ionicons name="repeat-outline" size={40} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, marginTop: 8 }}>{t('noFixedExpense')}</Text>
              </View>
            ) : (
              recurringExpenses.map(item => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name={categoryIcons[item.category] as any || 'card'} size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: '500' }}>{item.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                      {item.frequency === 'monthly' ? tf('monthlyOnDay', { day: item.dayOfMonth }) : t('yearly')} · {item.category}
                    </Text>
                  </View>
                  <Text style={{ color: colors.expense, fontSize: 15, fontWeight: '600', marginRight: 12 }}>
                    {currencySymbol}{item.amount.toLocaleString()}
                  </Text>
                  <TouchableOpacity activeOpacity={0.6} onPress={() => handleDeleteRecurring(item.id, item.name)} style={{ padding: 4 }}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={toggleTheme}>
          <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.primary} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>{isDark ? t('darkMode') : t('lightMode')}</Text>
          <View style={[styles.themeToggle, { backgroundColor: isDark ? colors.primary : colors.border }]}>
            <View style={[styles.themeToggleKnob, { marginLeft: isDark ? 20 : 2 }]} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={() => setShowLanguageModal(true)}>
          <Ionicons name="language" size={22} color={colors.primary} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>{t('language')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>
              {LANGUAGES.find(l => l.code === settings.language)?.flag} {LANGUAGES.find(l => l.code === settings.language)?.label}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={() => setShowCurrencyModal(true)}>
          <Ionicons name="cash-outline" size={22} color={colors.primary} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>{t('currency')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>
              {CURRENCIES.find(c => c.code === settings.currency)?.flag} {CURRENCIES.find(c => c.code === settings.currency)?.symbol}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]} onPress={clearData}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
          <Text style={[styles.settingLabel, { color: colors.text }]}>{t('clearData')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />

      {/* 언어 선택 모달 */}
      <Modal visible={showLanguageModal} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('language')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => {
                    updateSettings({ language: lang.code });
                    setShowLanguageModal(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{lang.flag}</Text>
                  <Text style={{ flex: 1, color: colors.text, fontSize: 16 }}>{lang.label}</Text>
                  {settings.language === lang.code && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 화폐단위 선택 모달 */}
      <Modal visible={showCurrencyModal} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCurrencyModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('currency')}</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              {CURRENCIES.map((curr) => (
                <TouchableOpacity
                  key={curr.code}
                  onPress={() => {
                    updateSettings({ currency: curr.code });
                    setShowCurrencyModal(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{curr.flag}</Text>
                  <Text style={{ flex: 1, color: colors.text, fontSize: 16 }}>{curr.symbol} {curr.label}</Text>
                  {settings.currency === curr.code && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 수입 추가 모달 */}
      <Modal visible={showAddIncome} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>수입 추가</Text>
              <TouchableOpacity onPress={() => setShowAddIncome(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6 }}>수입 유형</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {INCOME_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => setIncomeType(type.id as any)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 16,
                      backgroundColor: incomeType === type.id ? colors.schedule + '20' : colors.bg,
                      borderWidth: 1,
                      borderColor: incomeType === type.id ? colors.schedule : colors.border,
                      gap: 6,
                    }}
                  >
                    <Ionicons name={type.icon as any} size={16} color={incomeType === type.id ? colors.schedule : colors.textMuted} />
                    <Text style={{ color: incomeType === type.id ? colors.schedule : colors.text, fontSize: 13 }}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6, marginTop: 16 }}>메모 (선택)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
                placeholder="예: 12월 급여"
                placeholderTextColor={colors.textMuted}
                value={incomeNote}
                onChangeText={setIncomeNote}
              />

              <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6, marginTop: 16 }}>금액</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={incomeAmount}
                onChangeText={(text) => {
                  const numbers = text.replace(/[^0-9]/g, '');
                  setIncomeAmount(numbers ? parseInt(numbers).toLocaleString() : '');
                }}
              />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: 12, backgroundColor: colors.bg, borderRadius: 8 }}>
                <Text style={{ color: colors.text, fontSize: 14 }}>매월 반복 수입</Text>
                <TouchableOpacity
                  onPress={() => setIncomeIsRecurring(!incomeIsRecurring)}
                  style={{
                    width: 50,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: incomeIsRecurring ? colors.schedule : colors.border,
                    justifyContent: 'center',
                    padding: 2,
                  }}
                >
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: '#fff',
                    marginLeft: incomeIsRecurring ? 22 : 0,
                  }} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleAddIncome}
                style={{
                  backgroundColor: colors.schedule,
                  padding: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginTop: 24,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>추가하기</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 고정 지출 추가 모달 */}
      <Modal visible={showAddRecurring} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>고정 지출 추가</Text>
              <TouchableOpacity onPress={() => setShowAddRecurring(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6 }}>카테고리</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {Object.keys(categoryIcons).map(cat => (
                  <TouchableOpacity
                    key={cat}
                    activeOpacity={0.7}
                    onPress={() => setRecurringCategory(cat)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: recurringCategory === cat ? colors.primary : colors.border,
                      backgroundColor: recurringCategory === cat ? colors.primary + '15' : 'transparent',
                      gap: 6,
                    }}
                  >
                    <Ionicons name={categoryIcons[cat] as any} size={16} color={recurringCategory === cat ? colors.primary : colors.textMuted} />
                    <Text style={{ color: recurringCategory === cat ? colors.primary : colors.text, fontSize: 13 }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6, marginTop: 16 }}>이름</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
                placeholder="예: 넷플릭스, KT 통신비"
                placeholderTextColor={colors.textMuted}
                value={recurringName}
                onChangeText={setRecurringName}
              />

              <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6, marginTop: 16 }}>금액</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={recurringAmount}
                onChangeText={setRecurringAmount}
                keyboardType="number-pad"
              />

              <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6, marginTop: 16 }}>주기</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setRecurringFrequency('monthly')}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: recurringFrequency === 'monthly' ? colors.primary : colors.border,
                    backgroundColor: recurringFrequency === 'monthly' ? colors.primary + '15' : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: recurringFrequency === 'monthly' ? colors.primary : colors.text, fontWeight: '500' }}>매월</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setRecurringFrequency('yearly')}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: recurringFrequency === 'yearly' ? colors.primary : colors.border,
                    backgroundColor: recurringFrequency === 'yearly' ? colors.primary + '15' : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: recurringFrequency === 'yearly' ? colors.primary : colors.text, fontWeight: '500' }}>매년</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6, marginTop: 16 }}>결제일</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
                placeholder="1-31"
                placeholderTextColor={colors.textMuted}
                value={recurringDay}
                onChangeText={(t) => setRecurringDay(t.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="number-pad"
              />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleAddRecurring}
                style={{ backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 }}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>추가하기</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ============ ANALYSIS SCREEN ============
function AnalysisContent() {
  const { expenses } = useExpenses();
  const { incomes } = useIncome();
  const { recurringExpenses } = useRecurring();
  const { colors } = useTheme();
  const { settings } = useSettings();
  const t = (key: string) => getTranslation(settings.language, key);
  const tf = (key: string, values: Record<string, string | number>) => formatTranslation(settings.language, key, values);
  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || '₩';

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysPassed = today.getDate();
  const daysRemaining = daysInMonth - daysPassed;

  // 수입 계산
  const recurringIncome = incomes
    .filter(inc => inc.isRecurring)
    .reduce((sum, inc) => sum + inc.amount, 0);

  const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const oneTimeIncome = incomes
    .filter(inc => !inc.isRecurring && inc.date.startsWith(monthStr))
    .reduce((sum, inc) => sum + inc.amount, 0);

  const totalIncome = recurringIncome + oneTimeIncome;

  // 고정지출 계산
  const fixedExpenses = recurringExpenses.filter(r => r.isActive);
  const totalFixedExpense = fixedExpenses.reduce((sum, r) => sum + r.amount, 0);

  // 일일 소비 계산
  const thisMonthExpenses = expenses.filter(e => {
    const [y, m] = e.date.split('-').map(Number);
    return y === currentYear && m === currentMonth;
  });
  const totalDailySpending = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 남은 금액 계산
  const remaining = totalIncome - totalFixedExpense - totalDailySpending;
  const remainingPerDay = daysRemaining > 0 ? Math.round(remaining / daysRemaining) : remaining;

  // 일평균 소비
  const dailyAverage = daysPassed > 0 ? Math.round(totalDailySpending / daysPassed) : 0;
  const projectedSpending = dailyAverage * daysInMonth;
  const projectedRemaining = totalIncome - totalFixedExpense - projectedSpending;

  // 카테고리별 분석
  const categoryData = thisMonthExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxCategoryAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 1;

  const categoryColors: Record<string, string> = {
    '식비': '#ef4444', '카페': '#f97316', '교통': '#3b82f6', '구매': '#8b5cf6',
    '통신': '#06b6d4', '구독': '#ec4899', '의료': '#10b981', '여가': '#f59e0b', '기타': '#6b7280',
  };

  const categoryIcons: Record<string, string> = {
    '식비': 'restaurant', '카페': 'cafe', '교통': 'bus', '구매': 'cart',
    '통신': 'phone-portrait', '구독': 'play-circle', '의료': 'medical', '여가': 'game-controller', '기타': 'ellipsis-horizontal',
  };

  return (
    <View style={{ marginTop: 20 }}>
      {/* 월 정보 */}
      <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 16 }}>{tf('yearMonth', { year: currentYear, month: currentMonth })} · {tf('daysPassed', { days: daysPassed })}</Text>

      {/* 재정 흐름 요약 */}
      <View style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        {/* 수입 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(34, 197, 94, 0.15)', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="arrow-down" size={16} color={colors.schedule} />
            </View>
            <Text style={{ color: colors.text, fontSize: 14, marginLeft: 10 }}>{t('incomeLabel')}</Text>
          </View>
          <Text style={{ color: colors.schedule, fontSize: 16, fontWeight: 'bold' }}>+{currencySymbol}{totalIncome.toLocaleString()}</Text>
        </View>

        {/* 고정지출 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(124, 58, 237, 0.15)', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="lock-closed" size={16} color={colors.primary} />
            </View>
            <Text style={{ color: colors.text, fontSize: 14, marginLeft: 10 }}>{t('fixedExpenseLabel')}</Text>
          </View>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>-{currencySymbol}{totalFixedExpense.toLocaleString()}</Text>
        </View>

        {/* 일일소비 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(234, 179, 8, 0.15)', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="cart" size={16} color={colors.expense} />
            </View>
            <Text style={{ color: colors.text, fontSize: 14, marginLeft: 10 }}>{t('dailySpending')}</Text>
          </View>
          <Text style={{ color: colors.expense, fontSize: 16, fontWeight: 'bold' }}>-{currencySymbol}{totalDailySpending.toLocaleString()}</Text>
        </View>

        {/* 구분선 */}
        <View style={{ height: 2, backgroundColor: colors.border, marginVertical: 8 }} />

        {/* 남은 금액 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: remaining >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="wallet" size={16} color={remaining >= 0 ? colors.schedule : '#ef4444'} />
            </View>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginLeft: 10 }}>{t('remainingAmount')}</Text>
          </View>
          <Text style={{ color: remaining >= 0 ? colors.schedule : '#ef4444', fontSize: 20, fontWeight: 'bold' }}>
            {currencySymbol}{remaining.toLocaleString()}
          </Text>
        </View>

        {/* 하루 사용가능 금액 */}
        {remaining > 0 && daysRemaining > 0 && (
          <View style={{ backgroundColor: colors.card, borderRadius: 10, padding: 12, marginTop: 8, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{tf('remainingDaysUsage', { days: daysRemaining })}</Text>
            <Text style={{ color: colors.schedule, fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>
              {currencySymbol}{remainingPerDay.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* 월말 예상 */}
      <View style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 16, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="trending-up" size={16} color={projectedRemaining >= 0 ? colors.schedule : '#ef4444'} />
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginLeft: 6 }}>{t('monthEndProjection')}</Text>
        </View>
        <Text style={{ color: projectedRemaining >= 0 ? colors.schedule : '#ef4444', fontSize: 24, fontWeight: 'bold' }}>
          {projectedRemaining >= 0 ? '+' : ''}{currencySymbol}{projectedRemaining.toLocaleString()}
        </Text>
        {projectedRemaining < 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
            <Ionicons name="warning" size={14} color="#ef4444" />
            <Text style={{ color: '#ef4444', fontSize: 12, marginLeft: 4 }}>{t('reduceSpending')}</Text>
          </View>
        )}
        {projectedRemaining >= 0 && projectedRemaining < totalIncome * 0.1 && totalIncome > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: 'rgba(234, 179, 8, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
            <Ionicons name="alert-circle" size={14} color={colors.expense} />
            <Text style={{ color: colors.expense, fontSize: 12, marginLeft: 4 }}>{t('lowSavings')}</Text>
          </View>
        )}
        {projectedRemaining >= totalIncome * 0.2 && totalIncome > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
            <Ionicons name="checkmark-circle" size={14} color={colors.schedule} />
            <Text style={{ color: colors.schedule, fontSize: 12, marginLeft: 4 }}>{t('goodSavingHabit')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ============ SAVINGS SCREEN ============
function SavingsScreen() {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const t = (key: string) => getTranslation(settings.language, key);
  const tf = (key: string, values: Record<string, string | number>) => formatTranslation(settings.language, key, values);
  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || '₩';
  const { goals, addGoal, deleteGoal, addSavings, getTotalSaved, getTotalTarget, getOverallProgress } = useGoals();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [saveAmount, setSaveAmount] = useState('');
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);

  const GOAL_ICONS = ['🎯', '✈️', '🏠', '🚗', '💻', '📱', '👗', '💍', '🎓', '💰', '🎁', '🏖️'];
  const GOAL_COLORS = ['#7c3aed', '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];
  const MILESTONES = [
    { percent: 25, icon: '🌱', label: t('milestoneStart') },
    { percent: 50, icon: '🌿', label: t('milestoneMiddle') },
    { percent: 75, icon: '🌳', label: t('milestoneAlmost') },
    { percent: 100, icon: '🎉', label: t('milestoneDone') },
  ];
  const QUICK_AMOUNTS = [10000, 50000, 100000, 500000];
  const TUTORIAL_SLIDES = [
    { emoji: '🎯', title: t('tutorialTitle1'), desc: t('tutorialDesc1') },
    { emoji: '🎨', title: t('tutorialTitle2'), desc: t('tutorialDesc2') },
    { emoji: '💰', title: t('tutorialTitle3'), desc: t('tutorialDesc3') },
    { emoji: '🌱', title: t('tutorialTitle4'), desc: t('tutorialDesc4') },
  ];

  const [selectedIcon, setSelectedIcon] = useState('🎯');
  const [selectedColor, setSelectedColor] = useState('#7c3aed');

  // 자동 슬라이드
  useEffect(() => {
    if (goals.length > 0 || !showTutorial) return;
    const timer = setInterval(() => {
      setTutorialStep(prev => (prev + 1) % TUTORIAL_SLIDES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [goals.length, showTutorial]);

  const formatAmount = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    return numbers ? parseInt(numbers, 10).toLocaleString() : '';
  };

  const handleAddGoal = () => {
    if (!goalName.trim() || !targetAmount) return;
    addGoal({
      name: goalName.trim(),
      targetAmount: parseInt(targetAmount.replace(/,/g, ''), 10),
      icon: selectedIcon,
      color: selectedColor,
    });
    setGoalName('');
    setTargetAmount('');
    setSelectedIcon('🎯');
    setSelectedColor('#7c3aed');
    setShowAddModal(false);
  };

  const handleSave = () => {
    if (!saveAmount || !selectedGoalId) return;
    addSavings(selectedGoalId, parseInt(saveAmount.replace(/,/g, ''), 10));
    setSaveAmount('');
    setSelectedGoalId(null);
    setShowSaveModal(false);
  };

  const handleDeleteGoal = (id: string, name: string) => {
    Alert.alert(t('deleteGoalTitle'), tf('deleteGoalConfirm', { name }), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteGoal(id) },
    ]);
  };

  const totalSaved = getTotalSaved();
  const totalTarget = getTotalTarget();
  const overallProgress = getOverallProgress();

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('savings')}</Text>
      </View>

      {/* 자동 슬라이드 튜토리얼 */}
      {goals.length === 0 && showTutorial && (
        <View style={[styles.card, { backgroundColor: colors.card, marginHorizontal: 20, overflow: 'hidden' }]}>
          {/* 닫기 버튼 */}
          <TouchableOpacity
            onPress={() => setShowTutorial(false)}
            style={{ position: 'absolute', top: 12, right: 12, zIndex: 1, padding: 4 }}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* 슬라이드 콘텐츠 */}
          <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 40 }}>{TUTORIAL_SLIDES[tutorialStep].emoji}</Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
              {TUTORIAL_SLIDES[tutorialStep].title}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
              {TUTORIAL_SLIDES[tutorialStep].desc}
            </Text>
          </View>

          {/* 인디케이터 */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', paddingBottom: 16, gap: 8 }}>
            {TUTORIAL_SLIDES.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setTutorialStep(idx)}
                style={{ width: idx === tutorialStep ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: idx === tutorialStep ? colors.primary : colors.border }}
              />
            ))}
          </View>

          {/* 시작하기 버튼 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => { setShowTutorial(false); setShowAddModal(true); }}
            style={{ backgroundColor: colors.primary, marginHorizontal: 16, marginBottom: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('createFirstGoal')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 목표 추가 버튼 */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setShowAddModal(true)}
        style={[styles.card, { backgroundColor: colors.card, marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }]}
      >
        <Ionicons name="add-circle" size={22} color={colors.primary} />
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600', marginLeft: 8 }}>{t('newGoalAdd')}</Text>
      </TouchableOpacity>

      {/* 목표 리스트 */}
      {goals.length > 0 ? (
        <View style={{ marginHorizontal: 20 }}>
          {goals.map(goal => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const remaining = goal.targetAmount - goal.currentAmount;
            return (
              <View key={goal.id} style={[styles.card, { backgroundColor: colors.card, marginHorizontal: 0 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={{ fontSize: 28 }}>{goal.icon}</Text>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{goal.name}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                        {t('target')} {currencySymbol}{goal.targetAmount.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteGoal(goal.id, goal.name)} style={{ padding: 4 }}>
                    <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: goal.color || colors.schedule, fontSize: 18, fontWeight: 'bold' }}>
                      {currencySymbol}{goal.currentAmount.toLocaleString()}
                    </Text>
                    <Text style={{ color: goal.color || colors.primary, fontSize: 14, fontWeight: '600' }}>{progress.toFixed(0)}%</Text>
                  </View>
                  <View style={{ height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.min(progress, 100)}%`, height: '100%', backgroundColor: goal.isCompleted ? colors.schedule : (goal.color || colors.primary), borderRadius: 4 }} />
                  </View>

                  {/* 마일스톤 */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 4 }}>
                    {MILESTONES.map(milestone => {
                      const achieved = progress >= milestone.percent;
                      return (
                        <View key={milestone.percent} style={{ alignItems: 'center' }}>
                          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: achieved ? (goal.color || colors.primary) + '30' : colors.bg, borderWidth: achieved ? 2 : 1, borderColor: achieved ? (goal.color || colors.primary) : colors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={{ fontSize: 12 }}>{achieved ? milestone.icon : '○'}</Text>
                          </View>
                          <Text style={{ fontSize: 10, color: achieved ? (goal.color || colors.primary) : colors.textMuted }}>{milestone.percent}%</Text>
                        </View>
                      );
                    })}
                  </View>

                  {remaining > 0 && (
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 12 }}>
                      {t('remaining')}: {currencySymbol}{remaining.toLocaleString()}
                    </Text>
                  )}
                  {goal.isCompleted && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.schedule} />
                      <Text style={{ color: colors.schedule, fontSize: 13, marginLeft: 4 }}>{t('goalAchieved')}</Text>
                    </View>
                  )}
                </View>

                {!goal.isCompleted && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => { setSelectedGoalId(goal.id); setShowSaveModal(true); }}
                    style={{ backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, marginTop: 16, alignItems: 'center' }}
                  >
                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>{t('deposit')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.card, marginHorizontal: 20, alignItems: 'center', paddingVertical: 40 }]}>
          <Ionicons name="flag-outline" size={48} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, marginTop: 12 }}>{t('noSavingGoal')}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>{t('addNewGoal')}</Text>
        </View>
      )}

      {/* 팁 */}
      <View style={[styles.card, { backgroundColor: colors.primary + '15', marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: colors.primary }]}>
        <Text style={{ fontSize: 20, marginRight: 12 }}>💡</Text>
        <Text style={{ color: colors.textMuted, fontSize: 13, flex: 1, lineHeight: 20 }}>
          {t('savingTip')}
        </Text>
      </View>

      <View style={{ height: 100 }} />

      {/* 목표 추가 모달 */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>{t('newSavingGoal')}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 8 }}>{t('selectIcon')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {GOAL_ICONS.map(icon => (
                <TouchableOpacity
                  key={icon}
                  onPress={() => setSelectedIcon(icon)}
                  style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: selectedIcon === icon ? colors.primary + '30' : colors.bg, justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: selectedIcon === icon ? 2 : 0, borderColor: colors.primary }}
                >
                  <Text style={{ fontSize: 22 }}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 8 }}>{t('goalName')}</Text>
            <TextInput
              value={goalName}
              onChangeText={setGoalName}
              placeholder={t('goalNameExample')}
              placeholderTextColor={colors.textMuted}
              style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 14, color: colors.text, fontSize: 16, marginBottom: 16 }}
            />

            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 8 }}>{t('targetAmount')}</Text>
            <TextInput
              value={targetAmount}
              onChangeText={t => setTargetAmount(formatAmount(t))}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 14, color: colors.text, fontSize: 16, marginBottom: 16 }}
            />

            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 8 }}>{t('selectColor')}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
              {GOAL_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color, justifyContent: 'center', alignItems: 'center', borderWidth: selectedColor === color ? 3 : 0, borderColor: 'white' }}
                >
                  {selectedColor === color && <Ionicons name="checkmark" size={18} color="white" />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAddGoal}
              style={{ backgroundColor: selectedColor, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('addGoalBtn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 저금 모달 */}
      <Modal visible={showSaveModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>{t('deposit')}</Text>
              <TouchableOpacity onPress={() => { setShowSaveModal(false); setSaveAmount(''); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 8 }}>{t('depositAmount')}</Text>
            <TextInput
              value={saveAmount}
              onChangeText={t => setSaveAmount(formatAmount(t))}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 14, color: colors.text, fontSize: 16, marginBottom: 16 }}
            />

            {/* 빠른 금액 버튼 */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {QUICK_AMOUNTS.map(amount => (
                <TouchableOpacity
                  key={amount}
                  onPress={() => setSaveAmount(amount.toLocaleString())}
                  style={{ flex: 1, backgroundColor: colors.bg, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>{tf('quickAmountWan', { amount: (amount / 10000).toFixed(0) })}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSave}
              style={{ backgroundColor: colors.schedule, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('deposit')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ============ EXPENSES SCREEN ============
function ExpensesScreen() {
  const { expenses } = useExpenses();
  const { colors } = useTheme();
  const { isPremium, setShowUpgradeModal } = usePremium();
  const { settings } = useSettings();
  const t = (key: string) => getTranslation(settings.language, key);
  const tf = (key: string, values: Record<string, string | number>) => formatTranslation(settings.language, key, values);
  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || '₩';
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showExpenseView, setShowExpenseView] = useState(false);
  const [showAnalysisView, setShowAnalysisView] = useState(false);

  const screenWidth = Dimensions.get('window').width;

  // 프리미엄 기능 체크
  const handlePDFExport = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    setShowPDFPreview(true);
  };

  const handleViewModeChange = (mode: 'day' | 'week' | 'month') => {
    if ((mode === 'week' || mode === 'month') && !isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    setViewMode(mode);
  };

  const today = new Date();
  const days = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];

  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // 이번 달 지출 상세
  const thisMonthExpenses = expenses.filter(e => {
    const [y, m] = e.date.split('-').map(Number);
    return y === currentYear && m === currentMonth;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const totalAmount = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // PDF 내보내기
  const exportToPDF = async () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { font-size: 24px; margin-bottom: 8px; }
          .header p { opacity: 0.9; font-size: 14px; }
          .summary { padding: 24px; border-bottom: 1px solid #e5e7eb; }
          .summary-title { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .summary-amount { color: #ef4444; font-size: 32px; font-weight: bold; }
          .summary-count { color: #6b7280; font-size: 14px; margin-top: 4px; }
          .section { padding: 20px 24px; }
          .section-title { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #7c3aed; display: inline-block; }
          .expense-item { background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
          .expense-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
          .expense-date { color: #6b7280; font-size: 12px; }
          .expense-memo { font-weight: 600; color: #1f2937; font-size: 15px; margin-top: 2px; }
          .expense-amount { color: #ef4444; font-weight: bold; font-size: 16px; }
          .expense-items { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #d1d5db; }
          .expense-items-title { font-size: 11px; color: #9ca3af; margin-bottom: 8px; }
          .item-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
          .item-name { color: #4b5563; }
          .item-amount { color: #6b7280; }
          .item-checked { text-decoration: line-through; color: #9ca3af; }
          .footer { background: #f9fafb; padding: 20px 24px; text-align: center; color: #9ca3af; font-size: 12px; }
          .no-items { color: #9ca3af; font-size: 14px; text-align: center; padding: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 ${t('expenseReport')}</h1>
            <p>${tf('yearMonth', { year: currentYear, month: currentMonth })}</p>
          </div>

          <div class="summary">
            <div class="summary-title">${t('totalExpenseThisMonth')}</div>
            <div class="summary-amount">${totalAmount.toLocaleString()}${t('won')}</div>
            <div class="summary-count">${tf('expenseCount', { count: thisMonthExpenses.length })}</div>
          </div>

          <div class="section">
            <div class="section-title">${t('detailedHistory')}</div>
            ${thisMonthExpenses.length > 0 ? thisMonthExpenses.map(expense => {
              const [y, m, d] = expense.date.split('-').map(Number);
              const date = new Date(y, m - 1, d);
              const dayName = days[date.getDay()];
              return `
                <div class="expense-item">
                  <div class="expense-header">
                    <div>
                      <div class="expense-date">${tf('dayWithWeek', { month: m, day: d, week: dayName })}</div>
                      <div class="expense-memo">${t('purchase')} (${expense.memo})</div>
                    </div>
                    <div class="expense-amount">${expense.amount.toLocaleString()}${t('won')}</div>
                  </div>
                  ${expense.items && expense.items.length > 0 ? `
                    <div class="expense-items">
                      <div class="expense-items-title">${t('purchaseItems')}</div>
                      ${expense.items.map(item => `
                        <div class="item-row">
                          <span class="item-name ${item.checked ? 'item-checked' : ''}">${item.checked ? '✓ ' : ''}${item.name}</span>
                          <span class="item-amount">${item.amount.toLocaleString()}${t('won')}</span>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('') : `<div class="no-items">${t('noExpenseRecorded')}</div>`}
          </div>

          <div class="footer">
            Mohani Simple · ${new Date().toLocaleDateString('ko-KR')} 생성
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('오류', 'PDF 생성에 실패했습니다');
    }
  };

  // 일간: 날짜별 총금액
  const getDailyData = () => {
    const grouped: Record<string, number> = {};
    expenses.forEach(e => {
      grouped[e.date] = (grouped[e.date] || 0) + e.amount;
    });
    return Object.entries(grouped)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 30); // 최근 30일
  };

  // 주간: 주차별 총금액
  const getWeeklyData = () => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const weeks: { label: string; total: number; dates: string }[] = [];

    // 이번 달 주차별 계산
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let weekNum = 1;
    let weekStart = new Date(firstDay);

    while (weekStart <= lastDay) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + (6 - weekStart.getDay()));
      if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime());

      const startStr = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      const endStr = `${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;

      // 해당 주의 지출 합계
      let total = 0;
      expenses.forEach(e => {
        const [ey, em, ed] = e.date.split('-').map(Number);
        const expDate = new Date(ey, em - 1, ed);
        if (expDate >= weekStart && expDate <= weekEnd) {
          total += e.amount;
        }
      });

      const weekNames = ['첫째주', '둘째주', '셋째주', '넷째주', '다섯째주'];
      weeks.push({
        label: `${month + 1}월 ${weekNames[weekNum - 1] || weekNum + '주'}`,
        total,
        dates: `${startStr} ~ ${endStr}`
      });

      // 다음 주 시작
      weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() + 1);
      weekNum++;
    }

    return weeks;
  };

  // 월간: 월별 총금액
  const getMonthlyData = () => {
    const months: { label: string; total: number; count: number }[] = [];

    for (let i = 0; i < 6; i++) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const y = targetDate.getFullYear();
      const m = targetDate.getMonth() + 1;

      let total = 0;
      let count = 0;
      expenses.forEach(e => {
        const [ey, em] = e.date.split('-').map(Number);
        if (ey === y && em === m) {
          total += e.amount;
          count++;
        }
      });

      months.push({ label: tf('monthOnly', { month: m }), total, count });
    }

    return months;
  };

  const dailyData = getDailyData();
  const weeklyData = getWeeklyData();
  const monthlyData = getMonthlyData();

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return tf('dayWithWeek', { month: m, day: d, week: days[date.getDay()] });
  };

  // 날짜별 지출 상세 가져오기
  const getExpensesByDate = (date: string) => expenses.filter(e => e.date === date);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('expenses')}</Text>
      </View>

      {/* 지출 보기 섹션 */}
      <View style={[styles.card, { backgroundColor: colors.card, marginHorizontal: 20 }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowExpenseView(!showExpenseView)}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="receipt" size={22} color={colors.expense} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('viewExpenses')}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                {tf('thisMonthAmount', { amount: totalAmount.toLocaleString() })}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity activeOpacity={0.6} onPress={handlePDFExport} style={{ padding: 4 }}>
              {!isPremium && <Ionicons name="lock-closed" size={10} color={colors.textMuted} style={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }} />}
              <Ionicons name="document-text-outline" size={20} color={isPremium ? colors.primary : colors.textMuted} />
            </TouchableOpacity>
            <Ionicons name={showExpenseView ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        {showExpenseView && (
          <>
            {/* View Mode Toggle */}
            <View style={[styles.tabContainer, { backgroundColor: colors.bg, marginTop: 16 }]}>
              <TouchableOpacity
                style={[styles.tab, viewMode === 'day' && styles.activeTab]}
                onPress={() => handleViewModeChange('day')}
              >
                <Text style={[styles.tabText, { color: viewMode === 'day' ? colors.primary : colors.textMuted }]}>{t('daily')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, viewMode === 'week' && styles.activeTab]}
                onPress={() => handleViewModeChange('week')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[styles.tabText, { color: viewMode === 'week' ? colors.primary : colors.textMuted }]}>{t('weekly')}</Text>
                  {!isPremium && <Ionicons name="lock-closed" size={10} color={colors.textMuted} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, viewMode === 'month' && styles.activeTab]}
                onPress={() => handleViewModeChange('month')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[styles.tabText, { color: viewMode === 'month' ? colors.primary : colors.textMuted }]}>{t('monthlyView')}</Text>
                  {!isPremium && <Ionicons name="lock-closed" size={10} color={colors.textMuted} />}
                </View>
              </TouchableOpacity>
            </View>

            {/* Expenses List */}
            <View style={{ marginTop: 12 }}>
        {viewMode === 'day' && (
          dailyData.length > 0 ? (
            dailyData.map(([date, total]) => {
              const isExpanded = expandedDate === date;
              const dateExpenses = getExpensesByDate(date);
              return (
                <View key={date}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.expenseRow, { backgroundColor: colors.card }]}
                    onPress={() => setExpandedDate(isExpanded ? null : date)}
                  >
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[styles.expenseRowLabel, { color: colors.text }]}>{formatDate(date)}</Text>
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
                    </View>
                    <Text style={[styles.expenseRowAmount, { color: colors.expense }]}>{currencySymbol}{total.toLocaleString()}</Text>
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={[styles.expandedDetail, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                      {dateExpenses.map(expense => (
                        <View key={expense.id} style={styles.detailItem}>
                          <View style={styles.detailHeader}>
                            <Text style={[styles.detailMemo, { color: colors.text }]}>{t('purchase')} ({expense.memo})</Text>
                            <Text style={[styles.detailAmount, { color: colors.expense }]}>{currencySymbol}{expense.amount.toLocaleString()}</Text>
                          </View>
                          {expense.items && expense.items.length > 0 && (
                            <View style={styles.detailItems}>
                              {expense.items.map((item, idx) => (
                                <View key={idx} style={styles.detailItemRow}>
                                  <Ionicons
                                    name={item.checked ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={14}
                                    color={item.checked ? colors.schedule : colors.textMuted}
                                  />
                                  <Text style={[styles.detailItemName, { color: colors.text }, item.checked && { textDecorationLine: 'line-through', color: colors.textMuted }]}>
                                    {item.name}
                                  </Text>
                                  <Text style={[styles.detailItemAmount, { color: colors.textMuted }]}>{currencySymbol}{item.amount.toLocaleString()}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noExpenseHistory')}</Text>
            </View>
          )
        )}

        {viewMode === 'week' && (
          weeklyData.length > 0 ? (
            weeklyData.map((week, idx) => (
              <View key={idx} style={[styles.expenseRow, { backgroundColor: colors.card }]}>
                <View>
                  <Text style={[styles.expenseRowLabel, { color: colors.text }]}>{week.label}</Text>
                  <Text style={[styles.expenseRowSub, { color: colors.textMuted }]}>{week.dates}</Text>
                </View>
                <Text style={[styles.expenseRowAmount, { color: colors.expense }]}>{currencySymbol}{week.total.toLocaleString()}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noExpenseHistory')}</Text>
            </View>
          )
        )}

        {viewMode === 'month' && (
          monthlyData.length > 0 ? (
            monthlyData.map((month, idx) => (
              <View key={idx} style={[styles.expenseRow, { backgroundColor: colors.card }]}>
                <View>
                  <Text style={[styles.expenseRowLabel, { color: colors.text }]}>{month.label}</Text>
                  <Text style={[styles.expenseRowSub, { color: colors.textMuted }]}>{month.count}건</Text>
                </View>
                <Text style={[styles.expenseRowAmount, { color: colors.expense }]}>{currencySymbol}{month.total.toLocaleString()}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noExpenseHistory')}</Text>
            </View>
          )
        )}
            </View>
          </>
        )}
      </View>

      {/* 재정 분석 섹션 */}
      <View style={[styles.card, { backgroundColor: colors.card, marginHorizontal: 20, marginTop: 16 }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowAnalysisView(!showAnalysisView)}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="pie-chart" size={22} color={colors.primary} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('financialAnalysis')}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                {t('financialAnalysisSubtitle')}
              </Text>
            </View>
          </View>
          <Ionicons name={showAnalysisView ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textMuted} />
        </TouchableOpacity>

        {showAnalysisView && (
          <AnalysisContent />
        )}
      </View>

      <View style={{ height: 40 }} />

      {/* PDF 미리보기 모달 */}
      <Modal visible={showPDFPreview} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.screen, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity activeOpacity={0.6} onPress={() => setShowPDFPreview(false)} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>PDF 미리보기</Text>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => { setShowPDFPreview(false); exportToPDF(); }}
              style={{ padding: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="share-outline" size={20} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '600' }}>내보내기</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }}>
            {/* PDF 미리보기 내용 */}
            <LinearGradient colors={['#7c3aed', '#a855f7']} style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 4 }}>📊 {t('expenseReport')}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>{tf('yearMonth', { year: currentYear, month: currentMonth })}</Text>
            </LinearGradient>

            <View style={{ padding: 20, backgroundColor: colors.card, marginHorizontal: 16, marginTop: -12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>{t('totalExpenseThisMonth')}</Text>
              <Text style={{ color: colors.expense, fontSize: 28, fontWeight: 'bold' }}>{totalAmount.toLocaleString()}{t('won')}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>{tf('expenseCount', { count: thisMonthExpenses.length })}</Text>
            </View>

            <View style={{ padding: 16, marginTop: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 12, paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: colors.primary, alignSelf: 'flex-start' }}>{t('detailedHistory')}</Text>

              {thisMonthExpenses.length > 0 ? thisMonthExpenses.map(expense => {
                const [y, m, d] = expense.date.split('-').map(Number);
                const date = new Date(y, m - 1, d);
                const dayName = days[date.getDay()];
                return (
                  <View key={expense.id} style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View>
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{tf('dayWithWeek', { month: m, day: d, week: dayName })}</Text>
                        <Text style={{ fontWeight: '600', color: colors.text, fontSize: 15, marginTop: 2 }}>{t('purchase')} ({expense.memo})</Text>
                      </View>
                      <Text style={{ color: colors.expense, fontWeight: 'bold', fontSize: 16 }}>{expense.amount.toLocaleString()}{t('won')}</Text>
                    </View>
                    {expense.items && expense.items.length > 0 && (
                      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, borderStyle: 'dashed' }}>
                        <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>{t('purchaseItems')}</Text>
                        {expense.items.map((item, idx) => (
                          <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                            <Text style={[{ fontSize: 13, color: colors.text }, item.checked && { textDecorationLine: 'line-through', color: colors.textMuted }]}>
                              {item.checked ? '✓ ' : ''}{item.name}
                            </Text>
                            <Text style={{ fontSize: 13, color: colors.textMuted }}>{currencySymbol}{item.amount.toLocaleString()}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              }) : (
                <View style={{ alignItems: 'center', padding: 40 }}>
                  <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, marginTop: 12 }}>{t('noExpenseRecorded')}</Text>
                </View>
              )}
            </View>

            <View style={{ padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Mohani Simple · {new Date().toLocaleDateString('ko-KR')} 생성</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ============ TAB NAVIGATOR ============
const Tab = createBottomTabNavigator();

function AppContent() {
  const { isDark, colors } = useTheme();
  const { settings } = useSettings();
  const t = (key: string) => getTranslation(settings.language, key);

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tab.Navigator screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Savings') {
            return <Image source={require('./assets/saving.png')} style={{ width: 24, height: 24, opacity: focused ? 1 : 0.6 }} resizeMode="contain" />;
          }
          let icon: keyof typeof Ionicons.glyphMap = 'calendar';
          if (route.name === 'Calendar') icon = focused ? 'calendar' : 'calendar-outline';
          if (route.name === 'Expenses') icon = focused ? 'wallet' : 'wallet-outline';
          if (route.name === 'Settings') icon = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}>
        <Tab.Screen name="Calendar" component={CalendarScreen} options={{ tabBarLabel: t('calendar') }} />
        <Tab.Screen name="Expenses" component={ExpensesScreen} options={{ tabBarLabel: t('expenses') }} />
        <Tab.Screen name="Savings" component={SavingsScreen} options={{ tabBarLabel: t('savings') }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: t('settings') }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ============ UPGRADE MODAL ============
function UpgradeModal() {
  const { showUpgradeModal, setShowUpgradeModal, purchasePremium, restorePurchase } = usePremium();
  const { colors } = useTheme();
  const { settings } = useSettings();
  const t = (key: string) => getTranslation(settings.language, key);

  const features = [
    { icon: 'document-text', title: 'PDF 내보내기', desc: '지출 리포트를 PDF로 저장' },
    { icon: 'calendar', title: '월 이동', desc: '전달/다음달 자유롭게 탐색' },
    { icon: 'infinite', title: '무제한 기록', desc: '월 10건 제한 없이 무제한 기록' },
    { icon: 'stats-chart', title: '주간/월간 통계', desc: '상세한 지출 통계 확인' },
  ];

  return (
    <Modal visible={showUpgradeModal} animationType="slide" transparent>
      <View style={upgradeStyles.overlay}>
        <View style={[upgradeStyles.content, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={upgradeStyles.closeBtn} onPress={() => setShowUpgradeModal(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>

          <LinearGradient
            colors={['#7c3aed', '#a855f7']}
            style={upgradeStyles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={upgradeStyles.crown}>👑</Text>
            <Text style={upgradeStyles.title}>{t('premiumTitle')}</Text>
            <Text style={upgradeStyles.subtitle}>{t('premiumSubtitle')}</Text>
          </LinearGradient>

          <View style={upgradeStyles.features}>
            {features.map((feature, index) => (
              <View key={index} style={upgradeStyles.featureRow}>
                <View style={[upgradeStyles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name={feature.icon as any} size={22} color={colors.primary} />
                </View>
                <View style={upgradeStyles.featureText}>
                  <Text style={[upgradeStyles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                  <Text style={[upgradeStyles.featureDesc, { color: colors.textMuted }]}>{feature.desc}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
              </View>
            ))}
          </View>

          <View style={upgradeStyles.priceContainer}>
            <Text style={[upgradeStyles.price, { color: colors.text }]}>₩4,900</Text>
            <Text style={[upgradeStyles.priceDesc, { color: colors.textMuted }]}>평생 이용권 (1회 결제)</Text>
          </View>

          <TouchableOpacity activeOpacity={0.8} onPress={purchasePremium}>
            <LinearGradient
              colors={['#7c3aed', '#a855f7']}
              style={upgradeStyles.purchaseBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={upgradeStyles.purchaseBtnText}>{t('purchasePremium')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={upgradeStyles.restoreBtn} onPress={restorePurchase}>
            <Text style={[upgradeStyles.restoreBtnText, { color: colors.textMuted }]}>{t('restorePurchase')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const upgradeStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden' },
  closeBtn: { position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 8 },
  header: { paddingTop: 40, paddingBottom: 24, alignItems: 'center' },
  crown: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  features: { padding: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  featureIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '600' },
  featureDesc: { fontSize: 12, marginTop: 2 },
  priceContainer: { alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  price: { fontSize: 32, fontWeight: 'bold' },
  priceDesc: { fontSize: 13, marginTop: 4 },
  purchaseBtn: { marginHorizontal: 20, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  purchaseBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  restoreBtn: { alignItems: 'center', paddingVertical: 16 },
  restoreBtnText: { fontSize: 14 },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <PremiumProvider>
          <ExpenseProvider>
            <ScheduleProvider>
              <RecurringProvider>
                <IncomeProvider>
                  <GoalsProvider>
                    <SettingsProvider>
                      <AppContent />
                      <UpgradeModal />
                    </SettingsProvider>
                  </GoalsProvider>
                </IncomeProvider>
              </RecurringProvider>
            </ScheduleProvider>
          </ExpenseProvider>
        </PremiumProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.text },

  // Legacy calendar styles (kept for compatibility)
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

  // Modern Calendar Styles
  calendarHeader: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  calendarHeaderContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  calendarYear: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  calendarMonth: { fontSize: 36, color: '#fff', fontWeight: 'bold', marginTop: 2 },
  calendarToday: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, alignItems: 'center' },
  calendarTodayNum: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  calendarTodayLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  calendarTodayBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 },
  calendarTodayBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  navButton: { padding: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' },
  calendarCard: { marginHorizontal: 16, marginTop: -16, borderRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  weekHeaderModern: { flexDirection: 'row', marginBottom: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  weekDayWrapper: { flex: 1, alignItems: 'center' },
  weekDayModern: { fontSize: 13, fontWeight: '600' },
  calendarGrid: { paddingVertical: 8 },
  weekRowModern: { flexDirection: 'row', marginBottom: 4 },
  dayCellModern: { flex: 1, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', margin: 2 },
  dayCellInner: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 14 },
  todayCellModern: { backgroundColor: 'rgba(102, 126, 234, 0.15)', borderWidth: 2, borderColor: '#667eea', borderRadius: 14 },
  selectedCellModern: { backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  selectedCellGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 14, shadowColor: '#667eea', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  dayTextModern: { fontSize: 15, fontWeight: '600' },
  todayTextModern: { color: '#667eea', fontWeight: '800' },
  selectedTextModern: { color: '#fff', fontWeight: '700', fontSize: 16 },
  dotsModern: { flexDirection: 'row', marginTop: 3, gap: 4 },
  dotModern: { width: 6, height: 6, borderRadius: 3 },
  legendModern: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  legendItemModern: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTextModern: { fontSize: 12, fontWeight: '500' },

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
  addBtnSmall: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
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
  expenseModalContent: { width: '100%', maxHeight: '85%', borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: 'auto' },
  expenseModalScroll: { padding: 20 },

  scheduleItem: { backgroundColor: Colors.bg, padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scheduleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  scheduleDot: { width: 10, height: 10, borderRadius: 5 },
  scheduleTitle: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  scheduleInfo: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },

  expenseItem: { backgroundColor: Colors.bg, padding: 16, borderRadius: 12, marginBottom: 10 },
  expenseHeader: { flexDirection: 'row', alignItems: 'center' },
  expenseCategory: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  expenseAmount: { color: Colors.expense, fontSize: 16, fontWeight: 'bold' },
  expenseMemo: { color: Colors.textMuted, fontSize: 14 },
  itemsDetail: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  itemDetailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  itemDetailName: { flex: 1, color: Colors.text, fontSize: 14 },
  itemDetailAmount: { color: Colors.textMuted, fontSize: 14 },

  tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: Colors.card, borderRadius: 12, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8, borderRadius: 10 },
  activeTab: { backgroundColor: Colors.bg },
  tabText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  activeTabText: { color: Colors.text },

  // Expense rows for ExpensesScreen
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 2 },
  expenseRowLabel: { fontSize: 16, fontWeight: '600' },
  expenseRowSub: { fontSize: 13, marginTop: 2 },
  expenseRowAmount: { fontSize: 18, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  expandedDetail: { marginBottom: 10, paddingHorizontal: 16, paddingBottom: 12, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginTop: -2 },
  detailItem: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailMemo: { fontSize: 14, fontWeight: '500' },
  detailAmount: { fontSize: 14, fontWeight: '600' },
  detailItems: { marginTop: 8, paddingLeft: 4 },
  detailItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 },
  detailItemName: { flex: 1, fontSize: 13 },
  detailItemAmount: { fontSize: 13 },

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
  input: { padding: 12, borderRadius: 8, borderWidth: 1, fontSize: 16 },

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
  memoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124, 58, 237, 0.1)', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, gap: 6, minHeight: 48 },
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

  memoItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.bg, padding: 16, borderRadius: 12, marginBottom: 8 },
  memoItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  memoItemName: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  memoItemDetail: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },

  savedMemosModal: { backgroundColor: Colors.card, borderRadius: 16, width: '90%', maxHeight: '70%', padding: 16 },
  savedMemosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  savedMemosTitle: { color: Colors.text, fontSize: 18, fontWeight: '600' },
  savedMemosList: { maxHeight: 300 },
  noMemosText: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 40 },
  savedMemoItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 12, padding: 16, marginBottom: 10, minHeight: 56 },
  savedMemoInfo: { flex: 1 },
  savedMemoName: { color: Colors.text, fontSize: 16, fontWeight: '500' },
  savedMemoDetails: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  deleteMemoButton: { padding: 12, marginLeft: 8 },
  newMemoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 12, gap: 6, borderTopWidth: 1, borderTopColor: Colors.border },
  newMemoButtonText: { color: Colors.primary, fontSize: 14, fontWeight: '500' },

  // Theme toggle
  themeToggle: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center', padding: 2 },
  themeToggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
});
