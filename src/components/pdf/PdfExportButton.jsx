import { Suspense, lazy, useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { MdPictureAsPdf } from 'react-icons/md';

/**
 * Le moteur PDF et ses modèles ne sont téléchargés qu'au premier clic :
 * une fiche consultée sans export ne paie rien.
 */
const PdfPreviewDialog = lazy(() => import('./PdfPreviewDialog'));

/**
 * Bouton d'export d'une fiche au format document officiel.
 *
 * @param {object} props
 * @param {string} props.templateId
 * @param {object} props.data
 * @param {string} props.entityType
 * @param {string} props.entityId
 * @param {string} props.entityLabel
 * @param {string} [props.label='Exporter en PDF']
 * @param {string} [props.variant='outlined']
 */
export default function PdfExportButton({
  templateId,
  data,
  entityType,
  entityId,
  entityLabel,
  label = 'PDF',
  variant = 'outlined',
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        startIcon={<MdPictureAsPdf />}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>

      {open && (
        <Suspense fallback={<CircularProgress size={18} sx={{ ml: 1 }} />}>
          <PdfPreviewDialog
            open={open}
            onClose={() => setOpen(false)}
            templateId={templateId}
            data={data}
            entityType={entityType}
            entityId={entityId}
            entityLabel={entityLabel}
          />
        </Suspense>
      )}
    </>
  );
}
