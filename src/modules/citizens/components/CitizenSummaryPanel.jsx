import { Box, Stack, Typography } from '@mui/material';
import {
  MdDirectionsCar,
  MdDescription,
  MdGavel,
  MdPhotoLibrary,
  MdWarning,
  MdCreditCard,
  MdGroups,
} from 'react-icons/md';
import { GiPistolGun } from 'react-icons/gi';
import Panel from '@/components/system/Panel';
import KeyValueRow from '@/components/system/KeyValueRow';
import { SeverityChip } from '@/components/system/StatusChip';
import { formatDate, formatRelative, computeAge } from '@/utils/dates';
import {
  CITIZEN_FLAG_LABELS,
  LICENSE_TYPE_LABELS,
  LICENSE_STATUS,
  LICENSE_STATUS_LABELS,
  AFFILIATION_TYPE_LABELS,
} from '@/types/citizens';

/**
 * Compteur de dossier, avec son icône.
 * @param {{ icon: React.ReactNode, label: string, value: number }} props
 */
function CounterRow({ icon, label, value }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.375 }}>
      <Box sx={{ display: 'flex', fontSize: 14, color: 'text.secondary' }}>{icon}</Box>
      <Typography sx={{ fontSize: 12, flex: 1 }}>{label}</Typography>
      <Typography
        className="mono"
        sx={{ fontSize: 12, color: value > 0 ? 'primary.main' : 'text.disabled' }}
      >
        {value ?? 0}
      </Typography>
    </Stack>
  );
}

/**
 * Panneau de synthèse de la fiche citoyen.
 *
 * Affiché en permanence à droite, quel que soit l'onglet : signalements,
 * volume du dossier, validité des permis, affiliations. C'est ce qu'un agent
 * doit pouvoir lire d'un coup d'œil avant d'engager un contact.
 *
 * @param {object} props
 * @param {object} props.citizen
 * @param {number} [props.photoCount]
 */
export default function CitizenSummaryPanel({ citizen, photoCount = 0 }) {
  const counters = citizen.counters ?? {};
  const flags = citizen.flags ?? [];
  const licenses = citizen.licenses ?? [];
  const affiliations = citizen.affiliations ?? [];
  const age = computeAge(citizen.birthDate);

  return (
    <Stack spacing={1.5}>
      {flags.length > 0 && (
        <Panel
          title="Signalements"
          icon={<MdWarning />}
          sx={{ borderColor: 'error.main' }}
          dense
        >
          <Stack spacing={0.625}>
            {flags.map((flag) => (
              <SeverityChip
                key={flag}
                label={CITIZEN_FLAG_LABELS[flag] ?? flag}
                icon={<MdWarning size={11} />}
              />
            ))}
          </Stack>
        </Panel>
      )}

      <Panel title="Dossier" dense>
        <CounterRow
          icon={<MdDescription />}
          label="Rapports"
          value={counters.reports ?? 0}
        />
        <CounterRow icon={<MdGavel />} label="Casiers" value={counters.records ?? 0} />
        <CounterRow
          icon={<MdDirectionsCar />}
          label="Véhicules"
          value={counters.vehicles ?? 0}
        />
        <CounterRow icon={<GiPistolGun />} label="Armes" value={counters.weapons ?? 0} />
        <CounterRow icon={<MdPhotoLibrary />} label="Photographies" value={photoCount} />
      </Panel>

      <Panel title="État civil" dense>
        <KeyValueRow
          label="Naissance"
          labelWidth={92}
          value={
            citizen.birthDate
              ? `${formatDate(citizen.birthDate)}${age !== null ? ` (${age} ans)` : ''}`
              : null
          }
        />
        <KeyValueRow
          label="Signalement"
          labelWidth={92}
          value={
            [
              citizen.height ? `${citizen.height} cm` : null,
              citizen.weight ? `${citizen.weight} kg` : null,
            ]
              .filter(Boolean)
              .join(' · ') || null
          }
        />
        <KeyValueRow
          label="Domicile"
          labelWidth={92}
          value={citizen.address?.district ?? citizen.address?.street ?? null}
        />
        <KeyValueRow
          label="Mise à jour"
          labelWidth={92}
          value={citizen.updatedAt ? formatRelative(citizen.updatedAt) : null}
        />
      </Panel>

      <Panel title="Permis" icon={<MdCreditCard />} dense>
        {licenses.length === 0 ? (
          <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
            Aucun permis enregistré.
          </Typography>
        ) : (
          licenses.map((license, index) => {
            const valid = license.status === LICENSE_STATUS.VALID;
            return (
              <Stack
                key={`${license.type}-${index}`}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ py: 0.375 }}
              >
                <Typography sx={{ fontSize: 11.5, flex: 1 }} noWrap>
                  {LICENSE_TYPE_LABELS[license.type] ?? license.type}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: valid ? 'success.main' : 'warning.main',
                  }}
                >
                  {LICENSE_STATUS_LABELS[license.status] ?? license.status}
                </Typography>
              </Stack>
            );
          })
        )}
      </Panel>

      <Panel title="Affiliations" icon={<MdGroups />} dense>
        {affiliations.length === 0 ? (
          <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
            Aucune affiliation connue.
          </Typography>
        ) : (
          affiliations.map((affiliation, index) => (
            <Box key={`${affiliation.name}-${index}`} sx={{ py: 0.375 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                {affiliation.name}
              </Typography>
              <Typography sx={{ fontSize: 10.5, color: 'text.secondary' }}>
                {AFFILIATION_TYPE_LABELS[affiliation.type] ?? affiliation.type}
                {affiliation.role ? ` · ${affiliation.role}` : ''}
              </Typography>
            </Box>
          ))
        )}
      </Panel>
    </Stack>
  );
}
