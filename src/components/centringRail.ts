import { useRef, useState } from 'react';
import { LayoutChangeEvent, ScrollView } from 'react-native';

/**
 * A horizontal rail that keeps the selected chip in the middle.
 *
 * The My Bookings status rail set the pattern: whatever is chosen sits centre,
 * so both neighbours are visibly one flick away. Every chip rail — filters,
 * All/Individual/Team heads — now shares this hook instead of half of them
 * scrolling and half sitting still.
 */
export function useCentringRail() {
  const ref = useRef<ScrollView>(null);
  const railW = useRef(0);
  const chipAt = useRef<Record<string, { x: number; w: number }>>({});
  /**
   * Half the rail's width, applied as horizontal content padding by the
   * consumer. Without it the first and last chips can never physically reach
   * the middle — the scroll range simply ends too soon.
   */
  const [sidePad, setSidePad] = useState(0);

  const centre = (key: string) => {
    const l = chipAt.current[key];
    if (!l || !railW.current) return;
    ref.current?.scrollTo({
      x: Math.max(0, l.x + l.w / 2 - railW.current / 2),
      animated: true,
    });
  };

  return {
    ref,
    onRailLayout: (e: LayoutChangeEvent) => {
      railW.current = e.nativeEvent.layout.width;
      setSidePad(Math.round(e.nativeEvent.layout.width / 2));
    },
    sidePad,
    /** Attach per chip: onLayout={onChipLayout(key)}. */
    onChipLayout: (key: string) => (e: LayoutChangeEvent) => {
      chipAt.current[key] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width };
    },
    centre,
  };
}
