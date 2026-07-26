import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import {
  MdPerson,
  MdDescription,
  MdHistory,
  MdArchive,
  MdArrowBack,
  MdGavel,
  MdVerifiedUser,
} from 'react-icons/md';
import { GiPistolGun } from 'react-icons/gi';
import RecordLayout from '@/layouts/RecordLayout';
import PhotoPreview from '@/components/media/PhotoPreview';
import StatusChip from '@/components/system/StatusChip';
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
  DateField,
  PhotoUrlField,
  AutoSaveIndicator,
} from '@/components/form';
import PdfExportButton from '@/components/pdf/PdfExportButton';
import Can from '@/components/auth/Can';
import ModuleSkeleton from '@/components/feedback/ModuleSkeleton';
import EmptyState from '@/components/data/EmptyState';
import RelationTab from '@/modules/citizens/components/tabs/RelationTab';
import { weaponSchema, toWeaponForm } from '../schemas/weaponSchema';
import {
  useWeapon,
  useWeaponHistory,
  useUpdateWeapon,
  useRemoveWeapon,
  useAssignWeaponHolder,
} from '@/hooks/data/useWeapons';
import { useCitizen } from '@/hooks/data/useCitizens';
import { checkLicenseCompliance } from '@/services/weapons.service';
import useAutoSave from '@/hooks/ui/useAutoSave';
import useConfirm from '@/hooks/ui/useConfirm';
import useWorkspace from '@/hooks/ui/useWorkspace';
import useOpenRecord from '@/hooks/ui/useOpenRecord';
import usePermission from '@/hooks/auth/usePermission';
import { PERMISSIONS } from '@/utils/permissions';
import { ROUTES, ENTITY_TYPES } from '@/app/config/constants';
import { formatDate } from '@/utils/dates';
import {
  WEAPON_CATEGORY_LABELS,
  WEAPON_CLASSIFICATION_LABELS,
  WEAPON_STATUS_LABELS,
  WEAPON_EVENT_LABELS,
  WEAPON_FIELD_LABELS,
  COMMON_CALIBERS,
} from '@/types/weapons';

const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/**
 * Fiche d'arme.
 *
 * Particularité du module : le contrôle de conformité du permis. Une arme
 * soumise à autorisation détenue par quelqu'un dont le permis est suspendu,
 * révoqué ou absent constitue une infraction — l'alerte est donc affichée en
 * tête de fiche, pas enfouie dans un onglet.
 */
