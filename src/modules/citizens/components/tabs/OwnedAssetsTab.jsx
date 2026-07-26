import { Box, Stack, Typography } from '@mui/material';
import { MdDirectionsCar, MdLaunch, MdWarning, MdLocalParking, MdGavel } from 'react-icons/md';
import { GiPistolGun } from 'react-icons/gi';
import Panel from '@/components/system/Panel';
import StatusChip from '@/components/system/StatusChip';
import PhotoPreview from '@/components/media/PhotoPreview';
import EmptyState from '@/components/data/EmptyState';
import TableSkeleton from '@/components/data/TableSkeleton';
import useOpenRecord from '@/hooks/ui/useOpenRecord';
import { useAllVehicles } from '@/hooks/data/useVehicles';
import { useAllWeapons } from '@/hooks/data/useWeapons';
import { useAllRecords } from '@/hooks/data/useCriminalRecords';
import { ENTITY_TYPES } from '@/app/config/constants';
import { formatDate, formatDurationDays } from '@/utils/dates';
import {
  VEHICLE_TYPE_LABELS,
  REGISTRATION_STATUS_LABELS,
  VEHICLE_FLAG_LABELS,
} from '@/types/vehicles';
import {
  WEAPON_CATEGORY_LABELS,
  WEAPON_CLASSIFICATION_LABELS,
  WEAPON_CLASSIFICATIONS,
  WEAPON_STATUS_LABELS,
} from '@/types/weapons';
import {
  RECORD_TYPE_LABELS,
  DISPOSITION_LABELS,
  RECORD_STATUS_LABELS,
} from '@/types/records';

/**
 * Ligne cliquable d'un bien rattaché.
 *
 * @param {object} props
 * @param {string|null} props.photoUrl
 * @param {React.ReactNode} props.title
 * @param {React.ReactNode} props.subtitle
 * @param {React.ReactNode} [props.badges]
 * @param {() => void} props.onOpen
 */
function AssetRow({ photoUrl, title, subtitle, badges, onOpen }) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      onDoubleClick={onOpen}
      sx={{
        p: 1,
        borderBottom: '1px solid',
        borderColor: 'var(--line-soft)',
        cursor: 'pointer',
        transition: 'background-color 120ms ease',
        '&:hover': { bgcolor: 'rgba(45,125,210,0.07)' },
        '&:last-of-type': { borderBottom: 'none' },
      }}
      onClick={onOpen}
    >
      <PhotoPreview url={photoUrl} width={54} height={36} emptyLabel="" />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600 }} noWrap>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 10.5, color: 'text.secondary' }} noWrap>
          {subtitle}
        </Typography>
      </Box>

      <Stack direction="row" spacing={0.5} alignItems="center">
        {badges}
      </Stack>

      <MdLaunch size={14} color="var(--muted-dim)" />
    </Stack>
  );
}

/**
 * État affiché lorsque la requête échoue.
 *
 * Distinguer « aucun résultat » d'« impossible de savoir » n'est pas cosmétique :
 * une fiche qui annonce « aucune arme déclarée » alors que la requête a échoué
 * donne une information fausse à un agent sur le terrain.
 *
 * @param {{ error: Error, icon: React.ReactNode }} props
 */
function QueryError({ error, icon }) {
  return (
    <EmptyState
      icon={icon}
      title="Liste indisponible"
      message={`${error.message} Le compteur affiché sur l'onglet reste, lui, à jour.`}
    />
  );
}

/**
 * Onglet « Véhicules » d'une fiche citoyen.
 *
 * Interroge le registre des véhicules par `ownerId` : la liste est donc
 * toujours exacte, indépendamment du compteur dénormalisé affiché sur l'onglet.
 *
 * @param {{ citizenId: string }} props
 */
export function CitizenVehiclesTab({ citizenId }) {
  const openRecord = useOpenRecord();
  const {
    data: vehicles = [],
    isLoading,
    error,
  } = useAllVehicles({
    filters: [{ field: 'ownerId', op: '==', value: citizenId }],
    max: 100,
  });

  if (isLoading) return <TableSkeleton rows={4} />;

  if (error) return <QueryError error={error} icon={<MdDirectionsCar />} />;

  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon={<MdDirectionsCar />}
        title="Aucun véhicule rattaché"
        message="Les véhicules enregistrés au nom de ce citoyen apparaîtront ici."
      />
    );
  }

  return (
    <Panel title={`Véhicules enregistrés (${vehicles.length})`} icon={<MdDirectionsCar />} dense>
      {vehicles.map((vehicle) => (
        <AssetRow
          key={vehicle.id}
          photoUrl={vehicle.photoUrl}
          title={`${vehicle.plate} — ${[vehicle.make, vehicle.model].filter(Boolean).join(' ')}`}
          subtitle={[
            VEHICLE_TYPE_LABELS[vehicle.type] ?? vehicle.type,
            vehicle.year,
            vehicle.color,
          ]
            .filter(Boolean)
            .join(' · ')}
          badges={
            <>
              {(vehicle.flags ?? []).length > 0 && (
                <Stack direction="row" spacing={0.25} alignItems="center">
                  <MdWarning size={12} color="var(--danger)" />
                  <Typography sx={{ fontSize: 10.5, color: 'error.main' }}>
                    {(vehicle.flags ?? [])
                      .map((flag) => VEHICLE_FLAG_LABELS[flag] ?? flag)
                      .join(', ')}
                  </Typography>
                </Stack>
              )}
              {vehicle.impound?.isImpounded && (
                <MdLocalParking size={14} color="var(--status-incarcerated)" />
              )}
              <StatusChip
                status={vehicle.registrationStatus}
                label={
                  REGISTRATION_STATUS_LABELS[vehicle.registrationStatus] ??
                  vehicle.registrationStatus
                }
              />
            </>
          }
          onOpen={() =>
            openRecord({
              type: ENTITY_TYPES.VEHICLE,
              id: vehicle.id,
              title: vehicle.plate,
              subtitle: [vehicle.make, vehicle.model].filter(Boolean).join(' '),
            })
          }
        />
      ))}
    </Panel>
  );
}

