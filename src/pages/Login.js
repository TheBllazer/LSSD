import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { LogIn, Shield } from 'lucide-react';
import { DEFAULT_ROLE } from '../utils/permissions';
import './Login.css';

// Code d'accès requis pour créer un compte (à définir dans .env : REACT_APP_SIGNUP_CODE).
// Objectif : éviter que n'importe qui puisse s'inscrire sur le MDT.
const SIGNUP_CODE = process.env.REACT_APP_SIGNUP_CODE;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSignUp && SIGNUP_CODE && accessCode !== SIGNUP_CODE) {
      setError("Code d'accès invalide.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          role: DEFAULT_ROLE,
          createdAt: new Date(),
          active: true,
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <Shield size={40} className="shield-icon" />
          <h1>LSSD MDT</h1>
          <p>Mobile Data Terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="accessCode">Code d'accès LSSD</label>
              <input
                id="accessCode"
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Fourni par un gradé"
                required
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Chargement...' : (
              <>
                <LogIn size={18} />
                {isSignUp ? 'Créer un compte' : 'Se connecter'}
              </>
            )}
          </button>
        </form>

        <div className="login-toggle">
          <p>
            {isSignUp ? 'Déjà un compte?' : 'Pas de compte?'}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="toggle-btn"
            >
              {isSignUp ? 'Se connecter' : "S'inscrire"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
