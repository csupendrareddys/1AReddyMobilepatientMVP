import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import AppModal from '../../src/components/AppModal';
import PrimaryButton from '../../src/components/PrimaryButton';
import DropdownModal from '../../src/components/DropdownModal';
import InputBox from '../../src/components/InputBox';
import AttachSheet from '../../src/components/AttachSheet';
import AddFieldSheet from '../../src/components/AddFieldSheet';
import { usePatientScope } from '../../src/scope/PatientScope';
import { grantedModules } from '../../src/data/people';
import {
  currentPatient, familyRoles, familyScopes, linkRequests, minorRelationOptions,
  minors, Minor, relationHints, relationOptions,
} from '../../src/data/mock';
import {
  createMinorRecord, femaleHealthGroup, registerMinorRecord, showsFemaleHealth,
} from '../../src/data/minorData';
import { newId } from '../../src/data/profileStore';
import { colors, radius, typography } from '../../src/theme/theme';

/**
 * The health blocks offered while adding a child.
 *
 * A guardian usually has the height, weight and allergies in front of them when
 * they create the profile; making them come back later to a second screen is
 * how records end up empty. All optional — a name and a relation is enough.
 */
const MINOR_VITALS = [
  { key: 'height_cm', label: 'Height (cm)', placeholder: '128' },
  { key: 'weight_kg', label: 'Weight (kg)', placeholder: '26' },
  { key: 'blood_pressure_systolic', label: 'BP Systolic (mmHg)', placeholder: '96' },
  { key: 'blood_pressure_diastolic', label: 'BP Diastolic (mmHg)', placeholder: '62' },
  { key: 'heart_rate', label: 'Heart Rate (bpm)', placeholder: '92' },
  { key: 'temperature', label: 'Temperature (°F)', placeholder: '98.4' },
  { key: 'blood_sugar_fasting', label: 'Blood Sugar — Fasting (mg/dL)', placeholder: '92' },
];

const MINOR_HABITS = [
  { key: 'exercise', label: 'Exercise', placeholder: 'Outdoor play, ~1 hr daily' },
  { key: 'sleep_pattern', label: 'Sleep Pattern', placeholder: '9–10 hours' },
  { key: 'screen_time', label: 'Screen Time', placeholder: '1 hr / day' },
  { key: 'allergies', label: 'Allergies', placeholder: 'Dust, peanuts…' },
];

