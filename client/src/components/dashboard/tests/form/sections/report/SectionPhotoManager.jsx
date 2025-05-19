import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faImage, faTimes, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import fileService from '../../../../../../services/fileService';

const SectionPhotoManager = ({
  testNodeId,
  partNodeId,
  sectionType,
  onChange,
  initialSelectedPhotos = {},
  show = false
}) => {
  // État pour stocker les photos disponibles
  const [availablePhotos, setAvailablePhotos] = useState([]);
  // État pour stocker les IDs des photos sélectionnées
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  // État pour le chargement
  const [loading, setLoading] = useState(false);
  // État pour les erreurs
  const [error, setError] = useState(null);

  // Configuration des catégories et sous-catégories par type de section
  const sectionConfig = {
    identification: {
      nodeId: partNodeId,
      sources: [
        { category: 'photos', subcategory: 'front' },
        { category: 'photos', subcategory: 'profile' },
        { category: 'photos', subcategory: 'quarter' },
        { category: 'photos', subcategory: 'other' }
      ]
    },
    micrography: {
      nodeId: testNodeId,
      sources: [
        { category: 'micrographs-result-0', subcategory: 'x50' },
        { category: 'micrographs-result-0', subcategory: 'x500' },
        { category: 'micrographs-result-0', subcategory: 'x1000' },
        { category: 'micrographs-result-0', subcategory: 'other' },
        { category: 'micrographs-result-1', subcategory: 'x50' },
        { category: 'micrographs-result-1', subcategory: 'x500' },
        { category: 'micrographs-result-1', subcategory: 'x1000' },
        { category: 'micrographs-result-1', subcategory: 'other' }
      ]
    },
    load: {
      nodeId: testNodeId,
      sources: [
        { category: 'load_design', subcategory: 'load_design' }
      ]
    },
    curves: {
      nodeId: testNodeId,
      sources: [
        { category: 'furnace_report', subcategory: 'heating' },
        { category: 'furnace_report', subcategory: 'cooling' },
        { category: 'furnace_report', subcategory: 'datapaq' },
        { category: 'furnace_report', subcategory: 'alarms' }
      ]
    }
  };

  // Charger les photos au montage du composant ou quand les IDs changent
  useEffect(() => {
    if (!show) return;
    
    const config = sectionConfig[sectionType];
    if (!config) {
      console.error(`Configuration manquante pour la section ${sectionType}`);
      return;
    }
    
    // Vérifiez ici si l'ID est disponible pour cette section spécifique
    let nodeId = config.nodeId;
    
    // Force l'utilisation du partNodeId pour la section identification
    if (sectionType === 'identification' && partNodeId) {
      nodeId = partNodeId;
      console.log(`Utilisation forcée de partNodeId (${partNodeId}) pour la section identification`);
    }
    
    // Vérifiez si nodeId est défini, sinon attendez
    if (!nodeId) {
      console.error(`NodeId manquant pour la section ${sectionType}. testNodeId=${testNodeId}, partNodeId=${partNodeId}`);
      setAvailablePhotos([]);
      setError(`Impossible de charger les photos: ID de ${sectionType === 'identification' ? 'pièce' : 'test'} manquant.`);
      return;
    }
    
    // Mettre à jour la config avec le bon nodeId
    sectionConfig[sectionType].nodeId = nodeId;
    
    console.log(`Chargement des photos pour la section ${sectionType} avec nodeId: ${nodeId}`);
    loadPhotosForSection();
  }, [sectionType, testNodeId, partNodeId, show]);

  // Initialiser les photos sélectionnées à partir de initialSelectedPhotos
  useEffect(() => {
    if (initialSelectedPhotos && initialSelectedPhotos[sectionType]) {
      setSelectedPhotoIds(initialSelectedPhotos[sectionType] || []);
    } else {
      setSelectedPhotoIds([]);
    }
  }, [initialSelectedPhotos, sectionType]);

  // Charger les photos pour la section spécifiée
  const loadPhotosForSection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const config = sectionConfig[sectionType];
      // Force l'utilisation du partNodeId pour la section identification
      let nodeId = config?.nodeId;
      if (sectionType === 'identification' && partNodeId) {
        nodeId = partNodeId;
      }
      
      if (!config || !nodeId) {
        console.error(`Configuration manquante ou nodeId manquant pour la section ${sectionType}`);
        setAvailablePhotos([]);
        setLoading(false);
        return;
      }
      
      console.log(`Chargement des photos pour la section ${sectionType} avec nodeId: ${nodeId}`);
      const allPhotos = [];
      
      // Pour chaque source définie dans la config de la section
      for (const source of config.sources) {
        try {
          console.log(`Chargement des photos pour ${source.category}/${source.subcategory} avec nodeId: ${nodeId}`);
          const response = await fileService.getFilesByNode(
            nodeId, // Utiliser le nodeId correct
            { category: source.category, subcategory: source.subcategory }
          );
          
          console.log(`Résultat pour ${source.category}/${source.subcategory}:`, response.data);
          
          if (response.data && response.data.files && response.data.files.length > 0) {
            // Ajouter les métadonnées de la source à chaque photo
            const processedFiles = response.data.files.map(file => ({
              ...file,
              sectionSource: sectionType,
              sourceCategory: source.category,
              sourceSubcategory: source.subcategory,
              // Utiliser l'URL directe pour le endpoint getFileById
              viewPath: fileService.getFilePreviewUrl(file.id)
            }));
            
            allPhotos.push(...processedFiles);
          }
        } catch (err) {
          console.error(`Erreur lors de la récupération des photos pour ${source.category}/${source.subcategory}:`, err);
        }
      }
      
      console.log(`Total des photos trouvées pour ${sectionType}:`, allPhotos.length);
      setAvailablePhotos(allPhotos);
      
      // Si aucune sélection initiale, sélectionner toutes les photos par défaut
      if (allPhotos.length > 0 && (!initialSelectedPhotos || !initialSelectedPhotos[sectionType] || initialSelectedPhotos[sectionType].length === 0)) {
        const allPhotoIds = allPhotos.map(photo => photo.id);
        setSelectedPhotoIds(allPhotoIds);
        
        if (onChange) {
          onChange(sectionType, allPhotoIds);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des photos de la section:', error);
      setError(`Erreur lors du chargement des photos: ${error.message || 'erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  // Basculer la sélection d'une photo
  const togglePhotoSelection = (photoId) => {
    setSelectedPhotoIds(prevSelected => {
      let newSelected;
      
      if (prevSelected.includes(photoId)) {
        newSelected = prevSelected.filter(id => id !== photoId);
      } else {
        newSelected = [...prevSelected, photoId];
      }
      
      // Notifier le parent du changement
      if (onChange) {
        onChange(sectionType, newSelected);
      }
      
      return newSelected;
    });
  };

  // Sélectionner ou désélectionner toutes les photos
  const toggleAllPhotos = (select) => {
    let newSelected = [];
    
    if (select) {
      newSelected = availablePhotos.map(photo => photo.id);
    }
    
    setSelectedPhotoIds(newSelected);
    
    // Notifier le parent du changement
    if (onChange) {
      onChange(sectionType, newSelected);
    }
  };

  // Si le gestionnaire n'est pas visible
  if (!show) {
    return null;
  }

  // Afficher le chargement
  if (loading) {
    return (
      <div className="text-center p-3">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  // Définir le titre en fonction du type de section
  const sectionTitles = {
    identification: "Photos de la pièce",
    micrography: "Micrographies",
    load: "Photos de la charge",
    curves: "Rapports de four"
  };

  const nodeTypeText = sectionType === 'identification' ? 'pièce' : 'test';
  const nodeId = sectionConfig[sectionType]?.nodeId;

  // Si aucune photo n'est disponible mais nous avons un nodeId
  if (!loading && availablePhotos.length === 0 && nodeId) {
    return (
      <Alert variant="info">
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={faImage} size="2x" className="me-3" />
          <div>
            <h6 className="mb-0">Aucune photo disponible</h6>
            <p className="mb-1 mt-1">
              Aucune photo n'a été trouvée pour cette section ({sectionType}).
              {sectionType === 'identification' ? 
                " Vérifiez que vous avez bien ajouté des photos à la pièce." :
                " Vérifiez que vous avez bien associé des fichiers au test."
              }
            </p>
            <div>
              <span className="text-muted small">ID {nodeTypeText}: {nodeId}</span>
              <Button 
                size="sm" 
                variant="outline-primary" 
                className="ms-2"
                onClick={loadPhotosForSection}
              >
                Actualiser
              </Button>
            </div>
          </div>
        </div>
      </Alert>
    );
  }

  // Si nous n'avons pas de nodeId
  if (!nodeId) {
    return (
      <Alert variant="warning">
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="me-3" />
          <div>
            <h6 className="mb-0">ID de {nodeTypeText} manquant</h6>
            <p className="mb-1 mt-1">
              Impossible de charger les photos car l'ID de {nodeTypeText} est manquant.
            </p>
          </div>
        </div>
      </Alert>
    );
  }

  return (
    <div className="section-photo-manager mb-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">{sectionTitles[sectionType] || "Photos"}</h6>
        <div>
          <Badge bg="primary" className="me-2">
            {selectedPhotoIds.length}/{availablePhotos.length} sélectionnées
          </Badge>
          <Button 
            size="sm" 
            variant="outline-primary" 
            className="me-1" 
            onClick={() => toggleAllPhotos(true)}
          >
            Tout sélectionner
          </Button>
          <Button 
            size="sm" 
            variant="outline-secondary" 
            onClick={() => toggleAllPhotos(false)}
          >
            Tout désélectionner
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger">{error}</Alert>
      )}

      {/* Bouton de débogage temporaire */}
      <div className="mb-3">
        <Button 
          size="sm" 
          variant="outline-info" 
          onClick={() => {
            console.log("Section type:", sectionType);
            console.log("Config:", sectionConfig[sectionType]);
            console.log("nodeId:", sectionConfig[sectionType]?.nodeId);
            console.log("testNodeId:", testNodeId);
            console.log("partNodeId:", partNodeId);
            console.log("Available Photos:", availablePhotos);
            console.log("Selected Photos:", selectedPhotoIds);
          }}
        >
          Debug Info
        </Button>
      </div>

      <Row className="g-2">
        {availablePhotos.map((photo) => (
          <Col key={photo.id} xs={6} md={4} lg={3}>
            <Card 
              className={`h-100 ${selectedPhotoIds.includes(photo.id) ? 'border-primary' : ''}`}
              onClick={() => togglePhotoSelection(photo.id)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ position: 'relative' }}>
                <Card.Img 
                  variant="top" 
                  src={photo.viewPath} 
                  style={{ height: '120px', objectFit: 'cover', background: '#f8f9fa' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    console.error(`Erreur de chargement d'image: ${photo.viewPath}`);
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIG5vbiBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
                <div style={{ 
                  position: 'absolute', 
                  top: '8px', 
                  right: '8px',
                  background: selectedPhotoIds.includes(photo.id) ? '#0d6efd' : 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: selectedPhotoIds.includes(photo.id) ? 'none' : '1px solid #dee2e6'
                }}>
                  <FontAwesomeIcon 
                    icon={selectedPhotoIds.includes(photo.id) ? faCheck : faTimes} 
                    color={selectedPhotoIds.includes(photo.id) ? 'white' : '#ccc'} 
                  />
                </div>
              </div>
              <Card.Body className="p-2">
                <Card.Text className="mb-1 small text-truncate">{photo.name}</Card.Text>
                <div className="small text-muted text-truncate">
                  {photo.sourceCategory}/{photo.sourceSubcategory}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default SectionPhotoManager;