import React, { useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { shareSections } from '../data/shareSections';
import { colors, radius, typography } from '../theme/theme';

/**
 * What the provider can see of this patient's health record, on a booking.
 *
 * The booking flow asks "share my records?" and then the answer disappears into
 * a Yes. A patient looking at the booking a week later has no way to check what
 * Yes covered — which is precisely the thing worth being able to check. So the
 * same five sections are listed here, from the same source as the flow.
 *
 * It stays switchable: consent given before a consultation is consent that can
 * be withdrawn after it.
 */
export default function SharedRecordsPanel({
  scopeKind = 'self', scopeId = null, patientName, shared, onChangeShared,
}: {
  scopeKind?: string;
  scopeId?: string | null;
  patientName: string;
  shared: boolean;
  /** Omit to render as a read-only record of what was shared. */
  onChangeShared?: (next: boolean) => void;
}) {
  const sections = shareSections(scopeKind, scopeId);
  const total = sections.reduce((n, s) => n + s.rows.length, 0);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // "You's profile" is the kind of thing that makes an app feel unfinished.
  const whose = /^(you|yourself)$/i.test(patientName.trim())
    ? 'your' : `${patientName}'s`;

  return (
    <>
      <Card style={[styles.gate, shared && styles.gateOn]}>
        <View style={styles.gateRow}>
          <View style={[styles.gateIcon, shared && styles.gateIconOn]}>
            <Ionicons
              name={shared ? 'shield-checkmark' : 'shield-outline'}
              size={18}
              color={shared ? colors.white : colors.textMuted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>
              {shared ? 'Shared with your provider' : 'Records not shared'}
            </Text>
            <Text style={typography.bodyMuted}>
              {shared
                ? `${total} item${total === 1 ? '' : 's'} from ${whose} profile settings`
                : `Nothing from ${whose} health record was sent with this booking.`}
            </Text>
          </View>
          {onChangeShared ? (
            <Switch
              value={shared}
              onValueChange={onChangeShared}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          ) : null}
        </View>
      </Card>

      {shared ? sections.map((s) => {
        const expanded = open[s.key];
        return (
          <Card key={s.key} style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHead}
              activeOpacity={0.7}
              onPress={() => setOpen((o) => ({ ...o, [s.key]: !o[s.key] }))}
            >
              <View style={[styles.sectionIcon, { backgroundColor: `${s.tint}1A` }]}>
                <Ionicons name={s.icon} size={16} color={s.tint} />
              </View>
              <Text style={[typography.h3, { flex: 1 }]}>{s.title}</Text>
              <View style={styles.countChip}>
                <Text style={styles.countText}>{s.rows.length}</Text>
              </View>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {expanded ? (
              s.rows.length ? s.rows.map((r) => (
                <View key={r.id} style={styles.itemRow}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemLabel} numberOfLines={1}>{r.label}</Text>
                    <Text style={styles.itemSub} numberOfLines={2}>{r.sub}</Text>
                  </View>
                  {r.files ? (
                    <View style={styles.fileBadge}>
                      <Ionicons name="attach" size={11} color={colors.primary} />
                      <Text style={styles.fileBadgeText}>{r.files}</Text>
                    </View>
                  ) : null}
                </View>
              )) : (
                <Text style={[typography.bodyMuted, styles.empty]}>Nothing recorded yet.</Text>
              )
            ) : null}
          </Card>
        );
      }) : null}
    </>
  );
}

const styles = StyleSheet.create({
  gate: { gap: 10, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  gateOn: { borderColor: colors.primary },
  gateRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  gateIcon: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background,
  },
  gateIconOn: { backgroundColor: colors.primary },
  section: { marginBottom: 8, gap: 2 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sectionIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  countChip: {
    minWidth: 21, paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill,
    backgroundColor: colors.background, alignItems: 'center',
  },
  countText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  itemLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  itemSub: { fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
  fileBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: '#E8F1FC',
  },
  fileBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  empty: { paddingVertical: 8 },
});
