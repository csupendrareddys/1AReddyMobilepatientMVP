import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import AppModal from '../../src/components/AppModal';
import ViewToggle, { ViewMode } from '../../src/components/ViewToggle';
import { minors, PrescriptionItem } from '../../src/data/mock';
import { usePatientScope } from '../../src/scope/PatientScope';
import { recordFor } from '../../src/data/minorData';
import PersonSelector from '../../src/components/PersonSelector';
import DateFilterBar from '../../src/components/DateFilterBar';
import EmptyState from '../../src/components/EmptyState';
import {
  applyDateFilter, DatePeriod, DateRange, emptyRange, periodCounts,
} from '../../src/data/dateFilter';
import { peopleFor, SELF_ID } from '../../src/data/people';
import { colors, radius, typography } from '../../src/theme/theme';

export default function PrescriptionsScreen() {
  const { scope, enter, exit } = usePatientScope();
  const people = peopleFor({ includeMinors: true, includeLinked: true, module: 'prescriptions' });
  const personId = scope.kind !== 'self' && scope.id ? scope.id : SELF_ID;
  const pickPerson = (id: string) => {
    if (id === SELF_ID) return exit();
    const m = minors.find((x) => x.id === id);
    if (m) enter({ kind: 'minor', id: m.id, name: m.full_name.split(' ')[0], roleName: null });
  };
  const all = recordFor(scope.kind, scope.id).prescriptions;

  const [mode, setMode] = useState<ViewMode>('table');
  const [detail, setDetail] = useState<PrescriptionItem | null>(null);
  const [period, setPeriod] = useState<DatePeriod>('all');
  const [range, setRange] = useState<DateRange>(emptyRange());

  const dateOf = (p: PrescriptionItem) => p.date;
  const counts = periodCounts(all, dateOf, range);
  const prescriptions = applyDateFilter(all, dateOf, period, range);

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Prescriptions" right={<ViewToggle mode={mode} onChange={setMode} />} />
      <PersonSelector people={people} value={personId} onChange={pickPerson} />
      <Text style={[typography.bodyMuted, styles.intro]}>
        Tap any prescription to see the full details.
      </Text>

      <DateFilterBar
        period={period}
        onPeriod={setPeriod}
        range={range}
        onRange={setRange}
        counts={counts}
      />

      {!prescriptions.length ? (
        <EmptyState
          icon="document-text-outline"
          title="Nothing in this period"
          subtitle="Try another head above, or widen the date range."
        />
      ) : mode === 'table' ? (
        <Card style={styles.tableCard}>
          <View style={styles.thead}>
            <Text style={[styles.th, styles.colDoctor]}>Doctor</Text>
            <Text style={[styles.th, styles.colDate]}>Date</Text>
            <Text style={[styles.th, styles.colMeds]}>Meds</Text>
          </View>
          {prescriptions.map((p) => (
            <TouchableOpacity key={p.id} style={styles.tr} onPress={() => setDetail(p)} activeOpacity={0.7}>
              <View style={styles.colDoctor}>
                <Text style={styles.tdStrong} numberOfLines={1}>{p.doctor_name}</Text>
                <Text style={styles.tdSub} numberOfLines={1}>{p.diagnosis}</Text>
              </View>
              <Text style={[styles.td, styles.colDate]}>{p.date}</Text>
              <View style={styles.colMeds}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{p.medicines.length}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </Card>
      ) : (
        <View style={styles.grid}>
          {prescriptions.map((p) => (
            <TouchableOpacity key={p.id} style={styles.gridCard} onPress={() => setDetail(p)} activeOpacity={0.85}>
              <View style={styles.rxBadge}><Text style={styles.rxText}>℞</Text></View>
              <Text style={styles.gridName} numberOfLines={2}>{p.doctor_name}</Text>
              <Text style={typography.caption}>{p.date}</Text>
              <Text style={styles.gridDiagnosis} numberOfLines={2}>{p.diagnosis}</Text>
              <View style={styles.gridMeta}>
                <Ionicons name="medkit-outline" size={12} color={colors.textMuted} />
                <Text style={styles.gridMetaText}>
                  {p.medicines.length} {p.medicines.length === 1 ? 'medicine' : 'medicines'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Full prescription */}
      <AppModal visible={!!detail} onClose={() => setDetail(null)} title="Prescription">
        {detail ? (
          <ScrollView style={styles.detailScroll}>
            <Text style={typography.bodyMuted}>By {detail.doctor_name} · {detail.date}</Text>

            <Text style={[typography.label, styles.label]}>DIAGNOSIS</Text>
            <Text style={typography.body}>{detail.diagnosis}</Text>

            <Text style={[typography.label, styles.label]}>MEDICINES</Text>
            {detail.medicines.map((m, i) => (
              <View key={i} style={styles.medRow}>
                <View style={styles.dot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.medName}>{m.name}</Text>
                  <Text style={typography.bodyMuted}>
                    {m.dosage} · {m.duration}{m.instructions ? ` · ${m.instructions}` : ''}
                  </Text>
                </View>
              </View>
            ))}

            {detail.lab_tests.length ? (
              <>
                <Text style={[typography.label, styles.label]}>LAB TESTS</Text>
                <View style={styles.testRow}>
                  {detail.lab_tests.map((t) => (
                    <View key={t} style={styles.testChip}>
                      <Ionicons name="flask-outline" size={12} color={colors.secondaryDark} />
                      <Text style={styles.testText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {detail.advice ? (
              <>
                <Text style={[typography.label, styles.label]}>ADVICE</Text>
                <Text style={typography.body}>{detail.advice}</Text>
              </>
            ) : null}

            {detail.follow_up ? (
              <View style={styles.followUp}>
                <Ionicons name="calendar-outline" size={14} color={colors.warningDark} />
                <Text style={styles.followUpText}>Follow-up on {detail.follow_up}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.pdfRow}>
              <Ionicons name="download-outline" size={16} color={colors.primary} />
              <Text style={styles.pdfText}>Download PDF</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : null}
      </AppModal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 14 },
  tableCard: { padding: 0, overflow: 'hidden' },
  thead: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.background,
  },
  th: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  tr: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  td: { fontSize: 12.5, color: colors.textSecondary },
  tdStrong: { fontSize: 13.5, fontWeight: '600', color: colors.textPrimary },
  tdSub: { fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
  colDoctor: { flex: 2.4 },
  colDate: { flex: 1.3 },
  colMeds: { width: 38, alignItems: 'flex-start' },
  pill: { minWidth: 22, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: '#E8F1FC' },
  pillText: { fontSize: 11, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: {
    width: '47%', padding: 14, gap: 4, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  rxBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E8F1FC', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  rxText: { fontSize: 15, fontWeight: '800', color: colors.primary },
  gridName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  gridDiagnosis: { fontSize: 11.5, color: colors.textSecondary, marginTop: 2, minHeight: 30 },
  gridMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  gridMetaText: { fontSize: 11, color: colors.textMuted },
  detailScroll: { maxHeight: 430 },
  label: { marginTop: 14, marginBottom: 6 },
  medRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 6 },
  medName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  testRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  testChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#E3F5F3', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill,
  },
  testText: { fontSize: 11.5, fontWeight: '600', color: colors.secondaryDark },
  followUp: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.warningLight, borderRadius: radius.sm, padding: 10, marginTop: 16,
  },
  followUpText: { fontSize: 12.5, fontWeight: '600', color: colors.warningDark },
  pdfRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  pdfText: { fontSize: 13, fontWeight: '700', color: colors.primary },
});
