import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
      <form className="form-inline">
        <button id="sidebarToggleTop" className="btn btn-link d-md-none rounded-circle mr-3">
          <i className="fa fa-bars"></i>
        </button>
      </form>
      
      <form className="d-none d-sm-inline-block form-inline mr-auto ml-md-3 my-2 my-md-0 mw-100 navbar-search">
        <div className="input-group">
          <input 
            type="text" 
            className="form-control bg-light border-0 small" 
            placeholder="Search for..."
            aria-label="Search" 
            aria-describedby="basic-addon2"
          />
          <div className="input-group-append">
            <button className="btn btn-dark" type="button">
              <i className="fas fa-search fa-sm"></i>
            </button>
          </div>
        </div>
      </form>
      
      <ul className="navbar-nav ml-auto">
        <li className="nav-item">
          <span className="nav-link text-gray-600 small">{user?.username}</span>
        </li>
        <li className="nav-item">
          <button 
            className="nav-link text-gray-600 small" 
            onClick={logout} 
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <i className="fas fa-sign-out-alt fa-sm fa-fw text-gray-400"></i>
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Header;