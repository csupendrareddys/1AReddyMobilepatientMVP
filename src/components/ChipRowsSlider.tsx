import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius } from '../theme/theme';

/**
 * Chips laid out in a fixed number of rows and slid sideways.
 *
 * Dates and time slots both have the same problem: there are more of them than
 * fit, and wrapping them into a growing grid pushes the rest of the booking
 * off the screen. Fixing the height in rows and scrolling horizontally keeps
 * the step a predictable size however many options the provider offers.
 */

export type SliderChip = {
  key: string;
  title: string;
  sub?: string;
  disabled?: boolean;
};

type Props = {
  items: SliderChip[];
  rows: number;
  selected: string | null;
  onSelect: (key: string) => void;
  /** Chip width — dates need more room than a time. */
  width?: number;
  /** Colour of the selected chip. */
  tint?: string;
};

export default function ChipRowsSlider({
  items, rows, selected, onSelect, width = 64, tint = colors.primary,
}: Props) {
  // Fill down each column, then across — so reading order runs top-to-bottom
  // in a column, the way a calendar week reads.
  const cols: SliderChip[][] = [];
  for (let i = 0; i < items.length; i += rows) cols.push(items.slice(i, i + rows));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
    >
      {cols.map((col) => (
        <View key={col[0].key} style={styles.col}>
          {col.map((c) => {
            const on = selected === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                disabled={c.disabled}
                onPress={() => onSelect(c.key)}
                style={[
                  styles.chip,
                  { width },
                  on && { backgroundColor: tint, borderColor: tint },
                  c.disabled && styles.chipOff,
                ]}
              >
                <Text
                  style={[styles.title, on && styles.textOn, c.disabled && styles.textOff]}
                  numberOfLines={1}
                >
                  {c.title}
                </Text>
                {c.sub ? (
                  <Text
                    style={[styles.sub, on && styles.textOn, c.disabled && styles.textOff]}
                    numberOfLines={1}
                  >
                    {c.sub}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
          {/* Pad a short last column so the shelf can't change height mid-slide. */}
          {Array.from({ length: rows - col.length }).map((_, i) => (
            <View key={`pad-${i}`} style={[styles.chip, { width }, styles.pad]} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  track: { gap: 8, paddingRight: 4, paddingBottom: 2 },
  col: { gap: 8 },
  chip: {
    paddingVertical: 9, paddingHorizontal: 6, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', gap: 1,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipOff: { backgroundColor: colors.background, borderColor: colors.border },
  pad: { backgroundColor: 'transparent', borderColor: 'transparent' },
  title: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 10.5, color: colors.textMuted },
  textOn: { color: colors.white },
  textOff: { color: colors.textMuted },
});
