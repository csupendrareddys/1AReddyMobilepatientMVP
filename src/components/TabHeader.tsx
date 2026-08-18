import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppDrawer from './AppDrawer';
import { colors, typography } from '../theme/theme';

/**
 * The header every tab screen opens with: the drawer on the left, the screen's
 * name, and up to two quick actions on the right. One component so the five
 * tabs can't drift into five slightly different headers.
 */

type Action = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  badge?: number;
};

export default function TabHeader({ title, actions = [] }: { title: string; actions?: Action[] }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={() => setMenuOpen(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
      >
        <Ionicons name="menu" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <Text style={[typography.h1, styles.title]}>{title}</Text>

      {actions.map((a) => (
        <TouchableOpacity
          key={a.label}
          style={styles.action}
          onPress={() => router.push(a.route as never)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityLabel={a.label}
        >
          <Ionicons name={a.icon} size={22} color={colors.textPrimary} />
          {a.badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{a.badge > 9 ? '9+' : a.badge}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      ))}

      <AppDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  title: { flex: 1 },
  action: { position: 'relative' },
  badge: {
    position: 'absolute', top: -5, right: -7, minWidth: 16, height: 16,
    borderRadius: 8, paddingHorizontal: 3, backgroundColor: colors.error,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9.5, fontWeight: '800', color: colors.white },
});
