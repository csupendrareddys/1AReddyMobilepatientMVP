import { ProviderKind } from './providers';

/**
 * Providers the patient has marked as a favourite.
 *
 * A household comes back to the same few people: their child's paediatrician,
 * the clinic round the corner, the hospital that did the surgery. Making the
 * patient search for them again every time is the sort of friction that pushes
 * people to phone reception instead. A favourite is just a shortcut back to a
 * provider they've already chosen once.
 *
 * Keyed by kind + id so a doctor and a clinic can't collide.
 */

export type FavouriteRef = { kind: ProviderKind; id: string };

const keyOf = (kind: ProviderKind, id: string) => `${kind}:${id}`;

/** Seeded so the shelf has something to show before the patient adds any. */
const favourites = new Set<string>([
  'doctor:d1',
  'doctor:d5',
  'clinic:clinic-1',
  'hospital:hospital-1',
]);

export const isFavourite = (kind: ProviderKind, id: string) =>
  favourites.has(keyOf(kind, id));

export function toggleFavourite(kind: ProviderKind, id: string): boolean {
  const k = keyOf(kind, id);
  if (favourites.has(k)) {
    favourites.delete(k);
    return false;
  }
  favourites.add(k);
  return true;
}

export const favouriteRefs = (): FavouriteRef[] =>
  [...favourites].map((k) => {
    const [kind, id] = k.split(':');
    return { kind: kind as ProviderKind, id };
  });

export const favouriteCount = () => favourites.size;
