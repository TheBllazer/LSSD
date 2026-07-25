import { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { MdPersonAdd, MdPersonRemove, MdLaunch, MdSwapHoriz } from 'react-icons/md';
import Panel from '@/components/system/Panel';
import KeyValueRow from '@/components/system/KeyValueRow';
import StatusChip from '@/components/system/StatusChip';
import Avatar from '@/components/media/Avatar';
import { CitizenAutocomplete } from '@/components/form/CitizenPicker';
import EmptyState from './EmptyState';
import { registryName, formatPhone } from '@/utils/format';
import { formatDate, computeAge } from '@/utils/dates';
import { CITIZEN_STATUS_LABELS } from '@/types/citizens';

/**
 * Panneau de rattachement d'un bien à un citoyen.
 *
 * Partagé par les véhicules et les armes : dans les deux cas il s'agit de la
 * même opération — désigner, remplacer ou retirer un titulaire — avec les mêmes
 * conséquences sur les compteurs et les chronologies.
 *
 * Le rattachement n'est jamais implicite : l'agent choisit une fiche, confirme,
 * et l'événement est écrit des deux côtés.
 *
 * @param {object} props
 * @param {object|null} props.owner        Fiche citoyen rattachée
 * @param {object|null} props.snapshot     Instantané conservé sur le bien
 * @param {(citizen: object|null) => void} props.onAssign
 * @param {(citizenId: string) => void} props.onOpenOwner
 * @param {boolean} props.readOnly
 * @param {boolean} [props.busy]
 * @param {string} [props.title='Propriétaire']
 * @param {string} [props.emptyMessage]
 * @param {React.ReactNode} [props.extra]  Contenu additionnel (alerte de permis…)
 */
export default function OwnerAssignment({
  owner,
  snapshot,
  onAssign,
  onOpenOwner,
  readOnly,
  busy = false,
  title = 'Propriétaire',
  emptyMessage = "Ce bien n'est rattaché à aucun citoyen du registre.",
  extra,
}) {
  const [candidate, setCandidate] = useState(null);
  const [changing, setChanging] = useState(false);

  const confirmAssign = () => {
    onAssign(candidate);
    setCandidate(null);
    setChanging(false);
  };

  return (
    <Stack spacing={2} sx={{ maxWidth: 720 }}>
      {extra}

      <Panel title={title} icon={<MdPersonAdd />}>
        {owner ? (
          <>
            <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 1.5 }}>
              <Avatar person={owner} size={64} />

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                    {registryName(owner)}
                  </Typography>
                  <StatusChip
                    status={owner.status}
                    label={CITIZEN_STATUS_LABELS[owner.status] ?? owner.status}
                  />
                </Stack>

                <KeyValueRow
                  label="Naissance"
                  labelWidth={100}
                  value={
                    owner.birthDate
                      ? `${formatDate(owner.birthDate)} (${computeAge(owner.birthDate)} ans)`
                      : null
                  }
                />
                <KeyValueRow
                  label="Téléphone"
                  labelWidth={100}
                  value={owner.phone ? formatPhone(owner.phone) : null}
                  mono
                />
                <KeyValueRow
                  label="Adresse"
                  labelWidth={100}
                  value={
                    [owner.address?.street, owner.address?.district]
                      .filter(Boolean)
                      .join(', ') || null
                  }
                />
              </Box>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<MdLaunch />}
                onClick={() => onOpenOwner(owner.id)}
              >
                Ouvrir la fiche citoyen
              </Button>

              {!readOnly && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<MdSwapHoriz />}
                    onClick={() => setChanging((value) => !value)}
                    disabled={busy}
                  >
                    Changer de titulaire
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<MdPersonRemove />}
                    onClick={() => onAssign(null)}
                    disabled={busy}
                  >
                    Retirer
                  </Button>
                </>
              )}
            </Stack>
          </>
        ) : (
          <>
            {snapshot && (
              /*
               * L'instantané survit à l'archivage du citoyen : on le montre
               * plutôt que d'afficher « aucun propriétaire », ce qui serait faux.
               */
              <Box
                sx={{
                  p: 1.25,
                  mb: 1.5,
                  border: '1px dashed',
                  borderColor: 'warning.main',
                  borderRadius: '3px',
                }}
              >
                <Typography sx={{ fontSize: 12, color: 'warning.main' }}>
                  Dernier titulaire connu : <strong>{snapshot.label}</strong> — sa fiche
                  n'est plus accessible dans le registre.
                </Typography>
              </Box>
            )}

            {!snapshot && (
              <EmptyState title="Aucun titulaire" message={emptyMessage} />
            )}
          </>
        )}

        {!readOnly && (!owner || changing) && (
          <Box
            sx={{
              mt: 2,
              pt: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography className="label-caps" sx={{ display: 'block', mb: 1 }}>
              {owner ? 'Nouveau titulaire' : 'Rattacher à un citoyen'}
            </Typography>

            <Stack direction="row" spacing={1.25} alignItems="flex-start">
              <Box sx={{ flex: 1 }}>
                <CitizenAutocomplete
                  value={candidate}
                  onChange={setCandidate}
                  label="Citoyen"
                  disabled={busy}
                />
              </Box>
              <Button
                variant="contained"
                startIcon={<MdPersonAdd />}
                onClick={confirmAssign}
                disabled={!candidate || busy}
                sx={{ mt: 0.25 }}
              >
                {busy ? 'Enregistrement…' : 'Rattacher'}
              </Button>
            </Stack>
          </Box>
        )}
      </Panel>
    </Stack>
  );
}
