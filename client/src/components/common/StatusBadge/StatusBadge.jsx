import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status || status === 'opened') return null;
  
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
  
  // Styles spécifiques basés sur le statut
  const getBadgeStyle = () => {
    switch (status) {
      case 'new':
        return { backgroundColor: '#dc3545', color: 'white' }; // Rouge
      case 'opened':
        return { backgroundColor: '#17a2b8', color: 'white' }; // Bleu
      case 'in_progress':
        return { backgroundColor: '#ffc107', color: '#212529' }; // Jaune
      case 'completed':
        return { backgroundColor: '#28a745', color: 'white' }; // Vert
      default:
        return { backgroundColor: '#6c757d', color: 'white' }; // Gris
    }
  };
  
  const badgeStyle = {
    ...getBadgeStyle(),
    padding: '0.25em 0.6em',
    fontWeight: 'bold',
    borderRadius: '0.25rem',
    display: 'inline-block',
    fontSize: '75%',
    lineHeight: 1,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    verticalAlign: 'baseline',
    margin: '0.5rem'
  };
  
  return (
    <span style={badgeStyle}>
      {getLabel()}
    </span>
  );
};

export default StatusBadge;
