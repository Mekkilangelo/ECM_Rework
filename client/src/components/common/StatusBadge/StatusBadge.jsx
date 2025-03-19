// client/src/components/common/StatusBadge.jsx
import React from 'react';
import { Badge } from 'react-bootstrap';

const StatusBadge = ({ status }) => {
  const getVariant = () => {
    switch (status) {
      case 'new':
        return 'danger';
      case 'opened':
        return 'info';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      default:
        return 'danger';
    }
  };
  
  const getLabel = () => {
    switch (status) {
      case 'new':
        return 'NOUVEAU';
      case 'opened':
        return 'OUVERT';
      case 'in_progress':
        return 'EN COURS';
      case 'completed':
        return 'TERMINÉ';
      default:
        return status.toUpperCase();
    }
  };
  
  if (!status || status === 'opened') return null;
  
  return (
    <Badge 
      variant={getVariant()} 
      className="m-2"
    >
      {getLabel()}
    </Badge>
  );
};

export default StatusBadge;