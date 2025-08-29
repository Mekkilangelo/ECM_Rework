import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert, Card, Container, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';
import LanguageSwitcher from '../components/layout/language_switch/LanguageSwitcher';

const Login = () => {
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useContext(AuthContext);
  const { t } = useTranslation();

  // Schéma de validation avec Yup - internationalisé
  const LoginSchema = Yup.object().shape({
    username: Yup.string().required(t('validation.required.name')),
    password: Yup.string().required(t('auth.password') + ' requis')
  });

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
    const successParam = params.get('success');      // Gérer les messages d'erreur
    if (errorParam) {
      switch (errorParam) {
        case 'invalid_credentials':
          setError(t('auth.invalidCredentials'));
          break;
        case 'no_access':
          setError(t('auth.noAccess'));
          break;
        case 'session_expired':
          setError(t('auth.sessionExpired'));
          break;
        default:
          setError('');
      }
      // Effacer tout message de succès si on a une erreur
      setSuccessMessage('');
    } else if (successParam) {      // Gérer les messages de succès
      switch (successParam) {
        case 'logout':
          setSuccessMessage(t('auth.logoutSuccess'));
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
  }, [location, t]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      console.log('Tentative de connexion pour:', values.username);
      
      // Utiliser le service d'authentification existant
      const result = await authService.login(values.username, values.password);
      
      console.log('Authentification réussie, données reçues:', {
        tokenExiste: !!result.token,
        tokenFormat: result.token ? 'JWT valide' : 'Non disponible',
        userInfo: result.user ? `${result.user.username} (${result.user.role})` : 'Information utilisateur manquante'
      });
      
      // Mettre à jour le contexte d'authentification
      login(result.token, result.user);
      
      // Rediriger vers la page d'accueil ou la page demandée précédemment
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });    } catch (error) {
      console.error('Erreur de connexion:', error);
      
      // Gérer les différents types d'erreurs d'authentification
      if (error.response?.status === 401) {
        setError(t('auth.invalidCredentials'));
      } else if (error.response?.status === 403) {
        setError(t('auth.noAccess'));
      } else if (error.response?.data?.message) {
        // Vérifier si le message contient des mots-clés spécifiques
        const message = error.response.data.message.toLowerCase();
        if (message.includes('password') || message.includes('username') || message.includes('credentials') || message.includes('mot de passe') || message.includes('utilisateur')) {
          setError(t('auth.invalidCredentials'));
        } else {
          setError(error.response.data.message);
        }
      } else if (error.message) {
        setError(t('auth.authenticationError'));
      } else {
        setError(t('errors.general'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Fonction pour basculer l'affichage du mot de passe
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
        }}      />
        {/* Language Switcher - Positioned in top right corner */}
      <div 
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10
        }}
      >
        <ul className="navbar-nav" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)', 
          borderRadius: '25px',
          padding: '5px 10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <LanguageSwitcher />
        </ul>
      </div>
      
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
                  <h2 className="h4 text-gray-900 mb-4">ECM - Synergy</h2>
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
                )}                <Formik
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
                        <Form.Label>{t('auth.username')}</Form.Label>
                        <Form.Control
                          type="text"
                          name="username"
                          placeholder={t('auth.username')}
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
                        <Form.Label>{t('auth.password')}</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder={t('auth.password')}
                            value={values.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.password && errors.password}
                            className="py-2"
                          />
                          <Button 
                            variant="outline-secondary"
                            type="button"
                            onClick={togglePasswordVisibility}
                            style={{
                              border: '1px solid #ced4da',
                              borderLeft: 'none',
                              backgroundColor: 'transparent',
                              padding: '0.375rem 0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                          >
                            {showPassword ? (
                              // Icône œil barré (masquer)
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                              </svg>
                            ) : (
                              // Icône œil ouvert (afficher)
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            )}
                          </Button>
                        </InputGroup>
                        {touched.password && errors.password && (
                          <div className="invalid-feedback d-block">
                            {errors.password}
                          </div>
                        )}
                      </Form.Group>

                      <Button 
                        variant="danger" 
                        type="submit" 
                        className="w-100 py-2 mt-3"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? t('common.loading') : t('auth.login')}
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