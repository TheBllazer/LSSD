import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Search, Download, Check, X as XIcon } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import CitizenSelect from '../components/CitizenSelect';
import { generatePDF } from '../utils/pdfGenerator';
import { createGradedNotification } from '../utils/notifications';
import { canValidateReports, canEditReport, canDeleteReport } from '../utils/permissions';
import './Pages.css';

const emptyForm = {
  reportNumber: '',
  date: new Date().toISOString().split('T')[0],
  officer: '',
  type: 'Incident',
  suspectId: '',
  suspectName: '',
  details: '',
  location: '',
  status: 'Ouvert',
  validationStatus: 'En attente',
};

function Reports({ user, userRole }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const reportTypes = ['Incident', 'Infraction', 'Vol', 'Accident', 'Plainte', 'Enquête'];
  const statuses = ['Ouvert', 'En cours', 'Clôturé', 'Archivé'];
  const canValidate = canValidateReports(userRole);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const q = query(collection(db, 'reports'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(data);
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
        await updateDoc(doc(db, 'reports', editingId), formData);
        setEditingId(null);
      } else {
        const docRef = await addDoc(collection(db, 'reports'), {
          ...formData,
          authorId: user?.uid || null,
          createdAt: new Date(),
        });
        await createGradedNotification({
          type: 'report_pending',
          message: `Nouveau rapport #${formData.reportNumber || docRef.id} en attente de validation`,
          link: '/reports',
        });
      }
      setFormData(emptyForm);
      setShowForm(false);
      fetchReports();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!canDeleteReport(userRole)) return;
    if (window.confirm('Êtes-vous sûr?')) {
      try {
        await deleteDoc(doc(db, 'reports', id));
        fetchReports();
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const handleEdit = (report) => {
    if (!canEditReport(userRole, report, user?.uid)) return;
    setFormData({ ...emptyForm, ...report });
    setEditingId(report.id);
    setShowForm(true);
  };

  const handleValidation = async (report, validationStatus) => {
    if (!canValidate) return;
    try {
      await updateDoc(doc(db, 'reports', report.id), { validationStatus });
      fetchReports();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleExportPDF = (report) => {
    generatePDF(report);
  };

  const filteredReports = reports.filter(report =>
    report.reportNumber?.includes(searchTerm) ||
    report.suspectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.officer?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Gestion des Rapports</h1>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData(emptyForm); }}>
          <Plus size={18} />
          Nouveau rapport
        </button>
      </div>

      <div className="search-box">
        <Search size={18} />
        <input type="text" placeholder="Rechercher par numéro, suspect ou agent..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {showForm && (
        <div className="form-container">
          <form onSubmit={handleSubmit} className="data-form">
            <div className="form-row">
              <div className="form-group">
                <label>Numéro du rapport</label>
                <input type="text" value={formData.reportNumber} onChange={(e) => setFormData({...formData, reportNumber: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Agent</label>
                <input type="text" value={formData.officer} onChange={(e) => setFormData({...formData, officer: e.target.value})} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} required>
                  {reportTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Statut</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} required>
                  {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
            </div>

            <CitizenSelect
              label="Suspect (registre des citoyens)"
              value={formData.suspectId}
              onChange={({ id, name }) => setFormData({ ...formData, suspectId: id, suspectName: name })}
            />

            <div className="form-group">
              <label>Lieu</label>
              <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Détails</label>
              <RichTextEditor value={formData.details} onChange={(content) => setFormData({...formData, details: content})} placeholder="Détails du rapport..." />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">{editingId ? 'Mettre à jour' : 'Créer'}</button>
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
                <th>N° Rapport</th>
                <th>Date</th>
                <th>Agent</th>
                <th>Type</th>
                <th>Suspect</th>
                <th>Statut</th>
                <th>Validation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => (
                <tr key={report.id}>
                  <td>{report.reportNumber}</td>
                  <td>{report.date}</td>
                  <td>{report.officer}</td>
                  <td><span className="badge">{report.type}</span></td>
                  <td>{report.suspectId ? <Link to={`/citizens/${report.suspectId}`}>{report.suspectName}</Link> : (report.suspectName || '—')}</td>
                  <td><span className={`status-badge status-${report.status?.toLowerCase()}`}>{report.status}</span></td>
                  <td>
                    <span className={`status-badge status-${report.validationStatus === 'Validé' ? 'actif' : report.validationStatus === 'Refusé' ? 'inactif' : 'attente'}`}>
                      {report.validationStatus || 'En attente'}
                    </span>
                    {canValidate && report.validationStatus !== 'Validé' && (
                      <button onClick={() => handleValidation(report, 'Validé')} className="btn-icon" title="Valider"><Check size={16} /></button>
                    )}
                    {canValidate && report.validationStatus !== 'Refusé' && (
                      <button onClick={() => handleValidation(report, 'Refusé')} className="btn-icon btn-danger" title="Refuser"><XIcon size={16} /></button>
                    )}
                  </td>
                  <td>
                    <button onClick={() => handleExportPDF(report)} className="btn-icon" title="Exporter en PDF"><Download size={16} /></button>
                    {canEditReport(userRole, report, user?.uid) && (
                      <button onClick={() => handleEdit(report)} className="btn-icon"><Edit2 size={16} /></button>
                    )}
                    {canDeleteReport(userRole) && (
                      <button onClick={() => handleDelete(report.id)} className="btn-icon btn-danger"><Trash2 size={16} /></button>
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

export default Reports;
