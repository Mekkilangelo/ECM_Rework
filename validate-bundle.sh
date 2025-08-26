#!/bin/bash
# validate-bundle.sh - Script de validation du bundle Synergia
# Usage: ./validate-bundle.sh [bundle.tar.gz]

set -e

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Variables
BUNDLE_FILE="${1:-}"
TEMP_DIR=""
EXIT_CODE=0

# Nettoyage automatique
cleanup() {
    if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
}
trap cleanup EXIT

# Fonction principale
main() {
    echo ""
    echo "🔍 Validation du bundle Synergia"
    echo "================================"
    echo ""
    
    # Détection automatique du bundle si non spécifié
    if [ -z "$BUNDLE_FILE" ]; then
        info "Recherche automatique du bundle..."
        BUNDLE_FILE=$(find . -name "synergia-release-v*.tar.gz" | head -1)
        
        if [ -z "$BUNDLE_FILE" ]; then
            error "Aucun bundle trouvé"
            echo "Usage: $0 [bundle.tar.gz]"
            exit 1
        fi
        
        info "Bundle détecté: $BUNDLE_FILE"
    fi
    
    # Vérifications
    check_bundle_exists
    check_bundle_integrity
    extract_and_validate
    validate_required_files
    validate_docker_images
    validate_scripts
    validate_checksums
    
    # Résumé
    echo ""
    if [ $EXIT_CODE -eq 0 ]; then
        echo "================================"
        success "BUNDLE VALIDÉ AVEC SUCCÈS"
        echo "================================"
        echo ""
        info "Le bundle est prêt pour le déploiement"
        echo "Prochaines étapes:"
        echo "  1. Extraire: tar -xzf $BUNDLE_FILE"
        echo "  2. Configurer: cp .env.example .env && nano .env"
        echo "  3. Déployer: ./deploy.sh"
    else
        echo "================================"
        error "VALIDATION ÉCHOUÉE"
        echo "================================"
        echo ""
        warning "Corrigez les erreurs avant le déploiement"
    fi
}

check_bundle_exists() {
    info "Vérification de l'existence du bundle..."
    
    if [ ! -f "$BUNDLE_FILE" ]; then
        error "Bundle non trouvé: $BUNDLE_FILE"
        exit 1
    fi
    
    local size=$(du -h "$BUNDLE_FILE" | cut -f1)
    success "Bundle trouvé ($size)"
}

check_bundle_integrity() {
    info "Vérification de l'intégrité de l'archive..."
    
    if tar -tzf "$BUNDLE_FILE" >/dev/null 2>&1; then
        success "Archive valide"
    else
        error "Archive corrompue ou invalide"
        EXIT_CODE=1
        return 1
    fi
}

extract_and_validate() {
    info "Extraction temporaire du bundle..."
    
    TEMP_DIR=$(mktemp -d)
    
    if tar -xzf "$BUNDLE_FILE" -C "$TEMP_DIR"; then
        success "Bundle extrait dans $TEMP_DIR"
    else
        error "Impossible d'extraire le bundle"
        EXIT_CODE=1
        return 1
    fi
}

validate_required_files() {
    info "Vérification des fichiers requis..."
    
    local required_files=(
        "docker-compose.yaml"
        ".env.example"
        "deploy.sh"
        "rollback.sh"
        "images/frontend.tar"
        "images/backend.tar"
        "release-notes.txt"
        "checksums.txt"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ -f "$TEMP_DIR/$file" ]; then
            success "Fichier présent: $file"
        else
            error "Fichier manquant: $file"
            missing_files+=("$file")
            EXIT_CODE=1
        fi
    done
    
    # Vérification des permissions des scripts
    local scripts=("deploy.sh" "rollback.sh")
    for script in "${scripts[@]}"; do
        if [ -f "$TEMP_DIR/$script" ]; then
            if [ -x "$TEMP_DIR/$script" ]; then
                success "Script exécutable: $script"
            else
                warning "Script non exécutable: $script (sera corrigé automatiquement)"
            fi
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        success "Tous les fichiers requis sont présents"
    else
        error "${#missing_files[@]} fichier(s) manquant(s)"
    fi
}

