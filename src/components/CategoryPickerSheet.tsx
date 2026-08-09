import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { hexToRgba } from '../lib/color';
import { toMaterialIconName } from '../lib/icon-name';
import type { Category } from '../types/category';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type Props = {
  visible: boolean;
  categories: Category[];
  selectedId: string | null;
  onSelect: (categoryId: string) => void;
  onManageCategories: () => void;
  onClose: () => void;
};

function CategoryPickerSheet({
  visible,
  categories,
  selectedId,
  onSelect,
  onManageCategories,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Choose category</Text>

        <ScrollView style={styles.grid} contentContainerStyle={styles.gridContent}>
          {categories.map(category => {
            const selected = category.id === selectedId;
            const optionStyle = {
              borderColor: selected ? category.color : '#eceef2',
              backgroundColor: selected ? hexToRgba(category.color, 0.13) : '#fafbfc',
            };
            return (
              <Pressable
                key={category.id}
                style={[styles.option, optionStyle]}
                onPress={() => {
                  onSelect(category.id);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel={category.name}>
                <View
                  style={[
                    styles.optionIconChip,
                    { backgroundColor: hexToRgba(category.color, 0.13) },
                  ]}>
                  <MaterialIcons
                    name={toMaterialIconName(category.icon) as IconName}
                    size={20}
                    color={category.color}
                  />
                </View>
                <Text style={styles.optionLabel} numberOfLines={1}>
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          style={styles.manageButton}
          onPress={onManageCategories}
          accessibilityRole="button"
          accessibilityLabel="Manage categories">
          <MaterialIcons name="tune" size={18} color="#7c3aed" />
          <Text style={styles.manageLabel}>Manage categories</Text>
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
    paddingBottom: 14,
  },
  grid: {
    maxHeight: 340,
  },
  gridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 4,
  },
  option: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1.5,
    borderRadius: 15,
    padding: 13,
  },
  optionIconChip: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flexShrink: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16181c',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    borderRadius: 15,
    paddingVertical: 14,
    backgroundColor: '#f2f3f6',
  },
  manageLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7c3aed',
  },
});

export default CategoryPickerSheet;
