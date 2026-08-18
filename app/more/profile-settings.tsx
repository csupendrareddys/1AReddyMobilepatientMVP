import React, { useEffect, useReducer, useRef, useState } from 'react';
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
import EntryList from '../../src/components/EntryList';
import AddFieldSheet from '../../src/components/AddFieldSheet';
import { usePatientScope } from '../../src/scope/PatientScope';
import PersonSelector from '../../src/components/PersonSelector';
import { peopleFor, SELF_ID } from '../../src/data/people';
import { recordFor, showsFemaleHealth } from '../../src/data/minorData';
import {
  contactVerification, currentPatient, houseGroup, HouseMember, minors,
  permissionOptions, ProfileField, RecordEntry, relationOptions, sectionUpdates,
} from '../../src/data/mock';
import {
  addField, deleteEntry, extraFields, listFor, ListKey, removeField, saveEntry,
  setValues as storeValues, valuesOf,
} from '../../src/data/profileStore';
import { colors, radius, typography } from '../../src/theme/theme';

/**
 * Tabs mirror the web ProfileSetting page, in the same order. `femaleOnly`
 * matches the web's gate: the Female Health tab is hidden unless the patient's
 * gender is female, so changing Gender in Personal Details reveals it.
 */
const TABS = [
  { key: 'personal', label: 'Personal' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'female_health', label: 'Female Health', femaleOnly: true },
  { key: 'vitals', label: 'Vitals' },
  { key: 'habits', label: 'Habits & Lifestyle' },
  { key: 'surgeries', label: 'Surgeries' },
  { key: 'health_records', label: 'Health Records' },
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'family_group', label: 'Family Group' },
];

/** Deletion is irreversible, so it uses a longer code than the 4-digit
 * OTP used elsewhere in the app. */
const OTP_LEN = 6;

/** Suggested entry types — the editor always allows a free-text one too. */
const SURGERY_TYPES = [
  'Appendectomy', 'Caesarean Section', 'Cataract Surgery', 'Dental Surgery',
  'Fracture Fixation', 'Gallbladder Removal', 'Hernia Repair', 'Tonsillectomy',
];
const RECORD_TYPES = [
  'Lab Report', 'Diagnosis', 'Vaccination', 'Imaging / Scan', 'Consultation',
  'Discharge Summary', 'Allergy', 'Growth Monitoring',
];
const PRESCRIPTION_TYPES = [
  'Prescription', 'Repeat Prescription', 'Hospital Discharge Medicines',
  'Over-the-counter Advice',
];

