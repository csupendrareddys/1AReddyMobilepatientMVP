import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../../src/components/ScreenWrapper';
import ScreenHeader from '../../src/components/ScreenHeader';
import Card from '../../src/components/Card';
import AppModal from '../../src/components/AppModal';
import DropdownModal from '../../src/components/DropdownModal';
import PrimaryButton from '../../src/components/PrimaryButton';
import { paymentMethods, topUpPresets, wallet } from '../../src/data/mock';
import { colors, radius, typography } from '../../src/theme/theme';

export default function WalletScreen() {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<number | null>(1000);
  const [custom, setCustom] = useState('');
  const [method, setMethod] = useState('upi');

  const amount = custom ? Number(custom) : preset ?? 0;
  const valid = amount >= 100;

  return (
    <ScreenWrapper contentStyle={{ paddingTop: 0 }}>
      <ScreenHeader
        title="Wallet"
        right={(
          <TouchableOpacity style={styles.addBtn} onPress={() => setOpen(true)}>
            <Ionicons name="add" size={16} color={colors.white} />
            <Text style={styles.addText}>Add money</Text>
          </TouchableOpacity>
        )}
      />

      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.balanceTop}>
          <Ionicons name="wallet-outline" size={18} color={colors.white} />
          <Text style={styles.balanceLabel}>Available balance</Text>
        </View>
        <Text style={styles.balanceValue}>₹{wallet.balance.toLocaleString('en-IN')}</Text>
        <Text style={styles.balanceHint}>Use this to pay for consultations instantly</Text>
      </LinearGradient>

      <Text style={[typography.label, styles.sectionLabel]}>QUICK ADD</Text>
      <View style={styles.presetRow}>
        {topUpPresets.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.preset, preset === p && !custom && styles.presetActive]}
            onPress={() => { setPreset(p); setCustom(''); setOpen(true); }}
          >
            <Text style={[styles.presetText, preset === p && !custom && styles.presetTextActive]}>₹{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[typography.label, styles.sectionLabel]}>TRANSACTION HISTORY</Text>
      {wallet.transactions.map((t) => {
        const credit = t.amount > 0;
        return (
          <Card key={t.id} style={styles.txRow}>
            <View style={[styles.txIcon, { backgroundColor: credit ? '#E8F5E9' : '#FDECEA' }]}>
              <Ionicons
                name={credit ? 'arrow-down' : 'arrow-up'}
                size={15}
                color={credit ? '#2e7d32' : '#c62828'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.body} numberOfLines={1}>{t.description}</Text>
              <Text style={typography.bodyMuted}>{t.date} · {t.method}</Text>
            </View>
            <View style={styles.txAmounts}>
              <Text style={[styles.txAmount, { color: credit ? '#2e7d32' : '#c62828' }]}>
                {credit ? '+' : '−'}₹{Math.abs(t.amount)}
              </Text>
              <Text style={typography.caption}>₹{t.balance_after}</Text>
            </View>
          </Card>
        );
      })}

      <AppModal visible={open} onClose={() => setOpen(false)} title="Add money">
        <View style={styles.currentPanel}>
          <Text style={typography.bodyMuted}>Current balance</Text>
          <Text style={styles.currentValue}>₹{wallet.balance.toLocaleString('en-IN')}</Text>
        </View>

        <Text style={[typography.label, styles.modalLabel]}>Choose amount</Text>
        <View style={styles.presetRow}>
          {topUpPresets.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.preset, preset === p && !custom && styles.presetActive]}
              onPress={() => { setPreset(p); setCustom(''); }}
            >
              <Text style={[styles.presetText, preset === p && !custom && styles.presetTextActive]}>₹{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[typography.label, styles.modalLabel]}>Or enter an amount</Text>
        <TextInput
          value={custom}
          onChangeText={setCustom}
          keyboardType="number-pad"
          placeholder="Minimum ₹100"
          placeholderTextColor={colors.textMuted}
          style={styles.amountInput}
        />

        <View style={styles.modalLabel}>
          <DropdownModal
            label="Payment method"
            value={method}
            options={paymentMethods}
            onChange={setMethod}
            title="Payment method"
          />
        </View>

        <PrimaryButton
          label={valid ? `Add ₹${amount}` : 'Enter at least ₹100'}
          disabled={!valid}
          style={styles.modalCta}
          onPress={() => setOpen(false)}
        />
      </AppModal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm },
  addText: { color: colors.white, fontSize: 12.5, fontWeight: '700' },
  balanceCard: { borderRadius: radius.lg, padding: 20, marginBottom: 22 },
  balanceTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  balanceLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12.5, fontWeight: '600' },
  balanceValue: { color: colors.white, fontSize: 34, fontWeight: '800', marginTop: 8 },
  balanceHint: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 },
  sectionLabel: { marginBottom: 10 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  preset: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  presetActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  presetText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  presetTextActive: { color: colors.white },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  txIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  txAmounts: { alignItems: 'flex-end' },
  txAmount: { fontSize: 13.5, fontWeight: '700' },
  currentPanel: { backgroundColor: colors.background, borderRadius: radius.sm, padding: 12, marginBottom: 16 },
  currentValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
  modalLabel: { marginBottom: 10 },
  amountInput: {
    height: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, fontSize: 15, color: colors.textPrimary, backgroundColor: colors.surface,
    marginBottom: 16,
  },
  modalCta: { marginTop: 6 },
});
