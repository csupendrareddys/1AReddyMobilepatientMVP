import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import EmptyState from '../../src/components/EmptyState';
import { notifications as seed, AppNotification } from '../../src/data/mock';
import { colors, radius, typography } from '../../src/theme/theme';

const kindIcon: Record<AppNotification['kind'], keyof typeof Ionicons.glyphMap> = {
  appointment: 'calendar-outline',
  prescription: 'medkit-outline',
  payment: 'wallet-outline',
  general: 'notifications-outline',
};

const kindTint: Record<AppNotification['kind'], string> = {
  appointment: colors.primary,
  prescription: colors.secondary,
  payment: colors.warning,
  general: colors.textSecondary,
};

export default function NotificationsScreen() {
  const [items, setItems] = useState<AppNotification[]>(seed);
  const unread = items.filter((n) => !n.read).length;

  const markAllRead = () => setItems((list) => list.map((n) => ({ ...n, read: true })));
  const toggleRead = (id: string) =>
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader
        title="Notifications"
        right={unread > 0 ? (
          <TouchableOpacity onPress={markAllRead} hitSlop={8}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        ) : undefined}
      />

      {unread > 0 ? (
        <Text style={[typography.bodyMuted, styles.count]}>{unread} unread</Text>
      ) : null}

      {items.length ? (
        items.map((n) => (
          <TouchableOpacity
            key={n.id}
            activeOpacity={0.8}
            onPress={() => toggleRead(n.id)}
            style={[styles.row, !n.read && styles.rowUnread]}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${kindTint[n.kind]}1A` }]}>
              <Ionicons name={kindIcon[n.kind]} size={18} color={kindTint[n.kind]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, !n.read && styles.titleUnread]}>{n.title}</Text>
              <Text style={[typography.bodyMuted, styles.message]}>{n.message}</Text>
              <Text style={typography.caption}>{n.date}</Text>
            </View>
            {!n.read ? <View style={styles.unreadDot} /> : null}
          </TouchableOpacity>
        ))
      ) : (
        <EmptyState icon="notifications-off-outline" title="No notifications" subtitle="You're all caught up." />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  markAll: { color: colors.primary, fontSize: 12.5, fontWeight: '600' },
  count: { marginBottom: 12 },
  row: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 10,
  },
  rowUnread: { backgroundColor: '#F3F8FE', borderColor: '#D6E6F8' },
  iconWrap: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  titleUnread: { fontWeight: '700' },
  message: { marginTop: 2, marginBottom: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
});
