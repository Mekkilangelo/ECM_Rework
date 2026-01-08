#!/bin/bash

##############################################################################
# Script de migration des uploads vers les volumes Docker
# Usage: ./migrate-uploads.sh [dev|prod]
##############################################################################

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Déterminer l'environnement
ENV=${1:-prod}

if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
    error "Usage: $0 [dev|prod]"
fi

info "Migration des uploads pour l'environnement: $ENV"

# Définir les noms en fonction de l'environnement
if [ "$ENV" = "prod" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    VOLUME_NAME="synergia_uploads_data"
else
    COMPOSE_FILE="docker-compose.dev.yml"
    VOLUME_NAME="synergia_uploads_data_dev"
fi

info "Fichier Docker Compose: $COMPOSE_FILE"
info "Volume Docker: $VOLUME_NAME"

# Vérifier si Docker est disponible
if ! command -v docker &> /dev/null; then
    error "Docker n'est pas installé ou n'est pas dans le PATH"
fi

# Vérifier si le dossier source existe
SOURCE_DIR="./server/uploads"
if [ ! -d "$SOURCE_DIR" ]; then
    warn "Le dossier $SOURCE_DIR n'existe pas"
    info "Aucune migration nécessaire - le volume sera créé vide"
    exit 0
fi

# Compter les fichiers à migrer
FILE_COUNT=$(find "$SOURCE_DIR" -type f 2>/dev/null | wc -l)
info "Fichiers trouvés à migrer: $FILE_COUNT"

if [ "$FILE_COUNT" -eq 0 ]; then
    warn "Aucun fichier à migrer"
    exit 0
fi

# Demander confirmation
echo ""
warn "⚠️  Cette opération va:"
echo "   1. Arrêter les conteneurs Docker"
echo "   2. Copier les fichiers de $SOURCE_DIR vers le volume $VOLUME_NAME"
echo "   3. Redémarrer les conteneurs"
echo ""
read -p "Continuer? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    info "Migration annulée"
    exit 0
fi

# Étape 1: Arrêter les conteneurs
info "Arrêt des conteneurs..."
docker compose -f "$COMPOSE_FILE" down || warn "Les conteneurs n'étaient pas en cours d'exécution"

# Étape 2: Vérifier si le volume existe, sinon le créer
if ! docker volume inspect "$VOLUME_NAME" &> /dev/null; then
    info "Création du volume $VOLUME_NAME..."
    docker volume create "$VOLUME_NAME"
else
    info "Le volume $VOLUME_NAME existe déjà"
fi

# Étape 3: Copier les fichiers vers le volume
info "Migration des fichiers vers le volume..."
docker run --rm \
    -v "$(pwd)/$SOURCE_DIR:/source:ro" \
    -v "$VOLUME_NAME:/target" \
    alpine sh -c "
        echo 'Copie des fichiers...'
        cp -rv /source/* /target/ 2>/dev/null || true
        echo 'Configuration des permissions...'
        chown -R 1000:1000 /target
        chmod -R 755 /target
        echo 'Migration terminée'
    "

# Étape 4: Vérifier la migration
info "Vérification de la migration..."
MIGRATED_COUNT=$(docker run --rm -v "$VOLUME_NAME:/data" alpine find /data -type f | wc -l)
info "Fichiers migrés dans le volume: $MIGRATED_COUNT"

if [ "$MIGRATED_COUNT" -eq 0 ]; then
    warn "Aucun fichier n'a été migré. Vérifiez manuellement."
else
    info "✅ Migration réussie!"
fi

# Étape 5: Créer une sauvegarde de l'ancien dossier
BACKUP_DIR="./server/uploads.backup.$(date +%Y%m%d-%H%M%S)"
info "Création d'une sauvegarde dans $BACKUP_DIR..."
mv "$SOURCE_DIR" "$BACKUP_DIR"
info "✅ Sauvegarde créée: $BACKUP_DIR"

# Étape 6: Redémarrer les conteneurs
info "Redémarrage des conteneurs..."
docker compose -f "$COMPOSE_FILE" up -d

# Attendre que le backend soit prêt
info "Attente du démarrage du backend..."
sleep 5

# Étape 7: Vérification finale
info "Vérification finale dans le conteneur..."
docker compose -f "$COMPOSE_FILE" exec -T backend ls -la /app/uploads | head -10

echo ""
info "========================================="
info "✅ Migration terminée avec succès!"
info "========================================="
echo ""
info "Prochaines étapes:"
echo "  1. Testez l'upload de fichiers depuis l'application"
echo "  2. Vérifiez que les fichiers existants sont accessibles"
echo "  3. Si tout fonctionne, vous pouvez supprimer le backup:"
echo "     rm -rf $BACKUP_DIR"
echo ""
info "Pour voir les fichiers dans le volume:"
echo "  docker run --rm -v $VOLUME_NAME:/data alpine ls -lah /data"
echo ""
