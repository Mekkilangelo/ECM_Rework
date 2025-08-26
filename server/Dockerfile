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

EXPOSE 5001

CMD ["node", "server.js"]
