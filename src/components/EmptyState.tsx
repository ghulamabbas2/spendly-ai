import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type Props = {
  icon: IconName;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onPressCta?: () => void;
};

function EmptyState({ icon, title, subtitle, ctaLabel, onPressCta }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconChip}>
        <MaterialIcons name={icon} size={32} color="#7c3aed" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {ctaLabel && onPressCta ? (
        <Pressable
          style={styles.cta}
          onPress={onPressCta}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}>
          <Text style={styles.ctaLabel}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  iconChip: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#f3ebfd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16181c',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#8a90a0',
    textAlign: 'center',
    lineHeight: 19,
  },
  cta: {
    marginTop: 22,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    backgroundColor: '#7c3aed',
  },
  ctaLabel: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
});

export default EmptyState;
