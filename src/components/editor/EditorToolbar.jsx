import { useState } from 'react';
import { Box, Divider, Menu, MenuItem, Popover, Stack, Tooltip } from '@mui/material';
import {
  MdUndo,
  MdRedo,
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdStrikethroughS,
  MdCode,
  MdFormatColorText,
  MdFormatColorFill,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignJustify,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdChecklist,
  MdFormatQuote,
  MdHorizontalRule,
  MdImage,
  MdLink,
  MdTableChart,
  MdArticle,
} from 'react-icons/md';
import Toolbar, { ToolbarButton, ToolbarSeparator, ToolbarSpacer } from '@/components/system/Toolbar';
import { REPORT_TEMPLATES } from './extensions';

/** Palette restreinte : lisible à l'écran comme à l'impression. */
const TEXT_COLORS = [
  { value: '#E6EDF7', label: 'Défaut' },
  { value: '#C0392B', label: 'Rouge' },
  { value: '#D68910', label: 'Orange' },
  { value: '#1E8E5A', label: 'Vert' },
  { value: '#2D7DD2', label: 'Bleu' },
  { value: '#8A9AB4', label: 'Gris' },
];

const HIGHLIGHT_COLORS = [
  { value: '#5A4A0F', label: 'Jaune' },
  { value: '#4A2020', label: 'Rouge' },
  { value: '#123A2A', label: 'Vert' },
  { value: '#14304F', label: 'Bleu' },
];

/**
 * Sélecteur de couleur en nuancier.
 * @param {object} props
 */
function ColorPicker({ anchor, onClose, colors, onPick, onClear }) {
  return (
    <Popover
      open={Boolean(anchor)}
      anchorEl={anchor}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Box sx={{ p: 1, display: 'flex', gap: 0.75 }}>
        {colors.map((color) => (
          <Tooltip key={color.value} title={color.label}>
            <Box
              onClick={() => {
                onPick(color.value);
                onClose();
              }}
              sx={{
                width: 22,
                height: 22,
                borderRadius: '3px',
                bgcolor: color.value,
                border: '1px solid var(--line-strong)',
                cursor: 'pointer',
                '&:hover': { transform: 'scale(1.1)' },
                transition: 'transform 120ms ease',
              }}
            />
          </Tooltip>
        ))}
        <Tooltip title="Retirer">
          <Box
            onClick={() => {
              onClear();
              onClose();
            }}
            sx={{
              width: 22,
              height: 22,
              borderRadius: '3px',
              border: '1px dashed var(--line-strong)',
              cursor: 'pointer',
              color: 'var(--muted)',
              fontSize: 14,
              lineHeight: '20px',
              textAlign: 'center',
            }}
          >
            ×
          </Box>
        </Tooltip>
      </Box>
    </Popover>
  );
}

/**
 * Barre d'outils de l'éditeur de rapports.
 *
 * @param {object} props
 * @param {import('@tiptap/react').Editor|null} props.editor
 * @param {(type: string) => void} [props.onApplyTemplate]
 * @param {boolean} [props.disabled]
 */
