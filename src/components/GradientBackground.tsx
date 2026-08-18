import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Full-bleed brand gradient, tunable per screen via `opacity` — the reference
 * app reuses one gradient at 0.25 / 0.35 / 0.6 for onboarding, splash and forms
 * rather than shipping three assets.
 */
export default function GradientBackground({ opacity = 1 }: { opacity?: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
      <LinearGradient
        colors={['#1976d2', '#2f9fc4', '#26a69a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
