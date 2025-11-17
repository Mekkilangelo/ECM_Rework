/**
 * PRESENTATION: Wrapper pour SectionPhotoManager
 * Adapte l'ancien composant au nouveau système
 */

import React from 'react';
import OldSectionPhotoManager from '../../../../components/dashboard/tests/form/sections/report/SectionPhotoManager';

/**
 * Wrapper pour le composant SectionPhotoManager existant
 * Maintient la compatibilité avec l'ancien système
 */
const SectionPhotoManager = ({
  trialNodeId,
  partNodeId,
  sectionType,
  onChange,
  initialSelectedPhotos = {},
  show = true
}) => {
  return (
    <OldSectionPhotoManager
      testNodeId={trialNodeId}
      partNodeId={partNodeId}
      sectionType={sectionType}
      onChange={onChange}
      initialSelectedPhotos={initialSelectedPhotos}
      show={show}
    />
  );
};

export default React.memo(SectionPhotoManager);
