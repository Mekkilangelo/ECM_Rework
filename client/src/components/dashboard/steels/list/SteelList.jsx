// src/components/reference/steels/SteelList.jsx
import React, { useState, useContext, useEffect, useRef } from 'react';
import { Button, Spinner, Alert, Modal, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../../../context/AuthContext';
import ActionButtons from '../../../common/ActionButtons';
import SortableTable from '../../../common/SortableTable';
import SearchInput from '../../../common/SearchInput/SearchInput';
import FormHeader from '../../../common/FormHeader/FormHeader';
import SteelForm from '../form/SteelForm';
import steelService from '../../../../services/steelService';
import '../../../../styles/dataList.css';
import { useTranslation } from 'react-i18next';
import useModalState from '../../../../hooks/useModalState';
import Pagination from '../../../common/Pagination';
import LimitSelector from '../../../common/LimitSelector';
import useConfirmationDialog from '../../../../hooks/useConfirmationDialog';

const SteelList = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { confirmDelete } = useConfirmationDialog();
  const [steels, setSteels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const limitSelectorRef = useRef(null);
  const steelFormRef = useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  
  // État pour le tri côté serveur
  const [sortBy, setSortBy] = useState('modified_at');
  const [sortOrder, setSortOrder] = useState('desc');  // Déclarer fetchSteels avant de l'utiliser
  const fetchSteels = async () => {
    try {
      console.log('=== FRONTEND SteelList fetchSteels called ===');
      console.log('Paramètres:', { currentPage, itemsPerPage, sortBy, sortOrder, search: searchQuery });
      
      setLoading(true);
      const response = await steelService.getSteels(
        currentPage, 
        itemsPerPage, 
        sortBy, 
        sortOrder, 
        searchQuery.trim() || undefined
      );
      
      console.log('Réponse complète steelService.getSteels:', response);
      
      // Check the structure of the response based on your API
      if (response && response.steels) {
        console.log('Structure trouvée: response.steels');
        console.log('Aciers trouvés:', response.steels);
        console.log('Pagination:', response.pagination);
        
        // If the API returns { steels, pagination }
        setSteels(response.steels);
        
        // Set pagination data
        const { total, limit: responseLimit } = response.pagination || {};
        console.log('Pagination data:', { total, responseLimit });
        
        setTotal(total || 0);
        setTotalPages(Math.ceil((total || 0) / (responseLimit || itemsPerPage)));
        
        // Mettre à jour le total dans le limitSelector
        if (limitSelectorRef.current) {
          limitSelectorRef.current.updateTotal(total || 0);
        }
      } else if (response && response.data && response.data.steels) {
        console.log('Structure trouvée: response.data.steels');
        console.log('Aciers trouvés:', response.data.steels);
        
        setSteels(response.data.steels);
        
        // Set pagination data
        const { total, limit: responseLimit } = response.data.pagination || {};
        setTotal(total || 0);
        setTotalPages(Math.ceil((total || 0) / (responseLimit || itemsPerPage)));
        
        // Mettre à jour le total dans le limitSelector
        if (limitSelectorRef.current) {
          limitSelectorRef.current.updateTotal(total || 0);
        }
      } else if (Array.isArray(response.data)) {
        console.log('Structure trouvée: response.data (array)');
        console.log('Aciers trouvés:', response.data);
        
        // If the API directly returns an array of steels
        setSteels(response.data);
        // Assuming the total count is in a header or elsewhere
        const totalCount = parseInt(response.headers['x-total-count'] || '0');
        setTotal(totalCount);
        setTotalPages(Math.ceil(totalCount / itemsPerPage));
        
        // Mettre à jour le total dans le limitSelector
        if (limitSelectorRef.current) {
          limitSelectorRef.current.updateTotal(totalCount);
        }
      } else {
        console.log('Structure non reconnue:', response);
        setSteels([]);
        setTotal(0);
        setTotalPages(1);
      }
      
      console.log('État final après tri:', {
        steelsCount: steels.length,
        total,
        totalPages,
        sortBy,
        sortOrder
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching steels:', err);
      console.error('Détails erreur:', err.response?.data);
      setError('Une erreur est survenue lors du chargement des aciers.');
    } finally {
      setLoading(false);
    }
  };

  // Utilisation du hook useModalState pour gérer les modales
  const {
    showCreateModal: showCreateForm,
    showEditModal: showEditForm,
    showDetailModal,
    selectedItem: selectedSteel,
    openCreateModal,
    openEditModal,
    openDetailModal,
    closeCreateModal,
    closeEditModal,
    closeDetailModal,
    handleRequestClose,
    handleItemCreated,
    handleItemUpdated
  } = useModalState({
    onRefreshData: fetchSteels
  });  // Vérification des droits utilisateur
  const hasEditRights = user && (user.role === 'admin' || user.role === 'superuser');

  // Fonctions Copy/Paste qui utilisent la référence du formulaire
  const handleCopy = () => {
    if (steelFormRef.current?.handleCopy) {
      steelFormRef.current.handleCopy();
    }
  };

  const handlePaste = () => {
    if (steelFormRef.current?.handlePaste) {
      steelFormRef.current.handlePaste();
    }
  };

  // Configuration des colonnes pour la table triable
  const columns = [
    {
      key: 'Steel.grade',
      label: t('steels.grade'),
      style: { width: '30%' },
      render: (steel) => {
        const steelData = steel.Steel || steel;
        return (
          <div
            onClick={() => handleViewDetails(steel)}
            style={{ cursor: 'pointer' }}
            className="d-flex align-items-center"
          >
            <div className="item-name font-weight-bold text-primary">
              {steelData.grade || t('steels.noGrade')}
            </div>
          </div>
        );
      }
    },
    {
      key: 'Steel.family',
      label: t('steels.family'),
      cellClassName: 'text-center',
      render: (steel) => {
        const steelData = steel.Steel || steel;
        return steelData.family || "-";
      }
    },
    {
      key: 'Steel.standard',
      label: t('steels.standard'),
      cellClassName: 'text-center',
      render: (steel) => {
        const steelData = steel.Steel || steel;
        return steelData.standard || "-";
      }
    },
    {
      key: 'modified_at',
      label: t('common.modifiedAt'),
      cellClassName: 'text-center',
      render: (steel) => {
        const steelData = steel.Steel || steel;
        return (steel.modified_at || steelData.modified_at)
          ? new Date(steel.modified_at || steelData.modified_at).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
          : "-";
      }
    },
    {
      key: 'actions',
      label: t('common.actions'),
      style: { width: hasEditRights ? '150px' : '80px' },
      cellClassName: 'text-center',
      sortable: false,
      render: (steel) => (
        <ActionButtons
          itemId={steel.id || (steel.Steel && steel.Steel.id)}
          onView={(e, id) => {
            handleViewDetails(steel);
          }}
          onEdit={hasEditRights ? (e, id) => {
            handleEditSteel(steel);
          } : undefined}
          onDelete={hasEditRights ? (e, id) => {
            handleDeleteSteel(steel.id || (steel.Steel && steel.Steel.id));
          } : undefined}
          hasEditRights={hasEditRights}
          labels={{
            view: t('common.view'),
            edit: t('common.edit'),
            delete: t('common.delete')
          }}
        />
      )
    }
  ];  useEffect(() => {
    fetchSteels();
  }, [currentPage, itemsPerPage, sortBy, sortOrder]);

  // Fonction pour gérer la recherche
  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1); // Réinitialiser à la première page lors de la recherche
    // Déclencher la recherche immédiatement
    fetchSteels();
  };

  // Fonction pour effacer la recherche
  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Fonction pour gérer le changement de limite d'éléments par page
  const handleLimitChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Réinitialiser à la première page lors du changement de limite
  };
  // Fonction pour gérer le tri côté serveur
  const handleSort = (columnKey, direction) => {
    console.log('=== SteelList handleSort called ===');
    console.log('Tri demandé:', { columnKey, direction });
    console.log('État actuel avant tri:', { sortBy, sortOrder, currentPage });
    
    // Mapper les clés de colonnes vers les champs de base de données
    const sortMapping = {
      'grade': 'grade',
      'Steel.grade': 'grade',
      'family': 'family', 
      'Steel.family': 'family',
      'standard': 'standard',
      'Steel.standard': 'standard',
      'modified_at': 'modified_at'
    };
    
    const dbField = sortMapping[columnKey] || columnKey;
    console.log('Mapping appliqué:', { columnKey, dbField });
    
    setSortBy(dbField);
    setSortOrder(direction);
    setCurrentPage(1); // Retourner à la première page lors du tri
    
    console.log('Nouveaux paramètres définis:', { 
      newSortBy: dbField, 
      newSortOrder: direction, 
      newCurrentPage: 1 
    });
  };

  const handleViewDetails = (steel) => {
    openDetailModal(steel);
  };
  const handleEditSteel = (steel) => {
    openEditModal(steel);
  };
  const handleDeleteSteel = async (steelId) => {
    const steelToDelete = steels.find(s => s.id === steelId);
    const steelName = steelToDelete?.steel?.grade || steelToDelete?.grade || 'cet acier';
    
    const confirmed = await confirmDelete(steelName, 'l\'acier');
    if (confirmed) {
      try {
        await steelService.deleteSteel(steelId);
        alert(t("steels.deleteSuccess"));
        fetchSteels();
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'acier:', err);
        alert(err.response?.data?.message || t("steels.deleteError"));
      }
    }
  };

  if (loading && steels.length === 0) return <div className="text-center my-5"><Spinner animation="border" variant="danger" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FontAwesomeIcon icon={faCodeBranch} className="mr-2 text-danger" />
          {t('steels.title')}
        </h2>
        {hasEditRights && (
          <Button
            variant="danger"
            onClick={openCreateModal}
            className="d-flex align-items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> {t('steels.add')}
          </Button>
        )}
      </div>

      {/* Barre de recherche */}
      <div className="mb-3">
        <SearchInput
          value={searchQuery}
          onSearch={handleSearch}
          onClear={clearSearch}
          placeholder={t('steels.searchPlaceholder', 'Rechercher des aciers...')}
        />
      </div>
      
      {/* Contrôles de pagination */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <LimitSelector 
          ref={limitSelectorRef}
          itemsPerPage={itemsPerPage} 
          onLimitChange={handleLimitChange} 
          totalItems={total}
        />
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Affichage du nombre de résultats */}
      {searchQuery && (
        <div className="mb-3 text-muted">
          {t('steels.showingSearchResults', { count: total, total: total, query: searchQuery })}
        </div>
      )}
        {steels.length > 0 ? (
        <>
          <div className="data-list-container">
            <SortableTable
              data={steels}
              columns={columns}
              hover
              responsive
              className="data-table border-bottom"
              serverSide={true}
              onSort={handleSort}
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
            />
          </div>
          {loading && <div className="text-center mt-3"><Spinner animation="border" size="sm" /></div>}
          
          {/* Pagination en bas de liste si besoin */}
          <div className="d-flex justify-content-center mt-3">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
            <div className="text-muted text-center mt-2">
            {searchQuery ? 
              t('steels.showingSearchResults', { count: steels.length, total: total, query: searchQuery }) :
              t('steels.showing', { count: steels.length, total: total })
            }
          </div>
        </>
      ) : (        <Card className="text-center p-5 bg-light">
          <Card.Body>
            <FontAwesomeIcon icon={faCodeBranch} size="3x" className="text-secondary mb-3" />
            <h4>{searchQuery ? t('steels.noResultsFound') : t('steels.noSteelsFound')}</h4>
            <p className="text-muted">
              {searchQuery ? 
                t('steels.tryDifferentSearch') : 
                t('steels.clickToAddSteel')
              }
            </p>
            {searchQuery && (
              <Button variant="outline-secondary" onClick={clearSearch} className="mt-2">
                {t('common.clearSearch')}
              </Button>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Modal pour créer un acier */}
      <Modal
        show={showCreateForm}
        onHide={closeCreateModal}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <FormHeader 
            title={t('steels.add')}
            onCopy={handleCopy}
            onPaste={handlePaste}
            viewMode={false}
          />
        </Modal.Header>
        <Modal.Body>
          <SteelForm
            onClose={closeCreateModal}
            onSteelCreated={() => {
              fetchSteels();
              closeCreateModal();
            }}
          />
        </Modal.Body>
      </Modal>      {/* Modal pour éditer un acier */}
      <Modal
        show={showEditForm}
        onHide={closeEditModal}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <FormHeader 
            title={t('steels.edit')}
            onCopy={handleCopy}
            onPaste={handlePaste}
            viewMode={false}
          />
        </Modal.Header>
        <Modal.Body>
          {selectedSteel && (
            <SteelForm
              steel={selectedSteel}
              onClose={closeEditModal}
              onSteelUpdated={() => {
                // Forcer le rechargement de toutes les données
                fetchSteels();
                closeEditModal();
                // Optionnel : ajouter un petit délai pour s'assurer que la base est à jour
                setTimeout(() => {
                  fetchSteels();
                }, 500);
              }}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour voir les détails - utilise SteelForm en mode lecture seule */}
      <Modal
        show={showDetailModal}
        onHide={closeDetailModal}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <FormHeader 
            title={t('steels.details')}
            onCopy={handleCopy}
            onPaste={handlePaste}
            viewMode={true}
          />
        </Modal.Header>
        <Modal.Body>
          {selectedSteel && (
            <SteelForm
              steel={selectedSteel}
              onClose={closeDetailModal}
              viewMode={true} // Active le mode lecture seule
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default SteelList;
