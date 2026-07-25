import { useEffect, useState } from 'react';
import { dayjs } from '@/utils/dates';

/**
 * Horloge de service, rafraîchie à la seconde.
 * Présente en permanence dans la barre d'état, comme sur un terminal CAD.
 *
 * @param {string} [format='DD/MM HH:mm:ss']
 * @returns {string} Heure formatée
 */
export default function useClock(format = 'DD/MM HH:mm:ss') {
  const [value, setValue] = useState(() => dayjs().format(format));

  useEffect(() => {
    const tick = () => setValue(dayjs().format(format));
    tick();

    // Aligne le premier battement sur la seconde suivante : l'horloge ne
    // « saute » pas d'une seconde à l'affichage initial.
    const delay = 1000 - (Date.now() % 1000);
    let interval;
    const timeout = setTimeout(() => {
      tick();
      interval = setInterval(tick, 1000);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [format]);

  return value;
}
