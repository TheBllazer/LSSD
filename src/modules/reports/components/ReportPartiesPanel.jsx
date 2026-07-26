import { useState } from 'react';
import {
  Autocomplete,
  Box,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { MdDelete, MdPeopleAlt, MdDirectionsCar, MdGavel } from 'react-icons/md';
import { GiPistolGun } from 'react-icons/gi';
import Panel from '@/components/system/Panel';
import Avatar from '@/components/media/Avatar';
import { CitizenAutocomplete } from '@/components/form/CitizenPicker';
import { useAllVehicles } from '@/hooks/data/useVehicles';
import { useAllWeapons } from '@/hooks/data/useWeapons';
import { registryName } from '@/utils/format';
import {
  CITIZEN_ROLES,
  CITIZEN_ROLE_LABELS,
  VEHICLE_ROLES,
  VEHICLE_ROLE_LABELS,
  WEAPON_ROLES,
  WEAPON_ROLE_LABELS,
} from '@/types/reports';

const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/**
 * Ligne d'une partie impliquée : identité, rôle modifiable, retrait.
 */
function PartyRow({ party, roleLabels, onRoleChange, onRemove, readOnly }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{
        py: 0.625,
        borderBottom: '1px dashed',
        borderColor: 'var(--line-soft)',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Avatar person={{ photoUrl: party.photoUrl, lastName: party.label }} size={22} />

      <Typography sx={{ fontSize: 11.5, flex: 1, minWidth: 0 }} noWrap>
        {party.label}
      </Typography>

      <TextField
        select
        value={party.role}
        onChange={(event) => onRoleChange(event.target.value)}
        disabled={readOnly}
        sx={{ width: 150 }}
        slotProps={{ input: { sx: { fontSize: 11 } } }}
      >
        {toOptions(roleLabels).map((option) => (
          <MenuItem key={option.value} value={option.value} sx={{ fontSize: 11.5 }}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      {!readOnly && (
        <IconButton
          size="small"
          onClick={onRemove}
          aria-label="Retirer cette partie"
          sx={{ p: 0.25, '&:hover': { color: 'error.main' } }}
        >
          <MdDelete size={14} />
        </IconButton>
      )}
    </Stack>
  );
}

/**
 * Panneau des parties impliquées dans un rapport.
 *
 * Chaque entité est choisie dans son registre, jamais saisie librement : c'est
 * ce qui permet au rapport d'apparaître ensuite sur la fiche du citoyen, du
 * véhicule ou de l'arme concernés.
 *
 * @param {object} props
 * @param {object} props.report
 * @param {(patch: object) => void} props.onChange
 * @param {boolean} props.readOnly
 */
export default function ReportPartiesPanel({ report, onChange, readOnly }) {
  const [citizenDraft, setCitizenDraft] = useState(null);
  const [vehicleDraft, setVehicleDraft] = useState(null);
  const [weaponDraft, setWeaponDraft] = useState(null);

  const { data: vehicles = [] } = useAllVehicles({ max: 300 });
  const { data: weapons = [] } = useAllWeapons({ max: 300 });

  const citizens = report.involvedCitizens ?? [];
  const involvedVehicles = report.involvedVehicles ?? [];
  const involvedWeapons = report.involvedWeapons ?? [];

  /** Ajoute une partie si elle n'est pas déjà citée. */
  const addParty = (field, list, party) => {
    if (!party || list.some((item) => item.id === party.id)) return;
    onChange({ [field]: [...list, party] });
  };

  const updateRole = (field, list, index, role) => {
    const next = [...list];
    next[index] = { ...next[index], role };
    onChange({ [field]: next });
  };

  const removeParty = (field, list, index) => {
    onChange({ [field]: list.filter((_item, position) => position !== index) });
  };

  return (
    <Stack spacing={1.5}>
      <Panel title="Citoyens impliqués" icon={<MdPeopleAlt />} subtitle={String(citizens.length)} dense>
        {citizens.length === 0 && (
          <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
            Aucun citoyen cité dans ce rapport.
          </Typography>
        )}

        {citizens.map((party, index) => (
          <PartyRow
            key={party.id}
            party={party}
            roleLabels={CITIZEN_ROLE_LABELS}
            readOnly={readOnly}
            onRoleChange={(role) => updateRole('involvedCitizens', citizens, index, role)}
            onRemove={() => removeParty('involvedCitizens', citizens, index)}
          />
        ))}

        {!readOnly && (
          <Box sx={{ mt: 1.25 }}>
            <CitizenAutocomplete
              label="Ajouter un citoyen"
              value={citizenDraft}
              onChange={(citizen) => {
                setCitizenDraft(null);
                addParty('involvedCitizens', citizens, {
                  id: citizen?.id,
                  label: registryName(citizen),
                  photoUrl: citizen?.photoUrl ?? null,
                  role: CITIZEN_ROLES.SUSPECT,
                });
              }}
            />
          </Box>
        )}
      </Panel>

      <Panel
        title="Véhicules impliqués"
        icon={<MdDirectionsCar />}
        subtitle={String(involvedVehicles.length)}
        dense
      >
        {involvedVehicles.length === 0 && (
          <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
            Aucun véhicule cité.
          </Typography>
        )}

        {involvedVehicles.map((party, index) => (
          <PartyRow
            key={party.id}
            party={party}
            roleLabels={VEHICLE_ROLE_LABELS}
            readOnly={readOnly}
            onRoleChange={(role) => updateRole('involvedVehicles', involvedVehicles, index, role)}
            onRemove={() => removeParty('involvedVehicles', involvedVehicles, index)}
          />
        ))}

        {!readOnly && (
          <Box sx={{ mt: 1.25 }}>
            <Autocomplete
              size="small"
              value={vehicleDraft}
              onChange={(_event, vehicle) => {
                setVehicleDraft(null);
                if (!vehicle) return;
                addParty('involvedVehicles', involvedVehicles, {
                  id: vehicle.id,
                  label: `${vehicle.plate} — ${[vehicle.make, vehicle.model].filter(Boolean).join(' ')}`,
                  photoUrl: vehicle.photoUrl ?? null,
                  role: VEHICLE_ROLES.SUSPECT,
                });
              }}
              options={vehicles}
              getOptionLabel={(option) => option.plate ?? ''}
              isOptionEqualToValue={(option, selected) => option.id === selected?.id}
              renderInput={(params) => (
                <TextField {...params} label="Ajouter un véhicule" placeholder="Plaque…" />
              )}
            />
          </Box>
        )}
      </Panel>

      <Panel
        title="Armes impliquées"
        icon={<GiPistolGun />}
        subtitle={String(involvedWeapons.length)}
        dense
      >
        {involvedWeapons.length === 0 && (
          <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
            Aucune arme citée.
          </Typography>
        )}

        {involvedWeapons.map((party, index) => (
          <PartyRow
            key={party.id}
            party={party}
            roleLabels={WEAPON_ROLE_LABELS}
            readOnly={readOnly}
            onRoleChange={(role) => updateRole('involvedWeapons', involvedWeapons, index, role)}
            onRemove={() => removeParty('involvedWeapons', involvedWeapons, index)}
          />
        ))}

        {!readOnly && (
          <Box sx={{ mt: 1.25 }}>
            <Autocomplete
              size="small"
              value={weaponDraft}
              onChange={(_event, weapon) => {
                setWeaponDraft(null);
                if (!weapon) return;
                addParty('involvedWeapons', involvedWeapons, {
                  id: weapon.id,
                  label: `${weapon.serialNumber} — ${[weapon.make, weapon.model].filter(Boolean).join(' ')}`,
                  photoUrl: weapon.photoUrl ?? null,
                  role: WEAPON_ROLES.SEIZED,
                });
              }}
              options={weapons}
              getOptionLabel={(option) => option.serialNumber ?? ''}
              isOptionEqualToValue={(option, selected) => option.id === selected?.id}
              renderInput={(params) => (
                <TextField {...params} label="Ajouter une arme" placeholder="N° de série…" />
              )}
            />
          </Box>
        )}
      </Panel>

      <Panel title="Chefs d'accusation" icon={<MdGavel />} dense>
        {(report.charges ?? []).length === 0 ? (
          <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
            Aucun chef d'accusation retenu.
          </Typography>
        ) : (
          (report.charges ?? []).map((charge, index) => (
            <Stack
              key={`${charge.code}-${index}`}
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ py: 0.5 }}
            >
              <Typography className="mono" sx={{ fontSize: 11, fontWeight: 700 }}>
                {charge.code}
              </Typography>
              <Typography sx={{ fontSize: 11.5, flex: 1 }} noWrap>
                {charge.label}
              </Typography>
              {!readOnly && (
                <IconButton
                  size="small"
                  onClick={() =>
                    onChange({
                      charges: (report.charges ?? []).filter((_c, p) => p !== index),
                    })
                  }
                  sx={{ p: 0.25, '&:hover': { color: 'error.main' } }}
                >
                  <MdDelete size={14} />
                </IconButton>
              )}
            </Stack>
          ))
        )}
      </Panel>
    </Stack>
  );
}
