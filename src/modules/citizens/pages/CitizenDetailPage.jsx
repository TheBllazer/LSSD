import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Stack, Typography, Tooltip } from '@mui/material';
import {
  MdBadge,
  MdDirectionsCar,
  MdDescription,
  MdGavel,
  MdPhotoLibrary,
  MdHistory,
  MdStickyNote2,
  MdArchive,
  MdArrowBack,
  MdWarning,
  MdPhone,
  MdHome,
  MdWork,
} from 'react-icons/md';
import { GiPistolGun } from 'react-icons/gi';
import RecordLayout from '@/layouts/RecordLayout';
import PhotoPreview from '@/components/media/PhotoPreview';
import StatusChip from '@/components/system/StatusChip';
import { SeverityChip } from '@/components/system/StatusChip';
import { AutoSaveIndicator } from '@/components/form';
import PdfExportButton from '@/components/pdf/PdfExportButton';
import Can from '@/components/auth/Can';
import ModuleSkeleton from '@/components/feedback/ModuleSkeleton';
import EmptyState from '@/components/data/EmptyState';
import IdentityTab from '../components/tabs/IdentityTab';
import PhotosTab from '../components/tabs/PhotosTab';
import HistoryTab from '../components/tabs/HistoryTab';
import NotesTab from '../components/tabs/NotesTab';
import RelationTab from '../components/tabs/RelationTab';
import {
  CitizenVehiclesTab,
  CitizenWeaponsTab,
  CitizenRecordsTab,
} from '../components/tabs/OwnedAssetsTab';
import CitizenSummaryPanel from '../components/CitizenSummaryPanel';
import { citizenSchema } from '../schemas/citizenSchema';
import {
  useCitizen,
  useCitizenHistory,
  useCitizenNotes,
  useCitizenNoteActions,
  useCitizenPhotos,
  useCitizenPhotoActions,
  useUpdateCitizen,
  useRemoveCitizen,
} from '@/hooks/data/useCitizens';
import useAutoSave from '@/hooks/ui/useAutoSave';
import useConfirm from '@/hooks/ui/useConfirm';
import useAuth from '@/hooks/auth/useAuth';
import useWorkspace from '@/hooks/ui/useWorkspace';
import usePermission from '@/hooks/auth/usePermission';
import { PERMISSIONS } from '@/utils/permissions';
import { registryName, formatPhone } from '@/utils/format';
import { formatDate, computeAge } from '@/utils/dates';
import { ROUTES, ENTITY_TYPES } from '@/app/config/constants';
import {
  SEX_ABBR,
  CITIZEN_STATUS_LABELS,
  CITIZEN_FLAG_LABELS,
} from '@/types/citizens';

/**
 * Fiche citoyen.
 *
 * Édition en place avec enregistrement automatique : il n'y a pas de mode
 * « consultation » puis « modification ». L'agent corrige une adresse, la
 * fiche est écrite une seconde plus tard, et l'état de l'enregistrement reste
 * affiché en pied de page.
 */
