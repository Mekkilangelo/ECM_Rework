// clients/ClientDetails.jsx
import React, { useEffect, useState } from 'react';
import { Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const ClientDetails = ({ clientId, onClose }) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/clients/${clientId}`);
        setClient(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement des détails:", err);
        setError("Impossible de charger les détails du client");
        setLoading(false);
      }
    };

    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId]);

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!client) return <Alert variant="warning">Aucune donnée disponible</Alert>;

  return (
    <div className="client-details">
      <h3>{client.name}</h3>
      <div className="mt-3">
        <p><strong>Groupe:</strong> {client.client_group || "Non spécifié"}</p>
        <p><strong>Pays:</strong> {client.country || "Non spécifié"}</p>
        <p><strong>Ville:</strong> {client.city || "Non spécifié"}</p>
        <p><strong>Adresse:</strong> {client.address || "Non spécifiée"}</p>
        <p><strong>Téléphone:</strong> {client.phone || "Non spécifié"}</p>
        <p><strong>Email:</strong> {client.email || "Non spécifié"}</p>
        <p><strong>Date de création:</strong> {client.created_at || "Non spécifiée"}</p>
        <p><strong>Dernière modification:</strong> {client.modified_at || "Non spécifiée"}</p>
      </div>
    </div>
  );
};

export default ClientDetails;
