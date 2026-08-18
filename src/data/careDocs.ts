import { serviceChannels, ServiceChannel } from './channels';
import { planBookings, prescriptions } from './mock';

/**
 * Everything a provider shared with the patient over the life of one booking.
 *
 * The web scatters these across the service channel's Documents panel and the
 * plan's own document list; a patient looking for "the report my doctor sent
 * me in week 6" doesn't care which table it came from, so they're merged here
 * and labelled by who sent them.
 *
 * Only the provider's uploads count — the patient's own files are already in
 * their Documents tab and echoing them back as "shared with you" would be
 * confusing.
 */

export type CareDoc = {
  id: string;
  fileName: string;
  from: string;
  note?: string;
  date?: string;
  source: 'Conversation' | 'Care team';
};

export function careDocsFor(opts: { name?: string; channel?: ServiceChannel | null }): CareDoc[] {
  const { name = '', channel = null } = opts;
  const out: CareDoc[] = [];

  // Anything the provider uploaded into the conversation.
  const channels = channel?.groupId
    ? serviceChannels.filter((c) => c.groupId === channel.groupId)
    : channel ? [channel] : [];

  channels.forEach((c) => {
    c.documents
      .filter((d) => d.uploadedBy !== 'You')
      .forEach((d) => out.push({
        id: `ch-${d.id}`,
        fileName: d.fileName,
        from: d.uploadedBy,
        date: d.uploadedOn,
        source: 'Conversation',
      }));
  });

  // Anything the care team attached to the plan itself.
  const key = name.split('—')[0].split('–')[0].trim().toLowerCase().slice(0, 12);
  if (key) {
    planBookings
      .filter((b) => b.plan_name.toLowerCase().includes(key))
      .forEach((b) => b.documents.forEach((d) => out.push({
        id: `pb-${d.id}`,
        fileName: d.file_name,
        from: d.doctor_name,
        note: d.note,
        source: 'Care team',
      })));
  }

  return out;
}

/** Prescriptions written against this booking, for the completed view. */
export function prescriptionsFor(providerName?: string) {
  if (!providerName) return prescriptions.slice(0, 1);
  const hit = prescriptions.filter((p) => p.doctor_name === providerName);
  return hit.length ? hit : prescriptions.slice(0, 1);
}
