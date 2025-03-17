import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import Chatbot from '../common/Chatbot/Chatbot';

const Layout = ({ children }) => {
  return (
    <div id="wrapper">
      <Sidebar />
      <div id="content-wrapper" className="d-flex flex-column">
        <div id="content">
          <Header />
          <div className="container-fluid">
            {children}
          </div>
        </div>
        <Footer />
      </div>
      <Chatbot />
    </div>
  );
};

export default Layout;