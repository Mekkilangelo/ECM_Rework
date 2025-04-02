// src/components/reference/UnitsSection.jsx
import React, { useState } from 'react';
import { Tab, Nav, Button, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import EnumTableContent from '../EnumTableContent';

const UnitsSection = () => {
  const [activePill, setActivePill] = useState('length_units');

  return (
    <Tab.Container activeKey={activePill} onSelect={setActivePill}>
      <Nav variant="pills" className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="length_units">Length Units</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="weight_units">Weight Units</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="hardness_units">Hardness Units</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="temperature_units">Temperature Units</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="time_units">Time Units</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="pressure_units">Pressure Units</Nav.Link>
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
