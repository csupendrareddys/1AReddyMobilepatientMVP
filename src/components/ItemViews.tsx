import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import Badge from './Badge';
import TwoRowSlider, { SliderCard } from './TwoRowSlider';
import { ViewMode4 } from './ViewSwitcher';
import { inr } from '../data/checkout';
import { colors, radius, typography } from '../theme/theme';

/**
 * Renders one list of things in whichever of the four views is selected.
 *
 * Product catalogues, category listings and booking lists all want the same
 * four shapes, so they share this renderer rather than each growing their own —
 * which is what kept the old screens drifting apart.
 */

export type ViewItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  /** Right-hand chip: the product type, the booking status. */
  badge?: string;
  /** Small tinted line: why it's here, or whose it is. */
  note?: string;
  noteIcon?: keyof typeof Ionicons.glyphMap;
  /**
   * Colour for the note. Defaults to the product's tint, but a status note
   * needs a status colour — "waiting for provider" rendered in a plan's green
   * reads as success, which is the opposite of what it means.
   */
  noteTint?: string;
  price?: number | null;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  /** What this booking lets you do right now, shown as small glyphs. */
  caps?: { chat?: boolean; voice?: boolean; video?: boolean; files?: boolean };
  /** Marks the row as chosen on screens where the list is a picker. */
  selected?: boolean;
  /**
   * A row-level action, e.g. "Give records access". Rendered as its own
   * button so it works without opening the row; slide mode folds it into the
   * note instead, because a slider card has no room for two touch targets.
   */
  action?: { label: string; icon?: keyof typeof Ionicons.glyphMap };
};

type Props = {
  items: ViewItem[];
  mode: ViewMode4;
  onPress: (id: string) => void;
  /** Fired when a row's `action` button is pressed. */
  onAction?: (id: string) => void;
  intervalSec?: number;
  /** Column header over the second table column. */
  tableTypeLabel?: string;
  /** Show a price column / figure. */
  showPrice?: boolean;
};

