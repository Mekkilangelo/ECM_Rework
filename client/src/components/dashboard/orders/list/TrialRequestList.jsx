import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '../../../../context/NavigationContext';
import { faFileInvoice } from '@fortawesome/free-solid-svg-icons';
import GenericEntityList from '../../../common/GenericEntityList/GenericEntityList';
import TrialRequestForm from '../form/TrialRequestForm';
import trialRequestService from '../../../../services/trialRequestService';
import {
  createClickableNameColumn,
  createTextColumn,
  createDateColumn
} from '../../../common/GenericEntityList/columnHelpers';

const TrialRequestList = () => {
  const { t } = useTranslation();
  const { navigateToLevel, hierarchyState } = useNavigation();

  const columns = (handlers) => {
    const handleOrderClick = async (order) => {
      // Marquer comme vu si nouveau
      if (order.data_status === 'new' && handlers.updateItemStatus) {
        await handlers.updateItemStatus(order.id);
      }
      navigateToLevel('part', order.id, order.name);
    };

    return [
      createClickableNameColumn({
        key: 'name',
        label: t('orders.reference'),
        onClick: handleOrderClick,
        getValue: (order) => order.name,
        getStatus: (order) => order.data_status,
        noValueText: t('orders.noReference')
      }),
      createTextColumn({
        key: 'trialRequest.commercial',
        label: t('orders.commercial'),
        getValue: (order) => order.trialRequest?.commercial,
        centered: true,
        emptyText: '-'
      }),
      createDateColumn({
        key: 'trialRequest.request_date',
        label: t('orders.date'),
        getValue: (order) => order.trialRequest?.request_date,
        emptyText: t('common.unknown'),
        format: { day: '2-digit', month: '2-digit', year: 'numeric' }
      }),
      createDateColumn({
        key: 'modified_at',
        label: t('common.modifiedAt'),
        getValue: (order) => order.modified_at,
        emptyText: t('common.unknown')
      })
    ];
  };

  return (
    <GenericEntityList
      entityName="orders"
      entityType="order"
      icon={faFileInvoice}
      columns={columns}
      FormComponent={TrialRequestForm}
      service={{
        delete: trialRequestService.deleteTrialRequest
      }}
      useHierarchyMode={true}
      modalSize="xl"
      getItemName={(order) => order?.name || 'cette demande d\'essai'}
      includeActionsColumn={true}
      formProps={{
        clientId: hierarchyState.clientId
      }}
      contextDisplay={hierarchyState.clientName}
    />
  );
};

export default TrialRequestList;
