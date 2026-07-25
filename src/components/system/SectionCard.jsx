import { Box, Stack, Typography } from '@mui/material';

/**
 * Section de formulaire ou de fiche : titre discret souligné, contenu indenté.
 * Plus léger qu'un `Panel` — destiné à structurer l'intérieur d'un panneau.
 *
 * @param {object} props
 * @param {React.ReactNode} props.title
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} [props.actions]
 * @param {React.ReactNode} [props.description]
 * @param {React.ReactNode} props.children
 * @param {object} [props.sx]
 */
export default function SectionCard({ title, icon, actions, description, children, sx }) {
  return (
    <Box sx={{ mb: 2.25, ...sx }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.875}
        sx={{
          pb: 0.625,
          mb: 1.25,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {icon && (
          <Box sx={{ display: 'flex', color: 'primary.main', fontSize: 14 }}>{icon}</Box>
        )}
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          {title}
        </Typography>
        <Box sx={{ flex: 1 }} />
        {actions}
      </Stack>

      {description && (
        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
          {description}
        </Typography>
      )}

      {children}
    </Box>
  );
}
