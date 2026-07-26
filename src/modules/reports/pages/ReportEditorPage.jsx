import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  MdArrowBack,
  MdHistory,
  MdSend,
  MdDraw,
  MdArchive,
  MdRestore,
  MdCheckCircle,
} from 'react-icons/md';
import TipTapEditor from '@/components/editor/TipTapEditor';
import ReportPartiesPanel from '../components/ReportPartiesPanel';
import TitleBar from '@/components/system/TitleBar';
import Panel from '@/components/system/Panel';
import StatusChip from '@/components/system/StatusChip';
import SplitPane from '@/components/system/SplitPane';
import { AutoSaveIndicator } from '@/components/form';
import Can from '@/components/auth/Can';
import ModuleSkeleton from '@/components/feedback/ModuleSkeleton';
import EmptyState from '@/components/data/EmptyState';
import {
  useReport,
  useUpdateReport,
  useChangeReportStatus,
  useSignReport,
  useRemoveReport,
  useReportRevisions,
  useSaveRevision,
  useRestoreRevision,
} from '@/hooks/data/useReports';
import useAutoSave from '@/hooks/ui/useAutoSave';
import useConfirm from '@/hooks/ui/useConfirm';
import useWorkspace from '@/hooks/ui/useWorkspace';
import useAuth from '@/hooks/auth/useAuth';
import usePermission from '@/hooks/auth/usePermission';
import { PERMISSIONS } from '@/utils/permissions';
import { ROUTES, ENTITY_TYPES } from '@/app/config/constants';
import { formatDateTime, formatDate, DATE_FORMATS } from '@/utils/dates';
import {
  REPORT_TYPE_LABELS,
  REPORT_CLASSIFICATION_LABELS,
  REPORT_PRIORITY_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_TRANSITIONS,
  REVIEW_TRANSITIONS,
  EDITABLE_STATUSES,
} from '@/types/reports';

const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/**
 * Éditeur de rapport.
 *
 * Le corps du rapport et ses métadonnées sont enregistrés automatiquement ;
 * chaque enregistrement du corps produit aussi une révision, ce qui permet de
 * revenir en arrière après une fausse manœuvre.
 *
 * Le droit d'écrire dépend du statut : une fois approuvé, un rapport ne se
 * modifie plus — c'est une pièce de procédure. Les règles Firestore appliquent
 * la même contrainte côté serveur.
 */