/**
 * Onglet « Casier » d'une fiche citoyen.
 *
 * Interroge le registre des casiers par `citizenId`. Le statut judiciaire
 * affiché en tête de fiche découle de ces casiers : c'est ici qu'on en voit
 * le détail.
 *
 * @param {{ citizenId: string }} props
 */
export function CitizenRecordsTab({ citizenId }) {
  const openRecord = useOpenRecord();
  const {
    data: records = [],
    isLoading,
    error,
  } = useAllRecords({
    filters: [{ field: 'citizenId', op: '==', value: citizenId }],
    max: 100,
  });

  if (isLoading) return <TableSkeleton rows={4} />;

  if (error) return <QueryError error={error} icon={<MdGavel />} />;

  if (records.length === 0) {
    return (
      <EmptyState
        icon={<MdGavel />}
        title="Casier vierge"
        message="Aucune procédure judiciaire n'est enregistrée au nom de ce citoyen."
      />
    );
  }

  return (
    <Panel title={`Casier judiciaire (${records.length})`} icon={<MdGavel />} dense>
      {records.map((record) => (
        <AssetRow
          key={record.id}
          photoUrl={record.mugshotUrl}
          title={`${record.number} — ${(record.charges ?? [])
            .map((charge) => charge.code)
            .join(', ')}`}
          subtitle={[
            RECORD_TYPE_LABELS[record.type] ?? record.type,
            DISPOSITION_LABELS[record.disposition] ?? record.disposition,
            record.date ? formatDate(record.date) : null,
            record.sentence?.prisonDays
              ? `${formatDurationDays(record.sentence.prisonDays)} de prison`
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}
          badges={
            <StatusChip
              status={record.status}
              label={RECORD_STATUS_LABELS[record.status] ?? record.status}
            />
          }
          onOpen={() =>
            openRecord({
              type: ENTITY_TYPES.RECORD,
              id: record.id,
              title: record.number,
              subtitle: record.citizenSnapshot?.label,
            })
          }
        />
      ))}
    </Panel>
  );
}

/**
 * Onglet « Armes » d'une fiche citoyen.
 *
 * @param {{ citizenId: string }} props
 */
export function CitizenWeaponsTab({ citizenId }) {
  const openRecord = useOpenRecord();
  const {
    data: weapons = [],
    isLoading,
    error,
  } = useAllWeapons({
    filters: [{ field: 'ownerId', op: '==', value: citizenId }],
    max: 100,
  });

  if (isLoading) return <TableSkeleton rows={4} />;

  if (error) return <QueryError error={error} icon={<GiPistolGun />} />;

  if (weapons.length === 0) {
    return (
      <EmptyState
        icon={<GiPistolGun />}
        title="Aucune arme déclarée"
        message="Les armes enregistrées au nom de ce citoyen apparaîtront ici."
      />
    );
  }

  return (
    <Panel title={`Armes déclarées (${weapons.length})`} icon={<GiPistolGun />} dense>
      {weapons.map((weapon) => (
        <AssetRow
          key={weapon.id}
          photoUrl={weapon.photoUrl}
          title={`${weapon.serialNumber} — ${[weapon.make, weapon.model].filter(Boolean).join(' ')}`}
          subtitle={[
            WEAPON_CATEGORY_LABELS[weapon.category] ?? weapon.category,
            weapon.caliber,
            weapon.registeredAt ? `enregistrée le ${formatDate(weapon.registeredAt)}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
          badges={
            <>
              {weapon.classification !== WEAPON_CLASSIFICATIONS.CIVIL && (
                <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: 'warning.main' }}>
                  {WEAPON_CLASSIFICATION_LABELS[weapon.classification]}
                </Typography>
              )}
              <StatusChip
                status={weapon.status}
                label={WEAPON_STATUS_LABELS[weapon.status] ?? weapon.status}
              />
            </>
          }
          onOpen={() =>
            openRecord({
              type: ENTITY_TYPES.WEAPON,
              id: weapon.id,
              title: weapon.serialNumber,
              subtitle: [weapon.make, weapon.model].filter(Boolean).join(' '),
            })
          }
        />
      ))}
    </Panel>
  );
}