export default function CitizenDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { user, level } = useAuth();
  const { updateTab, closeTab, setDirty } = useWorkspace();

  const [activeTab, setActiveTab] = useState('identity');

  const canUpdate = usePermission(PERMISSIONS.CITIZENS_UPDATE);

  const { data: citizen, isLoading, error } = useCitizen(id);
  const { data: history = [], isLoading: historyLoading } = useCitizenHistory(id);
  const { data: notes = [], isLoading: notesLoading } = useCitizenNotes(id);
  const { data: photos = [], isLoading: photosLoading } = useCitizenPhotos(id);

  const updateCitizen = useUpdateCitizen();
  const removeCitizen = useRemoveCitizen();
  const noteActions = useCitizenNoteActions(id);
  const photoActions = useCitizenPhotoActions(id);

  /**
   * Enregistrement d'une modification.
   *
   * Les valeurs passent par le même schéma que le formulaire de création : une
   * fiche invalide n'est jamais écrite, et l'agent voit l'erreur sur le champ
   * concerné plutôt qu'un échec opaque.
   */
  const persist = useCallback(
    async (values) => {
      const parsed = citizenSchema.safeParse(values);
      if (!parsed.success) {
        // La saisie est incomplète ou invalide : on n'écrit pas, mais on ne
        // signale pas d'erreur non plus — les champs portent déjà le message.
        throw new Error('Formulaire incomplet : enregistrement suspendu.');
      }
      await updateCitizen.mutateAsync({
        id,
        patch: parsed.data,
        previous: citizen,
      });
    },
    [id, citizen, updateCitizen],
  );

  const autoSave = useAutoSave(persist, { enabled: canUpdate });

  // L'onglet de l'espace de travail porte le point « modifications en cours ».
  useEffect(() => {
    if (!citizen) return;
    setDirty(`${ENTITY_TYPES.CITIZEN}:${id}`, autoSave.isDirty);
  }, [autoSave.isDirty, citizen, id, setDirty]);

  // Le libellé de l'onglet suit le nom de la fiche, y compris après correction.
  useEffect(() => {
    if (!citizen) return;
    updateTab(`${ENTITY_TYPES.CITIZEN}:${id}`, {
      title: registryName(citizen),
      subtitle: formatDate(citizen.birthDate),
    });
  }, [citizen, id, updateTab]);

  const tabs = useMemo(() => {
    const counters = citizen?.counters ?? {};
    return [
      { id: 'identity', label: 'Identité', icon: <MdBadge size={14} /> },
      {
        id: 'vehicles',
        label: 'Véhicules',
        count: counters.vehicles ?? 0,
        icon: <MdDirectionsCar size={14} />,
      },
      {
        id: 'weapons',
        label: 'Armes',
        count: counters.weapons ?? 0,
        icon: <GiPistolGun size={14} />,
      },
      {
        id: 'reports',
        label: 'Rapports',
        count: counters.reports ?? 0,
        icon: <MdDescription size={14} />,
      },
      {
        id: 'record',
        label: 'Casier',
        count: counters.records ?? 0,
        icon: <MdGavel size={14} />,
      },
      {
        id: 'photos',
        label: 'Photos',
        count: photos.length,
        icon: <MdPhotoLibrary size={14} />,
      },
      { id: 'history', label: 'Historique', icon: <MdHistory size={14} /> },
      {
        id: 'notes',
        label: 'Notes',
        count: notes.length,
        icon: <MdStickyNote2 size={14} />,
      },
    ];
  }, [citizen, photos.length, notes.length]);

  if (isLoading) return <ModuleSkeleton rows={6} />;

  if (error || !citizen) {
    return (
      <Box sx={{ flex: 1, display: 'flex' }}>
        <EmptyState
          title={error ? 'Fiche inaccessible' : 'Fiche introuvable'}
          message={
            error?.message ??
            "Cette fiche n'existe pas ou a été archivée. Elle reste consultable par un administrateur."
          }
          action={
            <Button
              variant="contained"
              startIcon={<MdArrowBack />}
              onClick={() => navigate(ROUTES.CITIZENS)}
            >
              Retour au registre
            </Button>
          }
        />
      </Box>
    );
  }

  const archived = Boolean(citizen.deletedAt);
  const readOnly = !canUpdate || archived;
  const age = computeAge(citizen.birthDate);
  const flags = citizen.flags ?? [];

  /** Archive la fiche puis ferme son onglet. */
  const archive = async () => {
    const { confirmed, reason } = await confirm({
      title: 'Archiver la fiche citoyen',
      message: 'Cette fiche ne remontera plus dans les registres ni la recherche.',
      entityType: 'Citoyen',
      entityLabel: registryName(citizen),
      danger: true,
      requireReason: true,
    });
    if (!confirmed) return;

    await removeCitizen.mutateAsync({ id, reason, previous: citizen });
    closeTab(`${ENTITY_TYPES.CITIZEN}:${id}`);
    navigate(ROUTES.CITIZENS);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'identity':
        return (
          <IdentityTab
            key={id}
            citizen={citizen}
            onDirty={autoSave.markDirty}
            readOnly={readOnly}
          />
        );

      case 'vehicles':
        return <CitizenVehiclesTab citizenId={id} />;

      case 'weapons':
        return <CitizenWeaponsTab citizenId={id} />;

      case 'reports':
        return (
          <RelationTab
            title="Rapports impliquant ce citoyen"
            phase={5}
            count={citizen.counters?.reports ?? 0}
            icon={<MdDescription />}
            scope={[
              'Numéro, type, date, agent rédacteur et statut de validation',
              'Rôle tenu par le citoyen : suspect, victime, témoin, plaignant',
              'Ouverture du rapport dans un onglet, en lecture ou en édition',
            ]}
          />
        );

      case 'record':
        return <CitizenRecordsTab citizenId={id} />;

      case 'photos':
        return (
          <PhotosTab
            photos={photos}
            loading={photosLoading}
            readOnly={readOnly}
            onAdd={(photo) => photoActions.create.mutate(photo)}
            onRemove={(photoId) => photoActions.remove.mutate(photoId)}
          />
        );

      case 'history':
        return <HistoryTab events={history} loading={historyLoading} />;

      case 'notes':
        return (
          <NotesTab
            notes={notes}
            loading={notesLoading}
            currentUid={user?.uid}
            level={level}
            readOnly={readOnly}
            onAdd={(body) => noteActions.create.mutate(body)}
            onTogglePin={(noteId, pinned) =>
              noteActions.togglePin.mutate({ noteId, pinned })
            }
            onRemove={(noteId) => noteActions.remove.mutate(noteId)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <RecordLayout
      photo={
        <PhotoPreview
          url={citizen.photoUrl}
          width={110}
          height={138}
          alt={registryName(citizen)}
          emptyLabel="Sans photo"
        />
      }
      title={registryName(citizen)}
      subtitle={`LSSD-C-${citizen.id.slice(0, 8).toUpperCase()}`}
      badges={
        <Stack direction="row" spacing={0.75} alignItems="center">
          <StatusChip
            status={citizen.status}
            label={CITIZEN_STATUS_LABELS[citizen.status] ?? citizen.status}
          />
          {archived && <StatusChip status="INACTIVE" label="ARCHIVÉE" />}
          {flags.map((flag) => (
            <SeverityChip
              key={flag}
              label={CITIZEN_FLAG_LABELS[flag] ?? flag}
              icon={<MdWarning size={11} />}
            />
          ))}
        </Stack>
      }
      meta={
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            {SEX_ABBR[citizen.sex] ?? '—'} · {formatDate(citizen.birthDate)}
            {age !== null ? ` · ${age} ans` : ''}
            {citizen.height ? ` · ${citizen.height} cm` : ''}
            {citizen.weight ? ` · ${citizen.weight} kg` : ''}
          </Typography>

          {citizen.phone && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <MdPhone size={12} color="var(--muted-dim)" />
              <Typography className="mono" sx={{ fontSize: 12 }}>
                {formatPhone(citizen.phone)}
              </Typography>
            </Stack>
          )}

          {citizen.address?.street && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <MdHome size={12} color="var(--muted-dim)" />
              <Typography sx={{ fontSize: 12 }}>
                {citizen.address.street}
                {citizen.address.district ? `, ${citizen.address.district}` : ''}
              </Typography>
            </Stack>
          )}

          {citizen.occupation && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <MdWork size={12} color="var(--muted-dim)" />
              <Typography sx={{ fontSize: 12 }}>
                {citizen.occupation}
                {citizen.employer ? ` — ${citizen.employer}` : ''}
              </Typography>
            </Stack>
          )}
        </Stack>
      }
      actions={
        <>
          <Tooltip title="Retour au registre">
            <Button
              variant="outlined"
              startIcon={<MdArrowBack />}
              onClick={() => navigate(ROUTES.CITIZENS)}
            >
              Registre
            </Button>
          </Tooltip>

          <PdfExportButton
            templateId="citizen"
            data={{ citizen }}
            entityType={ENTITY_TYPES.CITIZEN}
            entityId={citizen.id}
            entityLabel={registryName(citizen)}
          />

          {!archived && (
            <Can do={PERMISSIONS.CITIZENS_DELETE}>
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
      sidePanel={<CitizenSummaryPanel citizen={citizen} photoCount={photos.length} />}
      footer={
        <>
          {readOnly ? (
            <Typography sx={{ fontSize: 11, color: 'warning.main' }}>
              {archived
                ? 'Fiche archivée — lecture seule.'
                : "Lecture seule — vous n'avez pas la permission de modifier cette fiche."}
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
            {citizen.id}
          </Typography>
        </>
      }
    >
      {renderTab()}
    </RecordLayout>
  );
}
