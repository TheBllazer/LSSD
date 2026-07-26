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
import { pdfStyles, pdfPalette } from '../engine/PdfTheme';
import { formatDate } from '@/utils/dates';
import { checkLicenseCompliance } from '@/services/weapons.service';
import {
  WEAPON_CATEGORY_LABELS,
  WEAPON_CLASSIFICATION_LABELS,
  WEAPON_STATUS_LABELS,
} from '@/types/weapons';

/**
 * Fiche d'enregistrement d'une arme.
 *
 * Le contrôle de conformité du permis figure sur le document : c'est
 * l'information qui justifie une saisie, elle doit être opposable.
 *
 * @param {object} props
 * @param {object} props.weapon
 * @param {object|null} props.owner  Fiche du détenteur, pour le contrôle
 * @param {object} props.context
 */
export default function WeaponPdf({ weapon, owner, context }) {
  const compliance = checkLicenseCompliance(weapon, owner ?? null);

  return (
    <PdfDocument
      {...context}
      docType="Fiche d'enregistrement — Arme"
      number={weapon.serialNumber}
      classification="DIFFUSION RESTREINTE"
      watermark={weapon.status === 'SEIZED' ? 'SAISIE' : undefined}
      title={`Arme ${weapon.serialNumber}`}
    >
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <View style={{ marginRight: 14 }}>
          <PdfPhoto url={weapon.photoUrl} width={150} height={100} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Courier-Bold', fontSize: 15, letterSpacing: 1 }}>
            {weapon.serialNumber}
          </Text>
          <Text style={{ fontSize: 9, marginBottom: 6 }}>
            {[weapon.make, weapon.model].filter(Boolean).join(' ')}
          </Text>

          <PdfField label="Catégorie" value={WEAPON_CATEGORY_LABELS[weapon.category]} />
          <PdfField
            label="Classification"
            value={WEAPON_CLASSIFICATION_LABELS[weapon.classification]}
          />
          <PdfField label="Statut" value={WEAPON_STATUS_LABELS[weapon.status]} />
        </View>
      </View>

      <PdfSection title="Caractéristiques techniques">
        <PdfColumns>
          <PdfColumn>
            <PdfField label="Calibre" value={weapon.caliber} mono />
            <PdfField label="Marque" value={weapon.make} />
          </PdfColumn>
          <PdfColumn>
            <PdfField label="Modèle" value={weapon.model} />
            <PdfField
              label="Enregistrée le"
              value={weapon.registeredAt ? formatDate(weapon.registeredAt) : null}
            />
          </PdfColumn>
        </PdfColumns>
      </PdfSection>

      <PdfSection title="Détenteur et titre de détention">
        {weapon.ownerSnapshot ? (
          <>
            <PdfField label="Identité" value={weapon.ownerSnapshot.label} />
            <PdfField label="N° de permis" value={weapon.licenseNumber} mono />
          </>
        ) : (
          <PdfEmpty>Aucun détenteur rattaché au registre des citoyens.</PdfEmpty>
        )}

        <View
          style={{
            marginTop: 6,
            borderWidth: 0.75,
            borderColor: compliance.compliant ? pdfPalette.rule : pdfPalette.danger,
            padding: 5,
          }}
        >
          <Text
            style={{
              fontFamily: 'Helvetica-Bold',
              fontSize: 8,
              letterSpacing: 0.8,
              color: compliance.compliant ? pdfPalette.ink : pdfPalette.danger,
            }}
          >
            {compliance.compliant ? 'DÉTENTION CONFORME' : 'DÉTENTION NON CONFORME'}
          </Text>
          <Text style={{ fontSize: 8.5, marginTop: 2 }}>{compliance.message}</Text>
        </View>
      </PdfSection>

      <PdfSection title="Observations">
        {weapon.description || weapon.notes ? (
          <Text style={pdfStyles.paragraph}>
            {[weapon.description, weapon.notes].filter(Boolean).join('\n\n')}
          </Text>
        ) : (
          <PdfEmpty>Aucune observation consignée.</PdfEmpty>
        )}
      </PdfSection>
    </PdfDocument>
  );
}
