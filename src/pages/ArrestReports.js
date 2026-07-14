import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import CitizenSelect from '../components/CitizenSelect';
import { isGraded } from '../utils/permissions';
import './Pages.css';

const emptyForm = {
  citizenId: '',
  citizenName: '',
  date: new Date().toISOString().split('T')[0],
  arrestingOfficer: '',
  charges: '',
  location: '',
  status: 'En détention',
  notes: '',
};

function ArrestReports({ userRole }) {
  const [arrests, setArrests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const statuses = ['En détention', 'Libéré sous caution', 'Libéré', 'Transféré'];

  useEffect(() => {
    fetchArrests();
  }, []);

  const fetchArrests = async () => {
    try {
      const q = query(collection(db, 'arrestReports'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setArrests(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'arrestReports', editingId), formData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'arrestReports'), { ...formData, createdAt: new Date() });
      }
      setFormData(emptyForm);
      setShowForm(false);
      fetchArrests();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!isGraded(userRole)) return;
    if (window.confirm('Êtes-vous sûr?')) {
      try {
        await deleteDoc(doc(db, 'arrestReports', id));
        fetchArrests();
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const handleEdit = (arrest) => {
    setFormData({ ...emptyForm, ...arrest });
    setEditingId(arrest.id);
    setShowForm(true);
  };

  const filteredArrests = arrests.filter(arrest =>
    arrest.citizenName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    arrest.charges?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Rapports d'Arrestation</h1>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData(emptyForm); }}>
          <Plus size={18} />
          Nouvelle arrestation
        </button>
      </div>

      <div className="search-box">
        <Search size={18} />
        <input type="text" placeholder="Rechercher par citoyen ou chef d'accusation..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {showForm && (
        <div className="form-container">
          <form onSubmit={handleSubmit} className="data-form">
            <CitizenSelect
              label="Personne arrêtée (registre des citoyens)"
              value={formData.citizenId}
              onChange={({ id, name }) => setFormData({ ...formData, citizenId: id, citizenName: name })}
              required
            />

            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Agent arrestateur</label>
                <input type="text" value={formData.arrestingOfficer} onChange={(e) => setFormData({...formData, arrestingOfficer: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Statut</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Chef(s) d'accusation</label>
                <input type="text" value={formData.charges} onChange={(e) => setFormData({...formData, charges: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Lieu</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <RichTextEditor value={formData.notes} onChange={(content) => setFormData({...formData, notes: content})} placeholder="Circonstances de l'arrestation..." />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">{editingId ? 'Mettre à jour' : 'Enregistrer'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="loading">Chargement...</div> : (
        <div className="reports-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Citoyen</th>
                <th>Chef(s) d'accusation</th>
                <th>Agent</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArrests.map(arrest => (
                <tr key={arrest.id}>
                  <td>{arrest.date}</td>
                  <td>{arrest.citizenId ? <Link to={`/citizens/${arrest.citizenId}`}>{arrest.citizenName}</Link> : arrest.citizenName}</td>
                  <td>{arrest.charges}</td>
                  <td>{arrest.arrestingOfficer}</td>
                  <td><span className={`status-badge status-${arrest.status === 'En détention' ? 'inactif' : 'actif'}`}>{arrest.status}</span></td>
                  <td>
                    <button onClick={() => handleEdit(arrest)} className="btn-icon"><Edit2 size={16} /></button>
                    {isGraded(userRole) && (
                      <button onClick={() => handleDelete(arrest.id)} className="btn-icon btn-danger"><Trash2 size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ArrestReports;
