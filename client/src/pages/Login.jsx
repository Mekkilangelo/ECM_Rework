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
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    // Récupérer le paramètre d'erreur de l'URL, similaire à $_GET['error'] en PHP
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    
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
    }
  }, [location]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Utiliser le service d'authentification existant
      const result = await authService.login(values.username, values.password);
      
      // Mettre à jour le contexte d'authentification
      login(result.token, result.user);
      
      // Rediriger vers la page d'accueil ou la page demandée précédemment
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur d\'authentification');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="vh-100">
      <Row className="h-100 align-items-center justify-content-center">
        <Col xs={12} md={8} lg={6}>
          <Card className="shadow-lg border-0">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <img 
                  src="/images/logoECM.png" 
                  alt="Logo ECM" 
                  className="img-fluid mb-4" 
                  style={{ maxHeight: '100px' }} 
                />
                <h2 className="h4 text-gray-900">Login</h2>
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
                    <Form.Group className="mb-3">
                      <Form.Control
                        type="text"
                        name="username"
                        placeholder="Nom d'utilisateur"
                        value={values.username}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.username && errors.username}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.username}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Control
                        type="password"
                        name="password"
                        placeholder="Mot de passe"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.password && errors.password}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.password}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Button 
                      variant="danger" 
                      type="submit" 
                      className="w-100"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Connexion en cours...' : 'Log in'}
                    </Button>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;