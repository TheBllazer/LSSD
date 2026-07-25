import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/styles/theme';

/**
 * Applique le thème MUI « poste de commandement » et la normalisation CSS.
 * Un seul thème existe : l'application n'a pas de mode clair (contrainte
 * d'un logiciel opérationnel utilisé en véhicule et de nuit).
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function AppThemeProvider({ children }) {
  return (
    <ThemeProvider theme={theme} defaultMode="dark">
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}
