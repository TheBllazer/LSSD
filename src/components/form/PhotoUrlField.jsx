import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Box, InputAdornment, Stack, TextField as MuiTextField, Typography } from '@mui/material';
import { MdLink, MdContentPaste } from 'react-icons/md';
import PhotoPreview from '@/components/media/PhotoPreview';
import Lightbox from '@/components/media/Lightbox';
import { ALLOWED_IMAGE_HOSTS } from '@/app/config/constants';

/**
 * Saisie d'une URL de photographie, avec aperçu en direct.
 *
 * L'application ne stocke aucun fichier : une photo est une URL PostImage. Le
 * champ valide l'hébergeur et affiche immédiatement le rendu, pour que l'agent
 * constate son erreur au moment de la saisie plutôt qu'à l'impression du PDF.
 *
 * @param {object} props
 * @param {string} props.name
 * @param {string} [props.label='URL de la photographie']
 * @param {number} [props.previewWidth=96]
 * @param {number} [props.previewHeight=120]
 */
export default function PhotoUrlField({
  name,
  label = 'URL de la photographie',
  previewWidth = 96,
  previewHeight = 120,
}) {
  const { control } = useFormContext();
  const [zoomed, setZoomed] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        /** Colle le presse-papiers directement dans le champ. */
        const pasteFromClipboard = async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (text) field.onChange(text.trim());
          } catch {
            // Permission refusée : l'agent collera manuellement.
          }
        };

        return (
          <>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <PhotoPreview
                url={field.value}
                width={previewWidth}
                height={previewHeight}
                onClick={field.value ? () => setZoomed(true) : undefined}
              />

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <MuiTextField
                  {...field}
                  value={field.value ?? ''}
                  label={label}
                  placeholder={`https://${ALLOWED_IMAGE_HOSTS[0]}/…`}
                  error={Boolean(fieldState.error)}
                  helperText={
                    fieldState.error?.message ??
                    `Hébergeurs acceptés : ${ALLOWED_IMAGE_HOSTS.join(', ')}`
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <MdLink size={15} color="var(--muted-dim)" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <Box
                            component="button"
                            type="button"
                            onClick={pasteFromClipboard}
                            title="Coller depuis le presse-papiers"
                            sx={{
                              display: 'flex',
                              border: 'none',
                              background: 'none',
                              color: 'var(--muted)',
                              cursor: 'pointer',
                              p: 0.25,
                              '&:hover': { color: 'var(--text)' },
                            }}
                          >
                            <MdContentPaste size={15} />
                          </Box>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Typography variant="caption" sx={{ display: 'block', mt: 0.75 }}>
                  Téléversez le cliché sur PostImage, puis collez ici le lien direct
                  de l'image (celui qui se termine par une extension de fichier).
                </Typography>
              </Box>
            </Stack>

            <Lightbox
              open={zoomed}
              photos={field.value ? [{ url: field.value }] : []}
              index={0}
              onIndexChange={() => {}}
              onClose={() => setZoomed(false)}
            />
          </>
        );
      }}
    />
  );
}
