import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Web-only keyboard listener that invokes `onClose` when the user
 * presses the Escape key. No-op on native.
 *
 * Pass `enabled` to activate the listener only when the overlay/modal is open.
 */
export function useEscapeKey(enabled: boolean, onClose: () => void): void {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        console.log('[useEscapeKey] Escape pressed, closing overlay');
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [enabled, onClose]);
}

export default useEscapeKey;
