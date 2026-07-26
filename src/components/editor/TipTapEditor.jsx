import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Box, Stack, Typography } from '@mui/material';
import EditorToolbar from './EditorToolbar';
import { buildExtensions, buildTemplateContent } from './extensions';
import './editor.css';

/**
 * Éditeur du corps d'un rapport.
 *
 * Le document est stocké en JSON ProseMirror ; la version texte plat est
 * produite à chaque frappe pour alimenter l'index de recherche et le rendu PDF.
 * Les deux repartent ensemble vers le parent, qui décide quand écrire.
 *
 * La zone d'édition est présentée au format A4 sur fond sombre : l'agent voit
 * dès la rédaction la pagination qu'aura le document officiel.
 *
 * @param {object} props
 * @param {object|null} props.content        Document ProseMirror
 * @param {(payload: {content: object, contentText: string}) => void} props.onChange
 * @param {boolean} [props.readOnly]
 * @param {string} [props.placeholder]
 * @param {React.ReactNode} [props.statusBar] Contenu additionnel du pied
 */
export default function TipTapEditor({
  content,
  onChange,
  readOnly = false,
  placeholder,
  statusBar,
}) {
  const editor = useEditor({
    extensions: buildExtensions({ placeholder }),
    content: content ?? '',
    editable: !readOnly,
    onUpdate: ({ editor: instance }) => {
      onChange?.({
        content: instance.getJSON(),
        contentText: instance.getText(),
      });
    },
    editorProps: {
      attributes: {
        class: 'report-editor',
        spellcheck: 'true',
      },
    },
  });

  // Le passage en lecture seule doit être répercuté sur l'instance existante :
  // recréer l'éditeur ferait perdre la position du curseur et l'historique.
  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  /**
   * Insère la trame d'un modèle de rapport.
   * Le contenu existant n'est jamais écrasé : le modèle est ajouté à la suite.
   */
  const applyTemplate = (type) => {
    const template = buildTemplateContent(type);
    if (!template || !editor) return;
    editor.chain().focus().insertContent(template.content).run();
  };

  const characters = editor?.storage.characterCount?.characters() ?? 0;
  const words = editor?.storage.characterCount?.words() ?? 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '3px',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      {!readOnly && <EditorToolbar editor={editor} onApplyTemplate={applyTemplate} />}

      <Box
        className="scroll-compact"
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          p: 2.5,
          bgcolor: 'var(--navy-900)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <EditorContent editor={editor} />
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          px: 1.25,
          height: 26,
          flexShrink: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'var(--navy-850)',
        }}
      >
        <Typography className="mono" sx={{ fontSize: 10.5, color: 'text.secondary' }}>
          {words} mot{words > 1 ? 's' : ''} · {characters} caractère
          {characters > 1 ? 's' : ''}
        </Typography>
        <Box sx={{ flex: 1 }} />
        {statusBar}
      </Stack>
    </Box>
  );
}
