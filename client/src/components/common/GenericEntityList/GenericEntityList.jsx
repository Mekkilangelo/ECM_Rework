import React, { useContext, useRef, useState, useEffect } from 'react';
import { Button, Spinner, Alert, Modal, Card, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../../context/AuthContext';
import { useNavigation } from '../../../context/NavigationContext';
import { useTranslation } from 'react-i18next';
import { useHierarchy } from '../../../hooks/useHierarchy';
import useModalState from '../../../hooks/useModalState';
import useConfirmationDialog from '../../../hooks/useConfirmationDialog';
import SortableTable from '../SortableTable';
import SearchInput from '../SearchInput/SearchInput';
import FormHeader from '../FormHeader/FormHeader';
import ActionButtons from '../ActionButtons';
import Pagination from '../Pagination/Pagination';
import LimitSelector from '../LimitSelector/LimitSelector';
import PropTypes from 'prop-types';
import '../../../styles/dataList.css';
import logger from '../../../utils/logger';

/**
 * Generic Entity List Component
 *
 * Abstracts common list functionality for all entities (Clients, Orders, Parts, Steels, Tests)
 * Supports two data fetching strategies:
 * 1. Hierarchical (using useHierarchy hook with NavigationContext)
 * 2. Independent (using local state with direct service calls)
 *
 * @param {Object} config - Configuration object
 * @param {string} config.entityName - Entity name for i18n (e.g., 'clients', 'steels')
 * @param {string} config.entityType - Entity type for logging (e.g., 'client', 'steel')
 * @param {Object} config.icon - FontAwesome icon component
 * @param {Function|Array} config.columns - Column configuration or function (handlers) => columns
 * @param {React.Component} config.FormComponent - Form component for Create/Edit/View
 * @param {Object} config.service - Service object with CRUD methods
 * @param {Function} config.onItemClick - Optional: Handler for item click (hierarchical navigation)
 * @param {Function} config.onDataChanged - Optional: Callback when data changes
 * @param {boolean} config.useHierarchy - Whether to use useHierarchy hook (default: true)
 * @param {Object} config.customDeleteModal - Optional: Custom delete modal component
 * @param {string} config.modalSize - Modal size (default: 'xl')
 * @param {boolean} config.showPagination - Show pagination controls (for independent lists)
 * @param {Function} config.getItemName - Function to extract item name for delete confirmation
 * @param {string} config.defaultSortBy - Default sort field
 * @param {string} config.defaultSortOrder - Default sort order ('asc' or 'desc')
 * @param {boolean} config.includeActionsColumn - Whether to include actions column (default: true)
 * @param {Function} config.onDelete - Custom delete handler (overrides default)
 */
const GenericEntityList = ({
  entityName,
  entityType,
  icon,
  columns: columnsConfig,
  FormComponent,
  service,
  onItemClick,
  onDataChanged,
  useHierarchyMode = true,
  customDeleteModal: CustomDeleteModal,
  modalSize = 'xl',
  showPagination = false,
  getItemName,
  defaultSortBy = 'modified_at',
  defaultSortOrder = 'desc',
  includeActionsColumn = true,
  onDelete: customDeleteHandler,
  formProps = {},
  contextDisplay,
  customFormWrapper = false
}) => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { navigateBack } = useNavigation();
  const { confirmDelete } = useConfirmationDialog();
  const formRef = useRef(null);
  const limitSelectorRef = useRef(null);

  // State for independent mode (non-hierarchical)
  const [independentData, setIndependentData] = useState([]);
  const [independentLoading, setIndependentLoading] = useState(true);
  const [independentError, setIndependentError] = useState(null);
  const [independentSearchQuery, setIndependentSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [independentSortBy, setIndependentSortBy] = useState(defaultSortBy);
  const [independentSortOrder, setIndependentSortOrder] = useState(defaultSortOrder);

  // Hierarchical mode (useHierarchy hook) - Always call to comply with Rules of Hooks
  const hierarchyData = useHierarchy();

  // Determine which data source to use
  const data = useHierarchyMode ? hierarchyData.data : independentData;
  const loading = useHierarchyMode ? hierarchyData.loading : independentLoading;
  const error = useHierarchyMode ? hierarchyData.error : independentError;
  const searchQuery = useHierarchyMode ? hierarchyData.searchQuery : independentSearchQuery;
  const sortBy = useHierarchyMode ? hierarchyData.sortBy : independentSortBy;
  const sortOrder = useHierarchyMode ? hierarchyData.sortOrder : independentSortOrder;

  // Fetch data for independent mode
  const fetchIndependentData = async () => {
    if (useHierarchyMode || !service?.getAll) return;

    try {
      setIndependentLoading(true);
      const response = await service.getAll(
        currentPage,
        itemsPerPage,
        independentSortBy,
        independentSortOrder,
        independentSearchQuery.trim() || undefined
      );

      // Handle different response structures
      let items = [];
      let totalCount = 0;

      if (response && response.data && Array.isArray(response.data)) {
        items = response.data;
        totalCount = response.pagination?.total || response.total || items.length;
      } else if (response && Array.isArray(response)) {
        items = response;
        totalCount = items.length;
      } else if (response && response[entityName]) {
        items = response[entityName];
        totalCount = response.pagination?.total || items.length;
      }

      setIndependentData(items);
      setTotal(totalCount);
      setTotalPages(Math.ceil(totalCount / itemsPerPage));

      if (limitSelectorRef.current) {
        limitSelectorRef.current.updateTotal(totalCount);
      }

      setIndependentError(null);
    } catch (err) {
      logger.error('ui', `Failed to fetch ${entityName}`, err);
      setIndependentError(t(`${entityName}.fetchError`, 'Une erreur est survenue lors du chargement.'));
    } finally {
      setIndependentLoading(false);
    }
  };

  // Effect for independent mode data fetching
  useEffect(() => {
    if (!useHierarchyMode) {
      fetchIndependentData();
    }
  }, [currentPage, itemsPerPage, independentSortBy, independentSortOrder]);

  // Refresh data function
  const refreshData = useHierarchyMode
    ? async () => {
        await hierarchyData.refreshData();
        if (onDataChanged) onDataChanged();
      }
    : async () => {
        await fetchIndependentData();
        if (onDataChanged) onDataChanged();
      };

  // Modal state management
  const {
    showCreateModal,
    showEditModal,
    showDetailModal,
    selectedItem,
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
    onRefreshData: refreshData
  });

  const hasEditRights = user && (user.role === 'admin' || user.role === 'superuser');

  // Copy/Paste handlers
  const handleCopy = () => {
    if (formRef.current?.handleCopy) {
      formRef.current.handleCopy();
    }
  };

  const handlePaste = () => {
    if (formRef.current?.handlePaste) {
      formRef.current.handlePaste();
    }
  };

  // Search handlers
  const handleSearch = useHierarchyMode
    ? hierarchyData.handleSearch
    : (query) => {
        setIndependentSearchQuery(query);
        setCurrentPage(1);
      };

  const clearSearch = useHierarchyMode
    ? hierarchyData.clearSearch
    : () => {
        setIndependentSearchQuery('');
        setCurrentPage(1);
      };

  // Sort handler
  const handleSort = useHierarchyMode
    ? hierarchyData.handleSort
    : (columnKey, direction) => {
        setIndependentSortBy(columnKey);
        setIndependentSortOrder(direction);
        setCurrentPage(1);
      };

  // Delete handler
  const handleDelete = async (itemId) => {
    if (customDeleteHandler) {
      await customDeleteHandler(itemId, { data, refreshData });
      return;
    }

    const itemToDelete = data.find(item => item.id === itemId);
    const itemName = getItemName ? getItemName(itemToDelete) : itemToDelete?.name || `${entityType}`;

    const confirmed = await confirmDelete(itemName, `${t(`${entityName}.singular`, entityType)}`);
    if (confirmed) {
      try {
        await service.delete(itemId);
        logger.info('ui', `${entityType} deleted successfully`, { itemId });
        await refreshData();
      } catch (err) {
        logger.error('ui', `Failed to delete ${entityType}`, err, { itemId });
        alert(err.response?.data?.message || t(`${entityName}.deleteError`));
      }
    }
  };

  // Build columns with action handlers
  const handlers = {
    openDetailModal,
    openEditModal,
    handleDelete,
    t,
    hasEditRights
  };

  // Support columns as function or array
  const baseColumns = typeof columnsConfig === 'function'
    ? columnsConfig(handlers)
    : columnsConfig;

  // Add actions column if needed
  const columns = includeActionsColumn
    ? [
        ...baseColumns,
        {
          key: 'actions',
          label: t('common.actions'),
          style: { width: hasEditRights ? '120px' : '80px' },
          cellClassName: 'text-center',
          sortable: false,
          render: (item) => (
            <ActionButtons
              itemId={item.id}
              onView={(e, id) => openDetailModal(item)}
              onEdit={hasEditRights ? (e, id) => openEditModal(item) : undefined}
              onDelete={hasEditRights ? (e, id) => handleDelete(id) : undefined}
              hasEditRights={hasEditRights}
              labels={{
                view: t('common.view'),
                edit: t('common.edit'),
                delete: t('common.delete')
              }}
            />
          )
        }
      ]
    : baseColumns;

  // Pagination handlers (independent mode)
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  // Build callback prop names dynamically (e.g., onClientCreated, onClientUpdated)
  const capitalizedEntityType = entityType.charAt(0).toUpperCase() + entityType.slice(1);
  const onCreatedPropName = `on${capitalizedEntityType}Created`;
  const onUpdatedPropName = `on${capitalizedEntityType}Updated`;

  // Render loading state
  if (loading && data.length === 0) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <>
      {/* Header with title and add button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          {useHierarchyMode && (
            <Button
              variant="outline-secondary"
              className="mr-3"
              onClick={navigateBack}
              size="sm"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </Button>
          )}
          <h2 className="mb-0">
            {icon && <FontAwesomeIcon icon={icon} className="mr-2 text-danger" />}
            {t(`${entityName}.title`)}
            {contextDisplay && ` - ${contextDisplay}`}
          </h2>
        </div>
        {hasEditRights && (
          <Button
            variant="danger"
            onClick={openCreateModal}
            className="d-flex align-items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            {t(`${entityName}.add`)}
          </Button>
        )}
      </div>

      {/* Search bar */}
      <Row className="mb-3">
        <Col md={6}>
          <SearchInput
            onSearch={handleSearch}
            onClear={clearSearch}
            placeholder={t(`${entityName}.searchPlaceholder`)}
            initialValue={searchQuery}
            className="mb-0"
          />
        </Col>
        {searchQuery && (
          <Col md={6} className="d-flex align-items-center">
            <small className="text-muted">
              {t('search.totalResults', { count: data.length })}
            </small>
          </Col>
        )}
      </Row>

      {/* Pagination controls (independent mode) */}
      {showPagination && !useHierarchyMode && (
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
      )}

      {/* Table or empty state */}
      {data.length > 0 ? (
        <>
          <div className="data-list-container">
            <SortableTable
              data={data}
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

          {/* Bottom pagination (independent mode) */}
          {showPagination && !useHierarchyMode && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <Card className="text-center p-5 bg-light">
          <Card.Body>
            {icon && <FontAwesomeIcon icon={icon} size="3x" className="text-secondary mb-3" />}
            <h4>
              {searchQuery
                ? t(`${entityName}.noResultsFound`)
                : t(`${entityName}.noItemsFound`)}
            </h4>
            <p className="text-muted">
              {searchQuery
                ? t(`${entityName}.tryDifferentSearch`)
                : t(`${entityName}.clickToAdd`)}
            </p>
          </Card.Body>
        </Card>
      )}

      {/* Create Modal */}
      {customFormWrapper ? (
        <FormComponent
          ref={formRef}
          show={showCreateModal}
          onHide={closeCreateModal}
          onClose={closeCreateModal}
          {...{ [onCreatedPropName]: handleItemCreated }}
          title={t(`${entityName}.add`)}
          onCopy={handleCopy}
          onPaste={handlePaste}
          viewMode={false}
          {...formProps}
        />
      ) : (
        <Modal
          show={showCreateModal}
          onHide={() => handleRequestClose('create', formRef)}
          size={modalSize}
        >
          <Modal.Header closeButton className="bg-light">
            <FormHeader
              title={t(`${entityName}.add`)}
              onCopy={handleCopy}
              onPaste={handlePaste}
              viewMode={false}
            />
          </Modal.Header>
          <Modal.Body>
            <FormComponent
              ref={formRef}
              onClose={closeCreateModal}
              {...{ [onCreatedPropName]: handleItemCreated }}
              {...formProps}
            />
          </Modal.Body>
        </Modal>
      )}

      {/* Edit Modal */}
      {customFormWrapper ? (
        <FormComponent
          ref={formRef}
          show={showEditModal}
          onHide={() => handleRequestClose('edit', formRef)}
          {...{ [entityType]: selectedItem }}
          onClose={closeEditModal}
          {...{ [onUpdatedPropName]: handleItemUpdated }}
          title={t(`${entityName}.edit`)}
          onCopy={handleCopy}
          onPaste={handlePaste}
          viewMode={false}
          {...formProps}
        />
      ) : (
        <Modal
          show={showEditModal}
          onHide={() => handleRequestClose('edit', formRef)}
          size={modalSize}
        >
          <Modal.Header closeButton className="bg-light">
            <FormHeader
              title={t(`${entityName}.edit`)}
              onCopy={handleCopy}
              onPaste={handlePaste}
              viewMode={false}
            />
          </Modal.Header>
          <Modal.Body>
            {selectedItem && (
              <FormComponent
                ref={formRef}
                {...{ [entityType]: selectedItem }}
                onClose={closeEditModal}
                {...{ [onUpdatedPropName]: handleItemUpdated }}
                {...formProps}
              />
            )}
          </Modal.Body>
        </Modal>
      )}

      {/* Detail Modal */}
      {customFormWrapper ? (
        <FormComponent
          show={showDetailModal}
          onHide={() => handleRequestClose('detail', formRef)}
          {...{ [entityType]: selectedItem }}
          onClose={closeDetailModal}
          title={t(`${entityName}.details`)}
          onCopy={handleCopy}
          onPaste={handlePaste}
          viewMode={true}
          {...formProps}
        />
      ) : (
        <Modal
          show={showDetailModal}
          onHide={() => handleRequestClose('detail', formRef)}
          size={modalSize}
        >
          <Modal.Header closeButton className="bg-light">
            <FormHeader
              title={t(`${entityName}.details`)}
              onCopy={handleCopy}
              onPaste={handlePaste}
              viewMode={true}
            />
          </Modal.Header>
          <Modal.Body>
            {selectedItem && (
              <FormComponent
                ref={formRef}
                {...{ [entityType]: selectedItem }}
                onClose={closeDetailModal}
                viewMode={true}
                {...formProps}
              />
            )}
          </Modal.Body>
        </Modal>
      )}

      {/* Custom Delete Modal (if provided) */}
      {CustomDeleteModal && (
        <CustomDeleteModal
          data={data}
          onRefresh={refreshData}
          hasEditRights={hasEditRights}
        />
      )}
    </>
  );
};

GenericEntityList.propTypes = {
  entityName: PropTypes.string.isRequired,
  entityType: PropTypes.string.isRequired,
  icon: PropTypes.object,
  columns: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.object),
    PropTypes.func
  ]).isRequired,
  FormComponent: PropTypes.elementType.isRequired,
  service: PropTypes.shape({
    getAll: PropTypes.func,
    delete: PropTypes.func
  }).isRequired,
  onItemClick: PropTypes.func,
  onDataChanged: PropTypes.func,
  useHierarchyMode: PropTypes.bool,
  customDeleteModal: PropTypes.elementType,
  modalSize: PropTypes.string,
  showPagination: PropTypes.bool,
  getItemName: PropTypes.func,
  defaultSortBy: PropTypes.string,
  defaultSortOrder: PropTypes.oneOf(['asc', 'desc']),
  includeActionsColumn: PropTypes.bool,
  onDelete: PropTypes.func,
  formProps: PropTypes.object,
  contextDisplay: PropTypes.string,
  customFormWrapper: PropTypes.bool
};

export default GenericEntityList;
