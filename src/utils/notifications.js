import { db } from '../firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from 'firebase/firestore';

// --- Toast visuel local (feedback immédiat sur l'action en cours) ---
export const showNotification = (message, type = 'info', duration = 3000) => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === 'success' ? '#6FA050' : type === 'error' ? '#A33B2E' : '#C9A227'};
    color: ${type === 'success' ? '#0A0E1A' : type === 'error' ? '#F5F0E4' : '#0A0E1A'};
    padding: 15px 20px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, duration);
};

export const showConfirmDialog = (message) => {
  return new Promise((resolve) => {
    const confirmed = window.confirm(message);
    resolve(confirmed);
  });
};

// --- Notifications persistantes (collection Firestore "notifications") ---
// Utilisées pour prévenir les gradés qu'un rapport attend validation.
// Doc shape: { targetGraded: true, type, message, link, read: false, createdAt }

export const createGradedNotification = ({ type, message, link }) => {
  return addDoc(collection(db, 'notifications'), {
    targetGraded: true,
    type,
    message,
    link,
    read: false,
    createdAt: new Date(),
  });
};

// S'abonne aux notifications non lues destinées aux gradés.
// Retourne la fonction de désabonnement (à appeler dans le cleanup d'un useEffect).
export const subscribeToGradedNotifications = (callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('targetGraded', '==', true),
    where('read', '==', false),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
};

export const markNotificationRead = (id) => {
  return updateDoc(doc(db, 'notifications', id), { read: true });
};
