# Makefile pour Synergia - Gestion des builds et releases
.PHONY: help dev-build dev-start dev-stop dev-restart dev-logs dev-test release-build release-bundle clean validate

# Variables
VERSION ?= $(shell grep '"version"' ./client/package.json | sed 's/.*"version": "\([^"]*\)".*/\1/' 2>/dev/null || echo "1.0.$(shell date +%Y%m%d%H%M)")
RELEASE_DIR = ./release-build
ARCHIVE_NAME = synergia-release-v$(VERSION).tar.gz

help: ## Afficher cette aide
	@echo "Makefile pour Synergia"
	@echo "======================"
	@echo ""
	@echo "Commandes de développement:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '^(dev-|test-|clean)' | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Commandes de release:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '^release-' | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Autres:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -vE '^(dev-|test-|release-|clean)' | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# === COMMANDES DE DÉVELOPPEMENT ===

dev-build: ## Build les images en mode développement
	@echo "🔨 Build des images de développement..."
	docker compose --env-file .env.dev -f docker-compose.dev.yml build
	@echo "✅ Images de développement construites"

dev-start: ## Démarrer l'environnement de développement
	@echo "🚀 Démarrage de l'environnement de développement..."
	docker compose --env-file .env.dev -f docker-compose.dev.yml up -d
	@echo "⏳ Attente du démarrage des services..."
	@sleep 10
	@echo "✅ Environnement de développement démarré"
	@echo ""
	@echo "📱 URLs d'accès:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:5001"
	@echo "  API:      http://localhost:5001/api"

dev-stop: ## Arrêter l'environnement de développement
	@echo "🛑 Arrêt de l'environnement de développement..."
	docker compose --env-file .env.dev -f docker-compose.dev.yml down
	@echo "✅ Environnement arrêté"

dev-restart: dev-stop dev-start ## Redémarrer l'environnement de développement

dev-logs: ## Afficher les logs de développement
	docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f

dev-test: ## Exécuter les tests
	@echo "🧪 Exécution des tests..."
	docker compose --env-file .env.dev -f docker-compose.dev.yml exec -T backend npm run test:unit
	docker compose --env-file .env.dev -f docker-compose.dev.yml exec -T backend npm run test:integration
	@echo "✅ Tests terminés"

# === COMMANDES DE RELEASE ===

release-build: ## Build les images de production
	@echo "🔨 Build des images de production..."
	@echo "Version: $(VERSION)"
	
	# Build frontend
	docker buildx build \
		--load \
		--tag synergia-frontend:$(VERSION) \
		--tag synergia-frontend:latest \
		./client
	
	# Build backend
	docker buildx build \
		--load \
		--tag synergia-backend:$(VERSION) \
		--tag synergia-backend:latest \
		./server
	
	@echo "✅ Images de production construites"

