import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../../src/components/ScreenWrapper';
import ScreenHeader from '../../../src/components/ScreenHeader';
import Card from '../../../src/components/Card';
import PrimaryButton from '../../../src/components/PrimaryButton';
import { familyRoles, patientModules } from '../../../src/data/mock';
import { colors, radius, typography } from '../../../src/theme/theme';

type Grant = { can_view: boolean; can_manage: boolean };

/**
 * Role matrix editor — every module the backend catalog exposes, each with two
 * verbs. The server treats `manage` as implying `view` and drops all-false
 * rows, so the UI keeps the same rule live: ticking Manage ticks View, and
 * unticking View unticks Manage.
 */
export default function FamilyRoleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === 'new';
  const role = familyRoles.find((r) => r.id === id);

  const [name, setName] = useState(isNew ? '' : role?.name ?? '');
  const [description, setDescription] = useState(isNew ? '' : role?.description ?? '');
  const [grants, setGrants] = useState<Record<string, Grant>>(() => {
    const seed: Record<string, Grant> = {};
    (role?.permissions ?? []).forEach((p) => {
      seed[p.module] = { can_view: p.can_view, can_manage: p.can_manage };
    });
    return seed;
  });

  const toggle = (key: string, verb: 'can_view' | 'can_manage') => {
    setGrants((g) => {
      const cur = g[key] ?? { can_view: false, can_manage: false };
      const next = { ...cur, [verb]: !cur[verb] };
      // Keep the server's invariant visible in the UI.
      if (verb === 'can_manage' && next.can_manage) next.can_view = true;
      if (verb === 'can_view' && !next.can_view) next.can_manage = false;
      return { ...g, [key]: next };
    });
  };

  // Group in first-seen order, as the catalog defines.
  const groups = useMemo(() => {
    const order: string[] = [];
    const byGroup: Record<string, typeof patientModules> = {};
    patientModules.forEach((m) => {
      if (!byGroup[m.group]) { byGroup[m.group] = []; order.push(m.group); }
      byGroup[m.group].push(m);
    });
    return order.map((g) => ({ group: g, modules: byGroup[g] }));
  }, []);

  const viewCount = Object.values(grants).filter((g) => g.can_view).length;
  const manageCount = Object.values(grants).filter((g) => g.can_manage).length;

  const setAll = (on: boolean) => {
    const next: Record<string, Grant> = {};
    if (on) patientModules.forEach((m) => { next[m.key] = { can_view: true, can_manage: true }; });
    setGrants(next);
  };

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title={isNew ? 'New role' : role?.name ?? 'Role'} fallback="/more/family" />

      <Card style={styles.metaCard}>
        <Text style={typography.label}>ROLE NAME</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Appointments only"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <Text style={[typography.label, { marginTop: 12 }]}>DESCRIPTION</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What this role is for"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </Card>

      <View style={styles.summaryRow}>
        <Text style={typography.bodyMuted}>
          {viewCount} can view · {manageCount} can manage
        </Text>
        <View style={styles.bulkRow}>
          <TouchableOpacity onPress={() => setAll(true)}><Text style={styles.bulkText}>Select all</Text></TouchableOpacity>
          <Text style={styles.bulkSep}>·</Text>
          <TouchableOpacity onPress={() => setAll(false)}><Text style={styles.bulkText}>Clear</Text></TouchableOpacity>
        </View>
      </View>

      {groups.map(({ group, modules }) => (
        <Card key={group} style={styles.groupCard}>
          <View style={styles.groupHead}>
            <Text style={typography.h3}>{group}</Text>
            <View style={styles.verbHead}>
              <Text style={styles.verbLabel}>View</Text>
              <Text style={styles.verbLabel}>Manage</Text>
            </View>
          </View>

          {modules.map((m) => {
            const g = grants[m.key] ?? { can_view: false, can_manage: false };
            return (
              <View key={m.key} style={styles.moduleRow}>
                <Text style={styles.moduleLabel} numberOfLines={2}>{m.label}</Text>
                <View style={styles.checks}>
                  <TouchableOpacity onPress={() => toggle(m.key, 'can_view')} hitSlop={6} style={styles.checkCell}>
                    <Ionicons
                      name={g.can_view ? 'checkbox' : 'square-outline'}
                      size={21}
                      color={g.can_view ? colors.primary : colors.textMuted}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => toggle(m.key, 'can_manage')} hitSlop={6} style={styles.checkCell}>
                    <Ionicons
                      name={g.can_manage ? 'checkbox' : 'square-outline'}
                      size={21}
                      color={g.can_manage ? colors.secondaryDark : colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </Card>
      ))}

      <PrimaryButton
        label={isNew ? 'Create role' : 'Save role'}
        disabled={!name.trim()}
        style={styles.save}
        onPress={() => router.back()}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  metaCard: { marginBottom: 14 },
  input: {
    height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, fontSize: 14, color: colors.textPrimary,
    backgroundColor: colors.surface, marginTop: 6,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  bulkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulkText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  bulkSep: { color: colors.textMuted },
  groupCard: { marginBottom: 12, gap: 2 },
  groupHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 4,
  },
  verbHead: { flexDirection: 'row', gap: 8 },
  // Wide enough that "Manage" doesn't wrap mid-word at phone width.
  verbLabel: { width: 54, textAlign: 'center', fontSize: 9.5, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  moduleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  moduleLabel: { flex: 1, fontSize: 13, color: colors.textPrimary },
  checks: { flexDirection: 'row', gap: 8 },
  checkCell: { width: 54, alignItems: 'center' },
  save: { marginTop: 10 },
});
