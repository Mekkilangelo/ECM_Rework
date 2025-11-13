import React from 'react';
import { createRoot } from 'react-dom/client';
import './locales/i18n'; // Importez i18n avant tout
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
      setTimeout(() => {
        window.location.replace('/login?error=session_expired');
      }, 100);
    }
    return Promise.reject(error);
  }
);

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <React.Suspense fallback={
        <div className="d-flex justify-content-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      }>
        <App />
      </React.Suspense>
    </AuthProvider>
  </React.StrictMode>
);