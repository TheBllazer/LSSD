import { useEffect, useState } from 'react';
import { watchOnlineAgents } from '@/services/presence.service';
import useAuth from '@/hooks/auth/useAuth';

/**
 * Liste temps réel des agents connectés.
 *
 * L'un des rares abonnements `onSnapshot` de l'application : la collection
 * `/presence` est minuscule (un document par agent) et l'information n'a de
 * valeur que si elle est instantanée.
 *
 * @returns {{ agents: object[], count: number, error: Error|null }}
 */
export default function useOnlineAgents() {
  const { isAuthenticated } = useAuth();
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setAgents([]);
      return undefined;
    }

    const unsubscribe = watchOnlineAgents(
      (list) => {
        setAgents(list);
        setError(null);
      },
      (subscriptionError) => setError(subscriptionError),
    );

    return unsubscribe;
  }, [isAuthenticated]);

  return { agents, count: agents.length, error };
}
