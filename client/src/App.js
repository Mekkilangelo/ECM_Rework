import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import 'bootstrap/dist/css/bootstrap.min.css';

import './styles/sb-admin-2.min.css';
import './styles/custom-overrides.css'; // Ajouté pour corriger l'avertissement color-adjust
import './styles/darkTheme.css'; // Import des styles du thème sombre

import './styles/chatbot.css';
import './styles/sidebar.css';

import { useTranslation } from 'react-i18next'; 

// Pages/Composants
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reference from './pages/Reference';
import Archives from './pages/Archives';  
import UserManagement from './pages/UserManagement';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Composant de chargement pour Suspense
const LoadingFallback = () => (
  <div className="d-flex justify-content-center mt-5">
    <div className="spinner-border text-primary" role="status">
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);

const PrivateRouteComponent = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useTranslation();
  
  if (loading) {
    return <div className="d-flex justify-content-center mt-5">
      <div className="spinner-border" role="status">
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    </div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <BrowserRouter>
            <Routes>
              {/* Routes publiques */}
              <Route path="/login" element={<Login />} />
              
              {/* Routes protégées */}
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRouteComponent>
                    <Dashboard />
                  </PrivateRouteComponent>
                } 
              />

              <Route 
                path="/reference" 
                element={
                  <PrivateRouteComponent>
                    <Reference />
                  </PrivateRouteComponent>
                } 
              />

              <Route 
                path="/archives" 
                element={
                  <PrivateRouteComponent>
                    <Archives />
                  </PrivateRouteComponent>
                } 
              />
              
              {/* Route pour la gestion des utilisateurs */}
              <Route 
                path="/users" 
                element={
                  <PrivateRouteComponent>
                    <UserManagement />
                  </PrivateRouteComponent>
                } 
              />
              
              {/* Route par défaut - redirection vers login */}
              <Route 
                path="/" 
                element={<Navigate to="/login" replace />} 
              />
              
              {/* Toute autre route non définie */}
              <Route 
                path="*" 
                element={<Navigate to="/login" replace />} 
              />
            </Routes>

            {/* ToastContainer pour afficher les notifications */}
            <ToastContainer 
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
            
          </BrowserRouter>
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;