import { Avatar as MuiAvatar } from '@mui/material';
import { initials } from '@/utils/format';

/**
 * Vignette d'identité.
 *
 * Les photos sont de simples URL distantes (PostImage) : si l'image est
 * indisponible ou absente, on retombe sur les initiales — jamais sur une image
 * cassée.
 *
 * @param {object} props
 * @param {{firstName?: string, lastName?: string, photoUrl?: string}|null} props.person
 * @param {number} [props.size=32]
 * @param {'circular'|'rounded'|'square'} [props.variant='rounded']
 * @param {object} [props.sx]
 */
export default function Avatar({ person, size = 32, variant = 'rounded', sx, ...rest }) {
  return (
    <MuiAvatar
      variant={variant}
      src={person?.photoUrl || undefined}
      alt=""
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        fontWeight: 700,
        letterSpacing: '0.04em',
        color: 'text.secondary',
        bgcolor: 'var(--steel-600)',
        border: '1px solid',
        borderColor: 'var(--line-strong)',
        borderRadius: variant === 'rounded' ? '3px' : undefined,
        ...sx,
      }}
      {...rest}
    >
      {initials(person)}
    </MuiAvatar>
  );
}
