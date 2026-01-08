import React from 'react';
import StatusBadge from '../StatusBadge/StatusBadge';

/**
 * Helper utilities for building table column configurations
 * Used with GenericEntityList component
 *
 * Note: Actions column is automatically handled by GenericEntityList
 */

/**
 * Creates a clickable name column with optional status badge
 *
 * @param {Object} params
 * @param {string} params.key - Column key (e.g., 'name')
 * @param {string} params.label - Column label
 * @param {Function} params.onClick - Click handler
 * @param {Function} params.getValue - Function to extract value from item
 * @param {Function} params.getStatus - Optional function to extract status
 * @param {string} params.noValueText - Text when value is empty
 * @returns {Object} Column configuration
 */
export const createClickableNameColumn = ({
  key,
  label,
  onClick,
  getValue,
  getStatus,
  noValueText = '-'
}) => ({
  key,
  label,
  style: { width: '30%' },
  render: (item) => (
    <div
      onClick={() => onClick && onClick(item)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      className="d-flex align-items-center"
    >
      <div className={`item-name font-weight-bold ${onClick ? 'text-primary' : ''}`}>
        {getValue(item) || noValueText}
      </div>
      {getStatus && (
        <div className="ml-2">
          <StatusBadge status={getStatus(item)} />
        </div>
      )}
    </div>
  ),
  sortValue: (item) => getValue(item) || ''
});

/**
 * Creates a simple text column
 *
 * @param {Object} params
 * @param {string} params.key - Column key
 * @param {string} params.label - Column label
 * @param {Function} params.getValue - Function to extract value from item
 * @param {boolean} params.centered - Whether to center text (default: true)
 * @param {string} params.emptyText - Text when value is empty (default: '-')
 * @returns {Object} Column configuration
 */
export const createTextColumn = ({
  key,
  label,
  getValue,
  centered = true,
  emptyText = '-'
}) => ({
  key,
  label,
  cellClassName: centered ? 'text-center' : '',
  render: (item) => getValue(item) || emptyText,
  sortValue: (item) => getValue(item) || ''
});

/**
 * Creates a date column with formatted display
 *
 * @param {Object} params
 * @param {string} params.key - Column key (default: 'modified_at')
 * @param {string} params.label - Column label
 * @param {Function} params.getValue - Function to extract date value
 * @param {string} params.locale - Locale for formatting (default: 'fr-FR')
 * @param {string} params.emptyText - Text when value is empty
 * @returns {Object} Column configuration
 */
export const createDateColumn = ({
  key = 'modified_at',
  label,
  getValue,
  locale = 'fr-FR',
  emptyText = '-'
}) => ({
  key,
  label,
  cellClassName: 'text-center',
  render: (item) => {
    const value = getValue(item);
    return value
      ? new Date(value).toLocaleString(locale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : emptyText;
  },
  sortValue: (item) => {
    const value = getValue(item);
    return value ? new Date(value).getTime() : 0;
  }
});

/**
 * Creates a nested property column (e.g., client.country)
 *
 * @param {Object} params
 * @param {string} params.key - Column key (e.g., 'client.country')
 * @param {string} params.label - Column label
 * @param {string} params.path - Dot notation path (e.g., 'client.country')
 * @param {boolean} params.centered - Whether to center text (default: true)
 * @param {string} params.emptyText - Text when value is empty (default: '-')
 * @returns {Object} Column configuration
 */
export const createNestedColumn = ({
  key,
  label,
  path,
  centered = true,
  emptyText = '-'
}) => {
  const getValue = (item) => {
    return path.split('.').reduce((obj, prop) => obj?.[prop], item);
  };

  return {
    key,
    label,
    cellClassName: centered ? 'text-center' : '',
    render: (item) => getValue(item) || emptyText,
    sortValue: (item) => getValue(item) || ''
  };
};
