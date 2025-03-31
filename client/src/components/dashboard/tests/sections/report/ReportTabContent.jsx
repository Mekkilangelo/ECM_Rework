import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import axios from 'axios';
import TestReportPDF from './TestReportPDF';

const ReportTabContent = ({ testId }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewPdf, setViewPdf] = useState(false);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5001/api/tests/${testId}/report`);
        setReportData(response.data);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des données du rapport: ' + (err.response?.data?.message || err.message));
        console.error('Error fetching report data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      fetchReportData();
    }
  }, [testId]);

  if (loading) {
    return (
      <Card className="mt-3">
        <Card.Body className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Chargement...</span>
          </div>
          <p className="mt-2">Chargement des données du rapport...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-3">
        <Card.Body>
          <Alert variant="danger">{error}</Alert>
          <Button 
            variant="outline-primary"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mt-3">
      <Card.Header as="h5">Rapport d'essai</Card.Header>
      <Card.Body>
        <Row className="mb-3">
          <Col>
            <p>Générez et téléchargez un rapport d'essai complet avec toutes les informations associées.</p>
          </Col>
        </Row>
        <Row className="mb-4">
          <Col md={6}>
            <Button
              variant="primary"
              onClick={() => setViewPdf(!viewPdf)}
              className="mr-2 mb-2"
            >
              {viewPdf ? "Masquer l'aperçu" : "Aperçu du rapport"}
            </Button>
            
            {reportData && (
              <PDFDownloadLink
                document={<TestReportPDF reportData={reportData} />}
                fileName={`rapport-test-${testId}.pdf`}
                style={{ 
                  textDecoration: 'none', 
                  display: 'inline-block',
                  marginLeft: '10px'
                }}
              >
                {({ blob, url, loading, error }) => (
                  <Button variant="success" disabled={loading}>
                    {loading ? 'Génération du PDF...' : 'Télécharger le PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
            )}
          </Col>
        </Row>
        
        {/* Section d'aperçu du PDF */}
        {viewPdf && reportData && (
          <Row>
            <Col>
              <div 
                style={{ 
                  height: '600px', 
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                <PDFViewer width="100%" height="100%">
                  <TestReportPDF reportData={reportData} />
                </PDFViewer>
              </div>
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  );
};

export default ReportTabContent;
