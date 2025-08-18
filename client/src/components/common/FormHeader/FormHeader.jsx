import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faPaste } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const FormHeader = ({ 
  title,
  onCopy, 
  onPaste, 
  viewMode = false, 
  disableCopy = false, 
  disablePaste = false,
  className = "",
  showCopyPaste = true 
}) => {
  const { t } = useTranslation();

  return (
    <div className={`d-flex justify-content-between align-items-center w-100 ${className}`}>
      <h5 className="mb-0 mr-3">{title}</h5>
      
      {!viewMode && showCopyPaste && (
        <div className="ml-auto mr-3">
          <ButtonGroup size="sm">
            <Button
              variant="outline-secondary"
              onClick={onCopy}
              disabled={disableCopy}
              title={t('common.copy')}
            >
              <FontAwesomeIcon icon={faCopy} className="mr-1" />
              {t('common.copy')}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={onPaste}
              disabled={disablePaste}
              title={t('common.paste')}
            >
              <FontAwesomeIcon icon={faPaste} className="mr-1" />
              {t('common.paste')}
            </Button>
          </ButtonGroup>
        </div>
      )}
    </div>
  );
};

export default FormHeader;
