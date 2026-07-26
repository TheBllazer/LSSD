import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, LinearProgress, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  MdGavel,
  MdPerson,
  MdDescription,
  MdArrowBack,
  MdArchive,
  MdBalance,
  MdPhotoLibrary,
} from 'react-icons/md';
import RecordLayout from '@/layouts/RecordLayout';
import PhotoPreview from '@/components/media/PhotoPreview';
import StatusChip from '@/components/system/StatusChip';
import Panel from '@/components/system/Panel';
import KeyValueRow from '@/components/system/KeyValueRow';
import SectionCard from '@/components/system/SectionCard';
import PhotoGallery from '@/components/media/PhotoGallery';
import ChargesEditor from '../components/ChargesEditor';
import Can from '@/components/auth/Can';
import ModuleSkeleton from '@/components/feedback/ModuleSkeleton';
import EmptyState from '@/components/data/EmptyState';
import { AutoSaveIndicator } from '@/components/form';
import { useRecord, useUpdateRecord, useRemoveRecord } from '@/hooks/data/useCriminalRecords';
import { useCitizen } from '@/hooks/data/useCitizens';
import useAutoSave from '@/hooks/ui/useAutoSave';
import useConfirm from '@/hooks/ui/useConfirm';
import useWorkspace from '@/hooks/ui/useWorkspace';
import useOpenRecord from '@/hooks/ui/useOpenRecord';
import usePermission from '@/hooks/auth/usePermission';
import { PERMISSIONS } from '@/utils/permissions';
import { ROUTES, ENTITY_TYPES } from '@/app/config/constants';
import { formatDate, formatDurationDays } from '@/utils/dates';
import { formatCurrency } from '@/utils/format';
import { sentenceProgress } from '../schemas/recordSchema';
import {
  RECORD_TYPE_LABELS,
  DISPOSITION_LABELS,
  RECORD_STATUS_LABELS,
  RECORD_TYPES,
  COURTS,
  citizenStatusFromRecord,
} from '@/types/records';

const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/**
 * Fiche d'un casier judiciaire.
 *
 * Toute modification de la peine ou de la disposition est répercutée sur le
 * statut du citoyen : c'est le module qui referme la boucle entre l'incident,
 * la procédure et l'état civil judiciaire de la personne.
 */
