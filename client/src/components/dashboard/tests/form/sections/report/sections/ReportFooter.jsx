import React from 'react';

const ReportFooter = ({ testData }) => {
      // Vérification de sécurité pour éviter les erreurs si testData est undefined
  const test = testData || {};
  
  return (
    <div className="report-footer" style={{ marginTop: '30px', borderTop: '1px solid #dee2e6', paddingTop: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>Approbation</h4>
          <table style={{ borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '3px 10px 3px 0', fontWeight: 'bold' }}>Créé par:</td>
                <td style={{ padding: '3px 0' }}>{test.createdBy || 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 10px 3px 0', fontWeight: 'bold' }}>Validé par:</td>
                <td style={{ padding: '3px 0' }}>{test.approvedBy || 'En attente'}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 10px 3px 0', fontWeight: 'bold' }}>Date:</td>
                <td style={{ padding: '3px 0' }}>
                  {test.approvalDate ? 
                    new Date(test.approvalDate).toLocaleDateString('fr-FR') : 
                    new Date().toLocaleDateString('fr-FR')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div>
          {test.status === 'COMPLETED' ? (
            <div style={{ 
              border: '2px solid #28a745', 
              borderRadius: '5px', 
              padding: '10px',
              color: '#28a745',
              fontWeight: 'bold',
              fontSize: '16px',
              textAlign: 'center'
            }}>
              APPROUVÉ
            </div>
          ) : (
            <div style={{ 
              border: '2px solid #dc3545', 
              borderRadius: '5px', 
              padding: '10px',
              color: '#dc3545',
              fontWeight: 'bold',
              fontSize: '16px',
              textAlign: 'center'
            }}>
              NON-APPROUVÉ
            </div>
          )}
        </div>
      </div>
      
      <div style={{ marginTop: '30px', borderTop: '1px dashed #dee2e6', paddingTop: '10px', textAlign: 'center', fontSize: '12px', color: '#6c757d' }}>
        <div>Ce document est généré automatiquement.</div>
        <div>Référence test: {test.testCode} - Généré le {new Date().toLocaleString('fr-FR')}</div>
        <div>Thermique Solutions Inc. - Confidentiel</div>
        <div>Page 1/1</div>
      </div>
    </div>
  );
};

export default ReportFooter;
