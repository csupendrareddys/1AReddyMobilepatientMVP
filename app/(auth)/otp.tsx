import React, { useRef, useState } from 'react';
import { NativeSyntheticEvent, StyleSheet, Text, TextInput, TextInputKeyPressEventData, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../src/components/ScreenHeader';
import PrimaryButton from '../../src/components/PrimaryButton';
import { colors, radius, typography } from '../../src/theme/theme';

const LENGTH = 4;

export default function OtpScreen() {
  const router = useRouter();
  const [digits, setDigits] = useState(Array(LENGTH).fill(''));
  const inputs = useRef<(TextInput | null)[]>([]);

  const setDigit = (i: number, v: string) => {
    const char = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    // Auto-advance so the user never has to tap between boxes.
    if (char && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  // Backspace on an empty box steps back, matching every OTP field users know.
  const onKeyPress = (i: number) => (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const complete = digits.every((d) => d !== '');

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Verify phone" fallback="/(auth)/signin" />
      <View style={styles.body}>
        <Text style={typography.body}>
          Enter the {LENGTH}-digit code sent to <Text style={styles.bold}>+91 98450 12345</Text>
        </Text>

        <View style={styles.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              value={d}
              onChangeText={(v) => setDigit(i, v)}
              onKeyPress={onKeyPress(i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              style={[styles.otpBox, d ? styles.otpBoxFilled : null]}
            />
          ))}
        </View>

        <Text style={styles.resend}>Didn't get a code? <Text style={styles.resendLink}>Resend</Text></Text>

        <PrimaryButton
          label="Verify & continue"
          style={styles.button}
          disabled={!complete}
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  body: { paddingHorizontal: 24, paddingTop: 12 },
  bold: { fontWeight: '700', color: colors.textPrimary },
  otpRow: { flexDirection: 'row', gap: 12, marginTop: 28, marginBottom: 16 },
  otpBox: {
    width: 56, height: 56, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    textAlign: 'center', fontSize: 22, fontWeight: '700', backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  otpBoxFilled: { borderColor: colors.primary, backgroundColor: '#E8F1FC' },
  resend: { fontSize: 13, color: colors.textSecondary },
  resendLink: { color: colors.primary, fontWeight: '700' },
  button: { marginTop: 32 },
});
