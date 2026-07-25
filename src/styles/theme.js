import { createTheme } from '@mui/material/styles';

/**
 * Palette LSSD — miroir exact de `src/styles/tokens.css`.
 * Exportée pour être réutilisée par le moteur PDF (qui ne peut pas lire le CSS).
 */
export const palette = {
  navy950: '#060A12',
  navy900: '#0A0F1A',
  navy850: '#0C1320',
  navy800: '#0E1626',
  navy750: '#111B2D',
  navy700: '#142033',
  steel600: '#1E2C42',
  steel500: '#27374F',
  steel400: '#33465F',
  line: '#22314A',
  lineStrong: '#2D405E',
  lineSoft: '#1A2639',
  text: '#E6EDF7',
  muted: '#8A9AB4',
  mutedDim: '#63738D',
  accent: '#2D7DD2',
  accentHover: '#3D8FE5',
  accentDim: '#1C5A9C',
  gold: '#C9A227',
  ok: '#1E8E5A',
  warn: '#D68910',
  danger: '#C0392B',
};

/** Durées d'animation partagées entre CSS et Framer Motion. */
export const motionTiming = {
  instant: 0.09,
  fast: 0.14,
  base: 0.18,
  slow: 0.26,
  easeOut: [0.16, 1, 0.3, 1],
};

/**
 * Thème MUI « poste de commandement ».
 *
 * Parti pris : densité élevée, angles quasi droits, aucune ombre décorative,
 * majuscules réservées aux libellés techniques. L'objectif est un rendu de
 * logiciel métier (Spillman / PremierOne), pas de site web.
 */
export const theme = createTheme({
  cssVariables: { cssVarPrefix: 'lssd' },

  palette: {
    mode: 'dark',
    primary: {
      main: palette.accent,
      dark: palette.accentDim,
      light: palette.accentHover,
      contrastText: '#FFFFFF',
    },
    secondary: { main: palette.gold, contrastText: palette.navy900 },
    success: { main: palette.ok },
    warning: { main: palette.warn },
    error: { main: palette.danger },
    info: { main: palette.accent },
    background: { default: palette.navy900, paper: palette.navy800 },
    text: {
      primary: palette.text,
      secondary: palette.muted,
      disabled: palette.mutedDim,
    },
    divider: palette.line,
    action: {
      hover: 'rgba(45, 125, 210, 0.08)',
      selected: 'rgba(45, 125, 210, 0.16)',
      focus: 'rgba(45, 125, 210, 0.20)',
      disabledOpacity: 0.38,
    },
  },

  shape: { borderRadius: 3 },

  typography: {
    fontFamily: "'Segoe UI', Inter, -apple-system, 'Helvetica Neue', sans-serif",
    fontSize: 13,
    htmlFontSize: 16,
    h1: { fontSize: 22, fontWeight: 600, letterSpacing: '0.01em' },
    h2: { fontSize: 18, fontWeight: 600, letterSpacing: '0.01em' },
    h3: { fontSize: 15, fontWeight: 600 },
    h4: { fontSize: 14, fontWeight: 600 },
    h5: { fontSize: 13, fontWeight: 600 },
    h6: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
    },
    body1: { fontSize: 13 },
    body2: { fontSize: 12 },
    caption: { fontSize: 11, color: palette.muted },
    button: { fontSize: 12, fontWeight: 600, textTransform: 'none' },
    overline: {
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.16em',
      lineHeight: 1.6,
    },
  },

  // Ombres neutralisées : seules quelques élévations ciblées sont utilisées.
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.4)',
    '0 2px 6px rgba(0,0,0,0.45)',
    '0 3px 10px rgba(0,0,0,0.5)',
    '0 6px 18px rgba(0,0,0,0.55)',
    ...Array(20).fill('0 18px 48px rgba(0,0,0,0.6)'),
  ],

  transitions: {
    duration: { shortest: 90, shorter: 140, short: 180, standard: 200 },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: palette.navy900 },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true, size: 'small' },
      styleOverrides: {
        root: {
          borderRadius: 3,
          minHeight: 30,
          paddingInline: 12,
          letterSpacing: '0.01em',
        },
        outlined: {
          borderColor: palette.lineStrong,
          '&:hover': {
            borderColor: palette.accent,
            backgroundColor: 'rgba(45,125,210,0.08)',
          },
        },
        contained: {
          '&:hover': { backgroundColor: palette.accentHover },
        },
        text: {
          '&:hover': { backgroundColor: 'rgba(45,125,210,0.08)' },
        },
      },
    },

    MuiIconButton: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          borderRadius: 3,
          color: palette.muted,
          '&:hover': { color: palette.text, backgroundColor: 'rgba(45,125,210,0.10)' },
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: palette.navy800,
          border: `1px solid ${palette.line}`,
        },
      },
    },

    MuiTooltip: {
      defaultProps: { arrow: true, enterDelay: 400 },
      styleOverrides: {
        tooltip: {
          backgroundColor: palette.navy700,
          border: `1px solid ${palette.lineStrong}`,
          fontSize: 11,
          padding: '5px 8px',
          borderRadius: 3,
        },
        arrow: { color: palette.navy700 },
      },
    },

    MuiDivider: {
      styleOverrides: { root: { borderColor: palette.line } },
    },

    MuiChip: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          borderRadius: 3,
          height: 20,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
        },
        outlined: { borderColor: palette.lineStrong },
      },
    },

    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined', fullWidth: true },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: palette.navy850,
          borderRadius: 3,
          fontSize: 13,
          '& fieldset': { borderColor: palette.line },
          '&:hover fieldset': { borderColor: palette.lineStrong },
          '&.Mui-focused fieldset': { borderColor: palette.accent, borderWidth: 1 },
        },
        input: { padding: '7px 10px' },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: palette.muted,
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.navy750,
          border: `1px solid ${palette.lineStrong}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
          borderRadius: 3,
        },
        list: { padding: 2 },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: 12,
          minHeight: 28,
          borderRadius: 2,
          gap: 8,
          '&:hover': { backgroundColor: 'rgba(45,125,210,0.12)' },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.navy800,
          border: `1px solid ${palette.lineStrong}`,
          borderRadius: 4,
          backgroundImage: 'none',
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '10px 14px',
          borderBottom: `1px solid ${palette.line}`,
          backgroundColor: palette.navy750,
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 34 },
        indicator: { height: 2, backgroundColor: palette.accent },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 34,
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: palette.muted,
          '&.Mui-selected': { color: palette.text },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: palette.lineSoft, fontSize: 12, padding: '6px 10px' },
        head: {
          backgroundColor: palette.navy750,
          color: palette.muted,
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 2, backgroundColor: palette.navy700 },
        bar: { backgroundColor: palette.accent },
      },
    },

    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
      styleOverrides: {
        root: { backgroundColor: palette.navy750, borderRadius: 3 },
      },
    },

    MuiTouchRipple: {
      styleOverrides: {
        // Ripple volontairement discret : présent mais jamais spectaculaire.
        child: { backgroundColor: 'rgba(45,125,210,0.45)' },
      },
    },
  },
});

export default theme;
