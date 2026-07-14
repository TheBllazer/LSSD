import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Search, Eye } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import RichTextEditor from '../components/RichTextEditor';
import { isGraded } from '../utils/permissions';
import './Pages.css';

function Citizens({ userRole }) {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    ssn: '',
    phone: '',
    address: '',
    photoUrl: '',
    notes: ''
  });

  useEffect(() => {
    fetchCitizens();
  }, []);

  const fetchCitizens = async () => {
    try {
      const q = query(collection(db, 'citizens'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCitizens(data);
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
        await updateDoc(doc(db, 'citizens', editingId), formData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'citizens'), {
          ...formData,
          createdAt: new Date()
        });
      }
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        ssn: '',
        phone: '',
        address: '',
        photoUrl: '',
        notes: ''
      });
      setShowForm(false);
      fetchCitizens();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr?')) {
      try {
        await deleteDoc(doc(db, 'citizens', id));
        fetchCitizens();
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const handleEdit = (citizen) => {
    setFormData(citizen);
    setEditingId(citizen.id);
    setShowForm(true);
  };

  const filteredCitizens = citizens.filter(citizen =>
    citizen.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    citizen.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    citizen.ssn?.includes(searchTerm)
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Gestion des Citoyens</h1>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
          <Plus size={18} />
          Ajouter un citoyen
        </button>
      </div>

      <div className="search-box">
        <Search size={18} />
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou SSN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {showForm && (
        <div className="form-container">
          <form onSubmit={handleSubmit} className="data-form">
            <div className="form-row">
              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date de naissance</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Numéro de sécurité sociale</label>
                <input
                  type="text"
                  value={formData.ssn}
                  onChange={(e) => setFormData({...formData, ssn: e.target.value})}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Photo</label>
              <ImageUploader
                onImageUrlReceived={(url) => setFormData({...formData, photoUrl: url})}
                currentImageUrl={formData.photoUrl}
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <RichTextEditor
                value={formData.notes}
                onChange={(content) => setFormData({...formData, notes: content})}
                placeholder="Ajouter des notes sur le citoyen..."
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <div className="citizens-grid">
          {filteredCitizens.map(citizen => (
            <div key={citizen.id} className="citizen-card">
              {citizen.photoUrl && (
                <img src={citizen.photoUrl} alt={`${citizen.firstName} ${citizen.lastName}`} className="citizen-photo" />
              )}
              <div className="citizen-info">
                <h3>{citizen.firstName} {citizen.lastName}</h3>
                {citizen.ssn && <p><strong>SSN:</strong> {citizen.ssn}</p>}
                {citizen.dateOfBirth && <p><strong>DOB:</strong> {citizen.dateOfBirth}</p>}
                {citizen.phone && <p><strong>Tel:</strong> {citizen.phone}</p>}
                {citizen.address && <p><strong>Adresse:</strong> {citizen.address}</p>}
              </div>
              <div className="citizen-actions">
                <Link to={`/citizens/${citizen.id}`} className="btn-icon" title="Voir la fiche">
                  <Eye size={16} />
                </Link>
                <button onClick={() => handleEdit(citizen)} className="btn-icon">
                  <Edit2 size={16} />
                </button>
                {isGraded(userRole) && (
                  <button onClick={() => handleDelete(citizen.id)} className="btn-icon btn-danger">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Citizens;