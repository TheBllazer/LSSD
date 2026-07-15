import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Menu, X, LogOut, Home, Users, Truck, Crosshair, FileText, Search, AlertTriangle, Scale, Lock } from 'lucide-react';
import { isGraded } from '../utils/permissions';
import NotificationBell from './NotificationBell';
import badgeIcon from '../assets/icons/badge.svg';
import './Navigation.css';

// Icône "Agents" : asset perso fourni par toi (src/assets/icons/badge.svg).
// Remplace ce fichier par ton propre visuel, le composant n'a rien à changer.
const AgentsIcon = ({ size = 18 }) => (
  <img src={badgeIcon} alt="" width={size} height={size} className="nav-custom-icon" />
);

function Navigation({ user, userRole }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const graded = isGraded(userRole);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
    { name: 'Tableau de bord', path: '/dashboard', icon: Home },
    { name: 'Citoyens', path: '/citizens', icon: Users },
    { name: 'Véhicules', path: '/vehicles', icon: Truck },
    { name: 'Armes', path: '/weapons', icon: Crosshair },
    { name: 'Rapports', path: '/reports', icon: FileText },
    { name: 'Casier judiciaire', path: '/criminal-record', icon: Scale },
    { name: "Rapports d'arrestation", path: '/arrest-reports', icon: Lock },
    { name: 'Agents', path: '/agents', icon: AgentsIcon },
    { name: 'Enquêtes', path: '/investigations', icon: Search },
    { name: 'Groupes illégaux', path: '/gangs', icon: AlertTriangle },
  ];

  return (
    <>
      <nav className="navigation">
        <div className="nav-header">
          <div className="nav-brand">
            <svg className="nav-star" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 1.5l2.6 6.2 6.7.5-5.1 4.4 1.6 6.6L12 15.8l-5.8 3.4 1.6-6.6-5.1-4.4 6.7-.5z" />
            </svg>
            <h1 className="nav-title">LSSD MDT</h1>
          </div>
          <div className="nav-header-actions">
            {graded && <NotificationBell />}
            <button className="hamburger" onClick={toggleMenu}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink to={item.path} onClick={() => setIsOpen(false)}>
                  <Icon size={18} />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="nav-footer">
          <div className="user-info">
            <p className="user-name">{user?.email}</p>
            <p className="user-role">{userRole || 'Agent'}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Déconnexion">
            <LogOut size={20} />
          </button>
        </div>
      </nav>
    </>
  );
}

export default Navigation;
