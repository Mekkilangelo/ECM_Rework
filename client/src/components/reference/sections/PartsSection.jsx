// src/components/reference/PartsSection.jsx
import React, { useState } from 'react';
import { Tab, Nav, Button, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import EnumTableContent from '../EnumTableContent';

const PartsSection = () => {
  const [activePill, setActivePill] = useState('designation');

  return (
    <Tab.Container activeKey={activePill} onSelect={setActivePill}>
      <Nav variant="pills" className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="designation">Designation</Nav.Link>
        </Nav.Item>
      </Nav>

      <Tab.Content>
        <Tab.Pane eventKey="designation">
          <Card>
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
              <h6 className="m-0 font-weight-bold text-danger">Designations</h6>
              <Button 
                variant="danger" 
                size="sm" 
                className="add-button" 
                data-table="parts" 
                data-column="designation"
              >
                <FontAwesomeIcon icon={faPlus} className="fa-sm" /> Add
              </Button>
            </Card.Header>
            <Card.Body>
              <EnumTableContent table="parts" column="designation" />
            </Card.Body>
          </Card>
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
  );
};

export default PartsSection;
