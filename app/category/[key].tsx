import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import EmptyState from '../../src/components/EmptyState';
import ViewSwitcher, { ViewMode4 } from '../../src/components/ViewSwitcher';
import ItemViews from '../../src/components/ItemViews';
import { kindLabel, productCategories, ProductKind } from '../../src/data/mock';
import { colors, radius, typography } from '../../src/theme/theme';

const inr = (v: number) => `₹${v.toLocaleString('en-IN')}`;

/** Badge tone per product kind, so the three types stay visually distinct. */
const kindTone: Record<ProductKind, 'primary' | 'secondary' | 'warning'> = {
  appointment: 'primary',
  service: 'secondary',
  group_service: 'warning',
};

export default function CategoryScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const category = productCategories.find((c) => c.key === key);
  const [mode, setMode] = useState<ViewMode4>('list');

  if (!category) {
    return (
      <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
        <ScreenHeader title="Not found" />
        <EmptyState icon="help-circle-outline" title="Category not found" />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title={category.name} />

      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: `${category.tint}1A` }]}>
          <Ionicons name={category.icon} size={22} color={category.tint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={typography.body}>{category.tagline}</Text>
          <Text style={typography.caption}>
            {category.items.length} {category.items.length === 1 ? 'option' : 'options'} available
          </Text>
        </View>
      </View>

      <ViewSwitcher
        mode={mode}
        onChange={setMode}
        hint={mode === 'slide' ? 'Swipe · auto every 18s' : `${category.items.length} options`}
      />

      <ItemViews
        mode={mode}
        intervalSec={18}
        tableTypeLabel="Kind"
        items={category.items.map((item) => ({
          id: item.id,
          title: item.name,
          subtitle: item.description,
          meta: item.meta,
          badge: kindLabel[item.kind],
          price: item.price,
          icon: category.icon,
          tint: category.tint,
        }))}
        onPress={(id) => {
          // Browsing lands you in the category's booking flow with this option
          // already picked, so the list you just read isn't shown to you again.
          router.push({
            pathname: '/book/[category]',
            params: { category: category.key, preselect: id },
          } as never);
        }}
      />

    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  heroIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  card: { marginBottom: 12, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { flex: 1 },
  desc: { marginTop: -2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontSize: 12, color: colors.textMuted },
  price: { fontSize: 19, fontWeight: '800', color: colors.primary },
  bookRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 10,
  },
  bookText: { fontSize: 13, fontWeight: '700', color: colors.primary },
});