export default function EditorToolbar({ editor, onApplyTemplate, disabled = false }) {
  const [textColorAnchor, setTextColorAnchor] = useState(null);
  const [highlightAnchor, setHighlightAnchor] = useState(null);
  const [tableAnchor, setTableAnchor] = useState(null);
  const [templateAnchor, setTemplateAnchor] = useState(null);

  if (!editor) return <Toolbar dense />;

  const is = (name, attrs) => editor.isActive(name, attrs);
  const run = () => editor.chain().focus();

  /** Insère une image par son URL, saisie au clavier. */
  const insertImage = () => {
    const url = window.prompt("URL de l'image (lien direct PostImage) :");
    if (url) run().setImage({ src: url.trim() }).run();
  };

  /** Pose ou retire un lien sur la sélection. */
  const toggleLink = () => {
    if (is('link')) {
      run().unsetLink().run();
      return;
    }
    const url = window.prompt('Adresse du lien :');
    if (url) run().setLink({ href: url.trim() }).run();
  };

  return (
    <>
      <Toolbar dense sx={{ flexWrap: 'wrap', height: 'auto', minHeight: 34, py: 0.5 }}>
        <ToolbarButton
          icon={<MdUndo size={16} />}
          label="Annuler"
          shortcut="Ctrl+Z"
          disabled={disabled || !editor.can().undo()}
          onClick={() => run().undo().run()}
        />
        <ToolbarButton
          icon={<MdRedo size={16} />}
          label="Rétablir"
          shortcut="Ctrl+Y"
          disabled={disabled || !editor.can().redo()}
          onClick={() => run().redo().run()}
        />

        <ToolbarSeparator />

        {[1, 2, 3].map((level) => (
          <ToolbarButton
            key={level}
            icon={<Box sx={{ fontSize: 12, fontWeight: 700 }}>H{level}</Box>}
            label={`Titre de niveau ${level}`}
            active={is('heading', { level })}
            disabled={disabled}
            onClick={() => run().toggleHeading({ level }).run()}
          />
        ))}
        <ToolbarButton
          icon={<Box sx={{ fontSize: 11, fontWeight: 600 }}>¶</Box>}
          label="Paragraphe"
          active={is('paragraph')}
          disabled={disabled}
          onClick={() => run().setParagraph().run()}
        />

        <ToolbarSeparator />

        <ToolbarButton
          icon={<MdFormatBold size={16} />}
          label="Gras"
          shortcut="Ctrl+B"
          active={is('bold')}
          disabled={disabled}
          onClick={() => run().toggleBold().run()}
        />
        <ToolbarButton
          icon={<MdFormatItalic size={16} />}
          label="Italique"
          shortcut="Ctrl+I"
          active={is('italic')}
          disabled={disabled}
          onClick={() => run().toggleItalic().run()}
        />
        <ToolbarButton
          icon={<MdFormatUnderlined size={16} />}
          label="Souligné"
          shortcut="Ctrl+U"
          active={is('underline')}
          disabled={disabled}
          onClick={() => run().toggleUnderline().run()}
        />
        <ToolbarButton
          icon={<MdStrikethroughS size={16} />}
          label="Barré"
          active={is('strike')}
          disabled={disabled}
          onClick={() => run().toggleStrike().run()}
        />
        <ToolbarButton
          icon={<MdCode size={16} />}
          label="Code"
          active={is('code')}
          disabled={disabled}
          onClick={() => run().toggleCode().run()}
        />

        <ToolbarSeparator />

        <ToolbarButton
          icon={<MdFormatColorText size={16} />}
          label="Couleur du texte"
          disabled={disabled}
          onClick={(event) => setTextColorAnchor(event?.currentTarget ?? null)}
        />
        <ToolbarButton
          icon={<MdFormatColorFill size={16} />}
          label="Surlignage"
          active={is('highlight')}
          disabled={disabled}
          onClick={(event) => setHighlightAnchor(event?.currentTarget ?? null)}
        />

        <ToolbarSeparator />

        <ToolbarButton
          icon={<MdFormatAlignLeft size={16} />}
          label="Aligner à gauche"
          active={is({ textAlign: 'left' })}
          disabled={disabled}
          onClick={() => run().setTextAlign('left').run()}
        />
        <ToolbarButton
          icon={<MdFormatAlignCenter size={16} />}
          label="Centrer"
          active={is({ textAlign: 'center' })}
          disabled={disabled}
          onClick={() => run().setTextAlign('center').run()}
        />
        <ToolbarButton
          icon={<MdFormatAlignRight size={16} />}
          label="Aligner à droite"
          active={is({ textAlign: 'right' })}
          disabled={disabled}
          onClick={() => run().setTextAlign('right').run()}
        />
        <ToolbarButton
          icon={<MdFormatAlignJustify size={16} />}
          label="Justifier"
          active={is({ textAlign: 'justify' })}
          disabled={disabled}
          onClick={() => run().setTextAlign('justify').run()}
        />

        <ToolbarSeparator />

        <ToolbarButton
          icon={<MdFormatListBulleted size={16} />}
          label="Liste à puces"
          active={is('bulletList')}
          disabled={disabled}
          onClick={() => run().toggleBulletList().run()}
        />
        <ToolbarButton
          icon={<MdFormatListNumbered size={16} />}
          label="Liste numérotée"
          active={is('orderedList')}
          disabled={disabled}
          onClick={() => run().toggleOrderedList().run()}
        />
        <ToolbarButton
          icon={<MdChecklist size={16} />}
          label="Liste de contrôle"
          active={is('taskList')}
          disabled={disabled}
          onClick={() => run().toggleTaskList().run()}
        />

        <ToolbarSeparator />

        <ToolbarButton
          icon={<MdFormatQuote size={16} />}
          label="Citation"
          active={is('blockquote')}
          disabled={disabled}
          onClick={() => run().toggleBlockquote().run()}
        />
        <ToolbarButton
          icon={<MdHorizontalRule size={16} />}
          label="Séparateur"
          disabled={disabled}
          onClick={() => run().setHorizontalRule().run()}
        />
        <ToolbarButton
          icon={<MdLink size={16} />}
          label={is('link') ? 'Retirer le lien' : 'Insérer un lien'}
          active={is('link')}
          disabled={disabled}
          onClick={toggleLink}
        />
        <ToolbarButton
          icon={<MdImage size={16} />}
          label="Insérer une image"
          disabled={disabled}
          onClick={insertImage}
        />
        <ToolbarButton
          icon={<MdTableChart size={16} />}
          label="Tableau"
          active={is('table')}
          disabled={disabled}
          onClick={(event) => setTableAnchor(event?.currentTarget ?? null)}
        />

        <ToolbarSpacer />

        <ToolbarButton
          icon={<MdArticle size={16} />}
          label="Insérer un modèle de rapport"
          disabled={disabled}
          onClick={(event) => setTemplateAnchor(event?.currentTarget ?? null)}
        />
      </Toolbar>

      <ColorPicker
        anchor={textColorAnchor}
        onClose={() => setTextColorAnchor(null)}
        colors={TEXT_COLORS}
        onPick={(color) => run().setColor(color).run()}
        onClear={() => run().unsetColor().run()}
      />

      <ColorPicker
        anchor={highlightAnchor}
        onClose={() => setHighlightAnchor(null)}
        colors={HIGHLIGHT_COLORS}
        onPick={(color) => run().setHighlight({ color }).run()}
        onClear={() => run().unsetHighlight().run()}
      />

      {/* Actions de tableau : insertion puis manipulation des lignes/colonnes */}
      <Menu
        anchorEl={tableAnchor}
        open={Boolean(tableAnchor)}
        onClose={() => setTableAnchor(null)}
      >
        {[
          {
            label: 'Insérer un tableau 3 × 3',
            action: () => run().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
          },
          { label: 'Ajouter une ligne', action: () => run().addRowAfter().run() },
          { label: 'Ajouter une colonne', action: () => run().addColumnAfter().run() },
          { label: 'Supprimer la ligne', action: () => run().deleteRow().run() },
          { label: 'Supprimer la colonne', action: () => run().deleteColumn().run() },
          { label: 'Supprimer le tableau', action: () => run().deleteTable().run() },
        ].map((item) => (
          <MenuItem
            key={item.label}
            onClick={() => {
              item.action();
              setTableAnchor(null);
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={templateAnchor}
        open={Boolean(templateAnchor)}
        onClose={() => setTemplateAnchor(null)}
      >
        {Object.entries(REPORT_TEMPLATES).map(([key, template]) => (
          <MenuItem
            key={key}
            onClick={() => {
              onApplyTemplate?.(key);
              setTemplateAnchor(null);
            }}
          >
            {template.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
