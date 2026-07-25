import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  MdDirectionsCar,
  MdPerson,
  MdDescription,
  MdHistory,
  MdArchive,
  MdArrowBack,
  MdWarning,
  MdLocalParking,
} from 'react-icons/md';
import RecordLayout from '@/layouts/RecordLayout';
import PhotoPreview from '@/components/media/PhotoPreview';
import StatusChip, { SeverityChip } from '@/components/system/StatusChip';
import Panel from '@/components/system/Panel';
import KeyValueRow from '@/components/system/KeyValueRow';
import SectionCard from '@/components/system/SectionCard';
import { OwnerAssignment, HistoryTimeline } from '@/components/data';
import {
  Form,
  FormRow,
  FormWatcher,
  TextField,
  SelectField,
  NumberField,
  DateField,
  TagInput,
  PhotoUrlField,
  AutoSaveIndicator,
} from '@/components/form';
import Can from '@/components/auth/Can';
import ModuleSkeleton from '@/components/feedback/ModuleSkeleton';
import EmptyState from '@/components/data/EmptyState';
import RelationTab from '@/modules/citizens/components/tabs/RelationTab';
import { vehicleSchema, toVehicleForm } from '../schemas/vehicleSchema';
import {
  useVehicle,
  useVehicleHistory,
  useUpdateVehicle,
  useRemoveVehicle,
  useAssignVehicleOwner,
  useSetImpound,
} from '@/hooks/data/useVehicles';
import { useCitizen } from '@/hooks/data/useCitizens';
import useAutoSave from '@/hooks/ui/useAutoSave';
import useConfirm from '@/hooks/ui/useConfirm';
import useWorkspace from '@/hooks/ui/useWorkspace';
import useOpenRecord from '@/hooks/ui/useOpenRecord';
import usePermission from '@/hooks/auth/usePermission';
import { PERMISSIONS } from '@/utils/permissions';
import { ROUTES, ENTITY_TYPES } from '@/app/config/constants';
import { formatDate } from '@/utils/dates';
import {
  VEHICLE_TYPE_LABELS,
  REGISTRATION_STATUS_LABELS,
  INSURANCE_STATUS_LABELS,
  VEHICLE_FLAG_LABELS,
  VEHICLE_EVENT_LABELS,
  VEHICLE_FIELD_LABELS,
  COMMON_COLORS,
} from '@/types/vehicles';

const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/**
 * Fiche véhicule.
 *
 * Même ergonomie que la fiche citoyen : édition en place, enregistrement
 * automatique, chronologie. Le rattachement à un propriétaire est une action
 * distincte de l'édition — elle touche deux fiches et doit laisser une trace
 * des deux côtés.
 */
