import {
  currentPatient, familyRoles, familyScopes, minors, patientModules,
} from './mock';
import type { ScopeKind } from '../scope/PatientScope';

/**
 * Who the current user may act for, and on what.
 *
 * Three kinds:
 *   • self   — always allowed, everything.
 *   • minor  — a login-less sub-profile; the guardian has full access.
 *   • linked — another adult's account, bounded by the role THEY granted me.
 *
 * `module` is a key from the backend catalog (see mock.patientModules). Linked
 * people are only selectable when their role actually grants that module, so a
 * screen can never offer an account the role doesn't cover.
 */
export type Person = {
  id: string;
  kind: ScopeKind;
  name: string;
  avatar: string;
  subtitle: string;
  allowed: boolean;
  /** Shown on disabled rows so the block is explainable, not mysterious. */
  reason?: string;
  roleName?: string | null;
};

export const SELF_ID = 'self';

const roleAllows = (roleId: string | null | undefined, module: string, verb: 'view' | 'manage') => {
  const role = familyRoles.find((r) => r.id === roleId);
  if (!role) return false;
  const p = role.permissions.find((x) => x.module === module);
  if (!p) return false;
  return verb === 'manage' ? p.can_manage : p.can_view;
};

export function peopleFor(opts: {
  includeMinors?: boolean;
  includeLinked?: boolean;
  module?: string;
  verb?: 'view' | 'manage';
} = {}): Person[] {
  const { includeMinors = true, includeLinked = false, module, verb = 'view' } = opts;

  const out: Person[] = [{
    id: SELF_ID,
    kind: 'self',
    name: currentPatient.full_name,
    avatar: currentPatient.avatar,
    subtitle: 'You',
    allowed: true,
  }];

  if (includeMinors) {
    minors.forEach((m) => out.push({
      id: m.id,
      kind: 'minor',
      name: m.full_name,
      avatar: m.avatar,
      subtitle: `${m.relation} · minor`,
      // A guardian has full access to their own minor.
      allowed: true,
    }));
  }

  if (includeLinked) {
    familyScopes.linked.forEach((l) => {
      const ok = !module || roleAllows(l.role_id, module, verb);
      const label = module ? patientModules.find((p) => p.key === module)?.label ?? module : '';
      out.push({
        id: l.id,
        kind: 'linked',
        name: l.name,
        avatar: l.avatar,
        subtitle: `${l.relation} · ${l.role_name}`,
        allowed: ok,
        reason: ok ? undefined : `Their role doesn't grant ${label.toLowerCase()}`,
        roleName: l.role_name,
      });
    });
  }

  return out;
}

export const findPerson = (people: Person[], id: string) =>
  people.find((p) => p.id === id) ?? people[0];

/** Every module a linked account's role grants me, for the access summary. */
export function grantedModules(roleId: string | null | undefined) {
  const role = familyRoles.find((r) => r.id === roleId);
  if (!role) return [];
  return role.permissions
    .filter((p) => p.can_view || p.can_manage)
    .map((p) => ({
      label: patientModules.find((m) => m.key === p.module)?.label ?? p.module,
      canManage: p.can_manage,
    }));
}