const DIET_OPTIONS = ['Vegetarian', 'Non-vegetarian', 'Vegan', 'Eggetarian'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

type ExtraField = { section: 'vitals' | 'habits'; label: string; value: string };

const age = (dob: string) => {
  const y = Number(dob.slice(0, 4));
  return Number.isFinite(y) ? `${2026 - y} yrs` : '';
};

const statusTone: Record<string, 'warning' | 'success' | 'error' | 'neutral'> = {
  PENDING: 'warning', ACCEPTED: 'success', REJECTED: 'error',
  EXPIRED: 'neutral', CANCELLED: 'neutral',
};

export default function FamilyScreen() {
  const router = useRouter();
  const { enter } = usePatientScope();

  const [minorList, setMinorList] = useState<Minor[]>(minors);
  const [addMinor, setAddMinor] = useState(false);
  const [form, setForm] = useState({
    first_name: '', last_name: '', relation: 'Son', dob: '', gender: 'Male', blood_group: 'O+',
  });
  // The health blocks of the add form — all optional.
  const [vitals, setVitals] = useState<Record<string, string>>({});
  const [habits, setHabits] = useState<Record<string, string>>({ diet: 'Vegetarian' });
  const [female, setFemale] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState<ExtraField[]>([]);
  const [docs, setDocs] = useState<{ id: string; filename: string }[]>([]);
  const [attachOpen, setAttachOpen] = useState(false);
  const [addFieldTo, setAddFieldTo] = useState<'vitals' | 'habits' | null>(null);
  const [roleFor, setRoleFor] = useState<string | null>(null);
  const [assigned, setAssigned] = useState<Record<string, string | null>>(
    Object.fromEntries(familyScopes.granted.map((g) => [g.id, g.role_id])),
  );
  const [requestOpen, setRequestOpen] = useState(false);
  const [reqRelation, setReqRelation] = useState('Brother');

  const showFemale = showsFemaleHealth(form.gender, form.dob);

  const saveMinor = () => {
    const id = newId('mn');
    const minor: Minor = {
      id,
      full_name: `${form.first_name} ${form.last_name}`.trim(),
      relation: form.relation,
      dob: form.dob,
      gender: form.gender,
      avatar: 'https://i.pravatar.cc/150?img=12',
    };

    // Push into the shared list, not just local state: the person picker on
    // every other screen reads from there, so a new child has to appear in it.
    minors.push(minor);
    setMinorList([...minors]);

    // Give them a full record straight away, so Profile Settings and Health
    // Records work for this child the same as for any other.
    registerMinorRecord(id, createMinorRecord({
      id,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      dob: form.dob,
      gender: form.gender,
      blood_group: form.blood_group,
      guardian_name: currentPatient.full_name,
      guardian_phone: currentPatient.phone,
      vitals,
      habits,
      female_health: showFemale ? female : {},
      extra,
      documents: docs,
    }));

    setAddMinor(false);
    setForm({ first_name: '', last_name: '', relation: 'Son', dob: '', gender: 'Male', blood_group: 'O+' });
    setVitals({});
    setHabits({ diet: 'Vegetarian' });
    setFemale({});
    setExtra([]);
    setDocs([]);
  };

  /** Enter the minor's scope, then land on `route`. */
  const openMinorAt = (m: Minor, route: string) => {
    enter({ kind: 'minor', id: m.id, name: m.full_name.split(' ')[0], roleName: null });
    router.push(route as never);
  };

  const openMinor = (m: Minor) => {
    enter({ kind: 'minor', id: m.id, name: m.full_name.split(' ')[0], roleName: null });
    router.replace('/(tabs)');
  };

  const sent = linkRequests.filter((r) => r.direction === 'sent');
  const received = linkRequests.filter((r) => r.direction === 'received');

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Family" />
      <Text style={[typography.bodyMuted, styles.intro]}>
        Add a child or dependent as a separate profile — no separate login. Open one
        to book and track their appointments and records under your account.
      </Text>

      {/* ── 1. Minor profiles ────────────────────────────────────── */}
      <View style={styles.sectionHead}>
        <Ionicons name="happy-outline" size={17} color={colors.primary} />
        <Text style={[typography.h3, { flex: 1 }]}>Minor profiles ({minorList.length})</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddMinor(true)}>
          <Ionicons name="add" size={14} color={colors.white} />
          <Text style={styles.addText}>Add minor</Text>
        </TouchableOpacity>
      </View>

      {minorList.length ? minorList.map((m) => (
        <Card key={m.id} style={styles.minorCard}>
          <View style={styles.minorTop}>
            <Image source={{ uri: m.avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>{m.full_name}</Text>
              <Text style={typography.bodyMuted}>
                {m.relation}{m.dob ? ` · b. ${m.dob} · ${age(m.dob)}` : ''}
              </Text>
            </View>
            <Badge label="No login" tone="neutral" />
          </View>
          {/* Jump straight to the minor's own profile or records — each enters
              their scope first, so the guardian's data is never shown here. */}
          <View style={styles.minorActions}>
            <TouchableOpacity style={styles.openBtn} onPress={() => openMinor(m)}>
              <Ionicons name="log-in-outline" size={13} color={colors.white} />
              <Text style={styles.openText}>Open</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.minorLink} onPress={() => openMinorAt(m, '/more/profile-settings')}>
              <Ionicons name="settings-outline" size={13} color={colors.primary} />
              <Text style={styles.minorLinkText}>Profile settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.minorLink} onPress={() => openMinorAt(m, '/more/health-records')}>
              <Ionicons name="pulse-outline" size={13} color={colors.primary} />
              <Text style={styles.minorLinkText}>Records</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )) : (
        <Card><Text style={typography.bodyMuted}>No minor profiles yet.</Text></Card>
      )}

      {/* ── 2. Linked family ─────────────────────────────────────── */}
      <View style={[styles.sectionHead, styles.sectionGap]}>
        <Ionicons name="people-outline" size={17} color={colors.secondary} />
        <Text style={[typography.h3, { flex: 1 }]}>Linked family</Text>
        <TouchableOpacity style={styles.ghostBtn} onPress={() => setRequestOpen(true)}>
          <Text style={styles.ghostText}>Link someone</Text>
        </TouchableOpacity>
      </View>

      <Text style={[typography.label, styles.subLabel]}>FAMILY WHO CAN ACT FOR ME</Text>
      {familyScopes.granted.map((g) => {
        const roleId = assigned[g.id];
        const role = familyRoles.find((r) => r.id === roleId);
        return (
          <Card key={g.id} style={styles.row}>
            <Image source={{ uri: g.avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>{g.name}</Text>
              <Text style={typography.bodyMuted}>{g.relation}</Text>
              <TouchableOpacity style={styles.roleChip} onPress={() => setRoleFor(g.id)}>
                <Ionicons name="shield-outline" size={12} color={role ? colors.primary : colors.textMuted} />
                <Text style={[styles.roleChipText, !role && styles.roleChipEmpty]}>
                  {role ? role.name : 'No role — tap to assign'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        );
      })}

      <Text style={[typography.label, styles.subLabel]}>ACCOUNTS I CAN OPEN</Text>
      {familyScopes.linked.map((l) => {
        const mods = grantedModules(l.role_id);
        const openAt = (route: string) => {
          enter({ kind: 'linked', id: l.id, name: l.name.split(' ')[0], roleName: l.role_name });
          router.push(route as never);
        };
        const can = (key: string) => mods.some((m) => m.label === key);
        return (
          <Card key={l.id} style={styles.minorCard}>
            <View style={styles.minorTop}>
              <Image source={{ uri: l.avatar }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={typography.h3}>{l.name}</Text>
                <Text style={typography.bodyMuted}>{l.relation} · {l.role_name}</Text>
              </View>
            </View>

            {/* What this role actually lets me do, spelled out. */}
            <View style={styles.accessChips}>
              {mods.slice(0, 6).map((m) => (
                <View key={m.label} style={styles.accessChip}>
                  <Ionicons
                    name={m.canManage ? 'create-outline' : 'eye-outline'}
                    size={10}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.accessChipText}>{m.label}</Text>
                </View>
              ))}
              {mods.length > 6 ? (
                <View style={styles.accessChip}>
                  <Text style={styles.accessChipText}>+{mods.length - 6} more</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.minorActions}>
              <TouchableOpacity
                style={styles.openBtn}
                onPress={() => {
                  enter({ kind: 'linked', id: l.id, name: l.name.split(' ')[0], roleName: l.role_name });
                  router.replace('/(tabs)');
                }}
              >
                <Ionicons name="log-in-outline" size={13} color={colors.white} />
                <Text style={styles.openText}>Open</Text>
              </TouchableOpacity>
              {can('Upcoming appointments') ? (
                <TouchableOpacity style={styles.minorLink} onPress={() => openAt('/(tabs)/appointments')}>
                  <Ionicons name="calendar-outline" size={13} color={colors.primary} />
                  <Text style={styles.minorLinkText}>Appointments</Text>
                </TouchableOpacity>
              ) : null}
              {can('Personal details') ? (
                <TouchableOpacity style={styles.minorLink} onPress={() => openAt('/more/profile-settings')}>
                  <Ionicons name="settings-outline" size={13} color={colors.primary} />
                  <Text style={styles.minorLinkText}>Profile</Text>
                </TouchableOpacity>
              ) : null}
              {can('Prescriptions') ? (
                <TouchableOpacity style={styles.minorLink} onPress={() => openAt('/more/prescriptions')}>
                  <Ionicons name="medkit-outline" size={13} color={colors.primary} />
                  <Text style={styles.minorLinkText}>Prescriptions</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </Card>
        );
      })}

      {/* Link requests */}
      <Text style={[typography.label, styles.subLabel]}>
        REQUESTS — SENT ({sent.length}) · RECEIVED ({received.length})
      </Text>
      {linkRequests.map((r) => (
        <Card key={r.id} style={styles.reqRow}>
          <View style={{ flex: 1 }}>
            <Text style={typography.body}>{r.name}</Text>
            <Text style={typography.caption}>
              {r.relation} · {r.phone} · {r.direction}
            </Text>
          </View>
          {r.direction === 'received' && r.status === 'PENDING' ? (
            <View style={styles.reqActions}>
              <TouchableOpacity style={styles.acceptBtn}><Text style={styles.acceptText}>Accept</Text></TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn}><Text style={styles.rejectText}>Reject</Text></TouchableOpacity>
            </View>
          ) : (
            <Badge label={r.status} tone={statusTone[r.status]} />
          )}
        </Card>
      ))}

      {/* ── 3. Roles ─────────────────────────────────────────────── */}
      <View style={[styles.sectionHead, styles.sectionGap]}>
        <Ionicons name="shield-checkmark-outline" size={17} color={colors.warning} />
        <Text style={[typography.h3, { flex: 1 }]}>Roles ({familyRoles.length})</Text>
        <TouchableOpacity style={styles.ghostBtn} onPress={() => router.push('/more/family-role/new')}>
          <Text style={styles.ghostText}>New role</Text>
        </TouchableOpacity>
      </View>
      <Text style={[typography.bodyMuted, styles.roleIntro]}>
        A role bounds exactly what a linked adult may do on your behalf.
      </Text>

      {familyRoles.map((r) => {
        const views = r.permissions.filter((p) => p.can_view).length;
        const manages = r.permissions.filter((p) => p.can_manage).length;
        return (
          <TouchableOpacity key={r.id} activeOpacity={0.85} onPress={() => router.push(`/more/family-role/${r.id}`)}>
            <Card style={styles.row}>
              <View style={styles.roleIcon}>
                <Ionicons name="ribbon-outline" size={17} color={colors.warningDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.h3}>{r.name}</Text>
                <Text style={typography.bodyMuted}>{r.description}</Text>
                <Text style={typography.caption}>{views} can view · {manages} can manage</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Card>
          </TouchableOpacity>
        );
      })}

      {/* Add minor */}
      <AppModal visible={addMinor} onClose={() => setAddMinor(false)} title="Add a minor">
        <ScrollView style={{ maxHeight: 400 }}>
          <InputBox label="First name" value={form.first_name} onChangeText={(v) => setForm((f) => ({ ...f, first_name: v }))} containerStyle={styles.field} />
          <InputBox label="Last name" value={form.last_name} onChangeText={(v) => setForm((f) => ({ ...f, last_name: v }))} containerStyle={styles.field} />
          <View style={styles.field}>
            <DropdownModal
              label="Relation"
              value={form.relation}
              options={minorRelationOptions.map((r) => ({ label: r, value: r }))}
              onChange={(v) => setForm((f) => ({ ...f, relation: v }))}
              title="Relation"
            />
          </View>
          <InputBox label="Date of birth" value={form.dob} onChangeText={(v) => setForm((f) => ({ ...f, dob: v }))} placeholder="YYYY-MM-DD" containerStyle={styles.field} />
          <View style={styles.field}>
            <DropdownModal
              label="Gender"
              value={form.gender}
              options={['Male', 'Female', 'Other'].map((g) => ({ label: g, value: g }))}
              onChange={(v) => setForm((f) => ({ ...f, gender: v }))}
              title="Gender"
            />
          </View>
          <View style={styles.field}>
            <DropdownModal
              label="Blood group"
              value={form.blood_group}
              options={BLOOD_GROUPS.map((b) => ({ label: b, value: b }))}
              onChange={(v) => setForm((f) => ({ ...f, blood_group: v }))}
              title="Blood group"
            />
          </View>

          {/* ── Female health ─────────────────────────────────────── */}
          {showFemale ? (
            <>
              <Text style={[typography.label, styles.formHead]}>FEMALE HEALTH</Text>
              {femaleHealthGroup()[0].fields.map((f) => (
                <View key={f.key} style={styles.field}>
                  {f.type === 'select' && f.options ? (
                    <DropdownModal
                      label={f.label}
                      value={female[f.key] ?? f.value}
                      options={f.options.map((o) => ({ label: o, value: o }))}
                      onChange={(v) => setFemale((x) => ({ ...x, [f.key]: v }))}
                      title={f.label}
                    />
                  ) : (
                    <InputBox
                      label={f.label}
                      value={female[f.key] ?? ''}
                      onChangeText={(v) => setFemale((x) => ({ ...x, [f.key]: v }))}
                      placeholder={f.type === 'date' ? 'YYYY-MM-DD' : 'Optional'}
                    />
                  )}
                </View>
              ))}
            </>
          ) : null}

          {/* ── Vitals ────────────────────────────────────────────── */}
          <Text style={[typography.label, styles.formHead]}>VITALS (OPTIONAL)</Text>
          {MINOR_VITALS.map((f) => (
            <InputBox
              key={f.key}
              label={f.label}
              value={vitals[f.key] ?? ''}
              onChangeText={(v) => setVitals((x) => ({ ...x, [f.key]: v }))}
              placeholder={f.placeholder}
              keyboardType="numeric"
              containerStyle={styles.field}
            />
          ))}
          {extra.filter((x) => x.section === 'vitals').map((x, i) => (
            <CustomRow
              key={`v-${i}`}
              field={x}
              onChange={(v) => setExtra((all) => all.map((e) => (e === x ? { ...e, value: v } : e)))}
              onRemove={() => setExtra((all) => all.filter((e) => e !== x))}
            />
          ))}
          <TouchableOpacity style={styles.addFieldBtn} onPress={() => setAddFieldTo('vitals')}>
            <Ionicons name="add-circle-outline" size={15} color={colors.primary} />
            <Text style={styles.addFieldText}>Add new field</Text>
          </TouchableOpacity>

          {/* ── Habits & lifestyle ────────────────────────────────── */}
          <Text style={[typography.label, styles.formHead]}>HABITS &amp; LIFESTYLE (OPTIONAL)</Text>
          <View style={styles.field}>
            <DropdownModal
              label="Diet"
              value={habits.diet ?? 'Vegetarian'}
              options={DIET_OPTIONS.map((d) => ({ label: d, value: d }))}
              onChange={(v) => setHabits((x) => ({ ...x, diet: v }))}
              title="Diet"
            />
          </View>
          {MINOR_HABITS.map((f) => (
            <InputBox
              key={f.key}
              label={f.label}
              value={habits[f.key] ?? ''}
              onChangeText={(v) => setHabits((x) => ({ ...x, [f.key]: v }))}
              placeholder={f.placeholder}
              containerStyle={styles.field}
            />
          ))}
          {extra.filter((x) => x.section === 'habits').map((x, i) => (
            <CustomRow
              key={`h-${i}`}
              field={x}
              onChange={(v) => setExtra((all) => all.map((e) => (e === x ? { ...e, value: v } : e)))}
              onRemove={() => setExtra((all) => all.filter((e) => e !== x))}
            />
          ))}
          <TouchableOpacity style={styles.addFieldBtn} onPress={() => setAddFieldTo('habits')}>
            <Ionicons name="add-circle-outline" size={15} color={colors.primary} />
            <Text style={styles.addFieldText}>Add new field</Text>
          </TouchableOpacity>

          {/* ── Documents ─────────────────────────────────────────── */}
          <Text style={[typography.label, styles.formHead]}>DOCUMENTS (OPTIONAL)</Text>
          <Text style={typography.caption}>
            Birth certificate, immunisation card, an earlier report — these become
            their first health record.
          </Text>
          {docs.map((d) => (
            <View key={d.id} style={styles.docRow}>
              <Ionicons
                name={/\.(jpg|jpeg|png|heic)$/i.test(d.filename) ? 'image-outline' : 'document-text-outline'}
                size={16}
                color={colors.warningDark}
              />
              <Text style={[typography.body, { flex: 1 }]} numberOfLines={1}>{d.filename}</Text>
              <TouchableOpacity hitSlop={8} onPress={() => setDocs((l) => l.filter((x) => x.id !== d.id))}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.attachBtn} onPress={() => setAttachOpen(true)}>
            <Ionicons name="attach" size={15} color={colors.primary} />
            <Text style={styles.addFieldText}>Add attachment</Text>
            <Text style={styles.attachHint}>Camera · Photos · Files</Text>
          </TouchableOpacity>

          <Text style={[typography.caption, styles.formNote]}>
            A minor has no login of their own and no family group — you manage
            their profile and records from your account. Everything except the
            name can be filled in later.
          </Text>
        </ScrollView>
        <View style={styles.modalActions}>
          <PrimaryButton label="Cancel" variant="outline" style={styles.modalBtn} onPress={() => setAddMinor(false)} />
          <PrimaryButton label="Add" disabled={!form.first_name.trim()} style={styles.modalBtn} onPress={saveMinor} />
        </View>
      </AppModal>

      {/* Camera / photos / files, same picker as everywhere else */}
      <AttachSheet
        visible={attachOpen}
        onClose={() => setAttachOpen(false)}
        withNote={false}
        onPick={(file) => {
          setDocs((l) => [...l, { id: newId('att'), filename: file }]);
          setAttachOpen(false);
        }}
      />

      {/* A parameter our vitals / habits lists don't cover */}
      <AddFieldSheet
        visible={!!addFieldTo}
        onClose={() => setAddFieldTo(null)}
        sectionTitle={addFieldTo === 'habits' ? 'Habits & Lifestyle' : 'Vitals'}
        onAdd={(f) => {
          if (!addFieldTo) return;
          setExtra((l) => [...l, { section: addFieldTo, label: f.label, value: f.value }]);
        }}
      />

      {/* Assign role */}
      <AppModal visible={!!roleFor} onClose={() => setRoleFor(null)} title="Assign a role">
        <Text style={typography.bodyMuted}>
          Only you decide what someone may do on your behalf.
        </Text>
        {[...familyRoles, { id: '__none', name: 'No access', description: 'Revoke this person\'s role.', permissions: [] }].map((r) => {
          const active = roleFor ? (assigned[roleFor] ?? '__none') === r.id : false;
          return (
            <TouchableOpacity
              key={r.id}
              style={[styles.roleOption, active && styles.roleOptionActive]}
              onPress={() => {
                if (roleFor) setAssigned((a) => ({ ...a, [roleFor]: r.id === '__none' ? null : r.id }));
                setRoleFor(null);
              }}
            >
              <View style={[styles.radio, active && styles.radioActive]}>
                {active ? <View style={styles.radioDot} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.body}>{r.name}</Text>
                <Text style={typography.caption}>{r.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </AppModal>

      {/* Send link request */}
      <AppModal visible={requestOpen} onClose={() => setRequestOpen(false)} title="Link a family member">
        <ScrollView style={{ maxHeight: 380 }}>
          <InputBox label="Phone number *" placeholder="+91 XXXXX XXXXX" keyboardType="phone-pad" containerStyle={styles.field} />
          <InputBox label="First name *" containerStyle={styles.field} />
          <InputBox label="Last name *" containerStyle={styles.field} />
          <View style={styles.field}>
            <DropdownModal
              label="Their relation to me"
              value={reqRelation}
              options={relationOptions.map((r) => ({ label: r, value: r }))}
              onChange={setReqRelation}
              title="Relation"
            />
          </View>
          {/* The web hints which relation the receiver should choose back, so
              the two sides describe the same link consistently. */}
          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
            <Text style={styles.hintText}>
              They should accept as: {relationHints[reqRelation] ?? 'a matching relation'}
            </Text>
          </View>
        </ScrollView>
        <View style={styles.modalActions}>
          <PrimaryButton label="Cancel" variant="outline" style={styles.modalBtn} onPress={() => setRequestOpen(false)} />
          <PrimaryButton label="Send request" style={styles.modalBtn} onPress={() => setRequestOpen(false)} />
        </View>
      </AppModal>
    </ScreenWrapper>
  );
}

/** One patient-added parameter in the add form — editable, removable. */
function CustomRow({
  field, onChange, onRemove,
}: {
  field: ExtraField;
  onChange: (value: string) => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.customRow}>
      <View style={{ flex: 1 }}>
        <InputBox label={field.label} value={field.value} onChangeText={onChange} placeholder="Value" />
      </View>
      <TouchableOpacity hitSlop={8} onPress={onRemove} style={styles.customRemove}>
        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 18 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionGap: { marginTop: 24 },
  subLabel: { marginTop: 14, marginBottom: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.sm },
  addText: { fontSize: 11.5, fontWeight: '700', color: colors.white },
  ghostBtn: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  ghostText: { fontSize: 11.5, fontWeight: '700', color: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  minorCard: { gap: 12, marginBottom: 10 },
  minorTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  minorActions: {
    flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 10,
  },
  minorLink: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  minorLinkText: { fontSize: 11.5, fontWeight: '700', color: colors.primary },
  accessChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  accessChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.pill,
  },
  accessChipText: { fontSize: 10, fontWeight: '600', color: colors.textSecondary },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  openBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, paddingHorizontal: 11, paddingVertical: 6, borderRadius: radius.sm },
  openText: { fontSize: 11.5, fontWeight: '700', color: colors.white },
  roleChip: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, alignSelf: 'flex-start' },
  roleChipText: { fontSize: 11.5, fontWeight: '700', color: colors.primary },
  roleChipEmpty: { color: colors.textMuted, fontWeight: '500' },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reqActions: { flexDirection: 'row', gap: 6 },
  acceptBtn: { backgroundColor: colors.success, paddingHorizontal: 11, paddingVertical: 6, borderRadius: radius.sm },
  acceptText: { fontSize: 11, fontWeight: '700', color: colors.white },
  rejectBtn: { borderWidth: 1, borderColor: colors.error, paddingHorizontal: 11, paddingVertical: 6, borderRadius: radius.sm },
  rejectText: { fontSize: 11, fontWeight: '700', color: colors.error },
  roleIntro: { marginBottom: 10 },
  roleIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.warningLight, alignItems: 'center', justifyContent: 'center' },
  field: { marginBottom: 12 },
  formHead: { marginTop: 6, marginBottom: 10 },
  formNote: { marginTop: 14 },
  addFieldBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6 },
  addFieldText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  customRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  customRemove: { paddingBottom: 13 },
  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  attachBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    paddingVertical: 11, paddingHorizontal: 12, borderRadius: radius.sm,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: '#F4F8FE',
  },
  attachHint: { flex: 1, fontSize: 10.5, color: colors.textMuted, textAlign: 'right' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalBtn: { flex: 1 },
  roleOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginTop: 10,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
  },
  roleOptionActive: { borderColor: colors.primary, borderWidth: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  hintBox: { flexDirection: 'row', gap: 7, alignItems: 'flex-start', backgroundColor: '#E8F1FC', padding: 10, borderRadius: radius.sm },
  hintText: { flex: 1, fontSize: 12, color: colors.primaryDark },
});