export default function ProfileSettingsScreen() {
  const router = useRouter();
  // Whose profile is this? Scoped screens must never render the guardian's data.
  const { scope, enter, exit } = usePatientScope();
  // The picker drives the scope, so switching person here switches it app-wide.
  const people = peopleFor({ includeMinors: true });
  const personId = scope.kind === 'minor' && scope.id ? scope.id : SELF_ID;
  const pickPerson = (id: string) => {
    if (id === SELF_ID) return exit();
    const m = minors.find((x) => x.id === id);
    if (m) enter({ kind: 'minor', id: m.id, name: m.full_name.split(' ')[0], roleName: null });
  };
  const isMinor = scope.kind === 'minor';
  const record = recordFor(scope.kind, scope.id);
  const minor = minors.find((m) => m.id === scope.id);

  const [tab, setTab] = useState('personal');
  // Which group is currently in edit mode, and its working copy.
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  // Edits live in the store, not in state, so they survive leaving the screen
  // and are the same data Health Records reads. `rev` just forces a re-render.
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const values = valuesOf(personId);
  const [addFieldTo, setAddFieldTo] = useState<{ key: string; title: string } | null>(null);
  const [memberEdit, setMemberEdit] = useState<HouseMember | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [otpFor, setOtpFor] = useState<string | null>(null);
  const [verified, setVerified] = useState({
    phone_number: contactVerification.phone_verified,
    email: contactVerification.email_verified,
  });

  const isVerified = (key: string) => verified[key as keyof typeof verified];

  // Account deletion runs warn → OTP → done. Six digits rather than the app's
  // usual four: this action can't be undone, so it gets the stronger code.
  const [deleteStep, setDeleteStep] = useState<'warn' | 'otp' | 'done' | null>(null);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(''));
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const setOtpDigit = (i: number, v: string) => {
    const char = v.replace(/\D/g, '').slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[i] = char;
      return next;
    });
    if (char && i < OTP_LEN - 1) otpRefs.current[i + 1]?.focus();
  };

  const valueOf = (f: ProfileField) => values[f.key] ?? f.value;

  /** A section's own fields plus any the patient added to it. */
  const fieldsOf = (g: { key: string; fields: ProfileField[] }) =>
    [...g.fields, ...extraFields(personId, g.key)];

  const startEdit = (g: { key: string; fields: ProfileField[] }) => {
    const d: Record<string, string> = {};
    fieldsOf(g).forEach((f) => { d[f.key] = valueOf(f); });
    setDraft(d);
    setEditing(g.key);
  };

  const save = () => {
    storeValues(personId, draft);
    setEditing(null);
    bump();
  };

  const groups = record.profileGroups[tab] ?? [];

  /* ── Record lists — shared with Health Records via the store ─────── */
  const entries = (key: ListKey, base: RecordEntry[]) => listFor(personId, key, base);
  const onSaveEntry = (key: ListKey, base: RecordEntry[]) => (e: RecordEntry) => {
    saveEntry(personId, key, base, e); bump();
  };
  const onDeleteEntry = (key: ListKey, base: RecordEntry[]) => (id: string) => {
    deleteEntry(personId, key, base, id); bump();
  };

  // Gender and date of birth drive the Female Health gate, and reflect an
  // unsaved edit so the tab appears as soon as gender is changed.
  const personalFields = record.profileGroups.personal[0].fields;
  const fieldNow = (key: string) => (editing === 'personal_details' ? draft[key] : undefined)
    ?? values[key] ?? personalFields.find((f) => f.key === key)?.value ?? '';
  const gender = fieldNow('gender');
  const dob = fieldNow('dob');
  const visibleTabs = TABS.filter((t) => {
    // A minor has no family group of their own — the web excludes it too.
    if (t.key === 'family_group' && isMinor) return false;
    return !t.femaleOnly || showsFemaleHealth(gender, dob);
  });

  // If the active tab just became hidden (gender changed away from female),
  // fall back to Personal rather than rendering an empty screen.
  useEffect(() => {
    if (!visibleTabs.some((t) => t.key === tab)) setTab('personal');
  }, [visibleTabs, tab]);

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Profile Settings" />

      <PersonSelector label="Profile" people={people} value={personId} onChange={pickPerson} />

      <Card style={styles.identity}>
        <Image source={{ uri: minor?.avatar ?? currentPatient.avatar }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={typography.h3}>{minor?.full_name ?? currentPatient.full_name}</Text>
          <Text style={typography.bodyMuted}>
            {isMinor ? `${minor?.relation} · no login` : currentPatient.email}
          </Text>
        </View>
        <TouchableOpacity style={styles.photoBtn}>
          <Ionicons name="camera-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
      </Card>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabWrap}
        contentContainerStyle={styles.tabRow}
      >
        {visibleTabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => { setTab(t.key); setEditing(null); }}
            style={[styles.tab, tab === t.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Field-based sections ─────────────────────────────────── */}
      {groups.map((g) => {
        const isEditing = editing === g.key;
        return (
          <Card key={g.key} style={styles.group}>
            <View style={styles.groupHeader}>
              <View style={{ flex: 1 }}>
                <Text style={typography.h3}>{g.title}</Text>
                {/* Provenance — who last changed this section, for
                    accountability. Only for your own profile: the audit trail
                    we hold is yours, and stamping a child's freshly created
                    section with someone else's name would be a lie. */}
                {!isMinor && sectionUpdates[g.key] && sectionUpdates[g.key].updated_at !== '—' ? (
                  <Text style={styles.provenance}>
                    Last updated {sectionUpdates[g.key].updated_at} by {sectionUpdates[g.key].updated_by}
                  </Text>
                ) : null}
              </View>
              {isEditing ? (
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={() => setEditing(null)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={save}>
                    <Text style={styles.saveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(g)}>
                  <Ionicons name="create-outline" size={14} color={colors.primary} />
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {fieldsOf(g).map((f) => (
              <View key={f.key} style={styles.fieldRow}>
                <View style={styles.fieldLabelRow}>
                  <Text style={[styles.fieldLabel, { flex: 1 }]}>{f.label}</Text>
                  {/* Only fields the patient added can be removed — the
                      standard ones are what providers expect to find. */}
                  {isEditing && f.key.startsWith('custom-') ? (
                    <TouchableOpacity
                      hitSlop={8}
                      onPress={() => { removeField(personId, g.key, f.key); startEdit(g); bump(); }}
                    >
                      <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                </View>
                {isEditing ? (
                  f.type === 'select' && f.options ? (
                    <DropdownModal
                      value={draft[f.key]}
                      options={f.options.map((o) => ({ label: o, value: o }))}
                      onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
                      title={f.label}
                    />
                  ) : (
                    <TextInput
                      value={draft[f.key]}
                      onChangeText={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
                      style={[styles.input, f.type === 'multiline' && styles.inputMulti]}
                      multiline={f.type === 'multiline'}
                      keyboardType={f.type === 'number' ? 'numeric' : 'default'}
                      placeholder={f.label}
                      placeholderTextColor={colors.textMuted}
                    />
                  )
                ) : (
                  <View style={styles.valueRow}>
                    <Text style={[styles.fieldValue, !valueOf(f) && styles.fieldEmpty]}>
                      {valueOf(f) || 'Not set'}
                    </Text>
                    {/* Only badge "Verified" when the server says so; otherwise
                        offer the verify action rather than implying trust. */}
                    {f.key === 'phone_number' || f.key === 'email' ? (
                      isVerified(f.key) ? (
                        <View style={styles.verifiedChip}>
                          <Ionicons name="checkmark-circle" size={12} color="#2e7d32" />
                          <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                      ) : (
                        <TouchableOpacity style={styles.verifyBtn} onPress={() => setOtpFor(f.key)}>
                          <Text style={styles.verifyText}>Verify</Text>
                        </TouchableOpacity>
                      )
                    ) : null}
                  </View>
                )}
              </View>
            ))}

            {/* Every section can grow a column the standard list doesn't have. */}
            <TouchableOpacity
              style={styles.addFieldBtn}
              onPress={() => setAddFieldTo({ key: g.key, title: g.title })}
            >
              <Ionicons name="add-circle-outline" size={15} color={colors.primary} />
              <Text style={styles.addFieldText}>Add new field</Text>
            </TouchableOpacity>
          </Card>
        );
      })}

      {/* ── Surgeries ────────────────────────────────────────────── */}
      {tab === 'surgeries' ? (
        <EntryList
          title="Surgeries"
          subtitle="Operations and procedures, with discharge summaries."
          emptyText="No surgeries recorded."
          entries={entries('surgeries', record.surgeries)}
          typeOptions={SURGERY_TYPES}
          onSave={onSaveEntry('surgeries', record.surgeries)}
          onDelete={onDeleteEntry('surgeries', record.surgeries)}
        />
      ) : null}

      {/* ── Health Records ───────────────────────────────────────── */}
      {tab === 'health_records' ? (
        <EntryList
          title="Health Records"
          subtitle="Lab reports, diagnoses, vaccinations and scans."
          emptyText="No records yet."
          entries={entries('generalRecords', record.generalRecords)}
          typeOptions={RECORD_TYPES}
          onSave={onSaveEntry('generalRecords', record.generalRecords)}
          onDelete={onDeleteEntry('generalRecords', record.generalRecords)}
        />
      ) : null}

      {/* ── Prescriptions ────────────────────────────────────────── */}
      {tab === 'prescriptions' ? (
        <>
          {/* Written here, by our doctors — read-only, and opening a row goes
              to the full prescription rather than an editor. */}
          <EntryList
            title="Previous prescriptions in this platform"
            subtitle="Issued by doctors you consulted here."
            emptyText="No prescriptions issued here yet."
            readOnly
            filesLabel="meds"
            entries={record.prescriptions.map((p) => ({
              id: p.id,
              record_type: p.doctor_name,
              record_date: p.date,
              details: p.diagnosis,
              attachments: p.medicines.map((m, i) => ({ id: `${p.id}-m${i}`, filename: m.name })),
            }))}
            onPressRow={() => router.push('/more/prescriptions')}
          />

          {/* Brought in from elsewhere — the patient owns these, so they can add,
              edit and attach a scan of the paper slip. */}
          <EntryList
            title="Other prescriptions"
            subtitle="From outside this platform — add a photo or PDF of the slip."
            emptyText="Nothing added yet."
            entries={entries('providerPrescriptions', record.providerPrescriptions)}
            typeOptions={PRESCRIPTION_TYPES}
            onSave={onSaveEntry('providerPrescriptions', record.providerPrescriptions)}
            onDelete={onDeleteEntry('providerPrescriptions', record.providerPrescriptions)}
          />
        </>
      ) : null}

      {/* ── Family Group ─────────────────────────────────────────── */}
      {tab === 'family_group' ? (
        <>
          <Card style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={typography.h3}>{houseGroup.name}</Text>
              <Badge label={`${houseGroup.members.length} members`} tone="primary" />
            </View>
            <Text style={typography.bodyMuted}>
              Share this code so a family member can join your house group.
            </Text>
            <View style={styles.codeRow}>
              <Text style={styles.code}>{houseGroup.invite_code}</Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => setCodeCopied(true)}
              >
                <Ionicons name={codeCopied ? 'checkmark' : 'copy-outline'} size={14} color={colors.white} />
                <Text style={styles.copyText}>{codeCopied ? 'Copied!' : 'Copy code'}</Text>
              </TouchableOpacity>
            </View>
          </Card>

          <View style={styles.addRow}>
            <Text style={[typography.label]}>MEMBERS</Text>
            <TouchableOpacity style={styles.addBtn}>
              <Ionicons name="add" size={14} color={colors.white} />
              <Text style={styles.addText}>Add member</Text>
            </TouchableOpacity>
          </View>

          {houseGroup.members.map((m) => (
            <Card key={m.id} style={styles.memberCard}>
              <Image source={{ uri: m.avatar }} style={styles.memberAvatar} />
              <View style={{ flex: 1 }}>
                <View style={styles.memberTop}>
                  <Text style={typography.h3}>{m.name}</Text>
                  {m.is_head ? <Badge label="Head" tone="success" /> : null}
                </View>
                <Text style={typography.bodyMuted}>{m.relation} · {m.age} yrs</Text>
                <View style={styles.permRow}>
                  {m.permissions.map((p) => (
                    <View key={p} style={styles.permChip}>
                      <Text style={styles.permText}>{p}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <TouchableOpacity onPress={() => setMemberEdit(m)} hitSlop={8}>
                <Ionicons name="create-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </Card>
          ))}
        </>
      ) : null}

      {/* ── Danger zone — always last ────────────────────────────── */}
      <Text style={[typography.label, styles.dangerLabel]}>DANGER ZONE</Text>
      {isMinor ? (
        // Deleting while scoped to a minor would be ambiguous about *whose*
        // account is going, so the option is withheld rather than guessed at.
        <Card style={styles.dangerCard}>
          <Text style={typography.body}>
            You're viewing {minor?.full_name}'s profile. Switch back to your own
            account to manage deletion.
          </Text>
        </Card>
      ) : (
        <Card style={styles.dangerCard}>
          <View style={styles.dangerTop}>
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={[typography.h3, styles.dangerTitle]}>Delete account</Text>
          </View>
          <Text style={typography.bodyMuted}>
            Permanently closes your account and removes your profile, bookings and
            uploaded documents. This can't be undone.
          </Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={() => setDeleteStep('warn')}>
            <Ionicons name="trash-outline" size={15} color={colors.error} />
            <Text style={styles.dangerBtnText}>Delete account</Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* Step 1 — what deletion actually does */}
      <AppModal visible={deleteStep === 'warn'} onClose={() => setDeleteStep(null)} title="Delete account?">
        <ScrollView style={{ maxHeight: 380 }}>
          <Text style={typography.body}>
            This is permanent. Before you continue, here's exactly what happens:
          </Text>

          <Text style={[typography.label, styles.modalLabel]}>WILL BE DELETED</Text>
          {[
            'Your profile and contact details',
            'Upcoming bookings — these are cancelled',
            'Documents you uploaded',
            'Wallet balance and health credits (forfeited)',
          ].map((t) => (
            <View key={t} style={styles.bulletRow}>
              <Ionicons name="close-circle" size={14} color={colors.error} />
              <Text style={[typography.body, { flex: 1 }]}>{t}</Text>
            </View>
          ))}

          <Text style={[typography.label, styles.modalLabel]}>WILL BE KEPT</Text>
          {/* Being straight about this matters — clinical records can't simply
              be erased on request, and a patient deserves to know that upfront. */}
          <View style={styles.bulletRow}>
            <Ionicons name="information-circle" size={14} color={colors.primary} />
            <Text style={[typography.body, { flex: 1 }]}>
              Consultation records and prescriptions are retained for the period
              required by medical record-keeping rules, then deleted.
            </Text>
          </View>

          {minors.length ? (
            <>
              <Text style={[typography.label, styles.modalLabel]}>YOUR DEPENDENTS</Text>
              <View style={styles.bulletRow}>
                <Ionicons name="warning" size={14} color={colors.warningDark} />
                <Text style={[typography.body, { flex: 1 }]}>
                  {minors.length} minor {minors.length === 1 ? 'profile' : 'profiles'} ({minors.map((m) => m.full_name.split(' ')[0]).join(', ')})
                  {' '}are managed by this account. Transfer them to another guardian
                  first, or they'll be closed too.
                </Text>
              </View>
            </>
          ) : null}
        </ScrollView>

        <View style={styles.modalActions}>
          <PrimaryButton label="Keep my account" variant="outline" style={styles.modalBtn} onPress={() => setDeleteStep(null)} />
          <PrimaryButton
            label="Continue"
            style={styles.modalBtn}
            onPress={() => { setOtp(Array(OTP_LEN).fill('')); setDeleteStep('otp'); }}
          />
        </View>
      </AppModal>

      {/* Step 2 — OTP approval */}
      <AppModal visible={deleteStep === 'otp'} onClose={() => setDeleteStep(null)} title="Confirm it's you">
        <Text style={typography.body}>
          We've sent a {OTP_LEN}-digit code to{' '}
          <Text style={styles.bold}>{currentPatient.phone}</Text>. Enter it to
          confirm account deletion.
        </Text>

        <View style={styles.otpRow}>
          {otp.map((d, i) => (
            <TextInput
              key={i}
              ref={(el) => { otpRefs.current[i] = el; }}
              value={d}
              onChangeText={(v) => setOtpDigit(i, v)}
              onKeyPress={(e) => {
                if (e.nativeEvent.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
              }}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              style={[styles.otpBox, d ? styles.otpBoxFilled : null]}
            />
          ))}
        </View>

        <TouchableOpacity>
          <Text style={styles.resend}>Didn't get a code? <Text style={styles.resendLink}>Resend</Text></Text>
        </TouchableOpacity>

        <View style={styles.modalActions}>
          <PrimaryButton label="Cancel" variant="outline" style={styles.modalBtn} onPress={() => setDeleteStep(null)} />
          <PrimaryButton
            label="Delete permanently"
            disabled={otp.some((d) => !d)}
            style={[styles.modalBtn, styles.destructiveBtn]}
            onPress={() => setDeleteStep('done')}
          />
        </View>
      </AppModal>

      {/* Step 3 — done */}
      <AppModal visible={deleteStep === 'done'} onClose={() => setDeleteStep(null)} title="Account deleted">
        <View style={styles.doneWrap}>
          <Ionicons name="checkmark-circle" size={42} color={colors.success} />
          <Text style={[typography.body, styles.doneText]}>
            Your account has been closed. You'll be signed out now.
          </Text>
          <PrimaryButton
            label="Sign out"
            style={styles.doneBtn}
            onPress={() => { setDeleteStep(null); router.replace('/(auth)/signin'); }}
          />
        </View>
      </AppModal>

      {/* Verify phone / email */}
      <AppModal
        visible={!!otpFor}
        onClose={() => setOtpFor(null)}
        title={otpFor === 'phone_number' ? 'Verify phone' : 'Verify email'}
      >
        <Text style={typography.body}>
          We'll send a 4-digit code to your{' '}
          {otpFor === 'phone_number' ? 'mobile number' : 'email address'} to confirm it's yours.
        </Text>
        <View style={styles.modalActions}>
          <PrimaryButton label="Cancel" variant="outline" style={styles.modalBtn} onPress={() => setOtpFor(null)} />
          <PrimaryButton
            label="Send code"
            style={styles.modalBtn}
            onPress={() => {
              if (otpFor) setVerified((v) => ({ ...v, [otpFor]: true }));
              setOtpFor(null);
            }}
          />
        </View>
      </AppModal>

      {/* Add a field to any section */}
      <AddFieldSheet
        visible={!!addFieldTo}
        onClose={() => setAddFieldTo(null)}
        sectionTitle={addFieldTo?.title ?? ''}
        onAdd={(f) => {
          if (!addFieldTo) return;
          addField(personId, addFieldTo.key, f);
          // Keep an open editor in step with the field that just appeared.
          if (editing === addFieldTo.key) setDraft((d) => ({ ...d, [f.key]: f.value }));
          bump();
        }}
      />

      {/* Member permissions editor */}
      <AppModal
        visible={!!memberEdit}
        onClose={() => setMemberEdit(null)}
        title={memberEdit ? `Edit ${memberEdit.name.split(' ')[0]}` : ''}
      >
        {memberEdit ? (
          <>
            <Text style={[typography.label, styles.modalLabel]}>RELATION</Text>
            <DropdownModal
              value={memberEdit.relation}
              options={relationOptions.map((r) => ({ label: r, value: r }))}
              onChange={() => {}}
              title="Relation"
            />

            <Text style={[typography.label, styles.modalLabel]}>WHAT THEY CAN SEE</Text>
            {permissionOptions.map((p) => {
              const on = memberEdit.permissions.includes(p);
              return (
                <View key={p} style={styles.permOptRow}>
                  <Ionicons
                    name={on ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={on ? colors.primary : colors.textMuted}
                  />
                  <Text style={typography.body}>{p}</Text>
                </View>
              );
            })}

            <View style={styles.modalActions}>
              <PrimaryButton label="Remove" variant="outline" style={styles.modalBtn} onPress={() => setMemberEdit(null)} />
              <PrimaryButton label="Save" style={styles.modalBtn} onPress={() => setMemberEdit(null)} />
            </View>
          </>
        ) : null}
      </AppModal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  photoBtn: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  tabWrap: { flexGrow: 0, marginBottom: 16, marginHorizontal: -16 },
  tabRow: { gap: 8, paddingHorizontal: 16 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  group: { marginBottom: 14, gap: 10 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  editActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cancelText: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  saveBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.sm },
  saveText: { fontSize: 12.5, fontWeight: '700', color: colors.white },
  fieldRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldLabel: { fontSize: 11.5, fontWeight: '600', color: colors.textSecondary, marginBottom: 3 },
  addFieldBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 10 },
  addFieldText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  provenance: { fontSize: 10.5, color: colors.textMuted, marginTop: 2 },
  dangerLabel: { marginTop: 10, marginBottom: 8, color: colors.error },
  dangerCard: { borderColor: '#f5c6c2', gap: 10, marginBottom: 8 },
  dangerTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dangerTitle: { color: colors.error },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.error, backgroundColor: colors.surface,
  },
  dangerBtnText: { fontSize: 13, fontWeight: '700', color: colors.error },
  destructiveBtn: { backgroundColor: colors.error },
  bold: { fontWeight: '700', color: colors.textPrimary },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4 },
  otpRow: { flexDirection: 'row', gap: 7, marginTop: 16, marginBottom: 10, justifyContent: 'center' },
  otpBox: {
    width: 44, height: 52, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    textAlign: 'center', fontSize: 20, fontWeight: '700', color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  otpBoxFilled: { borderColor: colors.error, backgroundColor: '#FDECEA' },
  resend: { fontSize: 12.5, color: colors.textSecondary, textAlign: 'center' },
  resendLink: { color: colors.primary, fontWeight: '700' },
  doneWrap: { alignItems: 'center', gap: 10, paddingVertical: 10 },
  doneText: { textAlign: 'center' },
  doneBtn: { alignSelf: 'stretch', marginTop: 8 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  fieldValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  verifiedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#E8F5E9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill,
  },
  verifiedText: { fontSize: 10, fontWeight: '700', color: '#2e7d32' },
  verifyBtn: {
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.warningDark, backgroundColor: colors.warningLight,
  },
  verifyText: { fontSize: 10, fontWeight: '700', color: colors.warningDark },
  fieldEmpty: { fontWeight: '400', color: colors.textMuted, fontStyle: 'italic' },
  input: {
    height: 42, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 11, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.surface,
  },
  inputMulti: { height: 72, textAlignVertical: 'top', paddingTop: 10 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  code: {
    flex: 1, fontSize: 15, fontWeight: '800', color: colors.textPrimary,
    letterSpacing: 1, backgroundColor: colors.background,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.sm, textAlign: 'center',
  },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primary,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.sm,
  },
  copyText: { fontSize: 12, fontWeight: '700', color: colors.white },
  addRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.sm,
  },
  addText: { fontSize: 12, fontWeight: '700', color: colors.white },
  memberCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  memberAvatar: { width: 46, height: 46, borderRadius: 23 },
  memberTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  permRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  permChip: { backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  permText: { fontSize: 10, fontWeight: '600', color: colors.textSecondary },
  modalLabel: { marginTop: 14, marginBottom: 6 },
  permOptRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 6 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalBtn: { flex: 1 },
});
