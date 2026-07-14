import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Search, AlertTriangle, Users } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import ImageUploader from '../components/ImageUploader';
import { isGraded } from '../utils/permissions';
import './Pages.css';

function GangGroups({ userRole }) {
  const [gangs, setGangs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    acronym: '',
    territory: '',
    threat: 'Moyen',
    members: '',
    leader: '',
    color: '',
    logoUrl: '',
    notes: ''
  });

  const threatLevels = ['Faible', 'Moyen', 'Élevé', 'Critique'];

  useEffect(() => {
    fetchGangs();
  }, []);

  const fetchGangs = async () => {
    try {
      const q = query(collection(db, 'gangs'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGangs(data);
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
        await updateDoc(doc(db, 'gangs', editingId), formData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'gangs'), { ...formData, createdAt: new Date() });
      }
      setFormData({
        name: '',
        acronym: '',
        territory: '',
        threat: 'Moyen',
        members: '',
        leader: '',
        color: '',
        logoUrl: '',
        notes: ''
      });
      setShowForm(false);
      fetchGangs();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr?')) {
      try {
        await deleteDoc(doc(db, 'gangs', id));
        fetchGangs();
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const handleEdit = (gang) => {
    setFormData(gang);
    setEditingId(gang.id);
    setShowForm(true);
  };

  const getThreatColor = (threat) => {
    switch(threat) {
      case 'Faible': return '#00ff88';
      case 'Moyen': return '#ffd93d';
      case 'Élevé': return '#ff9d00';
      case 'Critique': return '#ff3333';
      default: return '#00d4ff';
    }
  };

  const filteredGangs = gangs.filter(gang =>
    gang.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gang.acronym?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gang.leader?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Groupes Illégaux</h1>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
          <Plus size={18} />
          Ajouter un groupe
        </button>
      </div>

      <div className="search-box">
        <Search size={18} />
        <input type="text" placeholder="Rechercher par nom, acronyme ou chef..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {showForm && (
        <div className="form-container">
          <form onSubmit={handleSubmit} className="data-form">
            <div className="form-row">
              <div className="form-group">
                <label>Nom du groupe</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Acronyme</label>
                <input type="text" value={formData.acronym} onChange={(e) => setFormData({...formData, acronym: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Couleur associée</label>
                <input type="color" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Chef/Leader</label>
                <input type="text" value={formData.leader} onChange={(e) => setFormData({...formData, leader: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Nombre de membres estimé</label>
                <input type="number" value={formData.members} onChange={(e) => setFormData({...formData, members: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Niveau de menace</label>
                <select value={formData.threat} onChange={(e) => setFormData({...formData, threat: e.target.value})} required>
                  {threatLevels.map(level => <option key={level} value={level}>{level}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Territoire</label>
              <input type="text" value={formData.territory} onChange={(e) => setFormData({...formData, territory: e.target.value})} placeholder="Quartiers contrôlés..." />
            </div>

            <div className="form-group">
              <label>Logo/Image</label>
              <ImageUploader onImageUrlReceived={(url) => setFormData({...formData, logoUrl: url})} currentImageUrl={formData.logoUrl} />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <RichTextEditor value={formData.notes} onChange={(content) => setFormData({...formData, notes: content})} placeholder="Informations sur le groupe..." />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">{editingId ? 'Mettre à jour' : 'Ajouter'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="loading">Chargement...</div> : (
        <div className="gangs-grid">
          {filteredGangs.map(gang => (
            <div key={gang.id} className="gang-card" style={{ borderTopColor: gang.color || '#00d4ff' }}>
              {gang.logoUrl && <img src={gang.logoUrl} alt={gang.name} className="gang-logo" />}
              <div className="gang-header">
                <h3>{gang.name}</h3>
                {gang.acronym && <span className="gang-acronym">{gang.acronym}</span>}
              </div>
              <div className="gang-info">
                {gang.leader && <p><Users size={14} /> <strong>Chef:</strong> {gang.leader}</p>}
                {gang.members && <p><strong>Membres estimés:</strong> {gang.members}</p>}
                {gang.territory && <p><strong>Territoire:</strong> {gang.territory}</p>}
              </div>
              <div className="gang-footer">
                <span className="threat-badge" style={{ background: getThreatColor(gang.threat) }}>{gang.threat}</span>
                <button onClick={() => handleEdit(gang)} className="btn-icon"><Edit2 size={16} /></button>
                {isGraded(userRole) && (
                    <button onClick={() => handleDelete(gang.id)} className="btn-icon btn-danger"><Trash2 size={16} /></button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GangGroups;