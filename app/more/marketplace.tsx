import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import { marketplaceProducts } from '../../src/data/mock';
import { colors, radius, typography } from '../../src/theme/theme';

export default function MarketplaceScreen() {
  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Marketplace" />
      <View style={styles.grid}>
        {marketplaceProducts.map((p) => (
          <TouchableOpacity key={p.id} style={styles.card} activeOpacity={0.85}>
            <Image source={{ uri: p.image }} style={styles.image} />
            <View style={styles.info}>
              <Text style={typography.caption}>{p.category}</Text>
              <Text style={typography.h3} numberOfLines={2}>{p.name}</Text>
              <Text style={styles.price}>₹{p.price}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  image: { width: '100%', height: 110, backgroundColor: colors.background },
  info: { padding: 10, gap: 4 },
  price: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
});
