import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

/**
 * Observateur de formulaire.
 *
 * Signale toute modification des valeurs au parent, ce qui permet de brancher
 * l'enregistrement automatique sans que les champs aient à connaître la
 * mécanique de sauvegarde.
 *
 * La première émission est ignorée : le simple montage d'un formulaire
 * pré-rempli ne constitue pas une modification et ne doit pas déclencher
 * d'écriture.
 *
 * @param {object} props
 * @param {(values: object) => void} props.onChange
 * @param {boolean} [props.enabled=true]
 */
export default function FormWatcher({ onChange, enabled = true }) {
  const { control } = useFormContext();
  const values = useWatch({ control });

  // Comparaison par sérialisation : `useWatch` retourne un nouvel objet à
  // chaque rendu, une égalité de référence déclencherait en boucle.
  const serialized = JSON.stringify(values);
  const previousRef = useRef(serialized);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled) return;
    if (serialized === previousRef.current) return;
    previousRef.current = serialized;
    onChangeRef.current(JSON.parse(serialized));
  }, [serialized, enabled]);

  return null;
}
