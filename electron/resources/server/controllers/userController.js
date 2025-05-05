const { User } = require('../models');


// Contrôleur pour enregistrer un utilisateur
exports.register = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // Vérifiez que les informations sont complètes
    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Tous les champs sont requis (username, password, role)' });
    }

    // Vérifiez si le rôle est valide
    const validRoles = ['admin', 'user', 'superuser'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Le rôle doit être l'un de : ${validRoles.join(', ')}` });
    }

    // Vérifiez qu'il n'existe pas déjà
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Ce nom d’utilisateur existe déjà.' });
    }

    // Créez et enregistrez l'utilisateur
    const newUser = await User.create({
      username,
      password_hash: password,
      role
    });

    return res.status(201).json({ message: 'Utilisateur enregistré avec succès.', user: newUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur lors de l’enregistrement de l’utilisateur.' });
  }
};