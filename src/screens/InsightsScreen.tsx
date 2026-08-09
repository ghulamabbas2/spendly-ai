import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import BiggestCategoryTile from '../components/BiggestCategoryTile';
import Card from '../components/Card';
import CategoryProgressRow from '../components/CategoryProgressRow';
import CategoryProgressRowSkeleton from '../components/CategoryProgressRowSkeleton';
import DatePickerModal from '../components/DatePickerModal';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import SpendChart, { type ChartStyle } from '../components/SpendChart';
import { useInsights } from '../hooks/use-insights';
import { formatCurrency } from '../lib/format-currency';

type CalendarTarget = 'start' | 'end';

const CHART_STYLES: { value: ChartStyle; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
];

const BREAKDOWN_SKELETON_ROWS = [0, 1, 2, 3];
const TILE_SKELETONS = [0, 1, 2];

function ChartToggle({
  value,
  onChange,
}: {
  value: ChartStyle;
  onChange: (style: ChartStyle) => void;
}) {
  return (
    <View style={styles.toggleTrack}>
      {CHART_STYLES.map(style => {
        const active = style.value === value;
        return (
          <Pressable
            key={style.value}
            style={[styles.toggleSegment, active && styles.toggleSegmentActive]}
            onPress={() => onChange(style.value)}
            accessibilityRole="button"
            accessibilityLabel={`${style.label} chart`}
          >
            <Text
              style={[styles.toggleLabel, active && styles.toggleLabelActive]}
            >
              {style.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function InsightsScreen() {
  const {
    loading,
    error,
    reload,
    rangeStart,
    rangeEnd,
    setRangeStart,
    setRangeEnd,
    rangeStartLabel,
    rangeEndLabel,
    rangeTotal,
    rangeCount,
    chartBuckets,
    breakdown,
    biggest,
    hasExpenses,
  } = useInsights();

  const [chartStyle, setChartStyle] = useState<ChartStyle>('bar');
  const [calendarTarget, setCalendarTarget] = useState<CalendarTarget | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  function handleSelectDate(date: Date) {
    if (calendarTarget === 'start') setRangeStart(date);
    else if (calendarTarget === 'end') setRangeEnd(date);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Insights</Text>

      <Card style={styles.rangeCard}>
        <Text style={styles.caption}>Date range</Text>
        <View style={styles.rangeRow}>
          <Pressable
            style={styles.rangeButton}
            onPress={() => setCalendarTarget('start')}
            accessibilityRole="button"
            accessibilityLabel="Select start date"
          >
            <Text style={styles.rangeButtonLabel}>FROM</Text>
            <Text style={styles.rangeButtonValue}>{rangeStartLabel}</Text>
          </Pressable>
          <MaterialIcons name="arrow-forward" size={20} color="#c2c7d0" />
          <Pressable
            style={styles.rangeButton}
            onPress={() => setCalendarTarget('end')}
            accessibilityRole="button"
            accessibilityLabel="Select end date"
          >
            <Text style={styles.rangeButtonLabel}>TO</Text>
            <Text style={styles.rangeButtonValue}>{rangeEndLabel}</Text>
          </Pressable>
        </View>
      </Card>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            Couldn’t load your insights. Please try again.
          </Text>
          <Pressable
            style={styles.retryButton}
            onPress={reload}
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        </View>
      ) : !loading && !hasExpenses ? (
        <EmptyState
          icon="bar-chart"
          title="No spending in this range"
          subtitle="Try widening your date range to see your insights."
        />
      ) : (
        <>
          <Card style={styles.totalCard}>
            <View style={styles.totalHeader}>
              <Text style={styles.totalLabel}>Total in range</Text>
              {loading ? (
                <Skeleton width={54} height={14} borderRadius={4} />
              ) : (
                <Text style={styles.txnCount}>{rangeCount} txns</Text>
              )}
            </View>
            {loading ? (
              <Skeleton
                width={150}
                height={34}
                borderRadius={8}
                style={styles.totalValueSkeleton}
              />
            ) : (
              <Text style={styles.totalValue}>
                {formatCurrency(rangeTotal)}
              </Text>
            )}

            <View style={styles.chartHeader}>
              <Text style={styles.chartLabel}>Spend over time</Text>
              <ChartToggle value={chartStyle} onChange={setChartStyle} />
            </View>
            {loading ? (
              <Skeleton width="100%" height={120} borderRadius={12} />
            ) : (
              <SpendChart buckets={chartBuckets} chartStyle={chartStyle} />
            )}
          </Card>

          <Card style={styles.breakdownCard}>
            <Text style={styles.sectionTitle}>Category breakdown</Text>
            {loading ? (
              BREAKDOWN_SKELETON_ROWS.map(row => (
                <CategoryProgressRowSkeleton key={row} />
              ))
            ) : breakdown.length === 0 ? (
              <Text style={styles.noDataText}>
                No categorized spending in this range.
              </Text>
            ) : (
              breakdown.map(item => (
                <CategoryProgressRow
                  key={item.id}
                  name={item.name}
                  icon={item.icon}
                  color={item.color}
                  amount={`${formatCurrency(item.amount)} · ${item.pct}%`}
                  barWidthPercent={item.barWidthPercent}
                />
              ))
            )}
          </Card>

          {loading || biggest.length > 0 ? (
            <Card style={styles.biggestCard}>
              <Text style={styles.sectionTitle}>Biggest categories</Text>
              <View style={styles.tilesRow}>
                {loading
                  ? TILE_SKELETONS.map(tile => (
                      <Skeleton
                        key={tile}
                        width="100%"
                        height={96}
                        borderRadius={16}
                        style={styles.tileSkeleton}
                      />
                    ))
                  : biggest.map(category => (
                      <BiggestCategoryTile
                        key={category.id}
                        name={category.name}
                        icon={category.icon}
                        color={category.color}
                        tint={category.tint}
                        amount={formatCurrency(category.amount)}
                      />
                    ))}
              </View>
            </Card>
          ) : null}
        </>
      )}

      <DatePickerModal
        visible={calendarTarget !== null}
        value={calendarTarget === 'end' ? rangeEnd : rangeStart}
        onSelect={handleSelectDate}
        onClose={() => setCalendarTarget(null)}
      />
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
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#16181c',
    letterSpacing: -0.4,
    marginBottom: 16,
  },
  rangeCard: {
    padding: 16,
    marginBottom: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8a90a0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 11,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rangeButton: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 2,
    borderWidth: 1,
    borderColor: '#e2e5ea',
    backgroundColor: '#fafbfc',
    borderRadius: 13,
    paddingVertical: 10,
    paddingHorizontal: 13,
  },
  rangeButtonLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#8a90a0',
  },
  rangeButtonValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16181c',
  },
  errorBox: {
    alignItems: 'center',
    paddingTop: 60,
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
  totalCard: {
    padding: 18,
    marginBottom: 18,
  },
  totalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8a90a0',
  },
  txnCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8a90a0',
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#16181c',
    letterSpacing: -0.8,
    marginBottom: 16,
  },
  totalValueSkeleton: {
    marginTop: 4,
    marginBottom: 18,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8a90a0',
  },
  toggleTrack: {
    flexDirection: 'row',
    backgroundColor: '#f2f3f6',
    borderRadius: 10,
    padding: 3,
  },
  toggleSegment: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 7,
  },
  toggleSegmentActive: {
    backgroundColor: '#7c3aed',
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8a90a0',
  },
  toggleLabelActive: {
    color: '#ffffff',
  },
  breakdownCard: {
    padding: 18,
    paddingBottom: 8,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16181c',
    marginBottom: 14,
  },
  noDataText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8a90a0',
    marginBottom: 14,
  },
  biggestCard: {
    padding: 18,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tileSkeleton: {
    flex: 1,
  },
});

export default InsightsScreen;
