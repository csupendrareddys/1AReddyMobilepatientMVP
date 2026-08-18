import React, { useReducer, useState } from 'react';
import {
  Image, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import AppModal from '../../src/components/AppModal';
import PrimaryButton from '../../src/components/PrimaryButton';
import InputBox from '../../src/components/InputBox';
import { familyRoles, supportStaff, SupportStaffMember } from '../../src/data/mock';
import {
  addCaregiver, caregivers, CaregiverDraft, setCaregiverRoles,
} from '../../src/data/caregivers';
import { colors, radius, typography } from '../../src/theme/theme';

/**
 * The people who act for this patient — a care coordinator, a nurse, a son.
 *
 * Mirrors the web's SupportStaffPage: a caregiver is added with a login of
 * their own (email + temporary password), given roles that bound what they may
 * do, and separately granted or denied the right to pay for bookings. Paying
 * is kept out of the roles on purpose — it's the one permission where a
 * mistake costs money, so it's never bundled into a named role.
 */

const MIN_PASSWORD = 8;

export default function SupportStaffScreen() {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const [addOpen, setAddOpen] = useState(false);
  const [rolesFor, setRolesFor] = useState<SupportStaffMember | null>(null);

  const [form, setForm] = useState<CaregiverDraft>({
    firstName: '', lastName: '', relation: '', email: '', password: '',
    roleIds: [], canPay: false,
  });
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof CaregiverDraft) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleRole = (id: string) => setForm((f) => ({
    ...f,
    roleIds: f.roleIds.includes(id) ? f.roleIds.filter((x) => x !== id) : [...f.roleIds, id],
  }));

  const canSave = form.firstName.trim() !== ''
    && form.email.trim() !== ''
    && form.password.length >= MIN_PASSWORD;

  const save = () => {
    if (!form.email.includes('@')) {
      setError('That email address doesn’t look right.');
      return;
    }
    addCaregiver(form);
    setForm({
      firstName: '', lastName: '', relation: '', email: '', password: '',
      roleIds: [], canPay: false,
    });
    setError(null);
    setAddOpen(false);
    bump();
  };

  /** Seeded staff plus anyone added in this session. */
  const team = [...supportStaff, ...caregivers()];

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Your care team" />
      <Text style={[typography.bodyMuted, styles.intro]}>
        People who can act for you. Each signs in with their own login and can only
        do what their role allows.
      </Text>

      <TouchableOpacity style={styles.addBtn} activeOpacity={0.85} onPress={() => setAddOpen(true)}>
        <Ionicons name="person-add-outline" size={17} color={colors.white} />
        <Text style={styles.addText}>Add care / support staff</Text>
      </TouchableOpacity>

      {team.map((s) => (
        <Card key={s.id} style={styles.row}>
          <Image source={{ uri: s.avatar }} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>{s.name}</Text>
            <Text style={typography.bodyMuted}>{s.role}</Text>
            {s.email ? <Text style={typography.caption}>{s.email}</Text> : null}
            <View style={styles.chipRow}>
              {(s.roleIds ?? []).length ? (
                (s.roleIds ?? []).map((id) => (
                  <Badge
                    key={id}
                    label={familyRoles.find((r) => r.id === id)?.name ?? id}
                    tone="primary"
                  />
                ))
              ) : s.email ? <Badge label="No access yet" tone="neutral" /> : null}
              {s.canPay ? <Badge label="Can pay" tone="warning" /> : null}
            </View>
          </View>
          <View style={styles.rowActions}>
            {s.email ? (
              <TouchableOpacity
                style={styles.ghostBtn}
                onPress={() => setRolesFor(s)}
                accessibilityLabel={`Edit roles for ${s.name}`}
              >
                <Ionicons name="key-outline" size={15} color={colors.primary} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${s.phone}`)}>
              <Ionicons name="call" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      {/* ── Add a caregiver ──────────────────────────────────────── */}
      <AppModal visible={addOpen} onClose={() => setAddOpen(false)} title="Add a caregiver">
        <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
          <Text style={typography.bodyMuted}>
            They sign in with the email and password you set here, and can only do
            what their role allows.
          </Text>

          <InputBox
            label="First name *"
            value={form.firstName}
            onChangeText={set('firstName')}
            placeholder="Rahul"
            containerStyle={styles.field}
          />
          <InputBox
            label="Last name"
            value={form.lastName}
            onChangeText={set('lastName')}
            placeholder="Verma"
            containerStyle={styles.field}
          />
          <InputBox
            label="Relation"
            value={form.relation}
            onChangeText={set('relation')}
            placeholder="Nurse, aide, son…"
            containerStyle={styles.field}
          />

          <Text style={[typography.label, styles.divider]}>LOGIN</Text>
          <InputBox
            label="Login email *"
            value={form.email}
            onChangeText={set('email')}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            containerStyle={styles.field}
          />
          <InputBox
            label="Temporary password *"
            value={form.password}
            onChangeText={set('password')}
            placeholder="At least 8 characters"
            secureTextEntry
            containerStyle={styles.field}
          />
          <Text style={typography.caption}>
            At least {MIN_PASSWORD} characters. Share it with them to sign in — they can
            change it afterwards.
          </Text>

          <Text style={[typography.label, styles.divider]}>WHAT THEY MAY DO</Text>
          {familyRoles.map((r) => {
            const on = form.roleIds.includes(r.id);
            return (
              <TouchableOpacity key={r.id} style={styles.roleRow} onPress={() => toggleRole(r.id)}>
                <Ionicons
                  name={on ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={on ? colors.primary : colors.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.roleName}>{r.name}</Text>
                  <Text style={typography.caption}>{r.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          {!form.roleIds.length ? (
            <Text style={styles.noAccess}>
              With no role, they can sign in but see nothing. You can grant access later.
            </Text>
          ) : null}

          {/* Money is deliberately separate from the named roles. */}
          <View style={styles.payRow}>
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>Let them pay for bookings</Text>
              <Text style={typography.caption}>
                When on, they can pay from their OWN payment method — your card is never
                charged. Otherwise every booking they make waits for you to pay within a
                20-minute hold.
              </Text>
            </View>
            <Switch
              value={form.canPay}
              onValueChange={(v) => setForm((f) => ({ ...f, canPay: v }))}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.modalActions}>
          <PrimaryButton
            label="Cancel"
            variant="outline"
            style={styles.modalBtn}
            onPress={() => setAddOpen(false)}
          />
          <PrimaryButton
            label="Add caregiver"
            disabled={!canSave}
            style={styles.modalBtn}
            onPress={save}
          />
        </View>
      </AppModal>

      {/* ── Change an existing caregiver's roles ─────────────────── */}
      <AppModal
        visible={!!rolesFor}
        onClose={() => setRolesFor(null)}
        title={rolesFor ? `Roles — ${rolesFor.name}` : ''}
      >
        {rolesFor ? (
          <>
            <ScrollView style={styles.formScroll}>
              {familyRoles.map((r) => {
                const on = (rolesFor.roleIds ?? []).includes(r.id);
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={styles.roleRow}
                    onPress={() => {
                      const next = on
                        ? (rolesFor.roleIds ?? []).filter((x) => x !== r.id)
                        : [...(rolesFor.roleIds ?? []), r.id];
                      setCaregiverRoles(rolesFor.id, next, rolesFor.canPay ?? false);
                      setRolesFor({ ...rolesFor, roleIds: next });
                      bump();
                    }}
                  >
                    <Ionicons
                      name={on ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={on ? colors.primary : colors.textMuted}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roleName}>{r.name}</Text>
                      <Text style={typography.caption}>{r.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <View style={styles.payRow}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3}>Let them pay for bookings</Text>
                  <Text style={typography.caption}>
                    Paid from their own method, never your card.
                  </Text>
                </View>
                <Switch
                  value={!!rolesFor.canPay}
                  onValueChange={(v) => {
                    setCaregiverRoles(rolesFor.id, rolesFor.roleIds ?? [], v);
                    setRolesFor({ ...rolesFor, canPay: v });
                    bump();
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>
            </ScrollView>
            <PrimaryButton label="Done" style={styles.modalBtn} onPress={() => setRolesFor(null)} />
          </>
        ) : null}
      </AppModal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 14 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 16, paddingVertical: 13, borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  addText: { fontSize: 13.5, fontWeight: '800', color: colors.white },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  ghostBtn: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  callBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  formScroll: { maxHeight: 420, marginTop: 10 },
  field: { marginTop: 12 },
  divider: { marginTop: 20, marginBottom: 4 },
  roleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 9 },
  roleName: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  noAccess: { fontSize: 11.5, color: colors.warningDark, fontWeight: '600', marginTop: 4 },
  payRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  error: { fontSize: 12, color: colors.error, marginTop: 12, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalBtn: { flex: 1, marginTop: 4 },
});
