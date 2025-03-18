import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import axios from 'axios';
import { AuthProvider } from './context/AuthContext';

// Configuration globale d'axios pour ajouter le token d'authentification à toutes les requêtes
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Intercepteur pour gérer les erreurs d'authentification (401)
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?error=session_expired';
    }
    return Promise.reject(error);
  }
);

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);