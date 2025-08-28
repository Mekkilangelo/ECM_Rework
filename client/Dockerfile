FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build React avec .env déjà présent
RUN npm run build

# Vérification que la variable est bien présente dans le build final
RUN grep -r "$(grep REACT_APP_API_URL .env | cut -d'=' -f2-)" build/ || (echo "REACT_APP_API_URL ABSENTE DU BUILD" && exit 1)

FROM node:20-alpine AS production
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
