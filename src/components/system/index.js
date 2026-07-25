/**
 * Point d'entrée unique du chrome « logiciel ».
 * Permet `import { Panel, Toolbar, StatusChip } from '@/components/system'`.
 */

export { default as Panel, PanelHeader, PanelBody, PanelFooter } from './Panel';
export { default as Toolbar, ToolbarButton, ToolbarSeparator, ToolbarSpacer, ToolbarToggleGroup } from './Toolbar';
export { default as StatusBar, StatusItem, StatusSpacer } from './StatusBar';
export { default as TitleBar } from './TitleBar';
export { default as SplitPane } from './SplitPane';
export { default as SectionCard } from './SectionCard';
export { default as StatusChip, SeverityChip } from './StatusChip';
export { default as KeyValueRow } from './KeyValueRow';
export { default as Kbd, KbdCombo } from './Kbd';
