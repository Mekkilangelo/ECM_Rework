import React, { useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '../../../../context/NavigationContext';
import { AuthContext } from '../../../../context/AuthContext';
import { faFlask } from '@fortawesome/free-solid-svg-icons';
import GenericEntityList from '../../../common/GenericEntityList/GenericEntityList';
import TrialFormWithSideNavigation from '../form/TrialFormWithSideNavigation';
import trialService from '../../../../services/trialService';
import {
  createClickableNameColumn,
  createTextColumn,
  createDateColumn
} from '../../../common/GenericEntityList/columnHelpers';

const TrialList = ({ partId }) => {
  const { t } = useTranslation();
  const { hierarchyState } = useNavigation();
  const { user } = useContext(AuthContext);
  const hasEditRights = user && (user.role === 'admin' || user.role === 'superuser');
  
  // Ref pour éviter les appels multiples
  const trialLoadedRef = useRef(false);
  const modalHandlersRef = useRef(null);

  // Effet pour ouvrir automatiquement un trial depuis la recherche
  useEffect(() => {
    // Si déjà chargé, ne rien faire
    if (trialLoadedRef.current) return;
    
    const openTrialId = sessionStorage.getItem('openTrialId');
    console.log('[TrialList] useEffect - openTrialId:', openTrialId);
    
    if (openTrialId && modalHandlersRef.current) {
      // Marquer comme en cours de chargement
      trialLoadedRef.current = true;
      
      // Nettoyer immédiatement du sessionStorage pour éviter les multiples tentatives
      sessionStorage.removeItem('openTrialId');
      console.log('[TrialList] Chargement du trial', openTrialId);
      
      // Charger le trial directement depuis l'API
      const loadTrial = async () => {
        try {
          const trial = await trialService.getTrialById(parseInt(openTrialId));
          console.log('[TrialList] Trial chargé:', trial);
          if (trial && modalHandlersRef.current) {
            console.log('[TrialList] Ouverture du modal, hasEditRights:', hasEditRights);
            // Ouvrir le modal du trial
            if (hasEditRights) {
              modalHandlersRef.current.openEditModal(trial);
            } else {
              modalHandlersRef.current.openDetailModal(trial);
            }
            
            // Marquer comme vu si nouveau
            if (trial.data_status === 'new' && modalHandlersRef.current.updateItemStatus) {
              await modalHandlersRef.current.updateItemStatus(trial.id);
            }
          }
        } catch (error) {
          console.error('[TrialList] Erreur lors du chargement du trial:', error);
        }
      };
      
      loadTrial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasEditRights]);

  const columns = (handlers) => {
    // Stocker les handlers pour l'auto-open
    modalHandlersRef.current = handlers;
    
    const handleTrialClick = async (trial, { openEditModal, openDetailModal }) => {
      // Marquer comme vu si nouveau
      if (trial.data_status === 'new' && handlers.updateItemStatus) {
        await handlers.updateItemStatus(trial.id);
      }
      
      if (hasEditRights) {
        openEditModal(trial);
      } else {
        openDetailModal(trial);
      }
    };
    
    return [
      createClickableNameColumn({
        key: 'name',
        label: t('trials.trialCode'),
        onClick: (trial) => handleTrialClick(trial, handlers),
        getValue: (trial) => trial.name,
        getStatus: (trial) => trial.data_status,
        noValueText: t('trials.noName')
      }),
      createTextColumn({
        key: 'Trial.recipe_number',
        label: t('trials.recipeNumber'),
        getValue: (trial) => trial.trial?.recipe?.recipe_number,
        centered: true,
        emptyText: '-'
      }),
      createTextColumn({
        key: 'Trial.load_number',
        label: t('trials.loadNumber'),
        getValue: (trial) => trial.trial?.load_number,
        centered: true,
        emptyText: '-'
      }),
      createTextColumn({
        key: 'Trial.test_date',
        label: t('trials.date'),
        getValue: (trial) => trial.trial?.trial_date || null,
        centered: true,
        emptyText: t('trials.notDoneYet')
      }),
      createTextColumn({
        key: 'Trial.location',
        label: t('trials.location'),
        getValue: (trial) => trial.trial?.location,
        centered: true,
        emptyText: '-'
      }),
      createDateColumn({
        key: 'modified_at',
        label: t('common.modifiedAt'),
        getValue: (trial) => trial.modified_at,
        emptyText: t('common.unknown')
      })
    ];
  };

  return (
    <GenericEntityList
      entityName="trials"
      entityType="trial"
      icon={faFlask}
      columns={columns}
      FormComponent={TrialFormWithSideNavigation}
      service={{
        delete: trialService.deleteTrial
      }}
      useHierarchyMode={true}
      modalSize="xl"
      getItemName={(trial) => trial?.name || 'ce trial'}
      includeActionsColumn={true}
      formProps={{
        partId: partId
      }}
      contextDisplay={hierarchyState.partName}
      customFormWrapper={true}
    />
  );
};

export default TrialList;
