import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome, faUsers, faBook,
  faSearch, faUserCog, faFileAlt
} from '@fortawesome/free-solid-svg-icons';
// Ne pas importer les icônes qui causent des problèmes
// import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';

// Importer les styles de FontAwesome dans le CSS global
import '@fortawesome/fontawesome-free/css/all.min.css';
import Select from 'react-select';
import { useTranslation } from 'react-i18next';
import '../../../styles/sidebar.css';
import '../../../styles/menu-separator.css';
import { AuthContext } from '../../../context/AuthContext';

const Sidebar = ({ userRole }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [allClients, setAllClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isToggled, setIsToggled] = useState(false);
  const { user } = useContext(AuthContext);

  // Check if user is superuser or admin, with null check to prevent errors
  const isSuperUser = user && user.role === "superuser";
  const isAdmin = user && user.role === "admin";
  const canManageUsers = isSuperUser || isAdmin;

  // Correction du toggle pour réduire complètement la sidebar
  const handleToggleSidebar = () => {
    const newState = !isToggled;
    setIsToggled(newState);
    
    // Ajouter/supprimer la classe sur le body pour les transitions CSS
    if (newState) {
      document.body.classList.add('sidebar-toggled');
    } else {
      document.body.classList.remove('sidebar-toggled');
    }
  };

  // Style personnalisé pour React-Select
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'white',
      borderColor: '#d1d3e2',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(78, 115, 223, 0.25)' : null,
      borderRadius: '0.35rem',
      minHeight: '38px',
      fontSize: '0.85rem',
      '&:hover': {
        borderColor: state.isFocused ? '#bac8f3' : '#d1d3e2'
      }
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'white',
      borderRadius: '0.35rem',
      zIndex: 9999,
      boxShadow: '0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15)'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#4e73df'
        : state.isFocused
          ? '#f8f9fc'
          : null,
      color: state.isSelected ? 'white' : '#3a3b45',
      fontSize: '0.85rem',
      padding: '0.5rem 1rem',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: state.isSelected ? '#4e73df' : '#eaecf4'
      }
    }),
    input: (provided) => ({
      ...provided,
      color: '#3a3b45',
      fontSize: '0.85rem'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#3a3b45',
      fontSize: '0.85rem'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#858796',
      fontSize: '0.85rem'
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: '#858796',
      padding: '0 8px',
      '&:hover': {
        color: '#6e707e'
      }
    })
  };

  // Format personnalisé pour les composants React-Select
  const customComponents = {
    DropdownIndicator: ({ innerProps }) => {
      return (
        <div {...innerProps} style={{ padding: '0 8px' }}>
          <FontAwesomeIcon icon={faSearch} size="sm" color="#858796" />
        </div>
      );
    }
  };

  // Déterminer si on est sur la page d'accueil
  const isHomePage = location.pathname === '/';

  return (
    <ul className={`navbar-nav bg-dark sidebar ${isToggled ? 'toggled' : ''} accordion shadow`} id="accordionSidebar">
      {/* Logo */}
      <a className="navbar-brand d-flex justify-content-center align-items-center py-4" href="/dashboard">
        <img className="img-fluid" src="/images/logoECM.png" alt="Logo ECM GROUP" width="140" height="60" />
      </a>
      <hr className="border-secondary mx-3" />
      <div className="py-2"></div> {/* Espace supplémentaire */}

      {/* Navigation items - All items in a single flow with elegant separators */}
      {/* Dashboard - visible to all users */}
      <div className="menu-item-container">
        <li className="nav-item">
          <Link
            className={`nav-link d-flex align-items-center px-3 ${isHomePage || location.pathname === '/dashboard' ? 'active' : ''}`}
            to="/dashboard"
          >
            <FontAwesomeIcon icon={faHome} className="fa-fw mr-3" />
            <span>{t('sidebar.dashboard')}</span>
          </Link>
        </li>
      </div>
      
      {/* Search - visible to all users */}
      <div className="menu-item-container">
        <li className="nav-item">
          <Link
            className={`nav-link d-flex align-items-center px-3 ${location.pathname === '/search' ? 'active' : ''}`}
            to="/search"
          >
            <FontAwesomeIcon icon={faSearch} className="fa-fw mr-3" />
            <span>{t('sidebar.search')}</span>
          </Link>
        </li>
      </div>

      {/* Reference - visible to all users */}
      <div className="menu-item-container">
        <li className="nav-item">
          <Link
            className={`nav-link d-flex align-items-center px-3 ${location.pathname === '/reference' ? 'active' : ''}`}
            to="/reference"
          >
            <FontAwesomeIcon icon={faBook} className="fa-fw mr-3" />
            <span>{t('sidebar.archivesReference.reference')}</span>
          </Link>
        </li>
      </div>
      
      {/* Admin section - conditionally rendered */}
      {canManageUsers && (
        <>
          {/* Extra space between user and admin sections with enhanced separator */}
          <div className="admin-section-space">
            <div className="admin-section-label">Admin</div>
          </div>
          
          {/* User Management - only visible for admin and superuser */}
          <div className="menu-item-container">
            <li className="nav-item">
              <Link
                className={`nav-link d-flex align-items-center px-3 ${location.pathname === '/users' ? 'active' : ''}`}
                to="/users"
              >
                <FontAwesomeIcon icon={faUserCog} className="fa-fw mr-3" />
                <span>{t('sidebar.userManagement.manageUsers')}</span>
              </Link>
            </li>
          </div>

          {/* Logs - only visible for admin and superuser */}
          <div className="menu-item-container">
            <li className="nav-item">
              <Link
                className={`nav-link d-flex align-items-center px-3 ${location.pathname === '/logs' ? 'active' : ''}`}
                to="/logs"
              >
                <FontAwesomeIcon icon={faFileAlt} className="fa-fw mr-3" />
                <span>{t('sidebar.logs.logs')}</span>
              </Link>
            </li>
          </div>
        </>
      )}

      {/* Extra space before the toggler */}
      <div className="mt-4"></div>

      {/* Sidebar Toggler - version améliorée */}
      <div className="sidebar-toggler-wrapper mt-auto">
        <button
          type="button"
          id="sidebarToggle"
          className="sidebar-toggle-btn shadow-sm"
          onClick={handleToggleSidebar}
          aria-label="Toggle Sidebar"
          style={{
            backgroundColor: '#1e2b38', // Couleur plus sombre
            color: '#ffc107', // Jaune pour plus de visibilité
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'all 0.2s'
          }}
        >
          <i className={isToggled ? "fas fa-angle-right" : "fas fa-angle-left"}></i>
        </button>
      </div>
    </ul>
  );
};

export default Sidebar;
