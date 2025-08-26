#!/bin/bash
# rollback.sh - Script de rollback Synergia côté client
# Version: 1.0
# Usage: ./rollback.sh

set -e
set -o pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_FILE="$SCRIPT_DIR/.deployed_version"
BACKUP_DIR="$SCRIPT_DIR/backups"
LOG_FILE="$SCRIPT_DIR/rollback.log"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# FONCTIONS UTILITAIRES
# ============================================================================

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

# ============================================================================
# VÉRIFICATIONS PRÉALABLES
# ============================================================================

check_prerequisites() {
    info "Vérification des prérequis..."
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        error "Docker n'est pas installé"
        exit 1
    fi
    
    # Vérifier Docker Compose
    if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
        error "Docker Compose n'est pas installé ou accessible"
        exit 1
    fi
    
    # Vérifier docker-compose.yaml
    if [ ! -f "$SCRIPT_DIR/docker-compose.yaml" ]; then
        error "docker-compose.yaml non trouvé"
        exit 1
    fi
    
    success "Prérequis validés"
}

check_backup_availability() {
    info "Vérification de la disponibilité du rollback..."
    
    if [ ! -f "$VERSION_FILE.backup" ]; then
        error "Aucune version de sauvegarde trouvée"
        echo ""
        echo "Le rollback n'est possible que si un déploiement précédent a été effectué"
        echo "avec le script deploy.sh qui crée automatiquement une sauvegarde."
        echo ""
        echo "Alternatives:"
        echo "  1. Redéployer une version antérieure avec deploy.sh"
        echo "  2. Restaurer manuellement depuis une sauvegarde externe"
        echo ""
        exit 1
    fi
    
    local backup_version=$(cat "$VERSION_FILE.backup" 2>/dev/null || echo "unknown")
    info "Version de sauvegarde disponible: $backup_version"
    
    success "Sauvegarde disponible pour rollback"
}

# ============================================================================
# ROLLBACK
# ============================================================================

show_current_status() {
    info "État actuel du système:"
    echo ""
    
    if [ -f "$VERSION_FILE" ]; then
        local current_version=$(cat "$VERSION_FILE")
        echo "Version actuellement déployée: $current_version"
    else
        echo "Version actuellement déployée: inconnue"
    fi
    
    echo ""
    echo "Services en cours d'exécution:"
    docker compose ps 2>/dev/null || echo "Aucun service détecté"
    echo ""
}

confirm_rollback() {
    local backup_version=$(cat "$VERSION_FILE.backup")
    
    echo ""
    warning "ATTENTION: Vous êtes sur le point d'effectuer un rollback"
    echo ""
    echo "Version cible: $backup_version"
    echo ""
    echo "Cette opération va:"
    echo "  • Arrêter les services actuels"
    echo "  • Restaurer la configuration précédente"
    echo "  • Redémarrer les services"
    echo ""
    
    read -p "Êtes-vous sûr de vouloir continuer? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Rollback annulé par l'utilisateur"
        exit 0
    fi
}

perform_rollback() {
    local backup_version=$(cat "$VERSION_FILE.backup")
    
    info "Début du rollback vers la version: $backup_version"
    
    cd "$SCRIPT_DIR"
    
    # Arrêt des services actuels
    log "Arrêt des services actuels..."
    if docker compose down; then
        success "Services arrêtés"
    else
        warning "Erreur lors de l'arrêt des services (non bloquant)"
    fi
    
    # Tentative de restauration des images depuis la sauvegarde
    local backup_images_path="$BACKUP_DIR/$backup_version/images-backup.tar"
    if [ -f "$backup_images_path" ]; then
        info "Restauration des images depuis la sauvegarde..."
        if docker load < "$backup_images_path"; then
            success "Images restaurées depuis la sauvegarde"
        else
            warning "Impossible de restaurer les images sauvegardées"
            info "Le rollback continuera avec les images disponibles sur le système"
        fi
    else
        info "Pas d'images sauvegardées, utilisation des images présentes sur le système"
    fi
    
    # Redémarrage des services
    log "Redémarrage des services..."
    if docker compose up -d; then
        success "Services redémarrés"
    else
        error "Échec du redémarrage des services"
        
        # Diagnostic en cas d'échec
        echo ""
        error "Diagnostic - État des services:"
        docker compose ps
        
        echo ""
        error "Diagnostic - Logs des services:"
        docker compose logs --tail=20
        
        exit 1
    fi
    
    # Attente et vérification
    info "Attente du démarrage des services..."
    sleep 15
    
    local max_attempts=6
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Vérification $attempt/$max_attempts..."
        
        local healthy_containers=$(docker compose ps | grep -E "(Up|running)" | wc -l)
        local total_containers=$(docker compose ps -a | tail -n +2 | wc -l)
        
        if [ "$healthy_containers" -gt 0 ] && [ "$healthy_containers" -eq "$total_containers" ]; then
            success "Services opérationnels après rollback"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            warning "Timeout: Vérifiez manuellement l'état des services"
            docker compose ps
        fi
        
        sleep 10
        ((attempt++))
    done
    
    # Mise à jour des fichiers de version
    if [ -f "$VERSION_FILE.backup" ]; then
        cp "$VERSION_FILE.backup" "$VERSION_FILE"
        log "Version restaurée: $backup_version"
    fi
}

