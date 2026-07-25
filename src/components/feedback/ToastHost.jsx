import { Toaster } from 'react-hot-toast';
import { palette } from '@/styles/theme';
import { TIMING } from '@/app/config/constants';

/**
 * Hôte des notifications transitoires.
 *
 * Style aligné sur le chrome logiciel : panneau sombre, liseré coloré à gauche
 * selon la sévérité, coins quasi droits, aucune ombre décorative.
 */
export default function ToastHost() {
  const base = {
    background: palette.navy750,
    color: palette.text,
    border: `1px solid ${palette.lineStrong}`,
    borderLeftWidth: 3,
    borderRadius: 3,
    fontSize: 12.5,
    padding: '9px 12px',
    maxWidth: 420,
    boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
  };

  return (
    <Toaster
      position="bottom-right"
      gutter={8}
      containerStyle={{ bottom: 40, right: 16, zIndex: 1600 }}
      toastOptions={{
        duration: TIMING.TOAST_DURATION,
        style: { ...base, borderLeftColor: palette.accent },
        success: {
          style: { ...base, borderLeftColor: palette.ok },
          iconTheme: { primary: palette.ok, secondary: palette.navy900 },
        },
        error: {
          duration: 6000,
          style: { ...base, borderLeftColor: palette.danger },
          iconTheme: { primary: palette.danger, secondary: palette.navy900 },
        },
        loading: {
          style: { ...base, borderLeftColor: palette.warn },
          iconTheme: { primary: palette.warn, secondary: palette.navy900 },
        },
      }}
    />
  );
}
