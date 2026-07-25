import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createEntityHooks } from './createEntityHooks';
import useAuth from '@/hooks/auth/useAuth';
import {
  citizensService,
  listNotes,
  addNote,
  setNotePinned,
  deleteNote,
  listPhotos,
  addPhoto,
  deletePhoto,
} from '@/services/citizens.service';
import { CACHE } from '@/app/config/constants';

/**
 * Hooks du registre des citoyens.
 *
 * Les opérations standard viennent de la fabrique commune ; seules les
 * sous-collections propres au module (notes, galerie) sont écrites ici.
 */

const hooks = createEntityHooks(citizensService, {
  singular: 'la fiche citoyen',
  created: 'Fiche citoyen créée.',
});

export const citizenKeys = hooks.keys;
export const useCitizens = hooks.useList;
export const useAllCitizens = hooks.useAll;
export const useCitizen = hooks.useItem;
export const useCitizenHistory = hooks.useHistory;
export const useCreateCitizen = hooks.useCreate;
export const useUpdateCitizen = hooks.useUpdate;
export const useRemoveCitizen = hooks.useRemove;
export const useRestoreCitizen = hooks.useRestore;

/** Identité de l'agent courant, au format attendu par les services. */
function useActor() {
  const { user, signature } = useAuth();
  return { uid: user?.uid ?? null, name: signature || 'Agent' };
}

/* ------------------------------------------------------------------- notes */

/**
 * Notes internes d'une fiche.
 * @param {string|null} citizenId
 */
export function useCitizenNotes(citizenId) {
  return useQuery({
    queryKey: ['citizen', 'notes', citizenId],
    queryFn: () => listNotes(citizenId),
    enabled: Boolean(citizenId),
    staleTime: CACHE.STALE_TIME,
  });
}

/**
 * Écritures sur les notes : ajout, épinglage, suppression.
 * Regroupées dans un seul hook — elles partagent la même invalidation.
 *
 * @param {string} citizenId
 */
export function useCitizenNoteActions(citizenId) {
  const queryClient = useQueryClient();
  const actor = useActor();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['citizen', 'notes', citizenId] });

  const create = useMutation({
    mutationFn: (body) => addNote(citizenId, actor, body),
    onSuccess: () => {
      invalidate();
      toast.success('Note ajoutée.');
    },
  });

  const togglePin = useMutation({
    mutationFn: ({ noteId, pinned }) => setNotePinned(citizenId, noteId, pinned),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (noteId) => deleteNote(citizenId, noteId),
    onSuccess: () => {
      invalidate();
      toast.success('Note supprimée.');
    },
  });

  return { create, togglePin, remove };
}

/* ------------------------------------------------------------------ photos */

/**
 * Galerie photographique d'une fiche.
 * @param {string|null} citizenId
 */
export function useCitizenPhotos(citizenId) {
  return useQuery({
    queryKey: ['citizen', 'photos', citizenId],
    queryFn: () => listPhotos(citizenId),
    enabled: Boolean(citizenId),
    staleTime: CACHE.STALE_TIME,
  });
}

/**
 * Écritures sur la galerie.
 * @param {string} citizenId
 */
export function useCitizenPhotoActions(citizenId) {
  const queryClient = useQueryClient();
  const actor = useActor();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['citizen', 'photos', citizenId] });

  const create = useMutation({
    mutationFn: (photo) => addPhoto(citizenId, actor, photo),
    onSuccess: () => {
      invalidate();
      toast.success('Photographie ajoutée.');
    },
  });

  const remove = useMutation({
    mutationFn: (photoId) => deletePhoto(citizenId, photoId),
    onSuccess: () => {
      invalidate();
      toast.success('Photographie retirée.');
    },
  });

  return { create, remove };
}
