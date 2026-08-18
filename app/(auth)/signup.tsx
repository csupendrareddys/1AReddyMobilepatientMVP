import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../src/components/ScreenHeader';
import InputBox from '../../src/components/InputBox';
import DropdownModal from '../../src/components/DropdownModal';
import AppCheckBox from '../../src/components/AppCheckBox';
import PrimaryButton from '../../src/components/PrimaryButton';
import { countryCodes } from '../../src/data/mock';
import { colors, typography } from '../../src/theme/theme';
import { ScrollView } from 'react-native';

export default function SignUpScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [referral, setReferral] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState(false);

  const firstNameValid = !touched || firstName.trim().length > 0;
  const phoneValid = !touched || phone.trim().length >= 10;
  const passwordValid = !touched || password.length >= 8;
  const confirmValid = !touched || (confirm.length > 0 && confirm === password);

  const submit = () => {
    setTouched(true);
    const ok = firstName.trim() && phone.trim().length >= 10
      && password.length >= 8 && confirm === password;
    if (ok) router.push('/(auth)/otp');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Create account" fallback="/(auth)/welcome" />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <InputBox
          label="First name *"
          value={firstName}
          onChangeText={setFirstName}
          isValid={firstNameValid}
          placeholder="Rohit"
          containerStyle={styles.field}
        />
        <InputBox
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Reddy"
          containerStyle={styles.field}
        />
        <InputBox
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          containerStyle={styles.field}
        />

        <View style={styles.phoneRow}>
          <View style={styles.codeCol}>
            <DropdownModal
              label="Code"
              value={code}
              options={countryCodes}
              onChange={setCode}
              title="Country code"
            />
          </View>
          <View style={styles.phoneCol}>
            <InputBox
              label="Mobile number *"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              isValid={phoneValid}
              placeholder="98450 12345"
            />
          </View>
        </View>

        <InputBox
          label="Password *"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          isValid={passwordValid}
          placeholder="At least 8 characters"
          containerStyle={styles.field}
        />
        <InputBox
          label="Confirm password *"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          isValid={confirmValid}
          placeholder="Re-enter password"
          containerStyle={styles.field}
        />
        <InputBox
          label="Referral code"
          value={referral}
          onChangeText={setReferral}
          autoCapitalize="characters"
          placeholder="Optional"
          containerStyle={styles.field}
        />

        <AppCheckBox
          checked={agreed}
          onToggle={() => setAgreed((v) => !v)}
          label={(
            <Text style={[typography.body, styles.termsText]}>
              I agree to the{' '}
              <Text style={styles.termsLink} onPress={() => router.push('/(auth)/terms')}>
                Terms &amp; Conditions
              </Text>
            </Text>
          )}
        />

        {/* Primary CTA stays disabled until terms are accepted — the reference
            apps gate signup and login the same way. */}
        <PrimaryButton label="Sign up" disabled={!agreed} style={styles.submit} onPress={submit} />

        <TouchableOpacity style={styles.footer} onPress={() => router.replace('/(auth)/signin')}>
          <Text style={typography.bodyMuted}>Already have an account? </Text>
          <Text style={styles.loginLink}>Log in</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  field: { marginBottom: 14 },
  phoneRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  codeCol: { width: 118 },
  phoneCol: { flex: 1 },
  termsText: { flex: 1 },
  termsLink: { color: colors.primary, fontWeight: '700' },
  submit: { marginTop: 24 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginLink: { color: colors.primary, fontWeight: '700', fontSize: 13 },
});
