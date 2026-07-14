import { db } from '../firebase';
import { collection, addDoc, deleteDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';

// Citizens
export const addCitizen = (data) => addDoc(collection(db, 'citizens'), { ...data, createdAt: new Date() });
export const deleteCitizen = (id) => deleteDoc(doc(db, 'citizens', id));
export const updateCitizen = (id, data) => updateDoc(doc(db, 'citizens', id), data);
export const getCitizens = async () => {
  const querySnapshot = await getDocs(query(collection(db, 'citizens')));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Vehicles
export const addVehicle = (data) => addDoc(collection(db, 'vehicles'), { ...data, createdAt: new Date() });
export const deleteVehicle = (id) => deleteDoc(doc(db, 'vehicles', id));
export const updateVehicle = (id, data) => updateDoc(doc(db, 'vehicles', id), data);
export const getVehicles = async () => {
  const querySnapshot = await getDocs(query(collection(db, 'vehicles')));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Weapons
export const addWeapon = (data) => addDoc(collection(db, 'weapons'), { ...data, createdAt: new Date() });
export const deleteWeapon = (id) => deleteDoc(doc(db, 'weapons', id));
export const updateWeapon = (id, data) => updateDoc(doc(db, 'weapons', id), data);
export const getWeapons = async () => {
  const querySnapshot = await getDocs(query(collection(db, 'weapons')));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Reports
export const addReport = (data) => addDoc(collection(db, 'reports'), { ...data, createdAt: new Date() });
export const deleteReport = (id) => deleteDoc(doc(db, 'reports', id));
export const updateReport = (id, data) => updateDoc(doc(db, 'reports', id), data);
export const getReports = async () => {
  const querySnapshot = await getDocs(query(collection(db, 'reports')));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Investigations
export const addInvestigation = (data) => addDoc(collection(db, 'investigations'), { ...data, createdAt: new Date() });
export const deleteInvestigation = (id) => deleteDoc(doc(db, 'investigations', id));
export const updateInvestigation = (id, data) => updateDoc(doc(db, 'investigations', id), data);
export const getInvestigations = async () => {
  const querySnapshot = await getDocs(query(collection(db, 'investigations')));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Gangs
export const addGang = (data) => addDoc(collection(db, 'gangs'), { ...data, createdAt: new Date() });
export const deleteGang = (id) => deleteDoc(doc(db, 'gangs', id));
export const updateGang = (id, data) => updateDoc(doc(db, 'gangs', id), data);
export const getGangs = async () => {
  const querySnapshot = await getDocs(query(collection(db, 'gangs')));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Users
export const getUsers = async () => {
  const querySnapshot = await getDocs(query(collection(db, 'users')));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateUser = (id, data) => updateDoc(doc(db, 'users', id), data);
