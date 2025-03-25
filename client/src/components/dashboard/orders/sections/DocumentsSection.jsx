// src/components/dashboard/orders/sections/DocumentsSection.jsx
import React from 'react';
import FileUploader from '../../../common/FileUploader/FileUploader';

const DocumentsSection = ({ 
  orderId, 
  setTempFileId 
}) => (
  <FileUploader 
    nodeId={orderId}
    entityType="orders"
    category="general"
    onUploadComplete={(data, tempId) => {
      if (tempId) setTempFileId(tempId);
    }}
    onError={(error) => console.error('Erreur FileUploader:', error)}
  />
);

export default DocumentsSection;
