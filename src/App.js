import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './App.css';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Citizens from './pages/Citizens';
import Vehicles from './pages/Vehicles';
import Weapons from './pages/Weapons';
import Reports from './pages/Reports';
import Agents from './pages/Agents';
import Investigations from './pages/Investigations';
import GangGroups from './pages/GangGroups';
import CriminalRecord from './pages/CriminalRecord';
import ArrestReports from './pages/ArrestReports';
import CitizenProfile from './pages/CitizenProfile';

// Components
import Navigation from './components/Navigation';
import StatusBar from './components/StatusBar';
import Loading from './components/Loading';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Récupère le rôle de l'utilisateur depuis Firestore
        try {
          const { db } = await import('./firebase');
          const { doc, getDoc } = await import('firebase/firestore');
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du rôle:', error);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <Router>
      {user ? (
        <div className="app-container">
          <Navigation user={user} userRole={userRole} />
          <StatusBar user={user} userRole={userRole} />
          <main className="main-content">
            <Routes>
              <Route path="/dashboard" element={<Dashboard user={user} userRole={userRole} />} />
              <Route path="/citizens" element={<Citizens user={user} userRole={userRole} />} />
              <Route path="/citizens/:id" element={<CitizenProfile user={user} userRole={userRole} />} />
              <Route path="/vehicles" element={<Vehicles user={user} userRole={userRole} />} />
              <Route path="/weapons" element={<Weapons user={user} userRole={userRole} />} />
              <Route path="/reports" element={<Reports user={user} userRole={userRole} />} />
              <Route path="/agents" element={<Agents user={user} userRole={userRole} />} />
              <Route path="/investigations" element={<Investigations user={user} userRole={userRole} />} />
              <Route path="/gangs" element={<GangGroups user={user} userRole={userRole} />} />
              <Route path="/criminal-record" element={<CriminalRecord user={user} userRole={userRole} />} />
              <Route path="/arrest-reports" element={<ArrestReports user={user} userRole={userRole} />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      ) : (
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
