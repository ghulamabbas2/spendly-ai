import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { hexToRgba } from '../lib/color';
import { toMaterialIconName } from '../lib/icon-name';
import { categoryInputSchema, type CategoryInput } from '../lib/validation/category-schema';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const ICON_CHOICES = [
  'shopping_cart',
  'child_care',
  'bolt',
  'restaurant',
  'directions_car',
  'medical_services',
  'chair',
  'movie',
  'shopping_bag',
  'category',
  'home',
  'work',
  'school',
  'pets',
  'savings',
  'card_giftcard',
  'label',
];

const COLOR_CHOICES = [
  '#16a34a',
  '#f97316',
  '#0284c7',
  '#dc2626',
  '#9333ea',
  '#0d9488',
  '#d97706',
  '#db2777',
  '#2563eb',
  '#64748b',
  '#e11d48',
  '#0891b2',
  '#65a30d',
  '#ea580c',
];

type Props = {
  visible: boolean;
  title: string;
  initialValues?: CategoryInput;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: CategoryInput) => Promise<void>;
};

function CategoryFormSheet({ visible, title, initialValues, submitting, onClose, onSubmit }: Props) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [icon, setIcon] = useState(initialValues?.icon ?? ICON_CHOICES[0]);
  const [color, setColor] = useState(initialValues?.color ?? COLOR_CHOICES[0]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(initialValues?.name ?? '');
    setIcon(initialValues?.icon ?? ICON_CHOICES[0]);
    setColor(initialValues?.color ?? COLOR_CHOICES[0]);
    setNameError(null);
    setFormError(null);
  }, [visible, initialValues]);

  async function handleSave() {
    setFormError(null);

    const result = categoryInputSchema.safeParse({ name, icon, color });
    if (!result.success) {
      setNameError(result.error.flatten().fieldErrors.name?.[0] ?? null);
      return;
    }
    setNameError(null);

    try {
      await onSubmit(result.data);
    } catch (e) {
      console.error(e);
      setFormError('Couldn’t save this category. Please try again.');
    }
  }

  const canSave = name.trim().length > 0 && !submitting;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>{title}</Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close">
            <MaterialIcons name="close" size={22} color="#8a90a0" />
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Category name"
            placeholderTextColor="#a2a8b4"
            value={name}
            onChangeText={setName}
          />
          {nameError ? <Text style={styles.fieldError}>{nameError}</Text> : null}

          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconGrid}>
            {ICON_CHOICES.map(choice => {
              const selected = choice === icon;
              return (
                <Pressable
                  key={choice}
                  style={[
                    styles.iconOption,
                    selected && {
                      borderColor: color,
                      backgroundColor: hexToRgba(color, 0.13),
                    },
                  ]}
                  onPress={() => setIcon(choice)}
                  accessibilityRole="button"
                  accessibilityLabel={choice}>
                  <MaterialIcons
                    name={toMaterialIconName(choice) as IconName}
                    size={21}
                    color={selected ? color : '#5a5f6c'}
                  />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Color</Text>
          <View style={styles.colorGrid}>
            {COLOR_CHOICES.map(choice => {
              const selected = choice === color;
              return (
                <Pressable
                  key={choice}
                  style={[
                    styles.colorOption,
                    { backgroundColor: choice },
                    selected && styles.colorOptionSelected,
                  ]}
                  onPress={() => setColor(choice)}
                  accessibilityRole="button"
                  accessibilityLabel={`Color ${choice}`}>
                  {selected ? <MaterialIcons name="check" size={18} color="#ffffff" /> : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <Pressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          accessibilityRole="button"
          accessibilityLabel="Save category">
          <Text style={[styles.saveLabel, !canSave && styles.saveLabelDisabled]}>
            {submitting ? 'Saving…' : 'Save'}
          </Text>
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
    paddingBottom: 20,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16181c',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e5ea',
    backgroundColor: '#fafbfc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#16181c',
  },
  fieldError: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
  formError: {
    color: '#dc2626',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#8a90a0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 10,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#eceef2',
    backgroundColor: '#fafbfc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 2,
    borderColor: '#16181c',
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

export default CategoryFormSheet;
