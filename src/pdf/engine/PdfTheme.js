import { StyleSheet } from '@react-pdf/renderer';

/**
 * Charte des documents officiels.
 *
 * Volontairement à l'opposé de l'interface : fond blanc, encre noire, filets
 * fins. Un dossier de procédure est destiné à être imprimé, photocopié et
 * versé à un dossier papier — le thème sombre du terminal n'a aucun sens ici.
 */
export const pdfPalette = {
  ink: '#0B0B0B',
  muted: '#555555',
  faint: '#8A8A8A',
  rule: '#B8B8B8',
  ruleStrong: '#1A1A1A',
  band: '#EFEFEF',
  accent: '#123C6B',
  danger: '#8C1D18',
  gold: '#8C6F14',
};

/** Dimensions et espacements, en points PDF (1 pt = 1/72 pouce). */
export const pdfMetrics = {
  page: { paddingTop: 92, paddingBottom: 62, paddingHorizontal: 46 },
  headerHeight: 74,
  footerHeight: 44,
};

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    lineHeight: 1.45,
    color: pdfPalette.ink,
    paddingTop: pdfMetrics.page.paddingTop,
    paddingBottom: pdfMetrics.page.paddingBottom,
    paddingHorizontal: pdfMetrics.page.paddingHorizontal,
  },

  /* --- En-tête --------------------------------------------------------- */
  header: {
    position: 'absolute',
    top: 24,
    left: 46,
    right: 46,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: pdfPalette.ruleStrong,
    paddingBottom: 6,
  },
  headerStar: { width: 40, height: 40, marginRight: 12 },
  headerAgency: {
    fontFamily: 'Times-Bold',
    fontSize: 13,
    letterSpacing: 0.8,
  },
  headerSub: { fontSize: 7.5, color: pdfPalette.muted, letterSpacing: 1.6 },
  headerDocType: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10.5,
    letterSpacing: 1.2,
    marginTop: 3,
  },
  headerRight: { marginLeft: 'auto', alignItems: 'flex-end' },
  headerNumber: { fontFamily: 'Courier-Bold', fontSize: 11 },
  headerLabel: { fontSize: 7, color: pdfPalette.faint, letterSpacing: 1 },

  classification: {
    marginTop: 3,
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderWidth: 1,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    letterSpacing: 1.2,
  },

  /* --- Pied de page ---------------------------------------------------- */
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 46,
    right: 46,
    borderTopWidth: 0.75,
    borderTopColor: pdfPalette.rule,
    paddingTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: { fontSize: 6.5, color: pdfPalette.faint },
  footerPage: { marginLeft: 'auto', fontFamily: 'Courier', fontSize: 7 },

  /* --- Sections -------------------------------------------------------- */
  section: { marginTop: 14 },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    letterSpacing: 1.1,
    backgroundColor: pdfPalette.band,
    borderLeftWidth: 3,
    borderLeftColor: pdfPalette.accent,
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    marginBottom: 6,
  },

  /* --- Champs ---------------------------------------------------------- */
  fieldRow: { flexDirection: 'row', marginBottom: 3 },
  fieldLabel: {
    width: 118,
    fontSize: 7.5,
    color: pdfPalette.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  fieldValue: { flex: 1, fontSize: 9.5 },
  fieldMono: { flex: 1, fontFamily: 'Courier', fontSize: 9 },

  columns: { flexDirection: 'row', gap: 18 },
  column: { flex: 1 },

  /* --- Tableaux -------------------------------------------------------- */
  table: { borderWidth: 0.75, borderColor: pdfPalette.rule, marginTop: 4 },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: pdfPalette.band,
    borderBottomWidth: 0.75,
    borderBottomColor: pdfPalette.rule,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: pdfPalette.rule,
  },
  tableCell: { paddingVertical: 3, paddingHorizontal: 5, fontSize: 8.5 },
  tableCellHead: {
    paddingVertical: 3,
    paddingHorizontal: 5,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  /* --- Photographies --------------------------------------------------- */
  photoFrame: { borderWidth: 0.75, borderColor: pdfPalette.ruleStrong, padding: 2 },
  photoCaption: { fontSize: 7, color: pdfPalette.muted, marginTop: 2 },

  /* --- Signature ------------------------------------------------------- */
  signatureBlock: { marginTop: 26, flexDirection: 'row' },
  signatureLine: {
    width: 210,
    borderTopWidth: 0.75,
    borderTopColor: pdfPalette.ruleStrong,
    paddingTop: 3,
  },
  signatureName: { fontFamily: 'Helvetica-Bold', fontSize: 8.5 },
  signatureMeta: { fontSize: 7, color: pdfPalette.muted },

  /* --- Divers ---------------------------------------------------------- */
  paragraph: { marginBottom: 5, textAlign: 'justify' },
  empty: { fontSize: 8.5, color: pdfPalette.faint, fontStyle: 'italic' },
  watermark: {
    position: 'absolute',
    top: 320,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 62,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    opacity: 0.06,
    transform: 'rotate(-30deg)',
  },
});

/** Couleur du cadre de classification selon sa sensibilité. */
export function classificationColor(classification) {
  if (classification === 'SEALED' || classification === 'CONFIDENTIAL') {
    return pdfPalette.danger;
  }
  return pdfPalette.ink;
}
