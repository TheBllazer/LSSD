import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Search, AlertTriangle } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import { isGraded } from '../utils/permissions';
import './Pages.css';

function Investigations({ userRole }) {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    caseNumber: '',
    title: '',
    status: 'Active',
    priority: 'Normale',
    lead: '',
    startDate: new Date().toISOString().split('T')[0],
    suspect: '',
    victims: '',
    details: ''
  });

  const statuses = ['Active', 'Suspendue', 'Clôturée', 'Archivée'];
  const priorities = ['Basse', 'Normale', 'Élevée', 'Critique'];

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const fetchInvestigations = async () => {
    try {
      const q = query(collection(db, 'investigations'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvestigations(data);
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
        await updateDoc(doc(db, 'investigations', editingId), formData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'investigations'), { ...formData, createdAt: new Date() });
      }
      setFormData({
        caseNumber: '',
        title: '',
        status: 'Active',
        priority: 'Normale',
        lead: '',
        startDate: new Date().toISOString().split('T')[0],
        suspect: '',
        victims: '',
        details: ''
      });
      setShowForm(false);
      fetchInvestigations();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr?')) {
      try {
        await deleteDoc(doc(db, 'investigations', id));
        fetchInvestigations();
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const handleEdit = (investigation) => {
    setFormData(investigation);
    setEditingId(investigation.id);
    setShowForm(true);
  };

  const filteredInvestigations = investigations.filter(investigation =>
    investigation.caseNumber?.includes(searchTerm) ||
    investigation.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    investigation.suspect?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Basse': return '#00ff88';
      case 'Normale': return '#00d4ff';
      case 'Élevée': return '#ffd93d';
      case 'Critique': return '#ff3333';
      default: return '#00d4ff';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Gestion des Enquêtes</h1>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
          <Plus size={18} />
          Nouvelle enquête
        </button>
      </div>

      <div className="search-box">
        <Search size={18} />
        <input type="text" placeholder="Rechercher par numéro, titre ou suspect..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {showForm && (
        <div className="form-container">
          <form onSubmit={handleSubmit} className="data-form">
            <div className="form-row">
              <div className="form-group">
                <label>Numéro de dossier</label>
                <input type="text" value={formData.caseNumber} onChange={(e) => setFormData({...formData, caseNumber: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Titre</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Statut</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} required>
                  {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Priorité</label>
                <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} required>
                  {priorities.map(priority => <option key={priority} value={priority}>{priority}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Date de début</label>
                <input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Agent responsable</label>
                <input type="text" value={formData.lead} onChange={(e) => setFormData({...formData, lead: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Suspect(s)</label>
                <input type="text" value={formData.suspect} onChange={(e) => setFormData({...formData, suspect: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Victime(s)</label>
                <input type="text" value={formData.victims} onChange={(e) => setFormData({...formData, victims: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label>Détails</label>
              <RichTextEditor value={formData.details} onChange={(content) => setFormData({...formData, details: content})} placeholder="Détails de l'enquête..." />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">{editingId ? 'Mettre à jour' : 'Créer'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="loading">Chargement...</div> : (
        <div className="investigations-cards">
          {filteredInvestigations.map(investigation => (
            <div key={investigation.id} className="investigation-card">
              <div className="card-header" style={{ borderLeftColor: getPriorityColor(investigation.priority) }}>
                <h3>{investigation.caseNumber}</h3>
                <AlertTriangle size={16} color={getPriorityColor(investigation.priority)} />
              </div>
              <div className="card-body">
                <p><strong>Titre:</strong> {investigation.title}</p>
                <p><strong>Suspect:</strong> {investigation.suspect}</p>
                <p><strong>Victime(s):</strong> {investigation.victims}</p>
                <p><strong>Agent:</strong> {investigation.lead}</p>
                <p><strong>Date:</strong> {investigation.startDate}</p>
              </div>
              <div className="card-footer">
                <span className={`status-badge status-${investigation.status.toLowerCase()}`}>{investigation.status}</span>
                <span className="priority-badge" style={{ background: getPriorityColor(investigation.priority) }}>{investigation.priority}</span>
                <button onClick={() => handleEdit(investigation)} className="btn-icon"><Edit2 size={16} /></button>
                {isGraded(userRole) && (
                    <button onClick={() => handleDelete(investigation.id)} className="btn-icon btn-danger"><Trash2 size={16} /></button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Investigations;