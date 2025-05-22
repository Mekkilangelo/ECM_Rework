import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, Card, Table, Form, Button, 
  Modal, Badge, OverlayTrigger, Tooltip 
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserPlus, faSave, faTimes, faClipboard, 
  faEdit, faTrash, faCheck, faKey 
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import Layout from '../components/layout/Layout';
import { NavigationProvider } from '../context/NavigationContext';
import { AuthContext } from '../context/AuthContext';
import userService from '../services/userService';

const UserManagementContent = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [editedUsers, setEditedUsers] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user'
  });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [resetPasswordData, setResetPasswordData] = useState({
    userId: null,
    username: '',
    newPassword: '',
    showModal: false
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      setUsers(response);
      
      // Initialize edited users with original data
      const initialEditedState = {};
      response.forEach(user => {
        initialEditedState[user.id] = { ...user };
      });
      setEditedUsers(initialEditedState);
      
      setLoading(false);
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs');
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    setEditedUsers(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        role: newRole
      }
    }));
  };

  const saveChanges = async () => {
    try {
      setLoading(true);
      
      // Find which users have changed
      const changedUsers = Object.entries(editedUsers)
        .filter(([id, user]) => {
          const originalUser = users.find(u => u.id === parseInt(id));
          return originalUser && originalUser.role !== user.role;
        })
        .map(([id, user]) => ({
          id: parseInt(id),
          role: user.role
        }));
      
      if (changedUsers.length === 0) {
        toast.info('Aucune modification à enregistrer');
        setLoading(false);
        return;
      }

      await userService.updateUsersRoles(changedUsers);
      toast.success('Rôles des utilisateurs mis à jour avec succès');
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des rôles');
      console.error('Error updating user roles:', error);
      setLoading(false);
    }
  };

  const resetChanges = () => {
    // Reset to original values
    const initialEditedState = {};
    users.forEach(user => {
      initialEditedState[user.id] = { ...user };
    });
    setEditedUsers(initialEditedState);
    toast.info('Modifications annulées');
  };

  const generatePassword = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let result = '';
    const length = 12;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setGeneratedPassword(result);
    setNewUser(prev => ({ ...prev, password: result }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword)
      .then(() => toast.success('Mot de passe copié dans le presse-papier'))
      .catch(() => toast.error('Impossible de copier le mot de passe'));
  };

  const handleNewUserChange = (e) => {
    setNewUser(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const createUser = async () => {
    try {
      if (!newUser.username || !newUser.password) {
        toast.error('Nom d\'utilisateur et mot de passe sont requis');
        return;
      }

      setLoading(true);
      await userService.createUser(newUser);
      toast.success('Utilisateur créé avec succès');
      setShowCreateModal(false);
      setNewUser({ username: '', password: '', role: 'user' });
      setGeneratedPassword('');
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la création de l\'utilisateur');
      console.error('Error creating user:', error);
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        setLoading(true);
        await userService.deleteUser(userId);
        toast.success('Utilisateur supprimé avec succès');
        fetchUsers();
      } catch (error) {
        toast.error('Erreur lors de la suppression de l\'utilisateur');
        console.error('Error deleting user:', error);
        setLoading(false);
      }
    }
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      const response = await userService.resetPassword(resetPasswordData.userId);
      setResetPasswordData({
        ...resetPasswordData,
        newPassword: response.newPassword,
      });
      toast.success('Mot de passe réinitialisé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la réinitialisation du mot de passe');
      console.error('Error resetting password:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyNewPasswordToClipboard = () => {
    navigator.clipboard.writeText(resetPasswordData.newPassword)
      .then(() => toast.success('Mot de passe copié dans le presse-papier'))
      .catch(() => toast.error('Impossible de copier le mot de passe'));
  };

  const openResetPasswordModal = (user) => {
    setResetPasswordData({
      userId: user.id,
      username: user.username,
      newPassword: '',
      showModal: true
    });
  };

  const closeResetPasswordModal = () => {
    setResetPasswordData({
      userId: null,
      username: '',
      newPassword: '',
      showModal: false
    });
  };

  const getBadgeVariant = (role) => {
    switch (role) {
      case 'superuser': return 'danger';
      case 'admin': return 'warning';
      case 'user': return 'info';
      default: return 'secondary';
    }
  };

  const getRoleBadge = (userRole, userId) => {
    const isCurrentUser = currentUser.id === userId;
    const badgeStyle = {
      padding: '6px 10px',
      fontWeight: 'bold',
      fontSize: '0.85rem',
      borderRadius: '6px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      display: 'inline-block',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: 'white',
      minWidth: '110px',
      textAlign: 'center'
    };
    const roleStyles = {
      superuser: {
        backgroundColor: '#e74a3b',
        border: '1px solid #c0392b'
      },
      admin: {
        backgroundColor: '#f6c23e',
        border: '1px solid #d4ac0d'
      },
      user: {
        backgroundColor: '#4e73df',
        border: '1px solid #3a539b'
      }
    };
    if (isCurrentUser) {
      return (
        <div 
          style={{
            ...badgeStyle,
            ...roleStyles[userRole],
            border: '2px solid #2ecc71',
            boxShadow: '0 0 0 2px rgba(46, 204, 113, 0.3), 0 1px 3px rgba(0,0,0,0.15)'
          }}
        >
          {userRole} <span style={{ fontSize: '0.7rem' }}>(vous)</span>
        </div>
      );
    }
    return (
      <div 
        style={{
          ...badgeStyle,
          ...roleStyles[userRole]
        }}
      >
        {userRole}
      </div>
    );
  };

  const canModifyUser = (userToModify) => {
    if (currentUser.id === userToModify.id) {
      return false;
    }
    if (currentUser.role === 'superuser') {
      return true;
    }
    if (currentUser.role === 'admin') {
      return userToModify.role !== 'superuser';
    }
    return false;
  };

  const canResetPassword = (userToReset) => {
    if (currentUser.id === userToReset.id) {
      return false;
    }
    if (currentUser.role === 'superuser') {
      return true;
    }
    if (currentUser.role === 'admin') {
      return userToReset.role !== 'superuser';
    }
    return false;
  };

  const getAvailableRoles = () => {
    if (currentUser.role === 'superuser') {
      return ['user', 'admin', 'superuser'];
    }
    if (currentUser.role === 'admin') {
      return ['user', 'admin'];
    }
    return ['user'];
  };

  return (
    <Layout>
      <Container fluid>
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
          <h1 className="h3 mb-0 text-gray-800">Gestion des Utilisateurs</h1>
          <Button 
            variant="primary" 
            className="d-flex align-items-center" 
            onClick={() => {
              setShowCreateModal(true);
              generatePassword();
            }}
          >
            <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
            Ajouter un utilisateur
          </Button>
        </div>

        <Card className="shadow mb-4">
          <Card.Header className="py-3 d-flex justify-content-between align-items-center">
            <h6 className="m-0 font-weight-bold text-primary">Liste des utilisateurs</h6>
            <div>
              <Button 
                variant="success" 
                className="mr-2" 
                onClick={saveChanges} 
                disabled={loading}
              >
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                Enregistrer
              </Button>
              <Button 
                variant="secondary" 
                onClick={resetChanges}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                Annuler
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center my-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Chargement...</span>
                </div>
              </div>
            ) : (
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom d'utilisateur</th>
                    <th>Rôle</th>
                    <th>Date de création</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>
                        {canModifyUser(user) ? (
                          <Form.Control
                            as="select"
                            value={editedUsers[user.id]?.role || user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="form-control-sm"
                          >
                            {getAvailableRoles().map(role => (
                              <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </option>
                            ))}
                          </Form.Control>
                        ) : (
                          getRoleBadge(user.role, user.id)
                        )}
                      </td>
                      <td>{new Date(user.created_at).toLocaleString()}</td>
                      <td>
                        <div className="d-flex">
                          {canResetPassword(user) && (
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Réinitialiser le mot de passe</Tooltip>}
                            >
                              <Button 
                                variant="warning" 
                                size="sm" 
                                className="mr-2"
                                onClick={() => openResetPasswordModal(user)}
                                disabled={loading}
                              >
                                <FontAwesomeIcon icon={faKey} />
                              </Button>
                            </OverlayTrigger>
                          )}
                          {canModifyUser(user) && (
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Supprimer l'utilisateur</Tooltip>}
                            >
                              <Button 
                                variant="danger" 
                                size="sm" 
                                onClick={() => deleteUser(user.id)}
                                disabled={loading}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            </OverlayTrigger>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>

        {/* Create User Modal */}
        <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Nouvel Utilisateur</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group>
                <Form.Label>Nom d'utilisateur</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={newUser.username}
                  onChange={handleNewUserChange}
                  placeholder="Entrez le nom d'utilisateur"
                />
              </Form.Group>
              
              <Form.Group>
                <Form.Label>Rôle</Form.Label>
                <Form.Control
                  as="select"
                  name="role"
                  value={newUser.role}
                  onChange={handleNewUserChange}
                >
                  {getAvailableRoles().map(role => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
              
              <Form.Group>
                <Form.Label>Mot de passe</Form.Label>
                <div className="input-group">
                  <Form.Control
                    type="text"
                    name="password"
                    value={newUser.password}
                    onChange={handleNewUserChange}
                    placeholder="Entrez le mot de passe"
                    readOnly
                  />
                  <div className="input-group-append">
                    <Button variant="outline-secondary" onClick={generatePassword}>
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button variant="outline-primary" onClick={copyToClipboard}>
                      <FontAwesomeIcon icon={faClipboard} />
                    </Button>
                  </div>
                </div>
                <Form.Text className="text-muted">
                  Cliquez sur <FontAwesomeIcon icon={faEdit} /> pour générer un nouveau mot de passe.
                </Form.Text>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={createUser} disabled={loading}>
              <FontAwesomeIcon icon={faCheck} className="mr-2" />
              Créer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Reset Password Modal */}
        <Modal show={resetPasswordData.showModal} onHide={closeResetPasswordModal}>
          <Modal.Header closeButton>
            <Modal.Title>Réinitialiser le mot de passe</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Vous êtes sur le point de réinitialiser le mot de passe de l'utilisateur <strong>{resetPasswordData.username}</strong>.</p>
            
            {resetPasswordData.newPassword ? (
              <div className="mt-3">
                <div className="alert alert-success">
                  <h6 className="mb-2">Nouveau mot de passe :</h6>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      value={resetPasswordData.newPassword}
                      readOnly
                    />
                    <div className="input-group-append">
                      <Button variant="outline-primary" onClick={copyNewPasswordToClipboard}>
                        <FontAwesomeIcon icon={faClipboard} />
                      </Button>
                    </div>
                  </div>
                  <small className="text-muted mt-2 d-block">
                    Assurez-vous de communiquer ce mot de passe à l'utilisateur de manière sécurisée.
                  </small>
                </div>
              </div>
            ) : (
              <div className="alert alert-warning">
                <p className="mb-0">Cette action générera un nouveau mot de passe aléatoire et l'ancien mot de passe ne sera plus valide.</p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeResetPasswordModal}>
              {resetPasswordData.newPassword ? 'Fermer' : 'Annuler'}
            </Button>
            {!resetPasswordData.newPassword && (
              <Button 
                variant="warning" 
                onClick={handleResetPassword} 
                disabled={loading}
              >
                <FontAwesomeIcon icon={faKey} className="mr-2" />
                Réinitialiser
              </Button>
            )}
          </Modal.Footer>
        </Modal>
      </Container>
    </Layout>
  );
};

const UserManagement = () => {
  return (
    <NavigationProvider>
      <UserManagementContent />
    </NavigationProvider>
  );
};

export default UserManagement;