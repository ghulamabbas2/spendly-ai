import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { getCalendarGrid } from '../lib/date-range';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

type Props = {
  visible: boolean;
  value: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function DatePickerModal({ visible, value, onSelect, onClose }: Props) {
  const [viewMonth, setViewMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));

  useEffect(() => {
    if (!visible) return;
    setViewMonth(new Date(value.getFullYear(), value.getMonth(), 1));
  }, [visible, value]);

  const today = new Date();
  const weeks = getCalendarGrid(viewMonth);

  function goToPreviousMonth() {
    setViewMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setViewMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={styles.centerWrapper} pointerEvents="box-none">
        <View style={styles.card}>
          <View style={styles.header}>
            <Pressable
              style={styles.navButton}
              onPress={goToPreviousMonth}
              accessibilityRole="button"
              accessibilityLabel="Previous month">
              <MaterialIcons name="chevron-left" size={22} color="#16181c" />
            </Pressable>
            <Text style={styles.monthLabel}>{MONTH_YEAR_FORMATTER.format(viewMonth)}</Text>
            <Pressable
              style={styles.navButton}
              onPress={goToNextMonth}
              accessibilityRole="button"
              accessibilityLabel="Next month">
              <MaterialIcons name="chevron-right" size={22} color="#16181c" />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((label, index) => (
              <Text key={index} style={styles.weekdayLabel}>
                {label}
              </Text>
            ))}
          </View>

          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <View key={dayIndex} style={styles.dayCell} />;
                }
                const selected = isSameDay(day, value);
                const isToday = isSameDay(day, today);
                return (
                  <Pressable
                    key={dayIndex}
                    style={[
                      styles.dayCell,
                      selected && styles.daySelected,
                      !selected && isToday && styles.dayToday,
                    ]}
                    onPress={() => {
                      onSelect(day);
                      onClose();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={day.toDateString()}>
                    <Text
                      style={[
                        styles.dayLabel,
                        (selected || isToday) && styles.dayLabelBold,
                        !selected && isToday && styles.dayLabelAccent,
                        selected && styles.dayLabelSelected,
                      ]}>
                      {day.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
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
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 26,
    padding: 20,
    shadowColor: 'rgba(20,22,40,0.30)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 50,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f2f3f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16181c',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: '#a2a8b4',
  },
  weekRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 3,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  dayToday: {
    backgroundColor: '#f3ebfd',
  },
  daySelected: {
    backgroundColor: '#7c3aed',
  },
  dayLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#16181c',
  },
  dayLabelBold: {
    fontWeight: '800',
  },
  dayLabelAccent: {
    color: '#7c3aed',
  },
  dayLabelSelected: {
    color: '#ffffff',
  },
});

export default DatePickerModal;
