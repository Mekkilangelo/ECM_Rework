// Configuration pour les chemins en production Electron
const path = require('path');
const isDev = require('electron-is-dev');
const { app } = require('electron');

const getResourcePath = (relativePath) => {
  if (isDev) {
    // En développement, utiliser les chemins relatifs depuis le dossier electron
    return path.join(__dirname, '..', relativePath);
  } else {
    // En production, utiliser les resources packagées
    return path.join(process.resourcesPath, relativePath);
  }
};

const getServerPath = () => {
  if (isDev) {
    return path.join(__dirname, '..', 'server', 'server.js');
  } else {
    return path.join(process.resourcesPath, 'server', 'server.js');
  }
};

const getClientPath = () => {
  if (isDev) {
    return null; // En dev, on utilise le serveur React dev
  } else {
    return path.join(process.resourcesPath, 'client', 'build');
  }
};

const getUserDataPaths = () => {
  const userDataPath = app.getPath('userData');
  return {
    userData: userDataPath,
    uploads: path.join(userDataPath, 'uploads'),
    temp: path.join(userDataPath, 'uploads', 'temp'),
    logs: path.join(userDataPath, 'logs'),
    downloads: path.join(userDataPath, 'downloads'),
    database: path.join(userDataPath, 'database')
  };
};

module.exports = {
  getResourcePath,
  getServerPath,
  getClientPath,
  getUserDataPaths,
  isDev
};
