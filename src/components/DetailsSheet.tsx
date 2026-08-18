import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppModal from './AppModal';
import PrimaryButton from './PrimaryButton';
import { colors, radius, typography } from '../theme/theme';

/**
 * "View details" — a table now, the long read on request.
 *
 * Two levels on purpose. Choosing between plans or teams is a comparison job,
 * and comparison needs short rows you can scan side by side; the paragraph
 * explaining how a team works matters only once you're down to one candidate.
 * Putting both on screen at once makes the comparison harder, not easier.
 */
export default function DetailsSheet({
  visible, onClose, title, subtitle, rows, about, moreLabel = 'More about this',
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  rows: { label: string; value: string }[];
  about: string;
  moreLabel?: string;
  /** An action under the table, e.g. "Choose this team". */
  footer?: { label: string; onPress: () => void };
}) {
  const [expanded, setExpanded] = useState(false);

  // Always open on the table — the long read is opt-in every time.
  useEffect(() => { if (visible) setExpanded(false); }, [visible]);

  return (
    <AppModal visible={visible} onClose={onClose} title={title}>
      {subtitle ? <Text style={typography.bodyMuted}>{subtitle}</Text> : null}

      <ScrollView style={styles.scroll}>
        <View style={styles.table}>
          {rows.map((r) => (
            <View key={r.label} style={styles.row}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowValue}>{r.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.moreBtn} onPress={() => setExpanded((v) => !v)}>
          <Ionicons
            name={expanded ? 'chevron-up-circle-outline' : 'information-circle-outline'}
            size={16}
            color={colors.primary}
          />
          <Text style={styles.moreText}>{expanded ? 'Show less' : moreLabel}</Text>
        </TouchableOpacity>

        {expanded ? <Text style={[typography.body, styles.about]}>{about}</Text> : null}
      </ScrollView>

      {footer ? (
        <PrimaryButton label={footer.label} style={styles.footerBtn} onPress={footer.onPress} />
      ) : null}
      <PrimaryButton label="Close" variant="outline" style={styles.closeBtn} onPress={onClose} />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 400, marginTop: 12 },
  table: {
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 10, paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  rowLabel: { flex: 1, fontSize: 12, color: colors.textSecondary },
  rowValue: { flex: 1.3, fontSize: 12.5, fontWeight: '600', color: colors.textPrimary, textAlign: 'right' },
  moreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12 },
  moreText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  about: { lineHeight: 20, marginBottom: 6 },
  footerBtn: { marginTop: 14 },
  closeBtn: { marginTop: 10 },
});
