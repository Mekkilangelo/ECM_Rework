import React, { useState, useMemo, useEffect } from 'react';
import { Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import './SortableTable.css';

/**
 * Composant de table triable réutilisable
 * Supporte le tri côté client et côté serveur
 */
const SortableTable = ({
  data = [],
  columns = [],
  onRowClick,
  className = '',
  hover = true,
  responsive = true,
  bordered = false,
  striped = false,
  size = null,
  defaultSortBy = null,
  defaultSortOrder = 'asc',
  // Nouvelles props pour le tri côté serveur
  serverSide = false,
  onSort = null,
  currentSortBy = null,
  currentSortOrder = 'asc'
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: serverSide ? currentSortBy : defaultSortBy,
    direction: serverSide ? currentSortOrder : defaultSortOrder
  });

  // Mettre à jour le state local quand les props server-side changent
  useEffect(() => {
    if (serverSide) {
      setSortConfig({
        key: currentSortBy,
        direction: currentSortOrder
      });
    }
  }, [serverSide, currentSortBy, currentSortOrder]);

  // Fonction pour trier les données (côté client uniquement)
  const sortedData = useMemo(() => {
    if (serverSide) {
      // Si tri côté serveur, retourner les données telles quelles
      return data;
    }

    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const column = columns.find(col => col.key === sortConfig.key);
      
      let aValue = column.sortValue ? column.sortValue(a) : getNestedValue(a, sortConfig.key);
      let bValue = column.sortValue ? column.sortValue(b) : getNestedValue(b, sortConfig.key);

      // Gestion des valeurs nulles/undefined
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // Conversion en string pour comparaison si nécessaire
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig, columns, serverSide]);

  // Fonction pour obtenir une valeur imbriquée (ex: "Client.name")
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  };
  // Fonction pour gérer le clic sur un en-tête de colonne
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);
    
    // Si tri côté serveur, appeler la fonction de callback
    if (serverSide && onSort) {
      onSort(key, direction);
    }
  };
  // Fonction pour obtenir l'icône de tri
  const getSortIcon = (columnKey) => {
    const currentKey = serverSide ? currentSortBy : sortConfig.key;
    const currentDirection = serverSide ? currentSortOrder : sortConfig.direction;
    
    // En mode serverSide, nous devons vérifier si la colonne correspond au tri actuel
    // en tenant compte des mappings possibles
    let isCurrentColumn = false;
    
    if (serverSide) {
      // Rechercher si cette colonne correspond au tri actuel
      // Soit directement, soit après mapping
      if (currentKey === columnKey) {
        isCurrentColumn = true;
      } else {
        // Vérifier les mappings courants pour les colonnes composées
        const commonMappings = {
          // Clients
          'Client.client_group': 'client_group',
          'Client.country': 'country',
          'Client.city': 'city',
          // Orders
          'Order.commercial': 'commercial',
          'Order.order_date': 'order_date',
          // Parts
          'Part.client_designation': 'client_designation',
          'Part.reference': 'reference',
          'Part.steel': 'steel',
          'Part.quantity': 'quantity',
          // Tests
          'Test.load_number': 'load_number',
          'Test.test_date': 'test_date',
          'Test.location': 'location',
          // Steels
          'Steel.grade': 'grade',
          'Steel.family': 'family',
          'Steel.standard': 'standard'
        };
        
        if (commonMappings[columnKey] === currentKey) {
          isCurrentColumn = true;
        }
      }
    } else {
      isCurrentColumn = currentKey === columnKey;
    }
    
    if (!isCurrentColumn) {
      return <FontAwesomeIcon icon={faSort} className="sort-icon inactive" />;
    }
    return currentDirection === 'asc' 
      ? <FontAwesomeIcon icon={faSortUp} className="sort-icon active" />
      : <FontAwesomeIcon icon={faSortDown} className="sort-icon active" />;
  };

  return (
    <Table 
      hover={hover}
      responsive={responsive}
      bordered={bordered}
      striped={striped}
      size={size}
      className={`sortable-table ${className}`}
    >
      <thead>
        <tr className="bg-light">
          {columns.map((column) => (
            <th
              key={column.key}
              style={column.style}
              className={`sortable-header ${column.className || ''} ${column.sortable !== false ? 'clickable' : ''}`}
              onClick={column.sortable !== false ? () => handleSort(column.key) : undefined}
            >
              <div className="d-flex align-items-center justify-content-between">
                <span>{column.label}</span>
                {column.sortable !== false && (
                  <span className="sort-icon-container">
                    {getSortIcon(column.key)}
                  </span>
                )}
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedData.map((row, index) => (
          <tr
            key={row.id || index}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={onRowClick ? 'clickable-row' : ''}
          >
            {columns.map((column) => (
              <td
                key={`${row.id || index}-${column.key}`}
                className={column.cellClassName}
                style={column.cellStyle}
              >
                {column.render ? column.render(row, getNestedValue(row, column.key)) : getNestedValue(row, column.key)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

SortableTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    render: PropTypes.func,
    sortable: PropTypes.bool,
    sortValue: PropTypes.func,
    style: PropTypes.object,
    className: PropTypes.string,
    cellClassName: PropTypes.string,
    cellStyle: PropTypes.object
  })).isRequired,
  onRowClick: PropTypes.func,
  className: PropTypes.string,
  hover: PropTypes.bool,
  responsive: PropTypes.bool,
  bordered: PropTypes.bool,
  striped: PropTypes.bool,
  size: PropTypes.string,
  defaultSortBy: PropTypes.string,
  defaultSortOrder: PropTypes.oneOf(['asc', 'desc']),
  // Props pour le tri côté serveur
  serverSide: PropTypes.bool,
  onSort: PropTypes.func,
  currentSortBy: PropTypes.string,
  currentSortOrder: PropTypes.oneOf(['asc', 'desc'])
};

export default SortableTable;
