import React, { useState, useContext } from 'react';
import { Card, Tabs, Tab, Table, Badge, Button, Alert, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faFileAlt, faCogs, faFlask, faIndustry, 
  faEye, faSearch
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import ClientForm from '../dashboard/clients/ClientForm';
import OrderForm from '../dashboard/orders/OrderForm';
import PartForm from '../dashboard/parts/PartForm';
import TestForm from '../dashboard/tests/form/TestForm';
import SteelForm from '../dashboard/steels/SteelForm';
import './SearchResultsByType.css';

const SearchResultsByType = ({ results, entityTypes }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  // États pour les modals
  const [showClientModal, setShowClientModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPartModal, setShowPartModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showSteelModal, setShowSteelModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Déterminer si l'utilisateur a les droits d'accès admin/superuser
  const hasAdminRights = user && (user.role === 'admin' || user.role === 'superuser');
  
  // Icones et couleurs par type d'entité
  const entityConfig = {
    clients: { 
      icon: faUser, 
      color: 'primary',
      headers: ['Nom', 'Code', 'Ville', 'Pays', 'Contact', 'Actions']
    },
    orders: { 
      icon: faFileAlt, 
      color: 'warning',
      headers: ['Référence', 'Date', 'Client', 'Statut', 'Commercial', 'Actions']
    },
    parts: { 
      icon: faCogs, 
      color: 'success',
      headers: ['Désignation', 'Référence', 'Acier', 'Quantité', 'Client', 'Actions']
    },
    tests: { 
      icon: faFlask, 
      color: 'info',
      headers: ['Code', 'Type', 'Date', 'Statut', 'Pièce', 'Actions'] 
    },
    steels: { 
      icon: faIndustry, 
      color: 'secondary',
      headers: ['Grade', 'Norme', 'Famille', 'Éléments', 'Actions']
    }
  };

  // Fonction pour naviguer vers la page de détails ou ouvrir le formulaire d'édition modal
  const handleViewDetails = (type, id) => {
    // Rechercher l'élément sélectionné dans les résultats
    const item = results[type].find(item => item.id === id);
    if (!item) {
      console.error(`Élément non trouvé pour ${type}/${id}`);
      return;
    }
    
    // Définir l'élément sélectionné
    setSelectedItem(item);
    
    // Ouvrir le modal approprié selon le type
    switch(type) {
      case 'clients':
        setShowClientModal(true);
        break;
      case 'orders':
        setShowOrderModal(true);
        break;
      case 'parts':
        setShowPartModal(true);
        break;
      case 'tests':
        setShowTestModal(true);
        break;
      case 'steels':
        setShowSteelModal(true);
        break;
      default:
        console.error('Type d\'entité non reconnu:', type);
    }
  };

  // Fonction pour extraire correctement les propriétés selon la structure des données
  const extractProperty = (item, property, type) => {
    // Si l'élément a directement la propriété
    if (item[property] !== undefined) {
      return item[property];
    }
    
    // Vérifie dans l'objet de type, par exemple item.Client.property
    const typeKey = type.charAt(0).toUpperCase() + type.slice(1, -1); // "clients" -> "Client"
    if (item[typeKey] && item[typeKey][property] !== undefined) {
      return item[typeKey][property];
    }
    
    return null;
  };

  // Fonction pour déterminer le type d'entité d'un élément
  const getEntityType = (item) => {
    if (item.Client) return 'clients';
    if (item.Order) return 'orders';
    if (item.Part) return 'parts';
    if (item.Test) return 'tests';
    if (item.Steel) return 'steels';
    return null;
  };

  // Fonction pour rendre les cellules pour un type d'entité
  const renderRow = (item, type) => {
    switch(type) {
      case 'clients':
        return (
          <tr key={item.id}>
            <td className="align-middle">{extractProperty(item, 'name', type) || '-'}</td>
            <td className="align-middle">{extractProperty(item, 'client_code', type) || '-'}</td>
            <td className="align-middle">{extractProperty(item, 'city', type) || '-'}</td>
            <td className="align-middle">{extractProperty(item, 'country', type) || '-'}</td>
            <td className="align-middle">
              {(item.contacts && item.contacts.length > 0) ? item.contacts[0].name : 
               (item.Client && item.Client.contacts && item.Client.contacts.length > 0) ? item.Client.contacts[0].name : '-'}
            </td>
            <td className="align-middle">
              {hasAdminRights && (
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  className="me-2" 
                  onClick={() => handleViewDetails(type, item.id)}
                >
                  <FontAwesomeIcon icon={faEye} />
                </Button>
              )}
            </td>
          </tr>
        );
      case 'orders':
        const orderDate = extractProperty(item, 'order_date', type);
        return (
          <tr key={item.id}>
            <td className="align-middle">{extractProperty(item, 'reference', type) || '-'}</td>
            <td className="align-middle">{orderDate ? new Date(orderDate).toLocaleDateString() : '-'}</td>
            <td className="align-middle">
              {item.client ? item.client.name : 
               item.Order && item.Order.client ? item.Order.client.name : 
               item.parent_name || '-'}
            </td>
            <td className="align-middle">
              <Badge bg={extractProperty(item, 'status', type) === 'completed' ? 'success' : 'warning'}>
                {extractProperty(item, 'status', type) || 'Pending'}
              </Badge>
            </td>
            <td className="align-middle">{extractProperty(item, 'commercial', type) || '-'}</td>
            <td className="align-middle">
              {hasAdminRights && (
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  className="me-2" 
                  onClick={() => handleViewDetails(type, item.id)}
                >
                  <FontAwesomeIcon icon={faEye} />
                </Button>
              )}
            </td>
          </tr>
        );
      case 'parts':
        return (
          <tr key={item.id}>
            <td className="align-middle">{extractProperty(item, 'designation', type) || '-'}</td>
            <td className="align-middle">{extractProperty(item, 'reference', type) || '-'}</td>
            <td className="align-middle">
              {item.steel ? item.steel.grade : 
               item.Part && item.Part.steel ? item.Part.steel.grade : '-'}
            </td>
            <td className="align-middle">{extractProperty(item, 'quantity', type) || '-'}</td>
            <td className="align-middle">{extractProperty(item, 'client_designation', type) || 
              item.parent_name || '-'}</td>
            <td className="align-middle">
              {hasAdminRights && (
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  className="me-2" 
                  onClick={() => handleViewDetails(type, item.id)}
                >
                  <FontAwesomeIcon icon={faEye} />
                </Button>
              )}
            </td>
          </tr>
        );
      case 'tests':
        const testDate = extractProperty(item, 'test_date', type);
        return (
          <tr key={item.id}>
            <td className="align-middle">{extractProperty(item, 'test_code', type) || 
              extractProperty(item, 'load_number', type) || '-'}</td>
            <td className="align-middle">{extractProperty(item, 'test_type', type) || '-'}</td>
            <td className="align-middle">{testDate ? new Date(testDate).toLocaleDateString() : '-'}</td>
            <td className="align-middle">
              <Badge bg={extractProperty(item, 'status', type) === 'completed' ? 'success' : 
                extractProperty(item, 'status', type) === 'failed' ? 'danger' : 'warning'}>
                {extractProperty(item, 'status', type) || 'Pending'}
              </Badge>
            </td>
            <td className="align-middle">
              {item.part ? item.part.designation : 
               item.Test && item.Test.part ? item.Test.part.designation : 
               item.parent_name || '-'}
            </td>
            <td className="align-middle">
              {hasAdminRights && (
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  className="me-2" 
                  onClick={() => handleViewDetails(type, item.id)}
                >
                  <FontAwesomeIcon icon={faEye} />
                </Button>
              )}
            </td>
          </tr>
        );
      case 'steels':
        return (
          <tr key={item.id}>
            <td className="align-middle">{extractProperty(item, 'grade', type) || '-'}</td>
            <td className="align-middle">{extractProperty(item, 'standard', type) || '-'}</td>
            <td className="align-middle">{extractProperty(item, 'family', type) || '-'}</td>
            <td className="align-middle">
              {item.elements && item.elements.length > 0 ? 
                item.elements.slice(0, 3).map((el, idx) => (
                  <Badge key={idx} bg="light" text="dark" className="me-1">
                    {el.element}: {el.min_value}-{el.max_value}%
                  </Badge>
                )) 
                : 
                (item.Steel && item.Steel.elements && item.Steel.elements.length > 0) ?
                  item.Steel.elements.slice(0, 3).map((el, idx) => (
                    <Badge key={idx} bg="light" text="dark" className="me-1">
                      {el.element}: {el.min_value}-{el.max_value}%
                    </Badge>
                  ))
                  : '-'
              }
              {item.elements && item.elements.length > 3 && 
                <Badge bg="secondary">+{item.elements.length - 3}</Badge>
              }
              {item.Steel && item.Steel.elements && item.Steel.elements.length > 3 && 
                <Badge bg="secondary">+{item.Steel.elements.length - 3}</Badge>
              }
            </td>
            <td className="align-middle">
              {hasAdminRights && (
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  className="me-2" 
                  onClick={() => handleViewDetails(type, item.id)}
                >
                  <FontAwesomeIcon icon={faEye} />
                </Button>
              )}
            </td>
          </tr>
        );
      default:
        return null;
    }
  };

  // Vérifier si results est un objet vide
  const isEmpty = !results || 
                Object.keys(results).length === 0 || 
                !Object.values(results).some(arr => Array.isArray(arr) && arr.length > 0);

  if (isEmpty) {
    return (
      <Alert variant="info" className="mt-4">
        <Alert.Heading>
          <FontAwesomeIcon icon={faSearch} className="me-2" />
          {t('search.noResultsTitle')}
        </Alert.Heading>
        <p>{t('search.noResultsMessage')}</p>
      </Alert>
    );
  }

  // Vérifier s'il y a des résultats pour au moins une entité
  const hasAnyResults = entityTypes.some(type => {
    const typeResults = results[type];
    return Array.isArray(typeResults) && typeResults.length > 0;
  });

  if (!hasAnyResults) {
    return (
      <Alert variant="info" className="mt-4">
        <Alert.Heading>
          <FontAwesomeIcon icon={faSearch} className="me-2" />
          {t('search.noResultsForSelectedTypes')}
        </Alert.Heading>
        <p>{t('search.tryDifferentTypesMessage')}</p>
      </Alert>
    );
  }

  // Calculer l'onglet par défaut (premier type avec des résultats)
  const defaultTab = entityTypes.find(type => 
    Array.isArray(results[type]) && results[type].length > 0
  ) || entityTypes[0];

  // Fonction pour déboguer les résultats
  const debugResults = (type) => {
    if (!results[type]) return [];
    console.log(`Results for ${type}:`, results[type]);
    return results[type];
  };

  return (
    <>
      <Card className="shadow-sm border-0 results-card mt-4">
        <Tabs 
          defaultActiveKey={defaultTab} 
          className="results-tabs"
        >
          {entityTypes.map(type => {
            // On utilise la fonction de débogage pour vérifier les résultats
            const items = debugResults(type);
            const config = entityConfig[type];
            const hasResults = Array.isArray(items) && items.length > 0;
            
            return (
              <Tab 
                key={type}
                eventKey={type}
                title={
                  <span className="d-flex align-items-center">
                    <FontAwesomeIcon icon={config.icon} className={`me-2 text-${config.color}`} />
                    {t(`search.entityTypes.${type}`)}
                    {hasResults && (
                      <Badge bg={config.color} pill className="ms-2">
                        {items.length}
                      </Badge>
                    )}
                  </span>
                }
              >
                {hasResults ? (
                  <div className="table-responsive">
                    <Table hover className="results-table mb-0">
                      <thead className="thead-light">
                        <tr>
                          {config.headers.map((header, index) => (
                            <th key={index}>{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => renderRow(item, type))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <Alert variant="info" className="m-3">
                    {t('search.noResultsForType', { type: t(`search.entityTypes.${type}`) })}
                  </Alert>
                )}
              </Tab>
            );
          })}
        </Tabs>
      </Card>

      {/* Modal pour éditer un client */}
      <Modal
        show={showClientModal}
        onHide={() => setShowClientModal(false)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('clients.edit')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <ClientForm
              client={selectedItem}
              onClose={() => setShowClientModal(false)}
              onClientUpdated={() => {
                setShowClientModal(false);
                // Idéalement, actualiser les résultats de recherche ici
              }}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour éditer une commande */}
      <Modal
        show={showOrderModal}
        onHide={() => setShowOrderModal(false)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('orders.edit')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <OrderForm
              order={selectedItem}
              clientId={selectedItem.client_id || (selectedItem.client && selectedItem.client.id)}
              onClose={() => setShowOrderModal(false)}
              onOrderUpdated={() => {
                setShowOrderModal(false);
                // Idéalement, actualiser les résultats de recherche ici
              }}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour éditer une pièce */}
      <Modal
        show={showPartModal}
        onHide={() => setShowPartModal(false)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('parts.edit')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <PartForm
              part={selectedItem}
              orderId={selectedItem.order_id || (selectedItem.order && selectedItem.order.id)}
              onClose={() => setShowPartModal(false)}
              onPartUpdated={() => {
                setShowPartModal(false);
                // Idéalement, actualiser les résultats de recherche ici
              }}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour éditer un test */}
      <Modal
        show={showTestModal}
        onHide={() => setShowTestModal(false)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('tests.edit')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <TestForm
              test={selectedItem}
              partId={selectedItem.part_id || (selectedItem.part && selectedItem.part.id)}
              onClose={() => setShowTestModal(false)}
              onTestUpdated={() => {
                setShowTestModal(false);
                // Idéalement, actualiser les résultats de recherche ici
              }}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour éditer un acier */}
      <Modal
        show={showSteelModal}
        onHide={() => setShowSteelModal(false)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('steels.edit')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <SteelForm
              steel={selectedItem}
              onClose={() => setShowSteelModal(false)}
              onSteelUpdated={() => {
                setShowSteelModal(false);
                // Idéalement, actualiser les résultats de recherche ici
              }}
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default SearchResultsByType;