#!/bin/bash
# deploy.sh - Script de déploiement Synergia côté client (avec MySQL)

set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_FILE="$SCRIPT_DIR/.deployed_version"
BACKUP_DIR="$SCRIPT_DIR/backups"
LOG_FILE="$SCRIPT_DIR/deploy.log"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

check_prerequisites() {
    info "Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
        error "Docker Compose n'est pas installé ou accessible"
        exit 1
    fi
    
    # Vérifier les fichiers requis (avec MySQL et Nginx)
    local required_files=("docker-compose.yaml" "images/frontend.tar" "images/backend.tar" "images/mysql.tar" "images/nginx.tar")
    for file in "${required_files[@]}"; do
        if [ ! -f "$SCRIPT_DIR/$file" ]; then
            error "Fichier requis manquant: $file"
            exit 1
        fi
    done
    
    success "Prérequis validés"
}

check_env_file() {
    info "Vérification du fichier .env..."
    
    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        if [ -f "$SCRIPT_DIR/.env.example" ]; then
            warning "Fichier .env manquant, copie depuis .env.example"
            cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
            
            echo ""
            warning "IMPORTANT: Vous devez éditer le fichier .env avec vos vraies valeurs!"
            echo "Voici les variables à modifier obligatoirement:"
            echo ""
            grep "CHANGEME" "$SCRIPT_DIR/.env" || true
            echo ""
            
            read -p "Appuyez sur Entrée une fois l'édition de .env terminée..."
        else
            error "Ni .env ni .env.example trouvé"
            exit 1
        fi
    fi
    
    if grep -q "CHANGEME" "$SCRIPT_DIR/.env"; then
        warning "Des valeurs CHANGEME sont encore présentes dans .env"
        echo "Valeurs à modifier:"
        grep "CHANGEME" "$SCRIPT_DIR/.env"
        echo ""
        read -p "Continuer quand même? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    success "Fichier .env validé"
}

backup_current_version() {
    info "Sauvegarde de la version actuelle..."
    
    mkdir -p "$BACKUP_DIR"
    
    if docker compose ps -q | grep -q .; then
        local current_version=""
        if [ -f "$VERSION_FILE" ]; then
            current_version=$(cat "$VERSION_FILE" 2>/dev/null || echo "unknown")
        else
            current_version=$(docker ps --format "table {{.Image}}" | grep synergia | head -1 | cut -d: -f2 2>/dev/null || echo "unknown")
        fi
        
        log "Version actuellement déployée: $current_version"
        echo "$current_version" > "$VERSION_FILE.backup"
        
        if docker images | grep -q synergia; then
            log "Export des images actuelles pour rollback..."
            mkdir -p "$BACKUP_DIR/$current_version"
            
            docker save $(docker images --format "{{.Repository}}:{{.Tag}}" | grep synergia | tr '\n' ' ') \
                -o "$BACKUP_DIR/$current_version/images-backup.tar" 2>/dev/null || \
                warning "Impossible d'exporter les images actuelles (non bloquant)"
        fi
        
        success "Sauvegarde effectuée"
    else
        info "Aucun service en cours d'exécution, pas de sauvegarde nécessaire"
    fi
}

load_docker_images() {
    info "Chargement des nouvelles images Docker..."
    
    # Chargement MySQL (en premier car c'est la base de données)
    if [ -f "$SCRIPT_DIR/images/mysql.tar" ]; then
        log "Chargement de l'image MySQL..."
        if docker load < "$SCRIPT_DIR/images/mysql.tar"; then
            success "Image MySQL chargée"
        else
            error "Échec du chargement de l'image MySQL"
            exit 1
        fi
    else
        error "Image mysql.tar non trouvée"
        exit 1
    fi
    
    # Chargement backend
    if [ -f "$SCRIPT_DIR/images/backend.tar" ]; then
        log "Chargement de l'image backend..."
        if docker load < "$SCRIPT_DIR/images/backend.tar"; then
            success "Image backend chargée"
        else
            error "Échec du chargement de l'image backend"
            exit 1
        fi
    else
        error "Image backend.tar non trouvée"
        exit 1
    fi
    
    # Chargement frontend
    if [ -f "$SCRIPT_DIR/images/frontend.tar" ]; then
        log "Chargement de l'image frontend..."
        if docker load < "$SCRIPT_DIR/images/frontend.tar"; then
            success "Image frontend chargée"
        else
            error "Échec du chargement de l'image frontend"
            exit 1
        fi
    else
        error "Image frontend.tar non trouvée"
        exit 1
    fi
    
    # Chargement nginx
    if [ -f "$SCRIPT_DIR/images/nginx.tar" ]; then
        log "Chargement de l'image Nginx..."
        if docker load < "$SCRIPT_DIR/images/nginx.tar"; then
            success "Image Nginx chargée"
        else
            error "Échec du chargement de l'image Nginx"
            exit 1
        fi
    else
        error "Image nginx.tar non trouvée"
        exit 1
    fi
    
    # Afficher les images chargées
    info "Images Docker disponibles:"
    docker images | grep -E "(synergia|mysql|nginx)" | head -10
}

