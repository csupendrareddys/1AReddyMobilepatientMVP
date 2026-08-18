import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import StatTile from '../../src/components/StatTile';
import { spending } from '../../src/data/mock';
import { colors, typography } from '../../src/theme/theme';

const statusTone: Record<string, 'success' | 'warning' | 'neutral'> = {
  paid: 'success',
  pending: 'warning',
  refunded: 'neutral',
};

export default function SpendingScreen() {
  const total = spending.filter((s) => s.status === 'paid').reduce((sum, s) => sum + s.amount, 0);
  const pending = spending.filter((s) => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0);

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Spending" />

      <View style={styles.statsRow}>
        <StatTile icon="checkmark-done-outline" label="Paid" value={`₹${total}`} tint={colors.success} />
        <StatTile icon="time-outline" label="Pending" value={`₹${pending}`} tint={colors.warning} />
      </View>

      {spending.map((s) => (
        <Card key={s.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={typography.body} numberOfLines={1}>{s.label}</Text>
            <Text style={typography.bodyMuted}>{s.date}</Text>
          </View>
          <Text style={styles.amount}>₹{s.amount}</Text>
          <Badge label={s.status} tone={statusTone[s.status]} />
        </Card>
      ))}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  amount: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
});
