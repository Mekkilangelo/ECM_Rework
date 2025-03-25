// src/components/dashboard/parts/sections/PhotosSection.jsx
import React from 'react';
import { Button } from 'react-bootstrap';
import CollapsibleSection from '../../../common/CollapsibleSection/CollapsibleSection';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faImage } from '@fortawesome/free-solid-svg-icons';

const PhotosSection = ({ onUpload }) => {
  // Configuration des différentes vues
  const views = [
    { id: 'front', name: 'Vue de face' },
    { id: 'profile', name: 'Vue de profil' },
    { id: 'quarter', name: 'Vue de 3/4' },
    { id: 'other', name: 'Autre Vue' },
  ];

  // Style pour les boutons d'importation
  const uploadButtonStyle = {
    width: '100%',
    height: '150px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    border: '2px dashed #ced4da',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    marginBottom: '20px',
    color: '#495057'
  };

  return (
    <>
      {views.map((view) => (
        <CollapsibleSection
          key={view.id}
          title={view.name}
          isExpandedByDefault={view.id === 'front'}
          sectionId={`part-photo-${view.id}`}
          rememberState={true}
          className="mb-3"
        >
          <div className="p-2">
            {/* Zone d'importation de l'image */}
            <Button
              variant="outline-light"
              className="text-dark"
              style={uploadButtonStyle}
              onClick={() => onUpload(view.id)}
            >
              <FontAwesomeIcon icon={faImage} size="3x" className="mb-3 text-secondary" />
              <span className="fw-bold">Importer une {view.name.toLowerCase()}</span>
              <div className="mt-2 text-muted small">
                <FontAwesomeIcon icon={faUpload} className="me-1" />
                Cliquez ou glissez-déposez un fichier
              </div>
            </Button>

            {/* Prévisualisations des photos (placeholder pour future implémentation) */}
            <div id={`preview-${view.id}`} className="photo-preview"></div>
          </div>
        </CollapsibleSection>
      ))}
    </>
  );
};

export default PhotosSection;
