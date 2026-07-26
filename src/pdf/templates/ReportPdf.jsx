import { View, Text } from '@react-pdf/renderer';
import PdfDocument from '../engine/PdfDocument';
import {
  PdfSection,
  PdfField,
  PdfColumns,
  PdfColumn,
  PdfTable,
  PdfSignature,
  PdfEmpty,
} from '../engine/blocks';
import PdfRichText from '../engine/richText';
import { formatDateTime, formatDate } from '@/utils/dates';
import {
  REPORT_TYPE_LABELS,
  REPORT_CLASSIFICATION_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_PRIORITY_LABELS,
  CITIZEN_ROLE_LABELS,
  AGENT_ROLE_LABELS,
  VEHICLE_ROLE_LABELS,
  WEAPON_ROLE_LABELS,
} from '@/types/reports';

/**
 * Rapport d'incident officiel.
 *
 * Le corps rédigé dans l'éditeur est rendu fidèlement (titres de section,
 * listes, tableaux, images) : c'est la pièce qui sera versée au dossier.
 *
 * @param {object} props
 * @param {object} props.report
 * @param {object} props.context
 */
export default function ReportPdf({ report, context }) {
  const sensitive =
    report.classification === 'CONFIDENTIAL' || report.classification === 'SEALED';

  return (
    <PdfDocument
      {...context}
      docType={REPORT_TYPE_LABELS[report.type] ?? 'Rapport'}
      number={report.number}
      classification={REPORT_CLASSIFICATION_LABELS[report.classification]?.toUpperCase()}
      watermark={sensitive ? REPORT_CLASSIFICATION_LABELS[report.classification]?.toUpperCase() : undefined}
      title={`${report.number} — ${report.title}`}
    >
      <Text
        style={{
          fontFamily: 'Helvetica-Bold',
          fontSize: 13,
          marginTop: 4,
          marginBottom: 8,
        }}
      >
        {report.title}
      </Text>

      <PdfSection title="Cadre de l'intervention">
        <PdfColumns>
          <PdfColumn>
            <PdfField label="Date des faits" value={formatDateTime(report.occurredAt)} />
            <PdfField label="Lieu" value={report.location?.label} />
            <PdfField label="District" value={report.location?.district} />
          </PdfColumn>
          <PdfColumn>
            <PdfField label="Statut" value={REPORT_STATUS_LABELS[report.status]} />
            <PdfField label="Priorité" value={REPORT_PRIORITY_LABELS[report.priority]} />
            <PdfField
              label="Classification"
              value={REPORT_CLASSIFICATION_LABELS[report.classification]}
            />
          </PdfColumn>
        </PdfColumns>

        {report.summary && (
          <View style={{ marginTop: 4 }}>
            <PdfField label="Résumé" value={report.summary} />
          </View>
        )}
      </PdfSection>

      <PdfSection title="Agents impliqués">
        <PdfTable
          columns={[
            { key: 'name', label: 'Agent' },
            { key: 'badge', label: 'Matricule', width: 90 },
            { key: 'role', label: 'Qualité', width: 120 },
          ]}
          rows={(report.involvedAgents ?? []).map((agent) => ({
            name: agent.label,
            badge: agent.badge ?? '—',
            role: AGENT_ROLE_LABELS[agent.role] ?? agent.role,
          }))}
          emptyLabel="Aucun agent référencé."
        />
      </PdfSection>

      <PdfSection title="Personnes impliquées">
        <PdfTable
          columns={[
            { key: 'name', label: 'Identité' },
            { key: 'role', label: 'Qualité', width: 130 },
          ]}
          rows={(report.involvedCitizens ?? []).map((party) => ({
            name: party.label,
            role: CITIZEN_ROLE_LABELS[party.role] ?? party.role,
          }))}
          emptyLabel="Aucune personne citée."
        />
      </PdfSection>

      {(report.involvedVehicles ?? []).length > 0 && (
        <PdfSection title="Véhicules impliqués">
          <PdfTable
            columns={[
              { key: 'name', label: 'Véhicule' },
              { key: 'role', label: 'Qualité', width: 130 },
            ]}
            rows={report.involvedVehicles.map((party) => ({
              name: party.label,
              role: VEHICLE_ROLE_LABELS[party.role] ?? party.role,
            }))}
          />
        </PdfSection>
      )}

      {(report.involvedWeapons ?? []).length > 0 && (
        <PdfSection title="Armes impliquées">
          <PdfTable
            columns={[
              { key: 'name', label: 'Arme' },
              { key: 'role', label: 'Qualité', width: 130 },
            ]}
            rows={report.involvedWeapons.map((party) => ({
              name: party.label,
              role: WEAPON_ROLE_LABELS[party.role] ?? party.role,
            }))}
          />
        </PdfSection>
      )}

      {(report.charges ?? []).length > 0 && (
        <PdfSection title="Chefs d'accusation">
          <PdfTable
            columns={[
              { key: 'code', label: 'Code', width: 80 },
              { key: 'label', label: 'Qualification' },
            ]}
            rows={report.charges.map((charge) => ({
              code: charge.code,
              label: charge.label,
            }))}
          />
        </PdfSection>
      )}

      <PdfSection title="Exposé des faits">
        <PdfRichText content={report.content} />
      </PdfSection>

      {report.review?.comment && (
        <PdfSection title="Observations de la hiérarchie">
          <PdfField label="Rédigées par" value={report.review.byName} />
          <PdfField label="Le" value={formatDateTime(report.review.at)} />
          <Text style={{ marginTop: 3 }}>« {report.review.comment} »</Text>
        </PdfSection>
      )}

      {report.signature ? (
        <PdfSignature
          name={report.signature.name}
          badge={report.signature.badge}
          date={formatDate(report.signature.signedAt)}
        />
      ) : (
        <View style={{ marginTop: 20 }}>
          <PdfEmpty>Rapport non signé à la date d'extraction.</PdfEmpty>
          <PdfSignature name="_______________________" role="Agent rédacteur" />
        </View>
      )}
    </PdfDocument>
  );
}
