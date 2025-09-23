// src/components/reference/FurnacesSection.jsx
import React, { useState } from 'react';
import { Tab, Nav, Button, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import EnumTableContent from '../EnumTableContent';

const FurnacesSection = () => {
  const [activePill, setActivePill] = useState('furnace_type');
  const { t } = useTranslation();

  return (
    <Tab.Container activeKey={activePill} onSelect={setActivePill}>
      <Nav variant="pills" className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="furnace_type">{t('references.furnaces.furnace_type')}</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="furnace_size">{t('references.furnaces.furnace_size')}</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="heating_cell_type">{t('references.furnaces.heating_cell_type')}</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="cooling_media">{t('references.furnaces.cooling_media')}</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="process_type">{t('references.furnaces.process_type')}</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="quench_cell">{t('references.furnaces.quench_cell')}</Nav.Link>
        </Nav.Item>
      </Nav>

      <Tab.Content>
        <Tab.Pane eventKey="furnace_type">
          <Card>
            <Card.Body>
              <EnumTableContent table="furnaces" column="furnace_type" />
            </Card.Body>
          </Card>
        </Tab.Pane>

        <Tab.Pane eventKey="furnace_size">
          <Card>
            <Card.Body>
              <EnumTableContent table="furnaces" column="furnace_size" />
            </Card.Body>
          </Card>
        </Tab.Pane>

        <Tab.Pane eventKey="heating_cell_type">
          <Card>
            <Card.Body>
              <EnumTableContent table="furnaces" column="heating_cell_type" />
            </Card.Body>
          </Card>
        </Tab.Pane>

        <Tab.Pane eventKey="cooling_media">
          <Card>
            <Card.Body>
              <EnumTableContent table="furnaces" column="cooling_media" />
            </Card.Body>
          </Card>
        </Tab.Pane>

        <Tab.Pane eventKey="process_type">
          <Card>
            <Card.Body>
              <EnumTableContent table="furnaces" column="process_type" />
            </Card.Body>
          </Card>
        </Tab.Pane>
        <Tab.Pane eventKey="quench_cell">
          <Card>
            <Card.Body>
              <EnumTableContent table="furnaces" column="quench_cell" />
            </Card.Body>
          </Card>
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
  );
};

export default FurnacesSection;
