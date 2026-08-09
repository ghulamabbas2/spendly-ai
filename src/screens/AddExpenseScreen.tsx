import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CategoryPickerSheet from '../components/CategoryPickerSheet';
import DatePickerModal from '../components/DatePickerModal';
import { useCategories } from '../hooks/use-categories';
import { hexToRgba } from '../lib/color';
import { formatLongDate, toDateString } from '../lib/date-range';
import { toMaterialIconName } from '../lib/icon-name';
import { expenseInputSchema } from '../lib/validation/expense-schema';
import { createExpense } from '../services/expenses-service';
import type { AppStackParamList } from '../navigation/types';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type AddExpenseNavigationProp = NativeStackNavigationProp<AppStackParamList, 'AddExpense'>;

function sanitizeAmountInput(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
}

function AddExpenseScreen() {
  const navigation = useNavigation<AddExpenseNavigationProp>();
  const insets = useSafeAreaInsets();
  const { categories } = useCategories();

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedCategory = categories.find(category => category.id === categoryId) ?? null;
  const canSave = Number(amount) > 0 && !!categoryId && !submitting;
  const categoryIconChipStyle = {
    backgroundColor: selectedCategory ? hexToRgba(selectedCategory.color, 0.13) : '#f2f3f6',
  };

  async function handleSave() {
    setAmountError(null);
    setCategoryError(null);
    setFormError(null);

    const result = expenseInputSchema.safeParse({
      amount: Number(amount),
      categoryId: categoryId ?? '',
      note: note.trim() ? note.trim() : undefined,
      date: toDateString(date),
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setAmountError(fieldErrors.amount?.[0] ?? null);
      setCategoryError(fieldErrors.categoryId?.[0] ?? null);
      return;
    }

    try {
      setSubmitting(true);
      await createExpense(result.data);
      navigation.goBack();
    } catch (e) {
      console.error(e);
      setFormError('Couldn’t save this expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.overlay}>
      <Pressable
        style={styles.scrim}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Close"
      />
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={[
          styles.sheetContent,
          { paddingBottom: 26 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Add Expense</Text>
          <Pressable
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Close">
            <MaterialIcons name="close" size={20} color="#5a5f6c" />
          </Pressable>
        </View>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountPrefix}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#c2c7d0"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={text => setAmount(sanitizeAmountInput(text))}
            />
          </View>
          {amountError ? <Text style={styles.fieldErrorCenter}>{amountError}</Text> : null}
        </View>

        <View style={styles.fieldsColumn}>
          <View>
            <Pressable
              style={styles.fieldRow}
              onPress={() => setCategoryPickerVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Select category">
              <View style={[styles.fieldIconChip, categoryIconChipStyle]}>
                <MaterialIcons
                  name={
                    (selectedCategory
                      ? toMaterialIconName(selectedCategory.icon)
                      : 'add') as IconName
                  }
                  size={22}
                  color={selectedCategory ? selectedCategory.color : '#9aa0ab'}
                />
              </View>
              <View style={styles.fieldTextColumn}>
                <Text style={styles.fieldLabel}>CATEGORY</Text>
                <Text style={[styles.fieldValue, !selectedCategory && styles.fieldValueMuted]}>
                  {selectedCategory ? selectedCategory.name : 'Select category'}
                </Text>
              </View>
              <MaterialIcons name="expand-more" size={22} color="#c2c7d0" />
            </Pressable>
            {categoryError ? <Text style={styles.fieldError}>{categoryError}</Text> : null}
          </View>

          <View style={styles.fieldRow}>
            <View style={[styles.fieldIconChip, styles.fieldIconChipAccent]}>
              <MaterialIcons name="edit-note" size={22} color="#7c3aed" />
            </View>
            <View style={styles.fieldTextColumn}>
              <Text style={styles.fieldLabel}>NOTE</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="What was it for?"
                placeholderTextColor="#a2a8b4"
                value={note}
                onChangeText={setNote}
                maxLength={200}
              />
            </View>
          </View>

          <Pressable
            style={styles.fieldRow}
            onPress={() => setDatePickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Select date">
            <View style={[styles.fieldIconChip, styles.fieldIconChipAccent]}>
              <MaterialIcons name="calendar-today" size={22} color="#7c3aed" />
            </View>
            <View style={styles.fieldTextColumn}>
              <Text style={styles.fieldLabel}>DATE</Text>
              <Text style={styles.fieldValue}>{formatLongDate(date)}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#c2c7d0" />
          </Pressable>
        </View>

        <Pressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          accessibilityRole="button"
          accessibilityLabel="Save expense">
          <Text style={[styles.saveLabel, !canSave && styles.saveLabelDisabled]}>
            {submitting ? 'Saving…' : 'Add expense'}
          </Text>
        </Pressable>
      </ScrollView>

      <CategoryPickerSheet
        visible={categoryPickerVisible}
        categories={categories}
        selectedId={categoryId}
        onSelect={id => {
          setCategoryId(id);
          setCategoryError(null);
        }}
        onManageCategories={() => {
          setCategoryPickerVisible(false);
          navigation.navigate('Categories');
        }}
        onClose={() => setCategoryPickerVisible(false)}
      />

      <DatePickerModal
        visible={datePickerVisible}
        value={date}
        onSelect={setDate}
        onClose={() => setDatePickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16,18,30,0.42)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '94%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: 'rgba(20,22,40,0.20)',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 10,
  },
  sheetContent: {
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e2e5ea',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#16181c',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f2f3f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formError: {
    color: '#dc2626',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  amountBlock: {
    alignItems: 'center',
    marginBottom: 22,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8a90a0',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  amountPrefix: {
    fontSize: 34,
    fontWeight: '800',
    color: '#c2c7d0',
  },
  amountInput: {
    width: 190,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1.5,
    color: '#16181c',
    textAlign: 'center',
    padding: 0,
  },
  fieldErrorCenter: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 6,
  },
  fieldsColumn: {
    gap: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderWidth: 1,
    borderColor: '#e6e8ec',
    backgroundColor: '#fafbfc',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  fieldIconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldIconChipAccent: {
    backgroundColor: '#f3ebfd',
  },
  fieldTextColumn: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8a90a0',
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16181c',
    marginTop: 1,
  },
  fieldValueMuted: {
    color: '#9aa0ab',
  },
  fieldError: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  noteInput: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16181c',
    marginTop: 1,
    padding: 0,
  },
  saveButton: {
    marginTop: 20,
    borderRadius: 17,
    paddingVertical: 17,
    alignItems: 'center',
    backgroundColor: '#7c3aed',
  },
  saveButtonDisabled: {
    backgroundColor: '#e6e8ee',
  },
  saveLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  saveLabelDisabled: {
    color: '#a2a8b4',
  },
});

export default AddExpenseScreen;
