import React from 'react';
import {
  Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { currentPatient, membership, notifications } from '../data/mock';
import { usePatientScope } from '../scope/PatientScope';
import { colors, radius, typography } from '../theme/theme';

type Item = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  tint?: string;
  badge?: number;
};

/**
 * Full navigation map. The tab bar carries the five most-used destinations;
 * this drawer exists so nothing else is more than two taps away.
 */
const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: 'Book & Buy',
    items: [
      { icon: 'flash-outline', label: 'Instant Consultation', route: '/category/instant', tint: '#E8833A' },
      { icon: 'videocam-outline', label: 'Online Consultation', route: '/category/online' },
      { icon: 'business-outline', label: 'Physical Consultation', route: '/category/physical', tint: '#26a69a' },
      { icon: 'git-merge-outline', label: 'Hybrid Consultation', route: '/category/hybrid', tint: '#5e35b1' },
      { icon: 'thermometer-outline', label: 'Recovery Plans', route: '/more/recovery-plans', tint: '#f44336' },
      { icon: 'shield-checkmark-outline', label: 'Healthcare Plans', route: '/category/healthcare', tint: '#5e35b1' },
      { icon: 'heart-circle-outline', label: 'Advance Care Plans', route: '/more/health-plans', tint: '#00897b' },
      { icon: 'infinite-outline', label: 'Longevity Plans', route: '/category/longevity', tint: '#E8833A' },
    ],
  },
  {
    title: 'My Care',
    items: [
      { icon: 'calendar-outline', label: 'My Bookings', route: '/(tabs)/appointments' },
      { icon: 'medical-outline', label: 'Family Doctor', route: '/more/family-doctor', tint: '#26a69a' },
      { icon: 'people-outline', label: 'Family & Minors', route: '/more/family', tint: '#5e35b1' },
      { icon: 'headset-outline', label: 'Support Staff', route: '/more/support-staff', tint: '#E8833A' },
      { icon: 'heart-outline', label: 'Favourite Doctors & Clinics', route: '/favourites', tint: '#D64545' },
    ],
  },
  {
    title: 'Records',
    items: [
      { icon: 'pulse-outline', label: 'Health Records', route: '/more/health-records', tint: '#f44336' },
      { icon: 'medkit-outline', label: 'Prescriptions', route: '/more/prescriptions', tint: '#26a69a' },
      { icon: 'folder-outline', label: 'Documents', route: '/more/documents', tint: '#E8833A' },
    ],
  },
  {
    title: 'Money',
    items: [
      { icon: 'card-outline', label: 'Wallet', route: '/more/wallet' },
      { icon: 'wallet-outline', label: 'Spending', route: '/more/spending', tint: '#f44336' },
      { icon: 'ribbon-outline', label: 'Membership', route: '/more/membership', tint: '#26a69a' },
      { icon: 'storefront-outline', label: 'Marketplace', route: '/more/marketplace', tint: '#E8833A' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: 'settings-outline', label: 'Profile Settings', route: '/more/profile-settings' },
      { icon: 'notifications-outline', label: 'Notifications', route: '/more/notifications', tint: '#E8833A' },
      { icon: 'shield-outline', label: 'Account Status', route: '/more/account-status', tint: '#26a69a' },
      { icon: 'document-text-outline', label: 'Terms & Conditions', route: '/(auth)/terms' },
    ],
  },
];

export default function AppDrawer({
  visible, onClose,
}: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const { scope, exit } = usePatientScope();
  const unread = notifications.filter((n) => !n.read).length;

  const go = (route: string) => {
    onClose();
    // Let the drawer close before navigating so the transition isn't janky.
    requestAnimationFrame(() => router.push(route as never));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.panel} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <Image source={{ uri: currentPatient.avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={typography.h3} numberOfLines={1}>{currentPatient.full_name}</Text>
              <Text style={typography.caption} numberOfLines={1}>{membership.plan_name} plan</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityLabel="Close menu">
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Acting-on-behalf is the one thing that must be obvious from the menu. */}
          {scope.kind !== 'self' ? (
            <View style={styles.scopeRow}>
              <Ionicons name="eye-outline" size={14} color={colors.warningDark} />
              <Text style={styles.scopeText} numberOfLines={1}>
                Viewing {scope.name}{scope.kind === 'minor' ? ' (minor)' : ''}
              </Text>
              <TouchableOpacity onPress={() => { exit(); onClose(); }}>
                <Text style={styles.scopeExit}>Exit</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* The menu is long enough to scroll, so keep the indicator visible —
              on Android `persistentScrollbar` stops it fading out entirely. */}
          <ScrollView
            showsVerticalScrollIndicator
            persistentScrollbar
            indicatorStyle="black"
            contentContainerStyle={styles.scroll}
          >
            <TouchableOpacity style={styles.agentRow} onPress={() => go('/agent')}>
              <Ionicons name="sparkles" size={16} color={colors.white} />
              <Text style={styles.agentText}>Ask Agent to book</Text>
            </TouchableOpacity>

            {SECTIONS.map((s) => (
              <View key={s.title}>
                <Text style={[typography.label, styles.sectionLabel]}>{s.title.toUpperCase()}</Text>
                {s.items.map((it) => (
                  <TouchableOpacity key={it.label} style={styles.item} onPress={() => go(it.route)}>
                    <View style={[styles.itemIcon, { backgroundColor: `${it.tint ?? colors.primary}1A` }]}>
                      <Ionicons name={it.icon} size={16} color={it.tint ?? colors.primary} />
                    </View>
                    <Text style={styles.itemLabel}>{it.label}</Text>
                    {it.label === 'Notifications' && unread ? (
                      <View style={styles.badge}><Text style={styles.badgeText}>{unread}</Text></View>
                    ) : null}
                    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            <TouchableOpacity
              style={styles.signOut}
              onPress={() => { onClose(); router.replace('/(auth)/signin'); }}
            >
              <Ionicons name="log-out-outline" size={17} color={colors.error} />
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>

        {/* Tapping the scrim closes — standard drawer behaviour. */}
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close menu" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  panel: { width: '84%', maxWidth: 340, backgroundColor: colors.surface },
  scrim: { flex: 1, backgroundColor: 'rgba(15,27,45,0.45)' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  scopeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: colors.warningLight, paddingHorizontal: 16, paddingVertical: 8,
  },
  scopeText: { flex: 1, fontSize: 11.5, fontWeight: '700', color: colors.warningDark },
  scopeExit: { fontSize: 11.5, fontWeight: '800', color: colors.warningDark },
  scroll: { paddingBottom: 24 },
  agentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary,
    marginHorizontal: 12, marginTop: 12, paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: radius.sm,
  },
  agentText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  sectionLabel: { marginTop: 18, marginBottom: 4, paddingHorizontal: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 16, paddingVertical: 10 },
  itemIcon: { width: 30, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { flex: 1, fontSize: 13.5, color: colors.textPrimary },
  badge: {
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5,
    backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  signOut: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 22, marginHorizontal: 16, paddingVertical: 13,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  signOutText: { fontSize: 13.5, fontWeight: '700', color: colors.error },
});
