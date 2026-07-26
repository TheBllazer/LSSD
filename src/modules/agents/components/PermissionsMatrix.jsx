import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { MdShield, MdSave, MdRestartAlt } from 'react-icons/md';
import Panel from '@/components/system/Panel';
import {
  PERMISSION_GROUPS,
  ROLE_LABELS,
  ROLE_DEFAULTS,
  ROLE_LEVELS,
  compileAbilities,
  levelOf,
} from '@/utils/permissions';

/**
 * Matrice des habilitations d'un agent.
 *
 * L'écran distingue trois états pour chaque permission : **héritée** du rôle
 * (case grise cochée), **accordée** en dérogation (bleu), **retirée** malgré
 * le rôle (rouge). Cocher ou décocher ne fait qu'ajouter une dérogation — le
 * rôle reste la référence, ce qui permet de tout réaligner d'un clic.
 *
 * La liste effective est recompilée à l'enregistrement : c'est elle, et elle
 * seule, que lisent les règles Firestore.
 *
 * @param {object} props
 * @param {object} props.permissions Document `/permissions/{uid}` courant
 * @param {boolean} props.isSelf     L'agent consulte-t-il sa propre fiche
 * @param {string} props.myRole      Rôle de l'agent connecté
 * @param {boolean} props.readOnly
 * @param {(payload: object) => void} props.onSave
 * @param {boolean} [props.saving]
 */
export default function PermissionsMatrix({
  permissions,
  isSelf,
  myRole,
  readOnly,
  onSave,
  saving = false,
}) {
  const [role, setRole] = useState(permissions?.role ?? 'DEPUTY');
  const [grants, setGrants] = useState(permissions?.grants ?? []);
  const [revokes, setRevokes] = useState(permissions?.revokes ?? []);

  /** Permissions effectives telles qu'elles seront écrites. */
  const effective = useMemo(
    () => new Set(compileAbilities({ role, grants, revokes })),
    [role, grants, revokes],
  );

  const inherited = useMemo(() => new Set(ROLE_DEFAULTS[role] ?? []), [role]);

  // On ne modifie jamais quelqu'un de rang supérieur ou égal au sien.
  const outranked = ROLE_LEVELS[permissions?.role] < levelOf(myRole);
  const locked = readOnly || isSelf || !outranked;

  const toggle = (code) => {
    if (locked) return;
    const isInherited = inherited.has(code);
    const isActive = effective.has(code);

    if (isActive) {
      // Retirer : dérogation négative si héritée, sinon on annule l'ajout.
      if (isInherited) setRevokes((current) => [...current, code]);
      else setGrants((current) => current.filter((value) => value !== code));
      return;
    }
    // Accorder : lever le retrait si c'en était un, sinon dérogation positive.
    if (revokes.includes(code)) setRevokes((current) => current.filter((v) => v !== code));
    else setGrants((current) => [...current, code]);
  };

  const reset = () => {
    setGrants([]);
    setRevokes([]);
  };

  const dirty =
    role !== permissions?.role ||
    JSON.stringify([...grants].sort()) !== JSON.stringify([...(permissions?.grants ?? [])].sort()) ||
    JSON.stringify([...revokes].sort()) !== JSON.stringify([...(permissions?.revokes ?? [])].sort());

  return (
    <Stack spacing={1.5}>
      {isSelf && (
        <Alert severity="warning" sx={{ fontSize: 12.5 }}>
          Vous consultez vos propres habilitations. Personne ne peut modifier ses
          propres droits — les règles Firestore le refusent, quelle que soit
          l'interface.
        </Alert>
      )}

      {!isSelf && !outranked && !readOnly && (
        <Alert severity="warning" sx={{ fontSize: 12.5 }}>
          Cet agent est d'un rang supérieur ou égal au vôtre : vous ne pouvez pas
          modifier ses habilitations.
        </Alert>
      )}

      <Panel title="Rôle" icon={<MdShield />} dense>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <TextField
            select
            label="Habilitation"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            disabled={locked}
            sx={{ width: 240 }}
          >
            {Object.entries(ROLE_LABELS)
              .filter(([value]) => ROLE_LEVELS[value] < levelOf(myRole) || value === role)
              .map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
          </TextField>

          <Typography className="mono" sx={{ fontSize: 12, color: 'primary.main' }}>
            {effective.size} permission(s)
          </Typography>

          <Box sx={{ flex: 1 }} />

          {!locked && (
            <>
              <Button
                variant="outlined"
                startIcon={<MdRestartAlt />}
                onClick={reset}
                disabled={grants.length === 0 && revokes.length === 0}
              >
                Réaligner sur le rôle
              </Button>
              <Button
                variant="contained"
                startIcon={<MdSave />}
                onClick={() => onSave({ role, grants, revokes })}
                disabled={!dirty || saving}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </>
          )}
        </Stack>
      </Panel>

      {PERMISSION_GROUPS.map((group) => (
        <Panel key={group.id} title={group.label} dense>
          {group.permissions.map((permission) => {
            const active = effective.has(permission.code);
            const isInherited = inherited.has(permission.code);
            const isGranted = grants.includes(permission.code);
            const isRevoked = revokes.includes(permission.code);

            const state = isRevoked
              ? { label: 'Retirée', color: 'error.main' }
              : isGranted
                ? { label: 'Accordée', color: 'primary.main' }
                : isInherited
                  ? { label: 'Héritée du rôle', color: 'text.disabled' }
                  : { label: '—', color: 'text.disabled' };

            return (
              <Stack
                key={permission.code}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  py: 0.375,
                  borderBottom: '1px dashed',
                  borderColor: 'var(--line-soft)',
                  '&:last-of-type': { borderBottom: 'none' },
                }}
              >
                <Checkbox
                  size="small"
                  checked={active}
                  onChange={() => toggle(permission.code)}
                  disabled={locked}
                  sx={{
                    p: 0.5,
                    color: isRevoked ? 'error.main' : isGranted ? 'primary.main' : undefined,
                  }}
                />

                <Typography sx={{ fontSize: 12, flex: 1 }}>{permission.label}</Typography>

                <Tooltip title={permission.code}>
                  <Typography
                    className="mono"
                    sx={{ fontSize: 10, color: 'text.disabled', width: 150 }}
                    noWrap
                  >
                    {permission.code}
                  </Typography>
                </Tooltip>

                <Typography sx={{ fontSize: 10.5, color: state.color, width: 110 }}>
                  {state.label}
                </Typography>
              </Stack>
            );
          })}
        </Panel>
      ))}
    </Stack>
  );
}
