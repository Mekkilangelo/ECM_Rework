// src/pages/Reference.jsx
import React, { useState } from 'react';
import { Tab, Nav, Container, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIndustry, faFire, faCogs, faRuler } from '@fortawesome/free-solid-svg-icons';
import SteelsSection from '../components/reference/sections/SteelsSection';
import FurnacesSection from '../components/reference/sections/FurnacesSection';
import PartsSection from '../components/reference/sections/PartsSection';
import UnitsSection from '../components/reference/sections/UnitsSection';
import Layout from '../components/layout/Layout';
import { NavigationProvider } from '../context/NavigationContext';

const ReferenceContent = () => {
  const [activeTab, setActiveTab] = useState('steels');

  return (
    <Layout>
        <Container fluid>
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
            <h1 className="h3 mb-0 text-gray-800">Referencing Management</h1>
        </div>

        <Card className="shadow mb-4">
            <Card.Body>
            <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                <Nav variant="tabs" id="mainTabs">
                <Nav.Item>
                    <Nav.Link eventKey="steels">
                    <FontAwesomeIcon icon={faIndustry} className="mr-2" />
                    Steels
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="furnaces">
                    <FontAwesomeIcon icon={faFire} className="mr-2" />
                    Furnaces
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="parts">
                    <FontAwesomeIcon icon={faCogs} className="mr-2" />
                    Parts
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="units">
                    <FontAwesomeIcon icon={faRuler} className="mr-2" />
                    Units
                    </Nav.Link>
                </Nav.Item>
                </Nav>

                <Tab.Content className="mt-3">
                <Tab.Pane eventKey="steels">
                    <SteelsSection />
                </Tab.Pane>
                
                <Tab.Pane eventKey="furnaces">
                    <FurnacesSection />
                </Tab.Pane>
                
                <Tab.Pane eventKey="parts">
                    <PartsSection />
                </Tab.Pane>
                
                <Tab.Pane eventKey="units">
                    <UnitsSection />
                </Tab.Pane>
                </Tab.Content>
            </Tab.Container>
            </Card.Body>
        </Card>
        </Container>
    </Layout>
  );
};

// Composant wrapper qui fournit le contexte
const Reference = () => {
  return (
    <NavigationProvider>
      <ReferenceContent/>
    </NavigationProvider>
  );
};

export default Reference;
