import type { CompositeNavigationProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import Card from '../components/Card';
import CategoryProgressRowSkeleton from '../components/CategoryProgressRowSkeleton';
import EmptyState from '../components/EmptyState';
import PeriodToggle from '../components/PeriodToggle';
import CategoryProgressRow from '../components/CategoryProgressRow';
import Skeleton from '../components/Skeleton';
import TransactionRow from '../components/TransactionRow';
import TransactionRowSkeleton from '../components/TransactionRowSkeleton';
import { useAuth } from '../hooks/use-auth';
import { useHomeDashboard } from '../hooks/use-home-dashboard';
import { formatCurrency } from '../lib/format-currency';
import { getInitials } from '../lib/initials';
import type { AppStackParamList, TabParamList } from '../navigation/types';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<AppStackParamList>
>;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const COMPARISON_ICON: Record<'increase' | 'decrease' | 'flat', IconName> = {
  increase: 'trending-up',
  decrease: 'trending-down',
  flat: 'trending-flat',
};

const CATEGORY_SKELETON_ROWS = [0, 1, 2, 3];
const TRANSACTION_SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const {
    loading,
    error,
    reload,
    period,
    setPeriod,
    periodLabel,
    totalSpent,
    comparison,
    txnCount,
    topCategories,
    recentTransactions,
    hasAnyExpenses,
  } = useHomeDashboard();

  useFocusEffect(
    useCallback(() => {
      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>
              {user ? getInitials(user.fullName, user.email) : ''}
            </Text>
          </View>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userLabel} numberOfLines={1}>
              {user?.fullName ?? user?.email}
            </Text>
          </View>
        </View>
        <View style={styles.bellButton}>
          <MaterialIcons name="notifications" size={22} color="#4a4f5c" />
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Couldn’t load your dashboard. Please try again.</Text>
          <Pressable
            style={styles.retryButton}
            onPress={reload}
            accessibilityRole="button"
            accessibilityLabel="Retry">
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        </View>
      ) : !loading && !hasAnyExpenses ? (
        <EmptyState
          icon="receipt-long"
          title="No expenses yet"
          subtitle="Add your first expense to start tracking your spending."
        />
      ) : (
        <>
          <View style={styles.heroShadowWrapper}>
            <View style={styles.heroCard}>
              <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
                <Defs>
                  <LinearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#7c3aed" />
                    <Stop offset="55%" stopColor="#9061f2" />
                    <Stop offset="100%" stopColor="#a855f7" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#heroGradient)" />
              </Svg>

              <View style={styles.heroContent}>
                <PeriodToggle value={period} onChange={setPeriod} />

                <Text style={styles.totalLabel}>Total spent · {periodLabel}</Text>
                {loading ? (
                  <Skeleton
                    width={170}
                    height={42}
                    borderRadius={8}
                    style={styles.totalValueSkeleton}
                  />
                ) : (
                  <Text style={styles.totalValue}>{formatCurrency(totalSpent)}</Text>
                )}

                <View style={styles.heroFooter}>
                  {loading ? (
                    <>
                      <Skeleton width={110} height={26} borderRadius={20} />
                      <Skeleton width={90} height={13} borderRadius={4} />
                    </>
                  ) : (
                    <>
                      <View style={styles.comparisonPill}>
                        <MaterialIcons
                          name={
                            comparison.hasPriorData
                              ? COMPARISON_ICON[comparison.direction]
                              : 'trending-flat'
                          }
                          size={16}
                          color="#ffffff"
                        />
                        <Text style={styles.comparisonText}>
                          {comparison.hasPriorData
                            ? `${comparison.percentChange > 0 ? '+' : ''}${comparison.percentChange.toFixed(0)}% vs last period`
                            : 'No prior data'}
                        </Text>
                      </View>
                      <Text style={styles.txnCount}>{txnCount} transactions</Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>

          <Card style={styles.categoriesCard}>
            <View style={styles.categoriesHeader}>
              <Text style={styles.sectionTitle}>Top categories</Text>
              <Pressable
                onPress={() => navigation.navigate('Insights')}
                accessibilityRole="button"
                accessibilityLabel="View all categories">
                <Text style={styles.viewAllLabel}>View all</Text>
              </Pressable>
            </View>
            {loading ? (
              CATEGORY_SKELETON_ROWS.map(row => <CategoryProgressRowSkeleton key={row} />)
            ) : topCategories.length === 0 ? (
              <Text style={styles.noDataText}>No spending in this period yet.</Text>
            ) : (
              topCategories.map(category => (
                <CategoryProgressRow
                  key={category.id}
                  name={category.name}
                  icon={category.icon}
                  color={category.color}
                  amount={formatCurrency(category.amount)}
                  barWidthPercent={category.barWidthPercent}
                />
              ))
            )}
          </Card>

          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent transactions</Text>
          </View>
          <Card style={styles.recentCard}>
            {loading
              ? TRANSACTION_SKELETON_ROWS.map(row => <TransactionRowSkeleton key={row} />)
              : recentTransactions.map(transaction => (
                  <TransactionRow
                    key={transaction.id}
                    title={transaction.title}
                    subtitle={`${transaction.categoryName} · ${transaction.date}`}
                    icon={transaction.icon}
                    color={transaction.color}
                    amount={formatCurrency(transaction.amount)}
                    onPress={() =>
                      navigation.navigate('ExpenseDetail', { expenseId: transaction.id })
                    }
                  />
                ))}
          </Card>
        </>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(124,58,237,0.35)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 4,
  },
  avatarLabel: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  greeting: {
    fontSize: 13,
    color: '#8a90a0',
    fontWeight: '600',
  },
  userLabel: {
    fontSize: 18,
    color: '#16181c',
    fontWeight: '800',
    letterSpacing: -0.3,
    maxWidth: 200,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(20,22,40,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  heroShadowWrapper: {
    borderRadius: 26,
    marginBottom: 18,
    shadowColor: 'rgba(124,58,237,0.34)',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 34,
    elevation: 6,
  },
  heroCard: {
    borderRadius: 26,
    overflow: 'hidden',
  },
  heroContent: {
    paddingTop: 20,
    paddingHorizontal: 22,
    paddingBottom: 22,
  },
  totalLabel: {
    marginTop: 20,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  totalValue: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 46,
    color: '#ffffff',
  },
  totalValueSkeleton: {
    marginVertical: 2,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
  },
  comparisonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  comparisonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  txnCount: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.82)',
  },
  categoriesCard: {
    padding: 18,
    paddingBottom: 8,
    marginBottom: 18,
  },
  categoriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16181c',
  },
  viewAllLabel: {
    color: '#7c3aed',
    fontWeight: '700',
    fontSize: 12.5,
  },
  noDataText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8a90a0',
    marginBottom: 14,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 4,
    marginBottom: 10,
  },
  recentCard: {
    padding: 6,
  },
});

export default HomeScreen;
