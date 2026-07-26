import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/auth/useAuth';
import {
  listAgents,
  fetchAgent,
  fetchPermissions,
  listAgentActivity,
  listAuditLog,
  createAgentAccount,
  updateAgent,
  savePermissions,
  setAccountDisabled,
  sendPasswordReset,
} from '@/services/agents.service';
import { CACHE } from '@/app/config/constants';

/**
 * Hooks du module Personnel et de l'administration.
 */

const keys = {
  all: ['agent'],
  list: (params) => ['agent', 'list', params],
  detail: (uid) => ['agent', 'detail', uid],
  permissions: (uid) => ['agent', 'permissions', uid],
  activity: (uid) => ['agent', 'activity', uid],
  audit: (params) => ['audit', params],
};

export const agentKeys = keys;

/** Identité de l'agent courant. */
function useActor() {
  const { user, signature } = useAuth();
  return { uid: user?.uid ?? null, name: signature || 'Agent' };
}

/** Annuaire du personnel. */
export function useAgents(params = {}) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => listAgents(params),
    staleTime: CACHE.STALE_TIME,
  });
}

/** Fiche d'un agent. */
export function useAgent(uid) {
  return useQuery({
    queryKey: keys.detail(uid),
    queryFn: () => fetchAgent(uid),
    enabled: Boolean(uid),
    staleTime: CACHE.STALE_TIME,
  });
}

/** Habilitations d'un agent. */
export function useAgentPermissions(uid) {
  return useQuery({
    queryKey: keys.permissions(uid),
    queryFn: () => fetchPermissions(uid),
    enabled: Boolean(uid),
    staleTime: CACHE.STALE_TIME,
  });
}

/** Activité journalisée d'un agent. */
export function useAgentActivity(uid) {
  return useQuery({
    queryKey: keys.activity(uid),
    queryFn: () => listAgentActivity(uid),
    enabled: Boolean(uid),
    staleTime: CACHE.STALE_TIME,
  });
}

/** Journal d'audit global. */
export function useAuditLog(params = {}) {
  return useQuery({
    queryKey: keys.audit(params),
    queryFn: () => listAuditLog(params),
    staleTime: 30_000,
  });
}

/** Création d'un compte agent. */
export function useCreateAgent() {
  const queryClient = useQueryClient();
  const actor = useActor();

  return useMutation({
    mutationFn: ({ profile, password }) => createAgentAccount({ profile, password, actor }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      toast.success(
        'Compte créé. Un courriel de définition du mot de passe a été envoyé à l\'agent.',
      );
    },
  });
}

/** Mise à jour d'une fiche agent. */
export function useUpdateAgent() {
  const queryClient = useQueryClient();
  const actor = useActor();

  return useMutation({
    mutationFn: ({ uid, patch }) => updateAgent(uid, patch, actor),
    onSettled: (_data, _error, { uid }) => {
      queryClient.invalidateQueries({ queryKey: keys.detail(uid) });
      queryClient.invalidateQueries({ queryKey: ['agent', 'list'] });
    },
  });
}

/** Enregistrement des habilitations. */
export function useSavePermissions() {
  const queryClient = useQueryClient();
  const actor = useActor();

  return useMutation({
    mutationFn: ({ uid, role, grants, revokes, disabled }) =>
      savePermissions({ uid, role, grants, revokes, disabled, actor }),
    onSuccess: (_data, { uid }) => {
      queryClient.invalidateQueries({ queryKey: keys.permissions(uid) });
      queryClient.invalidateQueries({ queryKey: keys.detail(uid) });
      toast.success('Habilitations enregistrées.');
    },
  });
}

/** Activation ou suspension d'un compte. */
export function useSetAccountDisabled() {
  const queryClient = useQueryClient();
  const actor = useActor();

  return useMutation({
    mutationFn: ({ uid, disabled, permissions }) =>
      setAccountDisabled({ uid, disabled, permissions, actor }),
    onSuccess: (_data, { uid, disabled }) => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      toast.success(
        disabled
          ? 'Compte suspendu — effet immédiat sur toutes ses sessions.'
          : 'Compte réactivé.',
      );
      queryClient.invalidateQueries({ queryKey: keys.permissions(uid) });
    },
  });
}

/** Envoi d'un courriel de réinitialisation de mot de passe. */
export function useSendPasswordReset() {
  return useMutation({
    mutationFn: (email) => sendPasswordReset(email),
    onSuccess: () => toast.success('Courriel de réinitialisation envoyé.'),
  });
}
