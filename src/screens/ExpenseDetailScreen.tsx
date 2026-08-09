import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useCategories } from '../hooks/use-categories';
import { hexToRgba } from '../lib/color';
import { formatLongDateString } from '../lib/date-range';
import { formatCurrency } from '../lib/format-currency';
import { toMaterialIconName } from '../lib/icon-name';
import { deleteExpense, getExpenseById } from '../services/expenses-service';
import type { AppStackParamList } from '../navigation/types';
import type { Expense } from '../types/expense';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type ExpenseDetailNavigationProp = NativeStackNavigationProp<AppStackParamList, 'ExpenseDetail'>;

function ExpenseDetailScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'ExpenseDetail'>>();
  const navigation = useNavigation<ExpenseDetailNavigationProp>();
  const { expenseId } = route.params;
  const { categories } = useCategories();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await getExpenseById(expenseId);
          if (active) setExpense(data);
        } catch (e) {
          if (active) setError(e as Error);
        } finally {
          if (active) setLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [expenseId]),
  );

  const category = expense?.category_id
    ? categories.find(item => item.id === expense.category_id) ?? null
    : null;
  const color = category?.color ?? '#64748b';
  const note = expense?.note?.trim();
  const title = note ? note : (category?.name ?? 'Uncategorized');

  async function handleDelete() {
    if (!expense) return;
    setActionError(null);
    try {
      setDeleting(true);
      await deleteExpense(expense.id);
      navigation.goBack();
    } catch (e) {
      console.error(e);
      setActionError('Couldn’t delete this expense. Please try again.');
      setDeleting(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete expense?', 'This will permanently remove this expense.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: handleDelete },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={23} color="#16181c" />
        </Pressable>
        <Text style={styles.headerTitle}>Expense details</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#7c3aed" />
        </View>
      ) : error || !expense ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Couldn’t load this expense.</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Text style={styles.retryLabel}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.summary}>
            <View style={[styles.iconTile, { backgroundColor: hexToRgba(color, 0.13) }]}>
              <MaterialIcons
                name={(category ? toMaterialIconName(category.icon) : 'category') as IconName}
                size={38}
                color={color}
              />
            </View>
            <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>

          <View style={styles.detailCard}>
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>Category</Text>
              <View style={styles.categoryValue}>
                <View style={[styles.categoryDot, { backgroundColor: color }]} />
                <Text style={styles.detailValue}>{category?.name ?? 'Uncategorized'}</Text>
              </View>
            </View>
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatLongDateString(expense.date)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Note</Text>
              <Text style={styles.detailValue}>{note ? note : '—'}</Text>
            </View>
          </View>

          {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, styles.editButton]}
              onPress={() => navigation.navigate('AddExpense', { expenseId: expense.id })}
              accessibilityRole="button"
              accessibilityLabel="Edit expense">
              <MaterialIcons name="edit" size={20} color="#7c3aed" />
              <Text style={styles.editLabel}>Edit</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.deleteButton, deleting && styles.deleteButtonDisabled]}
              onPress={confirmDelete}
              disabled={deleting}
              accessibilityRole="button"
              accessibilityLabel="Delete expense">
              <MaterialIcons name="delete" size={20} color="#dc2626" />
              <Text style={styles.deleteLabel}>{deleting ? 'Deleting…' : 'Delete'}</Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 26,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(20,22,40,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16181c',
    marginLeft: 4,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a5f6c',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#7c3aed',
  },
  retryLabel: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  summary: {
    alignItems: 'center',
    marginBottom: 26,
  },
  iconTile: {
    width: 74,
    height: 74,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  amount: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    color: '#16181c',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5a5f6c',
    marginTop: 4,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginBottom: 22,
    shadowColor: 'rgba(20,22,40,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f1f4',
  },
  detailLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#8a90a0',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16181c',
  },
  categoryValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  categoryDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  actionError: {
    color: '#dc2626',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 15,
    borderRadius: 16,
  },
  editButton: {
    borderWidth: 1.5,
    borderColor: '#7c3aed',
    backgroundColor: '#ffffff',
  },
  editLabel: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#7c3aed',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteLabel: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#dc2626',
  },
});

export default ExpenseDetailScreen;