prepare_nginx() {
    info "Préparation de Nginx et SSL..."
    
    # Créer les dossiers nginx s'ils n'existent pas
    mkdir -p "$SCRIPT_DIR/nginx/conf" "$SCRIPT_DIR/nginx/ssl" "$SCRIPT_DIR/nginx/logs"
    
    # Vérifier si le fichier de configuration nginx existe, sinon le créer
    if [ ! -f "$SCRIPT_DIR/nginx/conf/default.conf" ]; then
        log "Création du fichier de configuration Nginx..."
        cat > "$SCRIPT_DIR/nginx/conf/default.conf" << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Rediriger HTTP vers HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name _;

    # Configuration SSL
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;

    # Frontend - React App
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://backend:5001/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
}
EOF
        success "Fichier de configuration Nginx créé"
    fi

    # Générer des certificats SSL auto-signés s'ils n'existent pas
    if [ ! -f "$SCRIPT_DIR/nginx/ssl/cert.pem" ] || [ ! -f "$SCRIPT_DIR/nginx/ssl/key.pem" ]; then
        log "Génération des certificats SSL auto-signés..."
        # Détection de l'IP du serveur
        SERVER_IP=$(hostname -I | awk '{print $1}' | tr -d ' ')
        
        openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
            -keyout "$SCRIPT_DIR/nginx/ssl/key.pem" \
            -out "$SCRIPT_DIR/nginx/ssl/cert.pem" \
            -subj "/CN=$SERVER_IP" \
            -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:$SERVER_IP"
        
        # Correction des permissions
        chmod 600 "$SCRIPT_DIR/nginx/ssl/key.pem"
        chmod 644 "$SCRIPT_DIR/nginx/ssl/cert.pem"
        success "Certificats SSL auto-signés générés"
    fi
}

deploy_services() {
    info "Déploiement des services..."
    
    cd "$SCRIPT_DIR"
    
    # Préparation de Nginx
    prepare_nginx
    
    log "Arrêt des services existants..."
    if docker compose down; then
        success "Services arrêtés"
    else
        warning "Erreur lors de l'arrêt des services (non bloquant)"
    fi
    
    log "Nettoyage des ressources Docker inutilisées..."
    docker system prune -f --volumes || warning "Nettoyage partiel"
    
    log "Démarrage des nouveaux services..."
    if docker compose up -d; then
        success "Services démarrés"
    else
        error "Échec du démarrage des services"
        
        echo ""
        error "Diagnostic - Logs des services:"
        docker compose logs --tail=20
        
        exit 1
    fi
}

wait_and_verify() {
    info "Attente et vérification du démarrage des services..."
    
    local max_attempts=15  # Augmenté car MySQL peut prendre du temps
    local attempt=1
    
    sleep 15  # Attente initiale plus longue
    
    while [ $attempt -le $max_attempts ]; do
        log "Tentative $attempt/$max_attempts - Vérification de l'état des services..."
        
        local running_containers=$(docker compose ps -q | wc -l)
        local healthy_containers=$(docker compose ps | grep -E "(Up|running)" | wc -l)
        
        # Vérification spécifique de MySQL
        local mysql_ready=false
        if docker compose exec -T database mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT 1" 2>/dev/null >/dev/null; then
            mysql_ready=true
        fi
        
        if [ "$running_containers" -gt 0 ] && [ "$healthy_containers" -eq "$running_containers" ] && [ "$mysql_ready" = true ]; then
            success "Tous les services sont opérationnels"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error "Timeout: Les services ne démarrent pas correctement"
            docker compose ps
            docker compose logs --tail=50
            exit 1
        fi
        
        log "Services pas encore prêts, attente de 15 secondes..."
        sleep 15
        ((attempt++))
    done
}

main() {
    echo ""
    echo "🚀 Déploiement Synergia"
    echo "======================="
    echo ""
    
    exec > >(tee -a "$LOG_FILE") 2>&1
    
    log "=== DÉBUT DU DÉPLOIEMENT ==="
    
    check_prerequisites
    check_env_file
    backup_current_version
    load_docker_images
    deploy_services
    wait_and_verify
    
    local new_version="deployed-$(date +%Y%m%d-%H%M%S)"
    echo "$new_version" > "$VERSION_FILE"
    
    echo ""
    echo "================================="
    success "DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!"
    echo "================================="
    echo ""
    
    info "État des services:"
    docker compose ps
    echo ""
    
    info "Informations d'accès:"
    echo "  🌐 Frontend & API: https://$(hostname -I | awk '{print $1}' | tr -d ' ')"
    echo "  🔐 Note: Le certificat SSL est auto-signé, vous devrez peut-être l'accepter dans votre navigateur"
    echo "  📊 Status:   docker compose ps"
    echo "  📋 Logs:     docker compose logs"
    echo ""
    
    info "Fichiers importants:"
    echo "  📁 Logs de déploiement: $LOG_FILE"
    echo "  📄 Rollback disponible: ./rollback.sh"
    echo ""
    
    log "=== FIN DU DÉPLOIEMENT ==="
}

# Nettoyage en cas d'interruption
cleanup() {
    log "Nettoyage en cas d'interruption..."
    exit 130
}

trap cleanup SIGINT SIGTERM

# Vérifier que le script est exécuté depuis le bon répertoire
if [ ! -f "$(dirname "$0")/docker-compose.yaml" ]; then
    error "Ce script doit être exécuté depuis le répertoire contenant docker-compose.yaml"
    exit 1
fi

main "$@"