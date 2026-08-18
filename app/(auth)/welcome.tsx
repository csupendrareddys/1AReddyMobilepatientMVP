import React, { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientBackground from '../../src/components/GradientBackground';
import PrimaryButton from '../../src/components/PrimaryButton';
import { onboardingSlides } from '../../src/data/mock';
import { colors, radius } from '../../src/theme/theme';

/**
 * Paged onboarding. The reference app drove slides off a setInterval, which
 * fights the user's own swipes — a paging FlatList keeps the gesture authoritative
 * and the dots simply follow scroll position.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === onboardingSlides.length - 1;
  // Must be reactive: a module-level Dimensions.get() is captured once, so the
  // slides keep their first-measured width and stack on resize or rotation.
  const { width } = useWindowDimensions();

  const goTo = (i: number) => {
    listRef.current?.scrollToOffset({ offset: i * width, animated: true });
    setIndex(i);
  };

  return (
    <View style={styles.root}>
      <GradientBackground />
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <Text style={styles.brand}>Larazen Health</Text>
          {!isLast ? (
            <TouchableOpacity onPress={() => goTo(onboardingSlides.length - 1)} hitSlop={10}>
              <Text style={styles.skip}>Skip</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <FlatList
          ref={listRef}
          data={onboardingSlides}
          keyExtractor={(s) => s.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          // Re-measure when the width changes, and give the list an exact
          // per-item size so scrollToOffset lands cleanly on a page.
          extraData={width}
          style={styles.list}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) =>
            setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon} size={56} color={colors.white} />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          )}
        />

        <View style={styles.dots}>
          {onboardingSlides.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.actions}>
          {isLast ? (
            <>
              <PrimaryButton
                label="Create an account"
                style={styles.ctaLight}
                labelStyle={styles.ctaLightLabel}
                onPress={() => router.push('/(auth)/signup')}
              />
              <TouchableOpacity style={styles.secondary} onPress={() => router.push('/(auth)/signin')}>
                <Text style={styles.secondaryText}>I already have an account</Text>
              </TouchableOpacity>
            </>
          ) : (
            <PrimaryButton
              label="Next"
              style={styles.ctaLight}
              labelStyle={styles.ctaLightLabel}
              onPress={() => goTo(index + 1)}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  safe: { flex: 1 },
  list: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 12 },
  brand: { color: colors.white, fontWeight: '700', fontSize: 14 },
  skip: { color: colors.white, fontWeight: '600', fontSize: 14, opacity: 0.9 },
  // No `flex: 1` here — inside a horizontal list it competes with the explicit
  // per-slide width and lets the pages collapse onto each other.
  slide: { height: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  iconCircle: {
    width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 32,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.white, textAlign: 'center' },
  body: { fontSize: 15, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 12, lineHeight: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 22, backgroundColor: colors.white },
  actions: { paddingHorizontal: 24, paddingBottom: 20, gap: 4 },
  ctaLight: { backgroundColor: colors.white, borderRadius: radius.sm },
  ctaLightLabel: { color: colors.primaryDark },
  secondary: { alignItems: 'center', paddingVertical: 14 },
  secondaryText: { color: colors.white, fontWeight: '600', fontSize: 14 },
});
