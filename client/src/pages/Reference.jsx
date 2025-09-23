// src/pages/Reference.jsx
import { useState } from 'react';
import { Tab, Nav, Container, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIndustry, faFire, faCogs, faRuler, faToolbox } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import SteelsSection from '../components/reference/sections/SteelsSection';
import FurnacesSection from '../components/reference/sections/FurnacesSection';
import PartsSection from '../components/reference/sections/PartsSection';
import UnitsSection from '../components/reference/sections/UnitsSection';
import ProcessSection from '../components/reference/sections/ProcessSection';
import Layout from '../components/layout/Layout';
import { NavigationProvider } from '../context/NavigationContext';

const ReferenceContent = () => {
  const [activeTab, setActiveTab] = useState('steels');
  const { t } = useTranslation();

  return (
    <Layout>
        <Container fluid>
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
            <h1 className="h3 mb-0 text-gray-800">{t('references.title')}</h1>
        </div>

        <Card className="shadow mb-4">
            <Card.Body>
            <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                <Nav variant="tabs" id="mainTabs">
                <Nav.Item>
                    <Nav.Link eventKey="steels">
                    <FontAwesomeIcon icon={faIndustry} className="mr-2" />
                    {t('references.tabs.steels')}
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="furnaces">
                    <FontAwesomeIcon icon={faFire} className="mr-2" />
                    {t('references.tabs.furnaces')}
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="parts">
                    <FontAwesomeIcon icon={faCogs} className="mr-2" />
                    {t('references.tabs.parts')}
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="units">
                    <FontAwesomeIcon icon={faRuler} className="mr-2" />
                    {t('references.tabs.units')}
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="process">
                    <FontAwesomeIcon icon={faToolbox} className="mr-2" />
                    {t('references.tabs.process')}
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
                
                <Tab.Pane eventKey="process">
                    <ProcessSection />
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
