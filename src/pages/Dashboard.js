import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { Users, Truck, Crosshair, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import './Dashboard.css';

function Dashboard({ user, userRole }) {
  const [stats, setStats] = useState({
    citizens: 0,
    vehicles: 0,
    weapons: 0,
    reports: 0,
    investigations: 0,
    gangs: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const citizensSnap = await getDocs(query(collection(db, 'citizens')));
        const vehiclesSnap = await getDocs(query(collection(db, 'vehicles')));
        const weaponsSnap = await getDocs(query(collection(db, 'weapons')));
        const reportsSnap = await getDocs(query(collection(db, 'reports')));
        const investigationsSnap = await getDocs(query(collection(db, 'investigations')));
        const gangsSnap = await getDocs(query(collection(db, 'gangs')));

        setStats({
          citizens: citizensSnap.size,
          vehicles: vehiclesSnap.size,
          weapons: weaponsSnap.size,
          reports: reportsSnap.size,
          investigations: investigationsSnap.size,
          gangs: gangsSnap.size
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { icon: Users, label: 'Citoyens', value: stats.citizens, color: '#00d4ff' },
    { icon: Truck, label: 'Véhicules', value: stats.vehicles, color: '#00ff88' },
    { icon: Crosshair, label: 'Armes', value: stats.weapons, color: '#ff6b6b' },
    { icon: FileText, label: 'Rapports', value: stats.reports, color: '#ffd93d' },
    { icon: AlertTriangle, label: 'Enquêtes', value: stats.investigations, color: '#ff9d00' },
    { icon: AlertTriangle, label: 'Groupes illégaux', value: stats.gangs, color: '#ff3333' }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Tableau de bord LSSD</h1>
        <p>Bienvenue {user?.email} - {userRole || 'Agent'}</p>
      </div>

      {loading ? (
        <div className="loading-message">Chargement des statistiques...</div>
      ) : (
        <div className="stats-grid">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="stat-card" style={{ '--accent-color': stat.color }}>
                <div className="stat-icon" style={{ color: stat.color }}>
                  <Icon size={32} />
                </div>
                <div className="stat-info">
                  <p className="stat-label">{stat.label}</p>
                  <p className="stat-value">{stat.value}</p>
                </div>
                <div className="stat-trend">
                  <TrendingUp size={16} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="dashboard-info">
        <div className="info-box">
          <h2>À propos du MDT</h2>
          <p>
            Mobile Data Terminal est un système intégré de gestion pour le LSSD.
            Il permet de centraliser toutes les informations relatives aux citoyens, véhicules, armes,
            rapports d'intervention, enquêtes et groupes illégaux.
          </p>
        </div>

        <div className="info-box">
          <h2>Rôle actuel</h2>
          <p>
            Votre rôle: <strong>{userRole || 'Agent'}</strong>
          </p>
          <p>
            Accédez aux modules correspondant à vos permissions via le menu latéral.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;