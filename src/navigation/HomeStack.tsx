import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import ExpenseHistoryScreen from '../screens/ExpenseHistoryScreen';
import GoalsScreen from '../screens/GoalsScreen';
import SplitExpenseScreen from '../screens/SplitExpenseScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import ExpenseSearchScreen from '../screens/ExpenseSearchScreen';

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
    </Stack.Navigator>
  );
}
