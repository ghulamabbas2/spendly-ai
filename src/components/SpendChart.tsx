import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon, Polyline, Rect } from 'react-native-svg';

import type { SpendBucket } from '../lib/insights';

const CHART_WIDTH = 300;
const CHART_HEIGHT = 120;
const TOP_PADDING = 10;
const MAX_BAR_WIDTH = 30;
const ACCENT = '#7c3aed';

export type ChartStyle = 'bar' | 'line';

type Props = {
  buckets: SpendBucket[];
  chartStyle: ChartStyle;
};

function SpendChart({ buckets, chartStyle }: Props) {
  const maxTotal = buckets.reduce(
    (max, bucket) => Math.max(max, bucket.total),
    0,
  );
  const usableHeight = CHART_HEIGHT - TOP_PADDING;
  const slot = buckets.length > 0 ? CHART_WIDTH / buckets.length : CHART_WIDTH;

  function heightFor(total: number): number {
    return maxTotal > 0 ? (total / maxTotal) * usableHeight : 0;
  }

  const points = buckets.map((bucket, index) => ({
    cx: buckets.length === 1 ? CHART_WIDTH / 2 : index * slot + slot / 2,
    cy: CHART_HEIGHT - heightFor(bucket.total),
  }));

  // A single point can't draw a polyline, so stretch it into a flat line across the chart.
  const linePoints =
    points.length === 1
      ? `0,${points[0].cy} ${CHART_WIDTH},${points[0].cy}`
      : points.map(point => `${point.cx},${point.cy}`).join(' ');

  const areaPoints =
    points.length === 1
      ? `0,${CHART_HEIGHT} 0,${points[0].cy} ${CHART_WIDTH},${points[0].cy} ${CHART_WIDTH},${CHART_HEIGHT}`
      : `${points[0].cx},${CHART_HEIGHT} ${points
          .map(point => `${point.cx},${point.cy}`)
          .join(' ')} ${points[points.length - 1].cx},${CHART_HEIGHT}`;

  return (
    <View>
      <Svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} style={styles.svg}>
        {chartStyle === 'bar' ? (
          buckets.map((bucket, index) => {
            const barWidth = Math.min(slot * 0.5, MAX_BAR_WIDTH);
            const height = heightFor(bucket.total);
            return (
              <Rect
                key={index}
                x={index * slot + (slot - barWidth) / 2}
                y={CHART_HEIGHT - height}
                width={barWidth}
                height={height}
                rx={4}
                fill={ACCENT}
              />
            );
          })
        ) : (
          <>
            <Polygon points={areaPoints} fill={ACCENT} opacity={0.1} />
            <Polyline
              points={linePoints}
              fill="none"
              stroke={ACCENT}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </Svg>
      <View style={styles.labels}>
        {buckets.map((bucket, index) => (
          <Text key={index} style={styles.label} numberOfLines={1}>
            {bucket.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  svg: {
    width: '100%',
    height: CHART_HEIGHT,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a2a8b4',
  },
});

export default SpendChart;
