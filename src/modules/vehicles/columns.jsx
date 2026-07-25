import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { MdWarning, MdLocalParking } from 'react-icons/md';
import PhotoPreview from '@/components/media/PhotoPreview';
import StatusChip from '@/components/system/StatusChip';
import {
  VEHICLE_TYPE_LABELS,
  REGISTRATION_STATUS_LABELS,
  INSURANCE_STATUS,
  INSURANCE_STATUS_LABELS,
  VEHICLE_FLAG_LABELS,
} from '@/types/vehicles';

/**
 * Colonnes du registre des véhicules.
 * @returns {import('@mui/x-data-grid').GridColDef[]}
 */
export function buildVehicleColumns() {
  return [
    {
      field: 'photoUrl',
      headerName: '',
      width: 52,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Stack justifyContent="center" sx={{ height: '100%', py: 0.5 }}>
          <PhotoPreview url={params.row.photoUrl} width={38} height={24} emptyLabel="" />
        </Stack>
      ),
    },
    {
      field: 'plate',
      headerName: 'Plaque',
      width: 120,
      renderCell: (params) => (
        <Typography
          className="mono"
          sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.06em' }}
        >
          {params.row.plate}
        </Typography>
      ),
    },
    {
      field: 'make',
      headerName: 'Marque / Modèle',
      flex: 1.4,
      minWidth: 170,
      renderCell: (params) => (
        <Stack justifyContent="center" sx={{ height: '100%', minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600 }} noWrap>
            {[params.row.make, params.row.model].filter(Boolean).join(' ')}
          </Typography>
          <Typography sx={{ fontSize: 10, color: 'text.secondary' }} noWrap>
            {VEHICLE_TYPE_LABELS[params.row.type] ?? params.row.type}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'year',
      headerName: 'Année',
      width: 76,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography className="mono" sx={{ fontSize: 11.5 }}>
          {params.row.year ?? '—'}
        </Typography>
      ),
    },
    {
      field: 'color',
      headerName: 'Couleur',
      width: 100,
      renderCell: (params) => (
        <Typography sx={{ fontSize: 11.5 }}>{params.row.color || '—'}</Typography>
      ),
    },
    {
      field: 'ownerSnapshot',
      headerName: 'Propriétaire',
      flex: 1.2,
      minWidth: 150,
      sortable: false,
      valueGetter: (_value, row) => row.ownerSnapshot?.label ?? '',
      renderCell: (params) =>
        params.row.ownerSnapshot ? (
          <Typography sx={{ fontSize: 11.5, color: 'primary.main' }} noWrap>
            {params.row.ownerSnapshot.label}
          </Typography>
        ) : (
          <Typography sx={{ fontSize: 11, color: 'text.disabled', fontStyle: 'italic' }}>
            Non attribué
          </Typography>
        ),
    },
    {
      field: 'registrationStatus',
      headerName: 'Immatriculation',
      width: 165,
      renderCell: (params) => (
        <Stack justifyContent="center" sx={{ height: '100%' }}>
          <StatusChip
            status={params.row.registrationStatus}
            label={
              REGISTRATION_STATUS_LABELS[params.row.registrationStatus] ??
              params.row.registrationStatus
            }
          />
        </Stack>
      ),
    },
    {
      field: 'insurance',
      headerName: 'Assurance',
      width: 130,
      sortable: false,
      valueGetter: (_value, row) => row.insurance?.status ?? '',
      renderCell: (params) => {
        const status = params.row.insurance?.status ?? INSURANCE_STATUS.NONE;
        return (
          <Tooltip title={params.row.insurance?.company || 'Aucun assureur renseigné'}>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                color:
                  status === INSURANCE_STATUS.VALID
                    ? 'success.main'
                    : status === INSURANCE_STATUS.EXPIRED
                      ? 'warning.main'
                      : 'text.disabled',
              }}
            >
              {INSURANCE_STATUS_LABELS[status] ?? status}
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      field: 'flags',
      headerName: 'Signalements',
      width: 120,
      sortable: false,
      renderCell: (params) => {
        const flags = params.row.flags ?? [];
        const impounded = params.row.impound?.isImpounded;

        if (flags.length === 0 && !impounded) {
          return <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>—</Typography>;
        }

        return (
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ height: '100%' }}>
            {flags.length > 0 && (
              <Tooltip
                title={flags.map((flag) => VEHICLE_FLAG_LABELS[flag] ?? flag).join(' · ')}
              >
                <Stack direction="row" spacing={0.375} alignItems="center">
                  <MdWarning size={13} color="var(--danger)" />
                  <Typography sx={{ fontSize: 11, color: 'error.main' }}>
                    {flags.length}
                  </Typography>
                </Stack>
              </Tooltip>
            )}
            {impounded && (
              <Tooltip title={`Fourrière : ${params.row.impound?.lot || 'non précisée'}`}>
                <Box sx={{ display: 'flex', color: 'var(--status-incarcerated)' }}>
                  <MdLocalParking size={14} />
                </Box>
              </Tooltip>
            )}
          </Stack>
        );
      },
    },
  ];
}
