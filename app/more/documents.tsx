import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import AppModal from '../../src/components/AppModal';
import ViewToggle, { ViewMode } from '../../src/components/ViewToggle';
import AttachSheet from '../../src/components/AttachSheet';
import { documents, minors, PatientDocument } from '../../src/data/mock';
import { usePatientScope } from '../../src/scope/PatientScope';
import PersonSelector from '../../src/components/PersonSelector';
import DateFilterBar from '../../src/components/DateFilterBar';
import EmptyState from '../../src/components/EmptyState';
import {
  applyDateFilter, DatePeriod, DateRange, emptyRange, periodCounts,
} from '../../src/data/dateFilter';
import { peopleFor, SELF_ID } from '../../src/data/people';
import { colors, radius, typography } from '../../src/theme/theme';

const ext = (name: string) => name.split('.').pop()?.toUpperCase() ?? 'FILE';

const iconFor = (name: string): keyof typeof Ionicons.glyphMap => {
  const e = ext(name);
  if (['JPG', 'JPEG', 'PNG'].includes(e)) return 'image-outline';
  if (e === 'PDF') return 'document-text-outline';
  return 'document-outline';
};

export default function DocumentsScreen() {
  const { scope, enter, exit } = usePatientScope();
  const people = peopleFor({ includeMinors: true, includeLinked: true, module: 'documents' });
  const personId = scope.kind !== 'self' && scope.id ? scope.id : SELF_ID;
  const pickPerson = (id: string) => {
    if (id === SELF_ID) return exit();
    const m = minors.find((x) => x.id === id);
    if (m) enter({ kind: 'minor', id: m.id, name: m.full_name.split(' ')[0], roleName: null });
  };

  const [mode, setMode] = useState<ViewMode>('table');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [added, setAdded] = useState<PatientDocument[]>([]);
  const [detail, setDetail] = useState<PatientDocument | null>(null);
  const [period, setPeriod] = useState<DatePeriod>('all');
  const [range, setRange] = useState<DateRange>(emptyRange());

  const dateOf = (d: PatientDocument) => d.uploaded_date;
  const all = [...added, ...documents];
  const counts = periodCounts(all, dateOf, range);
  const shown = applyDateFilter(all, dateOf, period, range);

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader
        title="Documents"
        right={(
          <View style={styles.headerRight}>
            <ViewToggle mode={mode} onChange={setMode} />
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={() => setUploadOpen(true)}
              accessibilityLabel="Upload a document"
            >
              <Ionicons name="cloud-upload-outline" size={15} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
      />
      <PersonSelector people={people} value={personId} onChange={pickPerson} />
      <Text style={[typography.bodyMuted, styles.intro]}>
        Tap any document to see its details.
      </Text>

      <AttachSheet
        visible={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onPick={(file, note) => {
          setAdded((d) => [{
            id: `local-${d.length}`,
            name: file,
            category: note || 'Uploaded',
            uploaded_date: 'Just now',
            size: '—',
          }, ...d]);
          setUploadOpen(false);
        }}
      />

      <DateFilterBar
        period={period}
        onPeriod={setPeriod}
        range={range}
        onRange={setRange}
        counts={counts}
      />

      {!shown.length ? (
        <EmptyState
          icon="folder-open-outline"
          title="Nothing in this period"
          subtitle="Try another head above, or widen the date range."
        />
      ) : mode === 'table' ? (
        <Card style={styles.tableCard}>
          <View style={styles.thead}>
            <Text style={[styles.th, styles.colName]}>Name</Text>
            <Text style={[styles.th, styles.colCat]}>Category</Text>
            <Text style={[styles.th, styles.colSize]}>Size</Text>
          </View>
          {shown.map((d) => (
            <TouchableOpacity key={d.id} style={styles.tr} onPress={() => setDetail(d)} activeOpacity={0.7}>
              <View style={[styles.colName, styles.nameCell]}>
                <Ionicons name={iconFor(d.name)} size={16} color={colors.warningDark} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tdStrong} numberOfLines={1}>{d.name}</Text>
                  <Text style={styles.tdSub}>{d.uploaded_date}</Text>
                </View>
              </View>
              <Text style={[styles.td, styles.colCat]} numberOfLines={1}>{d.category}</Text>
              <Text style={[styles.td, styles.colSize]}>{d.size}</Text>
              <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </Card>
      ) : (
        <View style={styles.grid}>
          {shown.map((d) => (
            <TouchableOpacity key={d.id} style={styles.gridCard} onPress={() => setDetail(d)} activeOpacity={0.85}>
              <View style={styles.thumb}>
                <Ionicons name={iconFor(d.name)} size={28} color={colors.warningDark} />
                <View style={styles.extBadge}><Text style={styles.extText}>{ext(d.name)}</Text></View>
              </View>
              <Text style={styles.gridName} numberOfLines={2}>{d.name}</Text>
              <Text style={typography.caption}>{d.size} · {d.uploaded_date}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Full document detail */}
      <AppModal visible={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ''}>
        {detail ? (
          <>
            <View style={styles.previewBox}>
              <Ionicons name={iconFor(detail.name)} size={44} color={colors.warningDark} />
              <Text style={styles.previewExt}>{ext(detail.name)} document</Text>
            </View>

            <DetailRow label="File name" value={detail.name} />
            <DetailRow label="Category" value={detail.category} />
            <DetailRow label="Uploaded" value={detail.uploaded_date} />
            <DetailRow label="Size" value={detail.size} />
            <View style={styles.badgeRow}>
              <Badge label={ext(detail.name)} tone="warning" />
              <Badge label={detail.category} tone="neutral" />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="eye-outline" size={16} color={colors.primary} />
                <Text style={styles.actionText}>Preview</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="download-outline" size={16} color={colors.primary} />
                <Text style={styles.actionText}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="share-outline" size={16} color={colors.primary} />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </AppModal>
    </ScreenWrapper>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={typography.bodyMuted}>{label}</Text>
      <Text style={[typography.body, styles.detailValue]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uploadBtn: { backgroundColor: colors.primary, padding: 9, borderRadius: radius.sm },
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
  nameCell: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  td: { fontSize: 12.5, color: colors.textSecondary },
  tdStrong: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  tdSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  colName: { flex: 2.6 },
  colCat: { flex: 1.3 },
  colSize: { width: 54 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: {
    width: '47%', padding: 12, gap: 4, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  thumb: {
    height: 84, borderRadius: radius.sm, backgroundColor: colors.warningLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  extBadge: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: colors.warningDark, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  extText: { fontSize: 9, fontWeight: '800', color: colors.white },
  gridName: { fontSize: 12.5, fontWeight: '600', color: colors.textPrimary, minHeight: 32 },
  previewBox: {
    height: 130, borderRadius: radius.md, backgroundColor: colors.warningLight,
    alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16,
  },
  previewExt: { fontSize: 12, fontWeight: '700', color: colors.warningDark },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 6 },
  detailValue: { fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 18 },
  actionBtn: {
    flex: 1, alignItems: 'center', gap: 4, paddingVertical: 11, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  actionText: { fontSize: 12, fontWeight: '600', color: colors.primary },
});
