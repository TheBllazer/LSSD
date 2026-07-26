import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createEntityHooks } from './createEntityHooks';
import useAuth from '@/hooks/auth/useAuth';
import {
  reportsService,
  createReport,
  updateReport,
  changeStatus,
  signReport,
  saveRevision,
  listRevisions,
  restoreRevision,
} from '@/services/reports.service';
import { CACHE } from '@/app/config/constants';
import { REPORT_STATUS_LABELS } from '@/types/reports';

/**
 * Hooks du module Rapports.
 *
 * La création et la mise à jour passent par des fonctions dédiées plutôt que
 * par la fabrique : un rapport réserve un numéro officiel par transaction et
 * maintient des tableaux d'identifiants miroirs.
 */

const hooks = createEntityHooks(reportsService, { singular: 'le rapport' });

export const reportKeys = hooks.keys;
export const useReports = hooks.useList;
export const useAllReports = hooks.useAll;
export const useReport = hooks.useItem;
export const useReportHistory = hooks.useHistory;
export const useRemoveReport = hooks.useRemove;

/** Identité de l'agent courant. */
function useActor() {
  const { user, signature } = useAuth();
  return { uid: user?.uid ?? null, name: signature || 'Agent' };
}

/** Création d'un rapport, numéro officiel compris. */
export function useCreateReport() {
  const queryClient = useQueryClient();
  const actor = useActor();

  return useMutation({
    mutationFn: (data) => createReport(data, actor),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['citizen'] });
      queryClient.setQueryData(reportKeys.detail(created.id), created);
      toast.success(`Rapport ${created.number} créé.`);
    },
  });
}

/** Mise à jour du rapport (métadonnées ou corps). */
export function useUpdateReport() {
  const queryClient = useQueryClient();
  const actor = useActor();

  return useMutation({
    mutationFn: ({ id, patch, previous }) => updateReport(id, patch, { actor, previous }),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: reportKeys.detail(id) });
      const snapshot = queryClient.getQueryData(reportKeys.detail(id));
      if (snapshot) {
        queryClient.setQueryData(reportKeys.detail(id), { ...snapshot, ...patch });
      }
      return { snapshot };
    },
    onError: (_error, { id }, context) => {
      if (context?.snapshot) queryClient.setQueryData(reportKeys.detail(id), context.snapshot);
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}

/** Transition du circuit de validation. */
export function useChangeReportStatus() {
  const queryClient = useQueryClient();
  const actor = useActor();

  return useMutation({
    mutationFn: ({ report, status, comment }) =>
      changeStatus({ report, status, comment, actor }),
    onSuccess: (_data, { report, status }) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(report.id) });
      queryClient.invalidateQueries({ queryKey: reportKeys.history(report.id) });
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      toast.success(`Rapport ${REPORT_STATUS_LABELS[status]?.toLowerCase() ?? status}.`);
    },
  });
}

/** Signature du rapport. */
export function useSignReport() {
  const queryClient = useQueryClient();
  const actor = useActor();
  const { agent } = useAuth();

  return useMutation({
    mutationFn: ({ report }) => signReport({ report, agent, actor }),
    onSuccess: (_data, { report }) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(report.id) });
      toast.success('Rapport signé.');
    },
  });
}

/* --------------------------------------------------------------- révisions */

/**
 * Versions enregistrées d'un rapport.
 * @param {string|null} reportId
 */
export function useReportRevisions(reportId) {
  return useQuery({
    queryKey: ['report', 'revisions', reportId],
    queryFn: () => listRevisions(reportId),
    enabled: Boolean(reportId),
    staleTime: CACHE.STALE_TIME,
  });
}

/** Enregistrement d'une version (appelé par l'auto-save). */
export function useSaveRevision() {
  const queryClient = useQueryClient();
  const actor = useActor();

  return useMutation({
    mutationFn: ({ reportId, content, contentText, auto }) =>
      saveRevision(reportId, { content, contentText, actor, auto }),
    onSuccess: (_data, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: ['report', 'revisions', reportId] });
    },
  });
}

/** Restauration d'une version antérieure. */
export function useRestoreRevision() {
  const queryClient = useQueryClient();
  const actor = useActor();

  return useMutation({
    mutationFn: ({ report, revision }) => restoreRevision({ report, revision, actor }),
    onSuccess: (_data, { report }) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(report.id) });
      queryClient.invalidateQueries({ queryKey: reportKeys.history(report.id) });
      toast.success('Version restaurée.');
    },
  });
}
