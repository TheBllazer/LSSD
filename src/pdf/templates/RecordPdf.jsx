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
import { formatDate, formatDurationDays } from '@/utils/dates';
import { formatCurrency } from '@/utils/format';
import { sentenceProgress } from '@/modules/criminal-records/schemas/recordSchema';
import {
  RECORD_TYPE_LABELS,
  DISPOSITION_LABELS,
  RECORD_STATUS_LABELS,
} from '@/types/records';

/**
 * Extrait de casier judiciaire.
 *
 * @param {object} props
 * @param {object} props.record
 * @param {object} props.context
 */
export default function RecordPdf({ record, context }) {
  const progress = sentenceProgress(record.sentence);
  const sentence = record.sentence ?? {};

  return (
    <PdfDocument
      {...context}
      docType="Extrait de casier judiciaire"
      number={record.number}
      classification="CONFIDENTIEL"
      watermark={record.status === 'EXPUNGED' ? 'EFFACÉ' : undefined}
      title={`${record.number} — ${record.citizenSnapshot?.label ?? ''}`}
    >
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <View style={{ marginRight: 14 }}>
          <PdfPhoto
            url={record.mugshotUrl ?? record.citizenSnapshot?.photoUrl}
            width={96}
            height={120}
            caption="Cliché anthropométrique"
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 14 }}>
            {record.citizenSnapshot?.label ?? 'Titulaire inconnu'}
          </Text>
          <Text style={{ fontSize: 8.5, color: '#555555', marginBottom: 6 }}>
            {RECORD_TYPE_LABELS[record.type] ?? record.type}
            {record.date ? ` · Faits du ${formatDate(record.date)}` : ''}
          </Text>

          <PdfField label="Disposition" value={DISPOSITION_LABELS[record.disposition]} />
          <PdfField label="État du casier" value={RECORD_STATUS_LABELS[record.status]} />
          <PdfField label="Juridiction" value={record.court} />
        </View>
      </View>

      <PdfSection title="Chefs d'accusation retenus">
        <PdfTable
          columns={[
            { key: 'code', label: 'Code', width: 80 },
            { key: 'label', label: 'Qualification' },
            { key: 'degree', label: 'Degré', width: 60 },
            { key: 'counts', label: 'Chefs', width: 55 },
          ]}
          rows={(record.charges ?? []).map((charge) => ({
            code: charge.code,
            label: charge.label,
            degree: charge.degree || '—',
            counts: String(charge.counts ?? 1),
          }))}
          emptyLabel="Aucun chef d'accusation consigné."
        />
      </PdfSection>

      <PdfSection title="Composition de la juridiction">
        <PdfColumns>
          <PdfColumn>
            <PdfField label="Magistrat" value={record.judge} />
            <PdfField label="Ministère public" value={record.prosecutor} />
          </PdfColumn>
          <PdfColumn>
            <PdfField label="Défense" value={record.defenseAttorney} />
            <PdfField label="Rapport lié" value={record.reportId ? 'Oui' : 'Non'} />
          </PdfColumn>
        </PdfColumns>
      </PdfSection>

      <PdfSection title="Peine prononcée">
        <PdfColumns>
          <PdfColumn>
            <PdfField
              label="Emprisonnement"
              value={sentence.prisonDays ? formatDurationDays(sentence.prisonDays) : 'Aucun'}
            />
            <PdfField
              label="Probation"
              value={
                sentence.probationDays ? formatDurationDays(sentence.probationDays) : 'Aucune'
              }
            />
          </PdfColumn>
          <PdfColumn>
            <PdfField
              label="Intérêt général"
              value={
                sentence.communityServiceHours
                  ? `${sentence.communityServiceHours} heures`
                  : 'Aucun'
              }
            />
            <PdfField
              label="Amende"
              value={
                sentence.fineAmount
                  ? `${formatCurrency(sentence.fineAmount)} — ${
                      sentence.finePaid ? 'réglée' : 'due'
                    }`
                  : 'Aucune'
              }
            />
          </PdfColumn>
        </PdfColumns>

        {progress && (
          <View style={{ marginTop: 6 }}>
            <PdfField
              label="Exécution"
              value={`${progress.served} jour(s) purgé(s) sur ${progress.total} — ${progress.percent} % · reste ${formatDurationDays(progress.remaining)}`}
            />
            <View
              style={{
                marginTop: 3,
                height: 6,
                borderWidth: 0.5,
                borderColor: '#1A1A1A',
                flexDirection: 'row',
              }}
            >
              <View style={{ width: `${progress.percent}%`, backgroundColor: '#1A1A1A' }} />
            </View>
          </View>
        )}
      </PdfSection>

      <PdfSection title="Observations">
        {record.notes ? (
          <Text style={pdfStyles.paragraph}>{record.notes}</Text>
        ) : (
          <PdfEmpty>Aucune observation consignée.</PdfEmpty>
        )}
      </PdfSection>
    </PdfDocument>
  );
}
