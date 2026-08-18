import React from 'react';
import { StyleSheet, Text } from 'react-native';
import ScreenWrapper from '../src/components/ScreenWrapper';
import ScreenHeader from '../src/components/ScreenHeader';
import RecoShelf from '../src/components/RecoShelf';
import { shelves } from '../src/data/recommendations';
import { typography } from '../src/theme/theme';

/**
 * Every recommendation shelf on one page, each still a two-row slider.
 *
 * This is the "show me all of them" view: the dashboard carries the same
 * shelves but competes with everything else on it, whereas here they're the
 * only thing, so a patient can work through them one at a time.
 */
export default function DiscoverScreen() {
  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader title="Recommended for you" fallback="/(tabs)" />
      <Text style={[typography.bodyMuted, styles.intro]}>
        Shelves are built from your records, your family doctor and what you&apos;ve
        looked at. Each moves on its own — touch one to hold it still.
      </Text>

      {shelves.map((s) => <RecoShelf key={s.key} shelf={s} />)}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 4 },
});