release-bundle: release-build ## Générer le bundle de release complet
	@echo "📦 Génération du bundle de release v$(VERSION)..."
	
	# Nettoyer et créer le répertoire de release
	rm -rf $(RELEASE_DIR)
	mkdir -p $(RELEASE_DIR)/images
	
	# Pull de MySQL si pas déjà présent
	@echo "📥 Récupération de MySQL 8.0..."
	docker pull mysql:8.0
	
	# Export des images Docker
	@echo "💾 Export des images Docker..."
	docker save synergia-frontend:$(VERSION) -o $(RELEASE_DIR)/images/frontend.tar
	docker save synergia-backend:$(VERSION) -o $(RELEASE_DIR)/images/backend.tar
	docker save mysql:8.0 -o $(RELEASE_DIR)/images/mysql.tar
	
	# Copie des fichiers de configuration
	@echo "📋 Copie des fichiers de configuration..."
	cp docker-compose.prod.yml $(RELEASE_DIR)/docker-compose.yaml
	cp .env.prod $(RELEASE_DIR)/.env.example
	
	# Nettoyer .env.example - remplacer les vraies valeurs
	sed -i.bak 's/MYSQL_ROOT_PASSWORD=.*/MYSQL_ROOT_PASSWORD=CHANGEME_STRONG_PASSWORD/' $(RELEASE_DIR)/.env.example
	sed -i.bak 's/DB_PASSWORD=.*/DB_PASSWORD=CHANGEME_STRONG_PASSWORD/' $(RELEASE_DIR)/.env.example
	sed -i.bak 's/JWT_SECRET=.*/JWT_SECRET=CHANGEME_VERY_STRONG_SECRET_KEY/' $(RELEASE_DIR)/.env.example
	rm $(RELEASE_DIR)/.env.example.bak 2>/dev/null || true
	
	# Copie des scripts
	@echo "📜 Copie des scripts..."
	cp deploy.sh $(RELEASE_DIR)/
	cp rollback.sh $(RELEASE_DIR)/
	cp validate-bundle.sh $(RELEASE_DIR)/
	chmod +x $(RELEASE_DIR)/*.sh
	
	# Génération des release notes
	@echo "📝 Génération des release notes..."
	@echo "Synergia Release v$(VERSION)" > $(RELEASE_DIR)/release-notes.txt
	@echo "==========================" >> $(RELEASE_DIR)/release-notes.txt
	@echo "" >> $(RELEASE_DIR)/release-notes.txt
	@echo "Date de build: $$(date '+%Y-%m-%d %H:%M:%S')" >> $(RELEASE_DIR)/release-notes.txt
	@echo "Commit: $$(git rev-parse HEAD 2>/dev/null || echo 'N/A')" >> $(RELEASE_DIR)/release-notes.txt
	@echo "Branch: $$(git branch --show-current 2>/dev/null || echo 'N/A')" >> $(RELEASE_DIR)/release-notes.txt
	@echo "" >> $(RELEASE_DIR)/release-notes.txt
	@echo "## Contenu de cette release" >> $(RELEASE_DIR)/release-notes.txt
	@echo "" >> $(RELEASE_DIR)/release-notes.txt
	@echo "- Frontend image: synergia-frontend:$(VERSION)" >> $(RELEASE_DIR)/release-notes.txt
	@echo "- Backend image: synergia-backend:$(VERSION)" >> $(RELEASE_DIR)/release-notes.txt
	@echo "- Configuration: docker-compose.yaml + .env.example" >> $(RELEASE_DIR)/release-notes.txt
	@echo "- Scripts: deploy.sh, rollback.sh, validate-bundle.sh" >> $(RELEASE_DIR)/release-notes.txt
	@echo "" >> $(RELEASE_DIR)/release-notes.txt
	@echo "## Instructions de déploiement" >> $(RELEASE_DIR)/release-notes.txt
	@echo "" >> $(RELEASE_DIR)/release-notes.txt
	@echo "1. Validation: ./validate-bundle.sh" >> $(RELEASE_DIR)/release-notes.txt
	@echo "2. Configuration: cp .env.example .env && nano .env" >> $(RELEASE_DIR)/release-notes.txt
	@echo "3. Déploiement: ./deploy.sh" >> $(RELEASE_DIR)/release-notes.txt
	@echo "" >> $(RELEASE_DIR)/release-notes.txt
	@echo "## Rollback" >> $(RELEASE_DIR)/release-notes.txt
	@echo "" >> $(RELEASE_DIR)/release-notes.txt
	@echo "En cas de problème: ./rollback.sh" >> $(RELEASE_DIR)/release-notes.txt
	
	# Génération des checksums
	@echo "🔐 Génération des checksums..."
	cd $(RELEASE_DIR) && find . -type f -not -name "checksums.txt" -exec sha256sum {} \; | sort > checksums.txt
	
	# Création de l'archive
	@echo "🗜️  Création de l'archive..."
	tar -czf $(ARCHIVE_NAME) -C $(RELEASE_DIR) .
	
	# Informations finales
	@echo ""
	@echo "✅ Bundle de release généré avec succès!"
	@echo "📦 Archive: $(ARCHIVE_NAME)"
	@echo "📏 Taille: $$(du -h $(ARCHIVE_NAME) | cut -f1)"
	@echo ""
	@echo "📋 Contenu du bundle:"
	@tar -tzf $(ARCHIVE_NAME) | head -10
	@echo "   ..."

validate: ## Valider un bundle existant
	@echo "🔍 Validation du bundle..."
	@if [ -f "$(ARCHIVE_NAME)" ]; then \
		./validate-bundle.sh $(ARCHIVE_NAME); \
	else \
		echo "❌ Archive $(ARCHIVE_NAME) non trouvée"; \
		echo "Exécutez 'make release-bundle' pour la créer"; \
		exit 1; \
	fi

# === UTILITAIRES ===

clean: ## Nettoyer les fichiers temporaires et containers
	@echo "🧹 Nettoyage..."
	# Arrêter les containers de dev
	-docker compose --env-file .env.dev -f docker-compose.dev.yml down 2>/dev/null
	# Nettoyer les ressources Docker inutilisées
	docker system prune -f
	# Supprimer les répertoires temporaires
	rm -rf $(RELEASE_DIR)
	rm -f synergia-release-v*.tar.gz
	@echo "✅ Nettoyage terminé"

status: ## Afficher le statut des services
	@echo "📊 Statut des services de développement:"
	@docker compose --env-file .env.dev -f docker-compose.dev.yml ps || echo "Aucun service en cours"

# Aliases pratiques
build: dev-build ## Alias pour dev-build
start: dev-start ## Alias pour dev-start
stop: dev-stop ## Alias pour dev-stop
restart: dev-restart ## Alias pour dev-restart
logs: dev-logs ## Alias pour dev-logs
test: dev-test ## Alias pour dev-test
bundle: release-bundle ## Alias pour release-bundle