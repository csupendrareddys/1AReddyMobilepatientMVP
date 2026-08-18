import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../../src/components/PrimaryButton';
import { colors, radius, typography } from '../../src/theme/theme';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('rohit.reddy@example.com');
  const [password, setPassword] = useState('');
  const [hidePw, setHidePw] = useState(true);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.brand}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/welcome'))}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.logoDot} />
          <Text style={styles.brandText}>Larazen Health</Text>
        </View>

        <View style={styles.body}>
          <Text style={typography.h1}>Welcome back</Text>
          <Text style={[typography.bodyMuted, styles.subtitle]}>Sign in to manage appointments, records, and your care team.</Text>

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

          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.pwRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.pwInput}
              secureTextEntry={hidePw}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity onPress={() => setHidePw((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={hidePw ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </Link>

          <PrimaryButton
            label="Sign in"
            style={styles.signInBtn}
            onPress={() => router.replace('/(tabs)')}
          />

          <TouchableOpacity onPress={() => router.push('/(auth)/otp')} style={styles.otpLink}>
            <Ionicons name="phone-portrait-outline" size={16} color={colors.primary} />
            <Text style={styles.otpLinkText}>Sign in with OTP instead</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.footer} onPress={() => router.push('/(auth)/signup')}>
            <Text style={typography.bodyMuted}>New patient? </Text>
            <Text style={styles.signupLink}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  brand: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, gap: 8 },
  logoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  brandText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  subtitle: { marginTop: 8, marginBottom: 28 },
  fieldLabel: { ...typography.label, marginBottom: 6, marginTop: 16 },
  input: {
    height: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, fontSize: 15, color: colors.textPrimary, backgroundColor: colors.surface,
  },
  pwRow: {
    flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, backgroundColor: colors.surface,
  },
  pwInput: { flex: 1, fontSize: 15, color: colors.textPrimary },
  forgotWrap: { alignSelf: 'flex-end', marginTop: 10 },
  forgotText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  signInBtn: { marginTop: 28 },
  otpLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18 },
  otpLinkText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  signupLink: { color: colors.primary, fontWeight: '700', fontSize: 13 },
});
