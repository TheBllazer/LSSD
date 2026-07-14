import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Search, Edit2, Shield } from 'lucide-react';
import { ROLES, canManageAgents } from '../utils/permissions';
import './Pages.css';

function Agents({ userRole }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState('');

  const canManage = canManageAgents(userRole);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAgents(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (agentId) => {
    if (!canManage) return;
    try {
      await updateDoc(doc(db, 'users', agentId), { role: editRole });
      setEditingId(null);
      fetchAgents();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Gestion des Agents</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Shield size={20} style={{ color: '#00d4ff' }} />
          <span style={{ color: '#a0a0a0' }}>{agents.length} agents actifs</span>
        </div>
      </div>

      {!canManage && (
        <p style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '10px' }}>
          Seuls les gradés (Sergent et au-dessus) peuvent modifier les grades des agents.
        </p>
      )}

      <div className="search-box">
        <Search size={18} />
        <input type="text" placeholder="Rechercher par email ou rôle..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {loading ? <div className="loading">Chargement...</div> : (
        <div className="agents-table">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Date de création</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map(agent => (
                <tr key={agent.id}>
                  <td>{agent.email}</td>
                  <td>
                    {canManage && editingId === agent.id ? (
                      <select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                        {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                      </select>
                    ) : (
                      agent.role
                    )}
                  </td>
                  <td><span className={`status-badge status-${agent.active ? 'actif' : 'inactif'}`}>{agent.active ? 'Actif' : 'Inactif'}</span></td>
                  <td>{agent.createdAt ? new Date(agent.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                  {canManage && (
                    <td>
                      {editingId === agent.id ? (
                        <>
                          <button onClick={() => handleUpdateRole(agent.id)} className="btn-primary" style={{ padding: '5px 10px', fontSize: '12px' }}>Sauvegarder</button>
                          <button onClick={() => setEditingId(null)} className="btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }}>Annuler</button>
                        </>
                      ) : (
                        <button onClick={() => { setEditingId(agent.id); setEditRole(agent.role); }} className="btn-icon"><Edit2 size={16} /></button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Agents;
