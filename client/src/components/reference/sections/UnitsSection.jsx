// src/components/reference/UnitsSection.jsx
import React, { useState } from 'react';
import { Tab, Nav, Button, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import EnumTableContent from '../EnumTableContent';

const UnitsSection = () => {
  const [activePill, setActivePill] = useState('length_units');
  const { t } = useTranslation();

  return (
    <Tab.Container activeKey={activePill} onSelect={setActivePill}>
      <Nav variant="pills" className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="length_units">{t('references.units.length_units')}</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="weight_units">{t('references.units.weight_units')}</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="hardness_units">{t('references.units.hardness_units')}</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="temperature_units">{t('references.units.temperature_units')}</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="time_units">{t('references.units.time_units')}</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="pressure_units">{t('references.units.pressure_units')}</Nav.Link>
        </Nav.Item>
      </Nav>

      <Tab.Content>
        <Tab.Pane eventKey="length_units">
          <Card>
            <Card.Body>
              <EnumTableContent table="units" column="length_units" />
            </Card.Body>
          </Card>
        </Tab.Pane>

        <Tab.Pane eventKey="weight_units">
          <Card>
            <Card.Body>
              <EnumTableContent table="units" column="weight_units" />
            </Card.Body>
          </Card>
        </Tab.Pane>

        <Tab.Pane eventKey="hardness_units">
          <Card>
            <Card.Body>
              <EnumTableContent table="units" column="hardness_units" />
            </Card.Body>
          </Card>
        </Tab.Pane>

        <Tab.Pane eventKey="temperature_units">
          <Card>
            <Card.Body>
              <EnumTableContent table="units" column="temperature_units" />
            </Card.Body>
          </Card>
        </Tab.Pane>

        <Tab.Pane eventKey="time_units">
          <Card>
            <Card.Body>
              <EnumTableContent table="units" column="time_units" />
            </Card.Body>
          </Card>
        </Tab.Pane>

        <Tab.Pane eventKey="pressure_units">
          <Card>
            <Card.Body>
              <EnumTableContent table="units" column="pressure_units" />
            </Card.Body>
          </Card>
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
  );
};

export default UnitsSection;
