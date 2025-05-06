// src/components/reference/steels/SteelList.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Table, Button, Spinner, Alert, Modal, Card, Badge, Row, Col, Pagination } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faTrash, faEdit, faCodeBranch, faSearch } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../../context/AuthContext';
import StatusBadge from '../../common/StatusBadge/StatusBadge';
import SteelForm from './SteelForm';
import SteelDetails from './SteelDetails';
import steelService from '../../../services/steelService';
import '../../../styles/dataList.css';

const SteelList = () => {
  const { user } = useContext(AuthContext);
  const [steels, setSteels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSteel, setSelectedSteel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const hasEditRights = user && (user.role === 'admin' || user.role === 'superuser');

  useEffect(() => {
    fetchSteels();
  }, [currentPage, limit]);

  const fetchSteels = async () => {
    try {
      setLoading(true);
      const response = await steelService.getAllSteels(currentPage, limit);
      
      // Check the structure of the response based on your API
      if (response.data && response.data.steels) {
        // If the API returns { steels, pagination }
        setSteels(response.data.steels);
        
        // Set pagination data
        const { total, limit: responseLimit } = response.data.pagination;
        setTotal(total);
        setTotalPages(Math.ceil(total / responseLimit));
      } else if (Array.isArray(response.data)) {
        // If the API directly returns an array of steels
        setSteels(response.data);
        // Assuming the total count is in a header or elsewhere
        const totalCount = parseInt(response.headers['x-total-count'] || '0');
        setTotal(totalCount);
        setTotalPages(Math.ceil(totalCount / limit));
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching steels:', err);
      setError('Une erreur est survenue lors du chargement des aciers.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewDetails = (steel) => {
    setSelectedSteel(steel);
    setShowDetailModal(true);
  };

  const handleEditSteel = (steel) => {
    setSelectedSteel(steel);
    setShowEditForm(true);
  };

  const handleDeleteSteel = async (steelId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet acier ? Cette action est irréversible.")) {
      try {
        await steelService.deleteSteel(steelId);
        alert("Acier supprimé avec succès");
        fetchSteels();
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'acier:', err);
        alert(err.response?.data?.message || "Une erreur est survenue lors de la suppression de l'acier");
      }
    }
  };

  const renderPagination = () => {
    const items = [];
    const maxPagesToShow = 5; // Show at most 5 page links
    
    // Calculate the range of pages to show
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust startPage if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
      }
    }
    
    // Add page numbers
    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item 
          key={page} 
          active={page === currentPage}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }
    
    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
      }
      items.push(
        <Pagination.Item 
          key={totalPages} 
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    return (
      <Pagination className="mt-3 justify-content-center">
        <Pagination.Prev
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />
        {items}
        <Pagination.Next
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  if (loading && steels.length === 0) return <div className="text-center my-5"><Spinner animation="border" variant="danger" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FontAwesomeIcon className="mr-2 text-danger" />
          Aciers
        </h2>
        <div className="d-flex">
          <Button
            variant="danger"
            onClick={() => setShowCreateForm(true)}
            className="d-flex align-items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> Nouvel acier
          </Button>
        </div>
      </div>
      {steels.length > 0 ? (
        <>
          <div className="data-list-container">
            <Table hover responsive className="data-table border-bottom">
              <thead>
                <tr className="bg-light">
                  <th style={{ width: '30%' }}>Grade</th>
                  <th className="text-center">Famille</th>
                  <th className="text-center">Standard</th>
                  <th className="text-center">Modifié le</th>
                  <th className="text-center" style={{ width: hasEditRights ? '150px' : '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {steels.map(steel => {
                  // Handle different response structures
                  const steelData = steel.Steel || steel; // If it's nested under a Node object
                  
                  return (
                    <tr key={steel.id || steelData.id}>
                      <td>
                        <div
                          onClick={() => handleViewDetails(steel)}
                          style={{ cursor: 'pointer' }}
                          className="d-flex align-items-center"
                        >
                          <div className="item-name font-weight-bold text-primary">
                            {steelData.grade || "Sans grade"}
                          </div>
                          <div className="ml-2">
                            <StatusBadge status={steel.data_status || steelData.data_status || 'active'} />
                          </div>
                        </div>
                      </td>
                      <td className="text-center">{steelData.family || "-"}</td>
                      <td className="text-center">{steelData.standard || "-"}</td>
                      <td className="text-center">{steel.modified_at || steelData.modified_at || "-"}</td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center">
                          <Button
                            variant="outline-info"
                            size="sm"
                            className="mr-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(steel);
                            }}
                            title="Détails"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </Button>
                          {hasEditRights && (
                            <>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="mr-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditSteel(steel);
                                }}
                                title="Modifier"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSteel(steel.id || steelData.id);
                                }}
                                title="Supprimer"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
          {loading && <div className="text-center mt-3"><Spinner animation="border" size="sm" /></div>}
          {totalPages > 1 && renderPagination()}
          <div className="text-muted text-center mt-2">
            Affichage de {steels.length} aciers sur {total} au total
          </div>
        </>
      ) : (
        <Card className="text-center p-5 bg-light">
          <Card.Body>
            <FontAwesomeIcon icon={faCodeBranch} size="3x" className="text-secondary mb-3" />
            <h4>Aucun acier trouvé</h4>
            <p className="text-muted">
              {searchQuery ? 'Aucun résultat pour cette recherche' : 'Cliquez sur "Nouvel acier" pour ajouter un acier'}
            </p>
          </Card.Body>
        </Card>
      )}

      {/* Modal pour créer un acier */}
      <Modal
        show={showCreateForm}
        onHide={() => setShowCreateForm(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Nouvel acier</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SteelForm
            onClose={() => setShowCreateForm(false)}
            onSteelCreated={() => {
              fetchSteels();
              setShowCreateForm(false);
            }}
          />
        </Modal.Body>
      </Modal>

      {/* Modal pour éditer un acier */}
      <Modal
        show={showEditForm}
        onHide={() => setShowEditForm(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Modifier l'acier</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSteel && (
            <SteelForm
              steel={selectedSteel}
              onClose={() => setShowEditForm(false)}
              onSteelUpdated={() => {
                fetchSteels();
                setShowEditForm(false);
              }}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour voir les détails */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Détails de l'acier</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSteel && (
            <SteelDetails
              steelId={selectedSteel.id || (selectedSteel.Steel && selectedSteel.Steel.id)}
              onClose={() => setShowDetailModal(false)}
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default SteelList;