export default function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const openRecord = useOpenRecord();
  const { updateTab, closeTab, setDirty } = useWorkspace();

  const [activeTab, setActiveTab] = useState('specs');

  const canUpdate = usePermission(PERMISSIONS.VEHICLES_UPDATE);

  const { data: vehicle, isLoading, error } = useVehicle(id);
  const { data: history = [], isLoading: historyLoading } = useVehicleHistory(id);
  const { data: owner } = useCitizen(vehicle?.ownerId);

  const updateVehicle = useUpdateVehicle();
  const removeVehicle = useRemoveVehicle();
  const assignOwner = useAssignVehicleOwner();
  const setImpound = useSetImpound();

  const persist = useCallback(
    async (values) => {
      const parsed = vehicleSchema.safeParse(values);
      if (!parsed.success) {
        throw new Error('Formulaire incomplet : enregistrement suspendu.');
      }
      // `ownerId` est piloté par le rattachement, jamais par le formulaire.
      const { ownerId: _ignored, ...patch } = parsed.data;
      await updateVehicle.mutateAsync({ id, patch, previous: vehicle });
    },
    [id, vehicle, updateVehicle],
  );

  const autoSave = useAutoSave(persist, { enabled: canUpdate });

  useEffect(() => {
    if (!vehicle) return;
    setDirty(`${ENTITY_TYPES.VEHICLE}:${id}`, autoSave.isDirty);
  }, [autoSave.isDirty, vehicle, id, setDirty]);

  useEffect(() => {
    if (!vehicle) return;
    updateTab(`${ENTITY_TYPES.VEHICLE}:${id}`, {
      title: vehicle.plate,
      subtitle: [vehicle.make, vehicle.model].filter(Boolean).join(' '),
    });
  }, [vehicle, id, updateTab]);

  const tabs = useMemo(
    () => [
      { id: 'specs', label: 'Fiche technique', icon: <MdDirectionsCar size={14} /> },
      { id: 'owner', label: 'Propriétaire', icon: <MdPerson size={14} /> },
      { id: 'reports', label: 'Rapports', count: 0, icon: <MdDescription size={14} /> },
      { id: 'history', label: 'Historique', icon: <MdHistory size={14} /> },
    ],
    [],
  );

  if (isLoading) return <ModuleSkeleton rows={6} />;

  if (error || !vehicle) {
    return (
      <Box sx={{ flex: 1, display: 'flex' }}>
        <EmptyState
          title={error ? 'Fiche inaccessible' : 'Véhicule introuvable'}
          message={error?.message ?? "Ce véhicule n'existe pas ou a été archivé."}
          action={
            <Button
              variant="contained"
              startIcon={<MdArrowBack />}
              onClick={() => navigate(ROUTES.VEHICLES)}
            >
              Retour au registre
            </Button>
          }
        />
      </Box>
    );
  }

  const archived = Boolean(vehicle.deletedAt);
  const readOnly = !canUpdate || archived;
  const flags = vehicle.flags ?? [];
  const impounded = Boolean(vehicle.impound?.isImpounded);

  const archive = async () => {
    const { confirmed, reason } = await confirm({
      title: 'Archiver la fiche véhicule',
      entityType: 'Véhicule',
      entityLabel: `${vehicle.plate} — ${vehicle.make} ${vehicle.model}`,
      danger: true,
      requireReason: true,
    });
    if (!confirmed) return;

    await removeVehicle.mutateAsync({ id, reason, previous: vehicle });
    closeTab(`${ENTITY_TYPES.VEHICLE}:${id}`);
    navigate(ROUTES.VEHICLES);
  };

  const toggleImpound = async () => {
    if (impounded) {
      setImpound.mutate({ vehicle, impounded: false });
      return;
    }
    const { confirmed, reason } = await confirm({
      title: 'Mise en fourrière',
      message: 'Le véhicule sera signalé comme immobilisé par le service.',
      entityType: 'Véhicule',
      entityLabel: vehicle.plate,
      requireReason: true,
      confirmLabel: 'Placer en fourrière',
    });
    if (confirmed) {
      setImpound.mutate({ vehicle, impounded: true, lot: 'Fourrière municipale', reason });
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'specs':
        return (
          <Form
            key={id}
            schema={vehicleSchema}
            defaultValues={toVehicleForm(vehicle)}
            onSubmit={() => {}}
            mode="onChange"
          >
            <FormWatcher onChange={autoSave.markDirty} enabled={!readOnly} />

            <SectionCard title="Identification" icon={<MdDirectionsCar />}>
              <Box sx={{ mb: 1.5 }}>
                <PhotoUrlField
                  name="photoUrl"
                  label="Photographie"
                  previewWidth={150}
                  previewHeight={98}
                />
              </Box>

              <FormRow>
                <TextField name="plate" label="Plaque" mono disabled={readOnly} />
                <TextField name="vin" label="VIN" mono disabled={readOnly} />
              </FormRow>

              <FormRow>
                <TextField name="make" label="Marque" disabled={readOnly} />
                <TextField name="model" label="Modèle" disabled={readOnly} />
                <NumberField name="year" label="Année" disabled={readOnly} />
              </FormRow>

              <FormRow>
                <SelectField
                  name="color"
                  label="Couleur"
                  options={COMMON_COLORS.map((color) => ({ value: color, label: color }))}
                  allowEmpty
                  disabled={readOnly}
                />
                <SelectField
                  name="type"
                  label="Type"
                  options={toOptions(VEHICLE_TYPE_LABELS)}
                  disabled={readOnly}
                />
              </FormRow>
            </SectionCard>

            <SectionCard title="Situation administrative" icon={<MdWarning />}>
              <FormRow>
                <SelectField
                  name="registrationStatus"
                  label="Immatriculation"
                  options={toOptions(REGISTRATION_STATUS_LABELS)}
                  disabled={readOnly}
                />
                <SelectField
                  name="insurance.status"
                  label="Assurance"
                  options={toOptions(INSURANCE_STATUS_LABELS)}
                  disabled={readOnly}
                />
              </FormRow>

              <FormRow>
                <TextField name="insurance.company" label="Assureur" disabled={readOnly} />
                <TextField
                  name="insurance.policyNumber"
                  label="N° de police"
                  mono
                  disabled={readOnly}
                />
                <DateField
                  name="insurance.expiresAt"
                  label="Échéance"
                  disabled={readOnly}
                />
              </FormRow>

              <Box sx={{ mb: 1.5 }}>
                <TagInput
                  name="flags"
                  label="Signalements"
                  suggestions={Object.keys(VEHICLE_FLAG_LABELS)}
                  disabled={readOnly}
                  helperText="Visibles en tête de fiche et dans le registre."
                />
              </Box>
            </SectionCard>

            <SectionCard title="État et description">
              <TextField
                name="condition"
                label="État du véhicule"
                multiline
                minRows={2}
                disabled={readOnly}
                sx={{ mb: 1.5 }}
              />
              <TextField
                name="description"
                label="Description"
                multiline
                minRows={3}
                disabled={readOnly}
              />
            </SectionCard>
          </Form>
        );

      case 'owner':
        return (
          <OwnerAssignment
            owner={owner ?? null}
            snapshot={vehicle.ownerSnapshot ?? null}
            readOnly={readOnly}
            busy={assignOwner.isPending}
            title="Propriétaire du véhicule"
            emptyMessage="Ce véhicule n'est rattaché à aucun citoyen du registre."
            onAssign={(citizen) =>
              assignOwner.mutate({
                vehicle,
                newOwner: citizen,
                previousOwner: owner ?? null,
              })
            }
            onOpenOwner={(citizenId) =>
              openRecord({
                type: ENTITY_TYPES.CITIZEN,
                id: citizenId,
                title: vehicle.ownerSnapshot?.label ?? 'Citoyen',
              })
            }
          />
        );

      case 'reports':
        return (
          <RelationTab
            title="Rapports mentionnant ce véhicule"
            phase={5}
            count={0}
            icon={<MdDescription />}
            scope={[
              'Numéro, type, date et agent rédacteur',
              'Rôle du véhicule : suspect, victime, saisi',
              'Ouverture du rapport dans un onglet',
            ]}
          />
        );

      case 'history':
        return (
          <HistoryTimeline
            events={history}
            loading={historyLoading}
            eventLabels={VEHICLE_EVENT_LABELS}
            fieldLabels={VEHICLE_FIELD_LABELS}
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
          url={vehicle.photoUrl}
          width={170}
          height={112}
          alt={vehicle.plate}
          emptyLabel="Sans photo"
        />
      }
      title={vehicle.plate}
      subtitle={vehicle.vin ? `VIN ${vehicle.vin}` : 'VIN non renseigné'}
      badges={
        <Stack direction="row" spacing={0.75} alignItems="center">
          <StatusChip
            status={vehicle.registrationStatus}
            label={
              REGISTRATION_STATUS_LABELS[vehicle.registrationStatus] ??
              vehicle.registrationStatus
            }
          />
          {archived && <StatusChip status="INACTIVE" label="ARCHIVÉE" />}
          {impounded && <SeverityChip label="EN FOURRIÈRE" tone="purple" />}
          {flags.map((flag) => (
            <SeverityChip
              key={flag}
              label={VEHICLE_FLAG_LABELS[flag] ?? flag}
              icon={<MdWarning size={11} />}
            />
          ))}
        </Stack>
      }
      meta={
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            {[vehicle.make, vehicle.model].filter(Boolean).join(' ')}
            {vehicle.year ? ` · ${vehicle.year}` : ''}
            {vehicle.color ? ` · ${vehicle.color}` : ''}
            {` · ${VEHICLE_TYPE_LABELS[vehicle.type] ?? vehicle.type}`}
          </Typography>

          {vehicle.ownerSnapshot && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <MdPerson size={12} color="var(--muted-dim)" />
              <Typography
                sx={{ fontSize: 12, color: 'primary.main', cursor: 'pointer' }}
                onClick={() =>
                  openRecord({
                    type: ENTITY_TYPES.CITIZEN,
                    id: vehicle.ownerSnapshot.id,
                    title: vehicle.ownerSnapshot.label,
                  })
                }
              >
                {vehicle.ownerSnapshot.label}
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
            onClick={() => navigate(ROUTES.VEHICLES)}
          >
            Registre
          </Button>

          {!archived && (
            <Can do={PERMISSIONS.VEHICLES_UPDATE}>
              <Button
                variant="outlined"
                color={impounded ? 'primary' : 'warning'}
                startIcon={<MdLocalParking />}
                onClick={toggleImpound}
                disabled={setImpound.isPending}
              >
                {impounded ? 'Sortir de fourrière' : 'Fourrière'}
              </Button>
            </Can>
          )}

          {!archived && (
            <Can do={PERMISSIONS.VEHICLES_DELETE}>
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
              label="Type"
              labelWidth={92}
              value={VEHICLE_TYPE_LABELS[vehicle.type] ?? vehicle.type}
            />
            <KeyValueRow label="Année" labelWidth={92} value={vehicle.year} mono />
            <KeyValueRow label="Couleur" labelWidth={92} value={vehicle.color} />
            <KeyValueRow
              label="Assurance"
              labelWidth={92}
              value={
                INSURANCE_STATUS_LABELS[vehicle.insurance?.status] ??
                vehicle.insurance?.status
              }
            />
            <KeyValueRow
              label="Échéance"
              labelWidth={92}
              value={
                vehicle.insurance?.expiresAt ? formatDate(vehicle.insurance.expiresAt) : null
              }
            />
          </Panel>

          {impounded && (
            <Panel title="Fourrière" icon={<MdLocalParking />} dense>
              <KeyValueRow label="Dépôt" labelWidth={80} value={vehicle.impound?.lot} />
              <KeyValueRow
                label="Depuis"
                labelWidth={80}
                value={vehicle.impound?.since ? formatDate(vehicle.impound.since) : null}
              />
              <KeyValueRow label="Motif" labelWidth={80} value={vehicle.impound?.reason} />
            </Panel>
          )}
        </Stack>
      }
      footer={
        <>
          {readOnly ? (
            <Typography sx={{ fontSize: 11, color: 'warning.main' }}>
              {archived ? 'Fiche archivée — lecture seule.' : 'Lecture seule.'}
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
            {vehicle.id}
          </Typography>
        </>
      }
    >
      {renderTab()}
    </RecordLayout>
  );
}
