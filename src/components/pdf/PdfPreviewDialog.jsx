import { useEffect, useMemo, useState } from 'react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  Stack,
  Typography,
} from '@mui/material';
import { MdPictureAsPdf, MdDownload, MdClose, MdErrorOutline } from 'react-icons/md';
import TitleBar from '@/components/system/TitleBar';
import useAuth from '@/hooks/auth/useAuth';
import { logAudit } from '@/services/audit.service';
import { AUDIT_ACTIONS } from '@/types/agents';
import { env } from '@/app/config/env';
import { formatDateTime } from '@/utils/dates';
import { renderTemplate, templateFilename } from '@/pdf';

/**
 * Aperçu et téléchargement d'un document officiel.
 *
 * Ce composant tire tout le moteur PDF (~400 ko) : il est donc lui-même
 * importé à la demande par les fiches, jamais au démarrage.
 *
 * Chaque extraction est journalisée et le pied de page du document porte la
 * même information — un document qui circule reste attribuable à l'agent qui
 * l'a produit.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} props.templateId
 * @param {object} props.data          Données attendues par le modèle
 * @param {string} props.entityType    Type journalisé
 * @param {string} props.entityId
 * @param {string} props.entityLabel
 */
export default function PdfPreviewDialog({
  open,
  onClose,
  templateId,
  data,
  entityType,
  entityId,
  entityLabel,
}) {
  const { user, signature } = useAuth();
  const [logged, setLogged] = useState(false);
  const [error, setError] = useState(null);

  /** Contexte commun à tous les documents. */
  const context = useMemo(
    () => ({
      agency: env.app.agency,
      logoUrl: `${window.location.origin}${env.basePath}brand/lssd-star.svg`,
      generatedBy: signature || 'Agent',
      generatedAt: formatDateTime(new Date()),
    }),
    [signature],
  );

  /** Document composé, recalculé si les données changent. */
  const element = useMemo(() => {
    if (!open) return null;
    try {
      setError(null);
      return renderTemplate(templateId, { ...data, context });
    } catch (renderError) {
      setError(renderError);
      return null;
    }
  }, [open, templateId, data, context]);

  /**
   * Journalise l'extraction, une seule fois par ouverture.
   *
   * Déclenchée à l'ouverture de l'aperçu et non au téléchargement :
   * afficher un document confidentiel à l'écran est déjà une extraction, et
   * `PDFViewer` n'expose aucun événement de rendu sur lequel s'accrocher.
   */
  useEffect(() => {
    if (!open || logged || !user || !element) return;
    setLogged(true);
    logAudit(
      { uid: user.uid, name: signature },
      {
        action: AUDIT_ACTIONS.EXPORT,
        entityType,
        entityId,
        entityLabel,
        meta: { template: templateId, format: 'pdf' },
      },
    );
  }, [open, logged, user, element, signature, entityType, entityId, entityLabel, templateId]);

  // Une réouverture doit produire une nouvelle trace.
  useEffect(() => {
    if (!open) setLogged(false);
  }, [open]);

  const filename = templateFilename(templateId, data);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{ paper: { sx: { height: '92vh' } } }}
    >
      <TitleBar icon={<MdPictureAsPdf />} title="Aperçu du document" onClose={onClose} />

      <Box sx={{ flex: 1, minHeight: 0, bgcolor: '#3A3A3A' }}>
        {error ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{ height: '100%', p: 3, textAlign: 'center' }}
          >
            <MdErrorOutline size={26} color="#E36258" />
            <Typography sx={{ color: '#FFFFFF', fontSize: 13 }}>
              Le document n'a pas pu être composé.
            </Typography>
            <Typography sx={{ color: '#CCCCCC', fontSize: 11 }}>{error.message}</Typography>
          </Stack>
        ) : element ? (
          <PDFViewer width="100%" height="100%" showToolbar={false} >
            {element}
          </PDFViewer>
        ) : (
          <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ height: '100%' }}>
            <CircularProgress size={28} />
            <Typography variant="caption" sx={{ color: '#DDDDDD' }}>
              Composition du document…
            </Typography>
          </Stack>
        )}
      </Box>

      <DialogActions sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ flex: 1 }}>
          Extrait par {context.generatedBy} le {context.generatedAt} — cette extraction est
          journalisée.
        </Typography>

        <Button variant="outlined" startIcon={<MdClose />} onClick={onClose}>
          Fermer
        </Button>

        {element && (
          <PDFDownloadLink
            document={element}
            fileName={filename}
            style={{ textDecoration: 'none' }}
          >
            {({ loading }) => (
              <Button
                variant="contained"
                startIcon={<MdDownload />}
                disabled={loading}
              >
                {loading ? 'Préparation…' : 'Télécharger'}
              </Button>
            )}
          </PDFDownloadLink>
        )}
      </DialogActions>
    </Dialog>
  );
}
