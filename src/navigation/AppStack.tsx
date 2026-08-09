import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AddExpenseScreen from '../screens/AddExpenseScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ExpenseDetailScreen from '../screens/ExpenseDetailScreen';
import TabNavigator from './TabNavigator';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
      <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
    </Stack.Navigator>
  );
}

export default AppStack;
