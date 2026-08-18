import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme/theme';

type Props = {
  title: string;
  showBack?: boolean;
  /** Where back goes when there's no history — e.g. a deep link or a reload. */
  fallback?: string;
  right?: React.ReactNode;
};

export default function ScreenHeader({
  title, showBack = true, fallback = '/(tabs)', right,
}: Props) {
  const router = useRouter();

  // Always offer a way out. Hiding the button when `canGoBack()` is false
  // stranded anyone who deep-linked or reloaded, and calling `back()`
  // regardless dispatches an unhandled GO_BACK — so do both checks here.
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback as never);
  };

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity
            onPress={goBack}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : null}
        <Text style={typography.h2} numberOfLines={1}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  backBtn: { marginRight: 8 },
});
