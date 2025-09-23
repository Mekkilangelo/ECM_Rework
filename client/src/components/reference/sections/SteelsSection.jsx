// src/components/reference/SteelsSection.jsx
import React, { useState, useEffect } from 'react';
import { Tab, Nav, Table, Button, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import EnumTableContent from '../EnumTableContent';
import SteelList from '../../dashboard/steels/list/SteelList';

const SteelsSection = () => {
  const [activePill, setActivePill] = useState('grades');
  const { t } = useTranslation();

  return (
    <Tab.Container activeKey={activePill} onSelect={setActivePill}>
      <Nav variant="pills" className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="grades">{t('references.steels.grades')}</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="standard">{t('references.steels.standard')}</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="family">{t('references.steels.family')}</Nav.Link>
        </Nav.Item>
      </Nav>
      <Tab.Content>
        <Tab.Pane eventKey="grades">
          <SteelList />
        </Tab.Pane>
        <Tab.Pane eventKey="standard">
          <Card>
            <Card.Body>
              <EnumTableContent table="steels" column="standard" />
            </Card.Body>
          </Card>
        </Tab.Pane>
        <Tab.Pane eventKey="family">
          <Card>
            <Card.Body>
              <EnumTableContent table="steels" column="family" />
            </Card.Body>
          </Card>
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
  );
};

export default SteelsSection;
