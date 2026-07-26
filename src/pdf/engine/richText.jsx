import { Text, View, Image } from '@react-pdf/renderer';
import { pdfStyles, pdfPalette } from './PdfTheme';
import { PdfTable } from './blocks';

/**
 * Conversion du document TipTap en primitives react-pdf.
 *
 * Le corps d'un rapport est stocké en JSON ProseMirror ; le PDF doit le rendre
 * fidèlement, sans passer par du HTML. Chaque type de nœud est traité
 * explicitement — un nœud inconnu est ignoré plutôt que de faire échouer tout
 * le document.
 */

/** Styles des marques de texte. */
const MARK_STYLES = {
  bold: { fontFamily: 'Helvetica-Bold' },
  italic: { fontFamily: 'Helvetica-Oblique' },
  underline: { textDecoration: 'underline' },
  strike: { textDecoration: 'line-through' },
  code: { fontFamily: 'Courier', fontSize: 8.5 },
};

/**
 * Applique les marques d'un nœud texte.
 * @param {object} node
 * @returns {object}
 */
function styleFromMarks(node) {
  let style = {};
  for (const mark of node.marks ?? []) {
    if (MARK_STYLES[mark.type]) style = { ...style, ...MARK_STYLES[mark.type] };
    if (mark.type === 'textStyle' && mark.attrs?.color) {
      style = { ...style, color: mark.attrs.color };
    }
    if (mark.type === 'highlight') {
      // Le surlignage sombre de l'écran deviendrait illisible à l'impression :
      // on le rend par un gris clair.
      style = { ...style, backgroundColor: '#EDEDED' };
    }
    if (mark.type === 'link') style = { ...style, color: pdfPalette.accent };
  }
  return style;
}

/** Rend le contenu inline d'un nœud. */
function renderInline(node, keyPrefix) {
  return (node.content ?? []).map((child, index) => {
    if (child.type === 'text') {
      return (
        <Text key={`${keyPrefix}-${index}`} style={styleFromMarks(child)}>
          {child.text}
        </Text>
      );
    }
    if (child.type === 'hardBreak') return <Text key={`${keyPrefix}-${index}`}>{'\n'}</Text>;
    return null;
  });
}

const HEADING_SIZES = { 1: 12, 2: 10.5, 3: 9.5 };

/**
 * Rend un nœud de bloc.
 * @param {object} node
 * @param {string} key
 * @returns {React.ReactNode}
 */
function renderNode(node, key) {
  switch (node.type) {
    case 'paragraph':
      return (
        <Text key={key} style={[pdfStyles.paragraph, alignOf(node)]}>
          {renderInline(node, key)}
        </Text>
      );

    case 'heading': {
      const level = node.attrs?.level ?? 2;
      return (
        <Text
          key={key}
          style={{
            fontFamily: 'Helvetica-Bold',
            fontSize: HEADING_SIZES[level] ?? 10,
            letterSpacing: 0.8,
            marginTop: 10,
            marginBottom: 4,
            borderBottomWidth: level <= 2 ? 0.75 : 0,
            borderBottomColor: pdfPalette.rule,
            paddingBottom: level <= 2 ? 2 : 0,
            ...alignOf(node),
          }}
        >
          {renderInline(node, key)}
        </Text>
      );
    }

    case 'bulletList':
    case 'orderedList':
      return (
        <View key={key} style={{ marginBottom: 5, paddingLeft: 10 }}>
          {(node.content ?? []).map((item, index) => (
            <View key={`${key}-${index}`} style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ width: 16 }}>
                {node.type === 'orderedList' ? `${index + 1}.` : '•'}
              </Text>
              <View style={{ flex: 1 }}>
                {(item.content ?? []).map((child, position) =>
                  renderNode(child, `${key}-${index}-${position}`),
                )}
              </View>
            </View>
          ))}
        </View>
      );

    case 'taskList':
      return (
        <View key={key} style={{ marginBottom: 5, paddingLeft: 6 }}>
          {(node.content ?? []).map((item, index) => (
            <View key={`${key}-${index}`} style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ width: 16, fontFamily: 'Courier' }}>
                {item.attrs?.checked ? '[X]' : '[ ]'}
              </Text>
              <View style={{ flex: 1 }}>
                {(item.content ?? []).map((child, position) =>
                  renderNode(child, `${key}-${index}-${position}`),
                )}
              </View>
            </View>
          ))}
        </View>
      );

    case 'blockquote':
      return (
        <View
          key={key}
          style={{
            borderLeftWidth: 2,
            borderLeftColor: pdfPalette.rule,
            paddingLeft: 8,
            marginBottom: 5,
          }}
        >
          {(node.content ?? []).map((child, index) => renderNode(child, `${key}-${index}`))}
        </View>
      );

    case 'codeBlock':
      return (
        <View
          key={key}
          style={{
            backgroundColor: '#F4F4F4',
            borderWidth: 0.5,
            borderColor: pdfPalette.rule,
            padding: 6,
            marginBottom: 5,
          }}
        >
          <Text style={{ fontFamily: 'Courier', fontSize: 8 }}>
            {(node.content ?? []).map((child) => child.text).join('')}
          </Text>
        </View>
      );

    case 'horizontalRule':
      return (
        <View
          key={key}
          style={{
            borderTopWidth: 0.75,
            borderTopColor: pdfPalette.rule,
            marginVertical: 8,
          }}
        />
      );

    case 'image':
      return node.attrs?.src ? (
        <View key={key} style={{ marginVertical: 6, alignItems: 'center' }}>
          <Image
            src={node.attrs.src}
            style={{ maxWidth: 380, maxHeight: 260, objectFit: 'contain' }}
          />
          {node.attrs.alt && <Text style={pdfStyles.photoCaption}>{node.attrs.alt}</Text>}
        </View>
      ) : null;

    case 'table':
      return renderTable(node, key);

    default:
      return null;
  }
}

/** Alignement d'un bloc. */
function alignOf(node) {
  const align = node.attrs?.textAlign;
  return align ? { textAlign: align } : {};
}

/** Rend un tableau ProseMirror via le bloc de tableau générique. */
function renderTable(node, key) {
  const rows = node.content ?? [];
  if (rows.length === 0) return null;

  const extractText = (cell) =>
    (cell.content ?? [])
      .flatMap((block) => (block.content ?? []).map((child) => child.text ?? ''))
      .join(' ')
      .trim();

  const [headRow, ...bodyRows] = rows;
  const headCells = headRow.content ?? [];

  const columns = headCells.map((cell, index) => ({
    key: `c${index}`,
    label: extractText(cell) || ' ',
  }));

  const data = bodyRows.map((row) => {
    const entry = {};
    (row.content ?? []).forEach((cell, index) => {
      entry[`c${index}`] = extractText(cell);
    });
    return entry;
  });

  return (
    <View key={key} style={{ marginVertical: 6 }}>
      <PdfTable columns={columns} rows={data} />
    </View>
  );
}

/**
 * Rend un document TipTap complet.
 *
 * @param {object|null} content Document ProseMirror
 * @param {string} [fallback]   Texte affiché si le corps est vide
 * @returns {React.ReactNode}
 */
export function PdfRichText({ content, fallback = 'Aucun contenu rédigé.' }) {
  const blocks = content?.content ?? [];
  if (blocks.length === 0) {
    return <Text style={pdfStyles.empty}>{fallback}</Text>;
  }

  return <View>{blocks.map((node, index) => renderNode(node, `n${index}`))}</View>;
}

export default PdfRichText;
