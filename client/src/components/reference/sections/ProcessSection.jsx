// src/components/reference/ProcessSection.jsx
import React, { useState } from 'react';
import { Tab, Nav, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import EnumTableContent from '../EnumTableContent';

const ProcessSection = () => {
  const [activePill, setActivePill] = useState('mounting_type');
  const { t } = useTranslation();

  return (
    <Tab.Container activeKey={activePill} onSelect={setActivePill}>
      <Nav variant="pills" className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="mounting_type">{t('references.process.mounting_type')}</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="position_type">{t('references.process.position_type')}</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="process_type">{t('references.process.process_type')}</Nav.Link>
        </Nav.Item>
      </Nav>

      <Tab.Content>
        <Tab.Pane eventKey="mounting_type">
          <Card>
            <Card.Body>
              <EnumTableContent table="tests" column="mounting_type" />
            </Card.Body>
          </Card>
        </Tab.Pane>

        <Tab.Pane eventKey="position_type">
          <Card>
            <Card.Body>
              <EnumTableContent table="tests" column="position_type" />
            </Card.Body>
          </Card>
        </Tab.Pane>

        <Tab.Pane eventKey="process_type">
          <Card>
            <Card.Body>
              <EnumTableContent table="tests" column="process_type" />
            </Card.Body>
          </Card>
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
  );
};

export default ProcessSection;
