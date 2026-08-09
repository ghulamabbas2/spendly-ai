import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { hexToRgba } from '../lib/color';
import { toMaterialIconName } from '../lib/icon-name';
import type { Category } from '../types/category';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type Props = {
  visible: boolean;
  categoryName: string;
  expenseCount: number;
  options: Category[];
  submitting: boolean;
  onClose: () => void;
  onConfirm: (targetCategoryId: string) => Promise<void>;
};

function ReassignCategoryModal({
  visible,
  categoryName,
  expenseCount,
  options,
  submitting,
  onClose,
  onConfirm,
}: Props) {
  const [targetId, setTargetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setTargetId(null);
    setError(null);
  }, [visible]);

  async function handleConfirm() {
    if (!targetId) return;
    try {
      await onConfirm(targetId);
    } catch (e) {
      console.error(e);
      setError('Couldn’t move these expenses. Please try again.');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Move expenses first</Text>
        <Text style={styles.subtitle}>
          “{categoryName}” has {expenseCount} {expenseCount === 1 ? 'expense' : 'expenses'}.
          Choose a category to move them to before deleting.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <ScrollView style={styles.grid} contentContainerStyle={styles.gridContent}>
          {options.map(option => {
            const selected = option.id === targetId;
            const optionStyle = {
              borderColor: selected ? option.color : '#eceef2',
              backgroundColor: selected ? hexToRgba(option.color, 0.13) : '#fafbfc',
            };
            return (
              <Pressable
                key={option.id}
                style={[styles.option, optionStyle]}
                onPress={() => setTargetId(option.id)}
                accessibilityRole="button"
                accessibilityLabel={option.name}>
                <View
                  style={[
                    styles.optionIconChip,
                    { backgroundColor: hexToRgba(option.color, 0.13) },
                  ]}>
                  <MaterialIcons
                    name={toMaterialIconName(option.icon) as IconName}
                    size={20}
                    color={option.color}
                  />
                </View>
                <Text style={styles.optionLabel}>{option.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          style={[styles.confirmButton, (!targetId || submitting) && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={!targetId || submitting}
          accessibilityRole="button"
          accessibilityLabel="Move expenses and delete category">
          <Text
            style={[
              styles.confirmLabel,
              (!targetId || submitting) && styles.confirmLabelDisabled,
            ]}>
            {submitting ? 'Moving…' : 'Move & delete category'}
          </Text>
        </Pressable>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel">
          <Text style={styles.cancelLabel}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 24,
    shadowColor: 'rgba(20,22,40,0.20)',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 10,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e2e5ea',
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16181c',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5a5f6c',
    lineHeight: 19,
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  grid: {
    maxHeight: 260,
  },
  gridContent: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1.5,
    borderRadius: 15,
    padding: 12,
  },
  optionIconChip: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16181c',
  },
  confirmButton: {
    marginTop: 16,
    borderRadius: 17,
    paddingVertical: 17,
    alignItems: 'center',
    backgroundColor: '#7c3aed',
  },
  confirmButtonDisabled: {
    backgroundColor: '#e6e8ee',
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  confirmLabelDisabled: {
    color: '#a2a8b4',
  },
  cancelLabel: {
    textAlign: 'center',
    marginTop: 14,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#8a90a0',
  },
});

export default ReassignCategoryModal;
