import { SupportStaffMember } from './mock';

/**
 * Caregivers added in-session.
 *
 * The web creates these server-side with a login of their own; this keeps them
 * in memory so the screen behaves — add one, see it listed, change its roles —
 * without inventing a second shape for the same person. They render through
 * SupportStaffMember, extended with the login and permission fields the web's
 * form collects.
 */

export type CaregiverDraft = {
  firstName: string;
  lastName: string;
  relation: string;
  email: string;
  password: string;
  roleIds: string[];
  canPay: boolean;
};

const added: SupportStaffMember[] = [];
let seq = 0;

export function addCaregiver(d: CaregiverDraft): SupportStaffMember {
  seq += 1;
  const member: SupportStaffMember = {
    id: `cg${seq}`,
    name: `${d.firstName.trim()} ${d.lastName.trim()}`.trim(),
    role: d.relation.trim() || 'Caregiver',
    avatar: `https://i.pravatar.cc/150?img=${20 + (seq % 40)}`,
    phone: '',
    email: d.email.trim(),
    roleIds: [...d.roleIds],
    canPay: d.canPay,
    /** Never the password itself — only that one was set, for the UI's sake. */
    invited: true,
  };
  added.push(member);
  return member;
}

export const caregivers = (): SupportStaffMember[] => added;

export function setCaregiverRoles(id: string, roleIds: string[], canPay: boolean) {
  const m = added.find((x) => x.id === id);
  if (!m) return;
  m.roleIds = [...roleIds];
  m.canPay = canPay;
}
