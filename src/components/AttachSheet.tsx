import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppModal from './AppModal';
import PrimaryButton from './PrimaryButton';
import { colors, radius, typography } from '../theme/theme';

/**
 * The one way to attach something, wherever attaching happens.
 *
 * Two steps: pick a source, then pick the file. Each source opens its own
 * native picker on a device; until those are wired, each returns the kind of
 * file it actually would, so the surrounding flow is real even though the
 * picker isn't.
 *
 * It lives in one place because an attach button that behaves differently in
 * the conversation than on the booking is the kind of inconsistency people
 * notice immediately and trust less for.
 */

export type AttachSource = 'camera' | 'gallery' | 'files';

const SOURCES: {
  key: AttachSource;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  samples: string[];
}[] = [
  {
    key: 'camera',
    label: 'Camera',
    hint: 'Photograph a report or prescription',
    icon: 'camera-outline',
    tint: colors.primary,
    samples: ['Photo_17Aug_1432.jpg', 'Photo_17Aug_1433.jpg'],
  },
  {
    key: 'gallery',
    label: 'Photos',
    hint: 'Pick an image already on your phone',
    icon: 'images-outline',
    tint: colors.secondary,
    samples: ['Chest_XRay.jpg', 'Rash_closeup.png', 'Prescription_Photo.png'],
  },
  {
    key: 'files',
    label: 'Files',
    hint: 'PDFs and documents',
    icon: 'folder-open-outline',
    tint: colors.warningDark,
    samples: ['Lab_Report_Aug2026.pdf', 'Discharge_Summary.pdf', 'CBC_Report.pdf'],
  },
];

const isPhoto = (f: string) => /\.(jpg|jpeg|png|heic)$/i.test(f);

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Called with the chosen file and, when asked for, the patient's note. */
  onPick: (file: string, note: string) => void;
  /** Who the file goes to, named in the reassurance line. */
  sharedWith?: string;
  /** Offer a note field — useful on a booking, noise in a chat composer. */
  withNote?: boolean;
  /** Cap stated to the patient, from the service's own terms. */
  maxMb?: number;
};

export default function AttachSheet({
  visible, onClose, onPick, sharedWith, withNote = true, maxMb,
}: Props) {
  const [source, setSource] = useState<AttachSource | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const reset = () => {
    setSource(null);
    setPicked(null);
    setNote('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const active = SOURCES.find((x) => x.key === source);

  return (
    <AppModal
      visible={visible}
      onClose={close}
      title={active ? active.label : 'Add an attachment'}
    >
      {!active ? (
        <>
          <Text style={typography.bodyMuted}>Where would you like to take it from?</Text>
          {SOURCES.map((src) => (
            <TouchableOpacity
              key={src.key}
              style={styles.sourceRow}
              activeOpacity={0.85}
              onPress={() => setSource(src.key)}
            >
              <View style={[styles.sourceIcon, { backgroundColor: `${src.tint}1A` }]}>
                <Ionicons name={src.icon} size={21} color={src.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.h3}>{src.label}</Text>
                <Text style={typography.bodyMuted}>{src.hint}</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
          <Text style={[typography.caption, styles.note]}>
            {sharedWith ? `Shared with ${sharedWith}. ` : ''}
            {maxMb ? `Up to ${maxMb} MB. ` : ''}
            PDF, JPG or PNG.
          </Text>
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.back} onPress={() => { setSource(null); setPicked(null); }}>
            <Ionicons name="chevron-back" size={15} color={colors.primary} />
            <Text style={styles.backText}>Change source</Text>
          </TouchableOpacity>

          {active.samples.map((f) => {
            const on = picked === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.fileRow, on && styles.fileRowOn]}
                onPress={() => setPicked(f)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={on ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={on ? colors.primary : colors.textMuted}
                />
                <Ionicons
                  name={isPhoto(f) ? 'image-outline' : 'document-text-outline'}
                  size={17}
                  color={isPhoto(f) ? colors.secondary : colors.warningDark}
                />
                <Text style={[typography.body, { flex: 1 }]} numberOfLines={1}>{f}</Text>
              </TouchableOpacity>
            );
          })}

          {withNote ? (
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note (optional)"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          ) : null}

          <PrimaryButton
            label="Attach & share"
            disabled={!picked}
            style={styles.btn}
            onPress={() => {
              if (!picked) return;
              onPick(picked, note.trim());
              reset();
            }}
          />
          <PrimaryButton
            label="Cancel"
            variant="outline"
            style={styles.btnAlt}
            onPress={close}
          />
        </>
      )}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  sourceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 10,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sourceIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  note: { marginTop: 14 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 4 },
  backText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  fileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginTop: 8,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
  },
  fileRowOn: { borderColor: colors.primary, backgroundColor: '#E8F1FC' },
  input: {
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 14, color: colors.textPrimary, marginTop: 14,
  },
  btn: { marginTop: 18 },
  btnAlt: { marginTop: 10 },
});
