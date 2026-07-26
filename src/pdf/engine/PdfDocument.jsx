import { Document, Page } from '@react-pdf/renderer';
import { pdfStyles } from './PdfTheme';
import { PdfHeader, PdfFooter, PdfWatermark } from './blocks';

/**
 * Enveloppe commune à tous les documents officiels.
 *
 * Elle pose la page A4, l'en-tête et le pied répétés, la pagination et le
 * filigrane. Un modèle n'a plus qu'à décrire son contenu.
 *
 * @param {object} props
 * @param {string} props.agency
 * @param {string} props.docType
 * @param {string} [props.number]
 * @param {string} [props.classification]
 * @param {string} [props.logoUrl]
 * @param {string} props.generatedBy
 * @param {string} props.generatedAt
 * @param {string} [props.notice]
 * @param {string} [props.watermark]
 * @param {string} [props.title]      Métadonnée du fichier PDF
 * @param {React.ReactNode} props.children
 */
export default function PdfDocument({
  agency,
  docType,
  number,
  classification,
  logoUrl,
  generatedBy,
  generatedAt,
  notice = 'Document officiel — diffusion restreinte au personnel autorisé.',
  watermark,
  title,
  children,
}) {
  return (
    <Document
      title={title ?? `${docType}${number ? ` ${number}` : ''}`}
      author={agency}
      creator="LSSD RMS"
      producer="LSSD RMS"
    >
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          agency={agency}
          docType={docType}
          number={number}
          classification={classification}
          logoUrl={logoUrl}
        />

        {watermark && <PdfWatermark label={watermark} />}

        {children}

        <PdfFooter notice={notice} generatedBy={generatedBy} generatedAt={generatedAt} />
      </Page>
    </Document>
  );
}
