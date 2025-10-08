FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le code source
COPY . .

# Exposer le port du serveur de dev Vite
EXPOSE 8080

# Démarrer Vite en mode développement
CMD ["npm", "run", "dev"]
