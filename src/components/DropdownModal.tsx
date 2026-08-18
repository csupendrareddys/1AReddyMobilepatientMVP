import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { colors, radius, typography } from '../theme/theme';

export type Option = { label: string; value: string; disabled?: boolean };

type Props = {
  label?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  title?: string;
};

/**
 * Compact caret row that expands into a full-screen list — handles long option
 * sets (countries, payment methods) far better than an inline picker on mobile.
 */
export default function DropdownModal({ label, value, options, onChange, title }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={styles.triggerText}>{selected?.label ?? 'Select'}</Text>
        <AntDesign name="caret-down" size={12} color={colors.primary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={typography.h2}>{title ?? label ?? 'Select'}</Text>
            <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(o) => o.value}
            renderItem={({ item }) => {
              const inactive = item.disabled || item.value === value;
              return (
                <TouchableOpacity
                  disabled={inactive}
                  style={[styles.option, inactive && styles.optionInactive]}
                  onPress={() => { onChange(item.value); setOpen(false); }}
                >
                  <Text style={typography.body}>{item.label}</Text>
                  {item.value === value ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.label, marginBottom: 6 },
  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, backgroundColor: colors.surface,
  },
  triggerText: { fontSize: 15, color: colors.textPrimary },
  modal: { flex: 1, backgroundColor: colors.surface },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  optionInactive: { opacity: 0.5 },
});
