import { View, Text } from '@react-pdf/renderer';
import PdfDocument from '../engine/PdfDocument';
import {
  PdfSection,
  PdfField,
  PdfColumns,
  PdfColumn,
  PdfPhoto,
  PdfEmpty,
} from '../engine/blocks';
import { pdfStyles } from '../engine/PdfTheme';
import { formatDate } from '@/utils/dates';
import {
  VEHICLE_TYPE_LABELS,
  REGISTRATION_STATUS_LABELS,
  INSURANCE_STATUS_LABELS,
  VEHICLE_FLAG_LABELS,
} from '@/types/vehicles';

/**
 * Fiche d'immatriculation d'un véhicule.
 *
 * @param {object} props
 * @param {object} props.vehicle
 * @param {object} props.context
 */
export default function VehiclePdf({ vehicle, context }) {
  const flags = vehicle.flags ?? [];
  const impounded = Boolean(vehicle.impound?.isImpounded);

  return (
    <PdfDocument
      {...context}
      docType="Fiche d'immatriculation — Véhicule"
      number={vehicle.plate}
      classification="DIFFUSION RESTREINTE"
      watermark={flags.includes('STOLEN') ? 'VOLÉ' : undefined}
      title={`Véhicule ${vehicle.plate}`}
    >
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <View style={{ marginRight: 14 }}>
          <PdfPhoto url={vehicle.photoUrl} width={150} height={100} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Courier-Bold', fontSize: 18, letterSpacing: 2 }}>
            {vehicle.plate}
          </Text>
          <Text style={{ fontSize: 9, marginBottom: 6 }}>
            {[vehicle.make, vehicle.model].filter(Boolean).join(' ')}
            {vehicle.year ? ` · ${vehicle.year}` : ''}
          </Text>

          <PdfField label="Numéro de série" value={vehicle.vin} mono />
          <PdfField
            label="Immatriculation"
            value={REGISTRATION_STATUS_LABELS[vehicle.registrationStatus]}
          />
          <PdfField
            label="Signalements"
            value={
              flags.length > 0
                ? flags.map((flag) => VEHICLE_FLAG_LABELS[flag] ?? flag).join(' · ')
                : 'Aucun'
            }
          />
        </View>
      </View>

      <PdfSection title="Caractéristiques">
        <PdfColumns>
          <PdfColumn>
            <PdfField label="Type" value={VEHICLE_TYPE_LABELS[vehicle.type]} />
            <PdfField label="Couleur" value={vehicle.color} />
          </PdfColumn>
          <PdfColumn>
            <PdfField label="Année" value={vehicle.year} />
            <PdfField label="État" value={vehicle.condition} />
          </PdfColumn>
        </PdfColumns>
      </PdfSection>

      <PdfSection title="Propriétaire déclaré">
        {vehicle.ownerSnapshot ? (
          <PdfField label="Identité" value={vehicle.ownerSnapshot.label} />
        ) : (
          <PdfEmpty>Aucun propriétaire rattaché au registre des citoyens.</PdfEmpty>
        )}
      </PdfSection>

      <PdfSection title="Assurance">
        <PdfColumns>
          <PdfColumn>
            <PdfField
              label="Couverture"
              value={INSURANCE_STATUS_LABELS[vehicle.insurance?.status]}
            />
            <PdfField label="Assureur" value={vehicle.insurance?.company} />
          </PdfColumn>
          <PdfColumn>
            <PdfField label="N° de police" value={vehicle.insurance?.policyNumber} mono />
            <PdfField
              label="Échéance"
              value={
                vehicle.insurance?.expiresAt ? formatDate(vehicle.insurance.expiresAt) : null
              }
            />
          </PdfColumn>
        </PdfColumns>
      </PdfSection>

      {impounded && (
        <PdfSection title="Mise en fourrière">
          <PdfField label="Dépôt" value={vehicle.impound?.lot} />
          <PdfField
            label="Depuis le"
            value={vehicle.impound?.since ? formatDate(vehicle.impound.since) : null}
          />
          <PdfField label="Motif" value={vehicle.impound?.reason} />
        </PdfSection>
      )}

      <PdfSection title="Description">
        {vehicle.description ? (
          <Text style={pdfStyles.paragraph}>{vehicle.description}</Text>
        ) : (
          <PdfEmpty>Aucune description consignée.</PdfEmpty>
        )}
      </PdfSection>
    </PdfDocument>
  );
}
