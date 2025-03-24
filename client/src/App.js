import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import 'bootstrap/dist/css/bootstrap.min.css';

import './styles/sb-admin-2.min.css';

import './styles/chatbot.css';
import './styles/sidebar.css';

// Pages/Composants
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reference from './pages/Reference';
import { AuthProvider, useAuth } from './context/AuthContext';

// Composant pour protéger les routes privées
const PrivateRoute = ({ children }) => {
  // Utilisez le hook useAuth au lieu de vérifier directement localStorage
  const { isAuthenticated, loading } = useAuth();
  
  // Afficher un loader pendant la vérification de l'authentification
  if (loading) {
    return <div className="d-flex justify-content-center mt-5">
      <div className="spinner-border" role="status">
        <span className="sr-only">Chargement...</span>
      </div>
    </div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login?error=session_expired" replace />;
  }
  
  return children;
};

// Wrapper pour utiliser useAuth dans les routes
const PrivateRouteWrapper = ({ children }) => {
  return (
    <AuthProvider>
      <PrivateRouteComponent>{children}</PrivateRouteComponent>
    </AuthProvider>
  );
};

const PrivateRouteComponent = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="d-flex justify-content-center mt-5">
      <div className="spinner-border" role="status">
        <span className="sr-only">Chargement...</span>
      </div>
    </div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login?error=session_expired" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<Login />} />
          
          {/* Routes protégées */}
          <Route 
            path="/" 
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
          
          {/* Route par défaut - redirection vers login si non authentifié */}
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
    </AuthProvider>
  );
}

export default App;