import { Stack, Typography } from '@mui/material';
import PhotoPreview from '@/components/media/PhotoPreview';
import StatusChip from '@/components/system/StatusChip';
import { formatDate } from '@/utils/dates';
import {
  WEAPON_CATEGORY_LABELS,
  WEAPON_CLASSIFICATION_LABELS,
  WEAPON_CLASSIFICATIONS,
  WEAPON_STATUS_LABELS,
} from '@/types/weapons';

/**
 * Colonnes du registre des armes.
 * @returns {import('@mui/x-data-grid').GridColDef[]}
 */
export function buildWeaponColumns() {
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
      field: 'serialNumber',
      headerName: 'N° de série',
      width: 150,
      renderCell: (params) => (
        <Typography className="mono" sx={{ fontSize: 12, fontWeight: 700 }}>
          {params.row.serialNumber}
        </Typography>
      ),
    },
    {
      field: 'make',
      headerName: 'Marque / Modèle',
      flex: 1.4,
      minWidth: 180,
      renderCell: (params) => (
        <Stack justifyContent="center" sx={{ height: '100%', minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600 }} noWrap>
            {[params.row.make, params.row.model].filter(Boolean).join(' ')}
          </Typography>
          <Typography sx={{ fontSize: 10, color: 'text.secondary' }} noWrap>
            {WEAPON_CATEGORY_LABELS[params.row.category] ?? params.row.category}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'caliber',
      headerName: 'Calibre',
      width: 110,
      renderCell: (params) => (
        <Typography className="mono" sx={{ fontSize: 11.5 }}>
          {params.row.caliber || '—'}
        </Typography>
      ),
    },
    {
      field: 'classification',
      headerName: 'Classification',
      width: 190,
      renderCell: (params) => {
        const restricted =
          params.row.classification !== WEAPON_CLASSIFICATIONS.CIVIL;
        return (
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: restricted ? 700 : 400,
              color: restricted ? 'warning.main' : 'text.secondary',
            }}
            noWrap
          >
            {WEAPON_CLASSIFICATION_LABELS[params.row.classification] ??
              params.row.classification}
          </Typography>
        );
      },
    },
    {
      field: 'ownerSnapshot',
      headerName: 'Détenteur',
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
            Non attribuée
          </Typography>
        ),
    },
    {
      field: 'registeredAt',
      headerName: 'Enregistrement',
      width: 125,
      renderCell: (params) => (
        <Typography className="mono" sx={{ fontSize: 11.5 }}>
          {formatDate(params.row.registeredAt)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 145,
      renderCell: (params) => (
        <Stack justifyContent="center" sx={{ height: '100%' }}>
          <StatusChip
            status={params.row.status}
            label={WEAPON_STATUS_LABELS[params.row.status] ?? params.row.status}
          />
        </Stack>
      ),
    },
  ];
}
