// src/components/reference/PartsSection.jsx
import React, { useState } from 'react';
import { Tab, Nav, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import EnumTableContent from '../EnumTableContent';

const PartsSection = () => {
  const [activePill, setActivePill] = useState('designation');
  const { t } = useTranslation();

  return (
    <Tab.Container activeKey={activePill} onSelect={setActivePill}>
      <Nav variant="pills" className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="designation">{t('references.parts.designation')}</Nav.Link>
        </Nav.Item>
      </Nav>

      <Tab.Content>
        <Tab.Pane eventKey="designation">
          <Card>
            <Card.Body>
              <EnumTableContent refTable="ref_designation" />
            </Card.Body>
          </Card>
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
  );
};

export default PartsSection;
