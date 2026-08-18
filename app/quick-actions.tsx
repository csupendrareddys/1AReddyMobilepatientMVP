import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../src/components/ScreenWrapper';
import ScreenHeader from '../src/components/ScreenHeader';
import Card from '../src/components/Card';
import PrimaryButton from '../src/components/PrimaryButton';
import PersonSelector from '../src/components/PersonSelector';
import ViewSwitcher, { ViewMode4 } from '../src/components/ViewSwitcher';
import ItemViews from '../src/components/ItemViews';
import { findPerson, peopleFor, SELF_ID } from '../src/data/people';
import { productCategories } from '../src/data/mock';
import { colors, radius, typography } from '../src/theme/theme';

/**
 * Every booking mode on one page, as a form rather than a shelf.
 *
 * The dashboard slider is for glancing; this is for deciding. Pick who it's
 * for and what kind of care, then continue — so someone who knows exactly what
 * they want doesn't have to swipe a carousel to find it.
 */
export default function QuickActionsScreen() {
  const router = useRouter();
  const people = peopleFor({ includeMinors: true, includeLinked: true, module: 'appt_booking', verb: 'manage' });
  const [personId, setPersonId] = useState(SELF_ID);
  const patient = findPerson(people, personId);
  const [picked, setPicked] = useState<string | null>(null);
  // Grid by default: eight categories fit on one screen as tiles, so the
  // choice can be made without scrolling. All four views stay available.
  const [mode, setMode] = useState<ViewMode4>('grid');

  const chosen = productCategories.find((c) => c.key === picked) ?? null;

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Book care" fallback="/(tabs)" />
      <Text style={[typography.bodyMuted, styles.intro]}>
        Choose who this is for and the kind of care you need. You can change
        either at any point before paying.
      </Text>

      <Text style={styles.label}>Who is this for?</Text>
      <PersonSelector people={people} value={personId} onChange={setPersonId} />

      <View style={styles.careHead}>
        <Text style={[styles.label, styles.careLabel]}>What kind of care?</Text>
        <ViewSwitcher
          inline
          mode={mode}
          onChange={setMode}
          hint={picked ? '1 selected' : undefined}
        />
      </View>

      {/* The list view keeps the radio affordance because that's what the
          picking is for; the other three are for scanning what's on offer. */}
      {mode === 'list' ? productCategories.map((c) => {
        const active = picked === c.key;
        return (
          <TouchableOpacity
            key={c.key}
            activeOpacity={0.85}
            onPress={() => setPicked(active ? null : c.key)}
            style={[styles.row, active && styles.rowActive]}
          >
            <View style={[styles.icon, { backgroundColor: `${c.tint}1A` }]}>
              <Ionicons name={c.icon} size={19} color={c.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>{c.name}</Text>
              <Text style={typography.bodyMuted} numberOfLines={2}>{c.tagline}</Text>
              <Text style={typography.caption}>
                {c.items.length} {c.items.length === 1 ? 'option' : 'options'}
              </Text>
            </View>
            <View style={[styles.radio, active && styles.radioActive]}>
              {active ? <View style={styles.radioDot} /> : null}
            </View>
          </TouchableOpacity>
        );
      }) : (
        <ItemViews
          mode={mode}
          intervalSec={16}
          showPrice={false}
          tableTypeLabel="Options"
          items={productCategories.map((c) => ({
            id: c.key,
            title: c.name,
            subtitle: c.tagline,
            badge: `${c.items.length} options`,
            selected: picked === c.key,
            price: null,
            icon: c.icon,
            tint: c.tint,
          }))}
          onPress={(key) => setPicked(picked === key ? null : key)}
        />
      )}

      {chosen ? (
        <Card style={styles.summary}>
          <Text style={typography.bodyMuted}>You&apos;re booking</Text>
          <Text style={typography.h3}>{chosen.name}</Text>
          <Text style={typography.bodyMuted}>for {patient.name}</Text>
        </Card>
      ) : null}

      <PrimaryButton
        label={chosen ? `See ${chosen.name} options` : 'Pick a kind of care'}
        disabled={!chosen}
        style={styles.cta}
        onPress={() => chosen && router.push(`/category/${chosen.key}`)}
      />

      {/* Anyone who'd rather not choose from a list can hand it to the agent. */}
      <TouchableOpacity style={styles.agentRow} onPress={() => router.push('/agent')}>
        <Ionicons name="sparkles" size={15} color={colors.primary} />
        <Text style={styles.agentText}>Not sure? Let the agent work it out with you</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 18 },
  label: { ...typography.label, marginTop: 18, marginBottom: 10 },
  careHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  careLabel: { flex: 1, marginTop: 0, marginBottom: 0 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, marginBottom: 9,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  rowActive: { borderColor: colors.primary, borderWidth: 2 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  summary: { marginTop: 16, gap: 2 },
  cta: { marginTop: 18 },
  agentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 18 },
  agentText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
});
