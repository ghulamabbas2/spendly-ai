import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import CategoryFormSheet from '../components/CategoryFormSheet';
import EmptyState from '../components/EmptyState';
import ReassignCategoryModal from '../components/ReassignCategoryModal';
import Skeleton from '../components/Skeleton';
import { useCategories } from '../hooks/use-categories';
import { hexToRgba } from '../lib/color';
import { toMaterialIconName } from '../lib/icon-name';
import type { CategoryInput } from '../lib/validation/category-schema';
import { countExpensesByCategory } from '../services/expenses-service';
import type { AppStackParamList } from '../navigation/types';
import type { Category } from '../types/category';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const SKELETON_ROWS = [0, 1, 2, 3, 4];

function CategoriesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { categories, loading, error, reload, create, update, remove } = useCategories();

  const [formVisible, setFormVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [savingForm, setSavingForm] = useState(false);

  const [reassignTarget, setReassignTarget] = useState<{
    category: Category;
    expenseCount: number;
  } | null>(null);
  const [checkingDeleteId, setCheckingDeleteId] = useState<string | null>(null);
  const [reassigning, setReassigning] = useState(false);

  function openAddForm() {
    setEditingCategory(null);
    setFormVisible(true);
  }

  function openEditForm(category: Category) {
    setEditingCategory(category);
    setFormVisible(true);
  }

  async function handleFormSubmit(input: CategoryInput) {
    try {
      setSavingForm(true);
      if (editingCategory) {
        await update(editingCategory.id, input);
      } else {
        await create(input);
      }
      setFormVisible(false);
    } finally {
      setSavingForm(false);
    }
  }

  async function handleDeletePress(category: Category) {
    if (categories.length <= 1) {
      Alert.alert('You need at least one category', 'Add another category before deleting this one.');
      return;
    }

    try {
      setCheckingDeleteId(category.id);
      const count = await countExpensesByCategory(category.id);

      if (count === 0) {
        Alert.alert('Delete this category?', `“${category.name}” will be removed.`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await remove(category.id);
              } catch (e) {
                console.error(e);
                Alert.alert('Something went wrong deleting this category. Please try again.');
              }
            },
          },
        ]);
      } else {
        setReassignTarget({ category, expenseCount: count });
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Something went wrong. Please try again.');
    } finally {
      setCheckingDeleteId(null);
    }
  }

  async function handleReassignConfirm(targetCategoryId: string) {
    if (!reassignTarget) return;
    try {
      setReassigning(true);
      await remove(reassignTarget.category.id, targetCategoryId);
      setReassignTarget(null);
    } finally {
      setReassigning(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <MaterialIcons name="arrow-back" size={23} color="#16181c" />
          </Pressable>
          <Text style={styles.title}>Categories</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Couldn’t load your categories. Please try again.</Text>
            <Pressable
              style={styles.retryButton}
              onPress={reload}
              accessibilityRole="button"
              accessibilityLabel="Retry">
              <Text style={styles.retryLabel}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>
              {loading ? ' ' : `${categories.length} categories · used across all your expenses`}
            </Text>

            <View style={styles.card}>
              {loading ? (
                SKELETON_ROWS.map(row => (
                  <View key={row} style={styles.row}>
                    <Skeleton width={42} height={42} borderRadius={12} />
                    <Skeleton width={120} height={14} borderRadius={4} />
                  </View>
                ))
              ) : categories.length === 0 ? (
                <EmptyState
                  icon="category"
                  title="No categories yet"
                  subtitle="Add a category to start organizing your expenses."
                />
              ) : (
                categories.map(category => (
                  <View key={category.id} style={styles.row}>
                    <View
                      style={[
                        styles.iconChip,
                        { backgroundColor: hexToRgba(category.color, 0.13) },
                      ]}>
                      <MaterialIcons
                        name={toMaterialIconName(category.icon) as IconName}
                        size={22}
                        color={category.color}
                      />
                    </View>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {category.name}
                    </Text>
                    <View style={[styles.colorDot, { backgroundColor: category.color }]} />
                    <Pressable
                      onPress={() => openEditForm(category)}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${category.name}`}
                      hitSlop={8}>
                      <MaterialIcons name="edit" size={20} color="#c2c7d0" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeletePress(category)}
                      disabled={checkingDeleteId === category.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${category.name}`}
                      hitSlop={8}
                      style={styles.deleteButton}>
                      <MaterialIcons name="delete-outline" size={20} color="#dc2626" />
                    </Pressable>
                  </View>
                ))
              )}
            </View>

            <Pressable
              style={styles.addButton}
              onPress={openAddForm}
              accessibilityRole="button"
              accessibilityLabel="Add category">
              <MaterialIcons name="add" size={21} color="#7c3aed" />
              <Text style={styles.addLabel}>Add category</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <CategoryFormSheet
        visible={formVisible}
        title={editingCategory ? 'Edit category' : 'New category'}
        initialValues={
          editingCategory
            ? { name: editingCategory.name, icon: editingCategory.icon, color: editingCategory.color }
            : undefined
        }
        submitting={savingForm}
        onClose={() => setFormVisible(false)}
        onSubmit={handleFormSubmit}
      />

      <ReassignCategoryModal
        visible={reassignTarget !== null}
        categoryName={reassignTarget?.category.name ?? ''}
        expenseCount={reassignTarget?.expenseCount ?? 0}
        options={categories.filter(c => c.id !== reassignTarget?.category.id)}
        submitting={reassigning}
        onClose={() => setReassignTarget(null)}
        onConfirm={handleReassignConfirm}
      />
    </View>
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
    marginBottom: 20,
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
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16181c',
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8a90a0',
    marginHorizontal: 4,
    marginBottom: 12,
  },
  errorBox: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 12,
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 6,
    marginBottom: 16,
    shadowColor: 'rgba(20,22,40,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  iconChip: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#16181c',
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  deleteButton: {
    marginLeft: 2,
  },
  addButton: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#cdd2db',
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addLabel: {
    color: '#7c3aed',
    fontWeight: '800',
    fontSize: 14.5,
  },
});

export default CategoriesScreen;