export default function ItemViews({
  items, mode, onPress, onAction, intervalSec = 0, tableTypeLabel = 'Type', showPrice = true,
}: Props) {
  const toCard = (r: ViewItem): SliderCard => ({
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    meta: showPrice && r.price != null
      ? `${r.price === 0 ? 'Free' : inr(r.price)}${r.meta ? ` · ${r.meta}` : ''}`
      : r.meta,
    badge: r.note ?? r.action?.label ?? r.badge,
    icon: r.icon,
    tint: r.tint,
  });

  const priceText = (r: ViewItem) =>
    (r.price == null ? '' : r.price === 0 ? 'Free' : inr(r.price));

  // Showing the capabilities on the row means a patient doesn't have to open
  // a booking to learn whether it includes messaging or calls.
  const caps = (r: ViewItem) => {
    const c = r.caps;
    if (!c || !(c.chat || c.voice || c.video || c.files)) return null;
    return (
      <View style={styles.capRow}>
        {c.video ? <Ionicons name="videocam-outline" size={12} color={r.tint} /> : null}
        {c.voice ? <Ionicons name="call-outline" size={12} color={r.tint} /> : null}
        {c.chat ? <Ionicons name="chatbubble-outline" size={12} color={r.tint} /> : null}
        {c.files ? <Ionicons name="document-attach-outline" size={12} color={r.tint} /> : null}
      </View>
    );
  };

  const actionBtn = (r: ViewItem) => (r.action && onAction ? (
    <TouchableOpacity
      style={styles.actionBtn}
      activeOpacity={0.8}
      onPress={() => onAction(r.id)}
    >
      <Ionicons name={r.action.icon ?? 'shield-outline'} size={12} color={colors.primary} />
      <Text style={styles.actionText}>{r.action.label}</Text>
    </TouchableOpacity>
  ) : null);

  const note = (r: ViewItem) => (r.note ? (
    <View style={styles.noteRow}>
      <Ionicons name={r.noteIcon ?? 'sparkles-outline'} size={10} color={r.noteTint ?? r.tint} />
      <Text style={[styles.noteText, { color: r.noteTint ?? r.tint }]} numberOfLines={1}>
        {r.note}
      </Text>
    </View>
  ) : null);

  if (mode === 'slide') {
    return (
      <TwoRowSlider
        items={items.map(toCard)}
        intervalSec={intervalSec}
        onPress={onPress}
      />
    );
  }

  if (mode === 'grid') {
    return (
      <View style={styles.grid}>
        {items.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[
              styles.gridCard,
              r.selected && { borderColor: r.tint, borderWidth: 2, backgroundColor: `${r.tint}0F` },
            ]}
            activeOpacity={0.85}
            onPress={() => onPress(r.id)}
          >
            <View style={styles.gridTop}>
              <View style={[styles.icon, { backgroundColor: `${r.tint}1A` }]}>
                <Ionicons name={r.icon} size={18} color={r.tint} />
              </View>
              {r.selected ? (
                <Ionicons name="checkmark-circle" size={20} color={r.tint} />
              ) : null}
            </View>
            <Text style={styles.gridTitle} numberOfLines={3}>{r.title}</Text>
            {r.subtitle ? (
              <Text style={typography.caption} numberOfLines={1}>{r.subtitle}</Text>
            ) : null}
            {note(r)}
            {caps(r)}
            {showPrice && r.price != null ? (
              <Text style={[styles.price, { color: r.tint }]}>{priceText(r)}</Text>
            ) : null}
            {actionBtn(r)}
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  if (mode === 'table') {
    return (
      <Card style={styles.tableCard}>
        <View style={styles.thead}>
          <Text style={[styles.th, styles.colName]}>Name</Text>
          <Text style={[styles.th, styles.colKind]}>{tableTypeLabel}</Text>
          {showPrice ? <Text style={[styles.th, styles.colPrice]}>Price</Text> : null}
        </View>
        {items.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[styles.tr, r.selected && { backgroundColor: `${r.tint}12` }]}
            onPress={() => onPress(r.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={r.selected ? 'checkmark-circle' : r.icon}
              size={14}
              color={r.tint}
            />
            <View style={styles.colName}>
              <Text style={styles.tdStrong} numberOfLines={1}>{r.title}</Text>
              <Text style={styles.tdSub} numberOfLines={1}>
                {r.subtitle ?? r.meta ?? ''}
              </Text>
              {actionBtn(r)}
            </View>
            <Text style={[styles.td, styles.colKind]} numberOfLines={2}>{r.badge ?? ''}</Text>
            {showPrice ? (
              <Text style={[styles.tdStrong, styles.colPrice]} numberOfLines={1}>{priceText(r)}</Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </Card>
    );
  }

  // ── List ──────────────────────────────────────────────────────────────
  return (
    <View>
      {items.map((r) => (
        <TouchableOpacity key={r.id} activeOpacity={0.85} onPress={() => onPress(r.id)}>
          <Card style={[
            styles.listRow,
            r.selected && { borderColor: r.tint, borderWidth: 2 },
          ]}>
            <View style={[styles.icon, { backgroundColor: `${r.tint}1A` }]}>
              <Ionicons name={r.icon} size={19} color={r.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.h3} numberOfLines={2}>{r.title}</Text>
              {r.subtitle ? (
                <Text style={typography.bodyMuted} numberOfLines={2}>{r.subtitle}</Text>
              ) : null}
              {r.meta ? <Text style={typography.caption} numberOfLines={1}>{r.meta}</Text> : null}
              {note(r)}
              {caps(r)}
              {actionBtn(r)}
            </View>
            <View style={styles.listRight}>
              {showPrice && r.price != null ? (
                <Text style={styles.price}>{priceText(r)}</Text>
              ) : null}
              {r.badge ? <Badge label={r.badge} tone="neutral" /> : null}
              <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  capRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 },
  noteText: { fontSize: 10.5, fontWeight: '700', flexShrink: 1 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    marginTop: 7, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.primary, backgroundColor: '#F4F8FE',
  },
  actionText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  price: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },

  listRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 10 },
  listRight: { alignItems: 'flex-end', gap: 6 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: {
    width: '47.5%', gap: 4, padding: 12, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  gridTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gridTitle: { fontSize: 12.5, fontWeight: '700', color: colors.textPrimary, marginTop: 4, lineHeight: 17 },

  tableCard: { padding: 0, overflow: 'hidden' },
  thead: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 13, paddingVertical: 9, backgroundColor: colors.background,
  },
  th: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  tr: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 13, paddingVertical: 11,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  td: { fontSize: 11.5, color: colors.textSecondary },
  tdStrong: { fontSize: 12.5, fontWeight: '700', color: colors.textPrimary },
  tdSub: { fontSize: 10.5, color: colors.textMuted, marginTop: 1 },
  colName: { flex: 2.3 },
  colKind: { flex: 1.1 },
  colPrice: { width: 62, textAlign: 'right' },
});
