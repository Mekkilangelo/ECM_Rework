import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Breadcrumb, ListGroup, Card, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolder, faFile, faFilePdf, faFileExcel,
  faFileWord, faFileImage, faArrowLeft, faDownload
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/Layout';
import archiveService from '../services/archiveService';
import { saveAs } from 'file-saver';

const Archives = () => {
  const [currentPath, setCurrentPath] = useState('/');
  const [contents, setContents] = useState({ folders: [], archives: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDirectoryContents(currentPath);
  }, [currentPath]);

  const fetchDirectoryContents = async (path) => {
    try {
      setLoading(true);
      const response = await archiveService.getDirectoryContents(path);
      setContents({
        folders: response.data.folders || [],
        archives: response.data.archives || []
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching directory contents:', err);
      setError('Erreur lors du chargement du répertoire');
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folderName) => {
    const newPath = currentPath === '/'
      ? `/${folderName}`
      : `${currentPath}/${folderName}`;
    setCurrentPath(newPath);
  };

  const navigateUp = () => {
    if (currentPath === '/') return;
    const pathParts = currentPath.split('/').filter(part => part !== '');
    pathParts.pop();
    const newPath = pathParts.length === 0 ? '/' : `/${pathParts.join('/')}`;
    setCurrentPath(newPath);
  };

  const downloadArchive = async (archive) => {
    try {
      const response = await archiveService.downloadArchive(`${currentPath}/${archive.name}`);
      saveAs(new Blob([response.data]), archive.name);
    } catch (err) {
      console.error('Error downloading archive:', err);
      alert('Erreur lors du téléchargement du fichier');
    }
  };

  const getArchiveIcon = (archiveName) => {
    const extension = archiveName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf': return faFilePdf;
      case 'doc':
      case 'docx': return faFileWord;
      case 'xls':
      case 'xlsx': return faFileExcel;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return faFileImage;
      default: return faFile;
    }
  };

  const renderBreadcrumb = () => {
    const parts = currentPath.split('/').filter(part => part !== '');
    return (
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => setCurrentPath('/')}>Racine</Breadcrumb.Item>
        {parts.map((part, index) => {
          const path = `/${parts.slice(0, index + 1).join('/')}`;
          return (
            <Breadcrumb.Item
              key={path}
              onClick={() => setCurrentPath(path)}
              active={index === parts.length - 1}
            >
              {part}
            </Breadcrumb.Item>
          );
        })}
      </Breadcrumb>
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Layout>
      <Container fluid className="mt-4">
        <h1>Archives</h1>
        <div className="d-flex align-items-center mb-3">
          <Button 
            variant="outline-secondary" 
            className="mr-3" 
            onClick={navigateUp}
            disabled={currentPath === '/'}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Retour
          </Button>
          {renderBreadcrumb()}
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <Card>
          <Card.Header>
            <h5 className="mb-0">
              {currentPath === '/' ? 'Racine' : `Dossier: ${currentPath.split('/').pop()}`}
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            {loading ? (
              <div className="p-4 text-center">Chargement...</div>
            ) : (
              <ListGroup variant="flush">
                {contents.folders.length === 0 && contents.archives.length === 0 && (
                  <ListGroup.Item className="text-muted">
                    Ce dossier est vide
                  </ListGroup.Item>
                )}
                
                {contents.folders.map((folder) => (
                  <ListGroup.Item
                    key={folder.name}
                    action
                    onClick={() => navigateToFolder(folder.name)}
                    className="d-flex align-items-center"
                  >
                    <FontAwesomeIcon icon={faFolder} className="mr-3 text-warning" />
                    <strong>{folder.name}</strong>
                  </ListGroup.Item>
                ))}
                
                {contents.archives.map((archive) => (
                  <ListGroup.Item
                    key={archive.name}
                    className="d-flex align-items-center justify-content-between"
                  >
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon
                        icon={getArchiveIcon(archive.name)}
                        className="mr-3 text-primary"
                      />
                      <div>
                        <div>{archive.name}</div>
                        <small className="text-muted">
                          {formatFileSize(archive.size)} • Modifié le: {new Date(archive.modifiedAt).toLocaleString()}
                        </small>
                      </div>
                    </div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => downloadArchive(archive)}
                      title="Télécharger"
                    >
                      <FontAwesomeIcon icon={faDownload} /> Télécharger
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Card.Body>
        </Card>
      </Container>
    </Layout>
  );
};

export default Archives;
