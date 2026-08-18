import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import Card from '../../src/components/Card';
import MenuRow from '../../src/components/MenuRow';
import SectionHeader from '../../src/components/SectionHeader';
import Badge from '../../src/components/Badge';
import TabHeader from '../../src/components/TabHeader';
import { currentPatient, membership, notifications } from '../../src/data/mock';
import { colors, radius, typography } from '../../src/theme/theme';

const TABS = ['Personal', 'Health', 'Emergency', 'Insurance'] as const;
type Tab = typeof TABS[number];

export default function ProfileScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('Personal');
  const p = currentPatient;

  return (
    <ScreenWrapper>
      <TabHeader
        title="Profile"
        actions={[
          { icon: 'notifications-outline', label: 'Notifications', route: '/more/notifications', badge: notifications.filter((n) => !n.read).length },
          { icon: 'settings-outline', label: 'Profile settings', route: '/more/profile-settings' },
        ]}
      />

      <Card style={styles.profileCard}>
        <Image source={{ uri: p.avatar }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={typography.h3}>{p.full_name}</Text>
          <Text style={typography.bodyMuted}>{p.email}</Text>
          <Text style={typography.bodyMuted}>{p.phone}</Text>
        </View>
      </Card>

      {/* Tabbed detail — mirrors the reference app's Personal / Health /
          Emergency / Insurance split rather than one long form. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Card style={styles.detailCard}>
        {tab === 'Personal' ? (
          <>
            <Field label="Full name" value={p.full_name} />
            <Field label="Email" value={p.email} />
            <Field label="Phone" value={p.phone} />
            <Field label="Gender" value={p.gender} />
            <Field label="Date of birth" value={p.date_of_birth} />
          </>
        ) : null}

        {tab === 'Health' ? (
          <>
            <View style={styles.vitalGrid}>
              <VitalTile icon="water-outline" label="Blood group" value={p.blood_group} />
              <VitalTile icon="resize-outline" label="Height" value={`${p.height_cm} cm`} />
              <VitalTile icon="barbell-outline" label="Weight" value={`${p.weight_kg} kg`} />
              <VitalTile icon="warning-outline" label="Allergies" value={String(p.allergies.length)} />
            </View>
            <ChipBlock label="Allergies" items={p.allergies} tone="error" />
            <ChipBlock label="Chronic conditions" items={p.chronic_conditions} tone="warning" />
            <ChipBlock label="Current medications" items={p.current_medications} tone="primary" />
          </>
        ) : null}

        {tab === 'Emergency' ? (
          <>
            <Field label="Contact name" value={p.emergency_contact.name} />
            <Field label="Phone" value={p.emergency_contact.phone} />
            <Field label="Relationship" value={p.emergency_contact.relation} />
          </>
        ) : null}

        {tab === 'Insurance' ? (
          <>
            <Field label="Provider" value={p.insurance.provider} />
            <Field label="Policy number" value={p.insurance.policy_number} />
            <Field label="Valid till" value={p.insurance.valid_till} />
          </>
        ) : null}
      </Card>

      <SectionHeader title="Membership" actionLabel="Manage" onAction={() => router.push('/more/membership')} />
      <Card style={styles.membershipCard}>
        <Text style={typography.h3}>{membership.plan_name} plan</Text>
        <Text style={typography.bodyMuted}>Renews on {membership.renews_on} · {membership.members_covered} members covered</Text>
      </Card>

      <SectionHeader title="Account" />
      <Card style={styles.group}>
        <MenuRow icon="settings-outline" title="Profile Settings" subtitle="All your profile sections" onPress={() => router.push('/more/profile-settings')} />
        <MenuRow icon="notifications-outline" title="Notifications" subtitle="Alerts and reminders" onPress={() => router.push('/more/notifications')} />
        <MenuRow icon="wallet-outline" title="Wallet" subtitle="Balance and transactions" tint={colors.secondary} onPress={() => router.push('/more/wallet')} />
        <MenuRow icon="shield-checkmark-outline" title="Account status" subtitle="Verification progress" tint={colors.warning} onPress={() => router.push('/more/account-status')} />
        <MenuRow icon="people-outline" title="Family" subtitle="Manage linked members" onPress={() => router.push('/more/family')} />
        <MenuRow icon="headset-outline" title="Support staff" subtitle="Your assigned care team" tint={colors.secondary} onPress={() => router.push('/more/support-staff')} />
      </Card>

      <SectionHeader title="Explore" />
      <Card style={styles.group}>
        <MenuRow icon="shield-outline" title="Health plans" onPress={() => router.push('/more/health-plans')} />
        <MenuRow icon="storefront-outline" title="Marketplace" tint={colors.secondary} onPress={() => router.push('/more/marketplace')} />
        <MenuRow icon="document-text-outline" title="Terms & Conditions" tint={colors.warning} onPress={() => router.push('/(auth)/terms')} />
        <MenuRow icon="apps-outline" title="More" subtitle="Everything in one place" onPress={() => router.push('/more')} />
      </Card>

      <MenuRow icon="log-out-outline" title="Sign out" tint={colors.error} onPress={() => router.replace('/(auth)/signin')} />
    </ScreenWrapper>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={typography.bodyMuted}>{label}</Text>
      <Text style={[typography.body, styles.fieldValue]}>{value}</Text>
    </View>
  );
}

function VitalTile({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.vitalTile}>
      <Ionicons name={icon} size={17} color={colors.primary} />
      <Text style={styles.vitalValue}>{value}</Text>
      <Text style={typography.caption}>{label}</Text>
    </View>
  );
}

function ChipBlock({ label, items, tone }: { label: string; items: string[]; tone: 'error' | 'warning' | 'primary' }) {
  if (!items.length) return null;
  return (
    <View style={styles.chipBlock}>
      <Text style={typography.label}>{label.toUpperCase()}</Text>
      <View style={styles.chipRow}>
        {items.map((i) => <Badge key={i} label={i} tone={tone} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 16 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  tabScroll: { flexGrow: 0, marginBottom: 12 },
  tabRow: { gap: 8 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  detailCard: { gap: 12, marginBottom: 16 },
  field: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  fieldValue: { fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  vitalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vitalTile: {
    width: '47%', gap: 3, padding: 12, borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  vitalValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  chipBlock: { gap: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  membershipCard: { marginBottom: 8, gap: 4 },
  group: { padding: 4, marginBottom: 16 },
});
