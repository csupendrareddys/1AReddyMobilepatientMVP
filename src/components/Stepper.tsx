import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';

/**
 * Numbered circles that flip to a tick, joined by connector lines.
 *
 * With `onStep`, every completed step is also the way back to it — a patient
 * three pages into a booking who wants to recheck their filters shouldn't
 * have to hammer Back through each page. Only finished steps are tappable:
 * jumping forward would skip decisions the flow still needs.
 */
export default function Stepper({
  steps, current, onStep, canNext = true,
}: {
  steps: string[];
  current: number;
  onStep?: (index: number) => void;
  /** Whether the current step's requirements are met — gates the Next chip. */
  canNext?: boolean;
}) {
  return (
    <View>
      <View style={styles.row}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const tappable = !!onStep && done;
        const body = (
          <>
            <View style={[styles.circle, done && styles.circleDone, active && styles.circleActive]}>
              {done ? (
                <Ionicons name="checkmark" size={14} color={colors.white} />
              ) : (
                <Text style={[styles.num, active && styles.numActive]}>{i + 1}</Text>
              )}
            </View>
            <Text
              style={[styles.label, active && styles.labelActive, tappable && styles.labelTappable]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </>
        );
        return (
          <React.Fragment key={label}>
            {i > 0 ? <View style={[styles.line, done || active ? styles.lineDone : null]} /> : null}
            {tappable ? (
              <TouchableOpacity
                style={styles.stepWrap}
                activeOpacity={0.7}
                onPress={() => onStep(i)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel={`Go back to ${label}`}
              >
                {body}
              </TouchableOpacity>
            ) : (
              <View style={styles.stepWrap}>{body}</View>
            )}
          </React.Fragment>
        );
      })}
      </View>

      {/* A named previous/next row under the dots: on any step, the way back
          and the way forward are both one labelled tap at the top of the
          page, not a hunt for buttons below the fold. */}
      {onStep ? (
        <View style={styles.navRow}>
          {current > 0 ? (
            <TouchableOpacity
              style={styles.navChip}
              onPress={() => onStep(current - 1)}
              accessibilityRole="button"
              accessibilityLabel={`Back to ${steps[current - 1]}`}
            >
              <Ionicons name="chevron-back" size={13} color={colors.primary} />
              <Text style={styles.navChipText}>{steps[current - 1]}</Text>
            </TouchableOpacity>
          ) : <View style={styles.navSpacer} />}

          <Text style={styles.navNow}>
            Step {current + 1} of {steps.length} · {steps[current]}
          </Text>

          {current < steps.length - 1 ? (
            <TouchableOpacity
              style={[styles.navChip, !canNext && styles.navChipOff]}
              disabled={!canNext}
              onPress={() => onStep(current + 1)}
              accessibilityRole="button"
              accessibilityLabel={`Forward to ${steps[current + 1]}`}
            >
              <Text style={[styles.navChipText, !canNext && styles.navChipTextOff]}>
                {steps[current + 1]}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={13}
                color={canNext ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
          ) : <View style={styles.navSpacer} />}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 8, marginBottom: 16,
  },
  navChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14,
    borderWidth: 1, borderColor: colors.primary, backgroundColor: '#F4F8FE',
  },
  navChipOff: { borderColor: colors.border, backgroundColor: colors.background },
  navChipText: { fontSize: 11.5, fontWeight: '700', color: colors.primary },
  navChipTextOff: { color: colors.textMuted },
  navNow: { flex: 1, textAlign: 'center', fontSize: 10.5, fontWeight: '600', color: colors.textMuted },
  navSpacer: { width: 60 },
  stepWrap: { alignItems: 'center', gap: 5, width: 84 },
  circle: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
  },
  circleDone: { backgroundColor: colors.success, borderColor: colors.success },
  circleActive: { borderColor: colors.primary, backgroundColor: '#E8F1FC' },
  num: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  numActive: { color: colors.primary },
  labelTappable: { color: colors.primary, textDecorationLine: 'underline' },
  label: { fontSize: 10.5, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
  labelActive: { color: colors.primary },
  line: { flex: 1, height: 2, backgroundColor: colors.border, marginBottom: 18 },
  lineDone: { backgroundColor: colors.success },
});
