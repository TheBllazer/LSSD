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
  charge: '',
  qualification: 'Délit',
  sentence: '',
  reference: '',
  notes: '',
};

function CriminalRecord({ userRole }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const qualifications = ['Contravention', 'Délit', 'Crime'];

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const q = query(collection(db, 'criminalRecords'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEntries(data);
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
        await updateDoc(doc(db, 'criminalRecords', editingId), formData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'criminalRecords'), { ...formData, createdAt: new Date() });
      }
      setFormData(emptyForm);
      setShowForm(false);
      fetchEntries();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!isGraded(userRole)) return;
    if (window.confirm('Êtes-vous sûr?')) {
      try {
        await deleteDoc(doc(db, 'criminalRecords', id));
        fetchEntries();
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const handleEdit = (entry) => {
    setFormData({ ...emptyForm, ...entry });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const filteredEntries = entries.filter(entry =>
    entry.citizenName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.charge?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Casier Judiciaire</h1>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData(emptyForm); }}>
          <Plus size={18} />
          Nouvelle inscription
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
                <label>Qualification</label>
                <select value={formData.qualification} onChange={(e) => setFormData({...formData, qualification: e.target.value})}>
                  {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Chef d'accusation</label>
              <input type="text" value={formData.charge} onChange={(e) => setFormData({...formData, charge: e.target.value})} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Peine prononcée</label>
                <input type="text" value={formData.sentence} onChange={(e) => setFormData({...formData, sentence: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Référence (n° rapport, dossier...)</label>
                <input type="text" value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <RichTextEditor value={formData.notes} onChange={(content) => setFormData({...formData, notes: content})} placeholder="Détails..." />
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
                <th>Qualification</th>
                <th>Chef d'accusation</th>
                <th>Peine</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map(entry => (
                <tr key={entry.id}>
                  <td>{entry.date}</td>
                  <td>{entry.citizenId ? <Link to={`/citizens/${entry.citizenId}`}>{entry.citizenName}</Link> : entry.citizenName}</td>
                  <td><span className="badge">{entry.qualification}</span></td>
                  <td>{entry.charge}</td>
                  <td>{entry.sentence || '—'}</td>
                  <td>
                    <button onClick={() => handleEdit(entry)} className="btn-icon"><Edit2 size={16} /></button>
                    {isGraded(userRole) && (
                      <button onClick={() => handleDelete(entry.id)} className="btn-icon btn-danger"><Trash2 size={16} /></button>
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

export default CriminalRecord;
