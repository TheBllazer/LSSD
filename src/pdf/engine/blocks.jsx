import { Text, View, Image } from '@react-pdf/renderer';
import { pdfStyles, classificationColor } from './PdfTheme';

/**
 * Blocs de composition des documents officiels.
 *
 * Un modèle de document n'est qu'un assemblage de ces blocs : ajouter un
 * document au catalogue ne demande jamais de toucher au moteur.
 */

/**
 * En-tête répété sur chaque page.
 *
 * @param {object} props
 * @param {string} props.agency
 * @param {string} props.docType     Nature du document
 * @param {string} [props.number]    Numéro officiel
 * @param {string} [props.classification]
 * @param {string} [props.logoUrl]
 */
export function PdfHeader({ agency, docType, number, classification, logoUrl }) {
  return (
    <View style={pdfStyles.header} fixed>
      {logoUrl && <Image src={logoUrl} style={pdfStyles.headerStar} />}

      <View>
        <Text style={pdfStyles.headerAgency}>{agency.toUpperCase()}</Text>
        <Text style={pdfStyles.headerSub}>RECORDS MANAGEMENT SYSTEM</Text>
        <Text style={pdfStyles.headerDocType}>{docType.toUpperCase()}</Text>
      </View>

      <View style={pdfStyles.headerRight}>
        {number && (
          <>
            <Text style={pdfStyles.headerLabel}>DOSSIER N°</Text>
            <Text style={pdfStyles.headerNumber}>{number}</Text>
          </>
        )}
        {classification && (
          <Text
            style={[
              pdfStyles.classification,
              {
                color: classificationColor(classification),
                borderColor: classificationColor(classification),
              },
            ]}
          >
            {classification}
          </Text>
        )}
      </View>
    </View>
  );
}

/**
 * Pied de page répété, avec pagination.
 *
 * L'identité du demandeur y figure volontairement : un document qui circule
 * reste attribuable à celui qui l'a extrait.
 *
 * @param {object} props
 * @param {string} props.notice
 * @param {string} props.generatedBy
 * @param {string} props.generatedAt
 */
export function PdfFooter({ notice, generatedBy, generatedAt }) {
  return (
    <View style={pdfStyles.footer} fixed>
      <View>
        <Text style={pdfStyles.footerText}>{notice}</Text>
        <Text style={pdfStyles.footerText}>
          Extrait le {generatedAt} par {generatedBy}
        </Text>
      </View>
      <Text
        style={pdfStyles.footerPage}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

/**
 * Section titrée.
 * @param {{ title: string, children: React.ReactNode, wrap?: boolean }} props
 */
export function PdfSection({ title, children, wrap = true }) {
  return (
    <View style={pdfStyles.section} wrap={wrap}>
      <Text style={pdfStyles.sectionTitle}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

/**
 * Ligne « libellé / valeur ».
 * @param {{ label: string, value: unknown, mono?: boolean }} props
 */
export function PdfField({ label, value, mono = false }) {
  const empty = value === null || value === undefined || value === '';
  return (
    <View style={pdfStyles.fieldRow}>
      <Text style={pdfStyles.fieldLabel}>{label}</Text>
      <Text style={mono ? pdfStyles.fieldMono : pdfStyles.fieldValue}>
        {empty ? '—' : String(value)}
      </Text>
    </View>
  );
}

/**
 * Deux colonnes de champs côte à côte.
 * @param {{ children: React.ReactNode }} props
 */
export function PdfColumns({ children }) {
  return <View style={pdfStyles.columns}>{children}</View>;
}

/** Colonne d'une disposition à deux colonnes. */
export function PdfColumn({ children }) {
  return <View style={pdfStyles.column}>{children}</View>;
}

/**
 * Tableau générique.
 *
 * @param {object} props
 * @param {{ key: string, label: string, width?: number|string }[]} props.columns
 * @param {object[]} props.rows
 * @param {string} [props.emptyLabel]
 */
export function PdfTable({ columns, rows, emptyLabel = 'Aucun élément.' }) {
  if (!rows || rows.length === 0) {
    return <Text style={pdfStyles.empty}>{emptyLabel}</Text>;
  }

  return (
    <View style={pdfStyles.table}>
      <View style={pdfStyles.tableHead} fixed>
        {columns.map((column) => (
          <Text
            key={column.key}
            style={[pdfStyles.tableCellHead, { width: column.width ?? 'auto', flex: column.width ? 0 : 1 }]}
          >
            {column.label}
          </Text>
        ))}
      </View>

      {rows.map((row, index) => (
        <View key={index} style={pdfStyles.tableRow} wrap={false}>
          {columns.map((column) => (
            <Text
              key={column.key}
              style={[pdfStyles.tableCell, { width: column.width ?? 'auto', flex: column.width ? 0 : 1 }]}
            >
              {row[column.key] ?? '—'}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * Photographie encadrée.
 *
 * `react-pdf` échoue si l'image est inaccessible : on n'insère donc que des
 * URL déjà validées, et le cadre reste vide plutôt que de faire échouer le
 * rendu complet du document.
 *
 * @param {{ url: string|null, width?: number, height?: number, caption?: string }} props
 */
export function PdfPhoto({ url, width = 110, height = 140, caption }) {
  if (!url) return null;
  return (
    <View>
      <View style={[pdfStyles.photoFrame, { width, height }]}>
        <Image src={url} style={{ width: width - 4, height: height - 4, objectFit: 'cover' }} />
      </View>
      {caption && <Text style={pdfStyles.photoCaption}>{caption}</Text>}
    </View>
  );
}

/**
 * Bloc de signature.
 * @param {{ name: string, badge?: string, date?: string, role?: string }} props
 */
export function PdfSignature({ name, badge, date, role = 'Agent rédacteur' }) {
  return (
    <View style={pdfStyles.signatureBlock}>
      <View style={pdfStyles.signatureLine}>
        <Text style={pdfStyles.signatureName}>{name}</Text>
        <Text style={pdfStyles.signatureMeta}>
          {role}
          {badge ? ` · Matricule ${badge}` : ''}
        </Text>
        {date && <Text style={pdfStyles.signatureMeta}>Signé le {date}</Text>}
      </View>
    </View>
  );
}

/**
 * Filigrane diagonal, pour les documents sensibles.
 * @param {{ label: string }} props
 */
export function PdfWatermark({ label }) {
  return (
    <Text style={pdfStyles.watermark} fixed>
      {label}
    </Text>
  );
}

/** Paragraphe de texte justifié. */
export function PdfParagraph({ children }) {
  return <Text style={pdfStyles.paragraph}>{children}</Text>;
}

/** Mention affichée à la place d'une section vide. */
export function PdfEmpty({ children }) {
  return <Text style={pdfStyles.empty}>{children}</Text>;
}
