import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faBars, 
  faSignOutAlt,
  faUser,
  faLock,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../language_switch/LanguageSwitcher'; // Importez le composant personnalisé
import ThemeToggle from '../../common/ThemeToggle/ThemeToggle'; // Import du composant ThemeToggle
import ChangePasswordModal from '../../common/ChangePasswordModal/ChangePasswordModal';
import '../../../styles/header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    // Rediriger vers la page de recherche avec le terme de recherche
    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    
    // Réinitialiser le formulaire mobile si ouvert
    const mobileForm = document.getElementById('mobileSearchForm');
    if (mobileForm && !mobileForm.classList.contains('d-none')) {
      mobileForm.classList.add('d-none');
    }
  };

  // Format the user initials for the avatar if no profile image
  const getUserInitials = () => {
    if (!user?.username) return 'U';
    return user.username.split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('').substring(0, 2);
  };

  return (
    <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
      {/* Sidebar Toggle (Topbar) - Mobile */}
      <button id="sidebarToggleTop" className="btn btn-link d-md-none rounded-circle mr-3">
        <FontAwesomeIcon icon={faBars} />
      </button>
      
      {/* Topbar Search */}
      <form 
        className="d-none d-sm-inline-block form-inline mr-auto ml-md-3 my-2 my-md-0 mw-100 navbar-search"
        onSubmit={handleSearch}
      >
        <div className="input-group">
          <input 
            type="text" 
            className="form-control bg-light border-0 small" 
            placeholder={t('search.placeholder')}
            aria-label="Search" 
            aria-describedby="basic-addon2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="input-group-append">
            <button className="btn btn-danger" type="submit">
              <FontAwesomeIcon icon={faSearch} size="sm" />
            </button>
          </div>
        </div>
      </form>
      
      {/* Topbar Navbar */}
      <ul className="navbar-nav ml-auto">
        {/* Nav Item - Search Dropdown (Only Visible in Mobile) */}
        <li className="nav-item dropdown no-arrow d-sm-none">
          <a 
            className="nav-link" 
            href="#" 
            id="searchDropdown" 
            role="button" 
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('mobileSearchForm').classList.toggle('d-none');
            }}
          >
            <FontAwesomeIcon icon={faSearch} />
          </a>
          <div 
            className="dropdown-menu dropdown-menu-right p-3 shadow animated--grow-in d-none" 
            id="mobileSearchForm"
          >
            <form className="form-inline mr-auto w-100 navbar-search" onSubmit={handleSearch}>
              <div className="input-group">
                <input 
                  type="text" 
                  className="form-control bg-light border-0 small" 
                  placeholder={t('search.placeholder')}
                  aria-label="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="input-group-append">
                  <button className="btn btn-danger" type="submit">
                    <FontAwesomeIcon icon={faSearch} size="sm" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </li>

        {/* Language Switcher - Utilisez le composant personnalisé */}
        <LanguageSwitcher />

        {/* Theme Toggle Button */}
        <li className="nav-item">
          <ThemeToggle />
        </li>

        <div className="topbar-divider d-none d-sm-block"></div>

        {/* User Dropdown */}
        <li className="nav-item dropdown no-arrow">
          <Dropdown>
            <Dropdown.Toggle 
              as="button"
              className="btn btn-link nav-link d-flex align-items-center"
              id="userDropdown"
            >
              <span className="text-gray-600 small mr-2 username-display d-none d-lg-inline">
                {user?.username || t('common.user')}
              </span>
              <div className="user-avatar mr-2">
                {user?.profileImage ? (
                  <img 
                    className="img-profile rounded-circle" 
                    src={user.profileImage}
                    alt={user.username}
                  />
                ) : (
                  <div className="img-profile rounded-circle bg-danger text-white d-flex align-items-center justify-content-center">
                    {getUserInitials()}
                  </div>
                )}
              </div>
              <FontAwesomeIcon icon={faChevronDown} className="text-muted" size="sm" />
            </Dropdown.Toggle>

            <Dropdown.Menu align="end" className="shadow animated--grow-in">
              <Dropdown.Header>
                <FontAwesomeIcon icon={faUser} className="me-2" />
                {user?.username || t('common.user')}
              </Dropdown.Header>
              
              <Dropdown.Divider />
              
              <Dropdown.Item onClick={() => setShowChangePasswordModal(true)}>
                <FontAwesomeIcon icon={faLock} className="me-2" />
                {t('auth.changePassword.title')}
              </Dropdown.Item>
              
              <Dropdown.Divider />
              
              <Dropdown.Item onClick={logout} className="text-danger">
                <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                {t('auth.logout')}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </li>
      </ul>

      {/* Modal de changement de mot de passe */}
      <ChangePasswordModal
        show={showChangePasswordModal}
        onHide={() => setShowChangePasswordModal(false)}
        onSuccess={() => {
          // Optionnel: Afficher un toast de succès ou autre action
          
        }}
      />
    </nav>
  );
};

export default Header;