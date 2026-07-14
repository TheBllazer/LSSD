import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import RichTextEditor from '../components/RichTextEditor';
import CitizenSelect from '../components/CitizenSelect';
import { isGraded } from '../utils/permissions';
import './Pages.css';

function Vehicles({ userRole }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    plate: '',
    vin: '',
    category: 'car',
    ownerId: '',
    ownerName: '',
    photoUrl: '',
    notes: ''
  });

  const categories = ['Voiture', 'Moto', 'Bateau', 'Hélicoptère', 'Avion'];

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const q = query(collection(db, 'vehicles'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVehicles(data);
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
        await updateDoc(doc(db, 'vehicles', editingId), formData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'vehicles'), {
          ...formData,
          createdAt: new Date()
        });
      }
      setFormData({
        make: '',
        model: '',
        year: '',
        color: '',
        plate: '',
        vin: '',
        category: 'car',
        ownerId: '',
        ownerName: '',
        photoUrl: '',
        notes: ''
      });
      setShowForm(false);
      fetchVehicles();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr?')) {
      try {
        await deleteDoc(doc(db, 'vehicles', id));
        fetchVehicles();
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const handleEdit = (vehicle) => {
    setFormData(vehicle);
    setEditingId(vehicle.id);
    setShowForm(true);
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Gestion des Véhicules</h1>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
          <Plus size={18} />
          Ajouter un véhicule
        </button>
      </div>

      <div className="search-box">
        <Search size={18} />
        <input
          type="text"
          placeholder="Rechercher par plaque, marque ou modèle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {showForm && (
        <div className="form-container">
          <form onSubmit={handleSubmit} className="data-form">
            <div className="form-row">
              <div className="form-group">
                <label>Marque</label>
                <input type="text" value={formData.make} onChange={(e) => setFormData({...formData, make: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Modèle</label>
                <input type="text" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Année</label>
                <input type="text" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Couleur</label>
                <input type="text" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Plaque d'immatriculation</label>
                <input type="text" value={formData.plate} onChange={(e) => setFormData({...formData, plate: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Catégorie</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>VIN</label>
                <input type="text" value={formData.vin} onChange={(e) => setFormData({...formData, vin: e.target.value})} />
              </div>
              <CitizenSelect
                label="Propriétaire (registre des citoyens)"
                value={formData.ownerId}
                onChange={({ id, name }) => setFormData({ ...formData, ownerId: id, ownerName: name })}
              />
            </div>

            <div className="form-group">
              <label>Photo</label>
              <ImageUploader onImageUrlReceived={(url) => setFormData({...formData, photoUrl: url})} currentImageUrl={formData.photoUrl} />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <RichTextEditor value={formData.notes} onChange={(content) => setFormData({...formData, notes: content})} placeholder="Notes sur le véhicule..." />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">{editingId ? 'Mettre à jour' : 'Enregistrer'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="loading">Chargement...</div> : (
        <div className="vehicles-table">
          <table>
            <thead>
              <tr>
                <th>Plaque</th>
                <th>Marque</th>
                <th>Modèle</th>
                <th>Catégorie</th>
                <th>Propriétaire</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map(vehicle => (
                <tr key={vehicle.id}>
                  <td>{vehicle.plate}</td>
                  <td>{vehicle.make}</td>
                  <td>{vehicle.model}</td>
                  <td>{vehicle.category}</td>
                  <td>{vehicle.ownerId ? <Link to={`/citizens/${vehicle.ownerId}`}>{vehicle.ownerName}</Link> : (vehicle.ownerName || '—')}</td>
                  <td>
                    <button onClick={() => handleEdit(vehicle)} className="btn-icon"><Edit2 size={16} /></button>
                    {isGraded(userRole) && (
                    <button onClick={() => handleDelete(vehicle.id)} className="btn-icon btn-danger"><Trash2 size={16} /></button>
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

export default Vehicles;