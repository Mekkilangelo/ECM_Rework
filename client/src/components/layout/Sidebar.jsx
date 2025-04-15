import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome, faUsers, faDatabase, faLayerGroup,
  faEraser, faChartLine, faUniversity, faBook,
  faTicketAlt, faSearch
} from '@fortawesome/free-solid-svg-icons';
// Ne pas importer les icônes qui causent des problèmes
// import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';

// Importer les styles de FontAwesome dans le CSS global
import '@fortawesome/fontawesome-free/css/all.min.css';
import Select from 'react-select';
import { useTranslation } from 'react-i18next';
import { cleanData } from '../../services/nodeService';
import { toast } from 'react-toastify';
import '../../styles/sidebar.css';
import { AuthContext } from '../../context/AuthContext';

const Sidebar = ({ userRole }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [allClients, setAllClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isToggled, setIsToggled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useContext(AuthContext);

  // Check if user is superuser
  const isSuperUser = user.role === "superuser";

  // Fonction pour gérer le nettoyage des données
  const handleDataCleaning = async (e) => {
    e.preventDefault();
    // Confirmation avant suppression
    const isConfirmed = window.confirm(
      t('sidebar.dataCleaning.confirmMessage')
    );
    if (!isConfirmed) return;

    try {
      setIsLoading(true);
      // Appel de l'API pour nettoyer les données
      const result = await cleanData();
      // Afficher un message de succès
      toast.success(result.message || t('sidebar.dataCleaning.success'));
      // Attendre 2 secondes avant de recharger la page
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      // Afficher un message d'erreur
      toast.error(error.message || t('sidebar.dataCleaning.error'));
      setIsLoading(false);
    }
  };

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
      <a className="navbar-brand d-flex justify-content-center align-items-center py-4" href="/">
        <img className="img-fluid" src="/images/logoECM.png" alt="Logo ECM GROUP" width="140" height="60" />
      </a>
      <hr className="border-secondary mx-3" />

      {/* Dashboard - visible to all users */}
      <li className="nav-item">
        <Link
          className={`nav-link d-flex align-items-center px-3 ${isHomePage ? 'active' : ''}`}
          to="/"
        >
          <FontAwesomeIcon icon={faHome} className="fa-fw mr-2" />
          <span>{t('sidebar.dashboard')}</span>
        </Link>
      </li>
      <hr className="border-secondary mx-3" />

      {/* Data Management Section - only visible for superuser */}
      {isSuperUser && (
        <>
          <h6 className="sidebar-heading text-uppercase text-white-50 px-3 mt-1 mb-2">{t('sidebar.dataManagement.title')}</h6>
          <li className="nav-item">
            <Link
              className={`nav-link d-flex align-items-center px-3 ${location.pathname === '/data-pump' ? 'active' : ''}`}
              to="/data-pump"
            >
              <FontAwesomeIcon icon={faDatabase} className="fa-fw mr-2" />
              <span>{t('sidebar.dataManagement.dataPump')}</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className={`nav-link d-flex align-items-center px-3 ${location.pathname === '/indexing' ? 'active' : ''}`}
              to="/indexing"
            >
              <FontAwesomeIcon icon={faLayerGroup} className="fa-fw mr-2" />
              <span>{t('sidebar.dataManagement.indexing')}</span>
            </Link>
          </li>
          <li className="nav-item">
            <a
              className="nav-link d-flex align-items-center px-3"
              href="#"
              onClick={handleDataCleaning}
              style={{ cursor: isLoading ? 'wait' : 'pointer' }}
            >
              <FontAwesomeIcon icon={faEraser} className="fa-fw mr-2" />
              <span>{isLoading ? t('sidebar.dataManagement.cleaningInProgress') : t('sidebar.dataManagement.dataCleaning')}</span>
            </a>
          </li>
          <li className="nav-item">
            <Link
              className={`nav-link d-flex align-items-center px-3 ${location.pathname === '/analysis' ? 'active' : ''}`}
              to="/analysis"
            >
              <FontAwesomeIcon icon={faChartLine} className="fa-fw mr-2" />
              <span>{t('sidebar.dataManagement.analysis')}</span>
            </Link>
          </li>
        </>
      )}

      {/* Archives Section - visible to all users */}
      <h6 className="sidebar-heading text-uppercase text-white-50 px-3 mt-4 mb-2">{t('sidebar.archivesReference.title')}</h6>
      <li className="nav-item">
        <Link
          className={`nav-link d-flex align-items-center px-3 ${location.pathname === '/archives' ? 'active' : ''}`}
          to="/archives"
        >
          <FontAwesomeIcon icon={faUniversity} className="fa-fw mr-2" />
          <span>{t('sidebar.archivesReference.archives')}</span>
        </Link>
      </li>
      <li className="nav-item">
        <Link
          className={`nav-link d-flex align-items-center px-3 ${location.pathname === '/reference' ? 'active' : ''}`}
          to="/reference"
        >
          <FontAwesomeIcon icon={faBook} className="fa-fw mr-2" />
          <span>{t('sidebar.archivesReference.reference')}</span>
        </Link>
      </li>

      {/* Support Section - only visible for superuser */}
      {isSuperUser && (
        <>
          <h6 className="sidebar-heading text-uppercase text-white-50 px-3 mt-4 mb-2">{t('sidebar.support.title')}</h6>
          <li className="nav-item mb-3">
            <Link
              className={`nav-link d-flex align-items-center px-3 ${location.pathname === '/ticket' ? 'active' : ''}`}
              to="/ticket"
            >
              <FontAwesomeIcon icon={faTicketAlt} className="fa-fw mr-2" />
              <span>{t('sidebar.support.createTicket')}</span>
            </Link>
          </li>
        </>
      )}

      {/* Sidebar Toggler - version avec HTML classique */}
      <div className="sidebar-toggler-wrapper">
        <button
          type="button"
          id="sidebarToggle"
          className="sidebar-toggle-btn"
          onClick={handleToggleSidebar}
          aria-label="Toggle Sidebar"
          style={{
            backgroundColor: '#2c3e50', // Couleur explicite
            color: 'white' // Texte blanc
          }}
        >
          <i className={isToggled ? "fas fa-angle-right" : "fas fa-angle-left"}></i>
        </button>
      </div>
    </ul>
  );
};

export default Sidebar;
