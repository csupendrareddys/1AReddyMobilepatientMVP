import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppModal from './AppModal';
import PrimaryButton from './PrimaryButton';
import {
  activeCount, emptyFilters, FILTER_GROUPS, FilterOption, FilterState,
} from '../data/filters';
import { colors, radius } from '../theme/theme';

/**
 * The filters every listing shares — symptoms, specialisation, gender, organ —
 * laid out as two-row icon tables that scroll sideways.
 *
 * Everything is visible and one tap deep: no sheet between the patient and
 * "cough", because a filter that hides its options behind a modal gets used
 * once and forgotten. Tiles toggle in place; tapping again clears them.
 */
export default function FilterBar({
  value, onChange, showGender = true, resultCount, dropdownGroups = [], hideGroups = [],
}: {
  value: FilterState;
  onChange: (f: FilterState) => void;
  /** Off for lists of places — a hospital has no gender. */
  showGender?: boolean;
  /** Shown beside Clear so filtering visibly does something. */
  resultCount?: number;
  /**
   * Groups to render as a compact dropdown box instead of an icon table.
   * The long taxonomies (symptoms, organs) can dominate a short page; a
   * dropdown keeps them available without pushing the results below the fold.
   */
  dropdownGroups?: (keyof FilterState)[];
  /** Groups to leave out entirely on pages where they don't apply. */
  hideGroups?: (keyof FilterState)[];
}) {
  const [openDrop, setOpenDrop] = useState<keyof FilterState | null>(null);
  const groups = FILTER_GROUPS
    .filter((g) => showGender || g.key !== 'genders')
    .filter((g) => !hideGroups.includes(g.key));
  const total = activeCount(value);

  // Arrowheads flanking each table say "this scrolls" — an off-screen option
  // that never announces itself may as well not exist. Each group tracks
  // whether there's content behind or ahead, and the arrows page through it.
  const scrollers = useRef<Record<string, ScrollView | null>>({});
  const geom = useRef<Record<string, { x: number; content: number; frame: number }>>({});
  const [edges, setEdges] = useState<Record<string, { left: boolean; right: boolean }>>({});

  const updateEdges = (key: string) => {
    const g = geom.current[key];
    if (!g) return;
    const left = g.x > 4;
    const right = g.x < g.content - g.frame - 4;
    setEdges((e) => (e[key]?.left === left && e[key]?.right === right
      ? e : { ...e, [key]: { left, right } }));
  };

  const page = (key: string, dir: 1 | -1) => {
    const g = geom.current[key];
    if (!g) return;
    const next = Math.max(0, Math.min(g.content - g.frame, g.x + dir * g.frame * 0.75));
    scrollers.current[key]?.scrollTo({ x: next, animated: true });
  };

  const toggle = (groupKey: keyof FilterState, optKey: string) => {
    const cur = value[groupKey];
    onChange({
      ...value,
      [groupKey]: cur.includes(optKey) ? cur.filter((k) => k !== optKey) : [...cur, optKey],
    });
  };

  /** Column-fill into two rows, so the table reads top-to-bottom then across. */
  const columnsOf = (options: FilterOption[]) => {
    const cols: FilterOption[][] = [];
    for (let i = 0; i < options.length; i += 2) cols.push(options.slice(i, i + 2));
    return cols;
  };

  return (
    <View style={styles.wrap}>
      {total > 0 ? (
        <View style={styles.summaryRow}>
          <Text style={styles.result}>
            {resultCount != null ? `${resultCount} match${resultCount === 1 ? '' : 'es'}` : `${total} filter${total === 1 ? '' : 's'} on`}
          </Text>
          <TouchableOpacity style={styles.clear} onPress={() => onChange(emptyFilters())}>
            <Ionicons name="close-circle" size={14} color={colors.error} />
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Dropdown boxes first, side by side — they're the compact ones. */}
      {dropdownGroups.length ? (
        <View style={styles.dropRow}>
          {groups.filter((g) => dropdownGroups.includes(g.key)).map((g) => {
            const n = value[g.key].length;
            const first = g.options.find((o) => o.key === value[g.key][0]);
            return (
              <TouchableOpacity
                key={g.key}
                style={[styles.dropBox, n > 0 && styles.dropBoxOn]}
                activeOpacity={0.8}
                onPress={() => setOpenDrop(g.key)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.dropLabel}>{g.label}</Text>
                  <Text style={[styles.dropValue, n > 0 && styles.dropValueOn]} numberOfLines={1}>
                    {n === 0 ? 'Any'
                      : n === 1 ? first?.label ?? '1 selected'
                        : `${first?.label ?? ''} +${n - 1}`}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color={n > 0 ? colors.primary : colors.textMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {groups.filter((g) => !dropdownGroups.includes(g.key)).map((g) => {
        const active = value[g.key];
        return (
          <View key={g.key} style={styles.group}>
            <View style={styles.groupHead}>
              <Text style={styles.groupLabel}>{g.label.toUpperCase()}</Text>
              {active.length ? (
                <TouchableOpacity onPress={() => onChange({ ...value, [g.key]: [] })}>
                  <Text style={styles.groupClear}>Clear {active.length}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.tableRow}>
              <TouchableOpacity
                style={[styles.arrow, !edges[g.key]?.left && styles.arrowOff]}
                disabled={!edges[g.key]?.left}
                onPress={() => page(g.key, -1)}
                accessibilityLabel={`Scroll ${g.label} back`}
              >
                <Ionicons name="chevron-back" size={15} color={edges[g.key]?.left ? colors.primary : colors.border} />
              </TouchableOpacity>

              <ScrollView
                ref={(r) => { scrollers.current[g.key] = r; }}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.track}
                scrollEventThrottle={32}
                onLayout={(e) => {
                  geom.current[g.key] = {
                    ...(geom.current[g.key] ?? { x: 0, content: 0 }),
                    frame: e.nativeEvent.layout.width,
                  } as { x: number; content: number; frame: number };
                  updateEdges(g.key);
                }}
                onContentSizeChange={(w) => {
                  geom.current[g.key] = {
                    ...(geom.current[g.key] ?? { x: 0, frame: 0 }),
                    content: w,
                  } as { x: number; content: number; frame: number };
                  updateEdges(g.key);
                }}
                onScroll={(e) => {
                  geom.current[g.key] = {
                    ...(geom.current[g.key] ?? { content: 0, frame: 0 }),
                    x: e.nativeEvent.contentOffset.x,
                    content: e.nativeEvent.contentSize.width,
                    frame: e.nativeEvent.layoutMeasurement.width,
                  };
                  updateEdges(g.key);
                }}
              >
              {columnsOf(g.options).map((col) => (
                <View key={col[0].key} style={styles.col}>
                  {col.map((o) => {
                    const on = active.includes(o.key);
                    return (
                      <TouchableOpacity
                        key={o.key}
                        style={[styles.tile, on && styles.tileOn]}
                        activeOpacity={0.8}
                        onPress={() => toggle(g.key, o.key)}
                      >
                        {o.icon ? (
                          <MaterialCommunityIcons
                            name={o.icon}
                            size={17}
                            color={on ? colors.white : colors.primary}
                          />
                        ) : null}
                        <Text
                          style={[styles.tileText, on && styles.tileTextOn]}
                          numberOfLines={1}
                        >
                          {o.label}
                        </Text>
                        {on ? (
                          <Ionicons name="checkmark-circle" size={13} color={colors.white} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                  {/* Pad odd columns so the table keeps its height. */}
                  {col.length === 1 ? <View style={styles.tilePad} /> : null}
                </View>
              ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.arrow, !edges[g.key]?.right && styles.arrowOff]}
                disabled={!edges[g.key]?.right}
                onPress={() => page(g.key, 1)}
                accessibilityLabel={`Scroll ${g.label} forward`}
              >
                <Ionicons name="chevron-forward" size={15} color={edges[g.key]?.right ? colors.primary : colors.border} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
      {/* The dropdown's own picker: same options, still multi-select. */}
      <AppModal
        visible={!!openDrop}
        onClose={() => setOpenDrop(null)}
        title={openDrop
          ? `Filter by ${(FILTER_GROUPS.find((g) => g.key === openDrop)?.label ?? '').toLowerCase()}`
          : ''}
      >
        {openDrop ? (
          <>
            <ScrollView style={styles.pickScroll}>
              <View style={styles.pickWrap}>
                {(FILTER_GROUPS.find((g) => g.key === openDrop)?.options ?? []).map((o) => {
                  const on = value[openDrop].includes(o.key);
                  return (
                    <TouchableOpacity
                      key={o.key}
                      style={[styles.pickRow, on && styles.pickRowOn]}
                      onPress={() => toggle(openDrop, o.key)}
                    >
                      <Ionicons
                        name={on ? 'checkbox' : 'square-outline'}
                        size={19}
                        color={on ? colors.primary : colors.textMuted}
                      />
                      {o.icon ? (
                        <MaterialCommunityIcons name={o.icon} size={17} color={colors.primary} />
                      ) : null}
                      <Text style={styles.pickText}>{o.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <PrimaryButton
              label={resultCount != null ? `Show ${resultCount} result${resultCount === 1 ? '' : 's'}` : 'Show results'}
              style={styles.pickApply}
              onPress={() => setOpenDrop(null)}
            />
            {value[openDrop].length ? (
              <PrimaryButton
                label="Clear this filter"
                variant="outline"
                style={styles.pickClear}
                onPress={() => onChange({ ...value, [openDrop]: [] })}
              />
            ) : null}
          </>
        ) : null}
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 6 },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8,
  },
  result: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  clear: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearText: { fontSize: 12, fontWeight: '700', color: colors.error },

  dropRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  dropBox: {
    // Two per row on a phone; a fifth box wraps rather than shrinking the
    // others to unreadable slivers.
    flexGrow: 1, flexBasis: '46%', flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 11, paddingVertical: 9, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  dropBoxOn: { borderColor: colors.primary, backgroundColor: '#F4F8FE' },
  dropLabel: { fontSize: 9.5, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 },
  dropValue: { fontSize: 12.5, fontWeight: '600', color: colors.textPrimary, marginTop: 1 },
  dropValueOn: { color: colors.primary, fontWeight: '700' },
  pickScroll: { maxHeight: 380, marginTop: 8 },
  pickWrap: { gap: 2 },
  pickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingVertical: 10, paddingHorizontal: 4, borderRadius: radius.sm,
  },
  pickRowOn: { backgroundColor: '#F4F8FE' },
  pickText: { flex: 1, fontSize: 13.5, fontWeight: '600', color: colors.textPrimary },
  pickApply: { marginTop: 14 },
  pickClear: { marginTop: 10 },
  group: { marginBottom: 10 },
  groupHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6,
  },
  groupLabel: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.6 },
  groupClear: { fontSize: 11, fontWeight: '700', color: colors.primary },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  arrow: {
    width: 26, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  arrowOff: { backgroundColor: colors.background },
  track: { gap: 7, paddingRight: 6 },
  col: { gap: 7 },
  tile: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 118,
    paddingHorizontal: 11, paddingVertical: 9, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  tileOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tileText: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  tileTextOn: { color: colors.white },
  tilePad: { minWidth: 118, paddingVertical: 9, opacity: 0 },
});
