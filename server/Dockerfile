FROM node:20-alpine

WORKDIR /app

# Installer netcat pour tester la connexion MySQL
RUN apk add --no-cache netcat-openbsd

COPY package*.json ./

# Pour le développement et les tests, installer toutes les dépendances
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN if [ "$NODE_ENV" = "production" ]; then \
        npm ci --only=production; \
    else \
        npm ci; \
    fi

COPY . .

# Créer les dossiers uploads et logs avec les bonnes permissions
# Le conteneur Node tourne avec l'utilisateur node (uid 1000)
RUN mkdir -p /app/uploads /app/uploads/temp /app/logs && \
    chown -R node:node /app/uploads /app/logs && \
    chmod -R 755 /app/uploads /app/logs

# Passer à l'utilisateur node pour plus de sécurité
USER node

EXPOSE 5001

CMD ["node", "server.js"]
