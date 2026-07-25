import { Component } from 'react';
import { Box, Button, Typography, Stack } from '@mui/material';
import { MdErrorOutline, MdRefresh, MdContentCopy } from 'react-icons/md';
import { env } from '@/app/config/env';

/**
 * Frontière d'erreur de rendu.
 *
 * Une exception non capturée dans un module ne doit jamais laisser un écran
 * noir : on affiche un écran « défaillance système » cohérent avec le reste du
 * logiciel, avec le détail technique copiable pour le support.
 *
 * @param {{ children: React.ReactNode, scope?: string }} props
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error(`[LSSD] Défaillance (${this.props.scope || 'global'}) :`, error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleCopy = () => {
    const { error, info } = this.state;
    const payload = [
      `LSSD RMS ${env.app.version} — ${new Date().toISOString()}`,
      `Périmètre : ${this.props.scope || 'global'}`,
      `Erreur : ${error?.message}`,
      error?.stack,
      info?.componentStack,
    ]
      .filter(Boolean)
      .join('\n');
    navigator.clipboard?.writeText(payload);
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <Box
        className="tech-grid"
        sx={{
          height: '100%',
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <Box
          sx={{
            maxWidth: 640,
            width: '100%',
            border: '1px solid',
            borderColor: 'error.main',
            bgcolor: 'background.paper',
            borderRadius: '4px',
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              px: 1.75,
              py: 1.25,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'rgba(192,57,43,0.12)',
            }}
          >
            <MdErrorOutline size={18} color="#C0392B" />
            <Typography variant="h6" sx={{ color: 'error.main' }}>
              Défaillance du module
            </Typography>
          </Stack>

          <Box sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              Le module{' '}
              <strong>{this.props.scope || 'application'}</strong> a rencontré une
              erreur et a été arrêté pour préserver l'intégrité de la session. Aucune
              donnée n'a été perdue : les enregistrements en cours sont conservés
              côté serveur.
            </Typography>

            <Box
              className="mono selectable"
              sx={{
                p: 1.25,
                fontSize: 11.5,
                color: 'text.secondary',
                bgcolor: 'var(--lssd-palette-background-default, #0A0F1A)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '3px',
                maxHeight: 180,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {error.message}
              {env.isDev && error.stack ? `\n\n${error.stack}` : ''}
            </Box>

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<MdRefresh />}
                onClick={this.handleReload}
              >
                Redémarrer le terminal
              </Button>
              <Button
                variant="outlined"
                startIcon={<MdContentCopy />}
                onClick={this.handleCopy}
              >
                Copier le rapport technique
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    );
  }
}
