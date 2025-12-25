import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import ExpenseHistoryScreen from '../screens/ExpenseHistoryScreen';
import GoalsScreen from '../screens/GoalsScreen';
import SplitExpenseScreen from '../screens/SplitExpenseScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import ExpenseSearchScreen from '../screens/ExpenseSearchScreen';
import ExpenseInsightsScreen from '../screens/ExpenseInsightsScreen';
import SpendingTrendsScreen from '../screens/SpendingTrendsScreen';
import MonthlyReportScreen from '../screens/MonthlyReportScreen';
import ExpenseCalendarScreen from '../screens/ExpenseCalendarScreen';
import SpendingByLocationScreen from '../screens/SpendingByLocationScreen';
import DataBackupScreen from '../screens/DataBackupScreen';
import BudgetSettingsScreen from '../screens/BudgetSettingsScreen';
import FixedExpensesScreen from '../screens/FixedExpensesScreen';
import ExpenseComparisonScreen from '../screens/ExpenseComparisonScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="ExpenseHistory" component={ExpenseHistoryScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="SplitExpense" component={SplitExpenseScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="ExpenseSearch" component={ExpenseSearchScreen} />
      <Stack.Screen name="ExpenseInsights" component={ExpenseInsightsScreen} />
      <Stack.Screen name="SpendingTrends" component={SpendingTrendsScreen} />
      <Stack.Screen name="MonthlyReport" component={MonthlyReportScreen} />
      <Stack.Screen name="ExpenseCalendar" component={ExpenseCalendarScreen} />
      <Stack.Screen name="SpendingByLocation" component={SpendingByLocationScreen} />
      <Stack.Screen name="DataBackup" component={DataBackupScreen} />
      <Stack.Screen name="BudgetSettings" component={BudgetSettingsScreen} />
      <Stack.Screen name="FixedExpenses" component={FixedExpensesScreen} />
      <Stack.Screen name="ExpenseComparison" component={ExpenseComparisonScreen} />
    </Stack.Navigator>
  );
}
