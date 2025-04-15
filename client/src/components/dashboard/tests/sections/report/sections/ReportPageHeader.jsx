import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faIndustry, faBox, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

const ReportPageHeader = ({ testData, clientData }) => {
  return (
    <div className="report-page-header report-header-container">
      <div className="report-header-title-bar">
        <h2>
          <span className="report-title-badge">
            Rapport {testData?.testCode || 'N/A'}
          </span>
        </h2>
        
        <div>
          <img 
            src="/images/logoECM.png" 
            alt="Logo ECM" 
            style={{ height: '45px', width: 'auto' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjUwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNTAiIGZpbGw9IiNjY2MiLz48dGV4dCB4PSI1MCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzMzMyIgZHk9Ii4zZW0iPkxvZ288L3RleHQ+PC9zdmc+';
            }}
          />
        </div>
      </div>
      
      <div className="report-info-columns">
        <div className="info-column client-info">
          <div className="info-content">
            <FontAwesomeIcon icon={faUser} />
            <span style={{ fontWeight: '600' }}>Client:</span>
            <span>{clientData?.name || 'N/A'}</span>
            <span className="info-separator client-separator">•</span>
            <span>{clientData?.city || 'N/A'}, {clientData?.country || 'N/A'}</span>
          </div>
        </div>
        
        <div className="info-column process-info">
          <div className="info-content">
            <FontAwesomeIcon icon={faIndustry} />
            <span style={{ fontWeight: '600' }}>Traitement:</span>
            <span>{testData?.processType || 'N/A'}</span>
          </div>
        </div>
        
        <div className="info-column load-info">
          <div className="info-content">
            <FontAwesomeIcon icon={faBox} />
            <span style={{ fontWeight: '600' }}>N° Charge:</span>
            <span>{testData?.loadNumber || 'N/A'}</span>
            <span className="info-separator load-separator">•</span>
            <FontAwesomeIcon icon={faCalendarAlt} />
            <span>
              {testData?.testDate 
                ? new Date(testData.testDate).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }) 
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPageHeader;