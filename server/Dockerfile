FROM node:18-alpine

WORKDIR /app

# Installer netcat pour tester la connexion MySQL
RUN apk add --no-cache netcat-openbsd

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5001

# Script pour attendre que la base de données soit prête
RUN echo '#!/bin/sh' > wait-for-db.sh && \
    echo 'echo "Waiting for database to be ready..."' >> wait-for-db.sh && \
    echo 'while ! nc -z database 3306; do' >> wait-for-db.sh && \
    echo '  echo "Database not ready yet, waiting..."' >> wait-for-db.sh && \
    echo '  sleep 2' >> wait-for-db.sh && \
    echo 'done' >> wait-for-db.sh && \
    echo 'echo "Database is ready!"' >> wait-for-db.sh && \
    echo 'exec node server.js' >> wait-for-db.sh && \
    chmod +x wait-for-db.sh

CMD ["./wait-for-db.sh"]
