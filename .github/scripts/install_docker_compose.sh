#!/bin/bash
set -e

# Ce script installe Docker Compose V2 en tant que plugin Docker CLI

# Vérifier si Docker Compose est déjà installé
if ! docker compose version &> /dev/null; then
  echo "Installation de Docker Compose V2..."
  
  # Créer le répertoire des plugins si nécessaire
  DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
  mkdir -p $DOCKER_CONFIG/cli-plugins
  
  # Télécharger la dernière version stable de Docker Compose V2
  COMPOSE_VERSION="v2.23.3"
  curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" -o $DOCKER_CONFIG/cli-plugins/docker-compose
  
  # Rendre le binaire exécutable
  chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
  
  echo "Docker Compose V2 installé avec succès!"
else
  echo "Docker Compose est déjà installé:"
fi

# Afficher la version installée
docker compose version
