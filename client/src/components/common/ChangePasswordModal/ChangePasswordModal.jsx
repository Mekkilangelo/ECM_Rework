import React, { useState } from 'react';
import { Modal, Button, Form, Alert, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faLock } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import authService from '../../../services/authService';

const ChangePasswordModal = ({ show, onHide, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Effacer les messages d'erreur/succès quand l'utilisateur tape
    if (error) setError('');
    if (success) setSuccess('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      setError(t('auth.changePassword.currentPasswordRequired'));
      return false;
    }

    if (!formData.newPassword) {
      setError(t('auth.changePassword.newPasswordRequired'));
      return false;
    }

    if (formData.newPassword.length < 6) {
      setError(t('auth.changePassword.passwordTooShort'));
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('auth.changePassword.passwordsDoNotMatch'));
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError(t('auth.changePassword.samePassword'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      await authService.changePassword(formData.currentPassword, formData.newPassword);
      setSuccess(t('auth.changePassword.success'));
      
      // Réinitialiser le formulaire après succès
      setTimeout(() => {
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setSuccess('');
        onHide();
        if (onSuccess) onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      
      if (error.response?.status === 401) {
        setError(t('auth.changePassword.currentPasswordIncorrect'));
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(t('auth.changePassword.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setError('');
      setSuccess('');
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faLock} className="me-2 text-primary" />
          {t('auth.changePassword.title')}
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
          {success && <Alert variant="success" className="mb-3">{success}</Alert>}

          {/* Ancien mot de passe */}
          <Form.Group className="mb-3">
            <Form.Label>{t('auth.changePassword.currentPassword')}</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                placeholder={t('auth.changePassword.currentPasswordPlaceholder')}
                required
                disabled={loading}
              />
              <Button
                variant="outline-secondary"
                onClick={() => togglePasswordVisibility('current')}
                disabled={loading}
              >
                <FontAwesomeIcon icon={showPasswords.current ? faEyeSlash : faEye} />
              </Button>
            </InputGroup>
          </Form.Group>

          {/* Nouveau mot de passe */}
          <Form.Group className="mb-3">
            <Form.Label>{t('auth.changePassword.newPassword')}</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder={t('auth.changePassword.newPasswordPlaceholder')}
                required
                disabled={loading}
              />
              <Button
                variant="outline-secondary"
                onClick={() => togglePasswordVisibility('new')}
                disabled={loading}
              >
                <FontAwesomeIcon icon={showPasswords.new ? faEyeSlash : faEye} />
              </Button>
            </InputGroup>
            <Form.Text className="text-muted">
              {t('auth.changePassword.passwordRequirements')}
            </Form.Text>
          </Form.Group>

          {/* Confirmation du nouveau mot de passe */}
          <Form.Group className="mb-3">
            <Form.Label>{t('auth.changePassword.confirmPassword')}</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder={t('auth.changePassword.confirmPasswordPlaceholder')}
                required
                disabled={loading}
              />
              <Button
                variant="outline-secondary"
                onClick={() => togglePasswordVisibility('confirm')}
                disabled={loading}
              >
                <FontAwesomeIcon icon={showPasswords.confirm ? faEyeSlash : faEye} />
              </Button>
            </InputGroup>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {t('common.processing')}
              </>
            ) : (
              t('auth.changePassword.submit')
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;