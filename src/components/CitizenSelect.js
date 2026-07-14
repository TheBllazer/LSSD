import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const formatDob = (dateOfBirth) => {
  if (!dateOfBirth) return '';
  const [y, m, d] = dateOfBirth.split('-');
  if (!y || !m || !d) return dateOfBirth;
  return `${d}/${m}/${y}`;
};

// Sélecteur de citoyen à partir du registre — utilisé partout où un
// enregistrement doit être lié à une fiche citoyen (véhicules, armes,
// rapports, casier judiciaire, rapports d'arrestation...) au lieu de
// taper un nom à la main.
function CitizenSelect({ value, onChange, label = 'Citoyen (registre)', required = false }) {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCitizens = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'citizens'));
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
        setCitizens(data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCitizens();
  }, []);

  const handleChange = (e) => {
    const citizenId = e.target.value;
    const citizen = citizens.find((c) => c.id === citizenId);
    onChange(
      citizen
        ? { id: citizen.id, name: `${citizen.firstName} ${citizen.lastName}` }
        : { id: '', name: '' }
    );
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      <select value={value || ''} onChange={handleChange} required={required} disabled={loading}>
        <option value="">
          {loading ? 'Chargement des citoyens...' : '-- Sélectionner un citoyen --'}
        </option>
        {citizens.map((c) => (
          <option key={c.id} value={c.id}>
            {c.lastName} {c.firstName}
            {c.dateOfBirth ? ` — né(e) le ${formatDob(c.dateOfBirth)}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CitizenSelect;
