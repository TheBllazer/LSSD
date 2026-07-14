import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

// Sélecteur de groupe illégal — utilisé pour lier une enquête à un dossier
// de groupe existant, au lieu de retaper le nom à la main.
function GangSelect({ value, onChange, label = 'Groupe lié (optionnel)' }) {
  const [gangs, setGangs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGangs = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'gangs'));
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setGangs(data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGangs();
  }, []);

  const handleChange = (e) => {
    const gangId = e.target.value;
    const gang = gangs.find((g) => g.id === gangId);
    onChange(gang ? { id: gang.id, name: gang.name } : { id: '', name: '' });
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      <select value={value || ''} onChange={handleChange} disabled={loading}>
        <option value="">
          {loading ? 'Chargement des groupes...' : '-- Aucun --'}
        </option>
        {gangs.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}{g.acronym ? ` (${g.acronym})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

export default GangSelect;
