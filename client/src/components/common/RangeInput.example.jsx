import React, { useState } from 'react';
import RangeInput from './RangeInput';
import { Card, Container, Row, Col } from 'react-bootstrap';

/**
 * Exemple d'utilisation du composant RangeInput
 * Ce fichier montre différentes façons d'utiliser le composant
 */
const RangeInputExample = () => {
  const [filters, setFilters] = useState({
    minWeight: '',
    maxWeight: '',
    minLength: '',
    maxLength: '',
    minPrice: '',
    maxPrice: '',
  });

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Exemples d'utilisation du composant RangeInput</h2>

      <Row>
        {/* Exemple 1: Poids avec unité */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>Exemple 1: Filtre de poids</Card.Header>
            <Card.Body>
              <RangeInput
                label="Poids de la pièce"
                minValue={filters.minWeight}
                maxValue={filters.maxWeight}
                onMinChange={(value) => handleFilterChange('minWeight', value)}
                onMaxChange={(value) => handleFilterChange('maxWeight', value)}
                minPlaceholder="0"
                maxPlaceholder="1000"
                unit="kg"
                step="0.1"
              />
              <small className="text-muted">
                Valeurs: {filters.minWeight || 'N/A'} - {filters.maxWeight || 'N/A'} kg
              </small>
            </Card.Body>
          </Card>
        </Col>

        {/* Exemple 2: Longueur */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>Exemple 2: Filtre de longueur</Card.Header>
            <Card.Body>
              <RangeInput
                label="Longueur"
                minValue={filters.minLength}
                maxValue={filters.maxLength}
                onMinChange={(value) => handleFilterChange('minLength', value)}
                onMaxChange={(value) => handleFilterChange('maxLength', value)}
                minPlaceholder="0"
                maxPlaceholder="5000"
                unit="mm"
                step="1"
              />
              <small className="text-muted">
                Valeurs: {filters.minLength || 'N/A'} - {filters.maxLength || 'N/A'} mm
              </small>
            </Card.Body>
          </Card>
        </Col>

        {/* Exemple 3: Sans unité */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>Exemple 3: Sans unité (Prix)</Card.Header>
            <Card.Body>
              <RangeInput
                label="Prix"
                minValue={filters.minPrice}
                maxValue={filters.maxPrice}
                onMinChange={(value) => handleFilterChange('minPrice', value)}
                onMaxChange={(value) => handleFilterChange('maxPrice', value)}
                minPlaceholder="0"
                maxPlaceholder="10000"
                unit="€"
                step="0.01"
              />
              <small className="text-muted">
                Valeurs: {filters.minPrice || 'N/A'} - {filters.maxPrice || 'N/A'} €
              </small>
            </Card.Body>
          </Card>
        </Col>

        {/* Exemple 4: Sans label */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>Exemple 4: Sans label (compact)</Card.Header>
            <Card.Body>
              <RangeInput
                minValue={filters.minWeight}
                maxValue={filters.maxWeight}
                onMinChange={(value) => handleFilterChange('minWeight', value)}
                onMaxChange={(value) => handleFilterChange('maxWeight', value)}
                minPlaceholder="Min"
                maxPlaceholder="Max"
                unit="kg"
                step="0.1"
              />
              <small className="text-muted">
                Version compacte sans label
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Affichage des valeurs */}
      <Card className="mt-4">
        <Card.Header>État actuel des filtres</Card.Header>
        <Card.Body>
          <pre>{JSON.stringify(filters, null, 2)}</pre>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default RangeInputExample;
