import React from 'react';
import { faBuilding } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '../../../../context/NavigationContext';
import { useTranslation } from 'react-i18next';
import { useHierarchy } from '../../../../hooks/useHierarchy';
import GenericEntityList from '../../../common/GenericEntityList';
import {
  createClickableNameColumn,
  createNestedColumn,
  createDateColumn
} from '../../../common/GenericEntityList/columnHelpers';
import ClientForm from '../form/ClientForm';
import clientService from '../../../../services/clientService';
import PropTypes from 'prop-types';

const ClientList = ({ onDataChanged }) => {
  const { t } = useTranslation();
  const { navigateToLevel } = useNavigation();
  const { updateItemStatus } = useHierarchy();

  // Handle client click for navigation
  const handleClientClick = (client) => {
    if (client.data_status === 'new') {
      updateItemStatus(client.id);
    }
    navigateToLevel('trial_request', client.id, client.name);
  };

  // Column configuration (no actions column - handled by GenericEntityList)
  const columns = [
    createClickableNameColumn({
      key: 'name',
      label: t('clients.name'),
      onClick: handleClientClick,
      getValue: (client) => client.name,
      getStatus: (client) => client.data_status,
      noValueText: t('clients.noName')
    }),
    createNestedColumn({
      key: 'client.client_group',
      label: t('clients.group'),
      path: 'client.client_group'
    }),
    createNestedColumn({
      key: 'client.country',
      label: t('clients.country'),
      path: 'client.country'
    }),
    createNestedColumn({
      key: 'client.city',
      label: t('clients.city'),
      path: 'client.city'
    }),
    createDateColumn({
      key: 'modified_at',
      label: t('common.modifiedAt'),
      getValue: (client) => client.modified_at,
      emptyText: t('common.unknown')
    })
  ];

  return (
    <GenericEntityList
      entityName="clients"
      entityType="client"
      icon={faBuilding}
      columns={columns}
      FormComponent={ClientForm}
      service={{
        delete: clientService.deleteClient
      }}
      onDataChanged={onDataChanged}
      useHierarchyMode={true}
      modalSize="xl"
      getItemName={(client) => client?.name || 'ce client'}
      includeActionsColumn={true}
    />
  );
};

ClientList.propTypes = {
  onDataChanged: PropTypes.func
};

export default ClientList;