# ============================================================================
# FONCTIONS DE DIAGNOSTIC
# ============================================================================

show_post_rollback_status() {
    echo ""
    echo "================================"
    success "ROLLBACK TERMINÉ"
    echo "================================"
    echo ""
    
    info "État des services après rollback:"
    docker compose ps
    echo ""
    
    if [ -f "$VERSION_FILE" ]; then
        local current_version=$(cat "$VERSION_FILE")
        echo "Version active: $current_version"
    fi
    echo ""
    
    info "Informations utiles:"
    echo "  📊 État:     docker compose ps"
    echo "  📋 Logs:     docker compose logs"
    echo "  🔄 Restart:  docker compose restart [service]"
    echo "  📝 Log rollback: $LOG_FILE"
    echo ""
    
    # Vérification de santé basique
    local healthy=$(docker compose ps | grep -c "Up" || echo "0")
    local total=$(docker compose ps -a | tail -n +2 | wc -l)
    
    if [ "$healthy" -eq "$total" ] && [ "$total" -gt 0 ]; then
        success "Tous les services semblent opérationnels"
        echo ""
        info "URLs d'accès (à adapter selon votre configuration):"
        echo "  🌐 Frontend: https://app.entreprise.local"
        echo "  🔧 API:      https://api.entreprise.local"
    else
        warning "Certains services pourraient avoir des problèmes"
        echo "Exécutez 'docker compose logs' pour plus de détails"
    fi
}

# ============================================================================
# FONCTION PRINCIPALE
# ============================================================================

main() {
    echo ""
    echo "🔄 Rollback Synergia"
    echo "===================="
    echo ""
    
    # Rediriger aussi vers le fichier de log
    exec > >(tee -a "$LOG_FILE") 2>&1
    
    log "=== DÉBUT DU ROLLBACK ==="
    
    # Étapes du rollback
    check_prerequisites
    check_backup_availability
    show_current_status
    confirm_rollback
    perform_rollback
    show_post_rollback_status
    
    log "=== FIN DU ROLLBACK ==="
}

# ============================================================================
# GESTION DES SIGNAUX ET NETTOYAGE
# ============================================================================

cleanup() {
    log "Nettoyage en cas d'interruption..."
    exit 130
}

trap cleanup SIGINT SIGTERM

# ============================================================================
# FONCTIONS UTILITAIRES SUPPLÉMENTAIRES
# ============================================================================

show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Script de rollback pour Synergia"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help     Afficher cette aide"
    echo "  --status       Afficher l'état actuel sans rollback"
    echo "  --force        Forcer le rollback sans confirmation"
    echo ""
    echo "EXEMPLES:"
    echo "  $0              # Rollback interactif"
    echo "  $0 --status     # Voir l'état actuel"
    echo "  $0 --force      # Rollback sans confirmation"
}

show_status_only() {
    check_prerequisites
    show_current_status
    
    if [ -f "$VERSION_FILE.backup" ]; then
        local backup_version=$(cat "$VERSION_FILE.backup")
        echo "Version de rollback disponible: $backup_version"
    else
        echo "Aucune version de rollback disponible"
    fi
}

# ============================================================================
# GESTION DES ARGUMENTS
# ============================================================================

FORCE_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --status)
            show_status_only
            exit 0
            ;;
        --force)
            FORCE_MODE=true
            shift
            ;;
        *)
            error "Option inconnue: $1"
            echo "Utilisez -h pour l'aide"
            exit 1
            ;;
    esac
done

# Modifier la fonction confirm_rollback si mode force
if [ "$FORCE_MODE" = true ]; then
    confirm_rollback() {
        local backup_version=$(cat "$VERSION_FILE.backup")
        warning "Mode forcé activé - rollback automatique vers: $backup_version"
    }
fi

# ============================================================================
# POINT D'ENTRÉE
# ============================================================================

# Vérifier que le script est exécuté depuis le bon répertoire
if [ ! -f "$(dirname "$0")/docker-compose.yaml" ]; then
    error "Ce script doit être exécuté depuis le répertoire contenant docker-compose.yaml"
    exit 1
fi

# Exécuter la fonction principale
main "$@"