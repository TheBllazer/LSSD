import { useState } from 'react';
import { Box, IconButton, InputAdornment, LinearProgress, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { MdVisibility, MdVisibilityOff, MdCasino, MdContentCopy, MdCheck } from 'react-icons/md';
import toast from 'react-hot-toast';
import { generatePassword, validatePassword, passwordStrength } from '@/utils/password';

/** Teintes de la jauge, du plus faible au plus solide. */
const TONES = ['error', 'error', 'warning', 'success'];

/**
 * Champ de saisie d'un mot de passe de service.
 *
 * Un mot de passe que l'on doit **transmettre** ne se traite pas comme un mot
 * de passe que l'on saisit pour soi : il faut pouvoir le lire pour le dicter,
 * le copier sans faute de frappe, et en tirer un au hasard plutôt que de
 * réutiliser toujours le même. D'où la révélation, la copie et le tirage —
 * absents d'un champ de connexion, indispensables ici.
 *
 * @param {object} props
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {string} [props.label]
 * @param {string} [props.helperText]
 * @param {boolean} [props.showTools=true]  Tirage aléatoire et copie
 * @param {boolean} [props.showStrength=true]
 * @param {boolean} [props.autoFocus]
 * @param {string} [props.autoComplete='new-password']
 */
export default function PasswordField({
  value,
  onChange,
  label = 'Mot de passe',
  helperText,
  showTools = true,
  showStrength = true,
  autoFocus = false,
  autoComplete = 'new-password',
}) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [touched, setTouched] = useState(false);

  const check = validatePassword(value);
  const strength = passwordStrength(value);
  const showError = touched && value.length > 0 && !check.ok;

  const roll = () => {
    const next = generatePassword();
    onChange(next);
    // Un mot de passe tiré au hasard doit être lu pour être transmis :
    // le masquer juste après l'avoir généré n'aurait aucun sens.
    setVisible(true);
    setCopied(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Mot de passe copié.');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copie impossible. Sélectionnez le texte manuellement.');
    }
  };

  return (
    <Box>
      <TextField
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setTouched(true)}
        type={visible ? 'text' : 'password'}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        error={showError}
        helperText={showError ? check.message : helperText}
        fullWidth
        slotProps={{
          input: {
            sx: { fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' },
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title={visible ? 'Masquer' : 'Afficher'}>
                  <IconButton size="small" onClick={() => setVisible((state) => !state)} edge="end">
                    {visible ? <MdVisibilityOff size={17} /> : <MdVisibility size={17} />}
                  </IconButton>
                </Tooltip>

                {showTools && (
                  <>
                    <Tooltip title="Copier">
                      <span>
                        <IconButton size="small" onClick={copy} disabled={!value} edge="end">
                          {copied ? <MdCheck size={17} /> : <MdContentCopy size={16} />}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Générer un mot de passe">
                      <IconButton size="small" onClick={roll} edge="end">
                        <MdCasino size={18} />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </InputAdornment>
            ),
          },
        }}
      />

      {showStrength && value.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
          <LinearProgress
            variant="determinate"
            value={(strength.score / 3) * 100}
            color={TONES[strength.score]}
            sx={{ flex: 1, height: 3, borderRadius: 2 }}
          />
          <Typography
            sx={{ fontSize: 10.5, minWidth: 70, textAlign: 'right', color: `${TONES[strength.score]}.main` }}
          >
            {strength.label}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
