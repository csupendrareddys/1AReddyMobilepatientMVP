import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../src/components/ScreenHeader';
import PrimaryButton from '../../src/components/PrimaryButton';
import { colors, radius, typography } from '../../src/theme/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Reset password" fallback="/(auth)/signin" />
      <View style={styles.body}>
        {sent ? (
          <Text style={typography.body}>
            If an account exists for that email, a reset link has been sent.
          </Text>
        ) : (
          <>
            <Text style={typography.bodyMuted}>Enter your account email and we'll send you a reset link.</Text>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
            />
            <PrimaryButton label="Send reset link" style={styles.button} onPress={() => setSent(true)} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  body: { paddingHorizontal: 24, paddingTop: 12 },
  fieldLabel: { ...typography.label, marginBottom: 6, marginTop: 20 },
  input: {
    height: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, fontSize: 15, color: colors.textPrimary, backgroundColor: colors.surface,
  },
  button: { marginTop: 28 },
});
