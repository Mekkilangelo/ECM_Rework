/**
 * INFRASTRUCTURE: Post-treatment Section for PDF
 * Displays post-treatment photos.
 * Layout delegated to PhotoPagesLayoutPDF.
 */

import React from 'react';
import { validatePhotos } from '../helpers/photoHelpers';
import { PhotoPagesLayoutPDF } from './PhotoPagesLayoutPDF';

export const PostTreatmentSectionPDF = ({ report, photos = [] }) => {
  if (!report) return null;

  return (
    <PhotoPagesLayoutPDF
      title="POST-TRAITEMENT"
      photos={validatePhotos(photos || [])}
      gridFromStart
    />
  );
};

export default PostTreatmentSectionPDF;
