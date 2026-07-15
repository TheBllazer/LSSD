import React, { useState, useEffect } from 'react';
import './StatusBar.css';

// Barre de statut système, fixe en haut de l'écran — reproduit le type
// d'en-tête qu'on trouve sur un vrai terminal de dispatch/records :
// horloge en direct, agent connecté à la console, état de la connexion.
function StatusBar({ user, userRole }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <svg className="status-bar-star" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 1.5l2.6 6.2 6.7.5-5.1 4.4 1.6 6.6L12 15.8l-5.8 3.4 1.6-6.6-5.1-4.4 6.7-.5z" />
        </svg>
        <span className="status-bar-id">LSSD // MDT-7</span>
        <span className="status-bar-sep">|</span>
        <span className="status-bar-classified">USAGE INTERNE</span>
      </div>
      <div className="status-bar-right">
        <span className="status-bar-agent">{userRole?.toUpperCase() || 'AGENT'} · {user?.email}</span>
        <span className="status-bar-sep">|</span>
        <span className="status-bar-datetime mono">{date} — {time}</span>
        <span className="status-bar-sep">|</span>
        <span className="status-pill">
          <span className="status-dot" />
          SYSTÈME EN LIGNE
        </span>
      </div>
    </div>
  );
}

export default StatusBar;
