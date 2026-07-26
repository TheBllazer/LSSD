import { View, Text } from '@react-pdf/renderer';
import PdfDocument from '../engine/PdfDocument';
import {
  PdfSection,
  PdfField,
  PdfColumns,
  PdfColumn,
  PdfTable,
  PdfPhoto,
  PdfEmpty,
} from '../engine/blocks';
import { pdfStyles } from '../engine/PdfTheme';
import { registryName, formatPhone } from '@/utils/format';
import { formatDate, computeAge } from '@/utils/dates';
import {
  SEX_LABELS,
  CITIZEN_STATUS_LABELS,
  CITIZEN_FLAG_LABELS,
  EYE_COLOR_LABELS,
  HAIR_COLOR_LABELS,
  LICENSE_TYPE_LABELS,
  LICENSE_STATUS_LABELS,
  AFFILIATION_TYPE_LABELS,
} from '@/types/citizens';

/**
 * Fiche citoyen officielle.
 *
 * @param {object} props
 * @param {object} props.citizen
 * @param {object} props.context  `{ agency, generatedBy, generatedAt, logoUrl }`
 * @param {object} [props.options] Sections à inclure
 */
export default function CitizenPdf({ citizen, context, options = {} }) {
  const age = computeAge(citizen.birthDate);
  const flags = citizen.flags ?? [];

  return (
    <PdfDocument
      {...context}
      docType="Fiche de renseignement — Citoyen"
      number={`LSSD-C-${citizen.id.slice(0, 8).toUpperCase()}`}
      classification="DIFFUSION RESTREINTE"
      watermark={flags.length > 0 ? 'SIGNALEMENT' : undefined}
      title={`Fiche citoyen — ${registryName(citizen)}`}
    >
      {/* Bandeau d'identité */}
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {options.photo !== false && (
          <View style={{ marginRight: 14 }}>
            <PdfPhoto url={citizen.photoUrl} width={104} height={130} />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 15, letterSpacing: 0.5 }}>
            {registryName(citizen)}
          </Text>
          <Text style={{ fontSize: 8.5, color: '#555555', marginBottom: 6 }}>
            {SEX_LABELS[citizen.sex] ?? citizen.sex}
            {citizen.birthDate ? ` · Né(e) le ${formatDate(citizen.birthDate)}` : ''}
            {age !== null ? ` · ${age} ans` : ''}
          </Text>

          <PdfField label="Statut judiciaire" value={CITIZEN_STATUS_LABELS[citizen.status]} />
          <PdfField
            label="Signalements"
            value={
              flags.length > 0
                ? flags.map((flag) => CITIZEN_FLAG_LABELS[flag] ?? flag).join(' · ')
                : 'Aucun'
            }
          />
          <PdfField label="Alias" value={(citizen.aliases ?? []).join(', ')} />
        </View>
      </View>

      <PdfSection title="Signalement physique">
        <PdfColumns>
          <PdfColumn>
            <PdfField label="Taille" value={citizen.height ? `${citizen.height} cm` : null} />
            <PdfField label="Poids" value={citizen.weight ? `${citizen.weight} kg` : null} />
          </PdfColumn>
          <PdfColumn>
            <PdfField label="Yeux" value={EYE_COLOR_LABELS[citizen.eyeColor]} />
            <PdfField label="Cheveux" value={HAIR_COLOR_LABELS[citizen.hairColor]} />
          </PdfColumn>
        </PdfColumns>
        <PdfField label="Signes particuliers" value={citizen.distinctiveMarks} />
      </PdfSection>

      <PdfSection title="Coordonnées et situation">
        <PdfColumns>
          <PdfColumn>
            <PdfField label="Téléphone" value={formatPhone(citizen.phone)} mono />
            <PdfField label="Courriel" value={citizen.email} />
          </PdfColumn>
          <PdfColumn>
            <PdfField label="Profession" value={citizen.occupation} />
            <PdfField label="Employeur" value={citizen.employer} />
          </PdfColumn>
        </PdfColumns>
        <PdfField
          label="Domicile"
          value={
            [citizen.address?.street, citizen.address?.district, citizen.address?.postal]
              .filter(Boolean)
              .join(', ') || null
          }
        />
      </PdfSection>

      <PdfSection title="Permis et licences">
        <PdfTable
          columns={[
            { key: 'type', label: 'Type', width: 150 },
            { key: 'number', label: 'Numéro', width: 100 },
            { key: 'status', label: 'Validité', width: 90 },
            { key: 'expires', label: 'Expiration' },
          ]}
          rows={(citizen.licenses ?? []).map((license) => ({
            type: LICENSE_TYPE_LABELS[license.type] ?? license.type,
            number: license.number ?? '—',
            status: LICENSE_STATUS_LABELS[license.status] ?? license.status,
            expires: license.expiresAt ? formatDate(license.expiresAt) : '—',
          }))}
          emptyLabel="Aucun permis enregistré."
        />
      </PdfSection>

      <PdfSection title="Affiliations connues">
        <PdfTable
          columns={[
            { key: 'type', label: 'Nature', width: 110 },
            { key: 'name', label: 'Organisation' },
            { key: 'role', label: 'Rôle', width: 130 },
          ]}
          rows={(citizen.affiliations ?? []).map((affiliation) => ({
            type: AFFILIATION_TYPE_LABELS[affiliation.type] ?? affiliation.type,
            name: affiliation.name,
            role: affiliation.role ?? '—',
          }))}
          emptyLabel="Aucune affiliation connue."
        />
      </PdfSection>

      {(citizen.tattoos ?? []).length > 0 && (
        <PdfSection title="Tatouages et marques">
          <PdfTable
            columns={[
              { key: 'location', label: 'Emplacement', width: 140 },
              { key: 'description', label: 'Description' },
            ]}
            rows={citizen.tattoos.map((tattoo) => ({
              location: tattoo.location,
              description: tattoo.description,
            }))}
          />
        </PdfSection>
      )}

      <PdfSection title="Description générale">
        {citizen.description ? (
          <Text style={pdfStyles.paragraph}>{citizen.description}</Text>
        ) : (
          <PdfEmpty>Aucune description consignée.</PdfEmpty>
        )}
      </PdfSection>

      <PdfSection title="Volume du dossier">
        <PdfColumns>
          <PdfColumn>
            <PdfField label="Rapports" value={citizen.counters?.reports ?? 0} />
            <PdfField label="Casiers" value={citizen.counters?.records ?? 0} />
          </PdfColumn>
          <PdfColumn>
            <PdfField label="Véhicules" value={citizen.counters?.vehicles ?? 0} />
            <PdfField label="Armes" value={citizen.counters?.weapons ?? 0} />
          </PdfColumn>
        </PdfColumns>
      </PdfSection>
    </PdfDocument>
  );
}
