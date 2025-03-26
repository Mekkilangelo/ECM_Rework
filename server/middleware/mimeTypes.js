// middleware/mimeTypes.js
const mimeTypes = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'csv': 'text/csv',
    
    // Archives
    'zip': 'application/zip',
    '7z': 'application/x-7z-compressed',
    'rar': 'application/x-rar-compressed',
    
    // Par défaut
    'default': 'application/octet-stream'
  };
  
  const getMimeTypeFromExtension = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    return mimeTypes[ext] || mimeTypes.default;
  };
  
  module.exports = {
    mimeTypes,
    getMimeTypeFromExtension
  };
  