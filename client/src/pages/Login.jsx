import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert, Card, Container, Row, Col, Form, Button } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';

// Schéma de validation avec Yup
const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Le nom d\'utilisateur est requis'),
  password: Yup.string().required('Le mot de passe est requis')
});

const Login = () => {
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useContext(AuthContext);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  useEffect(() => {
    // Récupérer les paramètres d'URL
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    const successParam = params.get('success');
    
    // Gérer les messages d'erreur
    if (errorParam) {
      switch (errorParam) {
        case 'invalid_credentials':
          setError('Nom d\'utilisateur ou mot de passe incorrect.');
          break;
        case 'no_access':
          setError('Vous n\'avez pas les droits nécessaires pour accéder à cette section.');
          break;
        case 'session_expired':
          setError('Votre session a expiré. Veuillez vous reconnecter.');
          break;
        default:
          setError('');
      }
      // Effacer tout message de succès si on a une erreur
      setSuccessMessage('');
    } else if (successParam) {
      // Gérer les messages de succès
      switch (successParam) {
        case 'logout':
          setSuccessMessage('Vous avez été déconnecté avec succès.');
          break;
        default:
          setSuccessMessage('');
      }
      // Effacer tout message d'erreur si on a un succès
      setError('');
    } else {
      // Réinitialiser les messages s'il n'y a pas de paramètres
      setError('');
      setSuccessMessage('');
    }
  }, [location]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Utiliser le service d'authentification existant
      const result = await authService.login(values.username, values.password);
      
      // Mettre à jour le contexte d'authentification
      login(result.token, result.user);
      
      // Rediriger vers la page d'accueil ou la page demandée précédemment
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError(error.response?.data?.message || 'Erreur d\'authentification');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      style={{
        backgroundImage: 'url("/images/wallpaper.jpg")', // Utilisez le chemin de votre image
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Overlay pour réduire l'opacité de l'image */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgb(185, 185, 185, 0.6)', // Ajuster l'opacité ici (0.6 = 60% d'opacité)
          zIndex: 1
        }}
      />
      
      <Container className="position-relative" style={{ zIndex: 2 }}>
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={5}>
            <Card className="shadow-lg border-0">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <img 
                    src="/images/logoECM.png" 
                    alt="Logo ECM" 
                    className="img-fluid mb-4" 
                    style={{ maxHeight: '80px' }} 
                  />
                  <h2 className="h4 text-gray-900 mb-4">ECM Monitoring</h2>
                </div>

                {error && (
                  <Alert 
                    variant="danger" 
                    dismissible 
                    onClose={() => setError('')}
                  >
                    {error}
                  </Alert>
                )}

                {successMessage && (
                  <Alert 
                    variant="success" 
                    dismissible 
                    onClose={() => setSuccessMessage('')}
                  >
                    {successMessage}
                  </Alert>
                )}

                <Formik
                  initialValues={{ username: '', password: '' }}
                  validationSchema={LoginSchema}
                  onSubmit={handleSubmit}
                >
                  {({
                    values,
                    errors,
                    touched,
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    isSubmitting
                  }) => (
                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-4">
                        <Form.Label>Nom d'utilisateur</Form.Label>
                        <Form.Control
                          type="text"
                          name="username"
                          placeholder="Entrez votre nom d'utilisateur"
                          value={values.username}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.username && errors.username}
                          className="py-2"
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.username}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label>Mot de passe</Form.Label>
                        <Form.Control
                          type="password"
                          name="password"
                          placeholder="Entrez votre mot de passe"
                          value={values.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.password && errors.password}
                          className="py-2"
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.password}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Button 
                        variant="danger" 
                        type="submit" 
                        className="w-100 py-2 mt-3"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
                      </Button>
                    </Form>
                  )}
                </Formik>
                
                <div className="text-center mt-4">
                  <small className="text-muted">
                    © 2025 ECM Group. Tous droits réservés.
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;