import React from 'react';
import Header from './header/Header';
import Footer from './footer/Footer';
import Sidebar from './sidebar/Sidebar';
import Chatbot from './chatbot/Chatbot';

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