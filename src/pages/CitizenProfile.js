import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Car, Crosshair, FileText, Scale, Lock } from 'lucide-react';
import './Pages.css';
import './CitizenProfile.css';

function CitizenProfile() {
  const { id } = useParams();
  const [citizen, setCitizen] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [weapons, setWeapons] = useState([]);
  const [reports, setReports] = useState([]);
  const [criminalRecords, setCriminalRecords] = useState([]);
  const [arrests, setArrests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const citizenSnap = await getDoc(doc(db, 'citizens', id));
      setCitizen(citizenSnap.exists() ? { id: citizenSnap.id, ...citizenSnap.data() } : null);

      const [vehiclesSnap, weaponsSnap, reportsSnap, recordsSnap, arrestsSnap] = await Promise.all([
        getDocs(query(collection(db, 'vehicles'), where('ownerId', '==', id))),
        getDocs(query(collection(db, 'weapons'), where('ownerId', '==', id))),
        getDocs(query(collection(db, 'reports'), where('suspectId', '==', id))),
        getDocs(query(collection(db, 'criminalRecords'), where('citizenId', '==', id))),
        getDocs(query(collection(db, 'arrestReports'), where('citizenId', '==', id))),
      ]);

      setVehicles(vehiclesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setWeapons(weaponsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setReports(reportsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCriminalRecords(recordsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setArrests(arrestsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  if (!citizen) {
    return (
      <div className="page-container">
        <Link to="/citizens" className="btn-secondary" style={{ display: 'inline-flex', width: 'fit-content' }}>
          <ArrowLeft size={16} /> Retour aux citoyens
        </Link>
        <p style={{ marginTop: '20px' }}>Citoyen introuvable.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Link to="/citizens" className="btn-secondary" style={{ display: 'inline-flex', width: 'fit-content', marginBottom: '15px' }}>
        <ArrowLeft size={16} /> Retour aux citoyens
      </Link>

      <div className="citizen-profile-header">
        {citizen.photoUrl && <img src={citizen.photoUrl} alt={`${citizen.firstName} ${citizen.lastName}`} className="citizen-profile-photo" />}
        <div>
          <h1>{citizen.firstName} {citizen.lastName}</h1>
          {citizen.dateOfBirth && <p><strong>Date de naissance:</strong> {citizen.dateOfBirth}</p>}
          {citizen.ssn && <p><strong>SSN:</strong> {citizen.ssn}</p>}
          {citizen.phone && <p><strong>Téléphone:</strong> {citizen.phone}</p>}
          {citizen.address && <p><strong>Adresse:</strong> {citizen.address}</p>}
          {citizen.notes && (
            <div className="citizen-profile-notes" dangerouslySetInnerHTML={{ __html: citizen.notes }} />
          )}
        </div>
      </div>

      <div className="profile-section">
        <h2><Scale size={18} /> Casier judiciaire ({criminalRecords.length})</h2>
        {criminalRecords.length === 0 ? <p className="profile-empty">Aucune inscription.</p> : (
          <table>
            <thead><tr><th>Date</th><th>Qualification</th><th>Chef d'accusation</th><th>Peine</th></tr></thead>
            <tbody>
              {criminalRecords.map(r => (
                <tr key={r.id}><td>{r.date}</td><td>{r.qualification}</td><td>{r.charge}</td><td>{r.sentence || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="profile-section">
        <h2><Lock size={18} /> Rapports d'arrestation ({arrests.length})</h2>
        {arrests.length === 0 ? <p className="profile-empty">Aucune arrestation enregistrée.</p> : (
          <table>
            <thead><tr><th>Date</th><th>Chef(s) d'accusation</th><th>Agent</th><th>Statut</th></tr></thead>
            <tbody>
              {arrests.map(a => (
                <tr key={a.id}><td>{a.date}</td><td>{a.charges}</td><td>{a.arrestingOfficer}</td><td>{a.status}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="profile-section">
        <h2><FileText size={18} /> Rapports où il/elle est suspect ({reports.length})</h2>
        {reports.length === 0 ? <p className="profile-empty">Aucun rapport.</p> : (
          <table>
            <thead><tr><th>N°</th><th>Date</th><th>Type</th><th>Statut</th></tr></thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}><td>{r.reportNumber}</td><td>{r.date}</td><td>{r.type}</td><td>{r.status}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="profile-section">
        <h2><Car size={18} /> Véhicules enregistrés ({vehicles.length})</h2>
        {vehicles.length === 0 ? <p className="profile-empty">Aucun véhicule.</p> : (
          <table>
            <thead><tr><th>Plaque</th><th>Marque</th><th>Modèle</th><th>Catégorie</th></tr></thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id}><td>{v.plate}</td><td>{v.make}</td><td>{v.model}</td><td>{v.category}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="profile-section">
        <h2><Crosshair size={18} /> Armes enregistrées ({weapons.length})</h2>
        {weapons.length === 0 ? <p className="profile-empty">Aucune arme.</p> : (
          <table>
            <thead><tr><th>Type</th><th>Modèle</th><th>Numéro de série</th></tr></thead>
            <tbody>
              {weapons.map(w => (
                <tr key={w.id}><td>{w.type}</td><td>{w.model}</td><td>{w.serialNumber}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default CitizenProfile;
