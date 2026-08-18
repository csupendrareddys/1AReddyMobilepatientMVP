import React, { createContext, useContext, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme/theme';

/**
 * PatientScope — "whose account am I acting on?"
 *
 * Default is the logged-in patient acting on themselves. Opening a minor
 * sub-profile, or an adult account someone shared with me, switches the whole
 * app into that scope — the web does the same thing by remounting the patient
 * dashboard under a scoped base path.
 *
 * A minor has no family group of their own, so that section hides while scoped.
 */
export type ScopeKind = 'self' | 'minor' | 'linked';

type Scope = {
  kind: ScopeKind;
  id: string | null;
  name: string | null;
  /** Role bounding what I may do — null when acting on myself or my minor. */
  roleName?: string | null;
};

const DEFAULT: Scope = { kind: 'self', id: null, name: null, roleName: null };

const PatientScopeContext = createContext<{
  scope: Scope;
  enter: (s: Omit<Scope, 'kind'> & { kind: ScopeKind }) => void;
  exit: () => void;
}>({ scope: DEFAULT, enter: () => {}, exit: () => {} });

export const usePatientScope = () => useContext(PatientScopeContext);

export function PatientScopeProvider({ children }: { children: React.ReactNode }) {
  const [scope, setScope] = useState<Scope>(DEFAULT);
  const value = useMemo(() => ({
    scope,
    enter: (s: Scope) => setScope(s),
    exit: () => setScope(DEFAULT),
  }), [scope]);

  return (
    <PatientScopeContext.Provider value={value}>
      {children}
    </PatientScopeContext.Provider>
  );
}

/**
 * Persistent banner shown whenever the app is acting on someone else. Being
 * unmissable is the point — editing the wrong person's records is the failure
 * this guards against.
 */
export function ScopeBanner() {
  const { scope, exit } = usePatientScope();
  if (scope.kind === 'self') return null;

  return (
    <View style={styles.banner}>
      <Ionicons
        name={scope.kind === 'minor' ? 'happy-outline' : 'people-outline'}
        size={15}
        color={colors.white}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.text} numberOfLines={1}>
          Viewing {scope.name}
          {scope.kind === 'minor' ? " (minor)" : ''}
        </Text>
        {scope.roleName ? (
          <Text style={styles.role} numberOfLines={1}>Role: {scope.roleName}</Text>
        ) : null}
      </View>
      <TouchableOpacity style={styles.exitBtn} onPress={exit} hitSlop={8}>
        <Text style={styles.exitText}>Exit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.warningDark, paddingHorizontal: 14, paddingVertical: 8,
  },
  text: { color: colors.white, fontSize: 12.5, fontWeight: '700' },
  role: { color: 'rgba(255,255,255,0.85)', fontSize: 10.5 },
  exitBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.pill,
  },
  exitText: { color: colors.white, fontSize: 11.5, fontWeight: '800' },
});
