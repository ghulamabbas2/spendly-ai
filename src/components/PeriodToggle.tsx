import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Period } from '../lib/date-range';

type Segment = { value: Period; label: string };

const SEGMENTS: Segment[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

type Props = {
  value: Period;
  onChange: (period: Period) => void;
};

function PeriodToggle({ value, onChange }: Props) {
  return (
    <View style={styles.track}>
      {SEGMENTS.map(segment => {
        const active = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(segment.value)}
            accessibilityRole="button"
            accessibilityLabel={segment.label}>
            <Text style={[styles.label, active && styles.labelActive]}>{segment.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 12,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#ffffff',
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.82)',
  },
  labelActive: {
    color: '#7c3aed',
  },
});

export default PeriodToggle;