export default function ReportEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { user } = useAuth();
  const { updateTab, closeTab, setDirty } = useWorkspace();

  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [statusAnchor, setStatusAnchor] = useState(null);

  const canUpdateAny = usePermission(PERMISSIONS.REPORTS_UPDATE_ANY);
  const canUpdateOwn = usePermission(PERMISSIONS.REPORTS_UPDATE_OWN);
  const canValidate = usePermission(PERMISSIONS.REPORTS_VALIDATE);

  const { data: report, isLoading, error } = useReport(id);
  const { data: revisions = [] } = useReportRevisions(revisionsOpen ? id : null);

  const updateReport = useUpdateReport();
  const changeStatus = useChangeReportStatus();
  const signReport = useSignReport();
  const removeReport = useRemoveReport();
  const saveRevision = useSaveRevision();
  const restoreRevision = useRestoreRevision();

  const isAuthor = report?.createdBy === user?.uid;
  const statusEditable = report ? EDITABLE_STATUSES.includes(report.status) : false;
  const archived = Boolean(report?.deletedAt);

  const readOnly =
    archived || !statusEditable || !(canUpdateAny || (isAuthor && canUpdateOwn));

  /**
   * Enregistre une modification (corps ou métadonnées) puis, s'il s'agit du
   * corps, archive une révision.
   */
  const persist = useCallback(
    async (patch) => {
      if (!patch || !report) return;
      await updateReport.mutateAsync({ id, patch, previous: report });

      if (patch.content !== undefined) {
        await saveRevision.mutateAsync({
          reportId: id,
          content: patch.content,
          contentText: patch.contentText ?? '',
          auto: true,
        });
      }
    },
    [id, report, updateReport, saveRevision],
  );

  const autoSave = useAutoSave(persist, { enabled: !readOnly });

  useEffect(() => {
    if (!report) return;
    setDirty(`${ENTITY_TYPES.REPORT}:${id}`, autoSave.isDirty);
  }, [autoSave.isDirty, report, id, setDirty]);

  useEffect(() => {
    if (!report) return;
    updateTab(`${ENTITY_TYPES.REPORT}:${id}`, {
      title: report.number,
      subtitle: report.title,
    });
  }, [report, id, updateTab]);

  /** Transitions proposées : celles du circuit, filtrées par les permissions. */
  const transitions = useMemo(() => {
    if (!report) return [];
    return (REPORT_TRANSITIONS[report.status] ?? []).filter((status) =>
      REVIEW_TRANSITIONS.includes(status) ? canValidate : isAuthor || canUpdateAny,
    );
  }, [report, canValidate, isAuthor, canUpdateAny]);

  if (isLoading) return <ModuleSkeleton rows={6} />;

  if (error || !report) {
    return (
      <Box sx={{ flex: 1, display: 'flex' }}>
        <EmptyState
          title={error ? 'Rapport inaccessible' : 'Rapport introuvable'}
          message={
            error?.message ??
            "Ce rapport n'existe pas, a été archivé, ou sa classification dépasse votre habilitation."
          }
          action={
            <Button
              variant="contained"
              startIcon={<MdArrowBack />}
              onClick={() => navigate(ROUTES.REPORTS)}
            >
              Retour au registre
            </Button>
          }
        />
      </Box>
    );
  }

  /** Applique une transition, en demandant un motif pour un rejet. */
  const applyTransition = async (status) => {
    setStatusAnchor(null);

    if (status === 'REJECTED') {
      const { confirmed, reason } = await confirm({
        title: 'Rejeter le rapport',
        message: "L'auteur pourra le corriger et le soumettre à nouveau.",
        entityType: 'Rapport',
        entityLabel: `${report.number} — ${report.title}`,
        requireReason: true,
        confirmLabel: 'Rejeter',
      });
      if (!confirmed) return;
      changeStatus.mutate({ report, status, comment: reason });
      return;
    }

    changeStatus.mutate({ report, status });
  };

  const archive = async () => {
    const { confirmed, reason } = await confirm({
      title: 'Archiver le rapport',
      entityType: 'Rapport',
      entityLabel: `${report.number} — ${report.title}`,
      danger: true,
      requireReason: true,
    });
    if (!confirmed) return;

    await removeReport.mutateAsync({ id, reason, previous: report });
    closeTab(`${ENTITY_TYPES.REPORT}:${id}`);
    navigate(ROUTES.REPORTS);
  };

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* En-tête */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          px: 1.75,
          height: 'var(--header-h)',
          flexShrink: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'var(--navy-850)',
        }}
      >
        <Typography className="mono" sx={{ fontSize: 13, fontWeight: 700 }}>
          {report.number}
        </Typography>

        <Typography sx={{ fontSize: 13 }} noWrap>
          {report.title || 'Sans titre'}
        </Typography>

        <StatusChip
          status={report.status}
          label={REPORT_STATUS_LABELS[report.status] ?? report.status}
        />

        {report.signature && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <MdCheckCircle size={13} color="var(--ok)" />
            <Typography sx={{ fontSize: 11, color: 'success.main' }}>
              Signé par {report.signature.name}
            </Typography>
          </Stack>
        )}

        <Box sx={{ flex: 1 }} />

        <Button
          variant="outlined"
          startIcon={<MdArrowBack />}
          onClick={() => navigate(ROUTES.REPORTS)}
        >
          Registre
        </Button>

        <Button
          variant="outlined"
          startIcon={<MdHistory />}
          onClick={() => setRevisionsOpen(true)}
        >
          Versions
        </Button>

        {!readOnly && !report.signature && (
          <Button
            variant="outlined"
            startIcon={<MdDraw />}
            onClick={() => signReport.mutate({ report })}
            disabled={signReport.isPending}
          >
            Signer
          </Button>
        )}

        {transitions.length > 0 && !archived && (
          <>
            <Button
              variant="contained"
              startIcon={<MdSend />}
              onClick={(event) => setStatusAnchor(event.currentTarget)}
            >
              Faire avancer
            </Button>
            <Menu
              anchorEl={statusAnchor}
              open={Boolean(statusAnchor)}
              onClose={() => setStatusAnchor(null)}
            >
              {transitions.map((status) => (
                <MenuItem key={status} onClick={() => applyTransition(status)}>
                  {REPORT_STATUS_LABELS[status] ?? status}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}

        {!archived && (
          <Can do={PERMISSIONS.REPORTS_DELETE}>
            <Button variant="outlined" color="error" startIcon={<MdArchive />} onClick={archive}>
              Archiver
            </Button>
          </Can>
        )}
      </Stack>

      {/* Corps : éditeur à gauche, métadonnées et parties à droite */}
      <SplitPane
        storageKey="report-editor"
        defaultSize={380}
        min={320}
        max={560}
        primary={
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', p: 1.5 }}>
            <TipTapEditor
              key={id}
              content={report.content}
              readOnly={readOnly}
              onChange={({ content, contentText }) =>
                autoSave.markDirty({ content, contentText })
              }
              statusBar={
                readOnly ? (
                  <Typography sx={{ fontSize: 10.5, color: 'warning.main' }}>
                    {archived
                      ? 'Rapport archivé'
                      : !statusEditable
                        ? `Rapport ${REPORT_STATUS_LABELS[report.status]?.toLowerCase()} — lecture seule`
                        : 'Lecture seule'}
                  </Typography>
                ) : (
                  <AutoSaveIndicator
                    state={autoSave.state}
                    savedAt={autoSave.savedAt}
                    error={autoSave.error}
                  />
                )
              }
            />
          </Box>
        }
        secondary={
          <Box className="scroll-compact" sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
            <Stack spacing={1.5}>
              <Panel title="Métadonnées" dense>
                <Stack spacing={1.25}>
                  <TextField
                    label="Titre"
                    value={report.title ?? ''}
                    onChange={(event) => autoSave.markDirty({ title: event.target.value })}
                    disabled={readOnly}
                  />

                  <TextField
                    select
                    label="Type"
                    value={report.type}
                    onChange={(event) => autoSave.markDirty({ type: event.target.value })}
                    disabled={readOnly}
                  >
                    {toOptions(REPORT_TYPE_LABELS).map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Classification"
                    value={report.classification}
                    onChange={(event) =>
                      autoSave.markDirty({ classification: event.target.value })
                    }
                    disabled={readOnly}
                    helperText="Confidentiel : sergent et plus. Scellé : capitaine et plus."
                  >
                    {toOptions(REPORT_CLASSIFICATION_LABELS).map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Priorité"
                    value={report.priority}
                    onChange={(event) => autoSave.markDirty({ priority: event.target.value })}
                    disabled={readOnly}
                  >
                    {toOptions(REPORT_PRIORITY_LABELS).map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    type="datetime-local"
                    label="Date et heure des faits"
                    value={
                      report.occurredAt
                        ? formatDate(report.occurredAt, 'YYYY-MM-DDTHH:mm', '')
                        : ''
                    }
                    onChange={(event) =>
                      autoSave.markDirty({
                        occurredAt: event.target.value ? new Date(event.target.value) : null,
                      })
                    }
                    disabled={readOnly}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />

                  <TextField
                    label="Lieu"
                    value={report.location?.label ?? ''}
                    onChange={(event) =>
                      autoSave.markDirty({
                        location: { ...report.location, label: event.target.value },
                      })
                    }
                    disabled={readOnly}
                  />

                  <TextField
                    label="Résumé"
                    value={report.summary ?? ''}
                    onChange={(event) => autoSave.markDirty({ summary: event.target.value })}
                    disabled={readOnly}
                    multiline
                    minRows={2}
                  />
                </Stack>
              </Panel>

              <ReportPartiesPanel
                report={report}
                readOnly={readOnly}
                onChange={(patch) => autoSave.markDirty(patch)}
              />

              {report.review && (
                <Panel title="Dernière revue" dense>
                  <Typography sx={{ fontSize: 11.5 }}>
                    {report.review.byName} — {formatDateTime(report.review.at)}
                  </Typography>
                  {report.review.comment && (
                    <Typography sx={{ fontSize: 11.5, color: 'warning.main', mt: 0.5 }}>
                      « {report.review.comment} »
                    </Typography>
                  )}
                </Panel>
              )}
            </Stack>
          </Box>
        }
      />

      {/* Historique des versions */}
      <Dialog open={revisionsOpen} onClose={() => setRevisionsOpen(false)} maxWidth="sm" fullWidth>
        <TitleBar
          icon={<MdHistory />}
          title="Versions enregistrées"
          onClose={() => setRevisionsOpen(false)}
        />
        <DialogContent sx={{ p: 2 }}>
          {revisions.length === 0 ? (
            <EmptyState
              title="Aucune version"
              message="Les versions sont créées automatiquement à chaque enregistrement du corps du rapport."
            />
          ) : (
            <Stack spacing={0.5}>
              {revisions.map((revision) => (
                <Stack
                  key={revision.id}
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '3px',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography className="mono" sx={{ fontSize: 11.5 }}>
                      {formatDate(revision.savedAt, DATE_FORMATS.DATETIME, '—')}
                    </Typography>
                    <Typography sx={{ fontSize: 10.5, color: 'text.secondary' }}>
                      {revision.savedByName} ·{' '}
                      {(revision.contentText ?? '').length} caractères ·{' '}
                      {revision.auto ? 'automatique' : 'manuelle'}
                    </Typography>
                  </Box>

                  {!readOnly && (
                    <Button
                      size="small"
                      startIcon={<MdRestore />}
                      onClick={async () => {
                        const { confirmed } = await confirm({
                          title: 'Restaurer cette version',
                          message:
                            'Le corps actuel du rapport sera remplacé. Une nouvelle version sera créée, rien n\'est perdu.',
                          confirmLabel: 'Restaurer',
                        });
                        if (!confirmed) return;
                        restoreRevision.mutate({ report, revision });
                        setRevisionsOpen(false);
                      }}
                    >
                      Restaurer
                    </Button>
                  )}
                </Stack>
              ))}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
