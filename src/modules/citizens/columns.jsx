import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { MdWarning } from 'react-icons/md';
import Avatar from '@/components/media/Avatar';
import StatusChip from '@/components/system/StatusChip';
import { registryName, formatPhone } from '@/utils/format';
import { formatDate, computeAge } from '@/utils/dates';
import {
  SEX_ABBR,
  CITIZEN_STATUS_LABELS,
  CITIZEN_FLAG_LABELS,
  LICENSE_TYPE_LABELS,
  LICENSE_STATUS,
} from '@/types/citizens';

/**
 * Colonnes du registre des citoyens.
 *
 * Séparées de la page : la même définition alimentera l'export CSV et le
 * squelette de chargement, qui a besoin des largeurs réelles.
 *
 * @returns {import('@mui/x-data-grid').GridColDef[]}
 */
export function buildCitizenColumns() {
  return [
    {
      field: 'photoUrl',
      headerName: '',
      width: 44,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Stack justifyContent="center" sx={{ height: '100%' }}>
          <Avatar person={params.row} size={24} />
        </Stack>
      ),
    },
    {
      field: 'lastName',
      headerName: 'Nom',
      flex: 1.6,
      minWidth: 180,
      renderCell: (params) => (
        <Stack justifyContent="center" sx={{ height: '100%', minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600 }} noWrap>
            {registryName(params.row)}
          </Typography>
          {params.row.aliases?.length > 0 && (
            <Typography sx={{ fontSize: 10, color: 'text.secondary' }} noWrap>
              alias {params.row.aliases.join(', ')}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      field: 'birthDate',
      headerName: 'Naissance',
      width: 130,
      renderCell: (params) => {
        const age = computeAge(params.row.birthDate);
        return (
          <Stack justifyContent="center" sx={{ height: '100%' }}>
            <Typography className="mono" sx={{ fontSize: 11.5 }}>
              {formatDate(params.row.birthDate)}
            </Typography>
            {age !== null && (
              <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
                {age} ans
              </Typography>
            )}
          </Stack>
        );
      },
    },
    {
      field: 'sex',
      headerName: 'Sexe',
      width: 62,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography className="mono" sx={{ fontSize: 12 }}>
          {SEX_ABBR[params.row.sex] ?? '—'}
        </Typography>
      ),
    },
    {
      field: 'phone',
      headerName: 'Téléphone',
      width: 130,
      renderCell: (params) => (
        <Typography className="mono" sx={{ fontSize: 11.5 }}>
          {formatPhone(params.row.phone)}
        </Typography>
      ),
    },
    {
      field: 'address',
      headerName: 'Adresse',
      flex: 1.3,
      minWidth: 160,
      sortable: false,
      valueGetter: (_value, row) =>
        [row.address?.street, row.address?.district].filter(Boolean).join(', '),
      renderCell: (params) => (
        <Stack justifyContent="center" sx={{ height: '100%', minWidth: 0 }}>
          <Typography sx={{ fontSize: 11.5 }} noWrap>
            {params.row.address?.street || '—'}
          </Typography>
          {params.row.address?.district && (
            <Typography sx={{ fontSize: 10, color: 'text.secondary' }} noWrap>
              {params.row.address.district}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      field: 'occupation',
      headerName: 'Profession',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Stack justifyContent="center" sx={{ height: '100%', minWidth: 0 }}>
          <Typography sx={{ fontSize: 11.5 }} noWrap>
            {params.row.occupation || '—'}
          </Typography>
          {params.row.employer && (
            <Typography sx={{ fontSize: 10, color: 'text.secondary' }} noWrap>
              {params.row.employer}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      field: 'licenses',
      headerName: 'Permis',
      width: 96,
      sortable: false,
      renderCell: (params) => {
        const licenses = params.row.licenses ?? [];
        const invalid = licenses.filter(
          (license) => license.status !== LICENSE_STATUS.VALID,
        );
        if (licenses.length === 0) {
          return (
            <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>—</Typography>
          );
        }
        return (
          <Tooltip
            title={licenses
              .map(
                (license) =>
                  `${LICENSE_TYPE_LABELS[license.type] ?? license.type} : ${license.status}`,
              )
              .join('\n')}
          >
            <Typography
              className="mono"
              sx={{
                fontSize: 11,
                color: invalid.length > 0 ? 'warning.main' : 'success.main',
              }}
            >
              {licenses.length - invalid.length}/{licenses.length}
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 130,
      renderCell: (params) => (
        <Stack justifyContent="center" sx={{ height: '100%' }}>
          <StatusChip
            status={params.row.status}
            label={CITIZEN_STATUS_LABELS[params.row.status] ?? params.row.status}
          />
        </Stack>
      ),
    },
    {
      field: 'flags',
      headerName: 'Signalements',
      width: 120,
      sortable: false,
      renderCell: (params) => {
        const flags = params.row.flags ?? [];
        if (flags.length === 0) {
          return <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>—</Typography>;
        }
        return (
          <Tooltip
            title={flags.map((flag) => CITIZEN_FLAG_LABELS[flag] ?? flag).join(' · ')}
          >
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ height: '100%' }}>
              <MdWarning size={13} color="var(--danger)" />
              <Typography sx={{ fontSize: 11, color: 'error.main' }}>
                {flags.length}
              </Typography>
            </Stack>
          </Tooltip>
        );
      },
    },
    {
      field: 'counters',
      headerName: 'Dossier',
      width: 150,
      sortable: false,
      renderCell: (params) => {
        const counters = params.row.counters ?? {};
        const entries = [
          ['R', counters.reports, 'rapports'],
          ['V', counters.vehicles, 'véhicules'],
          ['A', counters.weapons, 'armes'],
          ['C', counters.records, 'casiers'],
        ].filter(([, value]) => value > 0);

        if (entries.length === 0) {
          return <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>vide</Typography>;
        }

        return (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: '100%' }}>
            {entries.map(([initial, value, label]) => (
              <Tooltip key={initial} title={`${value} ${label}`}>
                <Box
                  className="mono"
                  sx={{
                    px: 0.5,
                    fontSize: 10,
                    borderRadius: '2px',
                    border: '1px solid var(--line)',
                    color: 'text.secondary',
                  }}
                >
                  {initial}
                  {value}
                </Box>
              </Tooltip>
            ))}
          </Stack>
        );
      },
    },
  ];
}
