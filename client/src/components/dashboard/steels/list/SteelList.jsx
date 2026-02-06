import React, { useContext, useRef } from 'react';
import { faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import GenericEntityList from '../../../common/GenericEntityList';
import {
  createClickableNameColumn,
  createTextColumn,
  createDateColumn
} from '../../../common/GenericEntityList/columnHelpers';
import SteelForm from '../form/SteelForm';
import steelService from '../../../../services/steelService';
import DeleteWithUsageModal from '../../../common/DeleteWithUsageModal/DeleteWithUsageModal';
import { toast } from 'react-toastify';
import useConfirmationDialog from '../../../../hooks/useConfirmationDialog';

const SteelList = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { confirmDelete } = useConfirmationDialog();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [steelToDelete, setSteelToDelete] = React.useState(null);
  const [steelUsage, setSteelUsage] = React.useState(null);
  const [availableSteels, setAvailableSteels] = React.useState([]);
  const refreshDataRef = useRef(null);

  const hasEditRights = user && (user.role === 'admin' || user.role === 'superuser');

  // Custom delete handler with usage check
  const handleDeleteSteel = async (steelId, { data, refreshData }) => {
    // Store refreshData for modal callbacks
    refreshDataRef.current = refreshData;

    const steelToDelete = data.find(s => s.id === steelId);
    const steelData = steelToDelete?.Steel || steelToDelete;
    const steelName = steelData?.grade || 'cet acier';

    try {
      // Check steel usage
      const usage = await steelService.checkSteelUsage(steelId);

      if (usage.isUsed && usage.totalCount > 0) {
        // Show modal if steel is used
        setSteelToDelete({ id: steelId, name: steelName });
        setSteelUsage(usage);
        setAvailableSteels(data);
        setShowDeleteModal(true);
      } else {
        // Delete directly if not used
        const confirmed = await confirmDelete(steelName, "l'acier");
        if (confirmed) {
          await steelService.deleteSteel(steelId);
          toast.success(t('steels.deleteSuccess'));
          await refreshData();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('steels.deleteError'));
    }
  };

  const handleDeleteForce = async () => {
    if (!steelToDelete) return;

    try {
      await steelService.forceDeleteSteel(steelToDelete.id);
      toast.success(t('steels.deleteSuccess'));
      setShowDeleteModal(false);
      setSteelToDelete(null);
      setSteelUsage(null);
      if (refreshDataRef.current) await refreshDataRef.current();
    } catch (err) {
      toast.error(err.response?.data?.message || t('steels.deleteError'));
    }
  };

  const handleReplaceSteelAndDelete = async (oldSteelName, newSteelId) => {
    if (!steelToDelete) return;

    try {
      await steelService.replaceSteelAndDelete(steelToDelete.id, newSteelId);
      toast.success(t('steels.replaceSuccess', { defaultValue: 'Acier remplacé et supprimé avec succès' }));
      setShowDeleteModal(false);
      setSteelToDelete(null);
      setSteelUsage(null);
      if (refreshDataRef.current) await refreshDataRef.current();
    } catch (err) {
      toast.error(err.response?.data?.message || t('steels.replaceError', { defaultValue: 'Erreur lors du remplacement de l\'acier' }));
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSteelToDelete(null);
    setSteelUsage(null);
  };

  // Column configuration
  const columns = [
    createClickableNameColumn({
      key: 'steel.grade',
      label: t('steels.grade'),
      onClick: null, // View handled by GenericEntityList
      getValue: (steel) => {
        const steelData = steel.Steel || steel;
        return steelData.grade;
      },
      noValueText: t('steels.noGrade')
    }),
    createTextColumn({
      key: 'steel.family',
      label: t('steels.family'),
      getValue: (steel) => {
        const steelData = steel.Steel || steel;
        return steelData.family;
      },
      centered: true,
      emptyText: '-'
    }),
    createTextColumn({
      key: 'steel.standard',
      label: t('steels.standard'),
      getValue: (steel) => {
        const steelData = steel.Steel || steel;
        return steelData.standard;
      },
      centered: true,
      emptyText: '-'
    }),
    createDateColumn({
      key: 'modified_at',
      label: t('common.modifiedAt'),
      getValue: (steel) => {
        const steelData = steel.Steel || steel;
        return steel.modified_at || steelData.modified_at;
      },
      emptyText: '-'
    })
  ];

  return (
    <>
      <GenericEntityList
        entityName="steels"
        entityType="steel"
        icon={faCodeBranch}
        columns={columns}
        FormComponent={SteelForm}
        service={{
          getAll: steelService.getSteels,
          delete: steelService.deleteSteel
        }}
        useHierarchyMode={false}
        showPagination={true}
        modalSize="lg"
        getItemName={(steel) => {
          const steelData = steel?.Steel || steel;
          return steelData?.grade || 'cet acier';
        }}
        defaultSortBy="modified_at"
        defaultSortOrder="desc"
        includeActionsColumn={true}
        onDelete={handleDeleteSteel}
      />

      {/* Custom Delete Modal */}
      <DeleteWithUsageModal
        show={showDeleteModal}
        onHide={handleCancelDelete}
        onCancel={handleCancelDelete}
        onDeleteForce={handleDeleteForce}
        onReplace={handleReplaceSteelAndDelete}
        itemName={steelToDelete?.name || ''}
        itemType="steel"
        usageCount={steelUsage?.totalCount || 0}
        usage={steelUsage}
        availableOptions={availableSteels
          .filter(s => s.id !== steelToDelete?.id)
          .map(s => {
            const steelData = s.Steel || s;
            return {
              value: s.id,
              label: `${steelData.grade || 'Acier'} (${steelData.standard || ''})`
            };
          })
        }
        showReplaceOption={true}
      />
    </>
  );
};

export default SteelList;