export default function RecordDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const openRecordTab = useOpenRecord();
  const { updateTab, closeTab, setDirty } = useWorkspace();

  const [activeTab, setActiveTab] = useState('procedure');

  const canUpdate = usePermission(PERMISSIONS.RECORDS_UPDATE);

  const { data: record, isLoading, error } = useRecord(id);
  const { data: citizen } = useCitizen(record?.citizenId);

  const updateRecord = useUpdateRecord();
  const removeRecord = useRemoveRecord();

  const persist = useCallback(
    async (patch) => {
      if (!patch || !record) return;
      await updateRecord.mutateAsync({ id, patch, previous: record, citizen });
    },
    [id, record, citizen, updateRecord],
  );

  const autoSave = useAutoSave(persist, { enabled: canUpdate });

  useEffect(() => {
    if (!record) return;
    setDirty(`${ENTITY_TYPES.RECORD}:${id}`, autoSave.isDirty);
  }, [autoSave.isDirty, record, id, setDirty]);

  useEffect(() => {
    if (!record) return;
    updateTab(`${ENTITY_TYPES.RECORD}:${id}`, {
      title: record.number,
      subtitle: record.citizenSnapshot?.label,
    });
  }, [record, id, updateTab]);

  const tabs = useMemo(
    () => [
      { id: 'procedure', label: 'Procédure', icon: <MdBalance size={14} /> },
      { id: 'sentence', label: 'Peine', icon: <MdGavel size={14} /> },
      {
        id: 'photos',
        label: 'Photographies',
        count: (record?.photos ?? []).length,
        icon: <MdPhotoLibrary size={14} />,
      },
    ],
    [record],
  );

  if (isLoading) return <ModuleSkeleton rows={6} />;

  if (error || !record) {
    return (
      <Box sx={{ flex: 1, display: 'flex' }}>
        <EmptyState
          title={error ? 'Casier inaccessible' : 'Casier introuvable'}
          message={error?.message ?? "Ce casier n'existe pas ou a été archivé."}
          action={
            <Button
              variant="contained"
              startIcon={<MdArrowBack />}
              onClick={() => navigate(ROUTES.RECORDS)}
            >
              Retour au registre
            </Button>
          }
        />
      </Box>
    );
  }

  const archived = Boolean(record.deletedAt);
  const readOnly = !canUpdate || archived;
  const progress = sentenceProgress(record.sentence);
  const projectedStatus = citizenStatusFromRecord(record);

  const archive = async () => {
    const { confirmed, reason } = await confirm({
      title: 'Archiver le casier',
      entityType: 'Casier',
      entityLabel: `${record.number} — ${record.citizenSnapshot?.label ?? ''}`,
      danger: true,
      requireReason: true,
    });
    if (!confirmed) return;

    await removeRecord.mutateAsync({ id, reason, previous: record });
    closeTab(`${ENTITY_TYPES.RECORD}:${id}`);
    navigate(ROUTES.RECORDS);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'procedure':
        return (
          <>
            <SectionCard title="Procédure" icon={<MdBalance />}>
              <Stack direction="row" spacing={1.25} sx={{ mb: 1.5 }}>
                <TextField
                  type="date"
                  label="Date des faits"
                  value={formatDate(record.date, 'YYYY-MM-DD', '')}
                  onChange={(event) =>
                    autoSave.markDirty({
                      date: event.target.value ? new Date(event.target.value) : null,
                    })
                  }
                  disabled={readOnly}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  select
                  label="Nature"
                  value={record.type}
                  onChange={(event) => autoSave.markDirty({ type: event.target.value })}
                  disabled={readOnly}
                >
                  {toOptions(RECORD_TYPE_LABELS).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Disposition"
                  value={record.disposition}
                  onChange={(event) => autoSave.markDirty({ disposition: event.target.value })}
                  disabled={readOnly}
                >
                  {toOptions(DISPOSITION_LABELS).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="État"
                  value={record.status}
                  onChange={(event) => autoSave.markDirty({ status: event.target.value })}
                  disabled={readOnly}
                >
                  {toOptions(RECORD_STATUS_LABELS).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Stack direction="row" spacing={1.25} sx={{ mb: 1.5 }}>
                <TextField
                  select
                  label="Juridiction"
                  value={record.court ?? ''}
                  onChange={(event) => autoSave.markDirty({ court: event.target.value })}
                  disabled={readOnly}
                >
                  <MenuItem value="">Non précisée</MenuItem>
                  {COURTS.map((court) => (
                    <MenuItem key={court} value={court}>
                      {court}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Magistrat"
                  value={record.judge ?? ''}
                  onChange={(event) => autoSave.markDirty({ judge: event.target.value })}
                  disabled={readOnly}
                />
              </Stack>

              <Stack direction="row" spacing={1.25}>
                <TextField
                  label="Ministère public"
                  value={record.prosecutor ?? ''}
                  onChange={(event) => autoSave.markDirty({ prosecutor: event.target.value })}
                  disabled={readOnly}
                />
                <TextField
                  label="Défense"
                  value={record.defenseAttorney ?? ''}
                  onChange={(event) =>
                    autoSave.markDirty({ defenseAttorney: event.target.value })
                  }
                  disabled={readOnly}
                />
              </Stack>
            </SectionCard>

            <ChargesEditor
              charges={record.charges ?? []}
              readOnly={readOnly}
              onChange={(charges) => autoSave.markDirty({ charges })}
            />

            <SectionCard title="Observations">
              <TextField
                value={record.notes ?? ''}
                onChange={(event) => autoSave.markDirty({ notes: event.target.value })}
                disabled={readOnly}
                multiline
                minRows={3}
                label="Notes internes"
              />
            </SectionCard>
          </>
        );

      case 'sentence':
        return (
          <>
            <SectionCard title="Peine prononcée" icon={<MdGavel />}>
              <Stack direction="row" spacing={1.25} sx={{ mb: 1.5 }}>
                <TextField
                  type="number"
                  label="Prison (jours)"
                  value={record.sentence?.prisonDays ?? ''}
                  onChange={(event) =>
                    autoSave.markDirty({
                      sentence: {
                        ...record.sentence,
                        prisonDays: event.target.value === '' ? null : Number(event.target.value),
                      },
                    })
                  }
                  disabled={readOnly}
                />
                <TextField
                  type="number"
                  label="Probation (jours)"
                  value={record.sentence?.probationDays ?? ''}
                  onChange={(event) =>
                    autoSave.markDirty({
                      sentence: {
                        ...record.sentence,
                        probationDays:
                          event.target.value === '' ? null : Number(event.target.value),
                      },
                    })
                  }
                  disabled={readOnly}
                />
                <TextField
                  type="number"
                  label="TIG (heures)"
                  value={record.sentence?.communityServiceHours ?? ''}
                  onChange={(event) =>
                    autoSave.markDirty({
                      sentence: {
                        ...record.sentence,
                        communityServiceHours:
                          event.target.value === '' ? null : Number(event.target.value),
                      },
                    })
                  }
                  disabled={readOnly}
                />
                <TextField
                  type="number"
                  label="Amende ($)"
                  value={record.sentence?.fineAmount ?? ''}
                  onChange={(event) =>
                    autoSave.markDirty({
                      sentence: {
                        ...record.sentence,
                        fineAmount: event.target.value === '' ? null : Number(event.target.value),
                      },
                    })
                  }
                  disabled={readOnly}
                />
              </Stack>

              <TextField
                type="date"
                label="Début d'exécution"
                value={formatDate(record.sentence?.startedAt, 'YYYY-MM-DD', '')}
                onChange={(event) =>
                  autoSave.markDirty({
                    sentence: {
                      ...record.sentence,
                      startedAt: event.target.value ? new Date(event.target.value) : null,
                    },
                  })
                }
                disabled={readOnly}
                slotProps={{ inputLabel: { shrink: true } }}
                helperText="Nécessaire au calcul de la progression de la peine."
                sx={{ width: 260 }}
              />
            </SectionCard>

            {progress && (
              <SectionCard title="Progression de la peine">
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                  <Typography sx={{ fontSize: 12 }}>
                    {progress.served} jour{progress.served > 1 ? 's' : ''} purgé
                    {progress.served > 1 ? 's' : ''} sur {progress.total}
                  </Typography>
                  <Typography className="mono" sx={{ fontSize: 12, color: 'primary.main' }}>
                    {progress.percent} %
                  </Typography>
                </Stack>
                <LinearProgress variant="determinate" value={progress.percent} sx={{ height: 6 }} />
                <Typography variant="caption" sx={{ display: 'block', mt: 0.75 }}>
                  Reste {formatDurationDays(progress.remaining)}.
                </Typography>
              </SectionCard>
            )}
          </>
        );

      case 'photos':
        return <PhotoGallery photos={(record.photos ?? []).map((url) => ({ url }))} />;

      default:
        return null;
    }
  };

  return (
    <RecordLayout
      photo={
        <PhotoPreview
          url={record.mugshotUrl ?? record.citizenSnapshot?.photoUrl}
          width={130}
          height={160}
          alt={record.citizenSnapshot?.label}
          emptyLabel="Sans cliché"
        />
      }
      title={record.number}
      subtitle={record.citizenSnapshot?.label ?? 'Titulaire inconnu'}
      badges={
        <Stack direction="row" spacing={0.75} alignItems="center">
          <StatusChip
            status={record.status}
            label={RECORD_STATUS_LABELS[record.status] ?? record.status}
          />
          {record.type === RECORD_TYPES.FELONY && (
            <StatusChip status="CRITICAL" label="CRIME" tone="danger" />
          )}
          {archived && <StatusChip status="INACTIVE" label="ARCHIVÉ" />}
        </Stack>
      }
      meta={
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            {RECORD_TYPE_LABELS[record.type] ?? record.type} ·{' '}
            {DISPOSITION_LABELS[record.disposition] ?? record.disposition} ·{' '}
            {formatDate(record.date)}
          </Typography>

          {record.court && (
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              {record.court}
              {record.judge ? ` — ${record.judge}` : ''}
            </Typography>
          )}

          {record.citizenSnapshot && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <MdPerson size={12} color="var(--muted-dim)" />
              <Typography
                sx={{ fontSize: 12, color: 'primary.main', cursor: 'pointer' }}
                onClick={() =>
                  openRecordTab({
                    type: ENTITY_TYPES.CITIZEN,
                    id: record.citizenSnapshot.id,
                    title: record.citizenSnapshot.label,
                  })
                }
              >
                Ouvrir la fiche citoyen
              </Typography>
            </Stack>
          )}
        </Stack>
      }
      actions={
        <>
          <Button
            variant="outlined"
            startIcon={<MdArrowBack />}
            onClick={() => navigate(ROUTES.RECORDS)}
          >
            Registre
          </Button>

          {record.reportId && (
            <Button
              variant="outlined"
              startIcon={<MdDescription />}
              onClick={() =>
                openRecordTab({
                  type: ENTITY_TYPES.REPORT,
                  id: record.reportId,
                  title: 'Rapport lié',
                })
              }
            >
              Rapport lié
            </Button>
          )}

          {!archived && (
            <Can do={PERMISSIONS.RECORDS_DELETE}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<MdArchive />}
                onClick={archive}
              >
                Archiver
              </Button>
            </Can>
          )}
        </>
      }
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      sidePanel={
        <Stack spacing={1.5}>
          <Panel title="Synthèse" dense>
            <KeyValueRow
              label="Chefs"
              labelWidth={92}
              value={`${(record.charges ?? []).length} retenu(s)`}
            />
            <KeyValueRow
              label="Prison"
              labelWidth={92}
              value={
                record.sentence?.prisonDays
                  ? formatDurationDays(record.sentence.prisonDays)
                  : null
              }
            />
            <KeyValueRow
              label="Probation"
              labelWidth={92}
              value={
                record.sentence?.probationDays
                  ? formatDurationDays(record.sentence.probationDays)
                  : null
              }
            />
            <KeyValueRow
              label="Amende"
              labelWidth={92}
              value={
                record.sentence?.fineAmount
                  ? `${formatCurrency(record.sentence.fineAmount)}${
                      record.sentence.finePaid ? ' (réglée)' : ' (due)'
                    }`
                  : null
              }
            />
          </Panel>

          {projectedStatus && (
            <Panel title="Effet sur le citoyen" dense sx={{ borderColor: 'warning.main' }}>
              <Typography sx={{ fontSize: 11.5, color: 'warning.main' }}>
                Ce casier maintient le statut <strong>{projectedStatus}</strong> sur la fiche
                de {record.citizenSnapshot?.label}.
              </Typography>
            </Panel>
          )}
        </Stack>
      }
      footer={
        <>
          {readOnly ? (
            <Typography sx={{ fontSize: 11, color: 'warning.main' }}>
              {archived ? 'Casier archivé — lecture seule.' : 'Lecture seule.'}
            </Typography>
          ) : (
            <AutoSaveIndicator
              state={autoSave.state}
              savedAt={autoSave.savedAt}
              error={autoSave.error}
            />
          )}
          <Box sx={{ flex: 1 }} />
          <Typography className="mono" sx={{ fontSize: 10.5, color: 'text.disabled' }}>
            {record.id}
          </Typography>
        </>
      }
    >
      {renderTab()}
    </RecordLayout>
  );
}
