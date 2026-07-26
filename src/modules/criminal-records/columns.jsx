import { Box, Stack, Tooltip, Typography } from '@mui/material';
import Avatar from '@/components/media/Avatar';
import StatusChip from '@/components/system/StatusChip';
import { formatDate, formatDurationDays } from '@/utils/dates';
import { formatCurrency } from '@/utils/format';
import {
  RECORD_TYPE_LABELS,
  DISPOSITION_LABELS,
  RECORD_STATUS_LABELS,
  RECORD_TYPES,
} from '@/types/records';

/**
 * Colonnes du registre des casiers judiciaires.
 * @returns {import('@mui/x-data-grid').GridColDef[]}
 */
export function buildRecordColumns() {
  return [
    {
      field: 'mugshotUrl',
      headerName: '',
      width: 44,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Stack justifyContent="center" sx={{ height: '100%' }}>
          <Avatar
            person={{
              photoUrl: params.row.mugshotUrl ?? params.row.citizenSnapshot?.photoUrl,
              lastName: params.row.citizenSnapshot?.label,
            }}
            size={24}
          />
        </Stack>
      ),
    },
    {
      field: 'number',
      headerName: 'N° de casier',
      width: 145,
      renderCell: (params) => (
        <Typography className="mono" sx={{ fontSize: 11.5, fontWeight: 700 }}>
          {params.row.number}
        </Typography>
      ),
    },
    {
      field: 'citizenSnapshot',
      headerName: 'Titulaire',
      flex: 1.3,
      minWidth: 170,
      sortable: false,
      valueGetter: (_value, row) => row.citizenSnapshot?.label ?? '',
      renderCell: (params) => (
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'primary.main' }} noWrap>
          {params.row.citizenSnapshot?.label ?? '—'}
        </Typography>
      ),
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 110,
      renderCell: (params) => (
        <Typography className="mono" sx={{ fontSize: 11.5 }}>
          {formatDate(params.row.date)}
        </Typography>
      ),
    },
    {
      field: 'type',
      headerName: 'Nature',
      width: 165,
      renderCell: (params) => {
        const serious = params.row.type === RECORD_TYPES.FELONY;
        return (
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: serious ? 700 : 400,
              color: serious ? 'error.main' : 'text.secondary',
            }}
            noWrap
          >
            {RECORD_TYPE_LABELS[params.row.type] ?? params.row.type}
          </Typography>
        );
      },
    },
    {
      field: 'charges',
      headerName: "Chefs d'accusation",
      flex: 1.4,
      minWidth: 180,
      sortable: false,
      valueGetter: (_value, row) =>
        (row.charges ?? []).map((charge) => charge.code).join(', '),
      renderCell: (params) => {
        const charges = params.row.charges ?? [];
        if (charges.length === 0) {
          return <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>—</Typography>;
        }
        const [first, ...rest] = charges;
        return (
          <Tooltip
            title={charges.map((charge) => `${charge.code} — ${charge.label}`).join('\n')}
          >
            <Stack justifyContent="center" sx={{ height: '100%', minWidth: 0 }}>
              <Typography className="mono" sx={{ fontSize: 11.5 }} noWrap>
                {first.code}
                {rest.length > 0 ? ` (+${rest.length})` : ''}
              </Typography>
              <Typography sx={{ fontSize: 10, color: 'text.secondary' }} noWrap>
                {first.label}
              </Typography>
            </Stack>
          </Tooltip>
        );
      },
    },
    {
      field: 'sentence',
      headerName: 'Peine',
      width: 145,
      sortable: false,
      valueGetter: (_value, row) => row.sentence?.prisonDays ?? 0,
      renderCell: (params) => {
        const sentence = params.row.sentence ?? {};
        const parts = [];
        if (sentence.prisonDays > 0) parts.push(formatDurationDays(sentence.prisonDays));
        if (sentence.probationDays > 0) {
          parts.push(`probation ${formatDurationDays(sentence.probationDays)}`);
        }
        return (
          <Stack justifyContent="center" sx={{ height: '100%', minWidth: 0 }}>
            <Typography sx={{ fontSize: 11.5 }} noWrap>
              {parts.length > 0 ? parts[0] : '—'}
            </Typography>
            {sentence.fineAmount > 0 && (
              <Typography
                className="mono"
                sx={{
                  fontSize: 10,
                  color: sentence.finePaid ? 'success.main' : 'warning.main',
                }}
              >
                {formatCurrency(sentence.fineAmount)}
                {sentence.finePaid ? ' réglée' : ' due'}
              </Typography>
            )}
          </Stack>
        );
      },
    },
    {
      field: 'disposition',
      headerName: 'Disposition',
      width: 155,
      renderCell: (params) => (
        <Typography sx={{ fontSize: 11.5 }} noWrap>
          {DISPOSITION_LABELS[params.row.disposition] ?? params.row.disposition}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'État',
      width: 135,
      renderCell: (params) => (
        <Stack justifyContent="center" sx={{ height: '100%' }}>
          <StatusChip
            status={params.row.status}
            label={RECORD_STATUS_LABELS[params.row.status] ?? params.row.status}
          />
        </Stack>
      ),
    },
  ];
}
