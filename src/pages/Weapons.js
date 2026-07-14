import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import CitizenSelect from '../components/CitizenSelect';
import { isGraded } from '../utils/permissions';
import './Pages.css';

function Weapons({ userRole }) {
  const [weapons, setWeapons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    model: '',
    serialNumber: '',
    type: 'Pistolet',
    ownerId: '',
    ownerName: '',
    registrationDate: '',
    notes: ''
  });

  const weaponTypes = ['Fusil', 'Pistolet', 'Revolver', 'Tazer', 'Arme Blanche'];

  useEffect(() => {
    fetchWeapons();
  }, []);

  const fetchWeapons = async () => {
    try {
      const q = query(collection(db, 'weapons'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWeapons(data);
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
        await updateDoc(doc(db, 'weapons', editingId), formData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'weapons'), { ...formData, createdAt: new Date() });
      }
      setFormData({ model: '', serialNumber: '', type: 'Pistolet', ownerId: '', ownerName: '', registrationDate: '', notes: '' });
      setShowForm(false);
      fetchWeapons();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr?')) {
      try {
        await deleteDoc(doc(db, 'weapons', id));
        fetchWeapons();
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const handleEdit = (weapon) => {
    setFormData(weapon);
    setEditingId(weapon.id);
    setShowForm(true);
  };

  const filteredWeapons = weapons.filter(weapon =>
    weapon.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    weapon.serialNumber?.includes(searchTerm) ||
    weapon.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Gestion des Armes</h1>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
          <Plus size={18} />
          Ajouter une arme
        </button>
      </div>

      <div className="search-box">
        <Search size={18} />
        <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {showForm && (
        <div className="form-container">
          <form onSubmit={handleSubmit} className="data-form">
            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} required>
                  {weaponTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Modèle</label>
                <input type="text" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Numéro de série</label>
                <input type="text" value={formData.serialNumber} onChange={(e) => setFormData({...formData, serialNumber: e.target.value})} required />
              </div>
            </div>

            <div className="form-row">
              <CitizenSelect
                label="Propriétaire (registre des citoyens)"
                value={formData.ownerId}
                onChange={({ id, name }) => setFormData({ ...formData, ownerId: id, ownerName: name })}
              />
              <div className="form-group">
                <label>Date d'enregistrement</label>
                <input type="date" value={formData.registrationDate} onChange={(e) => setFormData({...formData, registrationDate: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <RichTextEditor value={formData.notes} onChange={(content) => setFormData({...formData, notes: content})} placeholder="Notes sur l'arme..." />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">{editingId ? 'Mettre à jour' : 'Enregistrer'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="loading">Chargement...</div> : (
        <div className="weapons-table">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Modèle</th>
                <th>Numéro de série</th>
                <th>Propriétaire</th>
                <th>Date d'enregistrement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWeapons.map(weapon => (
                <tr key={weapon.id}>
                  <td>{weapon.type}</td>
                  <td>{weapon.model}</td>
                  <td>{weapon.serialNumber}</td>
                  <td>{weapon.ownerId ? <Link to={`/citizens/${weapon.ownerId}`}>{weapon.ownerName}</Link> : (weapon.ownerName || '—')}</td>
                  <td>{weapon.registrationDate}</td>
                  <td>
                    <button onClick={() => handleEdit(weapon)} className="btn-icon"><Edit2 size={16} /></button>
                    {isGraded(userRole) && (
                    <button onClick={() => handleDelete(weapon.id)} className="btn-icon btn-danger"><Trash2 size={16} /></button>
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

export default Weapons;