import { Stack, Tooltip, Typography } from '@mui/material';
import { MdLock, MdPeople } from 'react-icons/md';
import StatusChip from '@/components/system/StatusChip';
import { formatDateTime } from '@/utils/dates';
import {
  REPORT_TYPE_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_CLASSIFICATION_LABELS,
  REPORT_CLASSIFICATIONS,
  REPORT_PRIORITY_LABELS,
} from '@/types/reports';

/**
 * Colonnes du registre des rapports.
 * @returns {import('@mui/x-data-grid').GridColDef[]}
 */
export function buildReportColumns() {
  return [
    {
      field: 'number',
      headerName: 'Numéro',
      width: 165,
      renderCell: (params) => (
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ height: '100%' }}>
          <Typography className="mono" sx={{ fontSize: 11.5, fontWeight: 700 }}>
            {params.row.number}
          </Typography>
          {params.row.lockedBy && (
            <Tooltip title={`En cours d'édition par ${params.row.lockedBy.name}`}>
              <span style={{ display: 'flex' }}>
                <MdLock size={11} color="var(--warn)" />
              </span>
            </Tooltip>
          )}
        </Stack>
      ),
    },
    {
      field: 'title',
      headerName: 'Titre',
      flex: 2,
      minWidth: 220,
      renderCell: (params) => (
        <Stack justifyContent="center" sx={{ height: '100%', minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600 }} noWrap>
            {params.row.title}
          </Typography>
          {params.row.summary && (
            <Typography sx={{ fontSize: 10, color: 'text.secondary' }} noWrap>
              {params.row.summary}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 165,
      renderCell: (params) => (
        <Typography sx={{ fontSize: 11.5 }} noWrap>
          {REPORT_TYPE_LABELS[params.row.type] ?? params.row.type}
        </Typography>
      ),
    },
    {
      field: 'occurredAt',
      headerName: 'Date des faits',
      width: 140,
      renderCell: (params) => (
        <Typography className="mono" sx={{ fontSize: 11.5 }}>
          {formatDateTime(params.row.occurredAt)}
        </Typography>
      ),
    },
    {
      field: 'involvedCitizens',
      headerName: 'Parties',
      width: 96,
      sortable: false,
      renderCell: (params) => {
        const citizens = params.row.involvedCitizens ?? [];
        if (citizens.length === 0) {
          return <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>—</Typography>;
        }
        return (
          <Tooltip title={citizens.map((party) => party.label).join(' · ')}>
            <Stack direction="row" spacing={0.375} alignItems="center" sx={{ height: '100%' }}>
              <MdPeople size={13} color="var(--muted)" />
              <Typography sx={{ fontSize: 11 }}>{citizens.length}</Typography>
            </Stack>
          </Tooltip>
        );
      },
    },
    {
      field: 'classification',
      headerName: 'Classification',
      width: 160,
      renderCell: (params) => {
        const sensitive =
          params.row.classification === REPORT_CLASSIFICATIONS.CONFIDENTIAL ||
          params.row.classification === REPORT_CLASSIFICATIONS.SEALED;
        return (
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: sensitive ? 700 : 400,
              color: sensitive ? 'warning.main' : 'text.secondary',
            }}
            noWrap
          >
            {REPORT_CLASSIFICATION_LABELS[params.row.classification] ??
              params.row.classification}
          </Typography>
        );
      },
    },
    {
      field: 'priority',
      headerName: 'Priorité',
      width: 110,
      renderCell: (params) => (
        <Stack justifyContent="center" sx={{ height: '100%' }}>
          <StatusChip
            status={params.row.priority}
            label={REPORT_PRIORITY_LABELS[params.row.priority] ?? params.row.priority}
          />
        </Stack>
      ),
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 155,
      renderCell: (params) => (
        <Stack justifyContent="center" sx={{ height: '100%' }}>
          <StatusChip
            status={params.row.status}
            label={REPORT_STATUS_LABELS[params.row.status] ?? params.row.status}
          />
        </Stack>
      ),
    },
  ];
}
