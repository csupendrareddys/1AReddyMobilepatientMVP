import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text,
  TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, typography } from '../theme/theme';

/**
 * A two-row shelf that slides sideways on its own.
 *
 * Items are laid out in columns of two and paged horizontally, so the shelf is
 * a fixed two lines tall whatever the device — the column width is derived
 * from the viewport rather than hard-coded, which is what makes it fit a 360dp
 * Android and a 430dp iPhone without separate cases.
 *
 * The auto-advance stops the moment the user touches or hovers it and does not
 * resume until they let go. A shelf that keeps moving under someone's finger
 * while they're reading it is actively hostile, and the whole point of the
 * timer is to show what's there, not to race them.
 */

export type SliderCard = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
};

type Props = {
  items: SliderCard[];
  onPress: (id: string) => void;
  /** Seconds between advances. 0 disables the timer. */
  intervalSec?: number;
  /** Compact tiles (quick actions) vs fuller product cards. */
  variant?: 'tile' | 'product';
  /** Columns visible at once on a typical phone. */
  columns?: number;
  /** How many items stack per column. Two unless a shelf asks for more. */
  rows?: number;
};

const GAP = 10;

export default function TwoRowSlider({
  items, onPress, intervalSec = 0, variant = 'product', columns, rows = 2,
}: Props) {
  const { width } = useWindowDimensions();
  const ref = useRef<ScrollView>(null);
  const [paused, setPaused] = useState(false);
  const [page, setPage] = useState(0);

  // Chunked into columns, so the shelf is always exactly `rows` lines tall
  // however many items it holds.
  const cols: SliderCard[][] = [];
  for (let i = 0; i < items.length; i += rows) cols.push(items.slice(i, i + rows));

  // Fit whole columns to the viewport instead of a fixed pixel width — this is
  // what makes one shelf work from a 360dp phone to a tablet.
  const avail = Math.min(width, 560) - 32;
  const perView = columns ?? (variant === 'tile' ? 1.85 : 1.15);
  const colW = Math.round((avail - GAP * (Math.floor(perView) - 1)) / perView);
  const step = colW + GAP;
  const maxPage = Math.max(0, cols.length - 1);

  useEffect(() => {
    if (!intervalSec || paused || cols.length < 2) return undefined;
    const t = setInterval(() => {
      setPage((prev) => {
        const next = prev >= maxPage ? 0 : prev + 1;
        ref.current?.scrollTo({ x: next * step, animated: true });
        return next;
      });
    }, intervalSec * 1000);
    return () => clearInterval(t);
  }, [intervalSec, paused, step, maxPage, cols.length]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / step));
  };

  // Hover pauses on web; touch pauses on native. Both routes set the same flag.
  const hoverProps = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
  } as object;

  return (
    <View {...hoverProps}>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        contentContainerStyle={styles.track}
        onScrollBeginDrag={() => setPaused(true)}
        onScrollEndDrag={() => setPaused(false)}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
      >
        {cols.map((col) => (
          <View key={col[0].id} style={[styles.col, { width: colW }]}>
            {col.map((c) => (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.85}
                onPress={() => onPress(c.id)}
                style={[
                  variant === 'tile' ? styles.tile : styles.card,
                  { borderColor: 'transparent' },
                ]}
              >
                <View style={[styles.icon, { backgroundColor: `${c.tint}1A` }]}>
                  <Ionicons name={c.icon} size={variant === 'tile' ? 18 : 19} color={c.tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={variant === 'tile' ? styles.tileTitle : styles.cardTitle}
                    numberOfLines={variant === 'tile' ? 1 : 2}
                  >
                    {c.title}
                  </Text>
                  {c.subtitle ? (
                    <Text style={styles.sub} numberOfLines={1}>{c.subtitle}</Text>
                  ) : null}
                  {c.meta ? (
                    <Text style={styles.meta} numberOfLines={1}>{c.meta}</Text>
                  ) : null}
                  {c.badge ? (
                    <View style={[styles.badge, { backgroundColor: `${c.tint}1A` }]}>
                      <Text style={[styles.badgeText, { color: c.tint }]} numberOfLines={1}>
                        {c.badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
            {/* Pads the last column so a ragged count can't shorten the
                shelf and make the whole row jump on the final page. */}
            {Array.from({ length: rows - col.length }).map((_, i) => (
              <View
                key={`pad-${i}`}
                style={[variant === 'tile' ? styles.tile : styles.card, styles.ghost]}
              />
            ))}
          </View>
        ))}
      </ScrollView>

      {cols.length > 1 ? (
        <View style={styles.dots}>
          {cols.map((c, i) => (
            <View key={c[0].id} style={[styles.dot, i === page && styles.dotOn]} />
          ))}
          {paused ? (
            <View style={styles.pausedChip}>
              <Ionicons name="pause" size={9} color={colors.textMuted} />
              <Text style={styles.pausedText}>Paused</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { gap: GAP, paddingRight: 4 },
  col: { gap: GAP },
  // Borders are invisible by design — the shelves should read as one surface,
  // not as a grid of boxed-in cells.
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: radius.md, borderWidth: 1,
    backgroundColor: colors.surface, height: 88,
  },
  tile: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    padding: 11, borderRadius: radius.md, borderWidth: 1,
    backgroundColor: colors.surface, height: 66,
  },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary, lineHeight: 18 },
  tileTitle: { fontSize: 12.5, fontWeight: '700', color: colors.textPrimary, lineHeight: 16 },
  sub: { fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },
  meta: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  badge: {
    alignSelf: 'flex-start', marginTop: 5,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.border },
  dotOn: { width: 16, backgroundColor: colors.primary },
  pausedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 8,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: colors.background,
  },
  pausedText: { fontSize: 9.5, fontWeight: '700', color: colors.textMuted },
});
