import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { findPerson, Person } from '../data/people';
import { colors, radius, typography } from '../theme/theme';

const KIND_TONE: Record<string, string> = {
  self: colors.primary,
  minor: '#5e35b1',
  linked: colors.secondaryDark,
};

const KIND_LABEL: Record<string, string> = {
  self: 'You',
  minor: 'Minor',
  linked: 'Linked',
};

/**
 * "Who is this for?" — the person picker used on booking, records and profile
 * screens. Linked accounts appear even when their role blocks the current
 * action, but disabled with the reason shown: silently omitting them would make
 * the app look broken to someone who knows the account exists.
 */
export default function PersonSelector({
  label = 'For', people, value, onChange,
}: {
  label?: string;
  people: Person[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = findPerson(people, value);

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={styles.label}>{label}</Text>
        <Image source={{ uri: selected.avatar }} style={styles.triggerAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.triggerName} numberOfLines={1}>{selected.name}</Text>
          <Text style={styles.triggerSub} numberOfLines={1}>{selected.subtitle}</Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHead}>
              <Text style={typography.h3}>Who is this for?</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.list} showsVerticalScrollIndicator>
              {people.map((p) => {
                const active = p.id === value;
                return (
                  <TouchableOpacity
                    key={p.id}
                    disabled={!p.allowed}
                    activeOpacity={0.75}
                    style={[
                      styles.row,
                      active && styles.rowActive,
                      !p.allowed && styles.rowDisabled,
                    ]}
                    onPress={() => { onChange(p.id); setOpen(false); }}
                  >
                    <Image source={{ uri: p.avatar }} style={styles.avatar} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                        <View style={[styles.kindChip, { backgroundColor: `${KIND_TONE[p.kind]}1A` }]}>
                          <Text style={[styles.kindText, { color: KIND_TONE[p.kind] }]}>
                            {KIND_LABEL[p.kind]}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.sub} numberOfLines={1}>{p.subtitle}</Text>
                      {!p.allowed && p.reason ? (
                        <View style={styles.reasonRow}>
                          <Ionicons name="lock-closed" size={11} color={colors.error} />
                          <Text style={styles.reason} numberOfLines={2}>{p.reason}</Text>
                        </View>
                      ) : null}
                    </View>
                    {active ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    marginBottom: 14,
  },
  label: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  triggerAvatar: { width: 32, height: 32, borderRadius: 16 },
  triggerName: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  triggerSub: { fontSize: 11, color: colors.textMuted },
  overlay: { flex: 1, backgroundColor: 'rgba(15,27,45,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  sheet: { width: '100%', maxWidth: 460, maxHeight: '80%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11, marginBottom: 8,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  rowActive: { borderColor: colors.primary, borderWidth: 2 },
  rowDisabled: { opacity: 0.55, backgroundColor: colors.background },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, flexShrink: 1 },
  kindChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill },
  kindText: { fontSize: 9.5, fontWeight: '800' },
  sub: { fontSize: 11.5, color: colors.textSecondary, marginTop: 1 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  reason: { flex: 1, fontSize: 10.5, color: colors.error },
});