validate_docker_images() {
    info "Validation des images Docker..."
    
    local images=("frontend.tar" "backend.tar")
    
    for image in "${images[@]}"; do
        local image_path="$TEMP_DIR/images/$image"
        
        if [ -f "$image_path" ]; then
            # Vérifier que c'est bien une archive tar valide
            if tar -tf "$image_path" >/dev/null 2>&1; then
                success "Image Docker valide: $image"
                
                # Taille de l'image
                local size=$(du -h "$image_path" | cut -f1)
                info "  Taille: $size"
                
                # Essayer d'extraire des métadonnées basiques
                local manifest_count=$(tar -tf "$image_path" | grep -c "manifest.json" || echo "0")
                if [ "$manifest_count" -gt 0 ]; then
                    success "  Métadonnées Docker présentes"
                else
                    warning "  Format Docker non standard détecté"
                fi
            else
                error "Image Docker corrompue: $image"
                EXIT_CODE=1
            fi
        else
            error "Image Docker manquante: $image"
            EXIT_CODE=1
        fi
    done
}

validate_scripts() {
    info "Validation des scripts..."
    
    # Validation du script de déploiement
    if [ -f "$TEMP_DIR/deploy.sh" ]; then
        # Vérifier la syntaxe bash
        if bash -n "$TEMP_DIR/deploy.sh" 2>/dev/null; then
            success "Script deploy.sh: syntaxe valide"
        else
            error "Script deploy.sh: erreur de syntaxe"
            EXIT_CODE=1
        fi
        
        # Vérifier les commandes essentielles
        local required_commands=("docker" "docker compose")
        local script_content=$(cat "$TEMP_DIR/deploy.sh")
        
        for cmd in "${required_commands[@]}"; do
            if echo "$script_content" | grep -q "$cmd"; then
                success "Script deploy.sh utilise: $cmd"
            else
                warning "Script deploy.sh: commande '$cmd' non trouvée"
            fi
        done
    fi
    
    # Validation du script de rollback
    if [ -f "$TEMP_DIR/rollback.sh" ]; then
        if bash -n "$TEMP_DIR/rollback.sh" 2>/dev/null; then
            success "Script rollback.sh: syntaxe valide"
        else
            error "Script rollback.sh: erreur de syntaxe"
            EXIT_CODE=1
        fi
    fi
}

validate_checksums() {
    info "Validation des checksums..."
    
    if [ ! -f "$TEMP_DIR/checksums.txt" ]; then
        error "Fichier checksums.txt manquant"
        EXIT_CODE=1
        return 1
    fi
    
    cd "$TEMP_DIR"
    
    # Vérifier les checksums
    local checksum_errors=0
    while IFS= read -r line; do
        if [ -n "$line" ] && [ ! "$line" = "${line#\#}" ]; then
            # Ignorer les commentaires
            continue
        fi
        
        if [ -n "$line" ]; then
            local expected_hash=$(echo "$line" | cut -d' ' -f1)
            local file_path=$(echo "$line" | cut -d' ' -f3-)
            
            if [ -f "$file_path" ]; then
                local actual_hash=$(sha256sum "$file_path" | cut -d' ' -f1)
                if [ "$expected_hash" = "$actual_hash" ]; then
                    success "Checksum OK: $file_path"
                else
                    error "Checksum ERREUR: $file_path"
                    ((checksum_errors++))
                fi
            else
                warning "Fichier de checksum inexistant: $file_path"
                ((checksum_errors++))
            fi
        fi
    done < checksums.txt
    
    if [ $checksum_errors -eq 0 ]; then
        success "Tous les checksums sont valides"
    else
        error "$checksum_errors erreur(s) de checksum détectée(s)"
        EXIT_CODE=1
    fi
    
    cd - >/dev/null
}