export default function WeaponDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const openRecord = useOpenRecord();
  const { updateTab, closeTab, setDirty } = useWorkspace();

  const [activeTab, setActiveTab] = useState('specs');

  const canUpdate = usePermission(PERMISSIONS.WEAPONS_UPDATE);

  const { data: weapon, isLoading, error } = useWeapon(id);
  const { data: history = [], isLoading: historyLoading } = useWeaponHistory(id);
  const { data: owner } = useCitizen(weapon?.ownerId);

  const updateWeapon = useUpdateWeapon();
  const removeWeapon = useRemoveWeapon();
  const assignHolder = useAssignWeaponHolder();

  const persist = useCallback(
    async (values) => {
      const parsed = weaponSchema.safeParse(values);
      if (!parsed.success) {
        throw new Error('Formulaire incomplet : enregistrement suspendu.');
      }
      const { ownerId: _ignored, ...patch } = parsed.data;
      await updateWeapon.mutateAsync({ id, patch, previous: weapon });
    },
    [id, weapon, updateWeapon],
  );

  const autoSave = useAutoSave(persist, { enabled: canUpdate });

  useEffect(() => {
    if (!weapon) return;
    setDirty(`${ENTITY_TYPES.WEAPON}:${id}`, autoSave.isDirty);
  }, [autoSave.isDirty, weapon, id, setDirty]);

  useEffect(() => {
    if (!weapon) return;
    updateTab(`${ENTITY_TYPES.WEAPON}:${id}`, {
      title: weapon.serialNumber,
      subtitle: [weapon.make, weapon.model].filter(Boolean).join(' '),
    });
  }, [weapon, id, updateTab]);

  const compliance = useMemo(
    () => (weapon ? checkLicenseCompliance(weapon, owner ?? null) : null),
    [weapon, owner],
  );

  const tabs = useMemo(
    () => [
      { id: 'specs', label: 'Fiche technique', icon: <GiPistolGun size={14} /> },
      { id: 'owner', label: 'Détenteur & permis', icon: <MdPerson size={14} /> },
      { id: 'reports', label: 'Rapports', count: 0, icon: <MdDescription size={14} /> },
      { id: 'history', label: 'Historique', icon: <MdHistory size={14} /> },
    ],
    [],
  );

  if (isLoading) return <ModuleSkeleton rows={6} />;

  if (error || !weapon) {
    return (
      <Box sx={{ flex: 1, display: 'flex' }}>
        <EmptyState
          title={error ? 'Fiche inaccessible' : 'Arme introuvable'}
          message={error?.message ?? "Cette arme n'existe pas ou a été archivée."}
          action={
            <Button
              variant="contained"
              startIcon={<MdArrowBack />}
              onClick={() => navigate(ROUTES.WEAPONS)}
            >
              Retour au registre
            </Button>
          }
        />
      </Box>
    );
  }

  const archived = Boolean(weapon.deletedAt);
  const readOnly = !canUpdate || archived;

  const archive = async () => {
    const { confirmed, reason } = await confirm({
      title: "Archiver la fiche d'arme",
      entityType: 'Arme',
      entityLabel: `${weapon.serialNumber} — ${weapon.make} ${weapon.model}`,
      danger: true,
      requireReason: true,
    });
    if (!confirmed) return;

    await removeWeapon.mutateAsync({ id, reason, previous: weapon });
    closeTab(`${ENTITY_TYPES.WEAPON}:${id}`);
    navigate(ROUTES.WEAPONS);
  };

  /** Bandeau de conformité, affiché sur les onglets pertinents. */
  const complianceAlert = compliance && !compliance.compliant && (
    <Alert
      severity={compliance.severity === 'danger' ? 'error' : 'warning'}
      icon={<MdGavel />}
      sx={{ fontSize: 12.5, alignItems: 'center' }}
    >
      {compliance.message}
    </Alert>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'specs':
        return (
          <>
            {complianceAlert && <Box sx={{ mb: 2 }}>{complianceAlert}</Box>}

            <Form
              key={id}
              schema={weaponSchema}
              defaultValues={toWeaponForm(weapon)}
              onSubmit={() => {}}
              mode="onChange"
            >
              <FormWatcher onChange={autoSave.markDirty} enabled={!readOnly} />

              <SectionCard title="Identification" icon={<GiPistolGun />}>
                <Box sx={{ mb: 1.5 }}>
                  <PhotoUrlField
                    name="photoUrl"
                    label="Photographie"
                    previewWidth={150}
                    previewHeight={98}
                  />
                </Box>

                <FormRow>
                  <TextField
                    name="serialNumber"
                    label="Numéro de série"
                    mono
                    disabled={readOnly}
                  />
                </FormRow>

                <FormRow>
                  <TextField name="make" label="Marque" disabled={readOnly} />
                  <TextField name="model" label="Modèle" disabled={readOnly} />
                </FormRow>

                <FormRow>
                  <SelectField
                    name="caliber"
                    label="Calibre"
                    options={COMMON_CALIBERS.map((value) => ({ value, label: value }))}
                    allowEmpty
                    disabled={readOnly}
                  />
                  <SelectField
                    name="category"
                    label="Catégorie"
                    options={toOptions(WEAPON_CATEGORY_LABELS)}
                    disabled={readOnly}
                  />
                </FormRow>
              </SectionCard>

              <SectionCard title="Régime légal" icon={<MdGavel />}>
                <FormRow>
                  <SelectField
                    name="classification"
                    label="Classification"
                    options={toOptions(WEAPON_CLASSIFICATION_LABELS)}
                    disabled={readOnly}
                  />
                  <SelectField
                    name="status"
                    label="Statut"
                    options={toOptions(WEAPON_STATUS_LABELS)}
                    disabled={readOnly}
                  />
                </FormRow>

                <FormRow>
                  <DateField
                    name="registeredAt"
                    label="Date d'enregistrement"
                    disabled={readOnly}
                  />
                  <TextField
                    name="licenseNumber"
                    label="N° de permis associé"
                    mono
                    disabled={readOnly}
                  />
                </FormRow>
              </SectionCard>

              <SectionCard title="Description">
                <TextField
                  name="description"
                  label="Description"
                  multiline
                  minRows={3}
                  disabled={readOnly}
                  sx={{ mb: 1.5 }}
                />
                <TextField
                  name="notes"
                  label="Notes internes"
                  multiline
                  minRows={2}
                  disabled={readOnly}
                />
              </SectionCard>
            </Form>
          </>
        );

      case 'owner':
        return (
          <OwnerAssignment
            owner={owner ?? null}
            snapshot={weapon.ownerSnapshot ?? null}
            readOnly={readOnly}
            busy={assignHolder.isPending}
            title="Détenteur de l'arme"
            emptyMessage="Cette arme n'est rattachée à aucun citoyen du registre."
            extra={
              compliance && (
                <Alert
                  severity={
                    compliance.compliant
                      ? 'success'
                      : compliance.severity === 'danger'
                        ? 'error'
                        : 'warning'
                  }
                  icon={compliance.compliant ? <MdVerifiedUser /> : <MdGavel />}
                  sx={{ fontSize: 12.5, alignItems: 'center' }}
                >
                  {compliance.message}
                </Alert>
              )
            }
            onAssign={(citizen) =>
              assignHolder.mutate({
                weapon,
                newOwner: citizen,
                previousOwner: owner ?? null,
              })
            }
            onOpenOwner={(citizenId) =>
              openRecord({
                type: ENTITY_TYPES.CITIZEN,
                id: citizenId,
                title: weapon.ownerSnapshot?.label ?? 'Citoyen',
              })
            }
          />
        );

      case 'reports':
        return (
          <RelationTab
            title="Rapports mentionnant cette arme"
            phase={5}
            count={0}
            icon={<MdDescription />}
            scope={[
              'Numéro, type, date et agent rédacteur',
              "Rôle de l'arme : utilisée, saisie, découverte",
              'Ouverture du rapport dans un onglet',
            ]}
          />
        );

      case 'history':
        return (
          <HistoryTimeline
            events={history}
            loading={historyLoading}
            eventLabels={WEAPON_EVENT_LABELS}
            fieldLabels={WEAPON_FIELD_LABELS}
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
          url={weapon.photoUrl}
          width={170}
          height={112}
          alt={weapon.serialNumber}
          emptyLabel="Sans photo"
        />
      }
      title={weapon.serialNumber}
      subtitle={[weapon.make, weapon.model].filter(Boolean).join(' ')}
      badges={
        <Stack direction="row" spacing={0.75} alignItems="center">
          <StatusChip
            status={weapon.status}
            label={WEAPON_STATUS_LABELS[weapon.status] ?? weapon.status}
          />
          {archived && <StatusChip status="INACTIVE" label="ARCHIVÉE" />}
          {compliance && !compliance.compliant && (
            <StatusChip
              status="REJECTED"
              label="PERMIS NON CONFORME"
              tone={compliance.severity === 'danger' ? 'danger' : 'warn'}
            />
          )}
        </Stack>
      }
      meta={
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            {WEAPON_CATEGORY_LABELS[weapon.category] ?? weapon.category}
            {weapon.caliber ? ` · ${weapon.caliber}` : ''}
            {` · ${WEAPON_CLASSIFICATION_LABELS[weapon.classification] ?? weapon.classification}`}
          </Typography>

          {weapon.ownerSnapshot && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <MdPerson size={12} color="var(--muted-dim)" />
              <Typography
                sx={{ fontSize: 12, color: 'primary.main', cursor: 'pointer' }}
                onClick={() =>
                  openRecord({
                    type: ENTITY_TYPES.CITIZEN,
                    id: weapon.ownerSnapshot.id,
                    title: weapon.ownerSnapshot.label,
                  })
                }
              >
                {weapon.ownerSnapshot.label}
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
            onClick={() => navigate(ROUTES.WEAPONS)}
          >
            Registre
          </Button>

          <PdfExportButton templateId="weapon" data={{ weapon, owner: owner ?? null }} entityType={ENTITY_TYPES.WEAPON} entityId={weapon.id} entityLabel={weapon.serialNumber} />

          {!archived && (
            <Can do={PERMISSIONS.WEAPONS_DELETE}>
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
              label="Catégorie"
              labelWidth={100}
              value={WEAPON_CATEGORY_LABELS[weapon.category] ?? weapon.category}
            />
            <KeyValueRow label="Calibre" labelWidth={100} value={weapon.caliber} mono />
            <KeyValueRow
              label="Classification"
              labelWidth={100}
              value={
                WEAPON_CLASSIFICATION_LABELS[weapon.classification] ?? weapon.classification
              }
            />
            <KeyValueRow
              label="Enregistrée le"
              labelWidth={100}
              value={weapon.registeredAt ? formatDate(weapon.registeredAt) : null}
            />
            <KeyValueRow label="Permis" labelWidth={100} value={weapon.licenseNumber} mono />
          </Panel>

          {compliance && (
            <Panel
              title="Conformité"
              icon={compliance.compliant ? <MdVerifiedUser /> : <MdGavel />}
              dense
              sx={{
                borderColor: compliance.compliant ? 'success.main' : 'error.main',
              }}
            >
              <Typography
                sx={{
                  fontSize: 11.5,
                  color: compliance.compliant ? 'success.main' : 'error.main',
                }}
              >
                {compliance.message}
              </Typography>
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
            {weapon.id}
          </Typography>
        </>
      }
    >
      {renderTab()}
    </RecordLayout>
  );
}
