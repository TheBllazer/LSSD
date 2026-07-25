import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdVisibility,
  MdVisibilityOff,
  MdLogin,
  MdOutlineWarningAmber,
  MdMailOutline,
  MdLockOutline,
} from 'react-icons/md';
import AuthLayout from '@/layouts/AuthLayout';
import useAuth from '@/hooks/auth/useAuth';
import { AUTH_STATUS } from '@/contexts/authContext';
import { ROUTES, STORAGE_KEYS } from '@/app/config/constants';
import { env } from '@/app/config/env';

/**
 * Écran d'authentification.
 *
 * Comportement volontairement sobre : pas d'inscription, pas de lien public de
 * réinitialisation (réservée aux administrateurs), avertissement d'usage
 * restreint conforme aux terminaux de force de l'ordre.
 */
export default function LoginPage() {
  const { login, status, error } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState(
    () => window.localStorage.getItem(STORAGE_KEYS.LAST_EMAIL) || '',
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);

  const passwordRef = useRef(null);
  const emailRef = useRef(null);

  /**
   * Focus initial sur le premier champ vide.
   * Volontairement au montage uniquement : la valeur de `email` est lue une
   * fois, le focus ne doit pas sauter pendant la saisie.
   */
  const initialFocusRef = useRef(false);
  useEffect(() => {
    if (initialFocusRef.current) return;
    initialFocusRef.current = true;
    if (email) passwordRef.current?.focus();
    else emailRef.current?.focus();
  }, [email]);

  // Session déjà ouverte : on renvoie l'agent là où il voulait aller.
  if (status === AUTH_STATUS.AUTHENTICATED) {
    const target = location.state?.from ?? ROUTES.DASHBOARD;
    return <Navigate to={target} replace />;
  }

  const displayedError = localError || error;

  /** @param {React.FormEvent} event */
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError('Renseignez votre adresse e-mail et votre mot de passe.');
      setShakeKey((key) => key + 1);
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password, remember);
      window.localStorage.setItem(STORAGE_KEYS.LAST_EMAIL, email.trim().toLowerCase());
    } catch (loginError) {
      setLocalError(loginError.message);
      setPassword('');
      setShakeKey((key) => key + 1);
      passwordRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Box
        component={motion.div}
        key={shakeKey}
        initial={{ opacity: 0, y: 12 }}
        animate={
          shakeKey > 0 && displayedError
            ? { opacity: 1, y: 0, x: [0, -7, 6, -4, 2, 0] }
            : { opacity: 1, y: 0 }
        }
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        sx={{
          width: 420,
          border: '1px solid',
          borderColor: 'var(--line-strong)',
          borderRadius: '4px',
          bgcolor: 'var(--navy-800)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
          overflow: 'hidden',
        }}
      >
        {/* En-tête */}
        <Stack alignItems="center" spacing={1.25} sx={{ pt: 3.5, pb: 2.5, px: 3 }}>
          <Box
            component="img"
            src={`${env.basePath}brand/lssd-star.svg`}
            alt=""
            sx={{ width: 64, height: 64 }}
          />
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textAlign: 'center',
              textTransform: 'uppercase',
            }}
          >
            {env.app.agency}
          </Typography>
          <Typography
            sx={{
              fontSize: 10.5,
              letterSpacing: '0.22em',
              color: 'text.secondary',
              textTransform: 'uppercase',
            }}
          >
            Records Management System
          </Typography>
        </Stack>

        <Box sx={{ height: 1, bgcolor: 'divider' }} />

        {/* Formulaire */}
        <Box component="form" onSubmit={handleSubmit} sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={1.75}>
            <TextField
              inputRef={emailRef}
              label="Adresse e-mail"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdMailOutline size={15} color="var(--muted-dim)" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              inputRef={passwordRef}
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdLockOutline size={15} color="var(--muted-dim)" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={
                          showPassword
                            ? 'Masquer le mot de passe'
                            : 'Afficher le mot de passe'
                        }
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <MdVisibilityOff size={16} />
                        ) : (
                          <MdVisibility size={16} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  disabled={submitting}
                />
              }
              label={
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  Rester connecté sur ce terminal
                </Typography>
              }
            />

            <AnimatePresence>
              {displayedError && (
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  sx={{ overflow: 'hidden' }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{
                      p: 1,
                      border: '1px solid',
                      borderColor: 'error.main',
                      borderLeftWidth: 3,
                      borderRadius: '3px',
                      bgcolor: 'rgba(192,57,43,0.12)',
                    }}
                  >
                    <MdOutlineWarningAmber size={16} color="#E36258" />
                    <Typography sx={{ fontSize: 12, color: '#E36258' }}>
                      {displayedError}
                    </Typography>
                  </Stack>
                </Box>
              )}
            </AnimatePresence>

            <Box>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={submitting}
                startIcon={<MdLogin />}
                sx={{ height: 36, letterSpacing: '0.10em', fontWeight: 700 }}
              >
                {submitting ? 'Authentification…' : 'Authentification'}
              </Button>
              <Box sx={{ height: 2, mt: 0.5 }}>
                {submitting && <LinearProgress />}
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* Avertissement légal */}
        <Box
          sx={{
            px: 3,
            py: 1.75,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'var(--navy-850)',
          }}
        >
          <Typography
            sx={{
              fontSize: 10.5,
              lineHeight: 1.6,
              color: 'text.disabled',
              textAlign: 'center',
            }}
          >
            <Box component="span" sx={{ color: 'warning.main', fontWeight: 700 }}>
              SYSTÈME À ACCÈS RESTREINT.
            </Box>{' '}
            Réservé au personnel autorisé du {env.app.agency}. Toute activité est
            journalisée et susceptible d'audit. Tout accès non autorisé fera
            l'objet de poursuites.
          </Typography>
        </Box>
      </Box>
    </AuthLayout>
  );
}