validate_configuration() {
    info "Validation de la configuration..."
    
    # Vérifier docker-compose.yaml
    if [ -f "$TEMP_DIR/docker-compose.yaml" ]; then
        # Test de syntaxe YAML basique
        if command -v python3 >/dev/null 2>&1; then
            if python3 -c "import yaml; yaml.safe_load(open('$TEMP_DIR/docker-compose.yaml'))" 2>/dev/null; then
                success "docker-compose.yaml: syntaxe YAML valide"
            else
                error "docker-compose.yaml: syntaxe YAML invalide"
                EXIT_CODE=1
            fi
        else
            warning "Python3 non disponible, validation YAML ignorée"
        fi
        
        # Vérifier la présence des services essentiels
        local compose_content=$(cat "$TEMP_DIR/docker-compose.yaml")
        local required_services=("database" "backend" "frontend")
        
        for service in "${required_services[@]}"; do
            if echo "$compose_content" | grep -q "$service:"; then
                success "Service présent dans compose: $service"
            else
                warning "Service manquant dans compose: $service"
            fi
        done
    fi
    
    # Vérifier .env.example
    if [ -f "$TEMP_DIR/.env.example" ]; then
        local env_content=$(cat "$TEMP_DIR/.env.example")
        local required_vars=("MYSQL_ROOT_PASSWORD" "JWT_SECRET" "DB_PASSWORD")
        
        for var in "${required_vars[@]}"; do
            if echo "$env_content" | grep -q "^$var="; then
                success "Variable d'environnement: $var"
                
                # Vérifier si c'est une valeur placeholder
                if echo "$env_content" | grep "$var=" | grep -q "CHANGEME"; then
                    success "  → Placeholder CHANGEME présent (bon)"
                fi
            else
                warning "Variable d'environnement manquante: $var"
            fi
        done
    fi
}

show_bundle_info() {
    info "Informations sur le bundle..."
    
    if [ -f "$TEMP_DIR/release-notes.txt" ]; then
        echo ""
        echo "--- RELEASE NOTES ---"
        head -10 "$TEMP_DIR/release-notes.txt"
        echo ""
    fi
    
    # Statistiques
    local total_files=$(find "$TEMP_DIR" -type f | wc -l)
    local total_size=$(du -sh "$TEMP_DIR" | cut -f1)
    
    info "Statistiques:"
    echo "  Fichiers total: $total_files"
    echo "  Taille extraite: $total_size"
    
    # Images Docker
    if [ -d "$TEMP_DIR/images" ]; then
        echo "  Images Docker:"
        for img in "$TEMP_DIR/images"/*.tar; do
            if [ -f "$img" ]; then
                local img_name=$(basename "$img")
                local img_size=$(du -h "$img" | cut -f1)
                echo "    - $img_name ($img_size)"
            fi
        done
    fi
}

# Fonction d'aide
show_help() {
    echo "Usage: $0 [OPTIONS] [BUNDLE_FILE]"
    echo ""
    echo "Valide l'intégrité et la complétude d'un bundle de déploiement Synergia"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help     Afficher cette aide"
    echo "  -v, --verbose  Mode verbeux"
    echo "  --info         Afficher les informations du bundle"
    echo ""
    echo "EXEMPLES:"
    echo "  $0                           # Auto-détection du bundle"
    echo "  $0 synergia-release-v1.0.tar.gz"
    echo "  $0 --info bundle.tar.gz      # Infos seulement"
}

# Gestion des arguments
VERBOSE=false
INFO_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --info)
            INFO_ONLY=true
            shift
            ;;
        -*)
            error "Option inconnue: $1"
            show_help
            exit 1
            ;;
        *)
            if [ -z "$BUNDLE_FILE" ]; then
                BUNDLE_FILE="$1"
            fi
            shift
            ;;
    esac
done

# Modifier le comportement selon les options
if [ "$INFO_ONLY" = true ]; then
    main() {
        check_bundle_exists
        extract_and_validate
        show_bundle_info
    }
fi

# Point d'entrée
main "$@"