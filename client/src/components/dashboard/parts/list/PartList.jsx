import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '../../../../context/NavigationContext';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import GenericEntityList from '../../../common/GenericEntityList/GenericEntityList';
import PartForm from '../form/PartForm';
import partService from '../../../../services/partService';
import {
  createClickableNameColumn,
  createTextColumn,
  createDateColumn
} from '../../../common/GenericEntityList/columnHelpers';

const PartList = ({ orderId }) => {
  const { t } = useTranslation();
  const { navigateToLevel, hierarchyState } = useNavigation();

  const columns = (handlers) => {
    const handlePartClick = async (part) => {
      // Marquer comme vu si nouveau
      if (part.data_status === 'new' && handlers.updateItemStatus) {
        await handlers.updateItemStatus(part.id);
      }
      navigateToLevel('trial', part.id, part.name);
    };

    return [
      createClickableNameColumn({
        key: 'name',
        label: t('parts.designation'),
        onClick: handlePartClick,
        getValue: (part) => part.name,
        getStatus: (part) => part.data_status,
        noValueText: t('common.unknown')
      }),
      createTextColumn({
        key: 'Part.client_designation',
        label: t('parts.clientDesignation'),
        getValue: (part) => part.part?.client_designation,
        centered: true,
        emptyText: '-'
      }),
      createTextColumn({
        key: 'Part.reference',
        label: t('parts.reference'),
        getValue: (part) => part.part?.reference,
        centered: true,
        emptyText: '-'
      }),
      createTextColumn({
        key: 'Part.steel',
        label: t('parts.steel.title'),
        getValue: (part) => {
          if (part.steel && part.steel.grade) {
            return part.steel.standard 
              ? `${part.steel.grade} (${part.steel.standard})`
              : part.steel.grade;
          }
          return null;
        },
        centered: true,
        emptyText: '-'
      }),
      createTextColumn({
        key: 'Part.quantity',
        label: t('parts.quantity'),
        getValue: (part) => part.part?.quantity,
        centered: true,
        emptyText: '-'
      }),
      createDateColumn({
        key: 'modified_at',
        label: t('common.modifiedAt'),
        getValue: (part) => part.modified_at,
        emptyText: t('common.unknown')
      })
    ];
  };

  return (
    <GenericEntityList
      entityName="parts"
      entityType="part"
      icon={faCog}
      columns={columns}
      FormComponent={PartForm}
      service={{
        delete: partService.deletePart
      }}
      useHierarchyMode={true}
      modalSize="xl"
      getItemName={(part) => part?.name || 'cette pièce'}
      includeActionsColumn={true}
      formProps={{
        orderId: orderId
      }}
      contextDisplay={hierarchyState.orderName}
    />
  );
};

export default PartList;
